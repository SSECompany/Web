import { CheckSquareOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Form, Input, Modal, Select, Space, Table, Tag, Checkbox } from "antd";
import { useState, useEffect } from "react";
import { apiGetTaskSubtasks, apiAddTaskSubtask, apiUpdateTaskSubtask, apiDeleteTaskSubtask } from "../../API";

const { Option } = Select;
const { TextArea } = Input;

const STATUS_OPTIONS = [
  { value: "PENDING", label: "Chờ thực hiện" },
  { value: "IN_PROGRESS", label: "Đang thực hiện" },
  { value: "REVIEW", label: "Đang xem xét" },
  { value: "COMPLETED", label: "Hoàn thành" },
  { value: "CANCELLED", label: "Đã hủy" },
];

const ModalAddSubtask = ({ visible, onCancel, taskId, currentSubtasks = [], onSuccess }) => {
  const [form] = Form.useForm();
  const [subtasks, setSubtasks] = useState(currentSubtasks);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && taskId) {
      loadSubtasks();
    }
  }, [visible, taskId]);

  const loadSubtasks = async () => {
    try {
      const response = await apiGetTaskSubtasks({ taskId });
      if (response?.status === 200 && response?.data) {
        setSubtasks(response.data);
      } else {
        setSubtasks(currentSubtasks);
      }
    } catch (error) {
      console.error("Error loading subtasks:", error);
      setSubtasks(currentSubtasks);
    }
  };

  const handleAddSubtask = async (values) => {
    setLoading(true);
    try {
      const response = await apiAddTaskSubtask({
        taskId,
        title: values.title,
        description: values.description,
        status: values.status || "PENDING",
        assignedToId: values.assignedToId,
      });
      if (response?.status === 200) {
        await loadSubtasks();
        onSuccess?.();
        form.resetFields();
      } else {
        // Fallback: add locally
        const newSubtask = {
          id: `SUB-${Date.now()}`,
          title: values.title,
          description: values.description,
          status: values.status || "PENDING",
          progress: values.status === "COMPLETED" ? 100 : 0,
          assignedToName: values.assignedToName || "Chưa giao",
        };
        setSubtasks([...subtasks, newSubtask]);
        onSuccess?.();
        form.resetFields();
      }
    } catch (error) {
      console.error("Error adding subtask:", error);
      // Fallback: add locally
      const newSubtask = {
        id: `SUB-${Date.now()}`,
        title: values.title,
        description: values.description,
        status: values.status || "PENDING",
        progress: values.status === "COMPLETED" ? 100 : 0,
        assignedToName: values.assignedToName || "Chưa giao",
      };
      setSubtasks([...subtasks, newSubtask]);
      onSuccess?.();
      form.resetFields();
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSubtask = async (subtaskId, completed) => {
    setLoading(true);
    try {
      const response = await apiUpdateTaskSubtask({
        taskId,
        subtaskId,
        status: completed ? "COMPLETED" : "PENDING",
        progress: completed ? 100 : 0,
      });
      if (response?.status === 200) {
        await loadSubtasks();
        onSuccess?.();
      } else {
        // Fallback: update locally
        setSubtasks(
          subtasks.map((st) =>
            st.id === subtaskId
              ? {
                  ...st,
                  status: completed ? "COMPLETED" : "PENDING",
                  progress: completed ? 100 : 0,
                }
              : st
          )
        );
        onSuccess?.();
      }
    } catch (error) {
      console.error("Error updating subtask:", error);
      // Fallback: update locally
      setSubtasks(
        subtasks.map((st) =>
          st.id === subtaskId
            ? {
                ...st,
                status: completed ? "COMPLETED" : "PENDING",
                progress: completed ? 100 : 0,
              }
            : st
        )
      );
      onSuccess?.();
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSubtask = async (subtaskId) => {
    setLoading(true);
    try {
      const response = await apiDeleteTaskSubtask({ taskId, subtaskId });
      if (response?.status === 200) {
        await loadSubtasks();
        onSuccess?.();
      } else {
        // Fallback: delete locally
        setSubtasks(subtasks.filter((st) => st.id !== subtaskId));
        onSuccess?.();
      }
    } catch (error) {
      console.error("Error deleting subtask:", error);
      // Fallback: delete locally
      setSubtasks(subtasks.filter((st) => st.id !== subtaskId));
      onSuccess?.();
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: "Hoàn thành",
      key: "completed",
      width: 100,
      render: (_, record) => (
        <Checkbox
          checked={record.status === "COMPLETED"}
          onChange={(e) => handleToggleSubtask(record.id, e.target.checked)}
        />
      ),
    },
    {
      title: "Tiêu đề",
      dataIndex: "title",
      key: "title",
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status) => {
        const statusMeta = STATUS_OPTIONS.find((s) => s.value === status);
        return statusMeta ? (
          <Tag color={status === "COMPLETED" ? "green" : status === "IN_PROGRESS" ? "blue" : "default"}>
            {statusMeta.label}
          </Tag>
        ) : status;
      },
    },
    {
      title: "Người thực hiện",
      dataIndex: "assignedToName",
      key: "assignedToName",
      width: 150,
    },
    {
      title: "Thao tác",
      key: "action",
      width: 100,
      render: (_, record) => (
        <Button
          type="link"
          danger
          size="small"
          onClick={() => handleDeleteSubtask(record.id)}
          loading={loading}
        >
          Xóa
        </Button>
      ),
    },
  ];

  return (
    <Modal
      title={
        <Space>
          <CheckSquareOutlined />
          <span>Quản lý công việc con</span>
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={800}
    >
      <Space direction="vertical" style={{ width: "100%" }} size="large">
        {/* Add Subtask Form */}
        <Form form={form} layout="vertical" onFinish={handleAddSubtask}>
          <Form.Item
            name="title"
            label="Tiêu đề"
            rules={[{ required: true, message: "Vui lòng nhập tiêu đề" }]}
          >
            <Input placeholder="Nhập tiêu đề công việc con" />
          </Form.Item>

          <Form.Item name="description" label="Mô tả">
            <TextArea rows={2} placeholder="Nhập mô tả (tùy chọn)" />
          </Form.Item>

          <Form.Item name="status" label="Trạng thái" initialValue="PENDING">
            <Select>
              {STATUS_OPTIONS.map((option) => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} icon={<PlusOutlined />} block>
              Thêm công việc con
            </Button>
          </Form.Item>
        </Form>

        {/* Subtasks List */}
        <div>
          <Table
            columns={columns}
            dataSource={subtasks}
            rowKey="id"
            pagination={false}
            size="small"
          />
        </div>
      </Space>
    </Modal>
  );
};

export default ModalAddSubtask;

