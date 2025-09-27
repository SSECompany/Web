import React from "react";
import { Card, Row, Col, Progress, Statistic, Table } from "antd";
import { CheckCircleOutlined, ClockCircleOutlined, ExclamationCircleOutlined } from "@ant-design/icons";

const TaskProgressReport = () => {
  const columns = [
    {
      title: "Công việc",
      dataIndex: "taskName",
      key: "taskName",
    },
    {
      title: "Người thực hiện",
      dataIndex: "assignedTo",
      key: "assignedTo",
    },
    {
      title: "Tiến độ",
      dataIndex: "progress",
      key: "progress",
      render: (progress) => <Progress percent={progress} size="small" />,
    },
    {
      title: "Ngày hết hạn",
      dataIndex: "dueDate",
      key: "dueDate",
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        const config = {
          COMPLETED: { color: "green", text: "Hoàn thành" },
          IN_PROGRESS: { color: "blue", text: "Đang thực hiện" },
          OVERDUE: { color: "red", text: "Quá hạn" },
        };
        return (
          <span style={{ color: config[status]?.color || "black" }}>
            {config[status]?.text || status}
          </span>
        );
      },
    },
  ];

  const data = [
    {
      key: "1",
      taskName: "Phát triển tính năng đăng nhập",
      assignedTo: "Nguyễn Văn A",
      progress: 85,
      dueDate: "25/01/2024",
      status: "IN_PROGRESS",
    },
    {
      key: "2",
      taskName: "Thiết kế giao diện",
      assignedTo: "Trần Thị B",
      progress: 100,
      dueDate: "20/01/2024",
      status: "COMPLETED",
    },
    {
      key: "3",
      taskName: "Viết tài liệu",
      assignedTo: "Lê Văn C",
      progress: 45,
      dueDate: "15/01/2024",
      status: "OVERDUE",
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <h2>Báo cáo tiến độ công việc</h2>
      
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Tổng số công việc"
              value={25}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Đã hoàn thành"
              value={15}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Quá hạn"
              value={3}
              valueStyle={{ color: '#ff4d4f' }}
              prefix={<ExclamationCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} md={12}>
          <Card title="Tiến độ hoàn thành">
            <div style={{ textAlign: 'center' }}>
              <Progress 
                type="circle" 
                percent={60} 
                format={() => '15/25'} 
                width={120}
              />
              <div style={{ marginTop: 16 }}>
                <p>60% công việc đã hoàn thành</p>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="Phân bố trạng thái">
            <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
              <div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a' }}>15</div>
                <div>Hoàn thành</div>
              </div>
              <div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1890ff' }}>7</div>
                <div>Đang thực hiện</div>
              </div>
              <div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ff4d4f' }}>3</div>
                <div>Quá hạn</div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      <Card title="Chi tiết tiến độ công việc">
        <Table columns={columns} dataSource={data} />
      </Card>
    </div>
  );
};

export default TaskProgressReport;









