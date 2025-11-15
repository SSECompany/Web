import { FileTextOutlined } from "@ant-design/icons";
import { Card, Typography } from "antd";
import React from "react";

const { Title } = Typography;

const BangKeHoaDonBan = () => {
  return (
    <div style={{ padding: "24px" }}>
      <Card>
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <FileTextOutlined style={{ fontSize: "64px", color: "#1890ff", marginBottom: "16px" }} />
          <Title level={2}>Bảng kê hóa đơn bán</Title>
          <p style={{ color: "#8c8c8c", fontSize: "16px" }}>
            Trang báo cáo bảng kê hóa đơn bán đang được phát triển
          </p>
        </div>
      </Card>
    </div>
  );
};

export default BangKeHoaDonBan;

