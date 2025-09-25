import { Card, Empty } from "antd";

const PhenikaaCustomers = () => {
  return (
    <div
      style={{
        padding: 24,
        background: "#f0f2f5",
        minHeight: "calc(100vh - 64px)",
      }}
    >
      <Card title="Quản lý khách hàng POS">
        <Empty description="Trang quản lý khách hàng POS đang được phát triển" />
      </Card>
    </div>
  );
};

export default PhenikaaCustomers;
