import React, { useState, useMemo } from "react";
import {
  Card,
  Col,
  Row,
  Statistic,
  Tabs,
  Table,
  Tag,
  Typography,
  DatePicker,
  Select,
  Space,
  Progress,
  Timeline,
} from "antd";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  BarChartOutlined,
  LineChartOutlined,
  PieChartOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useSelector } from "react-redux";
import "./TaskReports.css";

const { RangePicker } = DatePicker;
const { Option } = Select;
const { Title, Text } = Typography;

const TaskReports = () => {
  const { tasksList } = useSelector((state) => state.tasks);
  const [dateRange, setDateRange] = useState([
    dayjs().startOf("month"),
    dayjs().endOf("month"),
  ]);
  const [projectFilter, setProjectFilter] = useState("ALL");
  const [activeTab, setActiveTab] = useState("overview");

  const allTasks = tasksList || [];
  const projects = useMemo(() => {
    const projectSet = new Set();
    allTasks.forEach((task) => {
      if (task.projectName) {
        projectSet.add(task.projectName);
      }
    });
    return Array.from(projectSet);
  }, [allTasks]);

  // Filter tasks by date range and project
  const filteredTasks = useMemo(() => {
    return allTasks.filter((task) => {
      const taskDate = task.startDate ? dayjs(task.startDate) : dayjs();
      const inDateRange =
        taskDate.isAfter(dateRange[0].subtract(1, "day")) &&
        taskDate.isBefore(dateRange[1].add(1, "day"));
      const matchProject =
        projectFilter === "ALL" || task.projectName === projectFilter;
      return inDateRange && matchProject;
    });
  }, [allTasks, dateRange, projectFilter]);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = filteredTasks.length;
    const completed = filteredTasks.filter(
      (t) => t.status === "COMPLETED" || t.status === "DONE"
    ).length;
    const inProgress = filteredTasks.filter(
      (t) => t.status === "IN_PROGRESS"
    ).length;
    const pending = filteredTasks.filter((t) => t.status === "PENDING").length;
    const overdue = filteredTasks.filter((t) => {
      if (!t.dueDate) return false;
      return dayjs(t.dueDate).isBefore(dayjs(), "day");
    }).length;

    const totalEstimatedHours = filteredTasks.reduce(
      (sum, t) => sum + (t.estimatedHours || 0),
      0
    );
    const totalSpentHours = filteredTasks.reduce(
      (sum, t) => sum + (t.spentHours || Math.round((t.estimatedHours || 0) * (t.progress || 0) / 100)),
      0
    );
    const avgProgress =
      total > 0
        ? filteredTasks.reduce((sum, t) => sum + (t.progress || 0), 0) / total
        : 0;

    return {
      total,
      completed,
      inProgress,
      pending,
      overdue,
      totalEstimatedHours,
      totalSpentHours,
      avgProgress,
      completionRate: total > 0 ? (completed / total) * 100 : 0,
    };
  }, [filteredTasks]);

  // Burndown chart data
  const burndownData = useMemo(() => {
    const days = [];
    const start = dateRange[0];
    const end = dateRange[1];
    let current = start;
    let remainingTasks = filteredTasks.length;

    while (current.isBefore(end) || current.isSame(end, "day")) {
      const completedOnDay = filteredTasks.filter((task) => {
        // Simplified: assume tasks completed on due date
        return (
          task.status === "COMPLETED" &&
          task.dueDate &&
          dayjs(task.dueDate).isSame(current, "day")
        );
      }).length;

      remainingTasks = Math.max(0, remainingTasks - completedOnDay);

      days.push({
        date: current.format("YYYY-MM-DD"),
        remaining: remainingTasks,
        completed: completedOnDay,
      });

      current = current.add(1, "day");
    }

    return days;
  }, [filteredTasks, dateRange]);

  // Velocity tracking
  const velocityData = useMemo(() => {
    const weeks = [];
    const start = dateRange[0].startOf("week");
    const end = dateRange[1].endOf("week");
    let current = start;

    while (current.isBefore(end) || current.isSame(end, "week")) {
      const weekTasks = filteredTasks.filter((task) => {
        const taskDate = task.startDate ? dayjs(task.startDate) : dayjs();
        return (
          taskDate.isAfter(current.subtract(1, "day")) &&
          taskDate.isBefore(current.add(7, "day"))
        );
      });

      const completed = weekTasks.filter(
        (t) => t.status === "COMPLETED" || t.status === "DONE"
      ).length;
      const storyPoints = weekTasks.reduce(
        (sum, t) => sum + (t.estimatedHours || 0) / 8,
        0
      );

      weeks.push({
        week: current.format("WW/YYYY"),
        completed,
        storyPoints: Math.round(storyPoints * 10) / 10,
      });

      current = current.add(1, "week");
    }

    return weeks;
  }, [filteredTasks, dateRange]);

  // Time tracking report
  const timeTrackingData = useMemo(() => {
    const byUser = {};
    const byType = {};

    filteredTasks.forEach((task) => {
      const user = task.assignedToName || "Chưa giao";
      const type = task.type || "TASK";
      const hours = task.spentHours || Math.round((task.estimatedHours || 0) * (task.progress || 0) / 100);

      byUser[user] = (byUser[user] || 0) + hours;
      byType[type] = (byType[type] || 0) + hours;
    });

    return {
      byUser: Object.entries(byUser)
        .map(([user, hours]) => ({ user, hours }))
        .sort((a, b) => b.hours - a.hours),
      byType: Object.entries(byType)
        .map(([type, hours]) => ({ type, hours }))
        .sort((a, b) => b.hours - a.hours),
    };
  }, [filteredTasks]);

  const tabItems = [
    {
      key: "overview",
      label: "Tổng quan",
      icon: <BarChartOutlined />,
      children: (
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Tổng công việc"
                value={stats.total}
                prefix={<FileTextOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Hoàn thành"
                value={stats.completed}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: "#3f8600" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Đang thực hiện"
                value={stats.inProgress}
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: "#1890ff" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Quá hạn"
                value={stats.overdue}
                valueStyle={{ color: "#cf1322" }}
              />
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card title="Tiến độ trung bình">
              <Progress
                percent={Math.round(stats.avgProgress)}
                status="active"
                strokeColor={{
                  "0%": "#108ee9",
                  "100%": "#87d068",
                }}
              />
              <Text type="secondary" style={{ fontSize: 12 }}>
                Tỷ lệ hoàn thành: {stats.completionRate.toFixed(1)}%
              </Text>
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card title="Thời gian">
              <Space direction="vertical" style={{ width: "100%" }}>
                <Statistic
                  title="Tổng giờ ước tính"
                  value={stats.totalEstimatedHours}
                  suffix="h"
                />
                <Statistic
                  title="Tổng giờ đã dùng"
                  value={stats.totalSpentHours.toFixed(1)}
                  suffix="h"
                />
                <Statistic
                  title="Chênh lệch"
                  value={(stats.totalSpentHours - stats.totalEstimatedHours).toFixed(1)}
                  suffix="h"
                  valueStyle={{
                    color:
                      stats.totalSpentHours > stats.totalEstimatedHours
                        ? "#cf1322"
                        : "#3f8600",
                  }}
                />
              </Space>
            </Card>
          </Col>
        </Row>
      ),
    },
    {
      key: "burndown",
      label: "Burndown Chart",
      icon: <LineChartOutlined />,
      children: (
        <Card title="Burndown Chart">
          <div className="burndown-chart">
            {burndownData.map((day, index) => (
              <div key={index} className="burndown-day">
                <div className="burndown-bar">
                  <div
                    className="burndown-fill"
                    style={{
                      height: `${(day.remaining / stats.total) * 100}%`,
                    }}
                  />
                </div>
                <Text style={{ fontSize: 10 }}>{day.date.slice(5)}</Text>
              </div>
            ))}
          </div>
          <Space style={{ marginTop: 16 }}>
            <Text strong>Ngày bắt đầu: </Text>
            <Text>{dateRange[0].format("DD/MM/YYYY")}</Text>
            <Text strong>Ngày kết thúc: </Text>
            <Text>{dateRange[1].format("DD/MM/YYYY")}</Text>
            <Text strong>Tổng công việc: </Text>
            <Text>{stats.total}</Text>
          </Space>
        </Card>
      ),
    },
    {
      key: "velocity",
      label: "Velocity Tracking",
      icon: <PieChartOutlined />,
      children: (
        <Card title="Velocity Tracking">
          <Table
            dataSource={velocityData}
            columns={[
              {
                title: "Tuần",
                dataIndex: "week",
                key: "week",
              },
              {
                title: "Hoàn thành",
                dataIndex: "completed",
                key: "completed",
                render: (value) => (
                  <Tag color={value > 0 ? "green" : "default"}>{value}</Tag>
                ),
              },
              {
                title: "Story Points",
                dataIndex: "storyPoints",
                key: "storyPoints",
                render: (value) => `${value} SP`,
              },
            ]}
            pagination={false}
            size="small"
          />
        </Card>
      ),
    },
    {
      key: "time-tracking",
      label: "Time Tracking",
      icon: <ClockCircleOutlined />,
      children: (
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Card title="Theo người thực hiện">
              <Table
                dataSource={timeTrackingData.byUser}
                columns={[
                  {
                    title: "Người thực hiện",
                    dataIndex: "user",
                    key: "user",
                  },
                  {
                    title: "Số giờ",
                    dataIndex: "hours",
                    key: "hours",
                    render: (value) => `${value.toFixed(1)}h`,
                  },
                  {
                    title: "Tỷ lệ",
                    key: "percentage",
                    render: (_, record) => {
                      const percentage =
                        (record.hours / stats.totalSpentHours) * 100;
                      return (
                        <Progress
                          percent={percentage}
                          size="small"
                          format={(percent) => `${percent.toFixed(1)}%`}
                        />
                      );
                    },
                  },
                ]}
                pagination={false}
                size="small"
              />
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card title="Theo loại công việc">
              <Table
                dataSource={timeTrackingData.byType}
                columns={[
                  {
                    title: "Loại",
                    dataIndex: "type",
                    key: "type",
                    render: (type) => {
                      const typeColors = {
                        TASK: "blue",
                        BUG: "red",
                        FEATURE: "green",
                        SUPPORT: "purple",
                      };
                      return <Tag color={typeColors[type] || "default"}>{type}</Tag>;
                    },
                  },
                  {
                    title: "Số giờ",
                    dataIndex: "hours",
                    key: "hours",
                    render: (value) => `${value.toFixed(1)}h`,
                  },
                  {
                    title: "Tỷ lệ",
                    key: "percentage",
                    render: (_, record) => {
                      const percentage =
                        (record.hours / stats.totalSpentHours) * 100;
                      return (
                        <Progress
                          percent={percentage}
                          size="small"
                          format={(percent) => `${percent.toFixed(1)}%`}
                        />
                      );
                    },
                  },
                ]}
                pagination={false}
                size="small"
              />
            </Card>
          </Col>
        </Row>
      ),
    },
  ];

  return (
    <div className="task-reports-container">
      <Card>
        <Space direction="vertical" style={{ width: "100%" }} size="large">
          {/* Filters */}
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={8}>
              <Space>
                <Text strong>Khoảng thời gian:</Text>
                <RangePicker
                  value={dateRange}
                  onChange={setDateRange}
                  format="DD/MM/YYYY"
                />
              </Space>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Space>
                <Text strong>Dự án:</Text>
                <Select
                  value={projectFilter}
                  onChange={setProjectFilter}
                  style={{ width: 200 }}
                >
                  <Option value="ALL">Tất cả</Option>
                  {projects.map((project) => (
                    <Option key={project} value={project}>
                      {project}
                    </Option>
                  ))}
                </Select>
              </Space>
            </Col>
          </Row>

          {/* Tabs */}
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={tabItems}
            size="large"
          />
        </Space>
      </Card>
    </div>
  );
};

export default TaskReports;






