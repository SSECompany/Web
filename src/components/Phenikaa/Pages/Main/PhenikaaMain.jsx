import {
  BarChartOutlined,
  DollarOutlined,
  ShoppingCartOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Card, Col, Row, Statistic } from "antd";
import "./PhenikaaMain.css";

const PhenikaaMain = () => {
  return (
    <div className="phenikaa-main-container" style={{ padding: "24px" }}>
      <div className="phenikaa-header">
        <h1>Phenikaa POS Dashboard</h1>
        <p>Chào mừng đến với hệ thống Point of Sale Phenikaa</p>
      </div>

      <Row gutter={[16, 16]} className="phenikaa-stats">
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Đơn hàng hôm nay"
              value={125}
              prefix={<ShoppingCartOutlined />}
              valueStyle={{ color: "#3f8600" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Khách hàng"
              value={1128}
              prefix={<UserOutlined />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Doanh thu"
              value={25600000}
              prefix={<DollarOutlined />}
              suffix="VNĐ"
              valueStyle={{ color: "#cf1322" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Sản phẩm"
              value={456}
              prefix={<BarChartOutlined />}
              valueStyle={{ color: "#722ed1" }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} className="phenikaa-content">
        <Col xs={24} lg={16}>
          <Card title="Biểu đồ doanh thu" className="phenikaa-chart-card">
            <div className="phenikaa-chart-placeholder">
              <p>Biểu đồ doanh thu sẽ được hiển thị tại đây</p>
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Đơn hàng gần đây" className="phenikaa-recent-orders">
            <div className="phenikaa-orders-list">
              <div className="order-item">
                <span>Đơn hàng #001</span>
                <span>250,000 VNĐ</span>
              </div>
              <div className="order-item">
                <span>Đơn hàng #002</span>
                <span>180,000 VNĐ</span>
              </div>
              <div className="order-item">
                <span>Đơn hàng #003</span>
                <span>320,000 VNĐ</span>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default PhenikaaMain;
