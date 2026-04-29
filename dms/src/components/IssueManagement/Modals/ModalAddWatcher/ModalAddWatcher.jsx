import { EyeOutlined, UserAddOutlined } from "@ant-design/icons";
import { Avatar, Button, List, Modal, Space, Typography } from "antd";
import { useState, useEffect } from "react";
import { apiAddIssueWatcher, apiGetIssueWatchers, apiRemoveIssueWatcher } from "../../API";

const { Text } = Typography;

const ModalAddWatcher = ({ visible, onCancel, issueId, currentWatchers = [] }) => {
  const [watchers, setWatchers] = useState(currentWatchers);
  const [allUsers, setAllUsers] = useState([
    { id: "1", name: "Nguyễn Văn A", email: "a@example.com" },
    { id: "2", name: "Trần Thị B", email: "b@example.com" },
    { id: "3", name: "Lê Văn C", email: "c@example.com" },
    { id: "4", name: "Phạm Thị D", email: "d@example.com" },
  ]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && issueId) {
      loadWatchers();
    }
  }, [visible, issueId]);

  const loadWatchers = async () => {
    try {
      const response = await apiGetIssueWatchers({ issueId });
      setWatchers(response?.data || []);
    } catch (error) {
      console.error("Error loading watchers:", error);
    }
  };

  const handleAddWatcher = async (userId) => {
    setLoading(true);
    try {
      await apiAddIssueWatcher({ issueId, userId });
      await loadWatchers();
    } catch (error) {
      console.error("Error adding watcher:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveWatcher = async (userId) => {
    setLoading(true);
    try {
      await apiRemoveIssueWatcher({ issueId, userId });
      await loadWatchers();
    } catch (error) {
      console.error("Error removing watcher:", error);
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
                  avatar={<Avatar>{watcher.name[0]}</Avatar>}
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
                    avatar={<Avatar>{user.name[0]}</Avatar>}
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

