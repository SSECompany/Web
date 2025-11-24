import { ClockCircleOutlined } from "@ant-design/icons";
import { Button, DatePicker, Form, Input, InputNumber, Modal, Select, Space } from "antd";
import { useState } from "react";
import dayjs from "dayjs";
import { apiAddIssueTimeEntry } from "../../API";

const { TextArea } = Input;
const { Option } = Select;

const ACTIVITIES = [
  { value: "Development", label: "Development" },
  { value: "Design", label: "Design" },
  { value: "Testing", label: "Testing" },
  { value: "Documentation", label: "Documentation" },
  { value: "Review", label: "Review" },
  { value: "Meeting", label: "Meeting" },
  { value: "Other", label: "Other" },
];

const ModalAddTimeEntry = ({ visible, onCancel, onSuccess, issueId }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      await apiAddIssueTimeEntry({
        issueId,
        date: values.date.format("YYYY-MM-DD"),
        hours: values.hours,
        activity: values.activity,
        comment: values.comment || "",
      });

      onSuccess?.();
      form.resetFields();
      onCancel();
    } catch (error) {
      console.error("Error adding time entry:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={
        <Space>
          <ClockCircleOutlined />
          <span>Thêm thời gian làm việc</span>
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={500}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          date: dayjs(),
          activity: "Development",
          hours: 1,
        }}
      >
        <Form.Item
          name="date"
          label="Ngày"
          rules={[{ required: true, message: "Vui lòng chọn ngày" }]}
        >
          <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
        </Form.Item>

        <Form.Item
          name="hours"
          label="Số giờ"
          rules={[
            { required: true, message: "Vui lòng nhập số giờ" },
            { type: "number", min: 0.1, message: "Số giờ phải lớn hơn 0" },
          ]}
        >
          <InputNumber
            style={{ width: "100%" }}
            min={0.1}
            step={0.5}
            placeholder="Nhập số giờ"
          />
        </Form.Item>

        <Form.Item
          name="activity"
          label="Hoạt động"
          rules={[{ required: true, message: "Vui lòng chọn hoạt động" }]}
        >
          <Select placeholder="Chọn hoạt động">
            {ACTIVITIES.map((activity) => (
              <Option key={activity.value} value={activity.value}>
                {activity.label}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item name="comment" label="Ghi chú">
          <TextArea rows={3} placeholder="Nhập ghi chú (tùy chọn)" />
        </Form.Item>

        <Form.Item>
          <Space style={{ width: "100%", justifyContent: "flex-end" }}>
            <Button onClick={onCancel}>Hủy</Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              Thêm
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ModalAddTimeEntry;

