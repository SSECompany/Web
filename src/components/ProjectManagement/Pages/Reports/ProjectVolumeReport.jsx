import React from "react";
import { Card, Table, Statistic, Row, Col } from "antd";

const ProjectVolumeReport = () => {
  const columns = [
    {
      title: "Dự án",
      dataIndex: "projectName",
      key: "projectName",
    },
    {
      title: "Khối lượng kế hoạch",
      dataIndex: "plannedVolume",
      key: "plannedVolume",
    },
    {
      title: "Khối lượng thực hiện",
      dataIndex: "actualVolume",
      key: "actualVolume",
    },
    {
      title: "Tỷ lệ hoàn thành (%)",
      dataIndex: "completionRate",
      key: "completionRate",
      render: (rate) => `${rate}%`,
    },
  ];

  const data = [
    {
      key: "1",
      projectName: "Dự án A",
      plannedVolume: "100 đơn vị",
      actualVolume: "85 đơn vị",
      completionRate: 85,
    },
    {
      key: "2",
      projectName: "Dự án B",
      plannedVolume: "200 đơn vị",
      actualVolume: "120 đơn vị",
      completionRate: 60,
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <h2>Báo cáo khối lượng thực hiện</h2>
      
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Tổng khối lượng kế hoạch"
              value={300}
              suffix="đơn vị"
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Tổng khối lượng thực hiện"
              value={205}
              suffix="đơn vị"
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Tỷ lệ hoàn thành trung bình"
              value={68.3}
              suffix="%"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      <Card title="Chi tiết khối lượng theo dự án">
        <Table columns={columns} dataSource={data} />
      </Card>
    </div>
  );
};

export default ProjectVolumeReport;









