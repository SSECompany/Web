import {
  DownOutlined,
  IdcardOutlined,
  PhoneOutlined,
  UpOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Button, Card, Input, Space } from "antd";
import React from "react";

const CustomerInfo = ({
  customer,
  setCustomer,
  customerOpen,
  setCustomerOpen,
}) => {
  return (
    <Card
      size="small"
      title={
        <div className="customer-title">
          <span>Thông tin khách hàng</span>
          <Button
            type="text"
            size="small"
            onClick={() => setCustomerOpen(!customerOpen)}
            className="toggle-btn"
            icon={customerOpen ? <UpOutlined /> : <DownOutlined />}
          />
        </div>
      }
      className="customer-info-card"
    >
      {customerOpen && (
        <Space direction="vertical" style={{ width: "100%" }} size="small">
          <Input
            placeholder="Số điện thoại"
            value={customer.phone}
            onChange={(e) =>
              setCustomer({ ...customer, phone: e.target.value })
            }
            size="small"
            prefix={<PhoneOutlined />}
          />
          <Input
            placeholder="Tên khách hàng"
            value={customer.name}
            onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
            size="small"
            prefix={<UserOutlined />}
          />
          <Input
            placeholder="CMND/CCCD"
            value={customer.idNumber}
            onChange={(e) =>
              setCustomer({ ...customer, idNumber: e.target.value })
            }
            size="small"
            prefix={<IdcardOutlined />}
          />
        </Space>
      )}
    </Card>
  );
};

export default CustomerInfo;
