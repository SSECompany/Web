import {
    ShoppingOutlined,
} from "@ant-design/icons";
import { Card, Col, Row, Typography } from "antd";
import React from "react";
import { useNavigate } from "react-router-dom";
import "./KinhDoanh.css";

const { Title, Text } = Typography;

const KinhDoanh = () => {
    const navigate = useNavigate();

    const menuItems = [
        {
            title: "Phiếu kinh doanh",
            subtitle: "Quản lý phiếu kinh doanh",
            icon: <ShoppingOutlined style={{ fontSize: "28px" }} />,
            color: "linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)",
            path: "/kinh-doanh/danh-sach",
        },
    ];

    const handleMenuClick = (path) => {
        navigate(path);
    };

    return (
        <div className="kinh-doanh-container">
            <div className="kinh-doanh-header">
                <Title level={2} className="kinh-doanh-title">
                    Quản lý kinh doanh
                </Title>
                <Text className="kinh-doanh-subtitle">
                    Vui lòng chọn chức năng bạn muốn thực hiện
                </Text>
            </div>

            <div className="kinh-doanh-content">
                <Row gutter={[24, 24]} justify="center">
                    {menuItems.map((item, index) => (
                        <Col xs={24} sm={12} md={8} lg={6} key={index}>
                            <Card
                                className="kinh-doanh-menu-card"
                                hoverable
                                onClick={() => handleMenuClick(item.path)}
                                style={{
                                    background: item.color,
                                    border: "none",
                                    borderRadius: "12px",
                                    cursor: "pointer",
                                }}
                            >
                                <div className="kinh-doanh-menu-item">
                                    <div className="kinh-doanh-menu-icon">{item.icon}</div>
                                    <div className="kinh-doanh-menu-text">
                                        <Title level={4} className="kinh-doanh-menu-title" style={{ color: "#fff", marginBottom: 4 }}>
                                            {item.title}
                                        </Title>
                                        <Text className="kinh-doanh-menu-subtitle" style={{ color: "rgba(255,255,255,0.8)" }}>
                                            {item.subtitle}
                                        </Text>
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

export default KinhDoanh;
