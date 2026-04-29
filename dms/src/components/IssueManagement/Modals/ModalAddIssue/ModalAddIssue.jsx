import {
  CheckCircleOutlined,
  FileTextOutlined,
  SaveOutlined,
} from "@ant-design/icons";
import {
  Button,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Switch,
  Typography,
} from "antd";
import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { ISSUE_PRIORITIES, ISSUE_STATUSES, ISSUE_TYPES } from "../../../TaskManagement/Types/IssueTypes";
import { apiCreateIssue, apiUpdateIssue } from "../../API";

const { TextArea } = Input;
const { Option } = Select;
const { Title } = Typography;

const ModalAddIssue = ({
  visible,
  onCancel,
  onSuccess,
  initialData = null,
  projectId = null,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState(null);

  useEffect(() => {
    if (visible) {
      if (initialData) {
        form.setFieldsValue({
          ...initialData,
          dueDate: initialData.dueDate ? dayjs(initialData.dueDate) : null,
        });
        setSelectedType(initialData.type);
      } else {
        form.resetFields();
        setSelectedType(null);
      }
    }
  }, [visible, initialData, form]);

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const payload = {
        ...values,
        dueDate: values.dueDate ? values.dueDate.format("YYYY-MM-DD") : null,
        projectId: projectId || values.projectId,
      };

      if (initialData) {
        await apiUpdateIssue({
          issueId: initialData.id,
          ...payload,
        });
      } else {
        await apiCreateIssue(payload);
      }

      onSuccess?.();
      form.resetFields();
      onCancel();
    } catch (error) {
      console.error("Error saving issue:", error);
    } finally {
      setLoading(false);
    }
  };

  const issueType = selectedType ? ISSUE_TYPES[selectedType] : null;
  const availableStatuses = issueType
    ? issueType.workflow.map((statusId) => ISSUE_STATUSES[statusId]).filter(Boolean)
    : Object.values(ISSUE_STATUSES);

  return (
    <Modal
      title={
        <Space>
          {initialData ? (
            <>
              <FileTextOutlined />
              <span>Chỉnh sửa Issue</span>
            </>
          ) : (
            <>
              <CheckCircleOutlined />
              <span>Tạo Issue mới</span>
            </>
          )}
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={800}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          type: "BUG",
          priority: "NORMAL",
          status: "NEW",
          allowTimeTracking: true,
        }}
      >
        <Form.Item
          name="type"
          label="Loại Issue"
          rules={[{ required: true, message: "Vui lòng chọn loại issue" }]}
        >
          <Select
            placeholder="Chọn loại issue"
            onChange={(value) => {
              setSelectedType(value);
              const typeConfig = ISSUE_TYPES[value];
              if (typeConfig) {
                form.setFieldsValue({
                  priority: typeConfig.defaultPriority,
                  status: typeConfig.workflow[0],
                });
              }
            }}
          >
            {Object.values(ISSUE_TYPES).map((type) => (
              <Option key={type.id} value={type.id.toUpperCase()}>
                <Space>
                  <span>{type.icon}</span>
                  <span>{type.namVn}</span>
                </Space>
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="title"
          label="Tiêu đề"
          rules={[{ required: true, message: "Vui lòng nhập tiêu đề" }]}
        >
          <Input placeholder="Nhập tiêu đề issue" />
        </Form.Item>

        <Form.Item
          name="description"
          label="Mô tả"
          rules={[{ required: true, message: "Vui lòng nhập mô tả" }]}
        >
          <TextArea
            rows={6}
            placeholder="Nhập mô tả chi tiết về issue..."
          />
        </Form.Item>

        <Form.Item
          name="priority"
          label="Ưu tiên"
          rules={[{ required: true, message: "Vui lòng chọn mức ưu tiên" }]}
        >
          <Select placeholder="Chọn mức ưu tiên">
            {Object.values(ISSUE_PRIORITIES).map((priority) => (
              <Option key={priority.id} value={priority.id.toUpperCase()}>
                <Space>
                  <span style={{ color: priority.color }}>●</span>
                  <span>{priority.nameVn}</span>
                </Space>
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="status"
          label="Trạng thái"
          rules={[{ required: true, message: "Vui lòng chọn trạng thái" }]}
        >
          <Select placeholder="Chọn trạng thái">
            {availableStatuses.map((status) => (
              <Option key={status.id} value={status.id.toUpperCase()}>
                <Space>
                  <span style={{ color: status.color }}>●</span>
                  <span>{status.nameVn}</span>
                </Space>
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item name="assigneeId" label="Người phụ trách">
          <Select
            placeholder="Chọn người phụ trách"
            showSearch
            allowClear
            filterOption={(input, option) =>
              (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
            }
          >
            {/* TODO: Load users from API */}
            <Option value="1" label="Nguyễn Văn A">
              Nguyễn Văn A
            </Option>
            <Option value="2" label="Trần Thị B">
              Trần Thị B
            </Option>
          </Select>
        </Form.Item>

        <Form.Item name="dueDate" label="Hạn hoàn thành">
          <DatePicker
            style={{ width: "100%" }}
            format="DD/MM/YYYY"
            placeholder="Chọn ngày hạn hoàn thành"
          />
        </Form.Item>

        <Form.Item name="estimatedHours" label="Giờ ước tính">
          <InputNumber
            style={{ width: "100%" }}
            min={0}
            step={0.5}
            placeholder="Nhập số giờ ước tính"
          />
        </Form.Item>

        <Form.Item
          name="allowTimeTracking"
          label="Cho phép theo dõi thời gian"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>

        <Form.Item>
          <Space style={{ width: "100%", justifyContent: "flex-end" }}>
            <Button onClick={onCancel}>Hủy</Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              icon={<SaveOutlined />}
            >
              {initialData ? "Cập nhật" : "Tạo mới"}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ModalAddIssue;

