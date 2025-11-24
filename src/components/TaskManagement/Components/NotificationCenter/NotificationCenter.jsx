import {
  BellOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import {
  Badge,
  Button,
  Card,
  List,
  Popover,
  Space,
  Tag,
  Typography,
  Empty,
} from "antd";
import { useState, useEffect } from "react";
import dayjs from "dayjs";
import { apiGetTaskNotifications, apiMarkNotificationRead, apiDeleteNotification } from "../../API";

const { Text } = Typography;

const NotificationCenter = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadNotifications();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    try {
      const response = await apiGetTaskNotifications({});
      if (response?.status === 200 && response?.data) {
        setNotifications(response.data);
      } else {
        // Sample notifications
        setNotifications([
          {
            id: "1",
            type: "task_assigned",
            title: "Đã được giao công việc",
            message: "Bạn đã được giao công việc: Thiết kế giao diện dashboard",
            taskId: "TASK-001",
            read: false,
            timestamp: dayjs().subtract(1, "hour").format("YYYY-MM-DD HH:mm"),
          },
          {
            id: "2",
            type: "task_due_soon",
            title: "Công việc sắp đến hạn",
            message: "Công việc 'Tích hợp cổng thanh toán' sẽ hết hạn trong 2 giờ",
            taskId: "TASK-002",
            read: false,
            timestamp: dayjs().subtract(30, "minute").format("YYYY-MM-DD HH:mm"),
          },
          {
            id: "3",
            type: "task_completed",
            title: "Công việc đã hoàn thành",
            message: "Công việc 'Xây dựng API báo cáo' đã được hoàn thành",
            taskId: "TASK-003",
            read: true,
            timestamp: dayjs().subtract(2, "hour").format("YYYY-MM-DD HH:mm"),
          },
        ]);
      }
    } catch (error) {
      console.error("Error loading notifications:", error);
    }
  };

  const handleMarkRead = async (notificationId) => {
    setLoading(true);
    try {
      const response = await apiMarkNotificationRead({ notificationId });
      if (response?.status === 200) {
        setNotifications(
          notifications.map((n) =>
            n.id === notificationId ? { ...n, read: true } : n
          )
        );
      } else {
        // Fallback: update locally
        setNotifications(
          notifications.map((n) =>
            n.id === notificationId ? { ...n, read: true } : n
          )
        );
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    setLoading(true);
    try {
      const response = await apiDeleteNotification({ notificationId });
      if (response?.status === 200) {
        setNotifications(notifications.filter((n) => n.id !== notificationId));
      } else {
        // Fallback: delete locally
        setNotifications(notifications.filter((n) => n.id !== notificationId));
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    setLoading(true);
    try {
      const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
      await Promise.all(
        unreadIds.map((id) => apiMarkNotificationRead({ notificationId: id }))
      );
      setNotifications(notifications.map((n) => ({ ...n, read: true })));
    } catch (error) {
      console.error("Error marking all as read:", error);
    } finally {
      setLoading(false);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getNotificationIcon = (type) => {
    switch (type) {
      case "task_assigned":
        return <CheckCircleOutlined style={{ color: "#1890ff" }} />;
      case "task_due_soon":
        return <BellOutlined style={{ color: "#fa8c16" }} />;
      case "task_completed":
        return <CheckCircleOutlined style={{ color: "#52c41a" }} />;
      case "task_overdue":
        return <CloseCircleOutlined style={{ color: "#ff4d4f" }} />;
      default:
        return <BellOutlined />;
    }
  };

  const notificationContent = (
    <Card
      title={
        <Space style={{ width: "100%", justifyContent: "space-between" }}>
          <Text strong>Thông báo ({unreadCount} mới)</Text>
          {unreadCount > 0 && (
            <Button size="small" onClick={handleMarkAllRead} loading={loading}>
              Đánh dấu tất cả đã đọc
            </Button>
          )}
        </Space>
      }
      style={{ width: 400, maxHeight: 500 }}
      bodyStyle={{ padding: 0, maxHeight: 400, overflowY: "auto" }}
    >
      {notifications.length > 0 ? (
        <List
          dataSource={notifications}
          renderItem={(item) => (
            <List.Item
              style={{
                backgroundColor: item.read ? "#fff" : "#e6f7ff",
                padding: "12px 16px",
              }}
              actions={[
                <Button
                  type="link"
                  size="small"
                  icon={<DeleteOutlined />}
                  onClick={() => handleDeleteNotification(item.id)}
                  loading={loading}
                />,
              ]}
            >
              <List.Item.Meta
                avatar={getNotificationIcon(item.type)}
                title={
                  <Space>
                    <Text strong={!item.read}>{item.title}</Text>
                    {!item.read && <Tag color="blue">Mới</Tag>}
                  </Space>
                }
                description={
                  <Space direction="vertical" size={0}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {item.message}
                    </Text>
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      {item.timestamp}
                    </Text>
                  </Space>
                }
                onClick={() => {
                  if (!item.read) {
                    handleMarkRead(item.id);
                  }
                }}
                style={{ cursor: "pointer" }}
              />
            </List.Item>
          )}
        />
      ) : (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="Không có thông báo"
          style={{ padding: "40px 0" }}
        />
      )}
    </Card>
  );

  return (
    <Popover
      content={notificationContent}
      title={null}
      trigger="click"
      placement="bottomRight"
      overlayStyle={{ padding: 0 }}
    >
      <Badge count={unreadCount} size="small">
        <Button
          type="text"
          icon={<BellOutlined />}
          style={{ fontSize: 18 }}
        />
      </Badge>
    </Popover>
  );
};

export default NotificationCenter;






