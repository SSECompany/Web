import React from "react";
import { useParams } from "react-router-dom";
import { Card, Table, Tag, Button, Space } from "antd";
import { UserOutlined, PlusOutlined } from "@ant-design/icons";

const ProjectResources = () => {
  const { id } = useParams();

  const columns = [
    {
      title: "Tên nhân viên",
      dataIndex: "name",
      key: "name",
      render: (text) => (
        <Space>
          <UserOutlined />
          {text}
        </Space>
      ),
    },
    {
      title: "Vị trí",
      dataIndex: "position",
      key: "position",
    },
    {
      title: "Vai trò trong dự án",
      dataIndex: "role",
      key: "role",
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag color={status === "active" ? "green" : "default"}>
          {status === "active" ? "Đang làm việc" : "Không hoạt động"}
        </Tag>
      ),
    },
    {
      title: "Ngày tham gia",
      dataIndex: "joinDate",
      key: "joinDate",
    },
  ];

  const data = [
    {
      key: "1",
      name: "Nguyễn Văn A",
      position: "Senior Developer",
      role: "Team Lead",
      status: "active",
      joinDate: "2024-01-01",
    },
    {
      key: "2",
      name: "Trần Thị B",
      position: "UI/UX Designer",
      role: "Designer",
      status: "active",
      joinDate: "2024-01-05",
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Card 
        title={`Nguồn lực dự án #${id}`}
        extra={
          <Button type="primary" icon={<PlusOutlined />}>
            Thêm nhân viên
          </Button>
        }
      >
        <Table columns={columns} dataSource={data} />
      </Card>
    </div>
  );
};

export default ProjectResources;









