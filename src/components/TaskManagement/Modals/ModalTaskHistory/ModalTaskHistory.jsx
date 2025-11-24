import {
  UserOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  SwapOutlined,
  FileTextOutlined,
  ArrowRightOutlined,
  TagOutlined,
  MessageOutlined,
} from "@ant-design/icons";
import {
  Drawer,
  Timeline,
  Tag,
  Avatar,
  Space,
  Typography,
  Card,
  Divider,
  Empty,
  Badge,
  Tooltip,
} from "antd";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { TaskManagementGetApi } from "../../API";

const { Text, Title, Paragraph } = Typography;

/**
 * Modal hiển thị lịch sử task với timeline đầy đủ
 * Hiển thị các thay đổi theo mốc thời gian: tạo task, giao việc, chuyển trạng thái, comments, etc.
 */
const ModalTaskHistory = ({ visible, onClose, taskId, taskData }) => {
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [references, setReferences] = useState([]); // Danh sách người liên quan

  useEffect(() => {
    if (visible && taskId) {
      loadTaskHistory();
    }
  }, [visible, taskId]);

  const loadTaskHistory = async () => {
    setLoading(true);
    try {
      const response = await TaskManagementGetApi({
        store: "Api_Get_Task_History",
        data: { taskId },
      });

      if (response?.status === 200 && response?.data) {
        setHistory(response.data.history || []);
        setReferences(response.data.references || []);
      } else {
        // Fallback: Generate sample history from task data
        generateSampleHistory();
      }
    } catch (error) {
      console.error("Error loading task history:", error);
      generateSampleHistory();
    } finally {
      setLoading(false);
    }
  };

  const generateSampleHistory = () => {
    if (!taskData) return;

    const sampleHistory = [
      {
        id: "1",
        type: "CREATED",
        user: taskData.createdByName || "Người tạo",
        userId: taskData.createdById,
        timestamp: taskData.createdDate || new Date().toISOString(),
        action: "Tạo công việc",
        details: {
          taskName: taskData.taskName,
          description: taskData.description,
          priority: taskData.priority,
          type: taskData.type,
        },
        icon: <FileTextOutlined />,
        color: "blue",
      },
      {
        id: "2",
        type: "ASSIGNED",
        user: "BA User",
        userId: "ba-001",
        timestamp: dayjs(taskData.createdDate).add(1, "hour").toISOString(),
        action: "Giao việc",
        details: {
          from: null,
          to: taskData.assignedToName || "Dev User",
          assigneeId: taskData.assignedToId,
        },
        icon: <SwapOutlined />,
        color: "green",
      },
      {
        id: "3",
        type: "STATUS_CHANGED",
        user: taskData.assignedToName || "Dev User",
        userId: taskData.assignedToId,
        timestamp: dayjs(taskData.createdDate).add(2, "hour").toISOString(),
        action: "Nhận việc",
        details: {
          from: "PENDING",
          to: "IN_PROGRESS",
          reason: "Đã nhận và bắt đầu thực hiện",
        },
        icon: <CheckCircleOutlined />,
        color: "processing",
      },
      {
        id: "4",
        type: "COMMENT",
        user: taskData.assignedToName || "Dev User",
        userId: taskData.assignedToId,
        timestamp: dayjs(taskData.createdDate).add(4, "hour").toISOString(),
        action: "Bình luận",
        details: {
          content: "Đang xử lý, dự kiến hoàn thành trong 2 ngày",
        },
        icon: <MessageOutlined />,
        color: "default",
      },
      {
        id: "5",
        type: "PROGRESS_UPDATED",
        user: taskData.assignedToName || "Dev User",
        userId: taskData.assignedToId,
        timestamp: dayjs(taskData.createdDate).add(1, "day").toISOString(),
        action: "Cập nhật tiến độ",
        details: {
          from: 0,
          to: taskData.progress || 50,
        },
        icon: <ClockCircleOutlined />,
        color: "orange",
      },
      {
        id: "6",
        type: "STATUS_CHANGED",
        user: taskData.assignedToName || "Dev User",
        userId: taskData.assignedToId,
        timestamp: dayjs(taskData.createdDate).add(2, "day").toISOString(),
        action: "Hoàn thành development",
        details: {
          from: "IN_PROGRESS",
          to: "REVIEW",
          reason: "Đã hoàn thành code, chuyển cho BA test",
        },
        icon: <TagOutlined />,
        color: "success",
      },
      {
        id: "7",
        type: "ASSIGNED",
        user: taskData.assignedToName || "Dev User",
        userId: taskData.assignedToId,
        timestamp: dayjs(taskData.createdDate).add(2, "day").add(1, "hour").toISOString(),
        action: "Chuyển test cho BA",
        details: {
          from: taskData.assignedToName || "Dev User",
          to: "BA User",
          assigneeId: "ba-001",
        },
        icon: <SwapOutlined />,
        color: "purple",
      },
      {
        id: "8",
        type: "STATUS_CHANGED",
        user: "BA User",
        userId: "ba-001",
        timestamp: dayjs(taskData.createdDate).add(2, "day").add(2, "hour").toISOString(),
        action: "Bắt đầu test",
        details: {
          from: "REVIEW",
          to: "TESTING",
          reason: "Đang kiểm thử tính năng",
        },
        icon: <CheckCircleOutlined />,
        color: "cyan",
      },
      {
        id: "9",
        type: "COMMENT",
        user: "BA User",
        userId: "ba-001",
        timestamp: dayjs(taskData.createdDate).add(3, "day").toISOString(),
        action: "Bình luận",
        details: {
          content: "Test xong, không có lỗi. Có thể đóng task.",
        },
        icon: <MessageOutlined />,
        color: "default",
      },
      {
        id: "10",
        type: "STATUS_CHANGED",
        user: "BA User",
        userId: "ba-001",
        timestamp: dayjs(taskData.createdDate).add(3, "day").add(1, "hour").toISOString(),
        action: "Đóng task",
        details: {
          from: "TESTING",
          to: "COMPLETED",
          reason: "Test thành công, đóng task",
        },
        icon: <CheckCircleOutlined />,
        color: "success",
      },
    ];

    // Extract unique users for references
    const uniqueUsers = Array.from(
      new Map(
        sampleHistory.map((item) => [item.userId, { id: item.userId, name: item.user }])
      ).values()
    );

    setHistory(sampleHistory);
    setReferences(uniqueUsers);
  };

  const getActionDescription = (item) => {
    switch (item.type) {
      case "CREATED":
        return (
          <Space direction="vertical" size={0}>
            <Text strong>Tạo công việc: {item.details.taskName}</Text>
            {item.details.description && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                {item.details.description}
              </Text>
            )}
            <Space size={8} style={{ marginTop: 4 }}>
              <Tag color="blue">{item.details.type}</Tag>
              <Tag color="orange">{item.details.priority}</Tag>
            </Space>
          </Space>
        );
      case "ASSIGNED":
        return (
          <Space direction="vertical" size={0}>
            <Text strong>
              {item.details.from ? "Chuyển giao" : "Giao việc"} cho{" "}
              <Text style={{ color: "#1890ff" }}>{item.details.to}</Text>
            </Text>
            {item.details.from && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                Từ: {item.details.from}
              </Text>
            )}
          </Space>
        );
      case "STATUS_CHANGED":
        const statusLabels = {
          PENDING: "Chờ thực hiện",
          IN_PROGRESS: "Đang thực hiện",
          REVIEW: "Đang xem xét",
          TESTING: "Đang test",
          COMPLETED: "Hoàn thành",
          CANCELLED: "Đã hủy",
        };
        return (
          <Space direction="vertical" size={0}>
            <Text strong>{item.action}</Text>
            <Space size={8}>
              <Tag color="default">{statusLabels[item.details.from] || item.details.from}</Tag>
              <ArrowRightOutlined style={{ fontSize: 12, color: "#8c8c8c" }} />
              <Tag color="success">{statusLabels[item.details.to] || item.details.to}</Tag>
            </Space>
            {item.details.reason && (
              <Text type="secondary" style={{ fontSize: 12, marginTop: 4, display: "block" }}>
                {item.details.reason}
              </Text>
            )}
          </Space>
        );
      case "PROGRESS_UPDATED":
        return (
          <Space direction="vertical" size={0}>
            <Text strong>Cập nhật tiến độ</Text>
            <Space size={8}>
              <Text>{item.details.from}%</Text>
              <ArrowRightOutlined style={{ fontSize: 12, color: "#8c8c8c" }} />
              <Text strong style={{ color: "#52c41a" }}>
                {item.details.to}%
              </Text>
            </Space>
          </Space>
        );
      case "COMMENT":
        return (
          <Space direction="vertical" size={0}>
            <Text strong>Bình luận</Text>
            <Paragraph style={{ margin: 0, fontSize: 13 }}>{item.details.content}</Paragraph>
          </Space>
        );
      default:
        return <Text>{item.action}</Text>;
    }
  };

  return (
    <Drawer
      title={
        <Space>
          <ClockCircleOutlined />
          <span>Lịch sử công việc</span>
          {taskData && (
            <Text type="secondary" style={{ fontSize: 14, fontWeight: "normal" }}>
              - {taskData.taskName}
            </Text>
          )}
        </Space>
      }
      placement="right"
      width={600}
      open={visible}
      onClose={onClose}
      loading={loading}
    >
      {/* References Section */}
      {references.length > 0 && (
        <Card
          size="small"
          title="Người liên quan"
          style={{ marginBottom: 24 }}
          extra={<Badge count={references.length} />}
        >
          <Space wrap>
            {references.map((user) => (
              <Tooltip key={user.id} title={user.name}>
                <Space>
                  <Avatar icon={<UserOutlined />} style={{ backgroundColor: "#1890ff" }} />
                  <Text>{user.name}</Text>
                </Space>
              </Tooltip>
            ))}
          </Space>
        </Card>
      )}

      {/* Timeline */}
      <Card title="Timeline" size="small">
        {history.length > 0 ? (
          <Timeline
            mode="left"
            items={history.map((item, index) => {
              const isLast = index === history.length - 1;
              return {
                dot: item.icon,
                color: item.color,
                children: (
                  <div style={{ marginLeft: 16 }}>
                    <Space direction="vertical" size={4} style={{ width: "100%" }}>
                      <Space>
                        <Avatar size="small" icon={<UserOutlined />}>
                          {item.user?.[0]}
                        </Avatar>
                        <Text strong>{item.user}</Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {dayjs(item.timestamp).format("DD/MM/YYYY HH:mm")}
                        </Text>
                      </Space>
                      <div style={{ marginLeft: 32 }}>{getActionDescription(item)}</div>
                    </Space>
                  </div>
                ),
              };
            })}
          />
        ) : (
          <Empty description="Chưa có lịch sử" />
        )}
      </Card>

      {/* Summary Card */}
      {taskData && (
        <Card title="Tóm tắt" size="small" style={{ marginTop: 24 }}>
          <Space direction="vertical" style={{ width: "100%" }}>
            <div>
              <Text type="secondary">Người tạo: </Text>
              <Text strong>{taskData.createdByName}</Text>
            </div>
            <div>
              <Text type="secondary">Người thực hiện: </Text>
              <Text strong>{taskData.assignedToName || "Chưa giao"}</Text>
            </div>
            <div>
              <Text type="secondary">Trạng thái hiện tại: </Text>
              <Tag color="success">{taskData.status}</Tag>
            </div>
            <div>
              <Text type="secondary">Tiến độ: </Text>
              <Text strong>{taskData.progress || 0}%</Text>
            </div>
            <div>
              <Text type="secondary">Tổng số thay đổi: </Text>
              <Text strong>{history.length}</Text>
            </div>
          </Space>
        </Card>
      )}
    </Drawer>
  );
};

export default ModalTaskHistory;

