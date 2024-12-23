import {
  Col,
  DatePicker,
  Divider,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
} from "antd";
import React, { memo, useEffect } from "react";
import { useSelector } from "react-redux";
import {
  datetimeFormat,
  PriceFormat,
} from "../../../../../../app/Options/DataFomater";
import { formStatus } from "../../../../../../utils/constants";
import FormSelect from "../../../../../ReuseComponents/FormSelect";
import { getSaleOrderInfo } from "../../../../Store/Selector/Selector";

const ShippingAndPayment = ({ shipNPayForm, init }) => {
  const { action, paymentInfo } = useSelector(getSaleOrderInfo);

  useEffect(() => {
    shipNPayForm.resetFields();
    return () => {};
  }, [init]);

  return (
    <div className="overflow-y-auto overflow-x-hidden h-full">
      <Divider
        style={{ margin: "0px 0px 24px 0px" }}
        orientation={"left"}
        orientationMargin={0}
      >
        <span className="primary_bold_text">Thanh toán</span>
      </Divider>

      <div className="relative flex flex-column gap-2">
        <Row gutter={25}>
          <Col span={12} className="w-full min-w-0">
            <div className="default_modal_1_row_items">
              <span className="default_bold_label" style={{ width: "100px" }}>
                Hình thức thanh toán
              </span>
              <Form.Item
                className="flex-1"
                name="httt"
                rules={[{ required: false, message: "" }]}
              >
                <Select
                  disabled={action == formStatus.VIEW ? true : false}
                  options={[
                    { value: "1", label: "Chuyển khoản" },
                    { value: "2", label: "Tiền mặt" },
                    { value: "3", label: "Công nợ" },
                  ]}
                />
              </Form.Item>
            </div>
          </Col>

          <Col span={12} className="w-full min-w-0">
            <div className="default_modal_1_row_items">
              <span className="default_bold_label" style={{ width: "100px" }}>
                Số tài khoản
              </span>
              <Form.Item
                className="flex-1"
                name="stk"
                rules={[{ required: false, message: "" }]}
              >
                <Input
                  disabled={action == formStatus.VIEW ? true : false}
                  placeholder="Số tài khoản"
                />
              </Form.Item>
            </div>
          </Col>
        </Row>

        <Row gutter={25}>
          <Col span={12} className="w-full min-w-0">
            <div className="default_modal_1_row_items">
              <span className="default_bold_label" style={{ width: "100px" }}>
                Voucher
              </span>
              <Form.Item
                className="flex-1"
                name="voucher"
                rules={[{ required: false, message: "" }]}
              >
                <Input
                  disabled={action == formStatus.VIEW ? true : false}
                  placeholder="Voucher"
                />
              </Form.Item>
            </div>
          </Col>

          <Col span={12} className="w-full min-w-0">
            <div className="default_modal_1_row_items">
              <span className="default_bold_label" style={{ width: "100px" }}>
                Mã số thuế
              </span>
              <Form.Item
                className="flex-1"
                name="MST"
                rules={[{ required: false, message: "" }]}
              >
                <Input
                  disabled={action == formStatus.VIEW ? true : false}
                  placeholder="Mã số thuế"
                />
              </Form.Item>
            </div>
          </Col>
        </Row>

        <Row gutter={25}>
          <Col span={12} className="w-full min-w-0">
            <div className="default_modal_1_row_items">
              <span className="default_bold_label" style={{ width: "100px" }}>
                Nguyên tệ
              </span>
              <Form.Item
                className="flex-1"
                name="ma_nt"
                rules={[{ required: true, message: "Chọn nguyên tệ" }]}
              >
                <Select
                  disabled={action == formStatus.VIEW ? true : false}
                  options={[
                    { value: "vnd", label: "Việt Nam đồng" },
                    { value: "usd", label: "Đô la Mỹ" },
                    { value: "euro", label: "Euro" },
                  ]}
                />
              </Form.Item>
            </div>
          </Col>

          <Col span={12} className="w-full min-w-0">
            <div className="default_modal_1_row_items">
              <span className="default_bold_label" style={{ width: "100px" }}>
                Hạn thanh toán
              </span>
              <Form.Item
                className="flex-1"
                name="han_tt"
                rules={[{ required: false, message: "" }]}
              >
                <Select
                  disabled={action == formStatus.VIEW ? true : false}
                  options={[
                    { value: "1", label: "7 ngày" },
                    { value: "2", label: "30 ngày" },
                    { value: "3", label: "6 tháng" },
                  ]}
                />
              </Form.Item>
            </div>
          </Col>
        </Row>
      </div>

      <Divider orientation={"left"} orientationMargin={0}>
        <span className="primary_bold_text">Vận chuyển</span>
      </Divider>

      <div className="relative flex flex-column gap-2">
        <Row gutter={25}>
          <Col span={12} className="w-full min-w-0">
            <div className="default_modal_1_row_items">
              <span className="default_bold_label" style={{ width: "100px" }}>
                Người nhận
              </span>
              <Form.Item
                className="flex-1"
                name="nguoi_nhan"
                rules={[{ required: true, message: "Điền người nhận" }]}
              >
                <Input
                  disabled={action == formStatus.VIEW ? true : false}
                  placeholder="Người nhận"
                />
              </Form.Item>
            </div>
          </Col>

          <Col span={12} className="w-full min-w-0">
            <div className="default_modal_1_row_items">
              <span className="default_bold_label" style={{ width: "100px" }}>
                Điện thoại
              </span>
              <Form.Item
                className="flex-1"
                name="dien_thoai"
                rules={[{ required: true, message: "Điền SDT" }]}
              >
                <Input
                  disabled={action == formStatus.VIEW ? true : false}
                  placeholder="Điện thoại"
                />
              </Form.Item>
            </div>
          </Col>
        </Row>

        <Row gutter={25}>
          <Col span={24} className="w-full min-w-0">
            <div className="default_modal_1_row_items">
              <span className="default_bold_label" style={{ width: "100px" }}>
                Địa chỉ
              </span>
              <Form.Item
                className="flex-1"
                name="dia_chi"
                rules={[{ required: true, message: "Điền địa chỉ" }]}
              >
                <Input
                  disabled={action == formStatus.VIEW ? true : false}
                  placeholder="Địa chỉ nhận hàng"
                />
              </Form.Item>
            </div>
          </Col>
        </Row>

        <Row gutter={25}>
          <Col span={12} className="w-full min-w-0">
            <div className="default_modal_1_row_items">
              <span className="default_bold_label" style={{ width: "100px" }}>
                Hình thức vận chuyển
              </span>
              <Form.Item
                className="flex-1"
                name="ht_vc"
                rules={[{ required: false, message: "" }]}
              >
                <Select
                  disabled={action == formStatus.VIEW ? true : false}
                  options={[
                    { value: "1", label: "Đến lấy" },
                    { value: "2", label: "COD" },
                    { value: "3", label: "Hoả tốc" },
                  ]}
                />
              </Form.Item>
            </div>
          </Col>

          <Col span={12} className="w-full min-w-0">
            <FormSelect
              width={100}
              disable={action == formStatus.VIEW ? true : false}
              controller={"dmkh_lookup"}
              form={shipNPayForm}
              keyCode="dv_vc"
              label="Đơn vị vận chuyển"
              placeHolderCode={`Chọn đơn vị`}
            />
          </Col>
        </Row>

        <Row gutter={25}>
          <Col span={12} className="w-full min-w-0">
            <div className="default_modal_1_row_items">
              <span className="default_bold_label" style={{ width: "100px" }}>
                Phí vận chuyển
              </span>
              <Form.Item
                className="flex-1"
                name="phi_vc"
                rules={[{ required: false, message: "" }]}
              >
                <InputNumber
                  controls={false}
                  min="0"
                  placeholder="0"
                  disabled={action === "VIEW" ? true : false}
                  className="w-full"
                  step={PriceFormat}
                />
              </Form.Item>
            </div>
          </Col>

          <Col span={12} className="w-full min-w-0">
            <div className="default_modal_1_row_items">
              <span className="default_bold_label" style={{ width: "100px" }}>
                Ngày nhận dự kiến
              </span>
              <Form.Item
                className="flex-1"
                name="ngay_nhan"
                rules={[{ required: false, message: "" }]}
              >
                <DatePicker
                  disabled={action === "VIEW" ? true : false}
                  format={datetimeFormat}
                  style={{ width: "100%" }}
                  placeholder="Chọn ngày"
                />
              </Form.Item>
            </div>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default memo(ShippingAndPayment);
