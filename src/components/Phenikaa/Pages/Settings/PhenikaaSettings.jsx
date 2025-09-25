import { Card, Empty } from "antd";

const PhenikaaSettings = () => {
  return (
    <div
      style={{
        padding: 24,
        background: "#f0f2f5",
        minHeight: "calc(100vh - 64px)",
      }}
    >
      <Card title="Cài đặt POS">
        <Empty description="Trang cài đặt POS đang được phát triển" />
      </Card>
    </div>
  );
};

export default PhenikaaSettings;
