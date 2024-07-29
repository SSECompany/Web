import { Button, Modal, Space } from "antd";
import React, { memo, useEffect, useState } from "react";
import send_icon from "../Icons/send_icon.svg";

const ConfirmDialog = (props) => {
  const [isOpenModal, setIsOpenModal] = useState(false);
  const handleCancelModal = () => {
    props.handleCloseModal();
  };

  useEffect(() => {
    setIsOpenModal(props.state);
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
      width={props.size ? props.size : 400}
    >
      <div className="default_modal_header">
        <span className="default_header_label">{props.title}</span>
      </div>
      <div className="default_modal_container">
        <div className="default_modal_group_items">
          <span>{props.description}</span>
        </div>
      </div>

      <div className="default_modal_container">
        <Space style={{ justifyContent: "center", alignItems: "center" }}>
          <Button
            className="default_subsidiary_button"
            onClick={handleCancelModal}
          >
            Huỷ
          </Button>

          <Button
            className="default_primary_button"
            icon={<img src={send_icon} alt="" />}
            onClick={(e) => {
              props.handleOkModal(props?.keys);
            }}
          >
            Lưu
          </Button>
        </Space>
      </div>
    </Modal>
  );
};

export default memo(ConfirmDialog);
