import {
  InboxOutlined,
  CarOutlined,
  SendOutlined,
  FileTextOutlined,
  SolutionOutlined,
} from "@ant-design/icons";
import { Card, Col, Row, Typography } from "antd";
import { Link } from "react-router-dom";
import "./Kho.css";

const { Title, Text } = Typography;

const Kho = () => {

  const menuItems = [
    {
      title: "Phiếu nhặt hàng",
      subtitle: "Quản lý nhặt hàng",
      icon: <InboxOutlined style={{ fontSize: "28px" }} />,
      color: "linear-gradient(135deg, #52c41a 0%, #73d13d 100%)",
      path: "/kho/nhat-hang",
    },
    {
      title: "Phiếu giao hàng",
      subtitle: "Quản lý giao hàng",
      icon: <CarOutlined style={{ fontSize: "28px" }} />,
      color: "linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)",
      path: "/kho/giao-hang",
    },
    // {
    //   title: "Phiếu nhập hàng theo đơn",
    //   subtitle: "Quản lý nhập hàng theo đơn mua hàng",
    //   icon: <SolutionOutlined style={{ fontSize: "28px" }} />,
    //   color: "linear-gradient(135deg, #faad14 0%, #ffc53d 100%)",
    //   path: "/kho/nhap-hang",
    // },
    // {
    //   title: "Phiếu nhập điều chuyển",
    //   subtitle: "Quản lý nhập kho điều chuyển",
    //   icon: <SendOutlined style={{ fontSize: "28px" }} />,
    //   color: "linear-gradient(135deg, #eb2f96 0%, #f759ab 100%)",
    //   path: "/kho/nhap-dieu-chuyen",
    // },
    // {
    //   title: "Phiếu xuất điều chuyển",
    //   subtitle: "Quản lý xuất kho điều chuyển",
    //   icon: <SendOutlined style={{ fontSize: "28px" }} rotate={180} />,
    //   color: "linear-gradient(135deg, #722ed1 0%, #b37feb 100%)",
    //   path: "/kho/xuat-dieu-chuyen",
    // },
    {
      title: "Phiếu yêu cầu kiểm kê",
      subtitle: "Quản lý yêu cầu kiểm kê",
      icon: <FileTextOutlined style={{ fontSize: "28px" }} />,
      color: "linear-gradient(135deg, #13c2c2 0%, #36cfc9 100%)",
      path: "/kho/yeu-cau-kiem-ke",
    },
  ];


  return (
    <div className="kho-container">
      <div className="kho-header">
        <Title level={2} className="kho-title">
          Quản lý kho
        </Title>
        <Text className="kho-subtitle">
          Vui lòng chọn phiếu bạn muốn thực hiện
        </Text>
      </div>

      <div className="kho-content">
        <Row gutter={[24, 24]} justify="center">
          {menuItems.map((item, index) => (
            <Col xs={24} sm={12} md={8} lg={6} key={index}>
              <Link to={item.path} style={{ textDecoration: 'none' }}>
                <Card
                  className="kho-menu-card"
                  hoverable
                  style={{
                    background: item.color,
                    border: "none",
                    borderRadius: "12px",
                    cursor: "pointer",
                  }}
                >
                  <div className="kho-menu-item">
                    <div className="kho-menu-icon" aria-hidden="true">{item.icon}</div>
                    <div className="kho-menu-text">
                      <Title level={4} className="kho-menu-title">
                        {item.title}
                      </Title>
                      <Text className="kho-menu-subtitle">{item.subtitle}</Text>
                    </div>
                  </div>
                </Card>
              </Link>
            </Col>
          ))}
        </Row>
      </div>
    </div>
  );
};

export default Kho;
