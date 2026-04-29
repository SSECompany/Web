import {
  Button,
  ColorPicker,
  Form,
  Input,
  Modal,
  notification,
  Select,
  Space,
} from "antd";
import React, { useEffect, useState } from "react";
import "./ModalClassifyCustomer.css";

import { KeyFormatter } from "../../../../app/Options/KeyFormatter";
import send_icon from "../../../../Icons/send_icon.svg";
import LoadingComponents from "../../../Loading/LoadingComponents";
import { SoFuckingUltimateApi, SoFuckingUltimateGetApi } from "../../API";

// bắt buộc khai báo bên ngoài

const ModalClassifyCustomer = (props) => {
  const [inputForm] = Form.useForm();
  const [isOpenModal, setOpenModal] = useState();
  const [initialValues, setInitialValues] = useState({});
  const [disableFields, setDisableFields] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCancelModal = () => {
    setOpenModal(false);
    props.handleCloseModal();
    inputForm.resetFields();
    setDisableFields(false);
  };

  const onSubmitForm = () => {
    const a = { ...inputForm.getFieldsValue() };
    const color =
      typeof a.colorCode === "string" ? a.colorCode : a.colorCode.toHexString();
    SoFuckingUltimateApi({
      store: "Api_Create_Customer_Classify",
      data: {
        action: props.openModalType === "EDIT" ? props.openModalType : "ADD",
        ma_loai: a.classifyCode,
        ten_loai: a.classifyName,
        color: color,
        status: a.status,
        userid: 0,
      },
    })
      .then((res) => {
        if (res.status === 200 && res.data === true) {
          notification.success({
            message: `Thành công`,
          });
          props.refreshData();
          handleCancelModal();
        } else {
          notification.warning({
            message: `Có lỗi xảy ra khi thực hiện`,
          });
        }
      })
      .catch((err) => {
        console.error(err);
      });
  };

  const onSubmitFormFail = () => {};

  const getDataEdit = (id) => {
    SoFuckingUltimateGetApi({
      store: "Get_Classify_Customer",
      data: {
        id: id.trim(),
        pageIndex: 1,
        pageSize: 10,
        SearchKey: "",
        status: "",
      },
    }).then((res) => {
      inputForm.setFieldValue(`classifyCode`, res.data[0]?.ma_loai.trim());
      inputForm.setFieldValue(`classifyName`, res.data[0]?.ten_loai.trim());
      inputForm.setFieldValue(`colorCode`, res.data[0]?.color);
      inputForm.setFieldValue(`status`, res.data[0]?.status);
      setDisableFields(true);
      setLoading(false);
    });
  };

  useEffect(() => {
    setOpenModal(props.openModalState);
    if (props.openModalState && props.openModalType === "EDIT") {
      setLoading(true);
      getDataEdit(props.currentRecord || 0);
    }
  }, [JSON.stringify(props)]);

  return (
    <Modal
      className="default_modal"
      open={isOpenModal}
      onCancel={handleCancelModal}
      closable={false}
      centered
      okButtonProps={{ style: { display: "none" } }}
      cancelButtonProps={{ style: { display: "none" } }}
      width={600}
    >
      <div className="default_modal_header">
        <span className="default_header_label">{`${
          props.openModalType == "EDIT" ? "Sửa" : "Thêm mới"
        } phân loại khách hàng`}</span>
      </div>
      <Form
        form={inputForm}
        className="default_modal_container"
        onFinishFailed={onSubmitFormFail}
        onFinish={onSubmitForm}
      >
        <LoadingComponents text={"Đang tải..."} size={50} loading={loading} />
        <div className="default_modal_group_items">
          <div className="default_modal_1_row_items">
            <span className="default_bold_label" style={{ width: "100px" }}>
              Mã loại
            </span>
            <Form.Item
              name="classifyCode"
              rules={[{ required: true, message: "Điền mã loại" }]}
            >
              <Input
                disabled={disableFields}
                onInput={(e) => (e.target.value = KeyFormatter(e.target.value))}
                placeholder="Nhập mã loại"
              />
            </Form.Item>
          </div>
        </div>
        <div className="default_modal_group_items">
          <div className="default_modal_1_row_items">
            <span className="default_bold_label" style={{ width: "100px" }}>
              Tên loại
            </span>
            <Form.Item
              name="classifyName"
              rules={[{ required: true, message: "Điền tên loại" }]}
            >
              <Input placeholder="Nhập tên loại" />
            </Form.Item>
          </div>
        </div>

        <div className="default_modal_group_items">
          <div className="default_modal_1_row_items">
            <span className="default_bold_label" style={{ width: "100px" }}>
              Mã màu
            </span>
            <Form.Item name="colorCode" initialValue={"#1677ff"}>
              <ColorPicker format={"hex"} showText />
            </Form.Item>
          </div>
        </div>

        <div className="default_modal_group_items">
          <div className="default_modal_1_row_items">
            <span className="default_bold_label" style={{ width: "100px" }}>
              Trạng thái
            </span>
            <Form.Item
              name="status"
              rules={[{ required: true, message: "Điền tên tuyến" }]}
              initialValue={"1"}
            >
              <Select
                options={[
                  { value: "1", label: "Hoạt động" },
                  { value: "0", label: "Huỷ" },
                ]}
              />
            </Form.Item>
          </div>
        </div>

        <Space style={{ justifyContent: "center", alignItems: "center" }}>
          <Button
            className="default_subsidiary_button"
            onClick={handleCancelModal}
          >
            Huỷ
          </Button>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              className="default_primary_button"
              icon={<img src={send_icon} alt="" />}
            >
              Lưu
            </Button>
          </Form.Item>
        </Space>
      </Form>
    </Modal>
  );
};

export default ModalClassifyCustomer;
