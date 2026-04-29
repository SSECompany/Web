import { Form, Input } from "antd";
import React, { memo } from "react";

const CustomerContact = ({ action }) => {
  return (
    <div className="split__view__detail__group">
      <div className="split__view__detail__primary__items">
        <div className="default_modal_1_row_items">
          <span className="default_bold_label" style={{ width: "100px" }}>
            Người liên hệ
          </span>
          <Form.Item
            className="flex-1"
            name="contactPerson"
            rules={[{ required: false, message: "Điền người liên hệ" }]}
          >
            <Input
              disabled={action === "VIEW" ? true : false}
              placeholder="Nhập người liên hệ"
            />
          </Form.Item>
        </div>
      </div>
      <div className="split__view__detail__primary__items">
        <div className="default_modal_1_row_items">
          <span className="default_bold_label" style={{ width: "100px" }}>
            Điện thoại liên hệ
          </span>
          <Form.Item
            className="flex-1"
            name="contactPhone2"
            rules={[{ required: false, message: "Điền điện thoại liên hệ" }]}
          >
            <Input
              disabled={action === "VIEW" ? true : false}
              placeholder="Nhập điện thoại liên hệ"
            />
          </Form.Item>
        </div>
      </div>
      <div className="split__view__detail__primary__items">
        <div className="default_modal_1_row_items">
          <span className="default_bold_label" style={{ width: "100px" }}>
            Email
          </span>
          <Form.Item
            className="flex-1"
            name="email"
            rules={[{ required: false, message: "Điền Email" }]}
          >
            <Input
              disabled={action === "VIEW" ? true : false}
              placeholder="Nhập Email"
            />
          </Form.Item>
        </div>
      </div>
      <div className="split__view__detail__primary__items">
        <div className="default_modal_1_row_items">
          <span className="default_bold_label" style={{ width: "100px" }}>
            Mã số thuế
          </span>
          <Form.Item
            className="flex-1"
            name="MST"
            rules={[{ required: false, message: "Điền mã số thuế" }]}
          >
            <Input
              disabled={action === "VIEW" ? true : false}
              placeholder="Nhập mã số thuế"
            />
          </Form.Item>
        </div>
      </div>
    </div>
  );
};

export default memo(CustomerContact);
