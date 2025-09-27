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
      <Card title="🔄 Hoạt động gần đây" className="activities-card">
        <Table
          columns={columns}
          dataSource={recentActivities}
          pagination={false}
          size="small"
          scroll={{ x: 800 }}
        />
      </Card>
    </div>
  );
};

export default WorkflowDashboard;
