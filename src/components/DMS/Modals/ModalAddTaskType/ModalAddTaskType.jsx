import { Button, Form, Input, Modal, notification, Select, Space } from "antd";
import React, { useEffect, useState } from "react";
import "./ModalAddTaskType.css";

import _ from "lodash";
import { memo } from "react";
import { useDebouncedCallback } from "use-debounce";
import SelectItemCode from "../../../../Context/SelectItemCode";
import SelectNotFound from "../../../../Context/SelectNotFound";
import send_icon from "../../../../Icons/send_icon.svg";
import { formStatus } from "../../../../utils/constants";
import LoadingComponents from "../../../Loading/LoadingComponents";
import {
  ApiWebLookup,
  SoFuckingUltimateApi,
  SoFuckingUltimateGetApi,
} from "../../API";

// bắt buộc khai báo bên ngoài

const ModalAddTaskType = ({
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
  const [loading, setLoading] = useState(false);

  const lookupData = (item) => {
    setSelectLoading(true);
    ApiWebLookup({
      userId: "1",
      controller: item.controller,
      pageIndex: 1,
      FilterValueCode: item.value.trim(),
    }).then((res) => {
      const resOptions = res.data.map((item) => {
        return {
          value: item.code.trim(),
          label: item.name.trim(),
        };
      });
      setSelectLoading(false);
      setSelectOptions([...resOptions]);
    });
  };

  const handleCancelModal = () => {
    setOpenModal(false);
    handleCloseModal();
    inputForm.resetFields();
  };

  const onSubmitForm = () => {
    const master = { ...inputForm.getFieldsValue() };
    SoFuckingUltimateApi({
      store: "Api_Create_Task_Type",
      data: {
        action:
          openModalType === formStatus.EDIT ? openModalType : formStatus.ADD,
        id: String(currentRecord).trim(),
        ten_loai: master.taskTypeName,
        albums: master.albums.join(","),
        description: master.description,
        status: master.status,
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
      store: "Get_Task_type",
      data: {
        id: id.trim(),
        pageIndex: 1,
        pageSize: 10,
      },
    }).then((res) => {
      inputForm.setFieldValue(`taskTypeName`, res.data[0]?.ten_cv?.trim());
      inputForm.setFieldValue(
        `albums`,
        res.data[0]?.obligatory_album?.split(",")
      );
      inputForm.setFieldValue(`description`, res.data[0]?.mo_ta?.trim());
      inputForm.setFieldValue(`status`, res.data[0]?.status?.trim());
      setLoading(false);
    });
  };

  const handleSelectionChange = useDebouncedCallback((actions, value) => {
    switch (actions) {
      case "province":
        lookupData({ controller: "dmtinh_lookup", value: value });
        break;
      case "district":
        lookupData({ controller: "dmquan_lookup", value: value });
        break;
      case "album":
        lookupData({ controller: "dmalbum_lookup", value: value });
        break;

      default:
        break;
    }
  }, 600);

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
        } loại công việc`}</span>
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
            <span className="default_bold_label" style={{ width: "150px" }}>
              Tên loại công việc
            </span>
            <Form.Item
              name="taskTypeName"
              rules={[{ required: true, message: "Điền tên loại công việc" }]}
            >
              <Input placeholder="Nhập tên loại công việc" />
            </Form.Item>
          </div>
        </div>

        <div className="default_modal_group_items">
          <div className="default_modal_1_row_items">
            <span className="default_bold_label" style={{ width: "150px" }}>
              Albums
            </span>
            <Form.Item initialValue={[]} name="albums">
              <Select
                mode="multiple"
                showSearch
                placeholder={`Albums`}
                style={{
                  width: "100%",
                  flex: "none",
                }}
                optionLabelProp="value"
                defaultActiveFirstOption={false}
                suffixIcon={false}
                filterOption={false}
                notFoundContent={SelectNotFound(selectLoading, selectOptions)}
                onSearch={(e) => {
                  handleSelectionChange("album", e);
                }}
                onSelect={(key, item) => {}}
                onClick={() => {
                  if (_.isEmpty(selectOptions)) {
                    lookupData({ controller: "dmalbum_lookup", value: "" });
                  }
                }}
              >
                {SelectItemCode(selectOptions)}
              </Select>
            </Form.Item>
          </div>
        </div>

        <div className="default_modal_group_items">
          <div className="default_modal_1_row_items">
            <span className="default_bold_label" style={{ width: "150px" }}>
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

export default memo(ModalAddTaskType);
