import { Col, Form, Input, Row } from "antd";
import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { formStatus } from "../../../../../../utils/constants";
import FormSelectDetail from "../../../../../ReuseComponents/FormSelectDetail";
import { getSaleOrderInfo } from "../../../../Store/Selector/Selector";

const MasterSaleOrder = ({ masterForm, init }) => {
  const { action } = useSelector(getSaleOrderInfo);

  const handleChange = (key, item) => {
    console.log("data", masterForm.getFieldValue());
    console.log("key", key);
    console.log("item", item);
  };

  useEffect(() => {
    masterForm.resetFields();
    return () => {};
  }, [init]);

  return (
    <>
      <Row gutter={25}>
        <Col span={24} className="w-full min-w-0">
          <FormSelectDetail
            disable={action == formStatus.VIEW ? true : false}
            label="Khách hàng"
            keyCode="ma_kh"
            keyName="ten_kh"
            controller="dmkh_lookup"
            form={masterForm}
            placeHolderCode="Mã khách"
            placeHolderName="Tên khách hàng"
            onChange={handleChange}
            required={true}
          />
        </Col>
      </Row>
      <Row gutter={25}>
        <Col span={24} className="w-full min-w-0">
          <div className="default_modal_1_row_items">
            <span className="default_bold_label" style={{ width: "100px" }}>
              Ghi chú
            </span>
            <Form.Item
              className="flex-1"
              name="ghi_chu"
              rules={[{ required: false, message: "" }]}
            >
              <Input
                disabled={action === formStatus.VIEW ? true : false}
                placeholder="Nhập ghi chú"
              />
            </Form.Item>
          </div>
        </Col>
      </Row>
    </>
  );
};

export default MasterSaleOrder;
