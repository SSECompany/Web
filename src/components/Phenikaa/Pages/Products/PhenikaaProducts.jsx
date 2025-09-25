import { Card, Empty } from "antd";

const PhenikaaProducts = () => {
  return (
    <div
      style={{
        padding: 24,
        background: "#f0f2f5",
        minHeight: "calc(100vh - 64px)",
      }}
    >
      <Card title="Quản lý sản phẩm POS">
        <Empty description="Trang quản lý sản phẩm POS đang được phát triển" />
      </Card>
    </div>
  );
};

export default PhenikaaProducts;
