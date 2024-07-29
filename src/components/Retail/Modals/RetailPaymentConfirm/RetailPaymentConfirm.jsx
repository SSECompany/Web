import { Modal } from "antd";
import React, { memo } from "react";
import { useHotkeys } from "react-hotkeys-hook";

const RetailPaymentConfirm = ({ onOk, isOpen, onClose }) => {
  useHotkeys(
    "enter",
    (e) => {
      e.preventDefault();
      if (isOpen) onOk();
    },
    { enableOnFormTags: ["input", "select", "textarea"] },
    [isOpen]
  );

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title="Xác nhận thanh toán"
      destroyOnClose={true}
      cancelText="Đóng"
      onOk={() => {
        onOk();
      }}
      onCancel={onClose}
      centered
    >
      <span>Vui lòng kiểm tra lại các thông tin trước khi thanh toán</span>
    </Modal>
  );
};

export default memo(RetailPaymentConfirm);
