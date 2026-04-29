import { EditOutlined, EyeOutlined, FileOutlined } from "@ant-design/icons";
import {
  Avatar,
  Button,
  Card,
  Col,
  Descriptions,
  Divider,
  Form,
  Input,
  List,
  Progress,
  Row,
  Space,
  Tabs,
  Tag,
  Timeline,
  Typography,
  Upload,
} from "antd";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { getUserInfo } from "../../../../store/selectors/Selectors";
import TimeTracking from "../Components/TimeTracking";
import {
  ISSUE_PRIORITIES,
  ISSUE_STATUSES,
  ISSUE_TYPES,
} from "../Types/IssueTypes";

const { TextArea } = Input;
const { Text, Title, Paragraph } = Typography;
const { TabPane } = Tabs;

const EnhancedTaskDetail = () => {
  const { id } = useParams();
  const userInfo = useSelector(getUserInfo);
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [isEditing, setIsEditing] = useState(false);

  // Sample task data (would come from API)
  const sampleTask = {
    id: id,
    title: "Implement user authentication system",
    description:
      "Create a comprehensive user authentication system with login, logout, password reset, and user profile management features.",
    type: "FEATURE",
    status: "IN_PROGRESS",
    priority: "HIGH",
    assignee: {
      id: 1,
      name: "Nguyễn Văn A",
      avatar: null,
      email: "nguyenvana@company.com",
    },
    reporter: {
      id: 2,
      name: "Trần Thị B",
      avatar: null,
      email: "tranthib@company.com",
    },
    project: {
      id: 1,
      name: "E-commerce Platform",
      code: "ECOM",
    },
    department: {
      id: "IT",
      name: "Phòng Công nghệ thông tin",
    },
    version: {
      id: 1,
      name: "Version 1.0",
      dueDate: "2024-03-30",
    },
    estimatedHours: 40,
    spentHours: 15.5,
    dueDate: "2024-02-15",
    createdDate: "2024-01-10",
    updatedDate: "2024-01-14",
    progress: 35,
    category: "Backend",
    severity: "Major",
    watchers: [
      { id: 3, name: "Lê Văn C" },
      { id: 4, name: "Phạm Thị D" },
    ],
    customFields: {
      browser: "Chrome, Firefox",
      os: "Windows, macOS",
      environment: "Development",
    },
    attachments: [
      {
        id: 1,
        name: "authentication_mockup.png",
        size: "2.4 MB",
        uploadedBy: "Nguyễn Văn A",
        uploadedAt: "2024-01-12",
      },
      {
        id: 2,
        name: "requirements.pdf",
        size: "1.1 MB",
        uploadedBy: "Trần Thị B",
        uploadedAt: "2024-01-10",
      },
    ],
    relatedIssues: [
      {
        id: 101,
        title: "Create user registration form",
        type: "TASK",
        status: "DONE",
        relation: "blocks",
      },
      {
        id: 102,
        title: "Setup password encryption",
        type: "TASK",
        status: "IN_PROGRESS",
        relation: "related",
      },
    ],
    comments: [
      {
        id: 1,
        user: "Nguyễn Văn A",
        content: "Đã hoàn thành phần đăng ký user. Đang làm phần đăng nhập.",
        createdAt: "2024-01-14 10:30",
        isPrivate: false,
      },
      {
        id: 2,
        user: "Trần Thị B",
        content: "Cần test kỹ phần bảo mật trước khi deploy.",
        createdAt: "2024-01-13 15:45",
        isPrivate: false,
      },
    ],
    history: [
      {
        id: 1,
        user: "Nguyễn Văn A",
        action: "Chuyển trạng thái",
        details: "ASSIGNED → IN_PROGRESS",
        timestamp: "2024-01-12 09:15",
      },
      {
        id: 2,
        user: "Trần Thị B",
        action: "Cập nhật tiến độ",
        details: "Progress: 20% → 35%",
        timestamp: "2024-01-14 14:20",
      },
    ],
  };

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setTask(sampleTask);
      setLoading(false);
    }, 1000);
  }, [id]);

  if (loading) {
    return <Card loading={loading} style={{ margin: 24 }} />;
  }

  if (!task) {
    return <div>Task not found</div>;
  }

  const issueType = ISSUE_TYPES[task.type];
  const issueStatus = ISSUE_STATUSES[task.status];
  const issuePriority = ISSUE_PRIORITIES[task.priority];

  const renderOverviewTab = () => (
    <Row gutter={[16, 16]}>
      <Col span={16}>
        {/* Task Description */}
        <Card title="📝 Mô tả" style={{ marginBottom: 16 }}>
          <Paragraph>{task.description}</Paragraph>
        </Card>

        {/* Comments Section */}
        <Card title="💬 Bình luận">
          <List
            dataSource={task.comments}
            renderItem={(comment) => (
              <List.Item>
                <List.Item.Meta
                  avatar={<Avatar>{comment.user[0]}</Avatar>}
                  title={
                    <Space>
                      <Text strong>{comment.user}</Text>
                      <Text type="secondary">{comment.createdAt}</Text>
                    </Space>
                  }
                  description={comment.content}
                />
              </List.Item>
            )}
          />

          <Divider />

          {/* Add Comment */}
          <Form layout="vertical">
            <Form.Item label="Thêm bình luận">
              <TextArea rows={3} placeholder="Nhập bình luận..." />
            </Form.Item>
            <Form.Item>
              <Button type="primary">Gửi bình luận</Button>
            </Form.Item>
          </Form>
        </Card>
      </Col>

      <Col span={8}>
        {/* Task Details */}
        <Card title="ℹ️ Thông tin chi tiết">
          <Descriptions column={1} size="small">
            <Descriptions.Item label="Loại">
              <Tag color={issueType.color}>
                {issueType.icon} {issueType.namVn}
              </Tag>
            </Descriptions.Item>

            <Descriptions.Item label="Trạng thái">
              <Tag color={issueStatus.color}>{issueStatus.nameVn}</Tag>
            </Descriptions.Item>

            <Descriptions.Item label="Độ ưu tiên">
              <Tag color={issuePriority.color}>{issuePriority.nameVn}</Tag>
            </Descriptions.Item>

            <Descriptions.Item label="Người thực hiện">
              <Space>
                <Avatar size="small">{task.assignee.name[0]}</Avatar>
                {task.assignee.name}
              </Space>
            </Descriptions.Item>

            <Descriptions.Item label="Người báo cáo">
              <Space>
                <Avatar size="small">{task.reporter.name[0]}</Avatar>
                {task.reporter.name}
              </Space>
            </Descriptions.Item>

            <Descriptions.Item label="Dự án">
              <Text code>{task.project.code}</Text> {task.project.name}
            </Descriptions.Item>

            <Descriptions.Item label="Phòng ban">
              {task.department.name}
            </Descriptions.Item>

            <Descriptions.Item label="Phiên bản">
              {task.version.name}
            </Descriptions.Item>

            <Descriptions.Item label="Hạn hoàn thành">
              <Text
                type={
                  new Date(task.dueDate) < new Date() ? "danger" : "default"
                }
              >
                {task.dueDate}
              </Text>
            </Descriptions.Item>

            <Descriptions.Item label="Tiến độ">
              <Progress percent={task.progress} size="small" />
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* Watchers */}
        <Card title="👀 Người theo dõi" style={{ marginTop: 16 }}>
          <List
            size="small"
            dataSource={task.watchers}
            renderItem={(watcher) => (
              <List.Item>
                <Space>
                  <Avatar size="small">{watcher.name[0]}</Avatar>
                  {watcher.name}
                </Space>
              </List.Item>
            )}
          />
          <Button size="small" style={{ marginTop: 8 }}>
            + Thêm người theo dõi
          </Button>
        </Card>
      </Col>
    </Row>
  );

  const renderFilesTab = () => (
    <Card>
      <Upload.Dragger style={{ marginBottom: 16 }}>
        <p className="ant-upload-drag-icon">
          <FileOutlined />
        </p>
        <p className="ant-upload-text">Kéo thả file hoặc click để upload</p>
      </Upload.Dragger>

      <List
        dataSource={task.attachments}
        renderItem={(file) => (
          <List.Item
            actions={[
              <Button size="small" icon={<EyeOutlined />}>
                Xem
              </Button>,
              <Button size="small">Tải về</Button>,
            ]}
          >
            <List.Item.Meta
              avatar={<FileOutlined />}
              title={file.name}
              description={`${file.size} - Uploaded by ${file.uploadedBy} on ${file.uploadedAt}`}
            />
          </List.Item>
        )}
      />
    </Card>
  );

  const renderRelatedTab = () => (
    <Card>
      <List
        dataSource={task.relatedIssues}
        renderItem={(issue) => (
          <List.Item>
            <Space>
              <Tag color={ISSUE_TYPES[issue.type]?.color}>
                {ISSUE_TYPES[issue.type]?.icon}
              </Tag>
              <Text>#{issue.id}</Text>
              <Text>{issue.title}</Text>
              <Tag color={ISSUE_STATUSES[issue.status]?.color}>
                {ISSUE_STATUSES[issue.status]?.nameVn}
              </Tag>
              <Tag>{issue.relation}</Tag>
            </Space>
          </List.Item>
        )}
      />
    </Card>
  );

  const renderHistoryTab = () => (
    <Card>
      <Timeline>
        {task.history.map((entry) => (
          <Timeline.Item key={entry.id}>
            <Space direction="vertical" size="small">
              <Text strong>{entry.user}</Text>
              <Text>
                {entry.action}: {entry.details}
              </Text>
              <Text type="secondary">{entry.timestamp}</Text>
            </Space>
          </Timeline.Item>
        ))}
      </Timeline>
    </Card>
  );

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <Card style={{ marginBottom: 16 }}>
        <Row align="middle" justify="space-between">
          <Col>
            <Space>
              <Tag color={issueType.color}>
                {issueType.icon} {issueType.namVn}
              </Tag>
              <Title level={3} style={{ margin: 0 }}>
                #{task.id} {task.title}
              </Title>
            </Space>
          </Col>
          <Col>
            <Space>
              <Button icon={<EditOutlined />}>Chỉnh sửa</Button>
              <Button>Sao chép</Button>
              <Button>Xóa</Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Tabs */}
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="📋 Tổng quan" key="overview">
          {renderOverviewTab()}
        </TabPane>

        <TabPane tab="⏱️ Thời gian" key="time">
          <TimeTracking
            taskId={task.id}
            estimatedHours={task.estimatedHours}
            spentHours={task.spentHours}
            allowTracking={true}
          />
        </TabPane>

        <TabPane tab="📎 Files" key="files">
          {renderFilesTab()}
        </TabPane>

        <TabPane tab="🔗 Liên quan" key="related">
          {renderRelatedTab()}
        </TabPane>

        <TabPane tab="📊 Lịch sử" key="history">
          {renderHistoryTab()}
        </TabPane>
      </Tabs>
    </div>
  );
};

export default EnhancedTaskDetail;

