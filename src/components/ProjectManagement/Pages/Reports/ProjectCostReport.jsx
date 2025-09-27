import React from "react";
import { Card, Table, Statistic, Row, Col, Progress } from "antd";

const ProjectCostReport = () => {
  const columns = [
    {
      title: "Dự án",
      dataIndex: "projectName",
      key: "projectName",
    },
    {
      title: "Ngân sách (VNĐ)",
      dataIndex: "budget",
      key: "budget",
      render: (amount) => amount.toLocaleString("vi-VN"),
    },
    {
      title: "Chi phí thực tế (VNĐ)",
      dataIndex: "actualCost",
      key: "actualCost",
      render: (amount) => amount.toLocaleString("vi-VN"),
    },
    {
      title: "Tỷ lệ sử dụng (%)",
      dataIndex: "usageRate",
      key: "usageRate",
      render: (rate) => (
        <Progress percent={rate} size="small" />
      ),
    },
    {
      title: "Còn lại (VNĐ)",
      dataIndex: "remaining",
      key: "remaining",
      render: (amount) => amount.toLocaleString("vi-VN"),
    },
  ];

  const data = [
    {
      key: "1",
      projectName: "Dự án A",
      budget: 1000000000,
      actualCost: 750000000,
      usageRate: 75,
      remaining: 250000000,
    },
    {
      key: "2",
      projectName: "Dự án B",
      budget: 500000000,
      actualCost: 350000000,
      usageRate: 70,
      remaining: 150000000,
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <h2>Báo cáo chi phí thực hiện</h2>
      
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Tổng ngân sách"
              value={1500000000}
              suffix="VNĐ"
              formatter={(value) => value.toLocaleString("vi-VN")}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Tổng chi phí thực tế"
              value={1100000000}
              suffix="VNĐ"
              valueStyle={{ color: '#1890ff' }}
              formatter={(value) => value.toLocaleString("vi-VN")}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Còn lại"
              value={400000000}
              suffix="VNĐ"
              valueStyle={{ color: '#52c41a' }}
              formatter={(value) => value.toLocaleString("vi-VN")}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Tỷ lệ sử dụng"
              value={73.3}
              suffix="%"
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      <Card title="Chi tiết chi phí theo dự án">
        <Table columns={columns} dataSource={data} />
      </Card>
    </div>
  );
};

export default ProjectCostReport;









