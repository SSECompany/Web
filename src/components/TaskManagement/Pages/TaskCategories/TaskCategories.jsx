import {
  FolderOutlined,
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
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
  ColorPicker,
} from "antd";
import { useState, useEffect } from "react";
import HeaderTableBar from "../../../ReuseComponents/HeaderTableBar";
import "./TaskCategories.css";

const { TextArea } = Input;
const { Option } = Select;
const { Text, Title } = Typography;

const DEFAULT_CATEGORIES = [
  { id: "1", name: "Phát triển", color: "#1890ff", description: "Công việc liên quan đến phát triển phần mềm", taskCount: 45 },
  { id: "2", name: "Thiết kế", color: "#722ed1", description: "Công việc thiết kế giao diện và trải nghiệm", taskCount: 32 },
  { id: "3", name: "Kiểm thử", color: "#52c41a", description: "Công việc kiểm thử và đảm bảo chất lượng", taskCount: 28 },
  { id: "4", name: "Tài liệu", color: "#fa8c16", description: "Công việc viết và cập nhật tài liệu", taskCount: 15 },
  { id: "5", name: "Họp", color: "#13c2c2", description: "Các cuộc họp và trao đổi", taskCount: 12 },
  { id: "6", name: "Khác", color: "#8c8c8c", description: "Các công việc khác", taskCount: 8 },
];

const TaskCategories = () => {
  const [form] = Form.useForm();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = () => {
    setLoading(true);
    // Load from localStorage or API
    const saved = localStorage.getItem("taskCategories");
    if (saved) {
      setCategories(JSON.parse(saved));
    } else {
      setCategories(DEFAULT_CATEGORIES);
      localStorage.setItem("taskCategories", JSON.stringify(DEFAULT_CATEGORIES));
    }
    setLoading(false);
  };

  const saveCategories = (newCategories) => {
    setCategories(newCategories);
    localStorage.setItem("taskCategories", JSON.stringify(newCategories));
  };

  const handleCreate = async (values) => {
    const newCategory = {
      id: Date.now().toString(),
      name: values.name,
      color: values.color || "#1890ff",
      description: values.description || "",
      taskCount: 0,
    };
    const updated = [...categories, newCategory];
    saveCategories(updated);
    notification.success({
      message: "Thành công",
      description: "Đã tạo hạng mục mới",
    });
    setCreateModalVisible(false);
    form.resetFields();
  };

  const handleDelete = async (id) => {
    const updated = categories.filter((cat) => cat.id !== id);
    saveCategories(updated);
    notification.success({
      message: "Thành công",
      description: "Đã xóa hạng mục",
    });
  };

  const handleEdit = (category) => {
    form.setFieldsValue({
      id: category.id,
      name: category.name,
      color: category.color,
      description: category.description,
    });
    setCreateModalVisible(true);
  };

  const handleUpdate = async (values) => {
    const updated = categories.map((cat) =>
      cat.id === values.id
        ? { ...cat, name: values.name, color: values.color, description: values.description }
        : cat
    );
    saveCategories(updated);
    notification.success({
      message: "Thành công",
      description: "Đã cập nhật hạng mục",
    });
    setCreateModalVisible(false);
    form.resetFields();
  };

  const filteredCategories = categories.filter((category) => {
    const matchSearch = !searchText || 
      category.name.toLowerCase().includes(searchText.toLowerCase()) ||
      category.description?.toLowerCase().includes(searchText.toLowerCase());
    return matchSearch;
  });

  const isEditMode = form.getFieldValue("id");

  return (
    <div className="task-categories-container">
      <HeaderTableBar
        title="Hạng mục"
        buttonTitle="Tạo hạng mục mới"
        buttonIcon={<PlusOutlined />}
        onButtonClick={() => {
          form.resetFields();
          setCreateModalVisible(true);
        }}
      />

      {/* Filters */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Input
          placeholder="Tìm kiếm hạng mục..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          allowClear
          style={{ maxWidth: 400 }}
        />
      </Card>

      {/* Categories Grid */}
      {filteredCategories.length > 0 ? (
        <Row gutter={[16, 16]}>
          {filteredCategories.map((category) => (
            <Col xs={24} sm={12} lg={8} xl={6} key={category.id}>
                <Card
                  className="category-card"
                  hoverable
                  actions={[
                    <Button
                      type="link"
                      icon={<EditOutlined />}
                      onClick={() => handleEdit(category)}
                    >
                      Sửa
                    </Button>,
                    <Popconfirm
                      title="Xóa hạng mục này?"
                      description="Tất cả công việc thuộc hạng mục này sẽ chuyển sang 'Khác'"
                      onConfirm={() => handleDelete(category.id)}
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
                          backgroundColor: category.color,
                        }}
                        icon={<FolderOutlined />}
                      />
                    }
                    title={
                      <Space size={6}>
                        <Text strong>{category.name}</Text>
                        <Tag
                          color={category.color}
                          style={{ borderColor: category.color }}
                        >
                          {category.taskCount || 0} công việc
                        </Tag>
                      </Space>
                    }
                    description={
                      <div>
                        <Text
                          type="secondary"
                          style={{ fontSize: 12 }}
                          className="category-card__description-text"
                        >
                          {category.description || "Không có mô tả"}
                        </Text>
                      </div>
                    }
                  />
                </Card>
            </Col>
          ))}
        </Row>
      ) : (
        <Empty
          description={
            searchText
              ? "Không tìm thấy hạng mục phù hợp"
              : "Chưa có hạng mục. Tạo hạng mục mới để bắt đầu."
          }
        />
      )}

      {/* Create/Edit Category Modal */}
      <Modal
        title={isEditMode ? "Sửa hạng mục" : "Tạo hạng mục mới"}
        open={createModalVisible}
        onCancel={() => {
          setCreateModalVisible(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        width={500}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={isEditMode ? handleUpdate : handleCreate}
        >
          <Form.Item name="id" hidden>
            <Input />
          </Form.Item>
          <Form.Item
            label="Tên hạng mục"
            name="name"
            rules={[{ required: true, message: "Nhập tên hạng mục" }]}
          >
            <Input placeholder="VD: Phát triển" />
          </Form.Item>
          <Form.Item
            label="Màu sắc"
            name="color"
            initialValue="#1890ff"
            rules={[{ required: true, message: "Chọn màu sắc" }]}
          >
            <ColorPicker showText />
          </Form.Item>
          <Form.Item label="Mô tả" name="description">
            <TextArea rows={3} placeholder="Mô tả về hạng mục này..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TaskCategories;

