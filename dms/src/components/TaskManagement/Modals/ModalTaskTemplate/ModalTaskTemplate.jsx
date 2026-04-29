import {
  FileTextOutlined,
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  CopyOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Form,
  Input,
  List,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  notification,
} from "antd";
import { useState, useEffect } from "react";
import { apiGetTaskTemplates, apiCreateTaskTemplate, apiDeleteTaskTemplate, apiUseTaskTemplate } from "../../API";

const { TextArea } = Input;
const { Option } = Select;
const { Text, Title } = Typography;

const TEMPLATE_CATEGORIES = [
  { value: "DEVELOPMENT", label: "Development", color: "blue" },
  { value: "DESIGN", label: "Design", color: "purple" },
  { value: "TESTING", label: "Testing", color: "green" },
  { value: "DOCUMENTATION", label: "Documentation", color: "orange" },
  { value: "MEETING", label: "Meeting", color: "cyan" },
  { value: "GENERAL", label: "General", color: "default" },
];

const ModalTaskTemplate = ({ visible, onCancel, onUseTemplate }) => {
  const [form] = Form.useForm();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    if (visible) {
      loadTemplates();
    }
  }, [visible]);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const response = await apiGetTaskTemplates({});
      if (response?.status === 200 && response?.data) {
        setTemplates(response.data);
      } else {
        // Sample templates
        setTemplates([
          {
            id: "1",
            name: "Bug Fix Template",
            category: "DEVELOPMENT",
            description: "Template cho việc fix bug",
            taskName: "Fix bug: {bug_description}",
            type: "BUG",
            priority: "HIGH",
            estimatedHours: 4,
            descriptionTemplate: "Bug mô tả: {bug_description}\n\nSteps to reproduce:\n1. {step1}\n2. {step2}\n\nExpected: {expected}\nActual: {actual}",
          },
          {
            id: "2",
            name: "Feature Development Template",
            category: "DEVELOPMENT",
            description: "Template cho phát triển tính năng mới",
            taskName: "Implement: {feature_name}",
            type: "FEATURE",
            priority: "MEDIUM",
            estimatedHours: 16,
            descriptionTemplate: "Feature: {feature_name}\n\nRequirements:\n- {req1}\n- {req2}\n\nAcceptance Criteria:\n- {criteria1}\n- {criteria2}",
          },
          {
            id: "3",
            name: "Code Review Template",
            category: "GENERAL",
            description: "Template cho code review",
            taskName: "Review: {pr_title}",
            type: "TASK",
            priority: "MEDIUM",
            estimatedHours: 2,
            descriptionTemplate: "PR: {pr_title}\n\nReview checklist:\n- [ ] Code quality\n- [ ] Tests coverage\n- [ ] Documentation",
          },
        ]);
      }
    } catch (error) {
      console.error("Error loading templates:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = async (values) => {
    setLoading(true);
    try {
      const response = await apiCreateTaskTemplate(values);
      if (response?.status === 200) {
        notification.success({
          message: "Thành công",
          description: "Đã tạo template",
        });
        setCreateModalVisible(false);
        form.resetFields();
        await loadTemplates();
      }
    } catch (error) {
      console.error("Error creating template:", error);
      notification.error({
        message: "Lỗi",
        description: "Không thể tạo template",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTemplate = async (templateId) => {
    setLoading(true);
    try {
      const response = await apiDeleteTaskTemplate({ templateId });
      if (response?.status === 200) {
        notification.success({
          message: "Thành công",
          description: "Đã xóa template",
        });
        await loadTemplates();
      }
    } catch (error) {
      console.error("Error deleting template:", error);
      notification.error({
        message: "Lỗi",
        description: "Không thể xóa template",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUseTemplate = async (template) => {
    try {
      const response = await apiUseTaskTemplate({ templateId: template.id });
      if (response?.status === 200 && response?.data) {
        onUseTemplate?.(response.data);
        onCancel();
      } else {
        // Fallback: use template data directly
        onUseTemplate?.(template);
        onCancel();
      }
    } catch (error) {
      console.error("Error using template:", error);
      // Fallback: use template data directly
      onUseTemplate?.(template);
      onCancel();
    }
  };

  const filteredTemplates = templates.filter((template) => {
    const matchCategory = selectedCategory === "ALL" || template.category === selectedCategory;
    const matchSearch =
      !searchText ||
      template.name.toLowerCase().includes(searchText.toLowerCase()) ||
      template.description?.toLowerCase().includes(searchText.toLowerCase());
    return matchCategory && matchSearch;
  });

  const columns = [
    {
      title: "Tên template",
      dataIndex: "name",
      key: "name",
      render: (text, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{text}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.description}
          </Text>
        </Space>
      ),
    },
    {
      title: "Danh mục",
      dataIndex: "category",
      key: "category",
      width: 120,
      render: (category) => {
        const cat = TEMPLATE_CATEGORIES.find((c) => c.value === category);
        return cat ? <Tag color={cat.color}>{cat.label}</Tag> : category;
      },
    },
    {
      title: "Loại",
      dataIndex: "type",
      key: "type",
      width: 100,
      render: (type) => {
        const typeColors = {
          TASK: "blue",
          BUG: "red",
          FEATURE: "green",
          SUPPORT: "purple",
        };
        return <Tag color={typeColors[type] || "default"}>{type}</Tag>;
      },
    },
    {
      title: "Thao tác",
      key: "action",
      width: 200,
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<CopyOutlined />}
            onClick={() => handleUseTemplate(record)}
          >
            Sử dụng
          </Button>
          <Button
            size="small"
            icon={<DeleteOutlined />}
            danger
            onClick={() => handleDeleteTemplate(record.id)}
            loading={loading}
          >
            Xóa
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Modal
        title={
          <Space>
            <FileTextOutlined />
            <span>Task Templates</span>
          </Space>
        }
        open={visible}
        onCancel={onCancel}
        footer={null}
        width={900}
      >
        <Space direction="vertical" style={{ width: "100%" }} size="large">
          {/* Filters */}
          <Space>
            <Select
              value={selectedCategory}
              onChange={setSelectedCategory}
              style={{ width: 150 }}
            >
              <Option value="ALL">Tất cả</Option>
              {TEMPLATE_CATEGORIES.map((cat) => (
                <Option key={cat.value} value={cat.value}>
                  {cat.label}
                </Option>
              ))}
            </Select>
            <Input
              placeholder="Tìm kiếm template..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 200 }}
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setCreateModalVisible(true)}
            >
              Tạo template
            </Button>
          </Space>

          {/* Templates Table */}
          <Table
            columns={columns}
            dataSource={filteredTemplates}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 10 }}
            size="small"
          />
        </Space>
      </Modal>

      {/* Create Template Modal */}
      <Modal
        title="Tạo template mới"
        open={createModalVisible}
        onCancel={() => {
          setCreateModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleCreateTemplate}>
          <Form.Item
            name="name"
            label="Tên template"
            rules={[{ required: true, message: "Vui lòng nhập tên template" }]}
          >
            <Input placeholder="Nhập tên template" />
          </Form.Item>

          <Form.Item
            name="category"
            label="Danh mục"
            rules={[{ required: true, message: "Vui lòng chọn danh mục" }]}
          >
            <Select placeholder="Chọn danh mục">
              {TEMPLATE_CATEGORIES.map((cat) => (
                <Option key={cat.value} value={cat.value}>
                  {cat.label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="description" label="Mô tả">
            <TextArea rows={2} placeholder="Nhập mô tả template" />
          </Form.Item>

          <Form.Item
            name="taskName"
            label="Tên công việc (có thể dùng {variable})"
            rules={[{ required: true, message: "Vui lòng nhập tên công việc" }]}
          >
            <Input placeholder="Ví dụ: Fix bug: {bug_description}" />
          </Form.Item>

          <Form.Item
            name="type"
            label="Loại"
            rules={[{ required: true, message: "Vui lòng chọn loại" }]}
          >
            <Select>
              <Option value="TASK">Công việc</Option>
              <Option value="BUG">Lỗi</Option>
              <Option value="FEATURE">Tính năng</Option>
              <Option value="SUPPORT">Hỗ trợ</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="priority"
            label="Độ ưu tiên"
            rules={[{ required: true, message: "Vui lòng chọn độ ưu tiên" }]}
          >
            <Select>
              <Option value="LOW">Thấp</Option>
              <Option value="MEDIUM">Trung bình</Option>
              <Option value="HIGH">Cao</Option>
              <Option value="URGENT">Khẩn cấp</Option>
            </Select>
          </Form.Item>

          <Form.Item name="estimatedHours" label="Số giờ ước tính">
            <Input type="number" placeholder="Nhập số giờ" />
          </Form.Item>

          <Form.Item
            name="descriptionTemplate"
            label="Mô tả template (có thể dùng {variable})"
          >
            <TextArea rows={6} placeholder="Nhập mô tả template với các biến" />
          </Form.Item>

          <Form.Item>
            <Space style={{ width: "100%", justifyContent: "flex-end" }}>
              <Button onClick={() => setCreateModalVisible(false)}>Hủy</Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                Tạo template
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default ModalTaskTemplate;






