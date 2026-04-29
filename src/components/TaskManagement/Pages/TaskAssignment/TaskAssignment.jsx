import React, { useState } from "react";
import {
  Card,
  Table,
  Button,
  Tag,
  Select,
  Space,
  Input,
  Modal,
  message,
  Checkbox,
} from "antd";
import {
  UserAddOutlined,
  SearchOutlined,
  TeamOutlined,
  CheckOutlined,
} from "@ant-design/icons";

const { Option } = Select;
const { Search } = Input;

const TaskAssignment = () => {
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [bulkAssignModalVisible, setBulkAssignModalVisible] = useState(false);
  const [selectedAssignee, setSelectedAssignee] = useState(null);

  const handleBulkAssign = () => {
    if (selectedRowKeys.length === 0) {
      message.warning("Vui lòng chọn ít nhất một công việc");
      return;
    }
    setBulkAssignModalVisible(true);
  };

  const handleConfirmBulkAssign = () => {
    if (!selectedAssignee) {
      message.warning("Vui lòng chọn người được giao");
      return;
    }
    message.success(
      `Đã giao ${selectedRowKeys.length} công việc cho ${selectedAssignee}`
    );
    setBulkAssignModalVisible(false);
    setSelectedRowKeys([]);
    setSelectedAssignee(null);
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys) => {
      setSelectedRowKeys(newSelectedRowKeys);
    },
    getCheckboxProps: (record) => ({
      disabled: !!record.assignedTo, // Disable if already assigned
    }),
  };

  const columns = [
    {
      title: "Mã công việc",
      dataIndex: "taskCode",
      key: "taskCode",
      width: 150,
      ellipsis: true,
      render: (text) => <span style={{ whiteSpace: "nowrap" }}>{text}</span>,
    },
    {
      title: "Tên công việc",
      dataIndex: "taskName",
      key: "taskName",
      width: 250,
      ellipsis: true,
      render: (text) => <span style={{ whiteSpace: "nowrap" }}>{text}</span>,
    },
    {
      title: "Dự án",
      dataIndex: "projectName",
      key: "projectName",
      width: 180,
      ellipsis: true,
      render: (text) => <span style={{ whiteSpace: "nowrap" }}>{text}</span>,
    },
    {
      title: "Độ ưu tiên",
      dataIndex: "priority",
      key: "priority",
      width: 130,
      ellipsis: true,
      render: (priority) => {
        const colors = { HIGH: "red", MEDIUM: "orange", LOW: "blue" };
        const labels = { HIGH: "Cao", MEDIUM: "Trung bình", LOW: "Thấp" };
        return <Tag color={colors[priority]} style={{ whiteSpace: "nowrap" }}>{labels[priority]}</Tag>;
      },
    },
    {
      title: "Ngày hết hạn",
      dataIndex: "dueDate",
      key: "dueDate",
      width: 130,
      ellipsis: true,
      render: (date) => <span style={{ whiteSpace: "nowrap" }}>{date}</span>,
    },
    {
      title: "Người thực hiện",
      dataIndex: "assignedTo",
      key: "assignedTo",
      width: 170,
      ellipsis: true,
      render: (assignedTo) =>
        assignedTo ? (
          <Tag color="green" style={{ whiteSpace: "nowrap" }}>{assignedTo}</Tag>
        ) : (
          <Tag color="default" style={{ whiteSpace: "nowrap" }}>Chưa giao</Tag>
        ),
    },
    {
      title: "Thao tác",
      key: "action",
      width: 150,
      align: "center",
      ellipsis: true,
      render: (_, record) => (
        <Button
          type="primary"
          icon={<UserAddOutlined />}
          size="small"
          disabled={!!record.assignedTo}
          style={{ whiteSpace: "nowrap" }}
        >
          {record.assignedTo ? "Đã giao" : "Giao việc"}
        </Button>
      ),
    },
  ];

  const data = [
    {
      key: "1",
      taskCode: "TASK001",
      taskName: "Phát triển tính năng đăng nhập",
      projectName: "Dự án A",
      priority: "HIGH",
      dueDate: "25/01/2024",
      assignedTo: null,
    },
    {
      key: "2",
      taskCode: "TASK002",
      taskName: "Thiết kế giao diện dashboard",
      projectName: "Dự án B",
      priority: "MEDIUM",
      dueDate: "30/01/2024",
      assignedTo: "Trần Thị B",
    },
    {
      key: "3",
      taskCode: "TASK003",
      taskName: "Viết unit test",
      projectName: "Dự án A",
      priority: "HIGH",
      dueDate: "28/01/2024",
      assignedTo: null,
    },
    {
      key: "4",
      taskCode: "TASK004",
      taskName: "Code review",
      projectName: "Dự án B",
      priority: "LOW",
      dueDate: "02/02/2024",
      assignedTo: null,
    },
  ];

  const availableMembers = [
    "Nguyễn Văn A",
    "Trần Thị B",
    "Lê Văn C",
    "Phạm Thị D",
  ];

  return (
    <div style={{ padding: 24 }}>
      <Card
        title="Giao việc"
        extra={
          <Space>
            {selectedRowKeys.length > 0 && (
              <Tag color="blue">
                Đã chọn: {selectedRowKeys.length} công việc
              </Tag>
            )}
            <Button
              type="primary"
              icon={<TeamOutlined />}
              onClick={handleBulkAssign}
              disabled={selectedRowKeys.length === 0}
            >
              Giao hàng loạt ({selectedRowKeys.length})
            </Button>
          </Space>
        }
      >
        <div style={{ marginBottom: 16 }}>
          <Space wrap>
            <Search
              placeholder="Tìm kiếm công việc..."
              style={{ width: 300 }}
              prefix={<SearchOutlined />}
            />
            <Select placeholder="Dự án" style={{ width: 150 }}>
              <Option value="">Tất cả</Option>
              <Option value="project1">Dự án A</Option>
              <Option value="project2">Dự án B</Option>
            </Select>
            <Select placeholder="Độ ưu tiên" style={{ width: 150 }}>
              <Option value="">Tất cả</Option>
              <Option value="HIGH">Cao</Option>
              <Option value="MEDIUM">Trung bình</Option>
              <Option value="LOW">Thấp</Option>
            </Select>
            <Select placeholder="Trạng thái" style={{ width: 150 }}>
              <Option value="">Tất cả</Option>
              <Option value="assigned">Đã giao</Option>
              <Option value="unassigned">Chưa giao</Option>
            </Select>
          </Space>
        </div>

        <Table
          rowSelection={rowSelection}
          columns={columns}
          dataSource={data}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} của ${total} công việc`,
          }}
          scroll={{ x: 'max-content' }}
        />
      </Card>

      {/* Bulk Assign Modal */}
      <Modal
        title={`Giao hàng loạt ${selectedRowKeys.length} công việc`}
        open={bulkAssignModalVisible}
        onCancel={() => {
          setBulkAssignModalVisible(false);
          setSelectedAssignee(null);
        }}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setBulkAssignModalVisible(false);
              setSelectedAssignee(null);
            }}
          >
            Hủy
          </Button>,
          <Button
            key="assign"
            type="primary"
            icon={<CheckOutlined />}
            onClick={handleConfirmBulkAssign}
            disabled={!selectedAssignee}
          >
            Xác nhận giao việc
          </Button>,
        ]}
      >
        <div>
          <p style={{ marginBottom: 16 }}>
            Bạn đang giao <strong>{selectedRowKeys.length} công việc</strong> cho:
          </p>
          <Select
            placeholder="Chọn người được giao"
            style={{ width: "100%" }}
            value={selectedAssignee}
            onChange={setSelectedAssignee}
            showSearch
            filterOption={(input, option) =>
              (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
            }
          >
            {availableMembers.map((member) => (
              <Option key={member} value={member} label={member}>
                <Space>
                  <TeamOutlined />
                  {member}
                </Space>
              </Option>
            ))}
          </Select>
          <div style={{ marginTop: 16, padding: 12, background: "#f5f5f5", borderRadius: 4 }}>
            <p style={{ margin: 0, fontWeight: 500 }}>Lưu ý:</p>
            <ul style={{ margin: "8px 0 0 0", paddingLeft: 20 }}>
              <li>Tất cả công việc đã chọn sẽ được giao cho một người</li>
              <li>Người được giao sẽ nhận thông báo về các công việc mới</li>
              <li>Bạn có thể giao lại từng công việc sau nếu cần</li>
            </ul>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default TaskAssignment;









