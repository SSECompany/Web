import {
  ClockCircleOutlined,
  CommentOutlined,
  EditOutlined,
  EyeOutlined,
  LinkOutlined,
  PaperClipOutlined,
  UserAddOutlined,
} from "@ant-design/icons";
import {
  Avatar,
  Button,
  Card,
  Col,
  Descriptions,
  Divider,
  Row,
  Select,
  Space,
  Tag,
  Timeline,
  Typography,
  Upload,
  notification,
} from "antd";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ISSUE_PRIORITIES, ISSUE_STATUSES, ISSUE_TYPES } from "../../../TaskManagement/Types/IssueTypes";
import ModalAddIssue from "../../Modals/ModalAddIssue/ModalAddIssue";
import ModalAddComment from "../../Modals/ModalAddComment/ModalAddComment";
import ModalAddWatcher from "../../Modals/ModalAddWatcher/ModalAddWatcher";
import ModalAddRelation from "../../Modals/ModalAddRelation/ModalAddRelation";
import ModalAddTimeEntry from "../../Modals/ModalAddTimeEntry/ModalAddTimeEntry";
import {
  apiGetIssue,
  apiGetIssueComments,
  apiGetIssueHistory,
  apiGetIssueWatchers,
  apiGetIssueRelations,
  apiGetIssueTimeEntries,
  apiDeleteIssueComment,
} from "../../API";
import "./IssueDetail.css";

const { Title, Text, Paragraph } = Typography;

const IssueDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [issue, setIssue] = useState({
    id: "ISSUE-001",
    type: "BUG",
    title: "Lỗi đăng nhập không hoạt động",
    description: "Khi người dùng nhập đúng thông tin đăng nhập, hệ thống vẫn báo lỗi...",
    priority: "HIGH",
    status: "IN_PROGRESS",
    assignee: { id: "1", name: "Nguyễn Văn A", avatar: null },
    reporter: { id: "2", name: "Trần Thị B", avatar: null },
    project: "Website mới",
    createdDate: "2024-02-10",
    dueDate: "2024-02-15",
    progress: 60,
    estimatedHours: 8,
    spentHours: 4.5,
    watchers: [
      { id: "1", name: "Nguyễn Văn A" },
      { id: "3", name: "Lê Văn C" },
    ],
    relations: [
      { id: "ISSUE-002", type: "relates", title: "Thêm tính năng thanh toán" },
    ],
  });

  const [comments, setComments] = useState([
    {
      id: "1",
      author: "Nguyễn Văn A",
      content: "Đã kiểm tra và xác nhận lỗi này. Đang xử lý...",
      createdDate: "2024-02-10 14:30",
    },
    {
      id: "2",
      author: "Trần Thị B",
      content: "Cảm ơn bạn đã xử lý nhanh!",
      createdDate: "2024-02-10 15:00",
    },
  ]);

  const [history, setHistory] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [timeEntries, setTimeEntries] = useState([]);

  // Modal states
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [editingComment, setEditingComment] = useState(null);
  const [watcherModalVisible, setWatcherModalVisible] = useState(false);
  const [relationModalVisible, setRelationModalVisible] = useState(false);
  const [timeEntryModalVisible, setTimeEntryModalVisible] = useState(false);
  const [statusChangeVisible, setStatusChangeVisible] = useState(false);

  // Load issue data
  useEffect(() => {
    if (id) {
      loadIssueData();
    }
  }, [id]);

  const loadIssueData = async () => {
    setLoading(true);
    try {
      // Load issue
      const issueResponse = await apiGetIssue({ issueId: id });
      if (issueResponse?.data) {
        setIssue(issueResponse.data);
      }

      // Load comments
      const commentsResponse = await apiGetIssueComments({ issueId: id });
      if (commentsResponse?.data) {
        setComments(commentsResponse.data);
      }

      // Load history
      const historyResponse = await apiGetIssueHistory({ issueId: id });
      if (historyResponse?.data) {
        setHistory(historyResponse.data);
      }

      // Load watchers
      const watchersResponse = await apiGetIssueWatchers({ issueId: id });
      if (watchersResponse?.data) {
        setIssue((prev) => ({ ...prev, watchers: watchersResponse.data }));
      }

      // Load relations
      const relationsResponse = await apiGetIssueRelations({ issueId: id });
      if (relationsResponse?.data) {
        setIssue((prev) => ({ ...prev, relations: relationsResponse.data }));
      }

      // Load time entries
      const timeEntriesResponse = await apiGetIssueTimeEntries({ issueId: id });
      if (timeEntriesResponse?.data) {
        setTimeEntries(timeEntriesResponse.data);
        const totalHours = timeEntriesResponse.data.reduce(
          (sum, entry) => sum + entry.hours,
          0
        );
        setIssue((prev) => ({ ...prev, spentHours: totalHours }));
      }
    } catch (error) {
      console.error("Error loading issue data:", error);
      notification.error({
        message: "Lỗi",
        description: "Không thể tải thông tin issue",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditIssue = () => {
    setEditModalVisible(true);
  };

  const handleAddComment = () => {
    setEditingComment(null);
    setCommentModalVisible(true);
  };

  const handleEditComment = (comment) => {
    setEditingComment(comment);
    setCommentModalVisible(true);
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await apiDeleteIssueComment({ issueId: id, commentId });
      notification.success({
        message: "Thành công",
        description: "Đã xóa bình luận",
      });
      loadIssueData();
    } catch (error) {
      console.error("Error deleting comment:", error);
      notification.error({
        message: "Lỗi",
        description: "Không thể xóa bình luận",
      });
    }
  };

  const handleModalSuccess = () => {
    loadIssueData();
  };

  const issueType = ISSUE_TYPES[issue.type];
  const priority = ISSUE_PRIORITIES[issue.priority];
  const status = ISSUE_STATUSES[issue.status];

  return (
    <div className="issue-detail">
      <Row gutter={[16, 16]}>
        {/* Main Content */}
        <Col xs={24} lg={16}>
          {/* Issue Header */}
          <Card>
            <Space direction="vertical" size="middle" style={{ width: "100%" }}>
              <div>
                <Space>
                  <Tag color={issueType?.color} style={{ fontSize: 14, padding: "4px 12px" }}>
                    {issueType?.namVn}
                  </Tag>
                  <Text strong style={{ fontSize: 18 }}>
                    {issue.title}
                  </Text>
                </Space>
              </div>

              <Descriptions column={2} size="small" bordered>
                <Descriptions.Item label="ID">{issue.id}</Descriptions.Item>
                <Descriptions.Item label="Dự án">{issue.project}</Descriptions.Item>
                <Descriptions.Item label="Ưu tiên">
                  <Tag color={priority?.color}>{priority?.nameVn}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Trạng thái">
                  <Tag color={status?.color}>{status?.nameVn}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Người phụ trách">
                  {issue.assignee.name}
                </Descriptions.Item>
                <Descriptions.Item label="Người tạo">
                  {issue.reporter.name}
                </Descriptions.Item>
                <Descriptions.Item label="Ngày tạo">
                  {new Date(issue.createdDate).toLocaleDateString("vi-VN")}
                </Descriptions.Item>
                <Descriptions.Item label="Hạn hoàn thành">
                  {new Date(issue.dueDate).toLocaleDateString("vi-VN")}
                </Descriptions.Item>
              </Descriptions>
            </Space>
          </Card>

          {/* Description */}
          <Card title="📝 Mô tả" style={{ marginTop: 16 }}>
            <Paragraph>{issue.description}</Paragraph>
          </Card>

          {/* Comments */}
          <Card
            title={
              <Space>
                <CommentOutlined />
                <span>Bình luận ({comments.length})</span>
              </Space>
            }
            style={{ marginTop: 16 }}
            extra={
              <Button type="primary" size="small" onClick={handleAddComment}>
                Thêm bình luận
              </Button>
            }
          >
            <Space direction="vertical" style={{ width: "100%" }} size="large">
              {comments.length === 0 ? (
                <Text type="secondary">Chưa có bình luận nào</Text>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="comment-item">
                    <Space align="start">
                      <Avatar>{comment.author?.[0] || "U"}</Avatar>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <div>
                            <Text strong>{comment.author || "Unknown"}</Text>
                            <Text type="secondary" style={{ marginLeft: 8 }}>
                              {comment.createdDate}
                            </Text>
                          </div>
                          <Space>
                            <Button
                              type="link"
                              size="small"
                              onClick={() => handleEditComment(comment)}
                            >
                              Sửa
                            </Button>
                            <Button
                              type="link"
                              danger
                              size="small"
                              onClick={() => handleDeleteComment(comment.id)}
                            >
                              Xóa
                            </Button>
                          </Space>
                        </div>
                        <Paragraph style={{ marginTop: 8, marginBottom: 0 }}>
                          {comment.content}
                        </Paragraph>
                      </div>
                    </Space>
                  </div>
                ))
              )}
            </Space>
          </Card>

          {/* History */}
          <Card title="📜 Lịch sử thay đổi" style={{ marginTop: 16 }}>
            <Timeline>
              {history.map((item, index) => (
                <Timeline.Item key={index}>
                  <Text type="secondary">{item.date}</Text>
                  <br />
                  <Text strong>{item.user}</Text>
                  <br />
                  <Text>{item.action}</Text>
                </Timeline.Item>
              ))}
            </Timeline>
          </Card>
        </Col>

        {/* Sidebar */}
        <Col xs={24} lg={8}>
          {/* Actions */}
          <Card title="⚙️ Thao tác" style={{ marginBottom: 16 }}>
            <Space direction="vertical" style={{ width: "100%" }}>
              <Button block icon={<EditOutlined />} onClick={handleEditIssue}>
                Chỉnh sửa
              </Button>
              <Button
                block
                onClick={() => setStatusChangeVisible(true)}
              >
                Thay đổi trạng thái
              </Button>
              <Button block icon={<UserAddOutlined />}>
                Giao việc
              </Button>
              <Button
                block
                icon={<ClockCircleOutlined />}
                onClick={() => setTimeEntryModalVisible(true)}
              >
                Theo dõi thời gian
              </Button>
            </Space>
          </Card>

          {/* Watchers */}
          <Card
            title={
              <Space>
                <EyeOutlined />
                <span>Người theo dõi ({issue.watchers.length})</span>
              </Space>
            }
            style={{ marginBottom: 16 }}
            extra={
              <Button size="small" onClick={() => setWatcherModalVisible(true)}>
                Quản lý
              </Button>
            }
          >
            <Space direction="vertical" style={{ width: "100%" }}>
              {issue.watchers.map((watcher) => (
                <Space key={watcher.id}>
                  <Avatar size="small">{watcher.name[0]}</Avatar>
                  <Text>{watcher.name}</Text>
                </Space>
              ))}
            </Space>
          </Card>

          {/* Relations */}
          <Card
            title={
              <Space>
                <LinkOutlined />
                <span>Liên kết</span>
              </Space>
            }
            style={{ marginBottom: 16 }}
            extra={
              <Button size="small" onClick={() => setRelationModalVisible(true)}>
                Quản lý
              </Button>
            }
          >
            <Space direction="vertical" style={{ width: "100%" }}>
              {issue.relations.map((relation) => (
                <div key={relation.id}>
                  <Text type="secondary">{relation.type}: </Text>
                  <a>{relation.id} - {relation.title}</a>
                </div>
              ))}
            </Space>
          </Card>

          {/* Time Tracking */}
          <Card title="⏱️ Theo dõi thời gian" style={{ marginBottom: 16 }}>
            <Space direction="vertical" style={{ width: "100%" }}>
              <div>
                <Text type="secondary">Ước tính: </Text>
                <Text strong>{issue.estimatedHours}h</Text>
              </div>
              <div>
                <Text type="secondary">Đã dùng: </Text>
                <Text strong>{issue.spentHours}h</Text>
              </div>
              <div>
                <Text type="secondary">Còn lại: </Text>
                <Text strong>{issue.estimatedHours - issue.spentHours}h</Text>
              </div>
              <Button
                block
                type="primary"
                style={{ marginTop: 8 }}
                onClick={() => setTimeEntryModalVisible(true)}
              >
                Thêm thời gian
              </Button>
              {timeEntries.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Chi tiết:
                  </Text>
                  {timeEntries.slice(0, 3).map((entry) => (
                    <div key={entry.id} style={{ marginTop: 4 }}>
                      <Text style={{ fontSize: 12 }}>
                        {entry.date}: {entry.hours}h - {entry.activity}
                      </Text>
                    </div>
                  ))}
                </div>
              )}
            </Space>
          </Card>

          {/* Attachments */}
          <Card
            title={
              <Space>
                <PaperClipOutlined />
                <span>Đính kèm</span>
              </Space>
            }
            extra={
              <Upload>
                <Button size="small">Tải lên</Button>
              </Upload>
            }
          >
            <Text type="secondary">Chưa có file đính kèm</Text>
          </Card>
        </Col>
      </Row>

      {/* Modals */}
      <ModalAddIssue
        visible={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        onSuccess={handleModalSuccess}
        initialData={issue}
      />

      <ModalAddComment
        visible={commentModalVisible}
        onCancel={() => {
          setCommentModalVisible(false);
          setEditingComment(null);
        }}
        onSuccess={handleModalSuccess}
        issueId={id}
        initialData={editingComment}
      />

      <ModalAddWatcher
        visible={watcherModalVisible}
        onCancel={() => setWatcherModalVisible(false)}
        issueId={id}
        currentWatchers={issue.watchers || []}
      />

      <ModalAddRelation
        visible={relationModalVisible}
        onCancel={() => setRelationModalVisible(false)}
        issueId={id}
        currentIssueTitle={issue.title}
      />

      <ModalAddTimeEntry
        visible={timeEntryModalVisible}
        onCancel={() => setTimeEntryModalVisible(false)}
        onSuccess={handleModalSuccess}
        issueId={id}
      />
    </div>
  );
};

export default IssueDetail;


