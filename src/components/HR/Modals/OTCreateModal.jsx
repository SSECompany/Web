import React from "react";
import {
  AutoComplete,
  Input,
  Dropdown,
  Menu,
  Modal,
  Space,
  Button,
  DatePicker,
  Select,
} from "antd";
import { useState } from "react";
import { useEffect } from "react";

const OTCreateModal = (props) => {
  const [isOpenSearchModal, setOpenSearchModal] = useState();
  const handleOkSearchModal = () => {
    setOpenSearchModal(false);
    props.handleCloseModal();
  };
  const handleCancelSearchModal = () => {
    setOpenSearchModal(false);
    props.handleCloseModal();
  };

  useEffect(() => {
    setOpenSearchModal(props.isOpenSearchModal);
  }, [props]);

  return (
    <Modal
      className="default_modal"
      open={isOpenSearchModal}
      onOk={handleOkSearchModal}
      onCancel={handleCancelSearchModal}
      closable={false}
      okButtonProps={{ style: { display: "none" } }}
      cancelButtonProps={{ style: { display: "none" } }}
      style={{ top: 100, padding: 0 }}
     
    >
      <div className="default_modal_header">
        <span className="default_header_label">Mạch Hưng</span>
      </div>
      <div className="default_modal_container">
        <div className="default_modal_group_items">
          <Space direction="vertical">
            <span style={{ fontSize: "13px" }}>Ngày đăng ký</span>
            <DatePicker format={'DD/MM/YYYY'}  style={{ width: "100%" }} placeholder="Chọn ngày" />
          </Space>
          <Space direction="vertical">
            <span>Chọn ca</span>
            <Select
              defaultValue="lucy"
              style={{ width: "100%" }}
              options={[
                { value: "jack", label: "Jack" },
                { value: "lucy", label: "Lucy" },
                { value: "Yiminghe", label: "yiminghe" },
              ]}
            />
          </Space>
        </div>
        <div className="default_modal_group_items">
          <Space direction="vertical">
            <span style={{ fontSize: "13px" }}>Ngày đăng ký</span>
            <DatePicker  format={'DD/MM/YYYY'} style={{ width: "100%" }} placeholder="Chọn ngày" />
          </Space>
          <Space direction="vertical">
            <span>Chọn ca</span>
            <Select
              defaultValue="lucy"
              style={{ width: "100%" }}
              options={[
                { value: "jack", label: "Jack" },
                { value: "lucy", label: "Lucy" },
                { value: "Yiminghe", label: "yiminghe" },
              ]}
            />
          </Space>
        </div>
        <Space direction="vertical">
          <span>Ghi chú</span>
          <Input placeholder="Ghi chú"/>
        </Space>
      </div>
    </Modal>
  );
};

export default OTCreateModal;
