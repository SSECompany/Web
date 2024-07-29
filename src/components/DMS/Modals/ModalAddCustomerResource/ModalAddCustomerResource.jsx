import { Button, Form, Input, Modal, Select, Space } from "antd";
import React, { useEffect, useState } from "react";
import "./ModalAddCustomerResource.css";

import send_icon from "../../../../Icons/send_icon.svg";
import { SoFuckingUltimateApi, SoFuckingUltimateGetApi } from "../../API";

import { notification } from "antd";
import { KeyFormatter } from "../../../../app/Options/KeyFormatter";
import LoadingComponents from "../../../Loading/LoadingComponents";

// bắt buộc khai báo bên ngoài

const ModalAddCustomerResource = (props) => {
  ////////////////////////////////////////-Init-//////////////////////////////////////////
  const [inputForm] = Form.useForm();
  const [isOpenModal, setOpenModal] = useState();
  const [initialValues, setInitialValues] = useState({});
  const [disableFields, setDisableFields] = useState(false);
  const [loading, setLoading] = useState(false);

  ////////////////////////////////////////-Functions-//////////////////////////////////////////

  const handleCancelModal = () => {
    setOpenModal(false);
    props.handleCloseModal();
    inputForm.resetFields();
    setDisableFields(false);
  };

  const onSubmitForm = () => {
    const a = { ...inputForm.getFieldsValue() };
    SoFuckingUltimateApi({
      store: "Api_Create_Customer_Resouce",
      data: {
        action: props.openModalType === "EDIT" ? props.openModalType : "ADD",
        ma_nguon: a.resourceCode,
        ten_nguon: a.resourceName,
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
      store: "Get_Customer_Source",
      data: {
        id: id.trim(),
        pageIndex: 1,
        pageSize: 10,
        SearchKey: "",
        status: "",
      },
    }).then((res) => {
      inputForm.setFieldValue(`resourceCode`, res.data[0]?.ma_nguon.trim());
      inputForm.setFieldValue(`resourceName`, res.data[0]?.ten_nguon.trim());
      inputForm.setFieldValue(`status`, res.data[0]?.status);

      setDisableFields(true);
      setLoading(false);
    });
  };

  ////////////////////////////////////////-Effect-//////////////////////////////////////////

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
        } danh mục nguồn khách hàng`}</span>
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
              Mã nguồn
            </span>
            <Form.Item
              name="resourceCode"
              rules={[{ required: true, message: "Điền mã nguồn" }]}
            >
              <Input
                disabled={disableFields}
                onInput={(e) => (e.target.value = KeyFormatter(e.target.value))}
                placeholder="Nhập mã nguồn"
              />
            </Form.Item>
          </div>
        </div>
        <div className="default_modal_group_items">
          <div className="default_modal_1_row_items">
            <span className="default_bold_label" style={{ width: "100px" }}>
              Tên nguồn
            </span>
            <Form.Item
              name="resourceName"
              rules={[{ required: true, message: "Điền tên nguồn" }]}
            >
              <Input placeholder="Nhập tên nguồn" />
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
              rules={[{ required: true, message: "Chọn trạng thái" }]}
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

export default ModalAddCustomerResource;
