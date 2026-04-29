import { LinkOutlined } from "@ant-design/icons";
import { Button, Form, Modal, Select, Space, Table, Tag } from "antd";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiGetTaskDependencies, apiAddTaskDependency, apiRemoveTaskDependency } from "../../API";
import { useSelector } from "react-redux";

const { Option } = Select;

const DEPENDENCY_TYPES = [
  { value: "blocks", label: "Chặn", color: "red", description: "Công việc này chặn công việc khác" },
  { value: "blocked_by", label: "Bị chặn bởi", color: "red", description: "Công việc này bị chặn bởi công việc khác" },
  { value: "depends_on", label: "Phụ thuộc vào", color: "orange", description: "Công việc này phụ thuộc vào công việc khác" },
  { value: "required_by", label: "Được yêu cầu bởi", color: "orange", description: "Công việc này được yêu cầu bởi công việc khác" },
];

const ModalAddDependency = ({ visible, onCancel, taskId, currentDependencies = [], onSuccess }) => {
  const [form] = Form.useForm();
  const [dependencies, setDependencies] = useState(currentDependencies);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (visible && taskId) {
      loadDependencies();
    }
  }, [visible, taskId]);

  const loadDependencies = async () => {
    try {
      const response = await apiGetTaskDependencies({ taskId });
      if (response?.status === 200 && response?.data) {
        setDependencies(response.data);
      } else {
        setDependencies(currentDependencies);
      }
    } catch (error) {
      console.error("Error loading dependencies:", error);
      setDependencies(currentDependencies);
    }
  };

  const handleAddDependency = async (values) => {
    setLoading(true);
    try {
      const response = await apiAddTaskDependency({
        taskId,
        dependentTaskId: values.dependentTaskId,
        dependencyType: values.dependencyType,
      });
      if (response?.status === 200) {
        await loadDependencies();
        onSuccess?.();
        form.resetFields();
      } else {
        // Fallback: add locally
        const dependentTask = availableTasks.find((t) => t.id === values.dependentTaskId);
        if (dependentTask) {
          const newDependency = {
            id: Date.now().toString(),
            type: values.dependencyType,
            task: {
              id: dependentTask.id,
              title: dependentTask.taskName,
              status: dependentTask.status,
            },
          };
          setDependencies([...dependencies, newDependency]);
          onSuccess?.();
          form.resetFields();
        }
      }
    } catch (error) {
      console.error("Error adding dependency:", error);
      // Fallback: add locally
      const dependentTask = availableTasks.find((t) => t.id === values.dependentTaskId);
      if (dependentTask) {
        const newDependency = {
          id: Date.now().toString(),
          type: values.dependencyType,
          task: {
            id: dependentTask.id,
            title: dependentTask.taskName,
            status: dependentTask.status,
          },
        };
        setDependencies([...dependencies, newDependency]);
        onSuccess?.();
        form.resetFields();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveDependency = async (dependencyId) => {
    setLoading(true);
    try {
      const response = await apiRemoveTaskDependency({ taskId, dependencyId });
      if (response?.status === 200) {
        await loadDependencies();
        onSuccess?.();
      } else {
        // Fallback: remove locally
        setDependencies(dependencies.filter((d) => d.id !== dependencyId));
        onSuccess?.();
      }
    } catch (error) {
      console.error("Error removing dependency:", error);
      // Fallback: remove locally
      setDependencies(dependencies.filter((d) => d.id !== dependencyId));
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
      dataIndex: "type",
      key: "type",
      width: 150,
      render: (type) => {
        const dependency = DEPENDENCY_TYPES.find((d) => d.value === type);
        return dependency ? (
          <Tag color={dependency.color}>{dependency.label}</Tag>
        ) : type;
      },
    },
    {
      title: "Công việc",
      dataIndex: "task",
      key: "task",
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
      title: "Trạng thái",
      dataIndex: "task",
      key: "status",
      width: 120,
      render: (task) => {
        const statusColors = {
          PENDING: "default",
          IN_PROGRESS: "processing",
          REVIEW: "warning",
          COMPLETED: "success",
          CANCELLED: "error",
        };
        return <Tag color={statusColors[task.status] || "default"}>{task.status}</Tag>;
      },
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
          onClick={() => handleRemoveDependency(record.id)}
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
          <span>Quản lý phụ thuộc công việc</span>
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={700}
    >
      <Space direction="vertical" style={{ width: "100%" }} size="large">
        {/* Add Dependency Form */}
        <Form form={form} layout="vertical" onFinish={handleAddDependency}>
          <Form.Item
            name="dependencyType"
            label="Loại phụ thuộc"
            rules={[{ required: true, message: "Vui lòng chọn loại phụ thuộc" }]}
          >
            <Select placeholder="Chọn loại phụ thuộc">
              {DEPENDENCY_TYPES.map((type) => (
                <Option key={type.value} value={type.value}>
                  {type.label} - {type.description}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="dependentTaskId"
            label="Công việc phụ thuộc"
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
              Thêm phụ thuộc
            </Button>
          </Form.Item>
        </Form>

        {/* Dependencies List */}
        <div>
          <Table
            columns={columns}
            dataSource={dependencies}
            rowKey="id"
            pagination={false}
            size="small"
          />
        </div>
      </Space>
    </Modal>
  );
};

export default ModalAddDependency;

