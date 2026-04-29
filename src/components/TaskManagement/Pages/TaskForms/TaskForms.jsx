import {
  FormOutlined,
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  CheckCircleOutlined,
  BugOutlined,
  ThunderboltOutlined,
  UnorderedListOutlined,
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
  Descriptions,
} from "antd";
import { useState, useEffect } from "react";
import HeaderTableBar from "../../../ReuseComponents/HeaderTableBar";
import "./TaskForms.css";

const { TextArea } = Input;
const { Option } = Select;
const { Text, Title } = Typography;

const FORM_TYPES = [
  {
    value: "STANDARD",
    label: "Biểu mẫu chuẩn",
    icon: <FormOutlined />,
    color: "blue",
    description: "Biểu mẫu cơ bản cho công việc thông thường",
  },
  {
    value: "BUG_TEMPLATE",
    label: "Mẫu lỗi",
    icon: <BugOutlined />,
    color: "red",
    description: "Biểu mẫu chuyên biệt cho báo cáo và xử lý lỗi",
  },
  {
    value: "FEATURE_TEMPLATE",
    label: "Mẫu tính năng",
    icon: <ThunderboltOutlined />,
    color: "green",
    description: "Biểu mẫu cho phát triển tính năng mới",
  },
  {
    value: "CHECKLIST",
    label: "Checklist",
    icon: <UnorderedListOutlined />,
    color: "orange",
    description: "Biểu mẫu dạng checklist với các mục kiểm tra",
  },
];

