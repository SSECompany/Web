import { DownOutlined, UpOutlined } from "@ant-design/icons";
import { Button, Input, InputNumber, Modal } from "antd";
import { useEffect, useState } from "react";
import {
    formatCurrency,
    formatNumber,
    parserNumber,
} from "../../../../../app/hook/dataFormatHelper";
import { num2words } from "../../../../../app/Options/DataFomater";
import "./PaymentModal.css";

const PaymentModal = ({ visible, onClose, onConfirm, total }) => {
  const [selectedPayments, setSelectedPayments] = useState(["chuyen_khoan"]);
  const [paymentAmounts, setPaymentAmounts] = useState({
    tien_mat: 0,
    chuyen_khoan: 0,
  });
  const [change, setChange] = useState(0);
  const [customerInfo, setCustomerInfo] = useState({
    ong_ba: "",
    cccd: "",
    dia_chi: "",
    so_dt: "",
    email: "",
  });
  const [showCustomerInfo, setShowCustomerInfo] = useState(false);
  const handleToggleCustomerInfo = () => setShowCustomerInfo((prev) => !prev);

  const showQRCode =
    selectedPayments.length === 1 && selectedPayments.includes("chuyen_khoan");

  const account = process.env.REACT_APP_VIETQR_ACCOUNT;
  const accountName = process.env.REACT_APP_VIETQR_ACCOUNT_NAME;
  const qrUrl = `https://img.vietqr.io/image/${account}-qr_only.png?amount=${total}`;

  const handlePaymentSelection = (method) => {
    setSelectedPayments((prev) => {
      const newSelectedPayments = prev.includes(method)
        ? prev.filter((item) => item !== method)
        : [...prev, method];

      setPaymentAmounts((amounts) => {
        const updatedAmounts = { ...amounts };
        
        // Reset amounts for unselected methods
        if (!newSelectedPayments.includes("tien_mat")) {
          updatedAmounts["tien_mat"] = 0;
        }
        if (!newSelectedPayments.includes("chuyen_khoan")) {
          updatedAmounts["chuyen_khoan"] = 0;
        }
        
        // If only "chuyen_khoan" is selected, auto-set to total amount
        if (newSelectedPayments.length === 1 && newSelectedPayments.includes("chuyen_khoan")) {
          updatedAmounts["chuyen_khoan"] = total;
        }
        
        const totalAmount = Object.values(updatedAmounts).reduce(
          (sum, val) => sum + val,
          0
        );
        setChange(totalAmount - total);
        return updatedAmounts;
      });

      return newSelectedPayments;
    });
  };

  const handleAmountChange = (method, value) => {
    const newAmounts = { ...paymentAmounts, [method]: value || 0 };
    setPaymentAmounts(newAmounts);

    const totalAmount = Object.values(newAmounts).reduce(
      (sum, val) => sum + val,
      0
    );
    setChange(totalAmount - total);
  };

  const handleClose = () => {
    setSelectedPayments(["chuyen_khoan"]);
    setPaymentAmounts({ tien_mat: 0, chuyen_khoan: 0 });
    setChange(0);
    setCustomerInfo({
      ong_ba: "",
      cccd: "",
      dia_chi: "",
      so_dt: "",
      email: "",
    });
    setShowCustomerInfo(false);
    onClose();
  };

  useEffect(() => {
    if (visible) {
      setSelectedPayments(["chuyen_khoan"]);
      setPaymentAmounts({ tien_mat: 0, chuyen_khoan: total });
      setChange(0);
      setCustomerInfo({
        ong_ba: "",
        cccd: "",
        dia_chi: "",
        so_dt: "",
        email: "",
      });
      setShowCustomerInfo(false);
    }
  }, [visible, total]);

  return (
    <Modal
      title={<p className="payment-title">Phiếu thanh toán</p>}
      visible={visible}
      onCancel={handleClose}
      footer={null}
      className="payment-modal"
    >
      <p
        className="payment-text"
        onClick={handleToggleCustomerInfo}
        style={{ cursor: "pointer", userSelect: "none" }}
      >
        <strong>
          Thông tin khách hàng{" "}
          {showCustomerInfo ? <UpOutlined /> : <DownOutlined />}
        </strong>
      </p>
      {showCustomerInfo && (
        <div className="customer-info-section" style={{ margin: "16px 0" }}>
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontWeight: 500 }}>Tên khách:</label>
                <Input
                  style={{ width: "100%", marginTop: 4 }}
                  value={customerInfo.ong_ba}
                  placeholder="Nhập tên khách"
                  onChange={(e) =>
                    setCustomerInfo((prev) => ({
                      ...prev,
                      ong_ba: e.target.value,
                    }))
                  }
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontWeight: 500 }}>CCCD:</label>
                <Input
                  style={{ width: "100%", marginTop: 4 }}
                  value={customerInfo.cccd}
                  placeholder="Nhập số CCCD"
                  onChange={(e) =>
                    setCustomerInfo((prev) => ({
                      ...prev,
                      cccd: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontWeight: 500 }}>Số điện thoại:</label>
                <Input
                  style={{ width: "100%", marginTop: 4 }}
                  value={customerInfo.so_dt}
                  placeholder="Nhập số điện thoại"
                  onChange={(e) =>
                    setCustomerInfo((prev) => ({
                      ...prev,
                      so_dt: e.target.value,
                    }))
                  }
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontWeight: 500 }}>Email:</label>
                <Input
                  style={{ width: "100%", marginTop: 4 }}
                  value={customerInfo.email}
                  placeholder="Nhập email"
                  type="email"
                  onChange={(e) =>
                    setCustomerInfo((prev) => ({
                      ...prev,
                      email: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <div style={{ marginTop: 8 }}>
              <label style={{ fontWeight: 500 }}>Địa chỉ:</label>
              <Input
                style={{ width: "100%", marginTop: 4 }}
                value={customerInfo.dia_chi}
                placeholder="Nhập địa chỉ"
                onChange={(e) =>
                  setCustomerInfo((prev) => ({
                    ...prev,
                    dia_chi: e.target.value,
                  }))
                }
              />
            </div>
          </div>
        </div>
      )}
      <div style={{ borderBottom: "1px solid #ccc", margin: "16px 0" }}></div>
      <p className="payment-text">
        <strong>Hình thức thanh toán:</strong>
      </p>
      <div className="payment-methods">
        {["tien_mat", "chuyen_khoan"].map((method) => (
          <div
            key={method}
            className={`payment-option ${
              selectedPayments.includes(method) ? "selected" : ""
            }`}
            onClick={() => handlePaymentSelection(method)}
          >
            {method === "tien_mat" ? "Tiền mặt" : "Chuyển khoản"}
          </div>
        ))}
      </div>

      {showQRCode && (
        <div className="qr-code-container">
          <p className="payment-text">
            <strong>Quét mã QR để thanh toán:</strong>
          </p>
          <img src={qrUrl} alt="QR Code" className="qr-code-image" />
          <div className="qr-info">
            {accountName?.split(" - ").map((line, index) => (
              <div key={index} className="qr-info-line">
                {line.trim()}
              </div>
            ))}
            <div className="qr-info-line">{account}</div>
            <div className="qr-info-line">Số tiền: {formatCurrency(total)}</div>
          </div>
        </div>
      )}

      {!showQRCode && (
        <>
          <p className="payment-text">
            <strong>Nhập số tiền:</strong>
          </p>
          {selectedPayments.map((method) => (
            <div key={method} className="payment-amount-container">
              <span>{method === "tien_mat" ? "Tiền mặt" : "Chuyển khoản"}</span>
              <InputNumber
                value={paymentAmounts[method] || 0}
                onChange={(value) => handleAmountChange(method, value)}
                className="payment-input"
                style={{ width: 120 }}
                controls={false}
                min="0"
                formatter={(value) => (value ? formatNumber(value) : "")}
                parser={(value) => (value ? parserNumber(value) : 0)}
                onKeyDownCapture={(event) => {
                  if (
                    !/[0-9]/.test(event.key) &&
                    ![8, 46, 37, 38, 39, 40].includes(event.keyCode)
                  ) {
                    event.preventDefault();
                  }
                }}
              />
            </div>
          ))}
        </>
      )}

      <div className="payment-divider"></div>

      <div className="payment-summary">
        <span>Trả lại:</span>
        <strong style={{ color: change < 0 ? "red" : "black" }}>
          {formatCurrency(change)}
        </strong>
      </div>

      <div className="w-full text-right">
        <p>{num2words(change)}</p>
      </div>

      <div className="payment-footer">
        <Button
          key="cancel"
          onClick={handleClose}
          className="payment-button secondary"
        >
          Huỷ
        </Button>
        <Button
          key="pay"
          type="primary"
          onClick={() => {
            // Nếu tên khách trống thì set mặc định là "KH CĂNG TIN"
            const finalCustomerInfo = {
              ...customerInfo,
              ong_ba: customerInfo.ong_ba?.trim() || "KH CĂNG TIN",
            };
            onConfirm(selectedPayments, paymentAmounts, finalCustomerInfo);
          }}
          className="payment-button primary"
          disabled={
            selectedPayments.length === 0 ||
            Object.values(paymentAmounts).reduce((sum, val) => sum + val, 0) <
              total
          }
        >
          Thanh toán
        </Button>
      </div>
    </Modal>
  );
};

export default PaymentModal;
