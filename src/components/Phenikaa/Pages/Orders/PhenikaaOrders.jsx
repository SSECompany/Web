import {
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  DatePicker,
  Input,
  Select,
  Space,
  Table,
  Tag,
} from "antd";
import { useState } from "react";
import "./PhenikaaOrders.css";

const { RangePicker } = DatePicker;
const { Option } = Select;

const PhenikaaOrders = () => {
  const [loading, setLoading] = useState(false);

  // Mock data cho đơn hàng
  const mockOrders = [
    {
      key: "1",
      orderNumber: "POS-2024-001",
      customerName: "Nguyễn Văn A",
      total: 250000,
      status: "completed",
      paymentMethod: "cash",
      createdAt: "2024-01-15 10:30",
    },
    {
      key: "2",
      orderNumber: "POS-2024-002",
      customerName: "Trần Thị B",
      total: 180000,
      status: "pending",
      paymentMethod: "card",
      createdAt: "2024-01-15 11:15",
    },
    {
      key: "3",
      orderNumber: "POS-2024-003",
      customerName: "Lê Văn C",
      total: 320000,
      status: "completed",
      paymentMethod: "transfer",
      createdAt: "2024-01-15 14:20",
    },
  ];

  const columns = [
    {
      title: "Số đơn hàng",
      dataIndex: "orderNumber",
      key: "orderNumber",
      width: 150,
    },
    {
      title: "Khách hàng",
      dataIndex: "customerName",
      key: "customerName",
      width: 200,
    },
    {
      title: "Tổng tiền",
      dataIndex: "total",
      key: "total",
      width: 120,
      render: (value) => `${value.toLocaleString()} VNĐ`,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status) => {
        const statusConfig = {
          completed: { color: "green", text: "Hoàn thành" },
          pending: { color: "orange", text: "Chờ xử lý" },
          cancelled: { color: "red", text: "Đã hủy" },
        };
        return (
          <Tag color={statusConfig[status]?.color}>
            {statusConfig[status]?.text}
          </Tag>
        );
      },
    },
    {
      title: "Thanh toán",
      dataIndex: "paymentMethod",
      key: "paymentMethod",
      width: 120,
      render: (method) => {
        const methodConfig = {
          cash: "Tiền mặt",
          card: "Thẻ",
          transfer: "Chuyển khoản",
        };
        return methodConfig[method];
      },
    },
    {
      title: "Thời gian",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 150,
    },
    {
      title: "Thao tác",
      key: "action",
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="text"
            icon={<EyeOutlined />}
            size="small"
            onClick={() => handleViewOrder(record)}
          />
          <Button
            type="text"
            icon={<EditOutlined />}
            size="small"
            onClick={() => handleEditOrder(record)}
          />
        </Space>
      ),
    },
  ];

  const handleViewOrder = (record) => {
    console.log("View order:", record);
  };

  const handleEditOrder = (record) => {
    console.log("Edit order:", record);
  };

  const handleCreateOrder = () => {
    console.log("Create new order");
  };

  return (
    <div className="phenikaa-orders-container" style={{ padding: "24px" }}>
      <Card
        title="Quản lý đơn hàng POS"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreateOrder}
          >
            Tạo đơn hàng
          </Button>
        }
      >
        <div className="phenikaa-orders-filters">
          <Space wrap>
            <Input
              placeholder="Tìm kiếm đơn hàng..."
              prefix={<SearchOutlined />}
              style={{ width: 250 }}
            />
            <RangePicker placeholder={["Từ ngày", "Đến ngày"]} />
            <Select placeholder="Trạng thái" style={{ width: 150 }}>
              <Option value="">Tất cả</Option>
              <Option value="completed">Hoàn thành</Option>
              <Option value="pending">Chờ xử lý</Option>
              <Option value="cancelled">Đã hủy</Option>
            </Select>
            <Select placeholder="Thanh toán" style={{ width: 150 }}>
              <Option value="">Tất cả</Option>
              <Option value="cash">Tiền mặt</Option>
              <Option value="card">Thẻ</Option>
              <Option value="transfer">Chuyển khoản</Option>
            </Select>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={mockOrders}
          loading={loading}
          pagination={{
            total: mockOrders.length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} của ${total} đơn hàng`,
          }}
          scroll={{ x: 1000 }}
        />
      </Card>
    </div>
  );
};

export default PhenikaaOrders;
