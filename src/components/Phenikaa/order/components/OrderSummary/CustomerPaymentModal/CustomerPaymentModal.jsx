import { Button, Input, Modal } from "antd";
import { useEffect, useState } from "react";
import { formatData } from "../../../../Utils/hook/dataFormatHelper";
import "./CustomerPaymentModal.css";

const CustomerPaymentModal = ({
  visible,
  onClose,
  onConfirm,
  total,
  customerInfo = {},
  isSubmitting = false,
}) => {
  const [localCustomerInfo, setLocalCustomerInfo] = useState({
    ong_ba: "",
    so_dt: "",
  });
  const [errors, setErrors] = useState({
    so_dt: "",
  });

  useEffect(() => {
    if (visible) {
      setLocalCustomerInfo({
        ong_ba: customerInfo.ong_ba || "",
        so_dt: customerInfo.so_dt || "",
      });
      setErrors({
        so_dt: "",
      });
    }
  }, [visible, customerInfo]);

  const validatePhoneNumber = (value) => {
    if (!value) return "Số điện thoại là bắt buộc";
    if (!/^(0|\+84)[3|5|7|8|9][0-9]{8}$/.test(value)) {
      return "Số điện thoại phải có 10 số và bắt đầu bằng 0";
    }
    return "";
  };

  const handleInputChange = (field, value) => {
    // Chỉ cho phép nhập số cho số điện thoại
    if (field === "so_dt") {
      if (value !== "" && !/^\d*$/.test(value)) {
        return;
      }
    }

    setLocalCustomerInfo((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (field === "so_dt") {
      setErrors((prev) => ({
        ...prev,
        so_dt: validatePhoneNumber(value),
      }));
    }
  };

  const handleClose = () => {
    setLocalCustomerInfo({
      ong_ba: "",
      so_dt: "",
    });
    setErrors({
      so_dt: "",
    });
    onClose();
  };

  const handleConfirm = () => {
    // Kiểm tra lỗi trước khi gửi
    const hasErrors = Object.values(errors).some((error) => error);

    // Kiểm tra số điện thoại bắt buộc
    if (!localCustomerInfo.so_dt) {
      setErrors((prev) => ({
        ...prev,
        so_dt: "Số điện thoại là bắt buộc",
      }));
      return;
    }

    if (hasErrors) {
      return;
    }

    onConfirm(localCustomerInfo);
  };

  return (
    <Modal
      title={<p className="payment-title">Xác nhận đơn hàng</p>}
      open={visible}
      onCancel={handleClose}
      footer={null}
      className="payment-modal"
      width={500}
    >
      <div className="customer-payment-content">
        {/* Thông tin khách hàng */}
        <div className="customer-info-section">
          <h4 className="section-title">Thông tin khách hàng</h4>
          <div className="info-form">
            <div className="form-item">
              <label>Tên khách:</label>
              <Input
                value={localCustomerInfo.ong_ba}
                placeholder="Nhập tên khách"
                onChange={(e) => handleInputChange("ong_ba", e.target.value)}
                style={{ width: "100%", marginTop: 4 }}
              />
            </div>
            <div className="form-item">
              <label>
                Số điện thoại: <span style={{ color: "red" }}>*</span>
              </label>
              <Input
                value={localCustomerInfo.so_dt}
                placeholder="Nhập số điện thoại"
                onChange={(e) => handleInputChange("so_dt", e.target.value)}
                status={errors.so_dt ? "error" : ""}
                maxLength={12}
                onKeyPress={(e) => {
                  if (!/\d/.test(e.key)) {
                    e.preventDefault();
                  }
                }}
                style={{ width: "100%", marginTop: 4 }}
              />
              {errors.so_dt && (
                <div style={{ color: "red", fontSize: 12, marginTop: 4 }}>
                  {errors.so_dt}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tổng tiền */}
        <div className="total-section">
          <div className="total-amount">
            <span className="amount-label">Tổng tiền:</span>
            <span className="amount-value">{formatCurrency(total)}đ</span>
          </div>
        </div>

        {/* Buttons */}
        <div className="modal-footer">
          <Button
            key="cancel"
            onClick={handleClose}
            className="payment-button secondary"
            disabled={isSubmitting}
            size="large"
          >
            Huỷ
          </Button>
          <Button
            key="confirm"
            type="primary"
            onClick={handleConfirm}
            className="payment-button primary"
            disabled={isSubmitting}
            loading={isSubmitting}
            size="large"
          >
            Gửi
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default CustomerPaymentModal;
