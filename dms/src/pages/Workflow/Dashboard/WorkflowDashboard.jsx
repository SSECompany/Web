import {
  CheckSquareOutlined,
  ClockCircleOutlined,
  ProjectOutlined,
  TeamOutlined,
  TrophyOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import {
  Card,
  Col,
  Progress,
  Row,
  Space,
  Statistic,
  Table,
  Tabs,
  Tag,
  Typography,
} from "antd";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import useDepartmentPermissions from "../../../app/hooks/useDepartmentPermissions";
import DepartmentSelector from "../../../components/ReuseComponents/DepartmentSelector";
import { getUserInfo } from "../../../store/selectors/Selectors";
import "./WorkflowDashboard.css";

const { Title, Text } = Typography;

const WorkflowDashboard = () => {
  const userInfo = useSelector(getUserInfo);
  const departmentPermissions = useDepartmentPermissions();

  const [selectedDepartment, setSelectedDepartment] = useState(
    departmentPermissions.getDefaultDepartmentFilter()
  );

  const [dashboardData, setDashboardData] = useState({
    projects: {
      total: 12,
      active: 8,
      completed: 4,
      overdue: 2,
    },
    tasks: {
      total: 45,
      completed: 28,
      inProgress: 12,
      overdue: 5,
    },
  });

  // Reports data
  const [reportsData, setReportsData] = useState({
    projectProgress: {
      totalProjects: 12,
      completedProjects: 4,
      inProgressProjects: 8,
      averageProgress: 65.5,
    },
    projectVolume: {
      totalTasks: 145,
      completedTasks: 95,
      inProgressTasks: 35,
      pendingTasks: 15,
    },
    projectCost: {
      totalBudget: 500000000,
      spentBudget: 320000000,
      remainingBudget: 180000000,
      budgetUtilization: 64,
    },
    projectKPI: {
      onTimeDelivery: 85,
      qualityScore: 92,
      customerSatisfaction: 88,
      teamProductivity: 78,
    },
    taskProgress: {
      totalTasks: 45,
      completedTasks: 28,
      inProgressTasks: 12,
      pendingTasks: 5,
      averageCompletionTime: 3.5,
    },
    taskKPI: {
      completionRate: 62.2,
      onTimeCompletion: 75.5,
      averageTaskDuration: 2.8,
      taskQuality: 89,
    },
  });

  // Sample data for recent activities
  const recentActivities = [
    {
      key: "1",
      type: "project",
      title: "Dự án website mới",
      status: "IN_PROGRESS",
      assignee: "Nguyễn Văn A",
      dueDate: "2024-02-15",
      progress: 75,
    },
    {
      key: "2",
      type: "task",
      title: "Thiết kế giao diện login",
      status: "COMPLETED",
      assignee: "Trần Thị B",
      dueDate: "2024-02-10",
      progress: 100,
    },
    {
      key: "3",
      type: "task",
      title: "Review code backend",
      status: "OVERDUE",
      assignee: "Lê Văn C",
      dueDate: "2024-02-08",
      progress: 60,
    },
  ];

  const columns = [
    {
      title: "Loại",
      dataIndex: "type",
      key: "type",
      width: 80,
      render: (type) =>
        type === "project" ? (
          <Tag color="blue" icon={<ProjectOutlined />}>
            Dự án
          </Tag>
        ) : (
          <Tag color="green" icon={<CheckSquareOutlined />}>
            Công việc
          </Tag>
        ),
    },
    {
      title: "Tiêu đề",
      dataIndex: "title",
      key: "title",
      width: 200,
    },
    {
      title: "Người thực hiện",
      dataIndex: "assignee",
      key: "assignee",
      width: 150,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status) => {
        const statusConfig = {
          IN_PROGRESS: { color: "processing", text: "Đang thực hiện" },
          COMPLETED: { color: "success", text: "Hoàn thành" },
          OVERDUE: { color: "error", text: "Quá hạn" },
        };
        return (
          <Tag color={statusConfig[status].color}>
            {statusConfig[status].text}
          </Tag>
        );
      },
    },
    {
      title: "Hạn hoàn thành",
      dataIndex: "dueDate",
      key: "dueDate",
      width: 120,
      render: (date) => new Date(date).toLocaleDateString("vi-VN"),
    },
    {
      title: "Tiến độ",
      dataIndex: "progress",
      key: "progress",
      width: 100,
      render: (progress) => <Progress percent={progress} size="small" />,
    },
  ];

  useEffect(() => {
    // Set page title
    document.title = "WORKFLOW";

    // Add workflow page class
    document.body.classList.add("workflow-page");

    return () => {
      document.body.classList.remove("workflow-page");
    };
  }, []);

  return (
    <div className="workflow-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <div>
            <Title level={2} style={{ margin: 0 }}>
              📊 Dashboard
            </Title>
            <Text type="secondary">
              Tổng quan về tình hình dự án và công việc
            </Text>
          </div>

          {departmentPermissions.canViewAllDepartments && (
            <div style={{ minWidth: 300 }}>
              <Space direction="vertical" size="small">
                <Text strong>Phòng ban:</Text>
                <DepartmentSelector
                  value={selectedDepartment}
                  onChange={(departmentId) => {
                    setSelectedDepartment(departmentId);
                    // TODO: Reload dashboard data for selected department
                    console.log("Selected department:", departmentId);
                  }}
                  allowAll={true}
                  placeholder="Chọn phòng ban xem báo cáo"
                  style={{ width: "100%" }}
                />
              </Space>
            </div>
          )}

          {!departmentPermissions.canViewAllDepartments && (
            <div>
              <Text strong>Phòng ban: </Text>
              <Tag color="blue">
                {departmentPermissions.currentDepartment.name}
              </Tag>
            </div>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card">
            <Statistic
              title="Tổng số dự án"
              value={dashboardData.projects.total}
              prefix={<ProjectOutlined style={{ color: "#1890ff" }} />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card">
            <Statistic
              title="Dự án đang thực hiện"
              value={dashboardData.projects.active}
              prefix={<ClockCircleOutlined style={{ color: "#52c41a" }} />}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card">
            <Statistic
              title="Tổng số công việc"
              value={dashboardData.tasks.total}
              prefix={<CheckSquareOutlined style={{ color: "#722ed1" }} />}
              valueStyle={{ color: "#722ed1" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card">
            <Statistic
              title="Công việc hoàn thành"
              value={dashboardData.tasks.completed}
              prefix={<TrophyOutlined style={{ color: "#fa8c16" }} />}
              valueStyle={{ color: "#fa8c16" }}
            />
          </Card>
        </Col>
      </Row>

      {/* Progress Overview */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card title="📈 Tiến độ dự án" className="progress-card">
            <div style={{ marginBottom: 16 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 8,
                }}
              >
                <span>Dự án hoàn thành</span>
                <span>
                  {(
                    (dashboardData.projects.completed /
                      dashboardData.projects.total) *
                    100
                  ).toFixed(1)}
                  %
                </span>
              </div>
              <Progress
                percent={
                  (dashboardData.projects.completed /
                    dashboardData.projects.total) *
                  100
                }
                strokeColor="#52c41a"
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 8,
                }}
              >
                <span>Công việc hoàn thành</span>
                <span>
                  {(
                    (dashboardData.tasks.completed /
                      dashboardData.tasks.total) *
                    100
                  ).toFixed(1)}
                  %
                </span>
              </div>
              <Progress
                percent={
                  (dashboardData.tasks.completed / dashboardData.tasks.total) *
                  100
                }
                strokeColor="#1890ff"
              />
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="⚠️ Cảnh báo" className="warning-card">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <WarningOutlined style={{ color: "#ff4d4f", marginRight: 8 }} />
              <span>
                Dự án quá hạn: <strong>{dashboardData.projects.overdue}</strong>
              </span>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <WarningOutlined style={{ color: "#fa8c16", marginRight: 8 }} />
              <span>
                Công việc quá hạn:{" "}
                <strong>{dashboardData.tasks.overdue}</strong>
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center" }}>
              <TeamOutlined style={{ color: "#1890ff", marginRight: 8 }} />
              <span>
                Nhân viên đang làm việc: <strong>15</strong>
              </span>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Recent Activities */}
      <Card title="🔄 Hoạt động gần đây" className="activities-card" style={{ marginBottom: 24 }}>
        <Table
          columns={columns}
          dataSource={recentActivities}
          pagination={false}
          size="small"
          scroll={{ x: 800 }}
        />
      </Card>

      {/* Reports Section */}
      <Card title="📊 Báo cáo chi tiết" className="reports-card">
        <Tabs
          defaultActiveKey="project-progress"
          items={[
            {
              key: "project-progress",
              label: "Tiến độ dự án",
              children: (
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={12} lg={6}>
                    <Card size="small">
                      <Statistic
                        title="Tổng dự án"
                        value={reportsData.projectProgress.totalProjects}
                        valueStyle={{ fontSize: 20 }}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} lg={6}>
                    <Card size="small">
                      <Statistic
                        title="Hoàn thành"
                        value={reportsData.projectProgress.completedProjects}
                        valueStyle={{ color: "#52c41a", fontSize: 20 }}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} lg={6}>
                    <Card size="small">
                      <Statistic
                        title="Đang thực hiện"
                        value={reportsData.projectProgress.inProgressProjects}
                        valueStyle={{ color: "#1890ff", fontSize: 20 }}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} lg={6}>
                    <Card size="small">
                      <Statistic
                        title="Tiến độ trung bình"
                        value={reportsData.projectProgress.averageProgress}
                        suffix="%"
                        valueStyle={{ color: "#722ed1", fontSize: 20 }}
                      />
                    </Card>
                  </Col>
                </Row>
              ),
            },
            {
              key: "project-volume",
              label: "Khối lượng dự án",
              children: (
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={12} lg={6}>
                    <Card size="small">
                      <Statistic
                        title="Tổng công việc"
                        value={reportsData.projectVolume.totalTasks}
                        valueStyle={{ fontSize: 20 }}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} lg={6}>
                    <Card size="small">
                      <Statistic
                        title="Hoàn thành"
                        value={reportsData.projectVolume.completedTasks}
                        valueStyle={{ color: "#52c41a", fontSize: 20 }}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} lg={6}>
                    <Card size="small">
                      <Statistic
                        title="Đang thực hiện"
                        value={reportsData.projectVolume.inProgressTasks}
                        valueStyle={{ color: "#1890ff", fontSize: 20 }}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} lg={6}>
                    <Card size="small">
                      <Statistic
                        title="Chờ xử lý"
                        value={reportsData.projectVolume.pendingTasks}
                        valueStyle={{ color: "#fa8c16", fontSize: 20 }}
                      />
                    </Card>
                  </Col>
                </Row>
              ),
            },
            {
              key: "project-cost",
              label: "Chi phí dự án",
              children: (
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={8}>
                    <Card size="small">
                      <Statistic
                        title="Tổng ngân sách"
                        value={reportsData.projectCost.totalBudget}
                        formatter={(value) =>
                          `${(value / 1000000).toFixed(0)}M VNĐ`
                        }
                        valueStyle={{ fontSize: 18 }}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Card size="small">
                      <Statistic
                        title="Đã chi tiêu"
                        value={reportsData.projectCost.spentBudget}
                        formatter={(value) =>
                          `${(value / 1000000).toFixed(0)}M VNĐ`
                        }
                        valueStyle={{ color: "#ff4d4f", fontSize: 18 }}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Card size="small">
                      <Statistic
                        title="Còn lại"
                        value={reportsData.projectCost.remainingBudget}
                        formatter={(value) =>
                          `${(value / 1000000).toFixed(0)}M VNĐ`
                        }
                        valueStyle={{ color: "#52c41a", fontSize: 18 }}
                      />
                    </Card>
                  </Col>
                  <Col xs={24}>
                    <Card size="small" title="Tỷ lệ sử dụng ngân sách">
                      <Progress
                        percent={reportsData.projectCost.budgetUtilization}
                        status={
                          reportsData.projectCost.budgetUtilization > 80
                            ? "exception"
                            : "active"
                        }
                      />
                    </Card>
                  </Col>
                </Row>
              ),
            },
            {
              key: "project-kpi",
              label: "KPI dự án",
              children: (
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={12} lg={6}>
                    <Card size="small">
                      <Statistic
                        title="Giao hàng đúng hạn"
                        value={reportsData.projectKPI.onTimeDelivery}
                        suffix="%"
                        valueStyle={{ color: "#52c41a", fontSize: 20 }}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} lg={6}>
                    <Card size="small">
                      <Statistic
                        title="Chất lượng"
                        value={reportsData.projectKPI.qualityScore}
                        suffix="%"
                        valueStyle={{ color: "#1890ff", fontSize: 20 }}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} lg={6}>
                    <Card size="small">
                      <Statistic
                        title="Hài lòng khách hàng"
                        value={reportsData.projectKPI.customerSatisfaction}
                        suffix="%"
                        valueStyle={{ color: "#722ed1", fontSize: 20 }}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} lg={6}>
                    <Card size="small">
                      <Statistic
                        title="Năng suất team"
                        value={reportsData.projectKPI.teamProductivity}
                        suffix="%"
                        valueStyle={{ color: "#fa8c16", fontSize: 20 }}
                      />
                    </Card>
                  </Col>
                </Row>
              ),
            },
            {
              key: "task-progress",
              label: "Tiến độ công việc",
              children: (
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={12} lg={6}>
                    <Card size="small">
                      <Statistic
                        title="Tổng công việc"
                        value={reportsData.taskProgress.totalTasks}
                        valueStyle={{ fontSize: 20 }}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} lg={6}>
                    <Card size="small">
                      <Statistic
                        title="Hoàn thành"
                        value={reportsData.taskProgress.completedTasks}
                        valueStyle={{ color: "#52c41a", fontSize: 20 }}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} lg={6}>
                    <Card size="small">
                      <Statistic
                        title="Đang thực hiện"
                        value={reportsData.taskProgress.inProgressTasks}
                        valueStyle={{ color: "#1890ff", fontSize: 20 }}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} lg={6}>
                    <Card size="small">
                      <Statistic
                        title="Thời gian hoàn thành TB"
                        value={reportsData.taskProgress.averageCompletionTime}
                        suffix="ngày"
                        valueStyle={{ color: "#722ed1", fontSize: 20 }}
                      />
                    </Card>
                  </Col>
                </Row>
              ),
            },
            {
              key: "task-kpi",
              label: "KPI công việc",
              children: (
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={12} lg={6}>
                    <Card size="small">
                      <Statistic
                        title="Tỷ lệ hoàn thành"
                        value={reportsData.taskKPI.completionRate}
                        suffix="%"
                        valueStyle={{ color: "#52c41a", fontSize: 20 }}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} lg={6}>
                    <Card size="small">
                      <Statistic
                        title="Hoàn thành đúng hạn"
                        value={reportsData.taskKPI.onTimeCompletion}
                        suffix="%"
                        valueStyle={{ color: "#1890ff", fontSize: 20 }}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} lg={6}>
                    <Card size="small">
                      <Statistic
                        title="Thời gian TB/công việc"
                        value={reportsData.taskKPI.averageTaskDuration}
                        suffix="ngày"
                        valueStyle={{ color: "#722ed1", fontSize: 20 }}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} lg={6}>
                    <Card size="small">
                      <Statistic
                        title="Chất lượng công việc"
                        value={reportsData.taskKPI.taskQuality}
                        suffix="%"
                        valueStyle={{ color: "#fa8c16", fontSize: 20 }}
                      />
                    </Card>
                  </Col>
                </Row>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
};

export default WorkflowDashboard;
