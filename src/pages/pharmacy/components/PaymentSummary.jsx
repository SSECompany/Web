import { Button, Card, Select, Tag, Typography } from "antd";
import React from "react";
import CustomerInfo from "./CustomerInfo";

const { Text } = Typography;

const PaymentSummary = ({
  customer,
  setCustomer,
  customerOpen,
  setCustomerOpen,
  payment,
  setPayment,
  subtotal,
  discountAmount,
  vat,
  total,
  change,
  cart,
  onOpenPayment,
  onClearCart,
}) => {
  return (
    <div className="payment-summary-container">
      {/* Customer Info */}
      <CustomerInfo
        customer={customer}
        setCustomer={setCustomer}
        customerOpen={customerOpen}
        setCustomerOpen={setCustomerOpen}
      />

      {/* Payment Summary */}
      <Card size="small" title="Tổng quan thanh toán" className="summary-card">
        <div className="summary-content">
          {/* Order Summary - Compact */}
          <div className="order-summary">
            <div className="summary-row">
              <Text>Số lượng:</Text>
              <Tag color="blue" size="small">
                {cart.length}
              </Tag>
            </div>
            <div className="summary-row">
              <Text>Tạm tính:</Text>
              <Text strong>
                {new Intl.NumberFormat("vi-VN").format(subtotal)}đ
              </Text>
            </div>
            <div className="summary-row">
              <Text>Giảm giá:</Text>
              <Text type="danger">
                -{new Intl.NumberFormat("vi-VN").format(discountAmount)}đ
              </Text>
            </div>
            <div className="summary-row">
              <Text>VAT (10%):</Text>
              <Text>{new Intl.NumberFormat("vi-VN").format(vat)}đ</Text>
            </div>
            <div className="summary-row total-row">
              <Text strong>Tổng cộng:</Text>
              <Text strong style={{ color: "#059669", fontSize: "13px" }}>
                {new Intl.NumberFormat("vi-VN").format(total)}đ
              </Text>
            </div>
          </div>

          {/* Payment Method - Compact */}
          <div className="payment-method-section">
            <Text
              strong
              style={{
                fontSize: "13px",
                color: "#262626",
                marginBottom: "6px",
                display: "block",
              }}
            >
              Phương thức:
            </Text>
            <Select
              value={payment.method}
              onChange={(value) =>
                setPayment({ ...payment, method: value, cash: 0 })
              }
              style={{
                width: "100%",
                borderRadius: "6px",
                border: "1px solid #d9d9d9",
                backgroundColor: "#ffffff",
              }}
              size="small"
              dropdownStyle={{
                borderRadius: "6px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              }}
            >
              <Select.Option value="cash">Tiền mặt</Select.Option>
              <Select.Option value="transfer">Chuyển khoản</Select.Option>
              <Select.Option value="multi">Nhiều phương thức</Select.Option>
            </Select>
          </div>
        </div>

        {/* Action Buttons - Compact */}
        <div className="action-buttons">
          <Button
            onClick={onClearCart}
            disabled={cart.length === 0}
            className="clear-cart-btn"
          >
            Xóa giỏ hàng
          </Button>
          <Button
            onClick={onOpenPayment}
            disabled={cart.length === 0}
            className="checkout-btn"
          >
            Thanh toán
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default PaymentSummary;
