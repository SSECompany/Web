import {Button,Col,Form,Input,message as messageAPI,Popover,Row,Tooltip,Modal } from "antd";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { KeyFormatter } from "../../../../../app/Options/KeyFormatter";
import {customerNameRegex,phoneNumberRegex,removeAscent,} from "../../../../../app/regex/regex";
import { getUserInfo } from "../../../../../store/selectors/Selectors";
import { SoFuckingUltimateGetApi } from "../../../../DMS/API";
import { multipleTablePutApi } from "../../../../SaleOrder/API";
import { getIsAddNewCustomer } from "../../../Store/Selectors/RetailOrderSelectors";

const UpdateCustomerPopup = ({ kh,onSave }) => {
  const [message, contextHolder] = messageAPI.useMessage();
  const [form] = Form.useForm();
  const [openState, setOpenState] = useState(false);
  const [loading, setLoading] = useState(false);
  const userInfo = useSelector(getUserInfo);

  const [formData, setFormData] = useState({});

  const handleAdd = (item) => {
    console.log(item);
    if (!kh?.value) return;
    const param= { ...item, userID: userInfo.id,ma_kh : kh.value }
    multipleTablePutApi({
      store: "Api_update_Customer",
      param: param,
      data: {},
    }).then(async (res) => {
      if (res?.responseModel?.isSucceded) {

        message.success(`Thực hiện thành công`);
        handleClosePopup();
        console.log(formData);
        console.log(_.first(_.first(res.listObject)));
        const data = _.first(_.first(res.listObject));
        await onSave({
          ma_kh: kh?.value,
          ten_kh: param?.ten_kh,
          dien_thoai: param?.dien_thoai,
          dia_chi:param?.dia_chi,
          bb_yn:kh?.bb_yn,
          bl_yn:kh?.bl_yn,
          diem:kh?.diem
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


  useEffect(() => {
    form.setFieldValue('dien_thoai',kh?.dien_thoai);
    form.setFieldValue('dia_chi',kh?.dia_chi);
    form.setFieldValue('ten_kh',kh?.label);
    //if (openState) document.getElementById("ma_kh")?.focus();
    return () => {};
  }, [kh]);
  
  // const handleOk = () => {
  //   handleAdd(formData);
  //   setIsModalOpen(false);
  // };

  // const handleCancel = () => {
  //   setIsModalOpen(false);
  // };

  const popoverContent = (item) => {
    return (
      <Form
        initialValues={{  ten_kh: kh.label,  dia_chi: kh.dia_chi,  dien_thoai: kh.dien_thoai,  }}
        form={form}
        onFinish={handleAdd}
      >
        <p className="primary_bold_text mb-3">Chỉnh sửa khách hàng</p>

        <div className="relative flex flex-column gap-2">
          <Row gutter={10}>
            <Col span={24}>
              <div className="flex justify-content-between gap-2 align-items-center">
                <span className="default_bold_label" style={{ width: "100px" }}>
                  Mã khách
                </span>
                <span>{kh?.value}</span>
              </div>
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
                  <Input  className="w-full"  maxLength={126}  placeholder="Nhập tên khách"
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
                        return ((await phoneNumberRegex.test(value)) ||!value) == true? Promise.resolve(): Promise.reject(new Error("Lỗi định dạng số điện thoại")
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
            Sửa
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
            className="pi pi-user-edit sub_text_color"
            style={{ fontWeight: "bold" }}
          ></i>
        </Button>
      </Popover>
    </>
  );
};

export default UpdateCustomerPopup;
