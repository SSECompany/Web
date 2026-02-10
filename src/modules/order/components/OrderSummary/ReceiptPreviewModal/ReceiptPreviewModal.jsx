import React from "react";
import { Button, Modal } from "antd";
import { PrinterOutlined } from "@ant-design/icons";
import ReceiptThermalPreview from "./ReceiptThermalPreview";
import "./ReceiptPreviewModal.css";

/**
 * Modal xem trước hóa đơn trước khi in.
 * Dùng cho luồng "In lại": hiển thị preview → user bấm "Xác nhận in" mới thực hiện in.
 */
const ReceiptPreviewModal = ({
  visible,
  onCancel,
  onConfirm,
  master = {},
  detail = [],
  orderNumber = "",
  isReprint = true,
  confirmLoading = false,
}) => {
  return (
    <Modal
      title={null}
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Hủy
        </Button>,
        <Button
          key="confirm"
          type="primary"
          icon={<PrinterOutlined />}
          loading={confirmLoading}
          onClick={onConfirm}
        >
          Xác nhận in
        </Button>,
      ]}
      width={520}
      className="receipt-preview-modal"
      destroyOnClose
      centered
    >
      <div className="receipt-preview-scroll">
        <div className="receipt-preview-paper">
          <ReceiptThermalPreview
            master={{ ...master, so_ct: orderNumber || master?.so_ct }}
            detail={detail}
            receiptTitle={isReprint ? "HÓA ĐƠN (IN LẠI)" : "HÓA ĐƠN"}
          />
        </div>
      </div>
    </Modal>
  );
};

export default ReceiptPreviewModal;
