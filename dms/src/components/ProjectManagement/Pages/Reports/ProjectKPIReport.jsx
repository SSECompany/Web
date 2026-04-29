import React from "react";
import { Card, Table, Statistic, Row, Col, Progress, Tag } from "antd";

const ProjectKPIReport = () => {
  const columns = [
    {
      title: "Dự án",
      dataIndex: "projectName",
      key: "projectName",
    },
    {
      title: "Tiến độ (%)",
      dataIndex: "progress",
      key: "progress",
      render: (progress) => <Progress percent={progress} size="small" />,
    },
    {
      title: "Chất lượng",
      dataIndex: "quality",
      key: "quality",
      render: (quality) => {
        const color = quality >= 90 ? 'green' : quality >= 70 ? 'orange' : 'red';
        return <Tag color={color}>{quality}%</Tag>;
      },
    },
    {
      title: "Hiệu suất",
      dataIndex: "efficiency",
      key: "efficiency",
      render: (efficiency) => {
        const color = efficiency >= 90 ? 'green' : efficiency >= 70 ? 'orange' : 'red';
        return <Tag color={color}>{efficiency}%</Tag>;
      },
    },
    {
      title: "Đánh giá tổng thể",
      dataIndex: "overallRating",
      key: "overallRating",
      render: (rating) => {
        const color = rating === 'Tốt' ? 'green' : rating === 'Trung bình' ? 'orange' : 'red';
        return <Tag color={color}>{rating}</Tag>;
      },
    },
  ];

  const data = [
    {
      key: "1",
      projectName: "Dự án A",
      progress: 85,
      quality: 92,
      efficiency: 88,
      overallRating: "Tốt",
    },
    {
      key: "2",
      projectName: "Dự án B",
      progress: 60,
      quality: 75,
      efficiency: 70,
      overallRating: "Trung bình",
    },
    {
      key: "3",
      projectName: "Dự án C",
      progress: 100,
      quality: 95,
      efficiency: 95,
      overallRating: "Tốt",
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <h2>Báo cáo KPI dự án</h2>
      
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Tiến độ trung bình"
              value={81.7}
              suffix="%"
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Chất lượng trung bình"
              value={87.3}
              suffix="%"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Hiệu suất trung bình"
              value={84.3}
              suffix="%"
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Dự án đạt KPI"
              value={2}
              suffix="/3"
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} md={12}>
          <Card title="Phân bố đánh giá tổng thể">
            <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
              <div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a' }}>2</div>
                <div>Tốt</div>
              </div>
              <div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#faad14' }}>1</div>
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
              <div>Tiến độ đạt 80%</div>
              <Progress percent={81.7} strokeColor="#52c41a" />
            </div>
            <div style={{ marginBottom: 16 }}>
              <div>Chất lượng đạt 85%</div>
              <Progress percent={87.3} strokeColor="#52c41a" />
            </div>
            <div>
              <div>Hiệu suất đạt 80%</div>
              <Progress percent={84.3} strokeColor="#52c41a" />
            </div>
          </Card>
        </Col>
      </Row>

      <Card title="Chi tiết KPI theo dự án">
        <Table columns={columns} dataSource={data} />
      </Card>
    </div>
  );
};

export default ProjectKPIReport;









