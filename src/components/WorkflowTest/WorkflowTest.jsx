import { CheckSquareOutlined, ProjectOutlined } from "@ant-design/icons";
import { Button, Card, Col, Row } from "antd";
import { useNavigate } from "react-router-dom";

const WorkflowTest = () => {
  const navigate = useNavigate();

  return (
    <div style={{ padding: 24 }}>
      <h1>🎯 WORKFLOW</h1>
      <p>Chào mừng bạn đến với hệ thống quản lý dự án và công việc!</p>

      <Row gutter={[24, 24]}>
        <Col xs={24} md={12}>
          <Card
            title="📊 Quản lý dự án"
            bordered={false}
            actions={[
              <Button
                type="primary"
                icon={<ProjectOutlined />}
                onClick={() => navigate("/project-management/projects")}
              >
                Xem danh sách dự án
              </Button>,
            ]}
          >
            <ul>
              <li>✅ Thêm mới/sửa/xóa/xem/in dự án</li>
              <li>✅ Quản lý tài liệu dự án</li>
              <li>✅ Quản lý trao đổi về dự án</li>
              <li>✅ Quản lý nguồn lực nhân sự dự án</li>
              <li>✅ Báo cáo tiến độ/khối lượng/chi phí/KPI</li>
            </ul>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card
            title="📋 Quản lý công việc"
            bordered={false}
            actions={[
              <Button
                type="primary"
                icon={<CheckSquareOutlined />}
                onClick={() => navigate("/task-management/tasks")}
              >
                Xem danh sách công việc
              </Button>,
            ]}
          >
            <ul>
              <li>✅ Thêm mới/sửa/xóa/xem/in công việc</li>
              <li>✅ Giao việc</li>
              <li>✅ Nhắc việc</li>
              <li>✅ Báo cáo tiến độ công việc</li>
              <li>✅ Báo cáo KPI hoàn thành công việc</li>
            </ul>
          </Card>
        </Col>
      </Row>

      <div style={{ marginTop: 32 }}>
        <h3>🔗 Links trực tiếp:</h3>
        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
          <Button onClick={() => navigate("/project-management/projects")}>
            Danh sách dự án
          </Button>
          <Button
            onClick={() => navigate("/project-management/reports/progress")}
          >
            Báo cáo tiến độ dự án
          </Button>
          <Button onClick={() => navigate("/task-management/tasks")}>
            Danh sách công việc
          </Button>
          <Button onClick={() => navigate("/task-management/assignment")}>
            Giao việc
          </Button>
          <Button onClick={() => navigate("/task-management/reminders")}>
            Nhắc việc
          </Button>
          <Button onClick={() => navigate("/task-management/reports/progress")}>
            Báo cáo tiến độ công việc
          </Button>
        </div>
      </div>
    </div>
  );
};

export default WorkflowTest;
