import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  Descriptions,
  Tag,
  Progress,
  Timeline,
  Button,
  Space,
  Tabs,
  Avatar,
  List,
  Input,
  Form,
  Upload,
  Select,
  Row,
  Col,
  Typography,
  Divider,
  Empty,
  Badge,
  Tooltip,
  notification,
} from "antd";
import {
  EditOutlined,
  UserAddOutlined,
  CommentOutlined,
  EyeOutlined,
  LinkOutlined,
  PaperClipOutlined,
  ClockCircleOutlined,
  PlusOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  HistoryOutlined,
  FileTextOutlined,
  BugOutlined,
  ThunderboltOutlined,
  CheckSquareOutlined,
  UserOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { getSampleTasks, getSampleProjects } from "../../../WorkflowApp/utils/workflowSampleData";
import ModalAddTask from "../../Modals/ModalAddTask/ModalAddTask";
import ModalAssignTask from "../../Modals/ModalAssignTask/ModalAssignTask";
import ModalTaskReminder from "../../Modals/ModalTaskReminder/ModalTaskReminder";
import ModalAddWatcher from "../../Modals/ModalAddWatcher/ModalAddWatcher";
import ModalAddRelation from "../../Modals/ModalAddRelation/ModalAddRelation";
import ModalAddSubtask from "../../Modals/ModalAddSubtask/ModalAddSubtask";
import ModalAddDependency from "../../Modals/ModalAddDependency/ModalAddDependency";
import ModalAddTimeEntry from "../../Modals/ModalAddTimeEntry/ModalAddTimeEntry";
import ModalTaskApproval from "../../Modals/ModalTaskApproval/ModalTaskApproval";
import "./TaskDetail.css";

const { TextArea } = Input;
const { Option } = Select;
const { Text, Title, Paragraph } = Typography;

const TASK_TYPE_META = {
  TASK: { label: "Công việc", icon: <CheckSquareOutlined />, color: "blue" },
  BUG: { label: "Lỗi", icon: <BugOutlined />, color: "red" },
  FEATURE: { label: "Tính năng", icon: <ThunderboltOutlined />, color: "green" },
  SUPPORT: { label: "Hỗ trợ", icon: <UserOutlined />, color: "purple" },
};

const STATUS_META = {
  PENDING: { label: "Chờ thực hiện", color: "default" },
  IN_PROGRESS: { label: "Đang thực hiện", color: "processing" },
  REVIEW: { label: "Đang xem xét", color: "warning" },
  COMPLETED: { label: "Hoàn thành", color: "success" },
  CANCELLED: { label: "Đã hủy", color: "error" },
};

const PRIORITY_META = {
  LOW: { label: "Thấp", color: "default" },
  MEDIUM: { label: "Trung bình", color: "blue" },
  HIGH: { label: "Cao", color: "orange" },
  URGENT: { label: "Khẩn cấp", color: "red" },
};

const TaskDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [commentForm] = Form.useForm();

  // Sample data - replace with API call
  const [task, setTask] = useState(null);
  const [comments, setComments] = useState([]);
  const [watchers, setWatchers] = useState([]);
  const [relations, setRelations] = useState([]);
  const [subtasks, setSubtasks] = useState([]);
  const [dependencies, setDependencies] = useState([]);
  const [history, setHistory] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [timeEntries, setTimeEntries] = useState([]);

  // Modal states
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [reminderModalVisible, setReminderModalVisible] = useState(false);
  const [watcherModalVisible, setWatcherModalVisible] = useState(false);
  const [relationModalVisible, setRelationModalVisible] = useState(false);
  const [subtaskModalVisible, setSubtaskModalVisible] = useState(false);
  const [dependencyModalVisible, setDependencyModalVisible] = useState(false);
  const [timeEntryModalVisible, setTimeEntryModalVisible] = useState(false);
  const [approvalModalVisible, setApprovalModalVisible] = useState(false);

  useEffect(() => {
    if (id) {
      loadTaskData();
    }
  }, [id]);

  const loadTaskData = () => {
    setLoading(true);
    // Load from sample data
    const allTasks = getSampleTasks();
    const foundTask = allTasks.find((t) => t.id === id);
    
    if (foundTask) {
      const projects = getSampleProjects();
      const project = projects.find((p) => p.id === foundTask.projectId);
      
      setTask({
        ...foundTask,
        type: foundTask.type || "TASK",
        description: foundTask.description || "Mô tả công việc chi tiết...",
        reporter: foundTask.createdByName || "Người tạo",
        spentHours: foundTask.spentHours || Math.round(foundTask.estimatedHours * (foundTask.progress / 100)),
      });

      // Sample data for related features
      setComments([
        {
          id: "1",
          author: foundTask.assignedToName || "Người dùng",
          content: "Đã bắt đầu thực hiện công việc này.",
          createdDate: dayjs().subtract(2, "day").format("YYYY-MM-DD HH:mm"),
        },
      ]);

      setWatchers([
        { id: "1", name: foundTask.assignedToName || "Người dùng", email: "user@example.com" },
        { id: "2", name: foundTask.createdByName || "Người tạo", email: "creator@example.com" },
      ]);

      setRelations([
        {
          id: "TASK-002",
          type: "relates",
          title: "Tích hợp cổng thanh toán",
          status: "REVIEW",
        },
      ]);

      setSubtasks([
        {
          id: "SUB-001",
          title: "Phân tích yêu cầu",
          status: "COMPLETED",
          progress: 100,
        },
        {
          id: "SUB-002",
          title: "Thiết kế chi tiết",
          status: "IN_PROGRESS",
          progress: 60,
        },
      ]);

      setDependencies([
        {
          id: "TASK-003",
          title: "Xây dựng API báo cáo",
          type: "blocks",
          status: "PENDING",
        },
      ]);

      setHistory([
        {
          id: "1",
          user: foundTask.createdByName || "Người tạo",
          action: "Tạo công việc",
          timestamp: dayjs().subtract(5, "day").format("YYYY-MM-DD HH:mm"),
          changes: {},
        },
        {
          id: "2",
          user: foundTask.assignedToName || "Người dùng",
          action: "Cập nhật tiến độ",
          timestamp: dayjs().subtract(2, "day").format("YYYY-MM-DD HH:mm"),
          changes: { progress: "0% → 45%" },
        },
      ]);

      setTimeEntries([
        {
          id: "1",
          user: foundTask.assignedToName || "Người dùng",
          hours: 4.5,
          date: dayjs().subtract(1, "day").format("YYYY-MM-DD"),
          comment: "Làm việc trên phần thiết kế",
        },
      ]);
    }
    setLoading(false);
  };

  const handleAddComment = (values) => {
    const newComment = {
      id: Date.now().toString(),
      author: "Bạn",
      content: values.comment,
      createdDate: dayjs().format("YYYY-MM-DD HH:mm"),
    };
    setComments([newComment, ...comments]);
    commentForm.resetFields();
    notification.success({
      message: "Thành công",
      description: "Đã thêm bình luận",
    });
  };

  const handleDeleteComment = (commentId) => {
    setComments(comments.filter((c) => c.id !== commentId));
    notification.success({
      message: "Thành công",
      description: "Đã xóa bình luận",
    });
  };

  const handleModalSuccess = (updatedData) => {
    if (updatedData) {
      if (updatedData.watchers) setWatchers(updatedData.watchers);
      if (updatedData.relations) setRelations(updatedData.relations);
      if (updatedData.subtasks) setSubtasks(updatedData.subtasks);
      if (updatedData.dependencies) setDependencies(updatedData.dependencies);
      if (updatedData.timeEntries) setTimeEntries(updatedData.timeEntries);
    }
    loadTaskData();
  };

  const typeMeta = task ? TASK_TYPE_META[task.type] || TASK_TYPE_META.TASK : null;
  const statusMeta = task ? STATUS_META[task.status] || STATUS_META.PENDING : null;
  const priorityMeta = task ? PRIORITY_META[task.priority] || PRIORITY_META.MEDIUM : null;

  if (!task) {
    return <div style={{ padding: 24 }}>Loading...</div>;
  }

  const tabItems = [
    {
      key: "overview",
      label: "Tổng quan",
      children: (
        <Space direction="vertical" style={{ width: "100%" }} size="large">
          <Descriptions bordered column={2}>
            <Descriptions.Item label="Mã công việc">{task.taskCode}</Descriptions.Item>
            <Descriptions.Item label="Loại">
              {typeMeta && (
                <Tag color={typeMeta.color} icon={typeMeta.icon}>
                  {typeMeta.label}
                </Tag>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Tên công việc">{task.taskName}</Descriptions.Item>
            <Descriptions.Item label="Dự án">{task.projectName || "Không xác định"}</Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              {statusMeta && <Tag color={statusMeta.color}>{statusMeta.label}</Tag>}
            </Descriptions.Item>
            <Descriptions.Item label="Độ ưu tiên">
              {priorityMeta && <Tag color={priorityMeta.color}>{priorityMeta.label}</Tag>}
            </Descriptions.Item>
            <Descriptions.Item label="Người thực hiện">{task.assignedToName || "Chưa giao"}</Descriptions.Item>
            <Descriptions.Item label="Người tạo">{task.createdByName || "—"}</Descriptions.Item>
            <Descriptions.Item label="Ngày bắt đầu">
              {task.startDate ? dayjs(task.startDate).format("DD/MM/YYYY") : "—"}
            </Descriptions.Item>
            <Descriptions.Item label="Ngày hết hạn">
              {task.dueDate ? dayjs(task.dueDate).format("DD/MM/YYYY") : "—"}
            </Descriptions.Item>
            <Descriptions.Item label="Số giờ ước tính">
              {task.estimatedHours ? `${task.estimatedHours}h` : "—"}
            </Descriptions.Item>
            <Descriptions.Item label="Số giờ đã dùng">
              {task.spentHours ? `${task.spentHours}h` : "0h"}
            </Descriptions.Item>
            <Descriptions.Item label="Tiến độ" span={2}>
              <Progress percent={task.progress || 0} />
            </Descriptions.Item>
            <Descriptions.Item label="Mô tả" span={2}>
              <Paragraph>{task.description}</Paragraph>
            </Descriptions.Item>
          </Descriptions>
        </Space>
      ),
    },
    {
      key: "comments",
      label: (
        <Space>
          <CommentOutlined />
          <span>Bình luận ({comments.length})</span>
        </Space>
      ),
      children: (
        <Space direction="vertical" style={{ width: "100%" }} size="large">
          <Card>
            <Form form={commentForm} onFinish={handleAddComment}>
              <Form.Item
                name="comment"
                rules={[{ required: true, message: "Vui lòng nhập bình luận" }]}
              >
                <TextArea rows={4} placeholder="Thêm bình luận..." />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit">
                  Gửi bình luận
                </Button>
              </Form.Item>
            </Form>
          </Card>
          <List
            dataSource={comments}
            renderItem={(item) => (
              <List.Item
                actions={[
                  <Button
                    type="link"
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={() => handleDeleteComment(item.id)}
                  >
                    Xóa
                  </Button>,
                ]}
              >
                <List.Item.Meta
                  avatar={<Avatar>{item.author[0]}</Avatar>}
                  title={
                    <Space>
                      <Text strong>{item.author}</Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {item.createdDate}
                      </Text>
                    </Space>
                  }
                  description={<Paragraph>{item.content}</Paragraph>}
                />
              </List.Item>
            )}
          />
        </Space>
      ),
    },
    {
      key: "watchers",
      label: (
        <Space>
          <EyeOutlined />
          <span>Người theo dõi ({watchers.length})</span>
        </Space>
      ),
      children: (
        <Card
          extra={
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setWatcherModalVisible(true)}
            >
              Thêm người theo dõi
            </Button>
          }
        >
          <List
            dataSource={watchers}
            renderItem={(item) => (
              <List.Item>
                <List.Item.Meta
                  avatar={<Avatar>{item.name[0]}</Avatar>}
                  title={item.name}
                  description={item.email}
                />
              </List.Item>
            )}
          />
        </Card>
      ),
    },
    {
      key: "relations",
      label: (
        <Space>
          <LinkOutlined />
          <span>Liên kết ({relations.length})</span>
        </Space>
      ),
      children: (
        <Card
          extra={
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setRelationModalVisible(true)}
            >
              Thêm liên kết
            </Button>
          }
        >
          <List
            dataSource={relations}
            renderItem={(item) => {
              const task = item.relatedTask || { id: item.id, title: item.title, status: item.status };
              return (
                <List.Item
                  actions={[
                    <Button
                      type="link"
                      onClick={() => navigate(`/workflow/task-management/task/${task.id}`)}
                    >
                      Xem
                    </Button>,
                  ]}
                >
                  <List.Item.Meta
                    title={
                      <Space>
                        <Text>{task.title || item.title}</Text>
                        <Tag color={STATUS_META[task.status || item.status]?.color}>
                          {STATUS_META[task.status || item.status]?.label}
                        </Tag>
                      </Space>
                    }
                    description={`Loại: ${item.relationType || item.type}`}
                  />
                </List.Item>
              );
            }}
          />
        </Card>
      ),
    },
    {
      key: "subtasks",
      label: (
        <Space>
          <CheckSquareOutlined />
          <span>Công việc con ({subtasks.length})</span>
        </Space>
      ),
      children: (
        <Card
          extra={
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setSubtaskModalVisible(true)}
            >
              Thêm công việc con
            </Button>
          }
        >
          <List
            dataSource={subtasks}
            renderItem={(item) => (
              <List.Item
                actions={[
                  <Progress
                    type="circle"
                    percent={item.progress}
                    width={40}
                    strokeColor={item.status === "COMPLETED" ? "#52c41a" : "#1890ff"}
                  />,
                ]}
              >
                <List.Item.Meta
                  avatar={
                    item.status === "COMPLETED" ? (
                      <CheckCircleOutlined style={{ color: "#52c41a", fontSize: 20 }} />
                    ) : (
                      <CloseCircleOutlined style={{ color: "#d9d9d9", fontSize: 20 }} />
                    )
                  }
                  title={
                    <Space>
                      <Text>{item.title}</Text>
                      <Tag color={STATUS_META[item.status]?.color}>
                        {STATUS_META[item.status]?.label}
                      </Tag>
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        </Card>
      ),
    },
    {
      key: "dependencies",
      label: (
        <Space>
          <LinkOutlined />
          <span>Phụ thuộc ({dependencies.length})</span>
        </Space>
      ),
      children: (
        <Card
          extra={
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setDependencyModalVisible(true)}
            >
              Thêm phụ thuộc
            </Button>
          }
        >
          <List
            dataSource={dependencies}
            renderItem={(item) => {
              const task = item.task || { id: item.id, title: item.title, status: item.status };
              return (
                <List.Item
                  actions={[
                    <Button
                      type="link"
                      onClick={() => navigate(`/workflow/task-management/task/${task.id}`)}
                    >
                      Xem
                    </Button>,
                  ]}
                >
                  <List.Item.Meta
                    title={
                      <Space>
                        <Text>{task.title || item.title}</Text>
                        <Tag color="orange">{item.type === "blocks" ? "Chặn" : "Phụ thuộc"}</Tag>
                        <Tag color={STATUS_META[task.status || item.status]?.color}>
                          {STATUS_META[task.status || item.status]?.label}
                        </Tag>
                      </Space>
                    }
                  />
                </List.Item>
              );
            }}
          />
        </Card>
      ),
    },
    {
      key: "history",
      label: (
        <Space>
          <HistoryOutlined />
          <span>Lịch sử ({history.length})</span>
        </Space>
      ),
      children: (
        <Card>
          <Timeline>
            {history.map((item) => (
              <Timeline.Item key={item.id}>
                <Space direction="vertical" size={0}>
                  <Space>
                    <Text strong>{item.user}</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {item.timestamp}
                    </Text>
                  </Space>
                  <Text>{item.action}</Text>
                  {item.changes && Object.keys(item.changes).length > 0 && (
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {Object.entries(item.changes).map(([key, value]) => `${key}: ${value}`).join(", ")}
                    </Text>
                  )}
                </Space>
              </Timeline.Item>
            ))}
          </Timeline>
        </Card>
      ),
    },
    {
      key: "attachments",
      label: (
        <Space>
          <PaperClipOutlined />
          <span>Tài liệu ({attachments.length})</span>
        </Space>
      ),
      children: (
        <Card
          extra={
            <Upload>
              <Button type="primary" icon={<PlusOutlined />}>
                Tải lên
              </Button>
            </Upload>
          }
        >
          {attachments.length > 0 ? (
            <List
              dataSource={attachments}
              renderItem={(item) => (
                <List.Item
                  actions={[
                    <Button type="link">Tải xuống</Button>,
                    <Button type="link" danger icon={<DeleteOutlined />}>
                      Xóa
                    </Button>,
                  ]}
                >
                  <List.Item.Meta
                    avatar={<FileTextOutlined style={{ fontSize: 24 }} />}
                    title={item.name}
                    description={`${item.size} - ${item.uploadedBy} - ${item.uploadedDate}`}
                  />
                </List.Item>
              )}
            />
          ) : (
            <Empty description="Chưa có tài liệu đính kèm" />
          )}
        </Card>
      ),
    },
    {
      key: "time-entries",
      label: (
        <Space>
          <ClockCircleOutlined />
          <span>Ghi nhận thời gian ({timeEntries.length})</span>
        </Space>
      ),
      children: (
        <Card
          extra={
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setTimeEntryModalVisible(true)}
            >
              Thêm ghi nhận
            </Button>
          }
        >
          <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            <Col span={8}>
              <Card size="small">
                <Text type="secondary">Tổng giờ</Text>
                <Title level={3} style={{ margin: 0 }}>
                  {timeEntries.reduce((sum, e) => sum + e.hours, 0).toFixed(1)}h
                </Title>
              </Card>
            </Col>
            <Col span={8}>
              <Card size="small">
                <Text type="secondary">Ước tính</Text>
                <Title level={3} style={{ margin: 0 }}>
                  {task.estimatedHours || 0}h
                </Title>
              </Card>
            </Col>
            <Col span={8}>
              <Card size="small">
                <Text type="secondary">Còn lại</Text>
                <Title level={3} style={{ margin: 0 }}>
                  {Math.max(0, (task.estimatedHours || 0) - timeEntries.reduce((sum, e) => sum + e.hours, 0)).toFixed(1)}h
                </Title>
              </Card>
            </Col>
          </Row>
          <List
            dataSource={timeEntries}
            renderItem={(item) => (
              <List.Item>
                <List.Item.Meta
                  avatar={<Avatar>{item.user[0]}</Avatar>}
                  title={
                    <Space>
                      <Text strong>{item.user}</Text>
                      <Text type="secondary">{item.date}</Text>
                    </Space>
                  }
                  description={
                    <Space>
                      <Text>{item.hours}h</Text>
                      {item.comment && <Text type="secondary">- {item.comment}</Text>}
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        </Card>
      ),
    },
  ];

  return (
    <div className="task-detail-container" style={{ padding: 24 }}>
      <Card
        title={
          <Space>
            {typeMeta && (
              <Tag color={typeMeta.color} icon={typeMeta.icon} style={{ fontSize: 14, padding: "4px 8px" }}>
                {typeMeta.label}
              </Tag>
            )}
            <Title level={3} style={{ margin: 0 }}>
              {task.taskName}
            </Title>
            {statusMeta && <Tag color={statusMeta.color}>{statusMeta.label}</Tag>}
          </Space>
        }
        extra={
          <Space>
            <Button icon={<EditOutlined />} onClick={() => setEditModalVisible(true)}>
              Chỉnh sửa
            </Button>
            <Button
              type="primary"
              icon={<UserAddOutlined />}
              onClick={() => setAssignModalVisible(true)}
            >
              Giao việc
            </Button>
            <Button icon={<ClockCircleOutlined />} onClick={() => setReminderModalVisible(true)}>
              Nhắc việc
            </Button>
          </Space>
        }
        loading={loading}
      >
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
      </Card>

      {/* Modals */}
      <ModalAddTask
        openModalAddTaskState={editModalVisible}
        handleCloseModal={() => setEditModalVisible(false)}
        openModalType="EDIT"
        currentRecord={task}
        refreshData={loadTaskData}
      />

      <ModalAssignTask
        openModalAssignTaskState={assignModalVisible}
        handleCloseModal={() => setAssignModalVisible(false)}
        currentRecord={task}
        refreshData={loadTaskData}
      />

      <ModalTaskReminder
        openModalReminderState={reminderModalVisible}
        handleCloseModal={() => setReminderModalVisible(false)}
        currentRecord={task}
        refreshData={loadTaskData}
      />

      <ModalAddWatcher
        visible={watcherModalVisible}
        onCancel={() => setWatcherModalVisible(false)}
        taskId={task?.id}
        currentWatchers={watchers}
        onSuccess={handleModalSuccess}
      />

      <ModalAddRelation
        visible={relationModalVisible}
        onCancel={() => setRelationModalVisible(false)}
        taskId={task?.id}
        currentTaskTitle={task?.taskName}
        onSuccess={() => {
          handleModalSuccess();
          setRelationModalVisible(false);
        }}
      />

      <ModalAddSubtask
        visible={subtaskModalVisible}
        onCancel={() => setSubtaskModalVisible(false)}
        taskId={task?.id}
        currentSubtasks={subtasks}
        onSuccess={() => {
          handleModalSuccess();
          setSubtaskModalVisible(false);
        }}
      />

      <ModalAddDependency
        visible={dependencyModalVisible}
        onCancel={() => setDependencyModalVisible(false)}
        taskId={task?.id}
        currentDependencies={dependencies}
        onSuccess={() => {
          handleModalSuccess();
          setDependencyModalVisible(false);
        }}
      />

      <ModalAddTimeEntry
        visible={timeEntryModalVisible}
        onCancel={() => setTimeEntryModalVisible(false)}
        taskId={task?.id}
        onSuccess={() => {
          handleModalSuccess();
          setTimeEntryModalVisible(false);
        }}
      />

      <ModalTaskApproval
        visible={approvalModalVisible}
        onCancel={() => setApprovalModalVisible(false)}
        taskId={task?.id}
        taskName={task?.taskName}
        onSuccess={() => {
          handleModalSuccess();
          setApprovalModalVisible(false);
        }}
      />
    </div>
  );
};

export default TaskDetail;
