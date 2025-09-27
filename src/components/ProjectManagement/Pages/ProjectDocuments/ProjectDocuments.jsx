import React from "react";
import { useParams } from "react-router-dom";
import { Card, Table, Button, Space } from "antd";
import { FileOutlined, DownloadOutlined } from "@ant-design/icons";

const ProjectDocuments = () => {
  const { id } = useParams();

  const columns = [
    {
      title: "Tên tài liệu",
      dataIndex: "name",
      key: "name",
      render: (text) => (
        <Space>
          <FileOutlined />
          {text}
        </Space>
      ),
    },
    {
      title: "Loại",
      dataIndex: "type",
      key: "type",
    },
    {
      title: "Kích thước",
      dataIndex: "size",
      key: "size",
    },
    {
      title: "Ngày tải lên",
      dataIndex: "uploadDate",
      key: "uploadDate",
    },
    {
      title: "Thao tác",
      key: "action",
      render: () => (
        <Button icon={<DownloadOutlined />} type="link">
          Tải xuống
        </Button>
      ),
    },
  ];

  const data = [
    {
      key: "1",
      name: "Báo cáo tiến độ tháng 1",
      type: "PDF",
      size: "2.5 MB",
      uploadDate: "2024-01-15",
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Card title={`Tài liệu dự án #${id}`}>
        <Table columns={columns} dataSource={data} />
      </Card>
    </div>
  );
};

export default ProjectDocuments;









