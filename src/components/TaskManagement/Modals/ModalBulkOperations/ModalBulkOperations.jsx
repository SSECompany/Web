import {
  EditOutlined,
  DeleteOutlined,
  UserAddOutlined,
  SwapOutlined,
} from "@ant-design/icons";
import {
  Button,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  notification,
  Alert,
} from "antd";
import { useState } from "react";
import { apiBulkUpdateTasks, apiBulkDeleteTasks, apiBulkAssignTasks, apiBulkUpdateTaskStatus } from "../../API";

const { Option } = Select;
const { Text } = Typography;

const STATUS_OPTIONS = [
  { value: "PENDING", label: "Chờ thực hiện" },
  { value: "IN_PROGRESS", label: "Đang thực hiện" },
  { value: "REVIEW", label: "Đang xem xét" },
  { value: "COMPLETED", label: "Hoàn thành" },
  { value: "CANCELLED", label: "Đã hủy" },
];

const PRIORITY_OPTIONS = [
  { value: "LOW", label: "Thấp" },
  { value: "MEDIUM", label: "Trung bình" },
  { value: "HIGH", label: "Cao" },
  { value: "URGENT", label: "Khẩn cấp" },
];

const ModalBulkOperations = ({
  visible,
  onCancel,
  selectedTasks = [],
  operationType = "edit", // edit, delete, assign, status
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleBulkEdit = async (values) => {
    setLoading(true);
    try {
      const taskIds = selectedTasks.map((t) => t.id);
      const updateData = {
        taskIds,
        updates: {
          priority: values.priority,
          departmentId: values.departmentId,
          notes: values.notes,
        },
      };

      const response = await apiBulkUpdateTasks(updateData);
      if (response?.status === 200) {
        notification.success({
          message: "Thành công",
          description: `Đã cập nhật ${selectedTasks.length} công việc`,
        });
        onSuccess?.();
        form.resetFields();
        onCancel();
      }
    } catch (error) {
      console.error("Error bulk updating tasks:", error);
      notification.error({
        message: "Lỗi",
        description: "Không thể cập nhật công việc",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    setLoading(true);
    try {
      const taskIds = selectedTasks.map((t) => t.id);
      const response = await apiBulkDeleteTasks({ taskIds });
      if (response?.status === 200) {
        notification.success({
          message: "Thành công",
          description: `Đã xóa ${selectedTasks.length} công việc`,
        });
        onSuccess?.();
        onCancel();
      }
    } catch (error) {
      console.error("Error bulk deleting tasks:", error);
      notification.error({
        message: "Lỗi",
        description: "Không thể xóa công việc",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAssign = async (values) => {
    setLoading(true);
    try {
      const taskIds = selectedTasks.map((t) => t.id);
      const response = await apiBulkAssignTasks({
        taskIds,
        assignedToId: values.assignedToId,
      });
      if (response?.status === 200) {
        notification.success({
          message: "Thành công",
          description: `Đã giao ${selectedTasks.length} công việc`,
        });
        onSuccess?.();
        form.resetFields();
        onCancel();
      }
    } catch (error) {
      console.error("Error bulk assigning tasks:", error);
      notification.error({
        message: "Lỗi",
        description: "Không thể giao công việc",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBulkStatusChange = async (values) => {
    setLoading(true);
    try {
      const taskIds = selectedTasks.map((t) => t.id);
      const response = await apiBulkUpdateTaskStatus({
        taskIds,
        status: values.status,
      });
      if (response?.status === 200) {
        notification.success({
          message: "Thành công",
          description: `Đã đổi trạng thái ${selectedTasks.length} công việc`,
        });
        onSuccess?.();
        form.resetFields();
        onCancel();
      }
    } catch (error) {
      console.error("Error bulk updating status:", error);
      notification.error({
        message: "Lỗi",
        description: "Không thể đổi trạng thái",
      });
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    switch (operationType) {
      case "edit":
        return "Sửa hàng loạt";
      case "delete":
        return "Xóa hàng loạt";
      case "assign":
        return "Giao việc hàng loạt";
      case "status":
        return "Đổi trạng thái hàng loạt";
      default:
        return "Thao tác hàng loạt";
    }
  };

  const getIcon = () => {
    switch (operationType) {
      case "edit":
        return <EditOutlined />;
      case "delete":
        return <DeleteOutlined />;
      case "assign":
        return <UserAddOutlined />;
      case "status":
        return <SwapOutlined />;
      default:
        return null;
    }
  };

  const columns = [
    {
      title: "Mã",
      dataIndex: "taskCode",
      key: "taskCode",
      width: 120,
    },
    {
      title: "Tên công việc",
      dataIndex: "taskName",
      key: "taskName",
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status) => {
        const statusColors = {
          PENDING: "default",
          IN_PROGRESS: "processing",
          REVIEW: "warning",
          COMPLETED: "success",
          CANCELLED: "error",
        };
        return <Tag color={statusColors[status] || "default"}>{status}</Tag>;
      },
    },
  ];

  return (
    <Modal
      title={
        <Space>
          {getIcon()}
          <span>{getTitle()}</span>
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={700}
    >
      <Space direction="vertical" style={{ width: "100%" }} size="large">
        <Alert
          message={`Đã chọn ${selectedTasks.length} công việc`}
          type="info"
          showIcon
        />

        {/* Selected Tasks Table */}
        <Table
          columns={columns}
          dataSource={selectedTasks}
          rowKey="id"
          pagination={false}
          size="small"
          scroll={{ y: 200 }}
        />

        {/* Delete Operation */}
        {operationType === "delete" && (
          <div>
            <Alert
              message="Cảnh báo"
              description="Bạn có chắc chắn muốn xóa các công việc đã chọn? Hành động này không thể hoàn tác."
              type="warning"
              showIcon
            />
            <Space style={{ width: "100%", justifyContent: "flex-end", marginTop: 16 }}>
              <Button onClick={onCancel}>Hủy</Button>
              <Button
                danger
                type="primary"
                icon={<DeleteOutlined />}
                onClick={handleBulkDelete}
                loading={loading}
              >
                Xác nhận xóa
              </Button>
            </Space>
          </div>
        )}

        {/* Edit Operation */}
        {operationType === "edit" && (
          <Form form={form} layout="vertical" onFinish={handleBulkEdit}>
            <Form.Item name="priority" label="Độ ưu tiên">
              <Select placeholder="Chọn độ ưu tiên (để trống nếu không đổi)">
                {PRIORITY_OPTIONS.map((option) => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item name="notes" label="Ghi chú chung">
              <Input.TextArea rows={3} placeholder="Nhập ghi chú (tùy chọn)" />
            </Form.Item>

            <Form.Item>
              <Space style={{ width: "100%", justifyContent: "flex-end" }}>
                <Button onClick={onCancel}>Hủy</Button>
                <Button type="primary" htmlType="submit" loading={loading}>
                  Cập nhật
                </Button>
              </Space>
            </Form.Item>
          </Form>
        )}

        {/* Assign Operation */}
        {operationType === "assign" && (
          <Form form={form} layout="vertical" onFinish={handleBulkAssign}>
            <Form.Item
              name="assignedToId"
              label="Người thực hiện"
              rules={[{ required: true, message: "Vui lòng chọn người thực hiện" }]}
            >
              <Select
                placeholder="Chọn người thực hiện"
                showSearch
                filterOption={(input, option) =>
                  (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                }
              >
                {/* TODO: Load users from API */}
                <Option value="1">Nguyễn Văn A</Option>
                <Option value="2">Trần Thị B</Option>
                <Option value="3">Lê Văn C</Option>
              </Select>
            </Form.Item>

            <Form.Item>
              <Space style={{ width: "100%", justifyContent: "flex-end" }}>
                <Button onClick={onCancel}>Hủy</Button>
                <Button type="primary" htmlType="submit" loading={loading}>
                  Giao việc
                </Button>
              </Space>
            </Form.Item>
          </Form>
        )}

        {/* Status Change Operation */}
        {operationType === "status" && (
          <Form form={form} layout="vertical" onFinish={handleBulkStatusChange}>
            <Form.Item
              name="status"
              label="Trạng thái mới"
              rules={[{ required: true, message: "Vui lòng chọn trạng thái" }]}
            >
              <Select placeholder="Chọn trạng thái">
                {STATUS_OPTIONS.map((option) => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item>
              <Space style={{ width: "100%", justifyContent: "flex-end" }}>
                <Button onClick={onCancel}>Hủy</Button>
                <Button type="primary" htmlType="submit" loading={loading}>
                  Đổi trạng thái
                </Button>
              </Space>
            </Form.Item>
          </Form>
        )}
      </Space>
    </Modal>
  );
};

export default ModalBulkOperations;






