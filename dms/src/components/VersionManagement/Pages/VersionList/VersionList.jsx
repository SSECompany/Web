import { CalendarOutlined, PlusOutlined, TagOutlined } from "@ant-design/icons";
import { Button, Card, Col, Progress, Row, Space, Table, Tag, Typography } from "antd";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./VersionList.css";

const { Title, Text } = Typography;

const VersionList = () => {
  const navigate = useNavigate();
  const { projectId } = useParams();

  // Sample data
  const [versions, setVersions] = useState([
    {
      key: "1",
      id: "v1.0.0",
      name: "Version 1.0.0",
      project: "Website mới",
      status: "released",
      releaseDate: "2024-02-15",
      dueDate: "2024-02-15",
      description: "Phiên bản đầu tiên",
      issuesTotal: 50,
      issuesCompleted: 50,
      issuesOpen: 0,
      progress: 100,
    },
    {
      key: "2",
      id: "v1.1.0",
      name: "Version 1.1.0",
      project: "Website mới",
      status: "in_progress",
      releaseDate: "2024-03-01",
      dueDate: "2024-03-01",
      description: "Cải tiến và sửa lỗi",
      issuesTotal: 30,
      issuesCompleted: 20,
      issuesOpen: 10,
      progress: 66.7,
    },
    {
      key: "3",
      id: "v2.0.0",
      name: "Version 2.0.0",
      project: "Website mới",
      status: "planned",
      releaseDate: "2024-04-01",
      dueDate: "2024-04-01",
      description: "Phiên bản lớn với nhiều tính năng mới",
      issuesTotal: 100,
      issuesCompleted: 10,
      issuesOpen: 90,
      progress: 10,
    },
  ]);

  const getStatusTag = (status) => {
    const statusConfig = {
      released: { color: "success", text: "Đã phát hành" },
      in_progress: { color: "processing", text: "Đang phát triển" },
      planned: { color: "default", text: "Đã lên kế hoạch" },
      closed: { color: "default", text: "Đã đóng" },
    };
    const config = statusConfig[status] || statusConfig.planned;
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const columns = [
    {
      title: "Tên phiên bản",
      dataIndex: "name",
      key: "name",
      render: (text, record) => (
        <Space>
          <TagOutlined />
          <a
            onClick={() =>
              navigate(`/workflow/version-management/project/${projectId || "all"}/version/${record.id}`)
            }
          >
            {text}
          </a>
        </Space>
      ),
    },
    {
      title: "Dự án",
      dataIndex: "project",
      key: "project",
      width: 150,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 130,
      render: getStatusTag,
    },
    {
      title: "Ngày phát hành",
      dataIndex: "releaseDate",
      key: "releaseDate",
      width: 130,
      render: (date) => (
        <Space>
          <CalendarOutlined />
          {new Date(date).toLocaleDateString("vi-VN")}
        </Space>
      ),
    },
    {
      title: "Issues",
      key: "issues",
      width: 200,
      render: (_, record) => (
        <Space direction="vertical" size="small" style={{ width: "100%" }}>
          <div>
            <Text type="secondary">Tổng: </Text>
            <Text strong>{record.issuesTotal}</Text>
            <Text type="secondary" style={{ marginLeft: 8 }}>
              Hoàn thành: {record.issuesCompleted} | Mở: {record.issuesOpen}
            </Text>
          </div>
          <Progress
            percent={record.progress}
            size="small"
            status={record.progress === 100 ? "success" : "active"}
          />
        </Space>
      ),
    },
    {
      title: "Mô tả",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
    },
  ];

  return (
    <div className="version-list">
      <Card>
        <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
          <Col>
            <Title level={3} style={{ margin: 0 }}>
              🏷️ Quản lý Phiên bản
            </Title>
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() =>
                navigate(`/workflow/version-management/project/${projectId || "all"}/version/new`)
              }
            >
              Tạo phiên bản mới
            </Button>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={versions}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} phiên bản`,
          }}
          scroll={{ x: 1200 }}
        />
      </Card>
    </div>
  );
};

export default VersionList;


