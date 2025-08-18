import { DeleteOutlined, ShoppingCartOutlined } from "@ant-design/icons";
import { Button, Card, InputNumber, Table, Tag } from "antd";
import React from "react";

const CartTable = ({ cart, removeAt, updateLine }) => {
  const columns = [
    {
      title: (
        <span
          style={{
            fontWeight: "600",
            fontSize: "12px",
            color: "#475569",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          SẢN PHẨM
        </span>
      ),
      dataIndex: "name",
      key: "name",
      width: "30%",
      render: (text, record) => (
        <div className="product-info">
          <div className="product-name">{text}</div>
          <div className="product-sku">SKU: {record.sku}</div>
        </div>
      ),
    },
    {
      title: (
        <span
          style={{
            fontWeight: "600",
            fontSize: "12px",
            color: "#475569",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          ĐƠN VỊ
        </span>
      ),
      dataIndex: "unit",
      key: "unit",
      width: "10%",
      render: (text) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: (
        <span
          style={{
            fontWeight: "600",
            fontSize: "12px",
            color: "#475569",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          GIÁ
        </span>
      ),
      dataIndex: "price",
      key: "price",
      width: "15%",
      render: (price) => (
        <span className="price-text">
          {new Intl.NumberFormat("vi-VN").format(price)}đ
        </span>
      ),
    },
    {
      title: (
        <span
          style={{
            fontWeight: "600",
            fontSize: "12px",
            color: "#475569",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          SL
        </span>
      ),
      dataIndex: "qty",
      key: "qty",
      width: "15%",
      render: (qty, record, index) => (
        <div className="qty-control">
          <button
            className="qty-btn"
            onClick={() =>
              updateLine(index, "qty", Math.max(1, (qty || 1) - 1))
            }
          >
            -
          </button>
          <InputNumber
            value={qty || 1}
            min={1}
            size="small"
            className="qty-input"
            onChange={(value) => updateLine(index, "qty", value || 1)}
            controls={false}
          />
          <button
            className="qty-btn"
            onClick={() => updateLine(index, "qty", (qty || 1) + 1)}
          >
            +
          </button>
        </div>
      ),
    },
    {
      title: (
        <span
          style={{
            fontWeight: "600",
            fontSize: "12px",
            color: "#475569",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          GIẢM GIÁ (%)
        </span>
      ),
      dataIndex: "discount",
      key: "discount",
      width: "15%",
      render: (discount, record, index) => (
        <InputNumber
          value={discount || 0}
          min={0}
          max={100}
          size="small"
          className="discount-input"
          onChange={(value) => updateLine(index, "discount", value || 0)}
          controls={false}
          suffix="%"
        />
      ),
    },
    {
      title: (
        <span
          style={{
            fontWeight: "600",
            fontSize: "12px",
            color: "#475569",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          THÀNH TIỀN
        </span>
      ),
      key: "total",
      width: "15%",
      render: (_, record) => {
        const total =
          record.price * (record.qty || 1) * (1 - (record.discount || 0) / 100);
        return (
          <span className="total-text">
            {new Intl.NumberFormat("vi-VN").format(total)}đ
          </span>
        );
      },
    },
    {
      title: (
        <span
          style={{
            fontWeight: "600",
            fontSize: "12px",
            color: "#475569",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          THAO TÁC
        </span>
      ),
      key: "action",
      width: "10%",
      render: (_, record, index) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => removeAt(index)}
          size="small"
          className="remove-btn"
        />
      ),
    },
  ];

  return (
    <Card
      size="small"
      title={
        <div className="cart-title">
          <span>Giỏ hàng ({cart.length} sản phẩm)</span>
        </div>
      }
      className="cart-table-card"
    >
      {cart.length === 0 ? (
        <div className="empty-cart">
          <ShoppingCartOutlined className="empty-cart-icon" />
          <div className="empty-cart-text">Trống</div>
        </div>
      ) : (
        <div className="cart-table">
          <Table
            columns={columns}
            dataSource={cart}
            rowKey={(record, index) => index}
            pagination={false}
            size="small"
            tableLayout="fixed"
            scroll={{ y: 300 }}
          />
        </div>
      )}
    </Card>
  );
};

export default CartTable;
