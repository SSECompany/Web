import React from "react";
import { Card, Table, Button, Tag, DatePicker, Space, Input, Switch } from "antd";
import { BellOutlined, PlusOutlined, DeleteOutlined } from "@ant-design/icons";

const { Search } = Input;

const TaskReminders = () => {
  const columns = [
    {
      title: "Công việc",
      dataIndex: "taskName",
      key: "taskName",
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
      title: "Loại nhắc việc",
      dataIndex: "reminderType",
      key: "reminderType",
      render: (type) => {
        const colors = { 
          EMAIL: "blue", 
          SMS: "green", 
          NOTIFICATION: "orange" 
        };
        const labels = { 
          EMAIL: "Email", 
          SMS: "SMS", 
          NOTIFICATION: "Thông báo" 
        };
        return <Tag color={colors[type]}>{labels[type]}</Tag>;
      },
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Switch 
          checked={status === "ACTIVE"} 
          checkedChildren="Hoạt động" 
          unCheckedChildren="Tắt" 
        />
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
          MONTHLY: "Hàng tháng"
        };
        return labels[frequency] || frequency;
      },
    },
    {
      title: "Thao tác",
      key: "action",
      render: (_, record) => (
        <Space>
          <Button 
            type="link" 
            icon={<BellOutlined />}
            size="small"
          >
            Chỉnh sửa
          </Button>
          <Button 
            type="link" 
            danger
            icon={<DeleteOutlined />}
            size="small"
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
      reminderTime: "24/01/2024 09:00",
      reminderType: "EMAIL",
      status: "ACTIVE",
      frequency: "ONCE",
    },
    {
      key: "2",
      taskName: "Review code",
      recipient: "Trần Thị B",
      reminderTime: "25/01/2024 14:00",
      reminderType: "NOTIFICATION",
      status: "ACTIVE",
      frequency: "DAILY",
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Card 
        title="Quản lý nhắc việc"
        extra={
          <Button type="primary" icon={<PlusOutlined />}>
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
            <DatePicker.RangePicker placeholder={["Từ ngày", "Đến ngày"]} />
          </Space>
        </div>
        
        <Table 
          columns={columns} 
          dataSource={data}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} nhắc việc`,
          }}
        />
      </Card>
    </div>
  );
};

export default TaskReminders;









