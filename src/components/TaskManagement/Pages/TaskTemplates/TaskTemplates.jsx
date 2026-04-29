import {
  FileTextOutlined,
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  CopyOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Tag,
  Typography,
  Row,
  Col,
  Empty,
  Popconfirm,
  notification,
  Avatar,
} from "antd";
import { useState, useEffect } from "react";
import HeaderTableBar from "../../../ReuseComponents/HeaderTableBar";
import { apiGetTaskTemplates, apiCreateTaskTemplate, apiDeleteTaskTemplate } from "../../API";
import "./TaskTemplates.css";

const { TextArea } = Input;
const { Option } = Select;
const { Text, Title } = Typography;

const TEMPLATE_CATEGORIES = [
  { value: "DEVELOPMENT", label: "Phát triển", color: "blue" },
  { value: "DESIGN", label: "Thiết kế", color: "purple" },
  { value: "TESTING", label: "Kiểm thử", color: "green" },
  { value: "DOCUMENTATION", label: "Tài liệu", color: "orange" },
  { value: "MEETING", label: "Họp", color: "cyan" },
  { value: "GENERAL", label: "Khác", color: "default" },
];

const TaskTemplates = () => {
  const [form] = Form.useForm();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    loadTemplates();
  }, []);

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
            name: "Mẫu sửa lỗi",
            category: "DEVELOPMENT",
            description: "Template cho việc fix bug",
            taskName: "Fix bug: {bug_description}",
            type: "BUG",
            priority: "HIGH",
            estimatedHours: 4,
            descriptionTemplate: "Bug mô tả: {bug_description}\n\nSteps to reproduce:\n1. {step1}\n2. {step2}\n\nExpected: {expected}\nActual: {actual}",
            usageCount: 12,
            createdAt: "2024-01-15",
          },
          {
            id: "2",
            name: "Mẫu phát triển tính năng",
            category: "DEVELOPMENT",
            description: "Template cho phát triển tính năng mới",
            taskName: "Implement: {feature_name}",
            type: "FEATURE",
            priority: "MEDIUM",
            estimatedHours: 16,
            descriptionTemplate: "Feature: {feature_name}\n\nRequirements:\n- {req1}\n- {req2}\n\nAcceptance Criteria:\n- {criteria1}\n- {criteria2}",
            usageCount: 8,
            createdAt: "2024-01-10",
          },
          {
            id: "3",
            name: "Mẫu code review",
            category: "GENERAL",
            description: "Template cho code review",
            taskName: "Review: {pr_title}",
            type: "TASK",
            priority: "MEDIUM",
            estimatedHours: 2,
            descriptionTemplate: "PR: {pr_title}\n\nReview checklist:\n- [ ] Code quality\n- [ ] Tests coverage\n- [ ] Documentation",
            usageCount: 25,
            createdAt: "2024-01-05",
          },
          {
            id: "4",
            name: "Mẫu thiết kế UI",
            category: "DESIGN",
            description: "Template cho thiết kế giao diện",
            taskName: "Design: {screen_name}",
            type: "TASK",
            priority: "MEDIUM",
            estimatedHours: 8,
            descriptionTemplate: "Screen: {screen_name}\n\nRequirements:\n- {req1}\n- {req2}",
            usageCount: 15,
            createdAt: "2024-01-12",
          },
        ]);
      }
    } catch (error) {
      console.error("Error loading templates:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (values) => {
    try {
      const response = await apiCreateTaskTemplate(values);
      if (response?.status === 200) {
        notification.success({
          message: "Thành công",
          description: "Đã tạo template mới",
        });
        setCreateModalVisible(false);
        form.resetFields();
        loadTemplates();
      }
    } catch (error) {
      notification.error({
        message: "Lỗi",
        description: "Không thể tạo template",
      });
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await apiDeleteTaskTemplate({ id });
      if (response?.status === 200) {
        notification.success({
          message: "Thành công",
          description: "Đã xóa template",
        });
        loadTemplates();
      }
    } catch (error) {
      notification.error({
        message: "Lỗi",
        description: "Không thể xóa template",
      });
    }
  };

  const handleUseTemplate = (template) => {
    notification.info({
      message: "Sử dụng template",
      description: `Template "${template.name}" đã được áp dụng. Chuyển đến form tạo công việc...`,
    });
    // Navigate to task creation with template data
    window.location.href = `/workflow/task-management/tasks?template=${template.id}`;
  };

  const filteredTemplates = templates.filter((template) => {
    const matchCategory = selectedCategory === "ALL" || template.category === selectedCategory;
    const matchSearch = !searchText || 
      template.name.toLowerCase().includes(searchText.toLowerCase()) ||
      template.description?.toLowerCase().includes(searchText.toLowerCase());
    return matchCategory && matchSearch;
  });

  const getCategoryInfo = (category) => {
    return TEMPLATE_CATEGORIES.find((c) => c.value === category) || TEMPLATE_CATEGORIES[5];
  };

  return (
    <div className="task-templates-container">
      <HeaderTableBar
        title="Công việc mẫu"
        buttonTitle="Tạo mẫu mới"
        buttonIcon={<PlusOutlined />}
        onButtonClick={() => setCreateModalVisible(true)}
      />

      {/* Filters */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col flex="auto">
            <Input
              placeholder="Tìm kiếm mẫu..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
              style={{ maxWidth: 400 }}
            />
          </Col>
          <Col>
            <Select
              value={selectedCategory}
              onChange={setSelectedCategory}
              style={{ width: 200 }}
            >
              <Option value="ALL">Tất cả hạng mục</Option>
              {TEMPLATE_CATEGORIES.map((cat) => (
                <Option key={cat.value} value={cat.value}>
                  {cat.label}
                </Option>
              ))}
            </Select>
          </Col>
        </Row>
      </Card>

      {/* Template Grid */}
      {filteredTemplates.length > 0 ? (
        <Row gutter={[16, 16]}>
          {filteredTemplates.map((template) => {
            const categoryInfo = getCategoryInfo(template.category);
            return (
              <Col xs={24} sm={12} lg={8} xl={6} key={template.id}>
                <Card
                  className="template-card"
                  hoverable
                  actions={[
                    <Button
                      type="link"
                      icon={<CopyOutlined />}
                      onClick={() => handleUseTemplate(template)}
                    >
                      Sử dụng
                    </Button>,
                    <Button
                      type="link"
                      icon={<EditOutlined />}
                      onClick={() => {
                        // TODO: Edit template
                        notification.info({ message: "Chức năng đang phát triển" });
                      }}
                    >
                      Sửa
                    </Button>,
                    <Popconfirm
                      title="Xóa template này?"
                      onConfirm={() => handleDelete(template.id)}
                      okText="Xóa"
                      cancelText="Hủy"
                    >
                      <Button
                        type="link"
                        danger
                        icon={<DeleteOutlined />}
                      >
                        Xóa
                      </Button>
                    </Popconfirm>,
                  ]}
                >
                  <Card.Meta
                    avatar={
                      <Avatar
                        style={{
                          backgroundColor:
                            categoryInfo.color === "default" ? "#d9d9d9" : undefined,
                        }}
                        icon={<FileTextOutlined />}
                      />
                    }
                    title={
                      <Space size={6}>
                        <Text strong>{template.name}</Text>
                        <Tag color={categoryInfo.color}>{categoryInfo.label}</Tag>
                      </Space>
                    }
                    description={
                      <div>
                        <Text
                          type="secondary"
                          style={{ fontSize: 12 }}
                          className="template-card__description-text"
                        >
                          {template.description || "Không có mô tả"}
                        </Text>
                        <div
                          className="template-card__meta-row"
                          style={{ fontSize: 11 }}
                        >
                          <Text type="secondary">Loại: {template.type}</Text>
                          <Text type="secondary">•</Text>
                          <Text type="secondary">
                            Ưu tiên: {template.priority}
                          </Text>
                          {template.estimatedHours && (
                            <>
                              <Text type="secondary">•</Text>
                              <Text type="secondary">
                                Ước tính: {template.estimatedHours}h
                              </Text>
                            </>
                          )}
                        </div>
                        <div className="template-card__usage-row">
                          <Text type="secondary" style={{ fontSize: 11 }}>
                            Đã dùng: {template.usageCount || 0} lần
                          </Text>
                        </div>
                      </div>
                    }
                  />
                </Card>
              </Col>
            );
          })}
        </Row>
      ) : (
        <Empty
          description={
            searchText || selectedCategory !== "ALL"
              ? "Không tìm thấy mẫu phù hợp"
              : "Chưa có công việc mẫu. Tạo mẫu mới để bắt đầu."
          }
        />
      )}

      {/* Create Template Modal */}
      <Modal
        title="Tạo công việc mẫu mới"
        open={createModalVisible}
        onCancel={() => {
          setCreateModalVisible(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreate}
        >
          <Form.Item
            label="Tên mẫu"
            name="name"
            rules={[{ required: true, message: "Nhập tên mẫu" }]}
          >
            <Input placeholder="VD: Mẫu sửa lỗi" />
          </Form.Item>
          <Form.Item
            label="Hạng mục"
            name="category"
            rules={[{ required: true, message: "Chọn hạng mục" }]}
          >
            <Select placeholder="Chọn hạng mục">
              {TEMPLATE_CATEGORIES.map((cat) => (
                <Option key={cat.value} value={cat.value}>
                  {cat.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="Mô tả" name="description">
            <TextArea rows={3} placeholder="Mô tả về mẫu này..." />
          </Form.Item>
          <Form.Item
            label="Tên công việc mẫu"
            name="taskName"
            rules={[{ required: true, message: "Nhập tên công việc mẫu" }]}
          >
            <Input placeholder="VD: Fix bug: {bug_description}" />
          </Form.Item>
          <Form.Item label="Loại" name="type" initialValue="TASK">
            <Select>
              <Option value="TASK">Công việc</Option>
              <Option value="BUG">Lỗi</Option>
              <Option value="FEATURE">Tính năng</Option>
              <Option value="SUPPORT">Hỗ trợ</Option>
            </Select>
          </Form.Item>
          <Form.Item label="Độ ưu tiên" name="priority" initialValue="MEDIUM">
            <Select>
              <Option value="LOW">Thấp</Option>
              <Option value="MEDIUM">Trung bình</Option>
              <Option value="HIGH">Cao</Option>
              <Option value="URGENT">Khẩn cấp</Option>
            </Select>
          </Form.Item>
          <Form.Item label="Giờ ước tính" name="estimatedHours">
            <Input type="number" min={0} placeholder="Số giờ" />
          </Form.Item>
          <Form.Item label="Mô tả mẫu" name="descriptionTemplate">
            <TextArea rows={6} placeholder="Nội dung mô tả mẫu (có thể dùng {variable} để thay thế)..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TaskTemplates;

