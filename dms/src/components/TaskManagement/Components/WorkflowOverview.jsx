import {
  BarChartOutlined,
  CheckSquareOutlined,
  ProjectOutlined,
  RightOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { Badge, Button, Card, Col, Row, Typography } from "antd";
import { useNavigate } from "react-router-dom";

const { Title, Text } = Typography;

/**
 * Clean Workflow Overview - Only 5 Essential Modules
 * Giao diện tổng quan chỉ hiển thị 5 modules cần thiết
 */
const WorkflowOverview = () => {
  const navigate = useNavigate();

  // 5 modules cốt lõi đã được user confirm
  const coreModules = [
    {
      id: "dashboard",
      title: "Dashboard Workflow",
      description: "Tổng quan tình hình dự án và công việc theo từng phòng ban",
      icon: <BarChartOutlined />,
      color: "#1890ff",
      route: "/workflow/dashboard",
      badge: "Essential",
    },
    {
      id: "projects",
      title: "Danh sách dự án",
      description: "Quản lý, tạo mới và theo dõi tiến độ các dự án",
      icon: <ProjectOutlined />,
      color: "#52c41a",
      route: "/workflow/projects",
      badge: "Essential",
    },
    {
      id: "tasks",
      title: "Danh sách công việc",
      description: "Quản lý tasks và issues như Redmine với đầy đủ tính năng",
      icon: <CheckSquareOutlined />,
      color: "#722ed1",
      route: "/workflow/tasks",
      badge: "Essential",
    },
    {
      id: "assignment",
      title: "Giao việc",
      description: "Phân công và quản lý công việc cho các thành viên",
      icon: <TeamOutlined />,
      color: "#fa8c16",
      route: "/workflow/assignment",
      badge: "Useful",
    },
  ];

  const handleModuleClick = (module) => {
    navigate(module.route);
  };

  return (
    <div style={{ padding: "24px 0" }}>
      {/* Clean Header */}
      <div style={{ textAlign: "center", marginBottom: 48 }}>
        <Title level={2} style={{ marginBottom: 8 }}>
          🎯 Workflow Management
        </Title>
        <Text type="secondary" style={{ fontSize: 16 }}>
          Hệ thống quản lý dự án và công việc đơn giản, hiệu quả
        </Text>
      </div>

      {/* 4 Core Modules in 2x2 Grid */}
      <Row gutter={[32, 32]} justify="center">
        {coreModules.map((module) => (
          <Col key={module.id} xs={24} sm={12} lg={12} xl={10}>
            <Card
              hoverable
              style={{
                height: 180,
                border: `2px solid ${module.color}15`,
                borderRadius: 12,
                transition: "all 0.3s ease",
                cursor: "pointer",
              }}
              bodyStyle={{
                padding: 24,
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
              onClick={() => handleModuleClick(module)}
            >
              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: 16,
                  }}
                >
                  <div
                    style={{
                      fontSize: 32,
                      color: module.color,
                      lineHeight: 1,
                    }}
                  >
                    {module.icon}
                  </div>
                  <Badge
                    count={module.badge}
                    style={{
                      backgroundColor:
                        module.badge === "Essential" ? "#ff4d4f" : "#52c41a",
                      fontSize: 11,
                    }}
                  />
                </div>

                <Title
                  level={4}
                  style={{
                    margin: "0 0 8px 0",
                    color: module.color,
                    fontSize: 18,
                  }}
                >
                  {module.title}
                </Title>

                <Text
                  type="secondary"
                  style={{
                    fontSize: 13,
                    lineHeight: 1.4,
                    display: "block",
                  }}
                >
                  {module.description}
                </Text>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  marginTop: 16,
                }}
              >
                <Button
                  type="text"
                  icon={<RightOutlined />}
                  style={{
                    color: module.color,
                    fontWeight: 600,
                    padding: 0,
                  }}
                >
                  Truy cập
                </Button>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Quick Info */}
      <div
        style={{
          textAlign: "center",
          marginTop: 48,
          padding: 24,
          background: "#f8f9fa",
          borderRadius: 8,
        }}
      >
        <Text type="secondary">
          <strong>✨ Workflow đã được tối ưu:</strong> Từ 14 modules phức tạp
          xuống còn 4 modules cốt lõi cần thiết.
          <br />
          Tập trung vào những chức năng quan trọng nhất để quản lý dự án và công
          việc hiệu quả.
        </Text>
      </div>
    </div>
  );
};

export default WorkflowOverview;

