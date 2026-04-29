import React from "react";
import { Card, Row, Col, Progress, Statistic, Table, Tag } from "antd";

const TaskKPIReport = () => {
  const columns = [
    {
      title: "Nhân viên",
      dataIndex: "employeeName",
      key: "employeeName",
    },
    {
      title: "Số công việc được giao",
      dataIndex: "assignedTasks",
      key: "assignedTasks",
    },
    {
      title: "Số công việc hoàn thành",
      dataIndex: "completedTasks",
      key: "completedTasks",
    },
    {
      title: "Tỷ lệ hoàn thành (%)",
      dataIndex: "completionRate",
      key: "completionRate",
      render: (rate) => <Progress percent={rate} size="small" />,
    },
    {
      title: "Công việc quá hạn",
      dataIndex: "overdueTasks",
      key: "overdueTasks",
      render: (count) => count > 0 ? <Tag color="red">{count}</Tag> : <Tag color="green">0</Tag>,
    },
    {
      title: "Đánh giá",
      dataIndex: "rating",
      key: "rating",
      render: (rating) => {
        const color = rating === 'Tốt' ? 'green' : rating === 'Trung bình' ? 'orange' : 'red';
        return <Tag color={color}>{rating}</Tag>;
      },
    },
  ];

  const data = [
    {
      key: "1",
      employeeName: "Nguyễn Văn A",
      assignedTasks: 10,
      completedTasks: 9,
      completionRate: 90,
      overdueTasks: 0,
      rating: "Tốt",
    },
    {
      key: "2",
      employeeName: "Trần Thị B",
      assignedTasks: 8,
      completedTasks: 6,
      completionRate: 75,
      overdueTasks: 1,
      rating: "Trung bình",
    },
    {
      key: "3",
      employeeName: "Lê Văn C",
      assignedTasks: 7,
      completedTasks: 5,
      completionRate: 71,
      overdueTasks: 2,
      rating: "Trung bình",
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <h2>Báo cáo KPI hoàn thành công việc</h2>
      
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Tỷ lệ hoàn thành trung bình"
              value={78.7}
              suffix="%"
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Nhân viên đạt KPI"
              value={1}
              suffix="/3"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Tổng công việc quá hạn"
              value={3}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Hiệu suất trung bình"
              value={85.3}
              suffix="%"
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} md={12}>
          <Card title="Phân bố đánh giá nhân viên">
            <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
              <div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a' }}>1</div>
                <div>Tốt</div>
              </div>
              <div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#faad14' }}>2</div>
                <div>Trung bình</div>
              </div>
              <div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ff4d4f' }}>0</div>
                <div>Kém</div>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="Mục tiêu KPI">
            <div style={{ marginBottom: 16 }}>
              <div>Tỷ lệ hoàn thành đạt 80%</div>
              <Progress percent={78.7} strokeColor="#faad14" />
            </div>
            <div style={{ marginBottom: 16 }}>
              <div>Giảm công việc quá hạn xuống dưới 5%</div>
              <Progress percent={88} strokeColor="#52c41a" />
            </div>
            <div>
              <div>Hiệu suất đạt 85%</div>
              <Progress percent={85.3} strokeColor="#52c41a" />
            </div>
          </Card>
        </Col>
      </Row>

      <Card title="Chi tiết KPI theo nhân viên">
        <Table columns={columns} dataSource={data} />
      </Card>
    </div>
  );
};

export default TaskKPIReport;









