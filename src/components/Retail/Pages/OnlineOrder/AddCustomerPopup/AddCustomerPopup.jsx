import {
  Button,
  Col,
  Form,
  Input,
  message as messageAPI,
  Popover,
  Row,
  Tooltip,
} from "antd";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { KeyFormatter } from "../../../../../app/Options/KeyFormatter";
import {
  customerNameRegex,
  phoneNumberRegex,
  removeAscent,
} from "../../../../../app/regex/regex";
import { getUserInfo } from "../../../../../store/selectors/Selectors";
import { SoFuckingUltimateGetApi } from "../../../../DMS/API";
import { multipleTablePutApi } from "../../../../SaleOrder/API";

const AddCustomerPopup = ({ onSave }) => {
  const [message, contextHolder] = messageAPI.useMessage();
  const [form] = Form.useForm();
  const [openState, setOpenState] = useState(false);
  const [loading, setLoading] = useState(false);
  const userInfo = useSelector(getUserInfo);

  const handleAdd = async (item) => {
    let data = { ...item };
    multipleTablePutApi({
      store: "Api_add_Customer",
      param: { ...data, userID: userInfo.id },
      data: {},
    }).then(async (res) => {
      if (res?.responseModel?.isSucceded) {
        message.success(`Thực hiện thành công`);
        handleClosePopup();
        if (onSave)
          await onSave({
            ma_kh: data?.ma_kh,
            ten_kh: data?.ten_kh,
            dien_thoai: data?.dien_thoai,
          });
      } else {
        message.warning(res?.responseModel?.message);
      }
    });
  };

  const handleClosePopup = async () => {
    setOpenState(false);
    await form.resetFields();
  };

  const handlePopupchange = (value) => {
    setOpenState(value);
    if (!value) handleClosePopup();
  };

  const handleGenCustomerCode = () => {
    setLoading(true);
    multipleTablePutApi({
      store: "Api_gen_customer_code",
      param: {},
      data: {},
    }).then(async (res) => {
      const data = _.first(_.first(res.listObject));
      await form.setFieldValue("ma_kh", data?.ma_kh || null);
      document.getElementById("ten_kh")?.focus();
      setLoading(false);
      form.validateFields(["ma_kh"]);
    });
  };

  const checkValidCode = async (user_name) => {
    var valid = true;
    await SoFuckingUltimateGetApi({
      store: "api_Check_valid_value",
      data: { value: user_name, key: "dmkh" },
    })
      .then((res) => {
        if (res?.data[0]?.validation === 1) {
          valid = false;
        } else {
          valid = true;
        }
      })
      .catch((err) => {
        console.log("owsc ớc");
      });
    return valid;
  };

  useEffect(() => {
    if (openState) document.getElementById("ma_kh")?.focus();
    return () => {};
  }, [openState]);

  const popoverContent = (item) => {
    return (
      <Form
        initialValues={{
          ma_kh: "",
          ten_kh: "",
          dia_chi: "",
          dien_thoai: "",
        }}
        form={form}
        onFinish={handleAdd}
      >
        <p className="primary_bold_text mb-3">Thêm khách hàng</p>

        <div className="relative flex flex-column gap-2">
          <Row gutter={10}>
            <Col span={21}>
              <div className="default_modal_1_row_items">
                <span className="default_bold_label" style={{ width: "100px" }}>
                  Mã khách
                </span>
                <Form.Item
                  hasFeedback
                  className="flex-1"
                  name="ma_kh"
                  rules={[
                    { required: true, message: "Nhập mã khách" },
                    {
                      validator: async (_, value) => {
                        return (await checkValidCode(value)) == true
                          ? Promise.resolve()
                          : Promise.reject(new Error("Mã này đã tồn tại"));
                      },
                    },
                  ]}
                >
                  <Input
                    autoFocus={true}
                    onInput={(e) =>
                      (e.target.value = KeyFormatter(e.target.value))
                    }
                    className="w-full"
                    maxLength={16}
                    placeholder="Nhập mã khách"
                  />
                </Form.Item>
              </div>
            </Col>
            <Col span={3}>
              <Tooltip title="Tự động tạo mã khách">
                <Button
                  onClick={handleGenCustomerCode}
                  className="shadow_3 pl-2 pr-2 w-full"
                >
                  <i
                    className="pi pi-arrow-circle-down sub_text_color"
                    style={{ fontWeight: "bold" }}
                  ></i>
                </Button>
              </Tooltip>
            </Col>
          </Row>

          <Row gutter={10}>
            <Col span={24}>
              <div className="default_modal_1_row_items">
                <span className="default_bold_label" style={{ width: "100px" }}>
                  Tên khách
                </span>
                <Form.Item
                  className="flex-1"
                  name="ten_kh"
                  rules={[
                    { required: true, message: "Tên khách trống" },
                    {
                      validator: async (_, value) => {
                        return (await customerNameRegex.test(
                          removeAscent(value)
                        )) == true || !value
                          ? Promise.resolve()
                          : Promise.reject(
                              new Error("Tên này không giống người =))")
                            );
                      },
                    },
                  ]}
                >
                  <Input
                    className="w-full"
                    maxLength={126}
                    placeholder="Nhập tên khách"
                  />
                </Form.Item>
              </div>
            </Col>
          </Row>
          <Row gutter={10}>
            <Col span={24} style={{ width: "200px" }}>
              <div className="default_modal_1_row_items">
                <span className="default_bold_label" style={{ width: "100px" }}>
                  Điện thoại
                </span>
                <Form.Item
                  className="flex-1"
                  name="dien_thoai"
                  rules={[
                    { required: true, message: "Điện thoại" },

                    {
                      validator: async (_, value) => {
                        return ((await phoneNumberRegex.test(value)) ||
                          !value) == true
                          ? Promise.resolve()
                          : Promise.reject(
                              new Error("Lỗi định dạng số điện thoại")
                            );
                      },
                    },
                  ]}
                >
                  <Input
                    className="w-full"
                    maxLength={32}
                    placeholder="Nhập điện thoại"
                  />
                </Form.Item>
              </div>
            </Col>
          </Row>
          <Row gutter={10}>
            <Col span={24} style={{ width: "200px" }}>
              <div className="default_modal_1_row_items">
                <span className="default_bold_label" style={{ width: "100px" }}>
                  Địa chỉ
                </span>
                <Form.Item
                  className="flex-1"
                  name="dia_chi"
                  rules={[{ required: false, message: "Điạ chỉ" }]}
                >
                  <Input
                    className="w-full"
                    maxLength={256}
                    placeholder="Địa chỉ"
                  />
                </Form.Item>
              </div>
            </Col>
          </Row>
        </div>

        <div className="w-full text-right mt-3">
          <Button type="primary" htmlType="submit" loading={loading}>
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
        onOpenChange={handlePopupchange}
        destroyTooltipOnHide={true}
        placement="bottomLeft"
        content={popoverContent()}
        trigger="click"
        open={openState}
      >
        <Button className="default_button shadow_3">
          <i
            className="pi pi-user-plus sub_text_color"
            style={{ fontWeight: "bold" }}
          ></i>
        </Button>
      </Popover>
    </>
  );
};

export default AddCustomerPopup;
