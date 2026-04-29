import { LinkOutlined } from "@ant-design/icons";
import { Button, Form, Input, Modal, Select, Space, Table, Tag } from "antd";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiGetTaskRelations, apiAddTaskRelation, apiRemoveTaskRelation } from "../../API";
import { useSelector } from "react-redux";

const { Option } = Select;

const RELATION_TYPES = [
  { value: "relates", label: "Liên quan", color: "blue" },
  { value: "duplicates", label: "Trùng lặp", color: "orange" },
  { value: "duplicated_by", label: "Bị trùng lặp bởi", color: "orange" },
  { value: "blocks", label: "Chặn", color: "red" },
  { value: "blocked_by", label: "Bị chặn bởi", color: "red" },
  { value: "precedes", label: "Đứng trước", color: "purple" },
  { value: "follows", label: "Theo sau", color: "purple" },
  { value: "copied_to", label: "Sao chép đến", color: "cyan" },
  { value: "copied_from", label: "Sao chép từ", color: "cyan" },
];

const ModalAddRelation = ({ visible, onCancel, taskId, currentTaskTitle, onSuccess }) => {
  const [form] = Form.useForm();
  const [relations, setRelations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (visible && taskId) {
      loadRelations();
    }
  }, [visible, taskId]);

  const loadRelations = async () => {
    try {
      const response = await apiGetTaskRelations({ taskId });
      if (response?.status === 200 && response?.data) {
        setRelations(response.data);
      }
    } catch (error) {
      console.error("Error loading relations:", error);
    }
  };

  const handleAddRelation = async (values) => {
    setLoading(true);
    try {
      const response = await apiAddTaskRelation({
        taskId,
        relatedTaskId: values.relatedTaskId,
        relationType: values.relationType,
      });
      if (response?.status === 200) {
        await loadRelations();
        onSuccess?.();
        form.resetFields();
      } else {
        // Fallback: add locally
        const relatedTask = availableTasks.find((t) => t.id === values.relatedTaskId);
        if (relatedTask) {
          const newRelation = {
            id: Date.now().toString(),
            relationType: values.relationType,
            relatedTask: {
              id: relatedTask.id,
              title: relatedTask.taskName,
              status: relatedTask.status,
            },
          };
          setRelations([...relations, newRelation]);
          onSuccess?.();
          form.resetFields();
        }
      }
    } catch (error) {
      console.error("Error adding relation:", error);
      // Fallback: add locally
      const relatedTask = availableTasks.find((t) => t.id === values.relatedTaskId);
      if (relatedTask) {
        const newRelation = {
          id: Date.now().toString(),
          relationType: values.relationType,
          relatedTask: {
            id: relatedTask.id,
            title: relatedTask.taskName,
            status: relatedTask.status,
          },
        };
        setRelations([...relations, newRelation]);
        onSuccess?.();
        form.resetFields();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveRelation = async (relationId) => {
    setLoading(true);
    try {
      const response = await apiRemoveTaskRelation({ taskId, relationId });
      if (response?.status === 200) {
        await loadRelations();
        onSuccess?.();
      } else {
        // Fallback: remove locally
        setRelations(relations.filter((r) => r.id !== relationId));
        onSuccess?.();
      }
    } catch (error) {
      console.error("Error removing relation:", error);
      // Fallback: remove locally
      setRelations(relations.filter((r) => r.id !== relationId));
      onSuccess?.();
    } finally {
      setLoading(false);
    }
  };

  // Get available tasks (excluding current task)
  const { tasksList } = useSelector((state) => state.tasks);
  const allTasks = tasksList || [];
  const availableTasks = allTasks.filter((task) => task.id !== taskId);

  const filteredTasks = availableTasks.filter(
    (task) =>
      task.taskCode?.toLowerCase().includes(searchText.toLowerCase()) ||
      task.taskName?.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns = [
    {
      title: "Loại",
      dataIndex: "relationType",
      key: "relationType",
      width: 150,
      render: (type) => {
        const relation = RELATION_TYPES.find((r) => r.value === type);
        return relation ? (
          <Tag color={relation.color}>{relation.label}</Tag>
        ) : type;
      },
    },
    {
      title: "Công việc",
      dataIndex: "relatedTask",
      key: "relatedTask",
      render: (task) => (
        <a
          onClick={() => {
            navigate(`/workflow/task-management/task/${task.id}`);
            onCancel();
          }}
        >
          {task.id} - {task.title}
        </a>
      ),
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
          onClick={() => handleRemoveRelation(record.id)}
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
          <LinkOutlined />
          <span>Quản lý liên kết công việc</span>
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={700}
    >
      <Space direction="vertical" style={{ width: "100%" }} size="large">
        {/* Add Relation Form */}
        <Form form={form} layout="vertical" onFinish={handleAddRelation}>
          <Form.Item
            name="relationType"
            label="Loại liên kết"
            rules={[{ required: true, message: "Vui lòng chọn loại liên kết" }]}
          >
            <Select placeholder="Chọn loại liên kết">
              {RELATION_TYPES.map((type) => (
                <Option key={type.value} value={type.value}>
                  {type.label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="relatedTaskId"
            label="Công việc liên quan"
            rules={[{ required: true, message: "Vui lòng chọn công việc" }]}
          >
            <Select
              showSearch
              placeholder="Tìm kiếm công việc..."
              filterOption={false}
              onSearch={setSearchText}
              notFoundContent={null}
            >
              {filteredTasks.map((task) => (
                <Option key={task.id} value={task.id}>
                  {task.taskCode} - {task.taskName}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              Thêm liên kết
            </Button>
          </Form.Item>
        </Form>

        {/* Relations List */}
        <div>
          <Table
            columns={columns}
            dataSource={relations}
            rowKey="id"
            pagination={false}
            size="small"
          />
        </div>
      </Space>
    </Modal>
  );
};

export default ModalAddRelation;

