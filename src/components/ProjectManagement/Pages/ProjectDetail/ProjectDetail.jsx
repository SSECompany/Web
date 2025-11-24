import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  Descriptions,
  Tag,
  Space,
  Tabs,
  Row,
  Col,
  Button,
  Table,
  Avatar,
  Typography,
  Progress,
  List,
  Upload,
  Input,
  Form,
  Mentions,
  Timeline,
  Select,
  notification,
  Statistic,
  Tooltip,
  Empty,
} from "antd";
import {
  FileTextOutlined,
  TeamOutlined,
  MessageOutlined,
  PaperClipOutlined,
  EditOutlined,
  PlusOutlined,
  DeleteOutlined,
  HistoryOutlined,
  PushpinOutlined,
  LikeOutlined,
  CommentOutlined,
  FilePdfOutlined,
  FileImageOutlined,
  FileWordOutlined,
  FileUnknownOutlined,
  FileExcelOutlined,
  FilterOutlined,
} from "@ant-design/icons";
import { apiGetProject } from "../../API";
import {
  getSampleProjects,
  getSampleActivities,
} from "../../../WorkflowApp/utils/workflowSampleData";
import "./ProjectDetail.css";
import dayjs from "dayjs";

const { TextArea } = Input;
const { Dragger } = Upload;
const { Option } = Select;
const { Text, Title, Paragraph } = Typography;

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [project, setProject] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [postForm] = Form.useForm();
  const [documentFilter, setDocumentFilter] = useState("ALL");
  const [postFilter, setPostFilter] = useState("ALL");
  const [logTypeFilter, setLogTypeFilter] = useState("ALL");
  const [logUserFilter, setLogUserFilter] = useState("ALL");
  const [logSearchKeyword, setLogSearchKeyword] = useState("");

  // Sample data for tabs
  const [documents, setDocuments] = useState([
    {
      id: "1",
      name: "Tài liệu yêu cầu.pdf",
      size: "2.5 MB",
      uploadedBy: "Nguyễn Văn A",
      uploadedDate: "2024-02-10",
      type: "pdf",
    },
    {
      id: "2",
      name: "Thiết kế UI.fig",
      size: "5.2 MB",
      uploadedBy: "Trần Thị B",
      uploadedDate: "2024-02-12",
      type: "fig",
    },
  ]);

  const [posts, setPosts] = useState([
    {
      id: "POST-001",
      author: "Nguyễn Văn A",
      content: "Dự án đang tiến triển tốt, cần review code vào tuần tới.",
      createdDate: "2024-02-15 10:30",
      mentions: ["Trần Thị B"],
      attachments: [{ name: "Checklist.xlsx", size: "120KB" }],
      likes: 6,
      comments: 3,
      isPinned: true,
    },
    {
      id: "POST-002",
      author: "Trần Thị B",
      content: "Đã hoàn thành phần UI, đang chờ feedback của cả team.",
      createdDate: "2024-02-14 14:20",
      mentions: [],
      attachments: [],
      likes: 2,
      comments: 1,
      isPinned: false,
    },
  ]);
  const [postAttachments, setPostAttachments] = useState([]);

  const [resources, setResources] = useState([
    {
      id: "1",
      name: "Nguyễn Văn A",
      role: "Developer",
      allocation: 100,
      startDate: "2024-01-01",
      endDate: "2024-03-31",
    },
    {
      id: "2",
      name: "Trần Thị B",
      role: "Designer",
      allocation: 80,
      startDate: "2024-01-15",
      endDate: "2024-03-15",
    },
  ]);

  const [tasks, setTasks] = useState([
    {
      id: "1",
      title: "Thiết kế database",
      status: "COMPLETED",
      assignee: "Nguyễn Văn A",
      progress: 100,
    },
    {
      id: "2",
      title: "Phát triển API",
      status: "IN_PROGRESS",
      assignee: "Nguyễn Văn A",
      progress: 75,
    },
    {
      id: "3",
      title: "Thiết kế UI/UX",
      status: "IN_PROGRESS",
      assignee: "Trần Thị B",
      progress: 60,
    },
  ]);

  const projectActivities = useMemo(() => {
    const activities = getSampleActivities();
    const projectKey = project?.id || id;
    return activities.filter((activity) => activity.projectId === projectKey);
  }, [project?.id, id]);

  useEffect(() => {
    if (id) {
      loadProject();
    }
  }, [id]);

  const loadProject = async () => {
    setLoading(true);
    try {
      const response = await apiGetProject({ projectId: id });
      if (response?.data) {
        setProject(response.data);
      } else {
        applySampleProjectFallback();
      }
    } catch (error) {
      console.error("Error loading project:", error);
      applySampleProjectFallback();
    } finally {
      setLoading(false);
    }
  };

  const applySampleProjectFallback = () => {
    const sampleProject =
      getSampleProjects().find((project) => project.id === id) || null;

    if (sampleProject) {
      setProject({
        id: sampleProject.id,
        code: sampleProject.projectCode,
        name: sampleProject.projectName,
        status: sampleProject.status,
        priority: sampleProject.priority,
        manager: sampleProject.projectManager,
        progress: sampleProject.progress,
        startDate: sampleProject.startDate,
        endDate: sampleProject.endDate,
        description:
          "Thông tin dự án đang lấy từ dữ liệu mẫu để mô phỏng liên kết.",
        budget: sampleProject.budget,
        spentBudget: Math.round(sampleProject.budget * 0.6),
      });
    } else {
      setProject({
        id,
        code: "PRJ-DEMO",
        name: "Dự án demo",
        status: "IN_PROGRESS",
        priority: "MEDIUM",
        manager: "Workflow System",
        progress: 60,
        startDate: dayjs().startOf("month").format("YYYY-MM-DD"),
        endDate: dayjs().endOf("month").format("YYYY-MM-DD"),
        description:
          "Dự án đang sử dụng dữ liệu mẫu do chưa kết nối API thật.",
        budget: 200000000,
        spentBudget: 120000000,
      });
    }
  };

  const handleCreatePost = (values) => {
    const newPost = {
      id: `POST-${Date.now()}`,
      author: "Nguyễn Văn A",
      content: values.content,
      mentions: values.mentions || [],
      attachments: postAttachments.map((file) => ({
        name: file.name,
        size: `${(file.size / 1024).toFixed(1)}KB`,
        uid: file.uid,
      })),
      createdDate: dayjs().format("DD/MM/YYYY HH:mm"),
      likes: 0,
      comments: 0,
      isPinned: false,
    };
    setPosts([newPost, ...posts]);
    setPostAttachments([]);
    postForm.resetFields();
    notification.success({
      message: "Đã đăng bài",
      description: "Nội dung trao đổi đã được chia sẻ với dự án.",
    });
  };

  const handleRemoveAttachment = (file) => {
    setPostAttachments((prev) => prev.filter((item) => item.uid !== file.uid));
  };

  const handleBeforeUpload = (file) => {
    setPostAttachments((prev) => [...prev, file]);
    return false;
  };

  const mentionOptions = resources.map((member) => ({
    label: member.name,
    value: member.name,
  }));

  const currentUserName = "Nguyễn Văn A";

  const documentTypeOptions = useMemo(() => {
    const uniqueTypes = Array.from(
      new Set(documents.map((doc) => (doc.type || "OTHER").toUpperCase()))
    );
    return ["ALL", ...uniqueTypes];
  }, [documents]);

  const filteredDocuments = useMemo(() => {
    if (documentFilter === "ALL") {
      return documents;
    }
    return documents.filter(
      (doc) => (doc.type || "OTHER").toUpperCase() === documentFilter
    );
  }, [documents, documentFilter]);

  const documentStats = useMemo(() => {
    const stats = documents.reduce((acc, doc) => {
      const key = (doc.type || "OTHER").toUpperCase();
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const totalSize = documents.reduce((sum, doc) => {
      const numeric = parseFloat(doc.size);
      if (!Number.isFinite(numeric)) {
        return sum;
      }
      if (doc.size?.toUpperCase().includes("KB")) {
        return sum + numeric / 1024;
      }
      return sum + numeric;
    }, 0);

    return { stats, totalSize };
  }, [documents]);

  const postFilterOptions = [
    { value: "ALL", label: "Tất cả" },
    { value: "PINNED", label: "Đang ghim" },
    { value: "MENTIONED", label: "Có tag tôi" },
  ];

  const orderedPosts = useMemo(() => {
    let data = [...posts].sort(
      (a, b) => Number(b.isPinned) - Number(a.isPinned)
    );

    if (postFilter === "PINNED") {
      data = data.filter((post) => post.isPinned);
    } else if (postFilter === "MENTIONED") {
      data = data.filter((post) =>
        post.mentions?.some((mention) => mention === currentUserName)
      );
    }

    return data;
  }, [posts, postFilter, currentUserName]);

  const postStats = useMemo(
    () => ({
      total: posts.length,
      pinned: posts.filter((post) => post.isPinned).length,
      mentions: posts.reduce(
        (acc, post) => acc + (post.mentions?.length || 0),
        0
      ),
    }),
    [posts]
  );

  const logTypeOptions = useMemo(
    () => [
      { value: "ALL", label: "Tất cả hành động" },
      ...Object.entries(activityTypeLabels).map(([value, label]) => ({
        value,
        label,
      })),
    ],
    []
  );

  const logUserOptions = useMemo(() => {
    const uniqueUsers = Array.from(
      new Set(projectActivities.map((activity) => activity.user).filter(Boolean))
    );
    return ["ALL", ...uniqueUsers];
  }, [projectActivities]);

  const filteredLogs = useMemo(() => {
    return projectActivities.filter((activity) => {
      const matchType =
        logTypeFilter === "ALL" || activity.type === logTypeFilter;
      const matchUser =
        logUserFilter === "ALL" || activity.user === logUserFilter;
      const matchKeyword =
        !logSearchKeyword ||
        activity.target
          ?.toLowerCase()
          .includes(logSearchKeyword.toLowerCase()) ||
        activity.action
          ?.toLowerCase()
          .includes(logSearchKeyword.toLowerCase());
      return matchType && matchUser && matchKeyword;
    });
  }, [projectActivities, logTypeFilter, logUserFilter, logSearchKeyword]);

  const logSummary = useMemo(() => {
    return Object.entries(activityTypeLabels).map(([key, label]) => ({
      key,
      label,
      count: projectActivities.filter((activity) => activity.type === key)
        .length,
    }));
  }, [projectActivities]);

  const handleDocumentUpload = (file) => {
    const extension = file.name.split(".").pop()?.toLowerCase() || "other";
    const newDoc = {
      id: `DOC-${Date.now()}`,
      name: file.name,
      size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
      uploadedBy: currentUserName,
      uploadedDate: dayjs().format("YYYY-MM-DD"),
      type: extension,
    };
    setDocuments((prev) => [newDoc, ...prev]);
    notification.success({
      message: "Tải lên thành công",
      description: `${file.name} đã được thêm vào dự án.`,
    });
    return false;
  };

  const handleDeleteDocument = (docId) => {
    setDocuments((prev) => prev.filter((doc) => doc.id !== docId));
    notification.success({
      message: "Đã xóa tài liệu",
      description: "Tài liệu đã bị loại khỏi dự án.",
    });
  };

  const getDocumentIcon = (type) => {
    const normalized = type?.toLowerCase();
    if (normalized === "pdf") return <FilePdfOutlined style={{ color: "#ff4d4f" }} />;
    if (["png", "jpg", "jpeg", "gif", "fig"].includes(normalized))
      return <FileImageOutlined style={{ color: "#1890ff" }} />;
    if (["doc", "docx"].includes(normalized))
      return <FileWordOutlined style={{ color: "#2f54eb" }} />;
    if (["xls", "xlsx", "csv"].includes(normalized))
      return <FileExcelOutlined style={{ color: "#52c41a" }} />;
    return <FileUnknownOutlined style={{ color: "#8c8c8c" }} />;
  };

  const handleTogglePin = (postId) => {
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId ? { ...post, isPinned: !post.isPinned } : post
      )
    );
  };

  const handleReactPost = (postId) => {
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId ? { ...post, likes: (post.likes || 0) + 1 } : post
      )
    );
  };

  const handleCommentPost = (postId) => {
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId ? { ...post, comments: (post.comments || 0) + 1 } : post
      )
    );
    notification.info({
      message: "Thêm bình luận",
      description: "Tính năng bình luận chi tiết sẽ được kết nối API sau.",
    });
  };

  const activityTypeLabels = {
    issue_created: "Tạo issue",
    issue_updated: "Cập nhật issue",
    issue_completed: "Hoàn thành issue",
    comment_added: "Thêm bình luận",
    wiki_updated: "Cập nhật wiki",
    time_entry_added: "Ghi nhận thời gian",
    task_assigned: "Giao công việc",
    version_released: "Phát hành phiên bản",
    version_planned: "Kế hoạch phiên bản",
  };

  const documentColumns = [
    {
      title: "Tên file",
      dataIndex: "name",
      key: "name",
      render: (text, record) => (
        <Space>
          {getDocumentIcon(record.type)}
          <Space direction="vertical" size={0}>
            <a>{text}</a>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.uploadedBy} · {record.uploadedDate}
            </Text>
          </Space>
        </Space>
      ),
    },
    {
      title: "Kích thước",
      dataIndex: "size",
      key: "size",
      width: 120,
    },
    {
      title: "Loại",
      dataIndex: "type",
      key: "type",
      width: 100,
      render: (type) => (
        <Tag color="blue">{(type || "OTHER").toUpperCase()}</Tag>
      ),
    },
    {
      title: "Người tải lên",
      dataIndex: "uploadedBy",
      key: "uploadedBy",
      width: 150,
    },
    {
      title: "Ngày tải lên",
      dataIndex: "uploadedDate",
      key: "uploadedDate",
      width: 130,
    },
    {
      title: "Thao tác",
      key: "action",
      width: 100,
      render: (_, record) => (
        <Space>
          <Button type="link" size="small">
            Tải xuống
          </Button>
          <Button
            type="link"
            danger
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteDocument(record.id)}
          >
            Xóa
          </Button>
        </Space>
      ),
    },
  ];

  const resourceColumns = [
    {
      title: "Tên",
      dataIndex: "name",
      key: "name",
      render: (text) => (
        <Space>
          <Avatar>{text[0]}</Avatar>
          <Text>{text}</Text>
        </Space>
      ),
    },
    {
      title: "Vai trò",
      dataIndex: "role",
      key: "role",
      width: 150,
    },
    {
      title: "Phân bổ",
      dataIndex: "allocation",
      key: "allocation",
      width: 150,
      render: (allocation) => (
        <Progress percent={allocation} size="small" status="active" />
      ),
    },
    {
      title: "Thời gian",
      key: "period",
      render: (_, record) => (
        <Text>
          {record.startDate} - {record.endDate}
        </Text>
      ),
    },
  ];

  const taskColumns = [
    {
      title: "Công việc",
      dataIndex: "title",
      key: "title",
      render: (text, record) => (
        <a onClick={() => navigate(`/workflow/task-management/task/${record.id}`)}>
          {text}
        </a>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status) => {
        const statusConfig = {
          COMPLETED: { color: "success", text: "Hoàn thành" },
          IN_PROGRESS: { color: "processing", text: "Đang thực hiện" },
          PENDING: { color: "default", text: "Chờ xử lý" },
        };
        const config = statusConfig[status] || statusConfig.PENDING;
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: "Người thực hiện",
      dataIndex: "assignee",
      key: "assignee",
      width: 150,
    },
    {
      title: "Tiến độ",
      dataIndex: "progress",
      key: "progress",
      width: 150,
      render: (progress) => <Progress percent={progress} size="small" />,
    },
  ];

  if (!project) {
    return <div>Loading...</div>;
  }

  return (
    <div className="project-detail-container">
      <Card
        title={
          <Space>
            <Title level={3} style={{ margin: 0 }}>
              {project.name}
            </Title>
            <Tag color="processing">{project.status}</Tag>
          </Space>
        }
        extra={
          <Space>
            <Button icon={<EditOutlined />}>Chỉnh sửa</Button>
          </Space>
        }
        loading={loading}
      >
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: "overview",
              label: "Tổng quan",
              children: (
                <Row gutter={[16, 16]}>
                  <Col xs={24} lg={16}>
                    <Descriptions bordered column={2}>
                      <Descriptions.Item label="Mã dự án">
                        {project.code}
                      </Descriptions.Item>
                      <Descriptions.Item label="Tên dự án">
                        {project.name}
                      </Descriptions.Item>
                      <Descriptions.Item label="Trạng thái">
                        <Tag color="processing">Đang thực hiện</Tag>
                      </Descriptions.Item>
                      <Descriptions.Item label="Độ ưu tiên">
                        <Tag color="orange">Cao</Tag>
                      </Descriptions.Item>
                      <Descriptions.Item label="Quản lý dự án">
                        {project.manager}
                      </Descriptions.Item>
                      <Descriptions.Item label="Tiến độ">
                        <Progress percent={project.progress} />
                      </Descriptions.Item>
                      <Descriptions.Item label="Ngày bắt đầu">
                        {project.startDate}
                      </Descriptions.Item>
                      <Descriptions.Item label="Ngày kết thúc">
                        {project.endDate}
                      </Descriptions.Item>
                      <Descriptions.Item label="Ngân sách" span={2}>
                        {project.budget
                          ? `${(project.budget / 1000000).toFixed(0)}M VNĐ`
                          : "-"}
                      </Descriptions.Item>
                    </Descriptions>

                    {project.description && (
                      <Card title="Mô tả" style={{ marginTop: 16 }}>
                        <Paragraph>{project.description}</Paragraph>
                      </Card>
                    )}
                  </Col>
                  <Col xs={24} lg={8}>
                    <Card title="Thống kê">
                      <Space direction="vertical" style={{ width: "100%" }}>
                        <div>
                          <Text type="secondary">Tổng công việc: </Text>
                          <Text strong>{tasks.length}</Text>
                        </div>
                        <div>
                          <Text type="secondary">Hoàn thành: </Text>
                          <Text strong>
                            {tasks.filter((t) => t.status === "COMPLETED").length}
                          </Text>
                        </div>
                        <div>
                          <Text type="secondary">Đang thực hiện: </Text>
                          <Text strong>
                            {tasks.filter((t) => t.status === "IN_PROGRESS").length}
                          </Text>
                        </div>
                        <div>
                          <Text type="secondary">Thành viên: </Text>
                          <Text strong>{resources.length}</Text>
                        </div>
                      </Space>
                    </Card>
                  </Col>
                </Row>
              ),
            },
            {
              key: "tasks",
              label: "Công việc",
              children: (
                <Table
                  columns={taskColumns}
                  dataSource={tasks}
                  rowKey="id"
                  pagination={false}
                />
              ),
            },
            {
              key: "documents",
              label: (
                <Space>
                  <FileTextOutlined />
                  <span>Tài liệu ({documents.length})</span>
                </Space>
              ),
              children: (
                <Space direction="vertical" style={{ width: "100%" }} size="large">
                  <Row gutter={[16, 16]}>
                    <Col xs={24} md={8}>
                      <Card size="small">
                        <Statistic title="Tổng tài liệu" value={documents.length} />
                      </Card>
                    </Col>
                    <Col xs={24} md={8}>
                      <Card size="small">
                        <Statistic
                          title="Dung lượng đã dùng"
                          value={`${documentStats.totalSize.toFixed(2)} MB`}
                        />
                      </Card>
                    </Col>
                    <Col xs={24} md={8}>
                      <Card size="small">
                        <Statistic
                          title="Loại phổ biến"
                          value={
                            Object.entries(documentStats.stats)
                              .sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A"
                          }
                        />
                      </Card>
                    </Col>
                  </Row>
                  <Space wrap>
                    <Select
                      value={documentFilter}
                      style={{ minWidth: 200 }}
                      onChange={setDocumentFilter}
                    >
                      {documentTypeOptions.map((type) => (
                        <Option key={type} value={type}>
                          {type === "ALL" ? "Tất cả" : type}
                        </Option>
                      ))}
                    </Select>
                    <Button
                      icon={<FilterOutlined />}
                      onClick={() => setDocumentFilter("ALL")}
                    >
                      Bỏ lọc
                    </Button>
                    <Space size={[4, 4]} wrap>
                      {Object.entries(documentStats.stats).map(([type, count]) => (
                        <Tag key={type} color="blue">
                          {type}: {count}
                        </Tag>
                      ))}
                    </Space>
                  </Space>
                  <Dragger
                    multiple
                    showUploadList={false}
                    beforeUpload={handleDocumentUpload}
                  >
                    <p className="ant-upload-drag-icon">
                      <FileTextOutlined />
                    </p>
                    <p className="ant-upload-text">
                      Kéo thả hoặc bấm để tải tài liệu mới
                    </p>
                    <p className="ant-upload-hint">
                      Hỗ trợ PDF, hình ảnh, tài liệu văn bản và bảng tính
                    </p>
                  </Dragger>
                  <Table
                    columns={documentColumns}
                    dataSource={filteredDocuments}
                    rowKey="id"
                    pagination={false}
                  />
                </Space>
              ),
            },
            {
              key: "posts",
              label: (
                <Space>
                  <MessageOutlined />
                  <span>Trao đổi (Post)</span>
                </Space>
              ),
              children: (
                <Space direction="vertical" style={{ width: "100%" }} size="large">
                  <Row gutter={[16, 16]}>
                    <Col xs={24} md={8}>
                      <Card size="small">
                        <Statistic title="Tất cả bài đăng" value={postStats.total} />
                      </Card>
                    </Col>
                    <Col xs={24} md={8}>
                      <Card size="small">
                        <Statistic title="Bài đang ghim" value={postStats.pinned} />
                      </Card>
                    </Col>
                    <Col xs={24} md={8}>
                      <Card size="small">
                        <Statistic title="Lượt mention" value={postStats.mentions} />
                      </Card>
                    </Col>
                  </Row>
                  <Space wrap>
                    <Select
                      value={postFilter}
                      onChange={setPostFilter}
                      style={{ minWidth: 200 }}
                    >
                      {postFilterOptions.map((option) => (
                        <Option key={option.value} value={option.value}>
                          {option.label}
                        </Option>
                      ))}
                    </Select>
                    <Tag color="magenta">
                      {orderedPosts.length} bài hiển thị
                    </Tag>
                  </Space>
                  <Card title="Tạo trao đổi mới">
                    <Form
                      form={postForm}
                      layout="vertical"
                      onFinish={handleCreatePost}
                    >
                      <Form.Item
                        name="content"
                        label="Nội dung"
                        rules={[
                          { required: true, message: "Vui lòng nhập nội dung" },
                        ]}
                      >
                        <Mentions
                          rows={4}
                          placeholder="Chia sẻ cập nhật... sử dụng @ để tag thành viên"
                        >
                          {mentionOptions.map((option) => (
                            <Mentions.Option key={option.value} value={option.value}>
                              {option.label}
                            </Mentions.Option>
                          ))}
                        </Mentions>
                      </Form.Item>
                      <Form.Item name="mentions" label="Tag thành viên">
                        <Select
                          mode="multiple"
                          placeholder="Chọn thành viên cần thông báo"
                          allowClear
                        >
                          {mentionOptions.map((option) => (
                            <Option key={option.value} value={option.value}>
                              {option.label}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                      <Upload
                        multiple
                        fileList={postAttachments}
                        beforeUpload={handleBeforeUpload}
                        onRemove={handleRemoveAttachment}
                      >
                        <Button icon={<PaperClipOutlined />}>
                          Đính kèm tài liệu
                        </Button>
                      </Upload>
                      <Space style={{ marginTop: 16 }}>
                        <Button type="primary" htmlType="submit">
                          Share
                        </Button>
                      </Space>
                    </Form>
                  </Card>
                  {orderedPosts.length ? (
                    <List
                      dataSource={orderedPosts}
                      renderItem={(item) => (
                        <List.Item
                          key={item.id}
                          actions={[
                            <Tooltip title="Thả tim" key="like">
                              <Button
                                type="text"
                                icon={<LikeOutlined />}
                                onClick={() => handleReactPost(item.id)}
                              >
                                {item.likes}
                              </Button>
                            </Tooltip>,
                            <Tooltip title="Thêm bình luận" key="comment">
                              <Button
                                type="text"
                                icon={<CommentOutlined />}
                                onClick={() => handleCommentPost(item.id)}
                              >
                                {item.comments}
                              </Button>
                            </Tooltip>,
                            <Tooltip
                              title={item.isPinned ? "Bỏ ghim" : "Ghim bài"}
                              key="pin"
                            >
                              <Button
                                type={item.isPinned ? "primary" : "text"}
                                icon={<PushpinOutlined />}
                                onClick={() => handleTogglePin(item.id)}
                              />
                            </Tooltip>,
                          ]}
                        >
                          <List.Item.Meta
                            avatar={<Avatar>{item.author[0]}</Avatar>}
                            title={
                              <Space direction="vertical" size={0}>
                                <Space>
                                  <Text strong>{item.author}</Text>
                                  <Text type="secondary" style={{ fontSize: 12 }}>
                                    {item.createdDate}
                                  </Text>
                                  {item.isPinned && (
                                    <Tag color="gold" icon={<PushpinOutlined />}>
                                      Đang ghim
                                    </Tag>
                                  )}
                                </Space>
                                {item.mentions?.length > 0 && (
                                  <Space size={[4, 4]} wrap>
                                    {item.mentions.map((mention) => (
                                      <Tag key={mention} color="blue">
                                        @{mention}
                                      </Tag>
                                    ))}
                                  </Space>
                                )}
                              </Space>
                            }
                            description={
                              <Space direction="vertical" style={{ width: "100%" }}>
                                <Paragraph style={{ marginBottom: 8 }}>
                                  {item.content}
                                </Paragraph>
                                {item.attachments?.length > 0 && (
                                  <Space wrap>
                                    {item.attachments.map((file) => (
                                      <Tag
                                        key={file.name}
                                        icon={<PaperClipOutlined />}
                                        color="purple"
                                      >
                                        {file.name}
                                      </Tag>
                                    ))}
                                  </Space>
                                )}
                              </Space>
                            }
                          />
                        </List.Item>
                      )}
                    />
                  ) : (
                    <Empty description="Không có bài viết phù hợp bộ lọc" />
                  )}
                </Space>
              ),
            },
            {
              key: "resources",
              label: (
                <Space>
                  <TeamOutlined />
                  <span>Nguồn lực ({resources.length})</span>
                </Space>
              ),
              children: (
                <Space direction="vertical" style={{ width: "100%" }} size="large">
                  <div style={{ textAlign: "right" }}>
                    <Button type="primary" icon={<PlusOutlined />}>
                      Thêm nguồn lực
                    </Button>
                  </div>
                  <Table
                    columns={resourceColumns}
                    dataSource={resources}
                    rowKey="id"
                    pagination={false}
                  />
                </Space>
              ),
            },
            {
              key: "logs",
              label: (
                <Space>
                  <HistoryOutlined />
                  <span>Hoạt động (Logs)</span>
                </Space>
              ),
              children: (
                <Space direction="vertical" style={{ width: "100%" }} size="large">
                  <Row gutter={[16, 16]}>
                    {logSummary.map((item) => (
                      <Col xs={24} md={8} key={item.key}>
                        <Card size="small">
                          <Statistic title={item.label} value={item.count} />
                        </Card>
                      </Col>
                    ))}
                  </Row>
                  <Space wrap>
                    <Select
                      value={logTypeFilter}
                      onChange={setLogTypeFilter}
                      style={{ minWidth: 220 }}
                    >
                      {logTypeOptions.map((option) => (
                        <Option key={option.value} value={option.value}>
                          {option.label}
                        </Option>
                      ))}
                    </Select>
                    <Select
                      value={logUserFilter}
                      onChange={setLogUserFilter}
                      style={{ minWidth: 200 }}
                    >
                      {logUserOptions.map((user) => (
                        <Option key={user} value={user}>
                          {user === "ALL" ? "Tất cả thành viên" : user}
                        </Option>
                      ))}
                    </Select>
                    <Input
                      placeholder="Tìm kiếm hoạt động"
                      value={logSearchKeyword}
                      allowClear
                      onChange={(e) => setLogSearchKeyword(e.target.value)}
                      style={{ width: 240 }}
                    />
                  </Space>
                  <Card>
                    {filteredLogs.length ? (
                      <Timeline>
                        {filteredLogs.map((activity) => (
                          <Timeline.Item key={activity.id}>
                            <Space direction="vertical" size={0} style={{ width: "100%" }}>
                              <Space>
                                <Text strong>{activity.user}</Text>
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                  {dayjs(activity.timestamp).format("DD/MM/YYYY HH:mm")}
                                </Text>
                              </Space>
                              <Text>
                                {activity.action} - {activity.target}
                              </Text>
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                {activityTypeLabels[activity.type] || activity.type}
                              </Text>
                              {activity.details && (
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                  {activity.details}
                                </Text>
                              )}
                            </Space>
                          </Timeline.Item>
                        ))}
                      </Timeline>
                    ) : (
                      <Empty description="Không có hoạt động phù hợp bộ lọc" />
                    )}
                  </Card>
                </Space>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
};

export default ProjectDetail;
