import { Card, Empty } from "antd";

const PhenikaaReports = () => {
  return (
    <div
      style={{
        padding: 24,
        background: "#f0f2f5",
        minHeight: "calc(100vh - 64px)",
      }}
    >
      <Card title="Báo cáo POS">
        <Empty description="Trang báo cáo POS đang được phát triển" />
      </Card>
    </div>
  );
};

export default PhenikaaReports;
