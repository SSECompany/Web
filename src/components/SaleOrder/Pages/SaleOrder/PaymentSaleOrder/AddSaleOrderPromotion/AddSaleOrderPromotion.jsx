import {
  Button,
  Col,
  Form,
  Input,
  InputNumber,
  message as messageAPI,
  Popover,
  Row,
} from "antd";
import _ from "lodash";
import React, { memo } from "react";
import { quantityFormat } from "../../../../../../app/Options/DataFomater";
import FormSelectDetail from "../../../../../ReuseComponents/FormSelectDetail";

const AddSaleOrderPromotion = ({ addEvent }) => {
  const [message, contextHolder] = messageAPI.useMessage();
  const [form] = Form.useForm();

  const handleAddPromotion = async (item) => {
    let data = { ...item };
    data.ma_vt = item.ma_vt_promo;
    data = _.omit(data, ["ma_vt_promo"]);

    await addEvent(data);

    await form.resetFields();
    document.getElementById("ma_vt_promo").focus();
    message.success(`Thêm thành công.`);
  };

  const popoverContent = (item) => {
    return (
      <Form
        initialValues={{
          ma_vt_promo: "",
          ten_vt: "",
          ma_kho: "",
          ten_kho: "",
          dvt: "Cái",
        }}
        form={form}
        onFinish={handleAddPromotion}
      >
        <p className="primary_bold_text mb-3">Thêm hàng tặng</p>

        <div className="relative flex flex-column gap-2">
          <Row gutter={10}>
            <Col span={24}>
              <FormSelectDetail
                required={true}
                label="Vật tư"
                keyCode="ma_vt_promo"
                keyName="ten_vt"
                controller="dmvt_lookup"
                form={form}
                placeHolderCode="Mã vật tư"
                placeHolderName="Tên vật tư"
              />
            </Col>
          </Row>

          <Row gutter={10}>
            <Col span={24}>
              <FormSelectDetail
                required={true}
                label="Kho"
                keyCode="ma_kho"
                keyName="ten_kho"
                controller="dmkho_lookup"
                form={form}
                placeHolderCode="Mã kho"
                placeHolderName="Tên kho"
              />
            </Col>
          </Row>

          <Row gutter={10}>
            <Col span={12} style={{ width: "200px" }}>
              <div className="default_modal_1_row_items">
                <span className="default_bold_label" style={{ width: "100px" }}>
                  Số lượng
                </span>
                <Form.Item
                  initialValue={0}
                  className="flex-1"
                  name="so_luong"
                  rules={[{ required: true, message: "Nhập số lượng" }]}
                >
                  <InputNumber
                    min="0"
                    controls={false}
                    className="w-full"
                    step={quantityFormat}
                    placeholder="Nhập số lượng"
                  />
                </Form.Item>
              </div>
            </Col>

            <Col span={12} style={{ width: "200px" }}>
              <div className="default_modal_1_row_items">
                <span className="default_bold_label" style={{ width: "50px" }}>
                  Đơn vị
                </span>
                <Form.Item
                  className="flex-1"
                  name="dvt"
                  rules={[{ required: false, message: "Nhập đơn vị" }]}
                >
                  <Input
                    className="w-full"
                    placeholder="Nhập đơn vị"
                    disabled
                  />
                </Form.Item>
              </div>
            </Col>
          </Row>
        </div>

        <div className="w-full text-right mt-3">
          <Button type="primary" htmlType="submit">
            Thêm
          </Button>
        </div>
      </Form>
    );
  };

  return (
    <>
      {contextHolder}

      <Popover
        destroyTooltipOnHide={true}
        placement="bottomLeft"
        content={popoverContent()}
        trigger="click"
      >
        <Button className="default_button">
          <i
            className="pi pi-plus sub_text_color"
            style={{ fontWeight: "bold" }}
          ></i>
        </Button>
      </Popover>
    </>
  );
};

export default memo(AddSaleOrderPromotion);