const TaskForms = () => {
  const [form] = Form.useForm();
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [selectedForm, setSelectedForm] = useState(null);
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    loadForms();
  }, []);

  const loadForms = () => {
    setLoading(true);
    // Sample forms
    setTimeout(() => {
      setForms([
        {
          id: "1",
          name: "Biểu mẫu chuẩn",
          type: "STANDARD",
          description: "Biểu mẫu cơ bản cho mọi loại công việc",
          fields: [
            { name: "taskName", label: "Tên công việc", type: "text", required: true },
            { name: "description", label: "Mô tả", type: "textarea", required: false },
            { name: "priority", label: "Độ ưu tiên", type: "select", required: true },
            { name: "dueDate", label: "Hạn chót", type: "date", required: true },
          ],
          usageCount: 45,
          createdAt: "2024-01-01",
        },
        {
          id: "2",
          name: "Mẫu báo lỗi",
          type: "BUG_TEMPLATE",
          description: "Biểu mẫu chi tiết cho báo cáo lỗi",
          fields: [
            { name: "bugTitle", label: "Tiêu đề lỗi", type: "text", required: true },
            { name: "stepsToReproduce", label: "Các bước tái hiện", type: "textarea", required: true },
            { name: "expectedBehavior", label: "Hành vi mong đợi", type: "textarea", required: true },
            { name: "actualBehavior", label: "Hành vi thực tế", type: "textarea", required: true },
            { name: "severity", label: "Mức độ nghiêm trọng", type: "select", required: true },
            { name: "environment", label: "Môi trường", type: "text", required: false },
          ],
          usageCount: 32,
          createdAt: "2024-01-05",
        },
        {
          id: "3",
          name: "Mẫu phát triển tính năng",
          type: "FEATURE_TEMPLATE",
          description: "Biểu mẫu cho phát triển tính năng mới",
          fields: [
            { name: "featureName", label: "Tên tính năng", type: "text", required: true },
            { name: "requirements", label: "Yêu cầu", type: "textarea", required: true },
            { name: "acceptanceCriteria", label: "Tiêu chí chấp nhận", type: "textarea", required: true },
            { name: "technicalNotes", label: "Ghi chú kỹ thuật", type: "textarea", required: false },
          ],
          usageCount: 18,
          createdAt: "2024-01-10",
        },
        {
          id: "4",
          name: "Checklist kiểm tra",
          type: "CHECKLIST",
          description: "Biểu mẫu dạng checklist",
          fields: [
            { name: "checklistTitle", label: "Tiêu đề", type: "text", required: true },
            { name: "items", label: "Danh sách mục", type: "checklist", required: true },
          ],
          usageCount: 28,
          createdAt: "2024-01-08",
        },
      ]);
      setLoading(false);
    }, 500);
  };

  const handleCreate = async (values) => {
    notification.success({
      message: "Thành công",
      description: "Đã tạo biểu mẫu mới",
    });
    setCreateModalVisible(false);
    form.resetFields();
    loadForms();
  };

  const handleDelete = async (id) => {
    notification.success({
      message: "Thành công",
      description: "Đã xóa biểu mẫu",
    });
    setForms(forms.filter((f) => f.id !== id));
  };

  const handleView = (formData) => {
    setSelectedForm(formData);
    setViewModalVisible(true);
  };

  const filteredForms = forms.filter((form) => {
    const matchSearch = !searchText || 
      form.name.toLowerCase().includes(searchText.toLowerCase()) ||
      form.description?.toLowerCase().includes(searchText.toLowerCase());
    return matchSearch;
  });

  const getFormTypeInfo = (type) => {
    return FORM_TYPES.find((t) => t.value === type) || FORM_TYPES[0];
  };

  return (
    <div className="task-forms-container">
      <HeaderTableBar
        title="Biểu mẫu"
        buttonTitle="Tạo biểu mẫu mới"
        buttonIcon={<PlusOutlined />}
        onButtonClick={() => setCreateModalVisible(true)}
      />

      {/* Filters */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Input
          placeholder="Tìm kiếm biểu mẫu..."
          prefix={<FormOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          allowClear
          style={{ maxWidth: 400 }}
        />
      </Card>

      {/* Forms Grid */}
      {filteredForms.length > 0 ? (
        <Row gutter={[16, 16]}>
          {filteredForms.map((formData) => {
            const typeInfo = getFormTypeInfo(formData.type);
            return (
              <Col xs={24} sm={12} lg={8} xl={6} key={formData.id}>
                <Card
                  className="form-card"
                  hoverable
                  actions={[
                    <Button
                      type="link"
                      icon={<CheckCircleOutlined />}
                      onClick={() => handleView(formData)}
                    >
                      Xem
                    </Button>,
                    <Button
                      type="link"
                      icon={<EditOutlined />}
                      onClick={() => {
                        notification.info({
                          message: "Chức năng đang phát triển",
                        });
                      }}
                    >
                      Sửa
                    </Button>,
                    <Popconfirm
                      title="Xóa biểu mẫu này?"
                      onConfirm={() => handleDelete(formData.id)}
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
                            typeInfo.color === "default" ? "#d9d9d9" : undefined,
                        }}
                        icon={typeInfo.icon}
                      />
                    }
                    title={
                      <Space size={6}>
                        <Text strong>{formData.name}</Text>
                        <Tag color={typeInfo.color}>{typeInfo.label}</Tag>
                      </Space>
                    }
                    description={
                      <div>
                        <Text
                          type="secondary"
                          style={{ fontSize: 12 }}
                          className="form-card__description-text"
                        >
                          {formData.description}
                        </Text>
                        <div
                          className="form-card__meta-row"
                          style={{ fontSize: 11 }}
                        >
                          <Text type="secondary">
                            {formData.fields?.length || 0} trường
                          </Text>
                          <Text type="secondary">•</Text>
                          <Text type="secondary">
                            Đã dùng: {formData.usageCount || 0} lần
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
            searchText
              ? "Không tìm thấy biểu mẫu phù hợp"
              : "Chưa có biểu mẫu. Tạo biểu mẫu mới để bắt đầu."
          }
        />
      )}

      {/* Create Form Modal */}
      <Modal
        title="Tạo biểu mẫu mới"
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
            label="Tên biểu mẫu"
            name="name"
            rules={[{ required: true, message: "Nhập tên biểu mẫu" }]}
          >
            <Input placeholder="VD: Biểu mẫu chuẩn" />
          </Form.Item>
          <Form.Item
            label="Loại biểu mẫu"
            name="type"
            rules={[{ required: true, message: "Chọn loại biểu mẫu" }]}
          >
            <Select placeholder="Chọn loại">
              {FORM_TYPES.map((type) => (
                <Option key={type.value} value={type.value}>
                  <Space>
                    {type.icon}
                    {type.label}
                  </Space>
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="Mô tả" name="description">
            <TextArea rows={3} placeholder="Mô tả về biểu mẫu này..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* View Form Modal */}
      <Modal
        title={`Chi tiết: ${selectedForm?.name}`}
        open={viewModalVisible}
        onCancel={() => {
          setViewModalVisible(false);
          setSelectedForm(null);
        }}
        footer={[
          <Button key="close" onClick={() => setViewModalVisible(false)}>
            Đóng
          </Button>,
        ]}
        width={700}
      >
        {selectedForm && (
          <div>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="Tên biểu mẫu">
                {selectedForm.name}
              </Descriptions.Item>
              <Descriptions.Item label="Loại">
                <Tag color={getFormTypeInfo(selectedForm.type).color}>
                  {getFormTypeInfo(selectedForm.type).label}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Mô tả">
                {selectedForm.description}
              </Descriptions.Item>
              <Descriptions.Item label="Số trường">
                {selectedForm.fields?.length || 0}
              </Descriptions.Item>
              <Descriptions.Item label="Đã sử dụng">
                {selectedForm.usageCount || 0} lần
              </Descriptions.Item>
            </Descriptions>
            {selectedForm.fields && selectedForm.fields.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <Title level={5}>Danh sách trường:</Title>
                <Space direction="vertical" style={{ width: "100%" }}>
                  {selectedForm.fields.map((field, index) => (
                    <Card key={index} size="small">
                      <Space>
                        <Text strong>{field.label}</Text>
                        <Tag>{field.type}</Tag>
                        {field.required && <Tag color="red">Bắt buộc</Tag>}
                      </Space>
                    </Card>
                  ))}
                </Space>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default TaskForms;

