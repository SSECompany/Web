import { EditOutlined, FileTextOutlined, PlusOutlined, SearchOutlined } from "@ant-design/icons";
import { Button, Card, Col, Input, Row, Space, Table, Tag, Typography } from "antd";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./WikiPageList.css";

const { Title, Text } = Typography;

const WikiPageList = () => {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const [searchText, setSearchText] = useState("");

  // Sample data
  const [wikiPages, setWikiPages] = useState([
    {
      key: "1",
      id: "home",
      title: "Trang chủ",
      project: "Website mới",
      author: "Nguyễn Văn A",
      updatedDate: "2024-02-10",
      version: 3,
    },
    {
      key: "2",
      id: "api-documentation",
      title: "Tài liệu API",
      project: "API Documentation",
      author: "Trần Thị B",
      updatedDate: "2024-02-12",
      version: 5,
    },
    {
      key: "3",
      id: "user-guide",
      title: "Hướng dẫn sử dụng",
      project: "Website mới",
      author: "Lê Văn C",
      updatedDate: "2024-02-08",
      version: 2,
    },
  ]);

  const columns = [
    {
      title: "Tiêu đề",
      dataIndex: "title",
      key: "title",
      render: (text, record) => (
        <Space>
          <FileTextOutlined />
          <a
            onClick={() =>
              navigate(`/workflow/wiki/project/${projectId || "all"}/page/${record.id}`)
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
      width: 200,
    },
    {
      title: "Người cập nhật",
      dataIndex: "author",
      key: "author",
      width: 150,
    },
    {
      title: "Ngày cập nhật",
      dataIndex: "updatedDate",
      key: "updatedDate",
      width: 130,
      render: (date) => new Date(date).toLocaleDateString("vi-VN"),
    },
    {
      title: "Phiên bản",
      dataIndex: "version",
      key: "version",
      width: 100,
      render: (version) => <Tag color="blue">v{version}</Tag>,
    },
    {
      title: "Thao tác",
      key: "action",
      width: 100,
      render: (_, record) => (
        <Button
          type="link"
          icon={<EditOutlined />}
          onClick={() =>
            navigate(`/workflow/wiki/project/${projectId || "all"}/page/${record.id}/edit`)
          }
        >
          Sửa
        </Button>
      ),
    },
  ];

  return (
    <div className="wiki-page-list">
      <Card>
        <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
          <Col>
            <Title level={3} style={{ margin: 0 }}>
              📚 Wiki
            </Title>
          </Col>
          <Col>
            <Space>
              <Input
                placeholder="Tìm kiếm trang..."
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ width: 300 }}
              />
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() =>
                  navigate(`/workflow/wiki/project/${projectId || "all"}/page/new`)
                }
              >
                Tạo trang mới
              </Button>
            </Space>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={wikiPages}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} trang`,
          }}
        />
      </Card>
    </div>
  );
};

export default WikiPageList;


