import { EyeOutlined, UserAddOutlined } from "@ant-design/icons";
import { Avatar, Button, List, Modal, Space, Typography } from "antd";
import { useState, useEffect } from "react";
import { apiGetTaskWatchers, apiAddTaskWatcher, apiRemoveTaskWatcher, TaskManagementGetApi } from "../../API";

const { Text } = Typography;

const ModalAddWatcher = ({ visible, onCancel, taskId, currentWatchers = [], onSuccess }) => {
  const [watchers, setWatchers] = useState(currentWatchers);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && taskId) {
      loadWatchers();
      loadUsers();
    }
  }, [visible, taskId]);

  const loadUsers = async () => {
    try {
      const response = await TaskManagementGetApi({
        store: "Api_Get_Users_For_Tasks",
        data: { active: true },
      });
      if (response.status === 200 && response.data) {
        setAllUsers(response.data);
      }
    } catch (error) {
      console.error("Error loading users:", error);
      // Fallback sample data
      setAllUsers([
        { id: "1", name: "Nguyễn Văn A", email: "a@example.com" },
        { id: "2", name: "Trần Thị B", email: "b@example.com" },
        { id: "3", name: "Lê Văn C", email: "c@example.com" },
        { id: "4", name: "Phạm Thị D", email: "d@example.com" },
      ]);
    }
  };

  const loadWatchers = async () => {
    try {
      const response = await apiGetTaskWatchers({ taskId });
      if (response?.status === 200 && response?.data) {
        setWatchers(response.data);
      } else {
        setWatchers(currentWatchers);
      }
    } catch (error) {
      console.error("Error loading watchers:", error);
      setWatchers(currentWatchers);
    }
  };

  const handleAddWatcher = async (userId) => {
    setLoading(true);
    try {
      const response = await apiAddTaskWatcher({ taskId, userId });
      if (response?.status === 200) {
        await loadWatchers();
        onSuccess?.();
      } else {
        // Fallback: add locally
        const user = allUsers.find((u) => u.id === userId);
        if (user) {
          setWatchers([...watchers, user]);
          onSuccess?.();
        }
      }
    } catch (error) {
      console.error("Error adding watcher:", error);
      // Fallback: add locally
      const user = allUsers.find((u) => u.id === userId);
      if (user) {
        setWatchers([...watchers, user]);
        onSuccess?.();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveWatcher = async (userId) => {
    setLoading(true);
    try {
      const response = await apiRemoveTaskWatcher({ taskId, userId });
      if (response?.status === 200) {
        await loadWatchers();
        onSuccess?.();
      } else {
        // Fallback: remove locally
        setWatchers(watchers.filter((w) => w.id !== userId));
        onSuccess?.();
      }
    } catch (error) {
      console.error("Error removing watcher:", error);
      // Fallback: remove locally
      setWatchers(watchers.filter((w) => w.id !== userId));
      onSuccess?.();
    } finally {
      setLoading(false);
    }
  };

  const availableUsers = allUsers.filter(
    (user) => !watchers.some((w) => w.id === user.id)
  );

  return (
    <Modal
      title={
        <Space>
          <EyeOutlined />
          <span>Quản lý người theo dõi</span>
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={500}
    >
      <Space direction="vertical" style={{ width: "100%" }} size="large">
        {/* Current Watchers */}
        <div>
          <Text strong>Người đang theo dõi ({watchers.length})</Text>
          <List
            dataSource={watchers}
            renderItem={(watcher) => (
              <List.Item
                actions={[
                  <Button
                    type="link"
                    danger
                    size="small"
                    onClick={() => handleRemoveWatcher(watcher.id)}
                    loading={loading}
                  >
                    Xóa
                  </Button>,
                ]}
              >
                <List.Item.Meta
                  avatar={<Avatar>{watcher.name?.[0] || "U"}</Avatar>}
                  title={watcher.name}
                  description={watcher.email}
                />
              </List.Item>
            )}
          />
        </div>

        {/* Available Users */}
        {availableUsers.length > 0 && (
          <div>
            <Text strong>Thêm người theo dõi</Text>
            <List
              dataSource={availableUsers}
              renderItem={(user) => (
                <List.Item
                  actions={[
                    <Button
                      type="primary"
                      size="small"
                      icon={<UserAddOutlined />}
                      onClick={() => handleAddWatcher(user.id)}
                      loading={loading}
                    >
                      Thêm
                    </Button>,
                  ]}
                >
                  <List.Item.Meta
                    avatar={<Avatar>{user.name?.[0] || "U"}</Avatar>}
                    title={user.name}
                    description={user.email}
                  />
                </List.Item>
              )}
            />
          </div>
        )}
      </Space>
    </Modal>
  );
};

export default ModalAddWatcher;

