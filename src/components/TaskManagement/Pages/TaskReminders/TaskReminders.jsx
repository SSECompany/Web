import React, { useState } from "react";
import {
  Card,
  Table,
  Button,
  Tag,
  DatePicker,
  Space,
  Input,
  Switch,
  Modal,
  Form,
  Select,
  Checkbox,
  TimePicker,
  message,
  Badge,
} from "antd";
import {
  BellOutlined,
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  MailOutlined,
  MessageOutlined,
  NotificationOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

const { Search } = Input;
const { Option } = Select;

const TaskReminders = () => {
  const [form] = Form.useForm();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);

  const handleCreate = () => {
    setEditingRecord(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    form.setFieldsValue({
      ...record,
      reminderTime: dayjs(record.reminderTime, "DD/MM/YYYY HH:mm"),
    });
    setModalVisible(true);
  };

  const handleSave = async (values) => {
    try {
      // In real app, this would call API
      console.log("Saving reminder:", values);
      message.success("Đã lưu nhắc việc thành công");
      setModalVisible(false);
      form.resetFields();
    } catch (error) {
      message.error("Lỗi khi lưu nhắc việc");
    }
  };

  const handleDelete = (record) => {
    Modal.confirm({
      title: "Xác nhận xóa",
      content: `Bạn có chắc chắn muốn xóa nhắc việc cho "${record.taskName}"?`,
      onOk: () => {
        message.success("Đã xóa nhắc việc");
      },
    });
  };

  const handleTestNotification = (record) => {
    message.info(`Đang gửi thử ${record.reminderType} đến ${record.recipient}...`);
    // In real app, this would trigger test notification
  };

  const columns = [
    {
      title: "Công việc",
      dataIndex: "taskName",
      key: "taskName",
      width: 200,
    },
    {
      title: "Người nhận",
      dataIndex: "recipient",
      key: "recipient",
    },
    {
      title: "Thời gian nhắc",
      dataIndex: "reminderTime",
      key: "reminderTime",
    },
    {
      title: "Kênh thông báo",
      dataIndex: "reminderType",
      key: "reminderType",
      render: (type, record) => {
        const types = record.reminderTypes || [type];
        return (
          <Space wrap>
            {types.map((t) => {
              const config = {
                EMAIL: { color: "blue", icon: <MailOutlined />, label: "Email" },
                SMS: { color: "green", icon: <MessageOutlined />, label: "SMS" },
                NOTIFICATION: {
                  color: "orange",
                  icon: <NotificationOutlined />,
                  label: "Thông báo",
                },
              };
              const cfg = config[t] || config.EMAIL;
              return (
                <Tag key={t} color={cfg.color} icon={cfg.icon}>
                  {cfg.label}
                </Tag>
              );
            })}
          </Space>
        );
      },
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status, record) => (
        <Space>
          <Switch
            checked={status === "ACTIVE"}
            checkedChildren="Bật"
            unCheckedChildren="Tắt"
            onChange={(checked) => {
              // Update status
              console.log("Toggle status:", record.key, checked);
            }}
          />
          {record.lastSent && (
            <Badge status="success" text={`Đã gửi: ${record.lastSent}`} />
          )}
        </Space>
      ),
    },
    {
      title: "Tần suất",
      dataIndex: "frequency",
      key: "frequency",
      render: (frequency) => {
        const labels = {
          ONCE: "Một lần",
          DAILY: "Hàng ngày",
          WEEKLY: "Hàng tuần",
          MONTHLY: "Hàng tháng",
        };
        return labels[frequency] || frequency;
      },
    },
    {
      title: "Thao tác",
      key: "action",
      width: 200,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            size="small"
            onClick={() => handleEdit(record)}
          >
            Sửa
          </Button>
          <Button
            type="link"
            icon={<BellOutlined />}
            size="small"
            onClick={() => handleTestNotification(record)}
          >
            Gửi thử
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            size="small"
            onClick={() => handleDelete(record)}
          >
            Xóa
          </Button>
        </Space>
      ),
    },
  ];

  const data = [
    {
      key: "1",
      taskName: "Phát triển tính năng đăng nhập",
      recipient: "Nguyễn Văn A",
      recipientEmail: "nguyenvana@example.com",
      recipientPhone: "+84901234567",
      reminderTime: "24/01/2024 09:00",
      reminderTypes: ["EMAIL", "NOTIFICATION"],
      status: "ACTIVE",
      frequency: "ONCE",
      lastSent: "24/01/2024 09:00",
    },
    {
      key: "2",
      taskName: "Review code",
      recipient: "Trần Thị B",
      recipientEmail: "tranthib@example.com",
      recipientPhone: "+84901234568",
      reminderTime: "25/01/2024 14:00",
      reminderTypes: ["EMAIL", "SMS", "NOTIFICATION"],
      status: "ACTIVE",
      frequency: "DAILY",
      lastSent: "25/01/2024 14:00",
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Card
        title="Quản lý nhắc việc"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            Tạo nhắc việc mới
          </Button>
        }
      >
        <div style={{ marginBottom: 16 }}>
          <Space wrap>
            <Search
              placeholder="Tìm kiếm nhắc việc..."
              style={{ width: 300 }}
            />
            <Select placeholder="Kênh thông báo" style={{ width: 150 }}>
              <Option value="">Tất cả</Option>
              <Option value="EMAIL">Email</Option>
              <Option value="SMS">SMS</Option>
              <Option value="NOTIFICATION">Thông báo</Option>
            </Select>
            <Select placeholder="Trạng thái" style={{ width: 120 }}>
              <Option value="">Tất cả</Option>
              <Option value="ACTIVE">Hoạt động</Option>
              <Option value="INACTIVE">Tắt</Option>
            </Select>
            <DatePicker.RangePicker placeholder={["Từ ngày", "Đến ngày"]} />
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={data}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} của ${total} nhắc việc`,
          }}
        />
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        title={editingRecord ? "Chỉnh sửa nhắc việc" : "Tạo nhắc việc mới"}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
          initialValues={{
            reminderTypes: ["NOTIFICATION"],
            frequency: "ONCE",
            status: "ACTIVE",
          }}
        >
          <Form.Item
            name="taskName"
            label="Công việc"
            rules={[{ required: true, message: "Vui lòng chọn công việc" }]}
          >
            <Select placeholder="Chọn công việc" showSearch>
              <Option value="Phát triển tính năng đăng nhập">
                Phát triển tính năng đăng nhập
              </Option>
              <Option value="Review code">Review code</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="recipient"
            label="Người nhận"
            rules={[{ required: true, message: "Vui lòng chọn người nhận" }]}
          >
            <Select placeholder="Chọn người nhận" showSearch>
              <Option value="Nguyễn Văn A">Nguyễn Văn A</Option>
              <Option value="Trần Thị B">Trần Thị B</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="reminderTypes"
            label="Kênh thông báo"
            rules={[
              {
                required: true,
                message: "Vui lòng chọn ít nhất một kênh thông báo",
              },
            ]}
          >
            <Checkbox.Group>
              <Space direction="vertical">
                <Checkbox value="EMAIL">
                  <Space>
                    <MailOutlined />
                    Email (Tự động gửi email)
                  </Space>
                </Checkbox>
                <Checkbox value="SMS">
                  <Space>
                    <MessageOutlined />
                    SMS (Tự động gửi tin nhắn)
                  </Space>
                </Checkbox>
                <Checkbox value="NOTIFICATION">
                  <Space>
                    <NotificationOutlined />
                    Thông báo trong ứng dụng
                  </Space>
                </Checkbox>
              </Space>
            </Checkbox.Group>
          </Form.Item>

          <Form.Item
            name="reminderTime"
            label="Thời gian nhắc"
            rules={[{ required: true, message: "Vui lòng chọn thời gian" }]}
          >
            <DatePicker
              showTime
              format="DD/MM/YYYY HH:mm"
              style={{ width: "100%" }}
              placeholder="Chọn thời gian nhắc"
            />
          </Form.Item>

          <Form.Item name="frequency" label="Tần suất">
            <Select>
              <Option value="ONCE">Một lần</Option>
              <Option value="DAILY">Hàng ngày</Option>
              <Option value="WEEKLY">Hàng tuần</Option>
              <Option value="MONTHLY">Hàng tháng</Option>
            </Select>
          </Form.Item>

          <Form.Item name="status" label="Trạng thái" valuePropName="checked">
            <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TaskReminders;









