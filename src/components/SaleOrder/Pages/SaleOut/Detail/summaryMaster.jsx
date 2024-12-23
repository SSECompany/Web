import { Form, Input } from "antd";
import React from "react";

const SummaryMaster = (action) => {
  return (
    <div className="split__view__summary__master">
      <div className="split__view__detail__primary__items">
        <div className="split__view__detail__primary__item">
          <span className="default_bold_label" style={{ width: "100px" }}>
            Tổng số lượng
          </span>

          <Form.Item className="flex-1" name="t_so_luong">
            <Input disabled placeholder="Tổng số lượng" />
          </Form.Item>
        </div>

        <div className="split__view__detail__primary__item">
          <span className="default_bold_label" style={{ width: "100px" }}>
            Tổng thanh toán
          </span>

          <Form.Item className="flex-1" name="t_tt_nt">
            <Input disabled placeholder="Tổng thanh toán" />
          </Form.Item>
        </div>
      </div>
    </div>
  );
};

export default SummaryMaster;
