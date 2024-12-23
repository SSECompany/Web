import { Col, DatePicker, Form, Input, Row } from "antd";
import React, { memo } from "react";
import { formStatus } from "../../../../../utils/constants";
import FormSelect from "../../../../ReuseComponents/FormSelect";
import FormSelectDetail from "../../../../ReuseComponents/FormSelectDetail";

const SaleOutMaster = ({ action, form }) => {
  return (
    <div className="split__view__detail__group" style={{ padding: 0 }}>
      <Row gutter={25}>
        <Col span={16}>
          <FormSelectDetail
            required={true}
            disable={action == formStatus.VIEW ? true : false}
            label="NPP"
            keyCode="ma_kh"
            keyName="ten_kh"
            controller="dmkh_lookup"
            form={form}
            placeHolderCode="Nhà phân phối"
            placeHolderName="Tên nhà phân phối"
          />
        </Col>

        <Col span={8}>
          <FormSelect
            width={100}
            disable={action == formStatus.VIEW ? true : false}
            controller={"dmmagdDXA_lookup"}
            keyCode="ma_gd"
            label="Mã giao dịch"
            placeHolderCode={`Chọn mã giao dịch`}
            required={true}
          />
        </Col>
      </Row>

      <Row gutter={25}>
        <Col span={16}>
          <FormSelectDetail
            required={true}
            disable={action == formStatus.VIEW ? true : false}
            label="Khách hàng"
            keyCode="ong_ba"
            keyName="ten_kh2"
            controller="dmkh_lookup"
            form={form}
            placeHolderCode="Khách hàng"
            placeHolderName="Tên khách hàng"
          />
        </Col>

        <Col span={8}>
          <div className="split__view__detail__primary__item">
            <span className="default_bold_label" style={{ width: "100px" }}>
              Ngày LCT
            </span>

            <Form.Item
              className="flex-1"
              name="ngay_lct"
              rules={[{ required: true, message: "Điền ngày lập" }]}
            >
              <DatePicker
                disabled={action === "VIEW" ? true : false}
                format={"DD/MM/YYYY"}
                style={{ width: "100%" }}
                placeholder="Chọn ngày"
              />
            </Form.Item>
          </div>
        </Col>
      </Row>

      <Row gutter={25}>
        <Col span={16}>
          <FormSelectDetail
            disable={action == formStatus.VIEW ? true : false}
            label="Nhân viên"
            keyCode="ma_nvbh"
            keyName="ten_nvbh"
            controller="dmnvbh_lookup"
            form={form}
            required={true}
            placeHolderCode="Nhân viên"
            placeHolderName="Tên nhân viên"
          />
        </Col>

        <Col span={8}>
          <div className="default_modal_1_row_items">
            <span className="default_bold_label" style={{ width: "100px" }}>
              Trạng thái
            </span>

            <Form.Item
              className="flex-1"
              name="status"
              rules={[{ required: true, message: "Điền trạng thái" }]}
            >
              <Input
                disabled={action === "VIEW" ? true : false}
                placeholder="Nhập trạng thái"
              />
            </Form.Item>
          </div>
        </Col>
      </Row>

      <Row gutter={25}>
        <Col span={16}>
          <div className="split__view__detail__primary__item">
            <span className="default_bold_label" style={{ width: "100px" }}>
              Ghi chú
            </span>
            <Form.Item className="flex-1" name="dien_giai">
              <Input
                disabled={action === "VIEW" ? true : false}
                placeholder="Nhập ghi chú"
              />
            </Form.Item>
          </div>
        </Col>

        <Col span={8}>
          <div className="split__view__detail__primary__item">
            <span className="default_bold_label" style={{ width: "100px" }}>
              Ngày giao
            </span>

            <Form.Item
              className="flex-1"
              name="ngay_gh"
              rules={[{ required: true, message: "Điền ngày giao" }]}
            >
              <DatePicker
                disabled={action === "VIEW" ? true : false}
                format={"DD/MM/YYYY"}
                style={{ width: "100%" }}
                placeholder="Chọn ngày"
              />
            </Form.Item>
          </div>
        </Col>
      </Row>

      <Row gutter={25}>
        <Col span={24}>
          <div className="default_modal_1_row_items w-full">
            <span className="default_bold_label" style={{ width: "100px" }}>
              Lý do huỷ
            </span>

            <Form.Item className="flex-1" name="cacel_reason">
              <Input
                className={action === "VIEW" ? "default_disable_input" : ""}
                disabled={action === "VIEW" ? true : false}
                placeholder="Nhập lý do"
              />
            </Form.Item>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default memo(SaleOutMaster);
