import React from "react";
import { Card, Row, Col, Progress, Statistic } from "antd";
import { ProjectOutlined, ClockCircleOutlined, TeamOutlined, DollarOutlined } from "@ant-design/icons";

const ProjectProgressReport = () => {
  return (
    <div style={{ padding: 24 }}>
      <h2>Báo cáo tiến độ dự án</h2>
      
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Tổng số dự án"
              value={15}
              prefix={<ProjectOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Đang thực hiện"
              value={8}
              valueStyle={{ color: '#1890ff' }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Đã hoàn thành"
              value={6}
              valueStyle={{ color: '#52c41a' }}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Tỷ lệ hoàn thành"
              value={75}
              suffix="%"
              valueStyle={{ color: '#faad14' }}
              prefix={<DollarOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} md={12}>
          <Card title="Tiến độ các dự án">
            <div style={{ marginBottom: 16 }}>
              <div>Dự án A</div>
              <Progress percent={85} status="active" />
            </div>
            <div style={{ marginBottom: 16 }}>
              <div>Dự án B</div>
              <Progress percent={60} status="active" />
            </div>
            <div style={{ marginBottom: 16 }}>
              <div>Dự án C</div>
              <Progress percent={100} />
            </div>
            <div>
              <div>Dự án D</div>
              <Progress percent={30} status="active" />
            </div>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="Thống kê theo trạng thái">
            <Row gutter={16}>
              <Col span={12}>
                <div style={{ textAlign: 'center' }}>
                  <Progress type="circle" percent={53} format={() => '8/15'} />
                  <div style={{ marginTop: 8 }}>Đang thực hiện</div>
                </div>
              </Col>
              <Col span={12}>
                <div style={{ textAlign: 'center' }}>
                  <Progress type="circle" percent={40} format={() => '6/15'} />
                  <div style={{ marginTop: 8 }}>Đã hoàn thành</div>
                </div>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ProjectProgressReport;









