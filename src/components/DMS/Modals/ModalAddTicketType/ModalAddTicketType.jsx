import { Button, Form, Input, Modal, notification, Select, Space } from "antd";
import React, { useEffect, useState } from "react";
import "./ModalAddTicketType.css";

import send_icon from "../../../../Icons/send_icon.svg";
import { formStatus } from "../../../../utils/constants";
import LoadingComponents from "../../../Loading/LoadingComponents";
import FormSelectDetail from "../../../ReuseComponents/FormSelectDetail";
import { SoFuckingUltimateApi, SoFuckingUltimateGetApi } from "../../API";

const ModalAddTicketType = ({
  handleCloseModal,
  openModalState,
  currentRecord,
  openModalType,
  refreshData,
}) => {
  const [inputForm] = Form.useForm();
  const [isOpenModal, setOpenModal] = useState();
  const [initialValues, setInitialValues] = useState({});
  const [selectOptions, setSelectOptions] = useState([]);
  const [selectLoading, setSelectLoading] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCancelModal = () => {
    setOpenModal(false);
    handleCloseModal();
    inputForm.resetFields();
  };

  const onSubmitForm = () => {
    const a = { ...inputForm.getFieldsValue() };
    console.log(a);
    SoFuckingUltimateApi({
      store: "Api_Create_ticket_type",
      data: {
        action:
          openModalType === formStatus.EDIT ? openModalType : formStatus.ADD,
        id: String(currentRecord).trim(),
        ten_loai: a.ticketTypeName,
        mo_ta: a.description,
        ma_loai_cha: a.ticketTypeParent,
        status: a.status,
        userid: 0,
      },
    })
      .then((res) => {
        if (res.status === 200 && res.data === true) {
          notification.success({
            message: `Thành công`,
          });
          refreshData();
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
      store: "Get_Ticket_type",
      data: {
        id: id.trim(),
        pageIndex: 1,
        pageSize: 10,
      },
    }).then((res) => {
      inputForm.setFieldValue(`ticketTypeName`, res.data[0]?.ten_loai?.trim());
      inputForm.setFieldValue(`description`, res.data[0]?.mo_ta?.trim());
      inputForm.setFieldValue(
        `ticketTypeParent`,
        res.data[0]?.loai_cha?.trim()
      );
      inputForm.setFieldValue(
        `ticketTypeParentName`,
        res.data[0]?.ten_loai_cha?.trim()
      );
      inputForm.setFieldValue(`status`, res.data[0]?.status?.trim());

      setLoading(false);
    });
  };

  useEffect(() => {
    setOpenModal(openModalState);
    if (openModalState && openModalType === formStatus.EDIT) {
      setInitialValues({});
      setLoading(true);

      getDataEdit(currentRecord || 0);
    }
  }, [JSON.stringify(openModalState)]);

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
          openModalType == formStatus.EDIT ? "Sửa" : "Thêm mới"
        } loại ticket`}</span>
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
              Tên loại
            </span>
            <Form.Item
              name="ticketTypeName"
              rules={[{ required: true, message: "Điền tên loại" }]}
            >
              <Input placeholder="Nhập tên loại" />
            </Form.Item>
          </div>
        </div>

        <div className="default_modal_group_items">
          <div className="default_modal_1_row_items">
            <span className="default_bold_label" style={{ width: "100px" }}>
              Mô tả
            </span>
            <Form.Item name="description">
              <Input.TextArea
                autoSize={{
                  minRows: 1,
                  maxRows: 4,
                }}
                placeholder="Nhập mô tả"
              />
            </Form.Item>
          </div>
        </div>

        <div className="default_modal_group_items">
          <FormSelectDetail
            disable={openModalState == formStatus.VIEW ? true : false}
            label="Loại ticket cha"
            keyCode="ticketTypeParent"
            placeHolderCode="Điền loại ticket"
            keyName="ticketTypeParentName"
            placeHolderName="Tên loại ticket"
            controller="dmloaitk_lookup"
            form={inputForm}
            required={true}
          />
        </div>

        <div className="default_modal_group_items">
          <div className="default_modal_1_row_items">
            <span className="default_bold_label" style={{ width: "100px" }}>
              Trạng thái
            </span>
            <Form.Item
              name="status"
              rules={[{ required: true, message: "Điền tên trạng thái" }]}
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

export default ModalAddTicketType;
