import { Button, Form, Input, Modal, notification, Select, Space } from "antd";
import React, { useEffect, useState } from "react";
import "./SaleEmployeeModal.css";

import { useSelector } from "react-redux";
import {
  deleteObjectItems,
  formatData,
} from "../../../../app/hooks/dataFormatHelper";
import { KeyFormatter } from "../../../../app/Options/KeyFormatter";
import { phoneNumberRegex } from "../../../../app/regex/regex";
import { getUserInfo } from "../../../../store/selectors/Selectors";
import { formStatus } from "../../../../utils/constants";
import { SoFuckingUltimateGetApi } from "../../../DMS/API";
import FormSelectDetail from "../../../ReuseComponents/FormSelectDetail";
import { SoFuckingUltimateApi } from "../../API";

const SaleEmployeeModal = ({
  handleCloseModal,
  openModalState,
  currentRecord,
  openModalType,
  refreshData,
}) => {
  const [inputForm] = Form.useForm();
  const [isOpenModal, setOpenModal] = useState();
  const [selectOptions, setSelectOptions] = useState([]);
  const [selectLoading, setSelectLoading] = useState(false);
  const userInfo = useSelector(getUserInfo);

  const handleCancelModal = () => {
    setOpenModal(false);
    handleCloseModal();
    inputForm.resetFields();
  };

  const onSubmitForm = () => {
    const master = {
      ...deleteObjectItems(inputForm.getFieldsValue(), [
        "ten_nvql",
        "user_name",
      ]),
      UserID: userInfo.id,
      action:
        openModalType === formStatus.EDIT ? openModalType : formStatus.ADD,
    };

    SoFuckingUltimateApi({
      store: "api_create_customer",
      data: {
        ...master,
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
      store: "api_get_customer_detail",
      data: {
        id: id.trim(),
        pageIndex: 1,
        pageSize: 10,
        status: "",
      },
    }).then((res) => {
      const data = formatData(res?.data[0], res?.reportLayoutModel);
      res?.reportLayoutModel.map((item) => {
        return inputForm.setFieldValue(`${item.field}`, data[`${item.field}`]);
      });
    });
  };

  useEffect(() => {
    setOpenModal(openModalState);
    if (openModalState && openModalType === formStatus.EDIT) {
      getDataEdit(currentRecord ? currentRecord : "0");
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
        } nhân viên`}</span>
      </div>
      <Form
        form={inputForm}
        className="default_modal_container"
        onFinishFailed={onSubmitFormFail}
        onFinish={onSubmitForm}
      >
        <div className="default_modal_group_items">
          <div className="default_modal_1_row_items">
            <span className="default_bold_label" style={{ width: "100px" }}>
              Mã nhân viên
            </span>
            <Form.Item
              name="ma_nvbh"
              onInput={(e) => (e.target.value = KeyFormatter(e.target.value))}
              rules={[{ required: true, message: "Điền mã nhân viên" }]}
            >
              <Input
                maxLength={8}
                disabled={openModalType == formStatus.EDIT ? true : false}
                placeholder="Nhập mã nhân viên"
              />
            </Form.Item>
          </div>
        </div>

        <div className="default_modal_group_items">
          <div className="default_modal_1_row_items">
            <span className="default_bold_label" style={{ width: "100px" }}>
              Tên nhân viên
            </span>
            <Form.Item
              name="ten_nvbh"
              rules={[{ required: true, message: "Điền tên nhân viên" }]}
            >
              <Input placeholder="Nhập tên nhân viên" />
            </Form.Item>
          </div>
        </div>

        <div className="default_modal_group_items">
          <div className="default_modal_1_row_items">
            <span className="default_bold_label" style={{ width: "100px" }}>
              Tên khác
            </span>
            <Form.Item name="ten_nvbh2">
              <Input placeholder="Nhập tên khác" />
            </Form.Item>
          </div>
        </div>

        <div className="default_modal_group_items">
          <div className="default_modal_1_row_items">
            <span className="default_bold_label" style={{ width: "100px" }}>
              Địa chỉ
            </span>
            <Form.Item name="dia_chi">
              <Input placeholder="Nhập địa chỉ" />
            </Form.Item>
          </div>
        </div>

        <div className="default_modal_group_items">
          <div className="default_modal_1_row_items">
            <span className="default_bold_label" style={{ width: "100px" }}>
              Điện thoại
            </span>
            <Form.Item
              name="dien_thoai"
              rules={[
                { required: true, message: "Điền số điện thoại" },

                {
                  validator: async (_, value) => {
                    return ((await phoneNumberRegex.test(value)) || !value) ==
                      true
                      ? Promise.resolve()
                      : Promise.reject(
                          new Error("Lỗi định dạng số điện thoại")
                        );
                  },
                },
              ]}
            >
              <Input placeholder="Nhập điện thoại" />
            </Form.Item>
          </div>
        </div>

        <div className="default_modal_group_items">
          <div className="default_modal_1_row_items">
            <span className="default_bold_label" style={{ width: "100px" }}>
              Ghi chú
            </span>
            <Form.Item name="ghi_chu">
              <Input.TextArea
                autoSize={{
                  minRows: 1,
                  maxRows: 4,
                }}
                placeholder="Nhập ghi chú"
              />
            </Form.Item>
          </div>
        </div>

        <div className="default_modal_group_items">
          <FormSelectDetail
            disable={openModalState == formStatus.VIEW ? true : false}
            label="User ID"
            keyCode="user_id"
            placeHolderCode="ID"
            keyName="user_name"
            placeHolderName="Người sử dụng"
            controller="dm_users_lookup"
            form={inputForm}
            required={true}
          />
        </div>

        <div className="default_modal_group_items">
          <FormSelectDetail
            disable={openModalState == formStatus.VIEW ? true : false}
            label="Người quản lý"
            keyCode="nvql"
            placeHolderCode="ID"
            keyName="ten_nvql"
            placeHolderName="Người quản lý"
            controller="dm_users_lookup"
            form={inputForm}
          />
        </div>

        <div className="default_modal_group_items">
          <div className="default_modal_1_row_items">
            <span className="default_bold_label" style={{ width: "100px" }}>
              Trạng thái
            </span>
            <Form.Item
              name="status"
              initialValue={1}
              rules={[{ required: true, message: "Chọn trạng thái" }]}
            >
              <Select
                options={[
                  { value: 1, label: "Còn sử dụng" },
                  { value: 0, label: "Không sử dụng" },
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
              icon={<i className="pi pi-send"></i>}
            >
              Lưu
            </Button>
          </Form.Item>
        </Space>
      </Form>
    </Modal>
  );
};

export default SaleEmployeeModal;
