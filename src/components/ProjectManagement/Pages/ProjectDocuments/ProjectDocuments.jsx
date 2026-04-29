import React, { useState } from "react";
import { useParams } from "react-router-dom";
import {
  Card,
  Table,
  Button,
  Space,
  Modal,
  Tag,
  Tooltip,
  Dropdown,
  message,
  Upload,
} from "antd";
import {
  FileOutlined,
  DownloadOutlined,
  EyeOutlined,
  HistoryOutlined,
  FilePdfOutlined,
  FileImageOutlined,
  FileWordOutlined,
  FileExcelOutlined,
  FileUnknownOutlined,
  PlusOutlined,
  MoreOutlined,
} from "@ant-design/icons";

const { Dragger } = Upload;

const ProjectDocuments = () => {
  const { id } = useParams();
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewDocument, setPreviewDocument] = useState(null);
  const [versionModalVisible, setVersionModalVisible] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);

  const getFileIcon = (type) => {
    const normalized = type?.toLowerCase();
    if (normalized === "pdf") return <FilePdfOutlined style={{ color: "#ff4d4f" }} />;
    if (["png", "jpg", "jpeg", "gif"].includes(normalized))
      return <FileImageOutlined style={{ color: "#1890ff" }} />;
    if (["doc", "docx"].includes(normalized))
      return <FileWordOutlined style={{ color: "#2f54eb" }} />;
    if (["xls", "xlsx", "csv"].includes(normalized))
      return <FileExcelOutlined style={{ color: "#52c41a" }} />;
    return <FileUnknownOutlined style={{ color: "#8c8c8c" }} />;
  };

  const handlePreview = (record) => {
    setPreviewDocument(record);
    setPreviewVisible(true);
  };

  const handleViewVersions = (record) => {
    setSelectedDocument(record);
    setVersionModalVisible(true);
  };

  const columns = [
    {
      title: "Tên tài liệu",
      dataIndex: "name",
      key: "name",
      render: (text, record) => (
        <Space>
          {getFileIcon(record.type)}
          <span>{text}</span>
          {record.version > 1 && (
            <Tag color="blue">v{record.version}</Tag>
          )}
        </Space>
      ),
    },
    {
      title: "Loại",
      dataIndex: "type",
      key: "type",
      render: (type) => <Tag>{type.toUpperCase()}</Tag>,
    },
    {
      title: "Kích thước",
      dataIndex: "size",
      key: "size",
    },
    {
      title: "Phiên bản",
      dataIndex: "version",
      key: "version",
      render: (version) => (
        <Tag color={version > 1 ? "blue" : "default"}>
          v{version}
        </Tag>
      ),
    },
    {
      title: "Người tải lên",
      dataIndex: "uploadedBy",
      key: "uploadedBy",
    },
    {
      title: "Ngày tải lên",
      dataIndex: "uploadDate",
      key: "uploadDate",
    },
    {
      title: "Thao tác",
      key: "action",
      width: 200,
      render: (_, record) => (
        <Space>
          <Tooltip title="Xem trước">
            <Button
              icon={<EyeOutlined />}
              type="link"
              onClick={() => handlePreview(record)}
            >
              Xem
            </Button>
          </Tooltip>
          <Tooltip title="Tải xuống">
            <Button icon={<DownloadOutlined />} type="link">
              Tải
            </Button>
          </Tooltip>
          {record.version > 1 && (
            <Tooltip title="Lịch sử phiên bản">
              <Button
                icon={<HistoryOutlined />}
                type="link"
                onClick={() => handleViewVersions(record)}
              >
                Phiên bản
              </Button>
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  const data = [
    {
      key: "1",
      name: "Báo cáo tiến độ tháng 1",
      type: "pdf",
      size: "2.5 MB",
      version: 3,
      uploadedBy: "Nguyễn Văn A",
      uploadDate: "2024-01-15",
      url: "#",
    },
    {
      key: "2",
      name: "Thiết kế UI/UX",
      type: "fig",
      size: "5.2 MB",
      version: 1,
      uploadedBy: "Trần Thị B",
      uploadDate: "2024-01-20",
      url: "#",
    },
  ];

  const versionHistory = selectedDocument
    ? [
        {
          version: 3,
          uploadedBy: "Nguyễn Văn A",
          uploadDate: "2024-01-15",
          size: "2.5 MB",
          changes: "Cập nhật số liệu tháng 1",
        },
        {
          version: 2,
          uploadedBy: "Nguyễn Văn A",
          uploadDate: "2024-01-10",
          size: "2.3 MB",
          changes: "Sửa lỗi chính tả",
        },
        {
          version: 1,
          uploadedBy: "Nguyễn Văn A",
          uploadDate: "2024-01-05",
          size: "2.1 MB",
          changes: "Phiên bản đầu tiên",
        },
      ]
    : [];

  return (
    <div style={{ padding: 24 }}>
      <Card
        title={`Tài liệu dự án #${id}`}
        extra={
          <Upload
            showUploadList={false}
            beforeUpload={() => {
              message.success("Tài liệu đã được tải lên thành công");
              return false;
            }}
          >
            <Button type="primary" icon={<PlusOutlined />}>
              Tải lên tài liệu
            </Button>
          </Upload>
        }
      >
        <Table
          columns={columns}
          dataSource={data}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `Tổng ${total} tài liệu`,
          }}
        />
      </Card>

      {/* Preview Modal */}
      <Modal
        title={`Xem trước: ${previewDocument?.name}`}
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        footer={[
          <Button key="download" icon={<DownloadOutlined />}>
            Tải xuống
          </Button>,
          <Button key="close" onClick={() => setPreviewVisible(false)}>
            Đóng
          </Button>,
        ]}
        width={800}
      >
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          {previewDocument?.type === "pdf" ? (
            <iframe
              src={previewDocument?.url || "#"}
              style={{ width: "100%", height: "600px", border: "none" }}
              title="Preview"
            />
          ) : (
            <div>
              <FileOutlined style={{ fontSize: 64, color: "#1890ff" }} />
              <p style={{ marginTop: 16 }}>
                Xem trước không khả dụng cho loại file này. Vui lòng tải xuống để xem.
              </p>
            </div>
          )}
        </div>
      </Modal>

      {/* Version History Modal */}
      <Modal
        title={`Lịch sử phiên bản: ${selectedDocument?.name}`}
        open={versionModalVisible}
        onCancel={() => setVersionModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setVersionModalVisible(false)}>
            Đóng
          </Button>,
        ]}
      >
        <Table
          dataSource={versionHistory}
          columns={[
            {
              title: "Phiên bản",
              dataIndex: "version",
              key: "version",
              render: (version) => <Tag color="blue">v{version}</Tag>,
            },
            {
              title: "Người tải lên",
              dataIndex: "uploadedBy",
              key: "uploadedBy",
            },
            {
              title: "Ngày tải lên",
              dataIndex: "uploadDate",
              key: "uploadDate",
            },
            {
              title: "Kích thước",
              dataIndex: "size",
              key: "size",
            },
            {
              title: "Thay đổi",
              dataIndex: "changes",
              key: "changes",
            },
            {
              title: "Thao tác",
              key: "action",
              render: (_, record) => (
                <Button icon={<DownloadOutlined />} type="link" size="small">
                  Tải
                </Button>
              ),
            },
          ]}
          pagination={false}
          size="small"
        />
      </Modal>
    </div>
  );
};

export default ProjectDocuments;









