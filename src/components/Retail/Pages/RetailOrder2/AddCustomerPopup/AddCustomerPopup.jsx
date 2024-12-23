import {
  Button,
  Col,
  Form,
  Input,
  message as messageAPI,
  Popover,
  Row,
  Tooltip,Modal 
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
import { getIsAddNewCustomer } from "../../../Store/Selectors/RetailOrderSelectors";

const AddCustomerPopup = ({ onSave }) => {
  const [message, contextHolder] = messageAPI.useMessage();
  const [form] = Form.useForm();
  const [openState, setOpenState] = useState(false);
  const [loading, setLoading] = useState(false);
  const userInfo = useSelector(getUserInfo);
  const isAddNewCustomer = useSelector(getIsAddNewCustomer);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({});

  const handleAdd = (item) => {
    console.log(item);
    const param= { ...item, userID: userInfo.id }
    multipleTablePutApi({
      store: "Api_add_Customer",
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
          ma_kh: data?.ma_kh,
          ten_kh: param?.ten_kh,
          dien_thoai: param?.dien_thoai,
          dia_chi:param?.dia_chi
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
  const checkValidCode = (item) => {
    var valid = true;
    setFormData({...item,ma_kh:''});
    var phone = item.dien_thoai;
    multipleTablePutApi({
      store: "api_Check_customer_code",
      param: {value:item.dien_thoai,userID: userInfo.id },
      data: {},
    }).then( (res) => {
      const data = _.first(_.first(res.listObject));
      if(data?.CheckCode == '1' ){
        setIsModalOpen(true);
      }
      else{

        handleAdd({...item,ma_kh:phone});
      }

    });
  };


  useEffect(() => {
    setOpenState(isAddNewCustomer.open);
    form.setFieldValue('dien_thoai',isAddNewCustomer.value);
    setFormData({...formData,dien_thoai:isAddNewCustomer.value})
    //if (openState) document.getElementById("ma_kh")?.focus();
    return () => {};
  }, [isAddNewCustomer]);
  
  const handleOk = () => {
    handleAdd(formData);
    setIsModalOpen(false);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

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
        onFinish={checkValidCode}
      >
        <p className="primary_bold_text mb-3">Thêm khách hàng</p>

        <div className="relative flex flex-column gap-2">
          {/* <Row gutter={10}>
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
          </Row> */}

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
      <Modal title="Basic Modal" open={isModalOpen} onOk={handleOk} onCancel={handleCancel}>
        <p>Số điện thoại đã được tạo.Bạn có muốn tạo thêm khách hàng mới</p>
      </Modal>
    </>
  );
};

export default AddCustomerPopup;
