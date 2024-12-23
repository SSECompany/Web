import { Row } from "antd";
import React from "react";
import DetailSaleOrder from "./DetailSaleOrder/DetailSaleOrder";
import ListSaleOrders from "./ListSaleOrders/ListSaleOrders";
import PaymentSaleOrder from "./PaymentSaleOrder/PaymentSaleOrder";
import "./SaleOrder.css";

const SaleOrder = () => {
  return (
    <div className="page_default" style={{ padding: "10px 12px 20px 12px" }}>
      <Row gutter={10} className="h-full">
        <ListSaleOrders />
        <DetailSaleOrder />
        <PaymentSaleOrder />
      </Row>
    </div>
  );
};

export default SaleOrder;
