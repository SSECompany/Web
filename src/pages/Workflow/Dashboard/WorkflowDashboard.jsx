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
  Spin,
  message,
} from "antd";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import useDepartmentPermissions from "../../../app/hooks/useDepartmentPermissions";
import DepartmentSelector from "../../../components/ReuseComponents/DepartmentSelector";
import { getUserInfo } from "../../../store/selectors/Selectors";
import { 
  getWorkflowRecentActivities,
  getWorkflowProjectStats,
} from "../../../components/WorkflowApp/API/workflowApi";
import "./WorkflowDashboard.css";

const { Title, Text } = Typography;

const WorkflowDashboard = () => {
  const userInfo = useSelector(getUserInfo);
  const departmentPermissions = useDepartmentPermissions();

  const [selectedDepartment, setSelectedDepartment] = useState(
    departmentPermissions.getDefaultDepartmentFilter()
  );

  const [loading, setLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    projects: {
      total: 0,
      active: 0,
      completed: 0,
      onHold: 0,
      cancelled: 0,
      overdue: 0,
      goodHealth: 0,
      warningHealth: 0,
      criticalHealth: 0,
    },
    tasks: {
      total: 0,
      completed: 0,
      inProgress: 0,
      overdue: 0,
    },
    budget: {
      total: 0,
      used: 0,
      remaining: 0,
      utilization: 0,
    },
    progress: {
      average: 0,
    },
  });

  // Reports data - sẽ được fill từ API
  const [reportsData, setReportsData] = useState({
    projectProgress: {
      totalProjects: 0,
      completedProjects: 0,
      inProgressProjects: 0,
      averageProgress: 0,
    },
    projectVolume: {
      totalTasks: 0,
      completedTasks: 0,
      inProgressTasks: 0,
      pendingTasks: 0,
    },
    projectCost: {
      totalBudget: 0,
      spentBudget: 0,
      remainingBudget: 0,
      budgetUtilization: 0,
    },
    projectKPI: {
      onTimeDelivery: 0,
      qualityScore: 0,
      customerSatisfaction: 0,
      teamProductivity: 0,
    },
    taskProgress: {
      totalTasks: 0,
      completedTasks: 0,
      inProgressTasks: 0,
      pendingTasks: 0,
      averageCompletionTime: 0,
    },
    taskKPI: {
      completionRate: 0,
      onTimeCompletion: 0,
      averageTaskDuration: 0,
      taskQuality: 0,
    },
  });

  // Recent activities - sẽ được fill từ API sau
  const [recentActivities, setRecentActivities] = useState([]);

  const columns = [
    {
      title: "STT",
      key: "stt",
      width: 50,
      fixed: "left",
      align: "center",
      render: (_, __, index) => index + 1,
    },
    {
      title: "Loại",
      dataIndex: "type",
      key: "type",
      width: 100,
      fixed: "left",
      render: (type) => (
        <div style={{ minWidth: 80, maxWidth: 100 }}>
          {type === "PROJECT" || type === "project" ? (
            <Tag color="blue" icon={<ProjectOutlined />} style={{ margin: 0 }}>
              Dự án
            </Tag>
          ) : (
            <Tag color="green" icon={<CheckSquareOutlined />} style={{ margin: 0 }}>
              Công việc
            </Tag>
          )}
        </div>
      ),
    },
    {
      title: "Tên",
      dataIndex: "title",
      key: "title",
      width: 180,
      ellipsis: {
        showTitle: true,
      },
    },
    {
      title: "Mã",
      dataIndex: "code",
      key: "code",
      width: 150,
      ellipsis: {
        showTitle: true,
      },
    },
    {
      title: "Loại hoạt động",
      dataIndex: "activityType",
      key: "activityType",
      width: 160,
      render: (activityType) => {
        const activityTypeConfig = {
          PROJECT_CREATED: { color: "success", text: "Tạo dự án" },
          PROJECT_DELETED: { color: "error", text: "Xóa dự án" },
          PM_CHANGED: { color: "processing", text: "Đổi PM" },
          MEMBER_ADDED: { color: "blue", text: "Thêm thành viên" },
          MEMBER_REMOVED: { color: "warning", text: "Xóa thành viên" },
          TASK_CREATED: { color: "success", text: "Tạo công việc" },
          TASK_UPDATED: { color: "processing", text: "Cập nhật công việc" },
          TASK_DELETED: { color: "error", text: "Xóa công việc" },
        };
        const config = activityTypeConfig[activityType] || { color: "default", text: activityType || "N/A" };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: "Mô tả",
      dataIndex: "description",
      key: "description",
      width: 350,
      render: (text) => (
        <div
          style={{
            wordBreak: "break-word",
            whiteSpace: "normal",
            lineHeight: "1.5",
          }}
        >
          {text || "N/A"}
        </div>
      ),
    },
    {
      title: "Người thực hiện",
      dataIndex: "assignee",
      key: "assignee",
      width: 150,
      ellipsis: {
        showTitle: true,
      },
    },
    {
      title: "Ngày thực hiện",
      dataIndex: "activityDate",
      key: "activityDate",
      width: 180,
      render: (date) => date ? new Date(date).toLocaleString("vi-VN") : "--",
    },
  ];

  useEffect(() => {
    // Set page title
    document.title = "WORKFLOW";

    // Add workflow page class
    document.body.classList.add("workflow-page");

    // Hàm lấy dữ liệu dashboard từ API
    const fetchDashboardStats = async () => {
      try {
        setLoading(true);
        
        // Gọi song song 2 API cần thiết để tăng tốc độ và độc lập với nhau
        // Đã bỏ 3 API không sử dụng: getWorkflowUserDashboard, getWorkflowUserProjects, getWorkflowUserProjectStats
        const [projectStatsResponse, activitiesResponse] = await Promise.allSettled([
          // API 1: Project Stats
          (async () => {
            const projectStatsParams = {
              companyCode: "dvcs01",
              userId: 1,
            };
            
            return await getWorkflowProjectStats(projectStatsParams);
          })(),
          
          // API 2: Recent Activities
          getWorkflowRecentActivities({
            companyCode: "DVCS01",
            limit: 20,
          }),
        ]);

        // Xử lý kết quả Project Stats
        if (projectStatsResponse.status === 'fulfilled') {
          const response = projectStatsResponse.value;
          
          // Cập nhật dữ liệu dashboard từ API response
          // Format: [{ TotalProjects, Planning, InProgress, OnHold, Completed, Cancelled, 
          //           HealthGood, HealthAtRisk, HealthCritical, TotalBudget, TotalBudgetUsed, AvgProgress }]
          if (response && Array.isArray(response) && response.length > 0) {
            const summary = response[0];
            
            // Tính toán remaining budget và utilization
            const totalBudget = summary.TotalBudget || 0;
            const usedBudget = summary.TotalBudgetUsed || 0;
            const remainingBudget = totalBudget - usedBudget;
            const budgetUtilization = totalBudget > 0 ? (usedBudget / totalBudget) * 100 : 0;

            // Cập nhật dashboardData
            setDashboardData(prev => ({
              projects: {
                total: summary.TotalProjects || 0,
                active: summary.InProgress || 0,
                completed: summary.Completed || 0,
                onHold: summary.OnHold || 0,
                cancelled: summary.Cancelled || 0,
                overdue: 0, // Không có trong API mới
                goodHealth: summary.HealthGood || 0,
                warningHealth: summary.HealthAtRisk || 0,
                criticalHealth: summary.HealthCritical || 0,
              },
              tasks: prev.tasks, // Giữ nguyên tasks
              budget: {
                total: totalBudget,
                used: usedBudget,
                remaining: remainingBudget,
                utilization: budgetUtilization,
              },
              progress: {
                average: summary.AvgProgress || 0,
              },
            }));

            // Cập nhật reportsData
            setReportsData(prev => ({
              ...prev,
              projectProgress: {
                totalProjects: summary.TotalProjects || 0,
                completedProjects: summary.Completed || 0,
                inProgressProjects: summary.InProgress || 0,
                averageProgress: summary.AvgProgress || 0,
              },
              projectCost: {
                totalBudget: totalBudget,
                spentBudget: usedBudget,
                remainingBudget: remainingBudget,
                budgetUtilization: budgetUtilization,
              },
            }));
          } else {
            console.warn("API project-stats trả về dữ liệu không hợp lệ:", response);
          }
        } else {
          // Nếu lỗi khi lấy project stats, log và giữ nguyên dữ liệu cũ
          console.error("Không thể tải thống kê dự án:", projectStatsResponse.reason);
          console.error("Error details:", {
            message: projectStatsResponse.reason?.message,
            response: projectStatsResponse.reason?.response,
            status: projectStatsResponse.reason?.response?.status,
          });
          // Không set lại dữ liệu về 0, giữ nguyên dữ liệu hiện tại
        }

        // Xử lý kết quả Recent Activities
        if (activitiesResponse.status === 'fulfilled') {
          const activitiesData = activitiesResponse.value;
          
          if (activitiesData && Array.isArray(activitiesData)) {
            // Map dữ liệu activities để phù hợp với table columns
            // Format: [{ EntityType, EntityId, EntityCode, EntityName, ActivityType, Description, TriggeredBy, TriggeredByName, ActivityDate }]
            const mappedActivities = activitiesData.map((activity, index) => ({
              key: activity.EntityId || activity.id || `activity-${index}`,
              type: activity.EntityType || 'PROJECT',
              title: activity.EntityName || 'N/A',
              code: activity.EntityCode || 'N/A',
              activityType: activity.ActivityType || 'N/A',
              description: activity.Description || 'N/A',
              assignee: activity.TriggeredByName || 'N/A',
              activityDate: activity.ActivityDate || null,
            }));
            setRecentActivities(mappedActivities);
          } else if (activitiesData && activitiesData.data && Array.isArray(activitiesData.data)) {
            // Nếu response có format { data: [...] }
            const mappedActivities = activitiesData.data.map((activity, index) => ({
              key: activity.EntityId || activity.id || `activity-${index}`,
              type: activity.EntityType || 'PROJECT',
              title: activity.EntityName || 'N/A',
              code: activity.EntityCode || 'N/A',
              activityType: activity.ActivityType || 'N/A',
              description: activity.Description || 'N/A',
              assignee: activity.TriggeredByName || 'N/A',
              activityDate: activity.ActivityDate || null,
            }));
            setRecentActivities(mappedActivities);
          } else {
            setRecentActivities([]);
          }
        } else {
          // Nếu lỗi khi lấy activities, log và giữ mảng rỗng
          console.error("Không thể tải hoạt động gần đây:", activitiesResponse.reason);
          console.error("Error details:", {
            message: activitiesResponse.reason?.message,
            response: activitiesResponse.reason?.response,
            status: activitiesResponse.reason?.response?.status,
          });
          setRecentActivities([]);
        }
      } catch (error) {
        console.error("Error loading dashboard:", error);
        message.error("Không thể tải dữ liệu dashboard. Vui lòng thử lại sau.");
        // Giữ dữ liệu mặc định nếu có lỗi
      } finally {
        setLoading(false);
      }
    };

    // Gọi API để lấy dữ liệu dashboard
    fetchDashboardStats();

    return () => {
      document.body.classList.remove("workflow-page");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Spin spinning={loading}>
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
                  {dashboardData.projects.total > 0
                    ? (
                        (dashboardData.projects.completed /
                          dashboardData.projects.total) *
                        100
                      ).toFixed(1)
                    : 0}
                  %
                </span>
              </div>
              <Progress
                percent={
                  dashboardData.projects.total > 0
                    ? (dashboardData.projects.completed /
                        dashboardData.projects.total) *
                      100
                    : 0
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
                  {dashboardData.tasks.total > 0
                    ? (
                        (dashboardData.tasks.completed /
                          dashboardData.tasks.total) *
                        100
                      ).toFixed(1)
                    : 0}
                  %
                </span>
              </div>
              <Progress
                percent={
                  dashboardData.tasks.total > 0
                    ? (dashboardData.tasks.completed / dashboardData.tasks.total) *
                      100
                    : 0
                }
                strokeColor="#1890ff"
              />
            </div>
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 8,
                }}
              >
                <span>Tiến độ trung bình</span>
                <span>{dashboardData.progress.average.toFixed(1)}%</span>
              </div>
              <Progress
                percent={dashboardData.progress.average}
                strokeColor="#722ed1"
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
                Dự án sức khỏe tốt: <strong>{dashboardData.projects.goodHealth}</strong>
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", marginTop: 8 }}>
              <WarningOutlined style={{ color: "#fa8c16", marginRight: 8 }} />
              <span>
                Dự án cần theo dõi: <strong>{dashboardData.projects.warningHealth}</strong>
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", marginTop: 8 }}>
              <WarningOutlined style={{ color: "#ff4d4f", marginRight: 8 }} />
              <span>
                Dự án nguy cơ: <strong>{dashboardData.projects.criticalHealth}</strong>
              </span>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Recent Activities */}
      <Card title="🔄 Hoạt động gần đây" className="activities-card" style={{ marginBottom: 24 }}>
        {recentActivities.length > 0 ? (
          <div style={{ width: '100%', overflowX: 'auto' }}>
            <Table
              columns={columns}
              dataSource={recentActivities}
              pagination={false}
              size="small"
              scroll={{ x: 1300 }}
              style={{ minWidth: '100%' }}
            />
          </div>
        ) : (
          <div style={{ padding: "40px 0", textAlign: "center" }}>
            <Text type="secondary">Chưa có hoạt động gần đây</Text>
          </div>
        )}
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
                          value > 0
                            ? `${(value / 1000000).toFixed(0)}M VNĐ`
                            : "0 VNĐ"
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
                          value > 0
                            ? `${(value / 1000000).toFixed(0)}M VNĐ`
                            : "0 VNĐ"
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
                          value > 0
                            ? `${(value / 1000000).toFixed(0)}M VNĐ`
                            : "0 VNĐ"
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
            {
              key: "trend-analysis",
              label: "Phân tích xu hướng",
              children: (
                <Row gutter={[16, 16]}>
                  <Col xs={24} lg={12}>
                    <Card title="Xu hướng hoàn thành dự án" size="small">
                      <div style={{ padding: "20px 0", textAlign: "center" }}>
                        <div style={{ marginBottom: 16 }}>
                          <Text strong>Tháng này:</Text>
                          <Progress
                            percent={75}
                            strokeColor="#52c41a"
                            style={{ marginTop: 8 }}
                          />
                        </div>
                        <div>
                          <Text strong>Tháng trước:</Text>
                          <Progress
                            percent={68}
                            strokeColor="#1890ff"
                            style={{ marginTop: 8 }}
                          />
                        </div>
                        <div style={{ marginTop: 16 }}>
                          <Tag color="green">
                            ↑ Tăng 7% so với tháng trước
                          </Tag>
                        </div>
                      </div>
                    </Card>
                  </Col>
                  <Col xs={24} lg={12}>
                    <Card title="Xu hướng hoàn thành công việc" size="small">
                      <div style={{ padding: "20px 0", textAlign: "center" }}>
                        <div style={{ marginBottom: 16 }}>
                          <Text strong>Tuần này:</Text>
                          <Progress
                            percent={82}
                            strokeColor="#52c41a"
                            style={{ marginTop: 8 }}
                          />
                        </div>
                        <div>
                          <Text strong>Tuần trước:</Text>
                          <Progress
                            percent={75}
                            strokeColor="#1890ff"
                            style={{ marginTop: 8 }}
                          />
                        </div>
                        <div style={{ marginTop: 16 }}>
                          <Tag color="green">
                            ↑ Tăng 7% so với tuần trước
                          </Tag>
                        </div>
                      </div>
                    </Card>
                  </Col>
                  <Col xs={24}>
                    <Card title="Biểu đồ xu hướng 6 tháng gần đây" size="small">
                      <div
                        style={{
                          padding: "40px 0",
                          textAlign: "center",
                          background: "#fafafa",
                          borderRadius: 4,
                        }}
                      >
                        <Text type="secondary">
                          [Biểu đồ line chart hiển thị xu hướng hoàn thành dự án và công việc theo thời gian]
                        </Text>
                        <div style={{ marginTop: 16 }}>
                          <Row gutter={16}>
                            {[
                              { month: "T7", value: 65 },
                              { month: "T8", value: 68 },
                              { month: "T9", value: 72 },
                              { month: "T10", value: 70 },
                              { month: "T11", value: 75 },
                              { month: "T12", value: 75 },
                            ].map((item, index) => (
                              <Col key={index} span={4}>
                                <div
                                  style={{
                                    height: `${item.value * 2}px`,
                                    background: "#1890ff",
                                    borderRadius: "4px 4px 0 0",
                                    marginBottom: 8,
                                  }}
                                />
                                <Text>{item.month}</Text>
                              </Col>
                            ))}
                          </Row>
                        </div>
                      </div>
                    </Card>
                  </Col>
                </Row>
              ),
            },
            {
              key: "period-comparison",
              label: "So sánh kỳ",
              children: (
                <Row gutter={[16, 16]}>
                  <Col xs={24}>
                    <Card title="So sánh tháng này vs tháng trước" size="small">
                      <Row gutter={[16, 16]}>
                        <Col xs={24} sm={12} md={6}>
                          <Card size="small" bordered={false}>
                            <Statistic
                              title="Dự án hoàn thành"
                              value={4}
                              suffix={
                                <span style={{ color: "#52c41a" }}>↑ +1</span>
                              }
                              valueStyle={{ fontSize: 24 }}
                            />
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              Tháng trước: 3
                            </Text>
                          </Card>
                        </Col>
                        <Col xs={24} sm={12} md={6}>
                          <Card size="small" bordered={false}>
                            <Statistic
                              title="Công việc hoàn thành"
                              value={28}
                              suffix={
                                <span style={{ color: "#52c41a" }}>↑ +5</span>
                              }
                              valueStyle={{ fontSize: 24 }}
                            />
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              Tháng trước: 23
                            </Text>
                          </Card>
                        </Col>
                        <Col xs={24} sm={12} md={6}>
                          <Card size="small" bordered={false}>
                            <Statistic
                              title="Tỷ lệ hoàn thành"
                              value={75}
                              suffix={
                                <span>
                                  % <span style={{ color: "#52c41a" }}>↑ +7%</span>
                                </span>
                              }
                              valueStyle={{ fontSize: 24 }}
                            />
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              Tháng trước: 68%
                            </Text>
                          </Card>
                        </Col>
                        <Col xs={24} sm={12} md={6}>
                          <Card size="small" bordered={false}>
                            <Statistic
                              title="Chi phí sử dụng"
                              value={64}
                              suffix={
                                <span>
                                  % <span style={{ color: "#fa8c16" }}>↑ +2%</span>
                                </span>
                              }
                              valueStyle={{ fontSize: 24 }}
                            />
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              Tháng trước: 62%
                            </Text>
                          </Card>
                        </Col>
                      </Row>
                    </Card>
                  </Col>
                  <Col xs={24}>
                    <Card title="So sánh quý này vs quý trước" size="small">
                      <Row gutter={[16, 16]}>
                        <Col xs={24} sm={8}>
                          <Card size="small" bordered={false}>
                            <Statistic
                              title="Tổng dự án"
                              value={12}
                              suffix={
                                <span style={{ color: "#1890ff" }}>→ 0</span>
                              }
                              valueStyle={{ fontSize: 24 }}
                            />
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              Quý trước: 12
                            </Text>
                          </Card>
                        </Col>
                        <Col xs={24} sm={8}>
                          <Card size="small" bordered={false}>
                            <Statistic
                              title="Năng suất team"
                              value={78}
                              suffix={
                                <span>
                                  % <span style={{ color: "#52c41a" }}>↑ +5%</span>
                                </span>
                              }
                              valueStyle={{ fontSize: 24 }}
                            />
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              Quý trước: 73%
                            </Text>
                          </Card>
                        </Col>
                        <Col xs={24} sm={8}>
                          <Card size="small" bordered={false}>
                            <Statistic
                              title="Chất lượng"
                              value={92}
                              suffix={
                                <span>
                                  % <span style={{ color: "#52c41a" }}>↑ +3%</span>
                                </span>
                              }
                              valueStyle={{ fontSize: 24 }}
                            />
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              Quý trước: 89%
                            </Text>
                          </Card>
                        </Col>
                      </Row>
                    </Card>
                  </Col>
                </Row>
              ),
            },
          ]}
        />
      </Card>
      </div>
    </Spin>
  );
};

export default WorkflowDashboard;
