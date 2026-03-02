import {
  InboxOutlined,
  CarOutlined,
  SendOutlined,
  ExportOutlined,
} from "@ant-design/icons";
import { Card, Col, Row, Typography } from "antd";
import React from "react";
import { useNavigate } from "react-router-dom";
import "./Kho.css";

const { Title, Text } = Typography;

const Kho = () => {
  const navigate = useNavigate();
  
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
    {
      title: "Phiếu nhập kho",
      subtitle: "Quản lý nhập kho",
      icon: <InboxOutlined style={{ fontSize: "28px" }} />,
      color: "linear-gradient(135deg, #13c2c2 0%, #36cfc9 100%)",
      path: "/kho/nhap-kho",
    },
    {
      title: "Phiếu xuất điều chuyển",
      subtitle: "Quản lý xuất kho điều chuyển",
      icon: <SendOutlined style={{ fontSize: "28px" }} />,
      color: "linear-gradient(135deg, #eb2f96 0%, #f759ab 100%)",
      path: "/kho/xuat-dieu-chuyen",
    },
    {
      title: "Phiếu xuất kho",
      subtitle: "Quản lý xuất kho",
      icon: <ExportOutlined style={{ fontSize: "28px" }} />,
      color: "linear-gradient(135deg, #ffa940 0%, #ffc069 100%)",
      path: "/kho/xuat-kho",
    },
  ];

  const handleMenuClick = (path) => {
    navigate(path);
  };

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
              <Card
                className="kho-menu-card"
                hoverable
                onClick={() => handleMenuClick(item.path)}
                style={{
                  background: item.color,
                  border: "none",
                  borderRadius: "12px",
                  cursor: "pointer",
                }}
              >
                <div className="kho-menu-item">
                  <div className="kho-menu-icon">{item.icon}</div>
                  <div className="kho-menu-text">
                    <Title level={4} className="kho-menu-title">
                      {item.title}
                    </Title>
                    <Text className="kho-menu-subtitle">{item.subtitle}</Text>
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    </div>
  );
};

export default Kho;
