import { DatePicker, Form, Input } from "antd";
import dayjs from "dayjs";
import React, { memo } from "react";
import { phoneNumberRegex } from "../../../../../app/regex/regex";
import { formStatus } from "../../../../../utils/constants";

const MasterInfoCustomer = ({ action }) => {
  const checkValidDate = (value) => {
    return phoneNumberRegex.test(value);
  };

  return (
    <div className="split__view__detail__group">
      <div className="split__view__detail__primary__items">
        <div className="default_modal_1_row_items">
          <span className="default_bold_label" style={{ width: "100px" }}>
            Tên khách hàng
          </span>
          <Form.Item
            className="flex-1"
            name="customerName"
            rules={[{ required: true, message: "Điền tên khách hàng" }]}
          >
            <Input
              disabled={action === formStatus.VIEW ? true : false}
              placeholder="Nhập tên khách"
            />
          </Form.Item>
        </div>
      </div>
      <div className="split__view__detail__primary__items">
        <div className="split__view__detail__primary__item">
          <span className="default_bold_label" style={{ width: "100px" }}>
            Điện thoại
          </span>

          <Form.Item
            className="flex-1"
            name="contactPhone"
            rules={[
              { required: true, message: "Điền số điện thoại" },

              {
                validator: async (_, value) => {
                  return ((await checkValidDate(value)) || !value) == true
                    ? Promise.resolve()
                    : Promise.reject(new Error("Lỗi định dạng số điện thoại"));
                },
              },
            ]}
          >
            <Input
              className={
                action === formStatus.VIEW
                  ? "default_disable_input"
                  : "default_input"
              }
              disabled={action === formStatus.VIEW ? true : false}
              placeholder="Nhập số điện thoại"
            />
          </Form.Item>
        </div>

        <div className="default_modal_1_row_items">
          <span className="default_bold_label" style={{ width: "100px" }}>
            Địa chỉ
          </span>

          <Form.Item
            className="flex-1"
            name="address"
            rules={[{ required: true, message: "Điền địa chỉ" }]}
          >
            <Input
              className={
                action === formStatus.VIEW
                  ? "default_disable_input"
                  : "default_input"
              }
              disabled={action === formStatus.VIEW ? true : false}
              placeholder="Nhập địa chỉ"
            />
          </Form.Item>
        </div>
      </div>
      <div className="split__view__detail__primary__items">
        <div className="split__view__detail__primary__item">
          <span className="default_bold_label" style={{ width: "100px" }}>
            Ngày sinh
          </span>

          <Form.Item
            className="flex-1"
            name="birthDay"
            rules={[
              { required: true, message: "Điền ngày sinh" },
              {
                validator(_, value) {
                  if (value <= dayjs() || !value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error("Bạn sinh quá muộn rồi :>"));
                },
              },
            ]}
          >
            <DatePicker
              disabled={action === formStatus.VIEW ? true : false}
              format={"DD/MM/YYYY"}
              style={{ width: "100%" }}
              placeholder="Chọn ngày"
            />
          </Form.Item>
        </div>

        <div className="default_modal_1_row_items">
          <span className="default_bold_label" style={{ width: "100px" }}>
            Tên tuyến
          </span>

          <Form.Item
            className="flex-1"
            name="tourName"
            rules={[{ required: true, message: "Điền tuyến" }]}
          >
            <Input
              className={
                action === formStatus.VIEW
                  ? "default_disable_input"
                  : "default_input"
              }
              disabled={true}
              placeholder="Nhập tuyến"
            />
          </Form.Item>
        </div>
      </div>
    </div>
  );
};

export default memo(MasterInfoCustomer);
