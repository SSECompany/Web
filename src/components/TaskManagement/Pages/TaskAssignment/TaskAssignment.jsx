import React from "react";
import { Card, Table, Button, Tag, Select, Space, Input } from "antd";
import { UserAddOutlined, SearchOutlined } from "@ant-design/icons";

const { Option } = Select;
const { Search } = Input;

const TaskAssignment = () => {
  const columns = [
    {
      title: "Mã công việc",
      dataIndex: "taskCode",
      key: "taskCode",
    },
    {
      title: "Tên công việc",
      dataIndex: "taskName",
      key: "taskName",
    },
    {
      title: "Dự án",
      dataIndex: "projectName",
      key: "projectName",
    },
    {
      title: "Độ ưu tiên",
      dataIndex: "priority",
      key: "priority",
      render: (priority) => {
        const colors = { HIGH: "red", MEDIUM: "orange", LOW: "blue" };
        const labels = { HIGH: "Cao", MEDIUM: "Trung bình", LOW: "Thấp" };
        return <Tag color={colors[priority]}>{labels[priority]}</Tag>;
      },
    },
    {
      title: "Ngày hết hạn",
      dataIndex: "dueDate",
      key: "dueDate",
    },
    {
      title: "Người thực hiện",
      dataIndex: "assignedTo",
      key: "assignedTo",
      render: (assignedTo) => assignedTo || <Tag>Chưa giao</Tag>,
    },
    {
      title: "Thao tác",
      key: "action",
      render: (_, record) => (
        <Button 
          type="primary" 
          icon={<UserAddOutlined />}
          size="small"
        >
          Giao việc
        </Button>
      ),
    },
  ];

  const data = [
    {
      key: "1",
      taskCode: "TASK001",
      taskName: "Phát triển tính năng đăng nhập",
      projectName: "Dự án A",
      priority: "HIGH",
      dueDate: "25/01/2024",
      assignedTo: null,
    },
    {
      key: "2",
      taskCode: "TASK002",
      taskName: "Thiết kế giao diện dashboard",
      projectName: "Dự án B",
      priority: "MEDIUM",
      dueDate: "30/01/2024",
      assignedTo: "Trần Thị B",
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Card title="Giao việc">
        <div style={{ marginBottom: 16 }}>
          <Space wrap>
            <Search
              placeholder="Tìm kiếm công việc..."
              style={{ width: 300 }}
              prefix={<SearchOutlined />}
            />
            <Select placeholder="Dự án" style={{ width: 150 }}>
              <Option value="">Tất cả</Option>
              <Option value="project1">Dự án A</Option>
              <Option value="project2">Dự án B</Option>
            </Select>
            <Select placeholder="Độ ưu tiên" style={{ width: 150 }}>
              <Option value="">Tất cả</Option>
              <Option value="HIGH">Cao</Option>
              <Option value="MEDIUM">Trung bình</Option>
              <Option value="LOW">Thấp</Option>
            </Select>
          </Space>
        </div>
        
        <Table 
          columns={columns} 
          dataSource={data}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} công việc`,
          }}
        />
      </Card>
    </div>
  );
};

export default TaskAssignment;









