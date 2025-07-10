import { DownOutlined, UpOutlined } from "@ant-design/icons";
import { Button, Checkbox, Input, InputNumber, Modal, message } from "antd";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  formatCurrency,
  formatNumber,
  parserNumber,
} from "../../../../../app/hook/dataFormatHelper";
import { num2words } from "../../../../../app/Options/DataFomater";
import "./PaymentModal.css";

const PaymentModal = ({
  visible,
  onClose,
  onConfirm,
  total,
  isCreatingOrder,
  initialPaymentMethod,
  initialPaymentAmounts,
  initialCustomerInfo,
  initialSync,
}) => {
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
    ma_so_thue_kh: "",
    ten_dv_kh: "",
  });
  const [errors, setErrors] = useState({
    cccd: "",
    so_dt: "",
    ma_so_thue_kh: "",
  });
  const [showCustomerInfo, setShowCustomerInfo] = useState(false);
  const [showQRImage, setShowQRImage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sync, setSync] = useState(true);

  const handleToggleCustomerInfo = useCallback(
    () => setShowCustomerInfo((prev) => !prev),
    []
  );

  const showQRCode = useMemo(
    () =>
      selectedPayments.length === 1 &&
      selectedPayments.includes("chuyen_khoan"),
    [selectedPayments]
  );

  // Memoize account info
  const account = useMemo(
    () => process.env.REACT_APP_VIETQR_ACCOUNT || "970416-123456789",
    []
  );
  const accountName = useMemo(
    () => process.env.REACT_APP_VIETQR_ACCOUNT_NAME || "Phenikaa",
    []
  );

  // Tối ưu QR URL - loại bỏ timestamp, thêm caching
  const qrUrl = useMemo(() => {
    if (!showQRCode || !total || !account) {
      return "";
    }

    const transferContent = `thanh toan Phenikaa : ${formatCurrency(total)}vnd`;
    const url = `https://img.vietqr.io/image/${account}-qr_only.png?amount=${total}&addInfo=${encodeURIComponent(
      transferContent
    )}`;

    return url;
  }, [account, total, showQRCode]);

  // QR Error handling
  const [qrError, setQrError] = useState(false);
  const [qrLoaded, setQrLoaded] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  const handleQRLoad = useCallback(() => {
    setQrLoaded(true);
    setQrError(false);
  }, []);

  const handleQRError = useCallback(() => {
    setQrError(true);
    setQrLoaded(false);
    message.error("Không thể tải mã QR. Vui lòng thử lại!");
  }, []);

  // Simple retry function
  const handleRetryQR = useCallback(() => {
    setIsRetrying(true);
    setQrError(false);
    setQrLoaded(false);

    // Reset QR image để force reload
    setShowQRImage(false);

    setTimeout(() => {
      setShowQRImage(true);
      setIsRetrying(false);
    }, 500);
  }, []);

  // Reset QR state khi URL thay đổi
  useEffect(() => {
    setQrError(false);
    setQrLoaded(false);
  }, [qrUrl]);

  // Preload QR khi modal mở và chọn chuyển khoản
  useEffect(() => {
    if (visible && showQRCode && qrUrl && !qrLoaded && !qrError) {
      // Preload image để cache
      const preloadImg = new Image();
      preloadImg.onload = () => {
        // QR preloaded successfully
      };
      preloadImg.onerror = () => {
        // QR preload failed
      };
      preloadImg.src = qrUrl;
    }
  }, [visible, showQRCode, qrUrl, qrLoaded, qrError]);

  const handlePaymentSelection = (method) => {
    setSelectedPayments((prev) => {
      const newSelectedPayments = prev.includes(method)
        ? prev.filter((item) => item !== method)
        : [...prev, method];

      setPaymentAmounts((amounts) => {
        const updatedAmounts = { ...amounts };

        if (!newSelectedPayments.includes("tien_mat")) {
          updatedAmounts["tien_mat"] = 0;
        }
        if (!newSelectedPayments.includes("chuyen_khoan")) {
          updatedAmounts["chuyen_khoan"] = 0;
        }

        if (
          newSelectedPayments.length === 1 &&
          newSelectedPayments.includes("chuyen_khoan")
        ) {
          updatedAmounts["chuyen_khoan"] = total;
        }

        if (
          newSelectedPayments.length === 1 &&
          newSelectedPayments.includes("tien_mat")
        ) {
          updatedAmounts["tien_mat"] = total;
        }

        if (
          newSelectedPayments.includes("tien_mat") &&
          newSelectedPayments.includes("chuyen_khoan")
        ) {
          updatedAmounts["tien_mat"] = 0;
          updatedAmounts["chuyen_khoan"] = 0;
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

  const validateCCCD = (value) => {
    if (!value) return "";
    if (!/^\d{9}$|^\d{12}$/.test(value)) {
      return "CCCD phải có 9 hoặc 12 số";
    }
    return "";
  };

  const validatePhoneNumber = (value) => {
    if (!value) return "";
    if (!/^(0|\+84)[3|5|7|8|9][0-9]{8}$/.test(value)) {
      return "Số điện thoại phải có 10 số và bắt đầu bằng 0";
    }
    return "";
  };

  const validateMaSoThue = (value) => {
    if (!value) return "";
    if (!/^\d{10}(-\d{3})?$/.test(value)) {
      return "Mã số thuế phải có 10 số hoặc 10-3 số";
    }
    return "";
  };

  const handleInputChange = (field, value) => {
    // Chỉ cho phép nhập số cho các trường cần validate
    if (field === "cccd" || field === "so_dt") {
      // Chỉ cho phép nhập số
      if (value !== "" && !/^\d*$/.test(value)) {
        return;
      }
    } else if (field === "ma_so_thue_kh") {
      // Cho phép số và dấu gạch ngang cho mã số thuế
      if (value !== "" && !/^[\d-]*$/.test(value)) {
        return;
      }
    }

    setCustomerInfo((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (field === "cccd") {
      setErrors((prev) => ({
        ...prev,
        cccd: validateCCCD(value),
      }));
    } else if (field === "so_dt") {
      setErrors((prev) => ({
        ...prev,
        so_dt: validatePhoneNumber(value),
      }));
    } else if (field === "ma_so_thue_kh") {
      setErrors((prev) => ({
        ...prev,
        ma_so_thue_kh: validateMaSoThue(value),
      }));
    }
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
      ma_so_thue_kh: "",
      ten_dv_kh: "",
    });
    setErrors({
      cccd: "",
      so_dt: "",
      ma_so_thue_kh: "",
    });
    setShowCustomerInfo(false);
    setShowQRImage(false);
    setIsSubmitting(false);
    setSync(true);
    onClose();
  };

  useEffect(() => {
    if (visible) {
      // Parse initialPaymentMethod - có thể là "chuyen_khoan" hoặc "tien_mat,chuyen_khoan"
      let defaultPayments = ["chuyen_khoan"];
      if (initialPaymentMethod) {
        defaultPayments = initialPaymentMethod
          .split(",")
          .map((method) => method.trim());
      }
      setSelectedPayments(defaultPayments);

      // Tính toán payment amounts dựa trên phương thức thanh toán
      const newPaymentAmounts = { tien_mat: 0, chuyen_khoan: 0 };

      // Nếu có initialPaymentAmounts từ order đã lưu, sử dụng nó
      if (
        initialPaymentAmounts &&
        (initialPaymentAmounts.tien_mat > 0 ||
          initialPaymentAmounts.chuyen_khoan > 0)
      ) {
        newPaymentAmounts.tien_mat = Number(
          initialPaymentAmounts.tien_mat || 0
        );
        newPaymentAmounts.chuyen_khoan = Number(
          initialPaymentAmounts.chuyen_khoan || 0
        );
      } else {
        // Nếu không, tính toán dựa trên phương thức thanh toán
        if (defaultPayments.length === 1) {
          if (defaultPayments[0] === "tien_mat") {
            newPaymentAmounts.tien_mat = total;
          } else {
            newPaymentAmounts.chuyen_khoan = total;
          }
        } else if (defaultPayments.length === 2) {
          // Nếu có 2 phương thức thanh toán, mặc định chia đều hoặc reset về 0
          newPaymentAmounts.tien_mat = 0;
          newPaymentAmounts.chuyen_khoan = 0;
        }
      }

      setPaymentAmounts(newPaymentAmounts);

      // Tính toán change amount
      const totalPaid =
        newPaymentAmounts.tien_mat + newPaymentAmounts.chuyen_khoan;
      setChange(totalPaid - total);

      setCustomerInfo({
        ong_ba: initialCustomerInfo?.ong_ba || "",
        cccd: initialCustomerInfo?.cccd || "",
        dia_chi: initialCustomerInfo?.dia_chi || "",
        so_dt: initialCustomerInfo?.so_dt || "",
        email: initialCustomerInfo?.email || "",
        ma_so_thue_kh: initialCustomerInfo?.ma_so_thue_kh || "",
        ten_dv_kh: initialCustomerInfo?.ten_dv_kh || "",
      });
      setErrors({
        cccd: "",
        so_dt: "",
        ma_so_thue_kh: "",
      });
      setShowCustomerInfo(false);
      setShowQRImage(false);
      setIsSubmitting(false);
      setSync(initialSync !== undefined ? initialSync : true);

      const timer = setTimeout(() => {
        setShowQRImage(true);
      }, 200);

      return () => clearTimeout(timer);
    }
  }, [
    visible,
    total,
    initialPaymentMethod,
    initialPaymentAmounts,
    initialCustomerInfo,
    initialSync,
  ]);

  return (
    <Modal
      title={<p className="payment-title">Phiếu thanh toán</p>}
      open={visible}
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
                  onChange={(e) => handleInputChange("ong_ba", e.target.value)}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontWeight: 500 }}>CCCD:</label>
                <Input
                  style={{ width: "100%", marginTop: 4 }}
                  value={customerInfo.cccd}
                  placeholder="Nhập số CCCD"
                  onChange={(e) => handleInputChange("cccd", e.target.value)}
                  status={errors.cccd ? "error" : ""}
                  maxLength={12}
                  onKeyPress={(e) => {
                    if (!/\d/.test(e.key)) {
                      e.preventDefault();
                    }
                  }}
                />
                {errors.cccd && (
                  <div style={{ color: "red", fontSize: 12 }}>
                    {errors.cccd}
                  </div>
                )}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontWeight: 500 }}>Mã số thuế:</label>
                <Input
                  style={{ width: "100%", marginTop: 4 }}
                  value={customerInfo.ma_so_thue_kh}
                  placeholder="Nhập mã số thuế"
                  onChange={(e) =>
                    handleInputChange("ma_so_thue_kh", e.target.value)
                  }
                  status={errors.ma_so_thue_kh ? "error" : ""}
                  maxLength={14}
                  onKeyPress={(e) => {
                    if (!/[\d-]/.test(e.key)) {
                      e.preventDefault();
                    }
                  }}
                />
                {errors.ma_so_thue_kh && (
                  <div style={{ color: "red", fontSize: 12 }}>
                    {errors.ma_so_thue_kh}
                  </div>
                )}
                {customerInfo.ma_so_thue_kh && (
                  <div style={{ marginTop: 8 }}>
                    <label style={{ fontWeight: 500 }}>Tên công ty:</label>
                    <Input
                      style={{ width: "100%", marginTop: 4 }}
                      value={customerInfo.ten_dv_kh}
                      placeholder="Nhập tên công ty"
                      onChange={(e) =>
                        handleInputChange("ten_dv_kh", e.target.value)
                      }
                    />
                  </div>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontWeight: 500 }}>Địa chỉ:</label>
                <Input
                  style={{ width: "100%", marginTop: 4 }}
                  value={customerInfo.dia_chi}
                  placeholder="Nhập địa chỉ"
                  onChange={(e) => handleInputChange("dia_chi", e.target.value)}
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
                  onChange={(e) => handleInputChange("so_dt", e.target.value)}
                  status={errors.so_dt ? "error" : ""}
                  maxLength={12}
                  onKeyPress={(e) => {
                    if (!/[\d+]/.test(e.key)) {
                      e.preventDefault();
                    }
                  }}
                />
                {errors.so_dt && (
                  <div style={{ color: "red", fontSize: 12 }}>
                    {errors.so_dt}
                  </div>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontWeight: 500 }}>Email:</label>
                <Input
                  style={{ width: "100%", marginTop: 4 }}
                  value={customerInfo.email}
                  placeholder="Nhập email"
                  type="email"
                  onChange={(e) => handleInputChange("email", e.target.value)}
                />
              </div>
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

      <div style={{ margin: "16px 0" }}>
        <p className="payment-text">
          <strong>Đồng bộ:</strong>
        </p>
        <Checkbox
          checked={sync}
          onChange={(e) => setSync(e.target.checked)}
          style={{ marginLeft: "8px" }}
        >
          Đồng bộ
        </Checkbox>
      </div>

      {showQRCode && (
        <div className="qr-code-container">
          <p className="payment-text">
            <strong>Quét mã QR để thanh toán:</strong>
          </p>

          {qrError ? (
            <div
              className="qr-error"
              style={{
                textAlign: "center",
                padding: "20px",
                backgroundColor: "#ffebee",
                border: "1px solid #ffcdd2",
                borderRadius: "8px",
                color: "#d32f2f",
              }}
            >
              ❌ Lỗi tải QR
              <br />
              <button
                onClick={handleRetryQR}
                disabled={isRetrying}
                style={{
                  marginTop: "8px",
                  padding: "6px 16px",
                  backgroundColor: "#1890ff",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "12px",
                }}
              >
                {isRetrying ? "🔄 Đang thử lại..." : "🔄 Thử lại"}
              </button>
            </div>
          ) : showQRImage ? (
            <img
              src={qrUrl}
              alt="QR Code thanh toán"
              className="qr-code-image"
              key={`qr-${total}`}
              onLoad={handleQRLoad}
              onError={handleQRError}
              style={{
                transition: "opacity 0.3s ease",
                opacity: qrLoaded ? 1 : 0.7,
              }}
            />
          ) : (
            <div
              className="qr-loading"
              style={{
                textAlign: "center",
                padding: "20px",
                backgroundColor: "#f5f5f5",
                borderRadius: "8px",
              }}
            >
              🔄 Chuẩn bị mã QR...
            </div>
          )}
          <div className="qr-info">
            {accountName?.split(" - ").map((line, index) => (
              <div key={index} className="qr-info-line">
                {line.trim()}
              </div>
            ))}
            <div className="qr-info-line">{account}</div>
            <div className="qr-info-line">
              Số tiền: {formatCurrency(total)}đ
            </div>
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
          disabled={isCreatingOrder || isSubmitting}
        >
          Huỷ
        </Button>
        <Button
          key="pay"
          type="primary"
          onClick={() => {
            // Kiểm tra lỗi trước khi thanh toán
            const hasErrors = Object.values(errors).some((error) => error);
            if (hasErrors) {
              message.error("Vui lòng kiểm tra lại thông tin khách hàng");
              return;
            }

            setIsSubmitting(true);

            const finalCustomerInfo = {
              ...customerInfo,
              ong_ba: customerInfo.ong_ba?.trim() || "",
            };

            const adjustedPaymentAmounts = { ...paymentAmounts };
            if (selectedPayments.includes("tien_mat")) {
              if (selectedPayments.length === 1) {
                adjustedPaymentAmounts.tien_mat = total;
              } else {
                adjustedPaymentAmounts.tien_mat =
                  total - (adjustedPaymentAmounts.chuyen_khoan || 0);
              }
            }

            onConfirm(
              selectedPayments,
              adjustedPaymentAmounts,
              finalCustomerInfo,
              sync
            );
          }}
          className="payment-button primary"
          disabled={
            isCreatingOrder ||
            isSubmitting ||
            selectedPayments.length === 0 ||
            (selectedPayments.length === 2
              ? Object.values(paymentAmounts).reduce(
                  (sum, val) => sum + val,
                  0
                ) !== total
              : Object.values(paymentAmounts).reduce(
                  (sum, val) => sum + val,
                  0
                ) < total)
          }
          loading={isCreatingOrder || isSubmitting}
        >
          Thanh toán
        </Button>
      </div>
    </Modal>
  );
};

export default PaymentModal;
