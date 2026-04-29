import { Divider, Form, Input, Modal, notification, Select, Tabs } from "antd";
import React, { useEffect, useState } from "react";
import "./ModalViewItems.css";

import { memo } from "react";
import { KeyFormatter } from "../../../../app/Options/KeyFormatter";
import { formStatus } from "../../../../utils/constants";

import TabPane from "antd/es/tabs/TabPane";
import { useSelector } from "react-redux";
import {
  SoFuckingUltimateApi,
  SoFuckingUltimateGetApi,
} from "../../../DMS/API";
import FormSelectDetail from "../../../ReuseComponents/FormSelectDetail";
import { setIsOpenItemListModal } from "../../Store/Actions/Actions";
import {
  getCurrentItem,
  getIsOpenItemListModal,
  getOpenItemListModalType,
} from "../../Store/Selectors/Selectors";
import MainInfo from "./Detail/MainInfo";

const ModalViewItems = ({
  handleCloseModal,
  openModalState,
  currentRecord,
  openModalType,
  refreshData,
}) => {
  const [inputForm] = Form.useForm();
  const [isOpenModal, setOpenModal] = useState();
  const [initialValues, setInitialValues] = useState({});
  const [selectLoading, setSelectLoading] = useState(false);
  const [selectOptions, setSelectOptions] = useState([]);
  const [disableFields, setDisableFields] = useState(false);

  const isOpenState = useSelector(getIsOpenItemListModal);
  const currentItem = useSelector(getCurrentItem);
  const openType = useSelector(getOpenItemListModalType);

  const handleCancelModal = () => {
    setIsOpenItemListModal(false);
    setOpenModal(false);
    handleCloseModal();
    inputForm.resetFields();
  };

  const onSubmitForm = () => {
    const master = { ...inputForm.getFieldsValue() };
    SoFuckingUltimateApi({
      store: "Api_create_dmalbum",
      data: {
        action:
          openModalType === formStatus.EDIT ? openModalType : formStatus.ADD,
        userid: 0,
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
      store: "api_get_items_list",
      data: {
        id: id.trim(),
        pageIndex: 1,
        pageSize: 10,
      },
    }).then((res) => {
      const keys = Object.keys(inputForm.getFieldsValue());
      keys.map((item) => {
        inputForm.setFieldValue(item, res.data[0][item]);
      });
      setDisableFields(true);
    });
  };

  useEffect(() => {
    setOpenModal(isOpenState);
    if (
      isOpenState &&
      (openType === formStatus.EDIT || openType === formStatus.VIEW)
    ) {
      getDataEdit(currentItem ? currentItem : 0);
    }
  }, [JSON.stringify(isOpenState)]);

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
      destroyOnClose
    >
      <div className="default_modal_header">
        <span className="default_header_label">{`${
          openModalType == formStatus.EDIT
            ? "Sửa"
            : openModalType == formStatus.VIEW
            ? "Xem"
            : "Thêm"
        } vật tư`}</span>
      </div>
      <Form
        form={inputForm}
        className="default_modal_container"
        onFinishFailed={onSubmitFormFail}
        onFinish={onSubmitForm}
      >
        <div className="default_modal_group_items">
          <div className="default_modal_1_row_items">
            <span className="default_bold_label" style={{ width: "150px" }}>
              Mã vật tư
            </span>
            <Form.Item
              name="ma_vt"
              rules={[{ required: true, message: "Mã vật tư" }]}
            >
              <Input
                disabled={openModalType == formStatus.VIEW ? true : false}
                onInput={(e) => (e.target.value = KeyFormatter(e.target.value))}
                placeholder="Mã vật tư"
              />
            </Form.Item>
          </div>
        </div>

        <div className="default_modal_group_items">
          <div className="default_modal_1_row_items">
            <span className="default_bold_label" style={{ width: "150px" }}>
              Tên vật tư
            </span>
            <Form.Item
              name="ten_vt"
              rules={[{ required: true, message: "Tên vật tư" }]}
            >
              <Input
                disabled={openModalType == formStatus.VIEW ? true : false}
                placeholder="Tên vật tư"
              />
            </Form.Item>
          </div>
        </div>

        <FormSelectDetail
          disable={openModalType == formStatus.VIEW ? true : false}
          label="Đơn vị tính"
          keyCode="dvt"
          keyName="ten_dvt"
          controller="dmdvt_lookup"
          form={inputForm}
          placeHolderCode="Đơn vị tính"
          placeHolderName="Tên đơn vị"
          required={true}
          width="150"
        />

        <Tabs moreIcon={<span>...</span>} style={{ minWidth: "0" }}>
          <TabPane tab="Thông tin chính" key="detail">
            <MainInfo action={openModalType} form={inputForm} />
          </TabPane>
        </Tabs>

        <Divider style={{ margin: "0" }} />

        <div className="default_modal_group_items">
          <div className="default_modal_1_row_items">
            <span className="default_bold_label" style={{ width: "150px" }}>
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
      </Form>
    </Modal>
  );
};

export default memo(ModalViewItems);
