import React, { useState } from "react";
import { useParams } from "react-router-dom";
import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  Select,
  Tooltip,
  Modal,
  Descriptions,
  Badge,
} from "antd";
import {
  UserOutlined,
  PlusOutlined,
  EditOutlined,
  SettingOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";

const { Option } = Select;

const ProjectResources = () => {
  const { id } = useParams();
  const [permissionModalVisible, setPermissionModalVisible] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);

  const PERMISSIONS = {
    VIEW: "Xem",
    EDIT: "Chỉnh sửa",
    DELETE: "Xóa",
    MANAGE_MEMBERS: "Quản lý thành viên",
    MANAGE_DOCUMENTS: "Quản lý tài liệu",
    MANAGE_TASKS: "Quản lý công việc",
    VIEW_REPORTS: "Xem báo cáo",
    MANAGE_SETTINGS: "Quản lý cài đặt",
  };

  const ROLE_PERMISSIONS = {
    "Project Manager": [
      "VIEW",
      "EDIT",
      "DELETE",
      "MANAGE_MEMBERS",
      "MANAGE_DOCUMENTS",
      "MANAGE_TASKS",
      "VIEW_REPORTS",
      "MANAGE_SETTINGS",
    ],
    "Team Lead": [
      "VIEW",
      "EDIT",
      "MANAGE_DOCUMENTS",
      "MANAGE_TASKS",
      "VIEW_REPORTS",
    ],
    "Developer": ["VIEW", "EDIT", "MANAGE_TASKS"],
    "Designer": ["VIEW", "EDIT", "MANAGE_DOCUMENTS"],
    "Viewer": ["VIEW", "VIEW_REPORTS"],
  };

  const handleEditPermissions = (record) => {
    setSelectedMember(record);
    setPermissionModalVisible(true);
  };

  const handleRoleChange = (value, record) => {
    // In real app, this would update via API
    console.log("Role changed:", value, record);
  };

  const columns = [
    {
      title: "Tên nhân viên",
      dataIndex: "name",
      key: "name",
      render: (text, record) => (
        <Space>
          <UserOutlined />
          <span>{text}</span>
          {record.isManager && (
            <Badge status="success" text="PM" />
          )}
        </Space>
      ),
    },
    {
      title: "Vị trí",
      dataIndex: "position",
      key: "position",
    },
    {
      title: "Vai trò trong dự án",
      dataIndex: "role",
      key: "role",
      render: (role, record) => (
        <Select
          value={role}
          onChange={(value) => handleRoleChange(value, record)}
          style={{ width: 150 }}
          size="small"
        >
          {Object.keys(ROLE_PERMISSIONS).map((r) => (
            <Option key={r} value={r}>
              {r}
            </Option>
          ))}
        </Select>
      ),
    },
    {
      title: "Phân quyền",
      key: "permissions",
      render: (_, record) => {
        const permissions = ROLE_PERMISSIONS[record.role] || [];
        return (
          <Space>
            <Tooltip
              title={
                <div>
                  {permissions.map((p) => (
                    <div key={p}>• {PERMISSIONS[p]}</div>
                  ))}
                </div>
              }
            >
              <Tag color="blue">{permissions.length} quyền</Tag>
            </Tooltip>
            <Button
              type="link"
              icon={<SettingOutlined />}
              size="small"
              onClick={() => handleEditPermissions(record)}
            >
              Tùy chỉnh
            </Button>
          </Space>
        );
      },
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag color={status === "active" ? "green" : "default"}>
          {status === "active" ? "Đang làm việc" : "Không hoạt động"}
        </Tag>
      ),
    },
    {
      title: "Ngày tham gia",
      dataIndex: "joinDate",
      key: "joinDate",
    },
  ];

  const data = [
    {
      key: "1",
      name: "Nguyễn Văn A",
      position: "Senior Developer",
      role: "Project Manager",
      status: "active",
      joinDate: "2024-01-01",
      isManager: true,
      allocation: 100,
    },
    {
      key: "2",
      name: "Trần Thị B",
      position: "UI/UX Designer",
      role: "Designer",
      status: "active",
      joinDate: "2024-01-05",
      allocation: 80,
    },
    {
      key: "3",
      name: "Lê Văn C",
      position: "Junior Developer",
      role: "Developer",
      status: "active",
      joinDate: "2024-01-10",
      allocation: 100,
    },
  ];

  const selectedMemberPermissions =
    selectedMember && ROLE_PERMISSIONS[selectedMember.role]
      ? ROLE_PERMISSIONS[selectedMember.role]
      : [];

  return (
    <div style={{ padding: 24 }}>
      <Card
        title={`Nguồn lực dự án #${id}`}
        extra={
          <Button type="primary" icon={<PlusOutlined />}>
            Thêm nhân viên
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={data}
          pagination={{
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} thành viên`,
          }}
        />
      </Card>

      {/* Permission Modal */}
      <Modal
        title={`Phân quyền: ${selectedMember?.name}`}
        open={permissionModalVisible}
        onCancel={() => setPermissionModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setPermissionModalVisible(false)}>
            Hủy
          </Button>,
          <Button
            key="save"
            type="primary"
            onClick={() => {
              // Save permissions
              setPermissionModalVisible(false);
            }}
          >
            Lưu
          </Button>,
        ]}
        width={600}
      >
        {selectedMember && (
          <div>
            <Descriptions column={1} bordered size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="Vai trò hiện tại">
                {selectedMember.role}
              </Descriptions.Item>
              <Descriptions.Item label="Phân bổ thời gian">
                {selectedMember.allocation}%
              </Descriptions.Item>
            </Descriptions>

            <div>
              <h4>Quyền hạn hiện tại:</h4>
              <Space wrap style={{ marginTop: 8 }}>
                {selectedMemberPermissions.map((perm) => (
                  <Tag key={perm} color="green" icon={<CheckCircleOutlined />}>
                    {PERMISSIONS[perm]}
                  </Tag>
                ))}
              </Space>
            </div>

            <div style={{ marginTop: 16 }}>
              <h4>Tùy chỉnh quyền hạn:</h4>
              <div style={{ marginTop: 8 }}>
                {Object.entries(PERMISSIONS).map(([key, label]) => {
                  const hasPermission = selectedMemberPermissions.includes(key);
                  return (
                    <div
                      key={key}
                      style={{
                        padding: "8px",
                        margin: "4px 0",
                        background: hasPermission ? "#f6ffed" : "#fff",
                        border: `1px solid ${hasPermission ? "#b7eb8f" : "#d9d9d9"}`,
                        borderRadius: 4,
                        cursor: "pointer",
                      }}
                      onClick={() => {
                        // Toggle permission logic here
                        console.log("Toggle:", key);
                      }}
                    >
                      <Space>
                        {hasPermission ? (
                          <CheckCircleOutlined style={{ color: "#52c41a" }} />
                        ) : (
                          <CloseCircleOutlined style={{ color: "#8c8c8c" }} />
                        )}
                        <span>{label}</span>
                      </Space>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ProjectResources;









