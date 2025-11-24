import { CommentOutlined } from "@ant-design/icons";
import { Button, Form, Input, Modal, Space } from "antd";
import { useState } from "react";
import { apiAddIssueComment, apiUpdateIssueComment } from "../../API";

const { TextArea } = Input;

const ModalAddComment = ({
  visible,
  onCancel,
  onSuccess,
  issueId,
  initialData = null,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      if (initialData) {
        await apiUpdateIssueComment({
          issueId,
          commentId: initialData.id,
          content: values.content,
        });
      } else {
        await apiAddIssueComment({
          issueId,
          content: values.content,
        });
      }

      onSuccess?.();
      form.resetFields();
      onCancel();
    } catch (error) {
      console.error("Error saving comment:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={
        <Space>
          <CommentOutlined />
          <span>{initialData ? "Chỉnh sửa bình luận" : "Thêm bình luận"}</span>
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={600}
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          name="content"
          label="Nội dung"
          rules={[{ required: true, message: "Vui lòng nhập nội dung" }]}
          initialValue={initialData?.content}
        >
          <TextArea
            rows={6}
            placeholder="Nhập bình luận của bạn..."
            autoFocus
          />
        </Form.Item>

        <Form.Item>
          <Space style={{ width: "100%", justifyContent: "flex-end" }}>
            <Button onClick={onCancel}>Hủy</Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              {initialData ? "Cập nhật" : "Gửi"}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ModalAddComment;

