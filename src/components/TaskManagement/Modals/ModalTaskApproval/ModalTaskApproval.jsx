import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Button, Form, Input, Modal, Select, Space, Steps, Timeline, Typography, Tag, Avatar } from "antd";
import { useState, useEffect } from "react";
import dayjs from "dayjs";
import { apiGetTaskApproval, apiApproveTask, apiRejectTask, apiRequestTaskRevision } from "../../API";

const { TextArea } = Input;
const { Option } = Select;
const { Text, Title } = Typography;

const APPROVAL_STATUS = {
  PENDING: { label: "Chờ duyệt", color: "processing", icon: <ClockCircleOutlined /> },
  APPROVED: { label: "Đã duyệt", color: "success", icon: <CheckCircleOutlined /> },
  REJECTED: { label: "Từ chối", color: "error", icon: <CloseCircleOutlined /> },
  REVISION: { label: "Yêu cầu sửa", color: "warning", icon: <ClockCircleOutlined /> },
};

const ModalTaskApproval = ({ visible, onCancel, taskId, taskName, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [approvalData, setApprovalData] = useState(null);
  const [actionType, setActionType] = useState("approve"); // approve, reject, revision

  useEffect(() => {
    if (visible && taskId) {
      loadApprovalData();
    }
  }, [visible, taskId]);

  const loadApprovalData = async () => {
    try {
      const response = await apiGetTaskApproval({ taskId });
      if (response?.status === 200 && response?.data) {
        setApprovalData(response.data);
      } else {
        // Sample data
        setApprovalData({
          currentStep: 1,
          totalSteps: 3,
          status: "PENDING",
          steps: [
            {
              id: 1,
              name: "Duyệt bởi Team Lead",
              approver: "Nguyễn Văn A",
              status: "PENDING",
              dueDate: dayjs().add(1, "day").format("YYYY-MM-DD"),
            },
            {
              id: 2,
              name: "Duyệt bởi Project Manager",
              approver: "Trần Thị B",
              status: "PENDING",
              dueDate: dayjs().add(2, "day").format("YYYY-MM-DD"),
            },
            {
              id: 3,
              name: "Duyệt bởi Director",
              approver: "Lê Văn C",
              status: "PENDING",
              dueDate: dayjs().add(3, "day").format("YYYY-MM-DD"),
            },
          ],
          history: [
            {
              id: 1,
              user: "Người tạo",
              action: "Gửi yêu cầu duyệt",
              timestamp: dayjs().subtract(1, "day").format("YYYY-MM-DD HH:mm"),
            },
          ],
        });
      }
    } catch (error) {
      console.error("Error loading approval data:", error);
    }
  };

  const handleApprove = async (values) => {
    setLoading(true);
    try {
      const response = await apiApproveTask({
        taskId,
        comment: values.comment || "",
      });
      if (response?.status === 200) {
        onSuccess?.();
        form.resetFields();
        onCancel();
      }
    } catch (error) {
      console.error("Error approving task:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (values) => {
    setLoading(true);
    try {
      const response = await apiRejectTask({
        taskId,
        comment: values.comment || "",
        reason: values.reason || "",
      });
      if (response?.status === 200) {
        onSuccess?.();
        form.resetFields();
        onCancel();
      }
    } catch (error) {
      console.error("Error rejecting task:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestRevision = async (values) => {
    setLoading(true);
    try {
      const response = await apiRequestTaskRevision({
        taskId,
        comment: values.comment || "",
        requirements: values.requirements || "",
      });
      if (response?.status === 200) {
        onSuccess?.();
        form.resetFields();
        onCancel();
      }
    } catch (error) {
      console.error("Error requesting revision:", error);
    } finally {
      setLoading(false);
    }
  };

  const currentStep = approvalData?.currentStep || 0;
  const currentStepData = approvalData?.steps?.[currentStep - 1];

  return (
    <Modal
      title={
        <Space>
          <CheckCircleOutlined />
          <span>Phê duyệt công việc</span>
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={700}
    >
      <Space direction="vertical" style={{ width: "100%" }} size="large">
        {/* Task Info */}
        <div>
          <Text strong>Công việc: </Text>
          <Text>{taskName}</Text>
        </div>

        {/* Approval Steps */}
        {approvalData && (
          <div>
            <Title level={5}>Quy trình phê duyệt</Title>
            <Steps
              current={currentStep - 1}
              status={approvalData.status === "REJECTED" ? "error" : approvalData.status === "APPROVED" ? "finish" : "process"}
              items={approvalData.steps.map((step, index) => ({
                title: step.name,
                description: (
                  <Space direction="vertical" size={0}>
                    <Text type="secondary">{step.approver}</Text>
                    {step.status === "APPROVED" && (
                      <Tag color="success" icon={<CheckCircleOutlined />}>
                        Đã duyệt
                      </Tag>
                    )}
                    {step.status === "REJECTED" && (
                      <Tag color="error" icon={<CloseCircleOutlined />}>
                        Từ chối
                      </Tag>
                    )}
                    {step.status === "PENDING" && index === currentStep - 1 && (
                      <Tag color="processing" icon={<ClockCircleOutlined />}>
                        Đang chờ
                      </Tag>
                    )}
                  </Space>
                ),
              }))}
            />
          </div>
        )}

        {/* Approval History */}
        {approvalData?.history && approvalData.history.length > 0 && (
          <div>
            <Title level={5}>Lịch sử phê duyệt</Title>
            <Timeline>
              {approvalData.history.map((item) => (
                <Timeline.Item key={item.id}>
                  <Space direction="vertical" size={0}>
                    <Space>
                      <Avatar size="small" icon={<UserOutlined />} />
                      <Text strong>{item.user}</Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {item.timestamp}
                      </Text>
                    </Space>
                    <Text>{item.action}</Text>
                    {item.comment && (
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {item.comment}
                      </Text>
                    )}
                  </Space>
                </Timeline.Item>
              ))}
            </Timeline>
          </div>
        )}

        {/* Action Form */}
        {currentStepData && currentStepData.status === "PENDING" && (
          <div>
            <Title level={5}>Thao tác</Title>
            <Form form={form} layout="vertical">
              <Form.Item>
                <Space>
                  <Button
                    type="primary"
                    icon={<CheckCircleOutlined />}
                    onClick={() => setActionType("approve")}
                    danger={false}
                  >
                    Duyệt
                  </Button>
                  <Button
                    danger
                    icon={<CloseCircleOutlined />}
                    onClick={() => setActionType("reject")}
                  >
                    Từ chối
                  </Button>
                  <Button
                    icon={<ClockCircleOutlined />}
                    onClick={() => setActionType("revision")}
                  >
                    Yêu cầu sửa
                  </Button>
                </Space>
              </Form.Item>

              {actionType === "approve" && (
                <>
                  <Form.Item name="comment" label="Ghi chú">
                    <TextArea rows={3} placeholder="Nhập ghi chú (tùy chọn)" />
                  </Form.Item>
                  <Form.Item>
                    <Button
                      type="primary"
                      onClick={() => form.validateFields().then(handleApprove)}
                      loading={loading}
                      block
                    >
                      Xác nhận duyệt
                    </Button>
                  </Form.Item>
                </>
              )}

              {actionType === "reject" && (
                <>
                  <Form.Item
                    name="reason"
                    label="Lý do từ chối"
                    rules={[{ required: true, message: "Vui lòng nhập lý do" }]}
                  >
                    <Select placeholder="Chọn lý do">
                      <Option value="not_meet_requirements">Không đáp ứng yêu cầu</Option>
                      <Option value="budget_exceeded">Vượt ngân sách</Option>
                      <Option value="not_priority">Không ưu tiên</Option>
                      <Option value="other">Khác</Option>
                    </Select>
                  </Form.Item>
                  <Form.Item name="comment" label="Ghi chú">
                    <TextArea rows={3} placeholder="Nhập ghi chú chi tiết" />
                  </Form.Item>
                  <Form.Item>
                    <Button
                      danger
                      onClick={() => form.validateFields().then(handleReject)}
                      loading={loading}
                      block
                    >
                      Xác nhận từ chối
                    </Button>
                  </Form.Item>
                </>
              )}

              {actionType === "revision" && (
                <>
                  <Form.Item
                    name="requirements"
                    label="Yêu cầu sửa đổi"
                    rules={[{ required: true, message: "Vui lòng nhập yêu cầu" }]}
                  >
                    <TextArea rows={4} placeholder="Nhập các yêu cầu cần sửa đổi" />
                  </Form.Item>
                  <Form.Item name="comment" label="Ghi chú">
                    <TextArea rows={3} placeholder="Nhập ghi chú (tùy chọn)" />
                  </Form.Item>
                  <Form.Item>
                    <Button
                      onClick={() => form.validateFields().then(handleRequestRevision)}
                      loading={loading}
                      block
                    >
                      Gửi yêu cầu sửa đổi
                    </Button>
                  </Form.Item>
                </>
              )}
            </Form>
          </div>
        )}
      </Space>
    </Modal>
  );
};

export default ModalTaskApproval;






