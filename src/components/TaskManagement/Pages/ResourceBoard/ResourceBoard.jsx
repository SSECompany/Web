import { TeamOutlined, ThunderboltOutlined, WarningOutlined } from "@ant-design/icons";
import {
  Avatar,
  Badge,
  Card,
  Col,
  Empty,
  Progress,
  Row,
  Segmented,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import dayjs from "dayjs";
import { useMemo, useState, useEffect } from "react";
import {
  calculateWorkloadScore,
  calculateUserKPI,
  suggestRedistribution,
  calculateTeamMetrics,
  filterResources,
  sortResources,
  exportToCSV,
} from "./utils/resourceLogic";
import { apiGetTasks } from "../../API";
import { useSelector } from "react-redux";
import { Button as AntButton, message } from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import "./ResourceBoard.css";

const { Title, Text } = Typography;
const { Option } = Select;

const PRIORITY_WEIGHT = {
  URGENT: 5,
  HIGH: 4,
  MEDIUM: 3,
  NORMAL: 2,
  LOW: 1,
};

const STATUS_COLOR = {
  PENDING: "default",
  IN_PROGRESS: "processing",
  REVIEW: "success",
  COMPLETED: "blue",
  CANCELLED: "error",
};

const aggregateResource = (tasks) => {
  const memberMap = {};

  tasks.forEach((task) => {
    const member = task.assignedToName || "Chưa phân công";
    if (!memberMap[member]) {
      memberMap[member] = {
        key: member,
        member,
        department: task.departmentName || "N/A",
        projects: new Set(),
        tasks: [],
      };
    }

    memberMap[member].projects.add(task.projectName || task.projectId);
    memberMap[member].tasks.push(task);
  });

  return Object.values(memberMap).map((entry) => {
    const totalTasks = entry.tasks.length;
    
    // Use advanced workload calculation
    const workloadData = calculateWorkloadScore(entry.tasks);
    
    // Calculate KPI
    const kpi = calculateUserKPI(entry.tasks);
    
    const statusBreakdown = entry.tasks.reduce(
      (acc, task) => {
        acc[task.status] = (acc[task.status] || 0) + 1;
        return acc;
      },
      {}
    );

    // Calculate detailed status counts like FastWork
    const today = dayjs();
    const notStarted = entry.tasks.filter((task) => task.status === "PENDING").length;
    const inProgress = entry.tasks.filter((task) => task.status === "IN_PROGRESS").length;
    const completed = entry.tasks.filter((task) => task.status === "COMPLETED" || task.status === "REVIEW").length;
    const todayTasks = entry.tasks.filter((task) => {
      if (!task.dueDate) return false;
      const dueDate = dayjs(task.dueDate);
      return dueDate.isSame(today, "day");
    }).length;
    const paused = entry.tasks.filter((task) => task.status === "CANCELLED").length;

    return {
      ...entry,
      projects: Array.from(entry.projects),
      totalTasks,
      workloadHours: workloadData.totalHours,
      overdueTasks: workloadData.overdueCount,
      criticalTasks: workloadData.highPriorityCount,
      progressAverage: kpi.averageProgress,
      points: kpi.points,
      statusBreakdown,
      notStarted,
      inProgress,
      completed,
      todayTasks,
      paused,
      workloadScore: workloadData.workloadScore,
      kpi,
      isOverloaded: workloadData.workloadHours > 32 || totalTasks > 6 || workloadData.overdueCount > 1,
    };
  });
};

const buildSummary = (resources) => {
  const totalMembers = resources.length;
  const totalTasks = resources.reduce((sum, member) => sum + member.totalTasks, 0);
  const totalPoints = resources.reduce((sum, member) => sum + member.points, 0);
  const overloadedMembers = resources.filter((member) => member.isOverloaded).length;
  const totalOverdue = resources.reduce((sum, member) => sum + member.overdueTasks, 0);
  const totalInProgress = resources.reduce((sum, member) => sum + member.inProgress, 0);
  const totalCompleted = resources.reduce((sum, member) => sum + member.completed, 0);

  return [
    {
      key: "resources",
      title: "Nhân sự đang theo dõi",
      value: totalMembers,
      color: "#1890ff",
      icon: <TeamOutlined />,
    },
    {
      key: "tasks",
      title: "Tổng công việc",
      value: totalTasks,
      subtitle: `${totalPoints} điểm`,
      color: "#52c41a",
      icon: <ThunderboltOutlined />,
    },
    {
      key: "inProgress",
      title: "Đang thực hiện",
      value: totalInProgress,
      color: "#1890ff",
      icon: <ThunderboltOutlined />,
    },
    {
      key: "completed",
      title: "Hoàn thành",
      value: totalCompleted,
      color: "#52c41a",
      icon: <ThunderboltOutlined />,
    },
    {
      key: "overloaded",
      title: "Đang quá tải",
      value: overloadedMembers,
      color: "#faad14",
      icon: <WarningOutlined />,
    },
    {
      key: "overdue",
      title: "Công việc trễ",
      value: totalOverdue,
      color: "#ff4d4f",
      icon: <WarningOutlined />,
    },
  ];
};

const ResourceBoard = () => {
  const { tasksList } = useSelector((state) => state.tasks);
  const tasks = useMemo(() => tasksList || [], [tasksList]);
  const projects = useMemo(() => {
    const projectSet = new Set();
    tasks.forEach((task) => {
      if (task.projectName) {
        projectSet.add(task.projectName);
      }
    });
    return Array.from(projectSet);
  }, [tasks]);
  const departments = useMemo(
    () => Array.from(new Set(tasks.map((task) => task.departmentName).filter(Boolean))),
    [tasks]
  );

  const [projectFilter, setProjectFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [viewMode, setViewMode] = useState("workload");
  const [sortBy, setSortBy] = useState("workload");
  const [sortOrder, setSortOrder] = useState("desc");
  const [redistributionSuggestions, setRedistributionSuggestions] = useState([]);
  const [teamMetrics, setTeamMetrics] = useState(null);

  const filteredTasks = useMemo(
    () =>
      tasks.filter((task) => {
        const matchProject = projectFilter === "all" || task.projectId === projectFilter;
        const matchDepartment =
          departmentFilter === "all" || task.departmentName === departmentFilter;
        return matchProject && matchDepartment;
      }),
    [tasks, projectFilter, departmentFilter]
  );

  const rawResources = useMemo(() => aggregateResource(filteredTasks), [filteredTasks]);
  
  // Apply filtering
  const filteredResources = useMemo(() => {
    const filters = {
      department: departmentFilter !== "all" ? departmentFilter : undefined,
    };
    return filterResources(rawResources, filters);
  }, [rawResources, departmentFilter]);

  // Apply sorting
  const resources = useMemo(() => {
    return sortResources(filteredResources, sortBy, sortOrder);
  }, [filteredResources, sortBy, sortOrder]);

  // Calculate team metrics
  useEffect(() => {
    const metrics = calculateTeamMetrics(resources);
    setTeamMetrics(metrics);
  }, [resources]);

  // Calculate redistribution suggestions
  useEffect(() => {
    const suggestions = suggestRedistribution(resources, 32);
    setRedistributionSuggestions(suggestions);
  }, [resources]);

  const summaryCards = useMemo(() => buildSummary(resources), [resources]);

  // Export to CSV
  const handleExport = () => {
    try {
      const csvContent = exportToCSV(resources, teamMetrics);
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `resource-board-${dayjs().format("YYYY-MM-DD")}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      message.success("Đã xuất file CSV thành công!");
    } catch (error) {
      console.error("Export error:", error);
      message.error("Không thể xuất file CSV");
    }
  };

  const columns = [
    {
      title: "Nhân sự",
      dataIndex: "member",
      key: "member",
      render: (_, record) => (
        <Space>
          <Avatar style={{ backgroundColor: "#1890ff" }}>
            {record.member
              .split(" ")
              .map((word) => word.charAt(0))
              .join("")
              .slice(0, 2)
              .toUpperCase()}
          </Avatar>
          <div>
            <div style={{ fontWeight: 600 }}>{record.member}</div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.department}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: "Dự án tham gia",
      dataIndex: "projects",
      key: "projects",
      width: 240,
      render: (projectsList) =>
        projectsList.length > 0 ? (
          <Space wrap size={[4, 4]}>
            {projectsList.slice(0, 4).map((project) => (
              <Tag color="blue" key={project}>
                {project}
              </Tag>
            ))}
            {projectsList.length > 4 && <Tag>+{projectsList.length - 4}</Tag>}
          </Space>
        ) : (
          <Text type="secondary">—</Text>
        ),
    },
    {
      title: "Tổng số công việc / Tổng điểm",
      key: "totalTasksPoints",
      width: 180,
      render: (_, record) => (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#1890ff" }}>
            {record.totalTasks}
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#52c41a", marginTop: 4 }}>
            {record.points} điểm
          </div>
          <Text type="secondary" style={{ fontSize: 11, display: "block", marginTop: 4 }}>
            {record.workloadHours}h ước tính
          </Text>
        </div>
      ),
    },
    {
      title: "Chưa bắt đầu",
      dataIndex: "notStarted",
      key: "notStarted",
      width: 100,
      render: (count) => (
        <div style={{ textAlign: "center" }}>
          <Badge count={count} showZero style={{ backgroundColor: "#d9d9d9" }} />
        </div>
      ),
    },
    {
      title: "Đang làm",
      dataIndex: "inProgress",
      key: "inProgress",
      width: 100,
      render: (count) => (
        <div style={{ textAlign: "center" }}>
          <Badge count={count} showZero style={{ backgroundColor: "#1890ff" }} />
        </div>
      ),
    },
    {
      title: "Quá hạn",
      dataIndex: "overdueTasks",
      key: "overdue",
      width: 100,
      render: (count) => (
        <div style={{ textAlign: "center" }}>
          <Badge count={count} showZero style={{ backgroundColor: "#ff4d4f" }} />
        </div>
      ),
    },
    {
      title: "Hoàn thành",
      dataIndex: "completed",
      key: "completed",
      width: 100,
      render: (count) => (
        <div style={{ textAlign: "center" }}>
          <Badge count={count} showZero style={{ backgroundColor: "#52c41a" }} />
        </div>
      ),
    },
    {
      title: "Tạm hoãn",
      dataIndex: "paused",
      key: "paused",
      width: 100,
      render: (count) => (
        <div style={{ textAlign: "center" }}>
          <Badge count={count} showZero style={{ backgroundColor: "#8c8c8c" }} />
        </div>
      ),
    },
    {
      title: "Hôm nay",
      dataIndex: "todayTasks",
      key: "today",
      width: 100,
      render: (count) => (
        <div style={{ textAlign: "center" }}>
          <Badge count={count} showZero style={{ backgroundColor: "#faad14" }} />
        </div>
      ),
    },
    {
      title: "Tiến độ trung bình",
      dataIndex: "progressAverage",
      key: "progress",
      width: 150,
      render: (percent, record) => (
        <div>
          <Progress
            percent={percent}
            strokeColor={record.isOverloaded ? "#ff4d4f" : "#52c41a"}
            size="small"
            format={(percent) => `${percent}%`}
          />
          <Text type="secondary" style={{ fontSize: 11, display: "block", marginTop: 4 }}>
            {record.criticalTasks} ưu tiên cao
          </Text>
        </div>
      ),
    },
    {
      title: "KPI",
      key: "kpi",
      width: 200,
      render: (_, record) => {
        const kpi = record.kpi || {};
        return (
          <div>
            <div style={{ marginBottom: 4 }}>
              <Text type="secondary" style={{ fontSize: 11 }}>Hoàn thành: </Text>
              <Text strong style={{ fontSize: 12, color: "#52c41a" }}>
                {kpi.completionRate?.toFixed(1) || 0}%
              </Text>
            </div>
            <div style={{ marginBottom: 4 }}>
              <Text type="secondary" style={{ fontSize: 11 }}>Đúng hạn: </Text>
              <Text strong style={{ fontSize: 12, color: "#1890ff" }}>
                {kpi.onTimeRate?.toFixed(1) || 0}%
              </Text>
            </div>
            <div>
              <Text type="secondary" style={{ fontSize: 11 }}>Hiệu quả: </Text>
              <Text strong style={{ fontSize: 12, color: "#722ed1" }}>
                {kpi.efficiency?.toFixed(1) || 0}%
              </Text>
            </div>
          </div>
        );
      },
    },
  ];

  return (
    <div className="resource-board">
      <Card className="resource-board__card">
        <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
          <Col>
            <Title level={3} style={{ margin: 0 }}>
              📊 Bảng phân bổ nguồn lực
            </Title>
            <Text type="secondary">
              Theo dõi tải công việc và KPI từng nhân sự trong dự án Workflow
            </Text>
          </Col>
          <Col>
            <Space wrap>
              <Select
                value={projectFilter}
                onChange={setProjectFilter}
                style={{ width: 200 }}
                placeholder="Lọc theo dự án"
              >
                <Option value="all">Tất cả dự án</Option>
                {projects.map((project) => (
                  <Option key={project.id} value={project.id}>
                    {project.projectName}
                  </Option>
                ))}
              </Select>
              <Select
                value={departmentFilter}
                onChange={setDepartmentFilter}
                style={{ width: 200 }}
                placeholder="Lọc theo phòng ban"
              >
                <Option value="all">Tất cả phòng ban</Option>
                {departments.map((department) => (
                  <Option key={department} value={department}>
                    {department}
                  </Option>
                ))}
              </Select>
              <Select
                value={sortBy}
                onChange={setSortBy}
                style={{ width: 150 }}
                placeholder="Sắp xếp"
              >
                <Option value="workload">Khối lượng</Option>
                <Option value="tasks">Số công việc</Option>
                <Option value="points">Điểm</Option>
                <Option value="overdue">Quá hạn</Option>
                <Option value="completion">Hoàn thành</Option>
                <Option value="efficiency">Hiệu quả</Option>
                <Option value="name">Tên</Option>
              </Select>
              <Select
                value={sortOrder}
                onChange={setSortOrder}
                style={{ width: 120 }}
              >
                <Option value="asc">Tăng dần</Option>
                <Option value="desc">Giảm dần</Option>
              </Select>
              <Segmented
                value={viewMode}
                onChange={setViewMode}
                options={[
                  { label: "Khối lượng", value: "workload" },
                  { label: "Ưu tiên", value: "priority" },
                ]}
              />
              <AntButton
                icon={<DownloadOutlined />}
                onClick={handleExport}
              >
                Xuất CSV
              </AntButton>
            </Space>
          </Col>
        </Row>

        <Row gutter={16} style={{ marginBottom: 16 }}>
          {summaryCards.map((card) => (
            <Col xs={12} sm={8} lg={4} key={card.key}>
              <Card size="small" hoverable>
                <Space direction="vertical" size="small" style={{ width: "100%" }}>
                  <Space>
                    <Avatar style={{ backgroundColor: card.color }} icon={card.icon} size="small" />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {card.title}
                    </Text>
                  </Space>
                  <div style={{ fontSize: 28, fontWeight: 700, color: card.color, lineHeight: 1 }}>
                    {card.value}
                  </div>
                  {card.subtitle && (
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      {card.subtitle}
                    </Text>
                  )}
                </Space>
              </Card>
            </Col>
          ))}
        </Row>

        {/* Team Metrics */}
        {teamMetrics && (
          <Card size="small" style={{ marginBottom: 16 }}>
            <Row gutter={16}>
              <Col span={6}>
                <div style={{ textAlign: "center" }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>Tỷ lệ hoàn thành TB</Text>
                  <div style={{ fontSize: 20, fontWeight: 700, color: "#52c41a" }}>
                    {teamMetrics.averageCompletionRate.toFixed(1)}%
                  </div>
                </div>
              </Col>
              <Col span={6}>
                <div style={{ textAlign: "center" }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>Hiệu quả TB</Text>
                  <div style={{ fontSize: 20, fontWeight: 700, color: "#1890ff" }}>
                    {teamMetrics.averageEfficiency.toFixed(1)}%
                  </div>
                </div>
              </Col>
              <Col span={6}>
                <div style={{ textAlign: "center" }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>Khối lượng TB</Text>
                  <div style={{ fontSize: 20, fontWeight: 700, color: "#faad14" }}>
                    {teamMetrics.averageWorkload.toFixed(1)}h
                  </div>
                </div>
              </Col>
              <Col span={6}>
                <div style={{ textAlign: "center" }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>Tổng điểm</Text>
                  <div style={{ fontSize: 20, fontWeight: 700, color: "#722ed1" }}>
                    {teamMetrics.totalPoints}
                  </div>
                </div>
              </Col>
            </Row>
          </Card>
        )}

        {/* Redistribution Suggestions */}
        {redistributionSuggestions.length > 0 && viewMode === "workload" && (
          <Card 
            title="💡 Gợi ý phân bổ lại công việc" 
            size="small" 
            style={{ marginBottom: 16 }}
            type="inner"
          >
            {redistributionSuggestions.map((suggestion, idx) => (
              <div key={idx} style={{ marginBottom: 12, padding: 12, backgroundColor: "#fff7e6", borderRadius: 4 }}>
                <Text strong>
                  {suggestion.overloadedUser} đang quá tải ({suggestion.currentWorkload.toFixed(1)}h)
                </Text>
                <div style={{ marginTop: 8 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Gợi ý chuyển {suggestion.suggestedRedistributions.length} công việc 
                    (giảm ~{suggestion.estimatedReduction.toFixed(1)}h):
                  </Text>
                  <ul style={{ marginTop: 4, marginBottom: 0, paddingLeft: 20 }}>
                    {suggestion.suggestedRedistributions.map((redist, rIdx) => (
                      <li key={rIdx} style={{ fontSize: 12 }}>
                        <Text>{redist.taskName}</Text> ({redist.hours}h) 
                        <Text type="secondary"> → {redist.toUser}</Text>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </Card>
        )}

        {resources.length > 0 ? (
          <>
            <Table
              columns={columns}
              dataSource={resources}
              pagination={false}
              rowKey="member"
              className="resource-board__table"
              scroll={{ x: true }}
            />

            {viewMode === "priority" && (
              <Row gutter={16} style={{ marginTop: 16 }}>
                <Col xs={24} lg={12}>
                  <Card title="Cảnh báo quá tải" size="small">
                    {resources.filter((member) => member.isOverloaded).length === 0 ? (
                      <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Không có ai quá tải" />
                    ) : (
                      <Space direction="vertical" style={{ width: "100%" }}>
                        {resources
                          .filter((member) => member.isOverloaded)
                          .map((member) => (
                            <Card.Grid key={member.member} className="resource-board__grid">
                              <Space>
                                <Badge status="error" />
                                <div>
                                  <div style={{ fontWeight: 600 }}>{member.member}</div>
                                  <Text type="secondary" style={{ fontSize: 12 }}>
                                    {member.totalTasks} việc • {member.workloadHours}h •{" "}
                                    {member.overdueTasks} trễ
                                  </Text>
                                </div>
                              </Space>
                            </Card.Grid>
                          ))}
                      </Space>
                    )}
                  </Card>
                </Col>
                <Col xs={24} lg={12}>
                  <Card title="Năng lực sẵn sàng" size="small">
                    {resources.filter((member) => !member.isOverloaded).length === 0 ? (
                      <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Tất cả đang bận" />
                    ) : (
                      <Space direction="vertical" style={{ width: "100%" }}>
                        {resources
                          .filter((member) => !member.isOverloaded)
                          .slice(0, 4)
                          .map((member) => (
                            <Card.Grid key={member.member} className="resource-board__grid">
                              <Space>
                                <Badge status="success" />
                                <div>
                                  <div style={{ fontWeight: 600 }}>{member.member}</div>
                                  <Text type="secondary" style={{ fontSize: 12 }}>
                                    {member.totalTasks} việc • {member.workloadHours}h
                                  </Text>
                                </div>
                                <Tooltip title="Tiến độ trung bình">
                                  <Progress
                                    percent={member.progressAverage}
                                    size="small"
                                    strokeColor="#52c41a"
                                    style={{ minWidth: 120 }}
                                  />
                                </Tooltip>
                              </Space>
                            </Card.Grid>
                          ))}
                      </Space>
                    )}
                  </Card>
                </Col>
              </Row>
            )}
          </>
        ) : (
          <Empty description="Không có dữ liệu phù hợp" />
        )}
      </Card>
    </div>
  );
};

export default ResourceBoard;

