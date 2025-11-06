import {
  Button,
  Divider,
  InputNumber,
  Modal,
  Radio,
  Space,
  Tooltip,
} from "antd";
import React, { useMemo, useRef, useState } from "react";
import { useReactToPrint } from "react-to-print";
// import VietQR from "../../../../../components/common/GenerateQR/VietQR";
import { formatCurrency } from "../../../pharmacy-utils/hook/dataFormatHelper";
import { num2words } from "../../../pharmacy-utils/Options/DataFomater";
import VietQR from "../GenerateQR/VietQR";
import PrintComponent from "./PrintComponent/PrintComponent";

const prettyMoney = (v) => formatCurrency(v || 0, 0);

const numberToVietnameseWords = (num) => {
  try {
    // Kiểm tra null/undefined
    if (num === null || num === undefined) {
      return "Không";
    }
    
    // Chuyển đổi sang số
    const numValue = Number(num);
    
    // Kiểm tra NaN hoặc Infinity
    if (isNaN(numValue) || !isFinite(numValue)) {
      return "Không";
    }
    
    // Lấy giá trị tuyệt đối và làm tròn xuống (đảm bảo là integer)
    const absValue = Math.abs(Math.floor(Math.round(numValue)));
    
    // Nếu bằng 0 thì trả về "Không"
    if (absValue === 0) {
      return "Không";
    }
    
    // Kiểm tra số quá lớn (giới hạn của thư viện read-vietnamese-number)
    if (absValue > 999999999999) {
      return "Số quá lớn";
    }
    
    // Truyền số nguyên dương vào num2words
    // num2words sẽ tự xử lý việc convert sang string cho thư viện
    const result = num2words(absValue);
    
    // Nếu num2words trả về lỗi, hiển thị lỗi thực tế
    if (result === "Lỗi đọc số" || result === "Định dạng input không hợp lệ" || result === "Số không hợp lệ") {
      console.error("num2words failed. Value:", absValue, "Type:", typeof absValue);
      return result;
    }
    
    return result;
  } catch (error) {
    console.error("Error converting number to words:", error, "Input:", num);
    return "Không";
  }
};

const PaymentModal = ({
  visible,
  onClose,
  onConfirm,
  total,
  cart = [],
  isCreatingOrder = false,
  initialPaymentMethod = "cash",
  initialPaymentAmounts = { tien_mat: 0, chuyen_khoan: 0 },
  initialCustomerInfo = {},
  initialSync = true,
  merchant = {
    name: process.env.REACT_APP_VIETQR_ACCOUNT_NAME,
    bankBin: process.env.REACT_APP_VIETQR_BANK_ID,
    account: process.env.REACT_APP_VIETQR_ACCOUNT,
  },
}) => {
  const quickCash = useMemo(
    () => [1000, 2000, 5000, 10000, 20000, 100000, 200000, 500000],
    []
  );

  // Local state for payment
  const [paymentMethod, setPaymentMethod] = useState(initialPaymentMethod);
  const [paymentAmounts, setPaymentAmounts] = useState(initialPaymentAmounts);
  const [customerInfo, setCustomerInfo] = useState(initialCustomerInfo);
  const [sync, setSync] = useState(initialSync);

  const [multiCash, setMultiCash] = useState(0);
  const [multiTransfer, setMultiTransfer] = useState(0);
  const [multiDriver, setMultiDriver] = useState(null); // 'cash' | 'transfer' | null
  const printContent = useRef();
  const prevPaymentMethodRef = useRef(paymentMethod);
  const prevVisibleRef = useRef(visible);

  // Reset data when modal closes
  React.useEffect(() => {
    if (!visible) {
      setPaymentMethod("cash");
      setPaymentAmounts({ tien_mat: 0, chuyen_khoan: 0 });
      setCustomerInfo({});
      setSync(true);
      setMultiCash(0);
      setMultiTransfer(0);
      setMultiDriver(null);
    }
  }, [visible]);

  // Đồng bộ paymentMethod với initialPaymentMethod khi modal mở hoặc initialPaymentMethod thay đổi
  React.useEffect(() => {
    if (visible) {
      setPaymentMethod(initialPaymentMethod);
      prevPaymentMethodRef.current = initialPaymentMethod;
    }
  }, [visible, initialPaymentMethod]);

  // Tự động fill tiền mặt = total khi chọn phương thức "cash"
  React.useEffect(() => {
    if (visible && paymentMethod === "cash") {
      // Fill khi vừa chuyển sang "cash" hoặc khi modal vừa mở với phương thức "cash"
      const justSwitchedToCash = prevPaymentMethodRef.current !== "cash" && paymentMethod === "cash";
      const justOpenedWithCash = !prevVisibleRef.current && visible && paymentMethod === "cash";
      
      if (justSwitchedToCash || justOpenedWithCash) {
        const safeTotal = Math.round(Number(total) || 0);
        setPaymentAmounts((prev) => ({ ...prev, tien_mat: safeTotal }));
      }
      prevPaymentMethodRef.current = paymentMethod;
    } else {
      prevPaymentMethodRef.current = paymentMethod;
    }
    prevVisibleRef.current = visible;
  }, [visible, paymentMethod, total]);

  // Reset multi payment when method changes
  React.useEffect(() => {
    if (paymentMethod !== "multi") {
      setMultiCash(0);
      setMultiTransfer(0);
      setMultiDriver(null);
    }
  }, [paymentMethod]);

  // Đảm bảo total và paymentAmounts là số hợp lệ (làm tròn về số nguyên)
  const safeTotal = Math.round(Number(total) || 0);
  const safeTienMat = Math.round(Number(paymentAmounts?.tien_mat) || 0);
  const lack = Math.max(0, Math.round(safeTotal - safeTienMat));
  const change = Math.max(0, Math.round(safeTienMat - safeTotal));
  
  const multiTotal = useMemo(
    () => Math.round((Number(multiCash) || 0) + (Number(multiTransfer) || 0)),
    [multiCash, multiTransfer]
  );
  const multiRemaining = Math.max(0, Math.round(safeTotal - multiTotal));
  const multiChange = Math.max(0, Math.round(multiTotal - safeTotal));

  // Prepare print data theo mẫu Phenika
  const preparePrintData = () => {
    const now = new Date();
    const orderNumber = `POS${now.getTime()}`;

    // Tính toán số tiền theo từng phương thức
    let tienMat = 0;
    let chuyenKhoan = 0;
    let httt = "";

    if (paymentMethod === "cash") {
      tienMat = paymentAmounts.tien_mat || 0;
      httt = "tien_mat";
    } else if (paymentMethod === "transfer") {
      chuyenKhoan = total;
      httt = "chuyen_khoan";
    } else if (paymentMethod === "multi") {
      tienMat = multiCash || 0;
      chuyenKhoan = multiTransfer || 0;
      httt = "tien_mat,chuyen_khoan";
    }

    const master = {
      ong_ba: customerInfo?.ong_ba || "Khách hàng",
      ma_so_thue_kh: customerInfo?.ma_so_thue_kh || "",
      ten_dv_kh: customerInfo?.ten_dv_kh || "",
      ma_ban: "", // Bỏ trường bàn
      httt: httt,
      tong_tien: total,
      tien_mat: tienMat,
      chuyen_khoan: chuyenKhoan,
    };

    const detail = cart.map((item, index) => ({
      ten_vt: item.name,
      so_luong: item.qty,
      don_gia: item.price,
      thanh_tien: item.price * item.qty,
      ghi_chu: "",
      ma_vt_root: null,
      ma_vt: item.sku,
      uniqueid: `item_${Date.now()}_${index}`,
    }));

    return { master, detail, orderNumber };
  };

  const handlePrint = useReactToPrint({
    content: () => printContent.current,
    documentTitle: "Hóa đơn Phenikaa",
    copyStyles: false,
  });

  const handleConfirmWithPrint = async () => {
    try {
      // Chuẩn bị thông tin thanh toán theo phương thức
      let paymentMethods = [];
      let paymentAmountsData = {};

      if (paymentMethod === "cash") {
        paymentMethods = ["tien_mat"];
        paymentAmountsData = {
          tien_mat: paymentAmounts.tien_mat || 0,
          chuyen_khoan: 0,
        };
      } else if (paymentMethod === "transfer") {
        paymentMethods = ["chuyen_khoan"];
        paymentAmountsData = { tien_mat: 0, chuyen_khoan: total };
      } else if (paymentMethod === "multi") {
        paymentMethods = ["tien_mat", "chuyen_khoan"];
        paymentAmountsData = {
          tien_mat: multiCash || 0,
          chuyen_khoan: multiTransfer || 0,
        };
      }

      // Call the original onConfirm function
      const success = await onConfirm(
        paymentMethods,
        paymentAmountsData,
        customerInfo,
        sync
      );

      // Print the receipt only if payment was successful
      if (success) {
        // Reset all payment data
        setPaymentMethod("cash");
        setPaymentAmounts({ tien_mat: 0, chuyen_khoan: 0 });
        setCustomerInfo({});
        setSync(true);
        setMultiCash(0);
        setMultiTransfer(0);

        setTimeout(() => {
          handlePrint();
        }, 500);
      }
    } catch (error) {
      console.error("Error in payment confirmation:", error);
    }
  };

  return (
    <>
      <Modal
        title="Thanh toán"
        open={visible}
        onCancel={onClose}
        footer={null}
        width={600}
        centered
        destroyOnHidden
      >
        <div style={{ marginBottom: 16 }}>
          <div style={{ marginBottom: 8, fontWeight: 600, color: "#262626" }}>
            Hình thức thanh toán:
          </div>
          <Radio.Group
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            buttonStyle="solid"
            size="middle"
          >
            <Radio.Button value="transfer">Chuyển khoản</Radio.Button>
            <Radio.Button value="cash">Tiền mặt</Radio.Button>
            <Radio.Button value="multi">Đa phương thức</Radio.Button>
          </Radio.Group>
        </div>

        {paymentMethod === "transfer" && (
          <div
            style={{
              background: "linear-gradient(135deg, #f8faff 0%, #eef4ff 100%)",
              border: "1px solid #d6e4ff",
              borderRadius: 12,
              padding: 20,
            }}
          >
            <div
              style={{
                display: "flex",
                gap: 24,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {/* Left Section - QR Code */}
              <div
                style={{
                  background: "#fff",
                  padding: 20,
                  borderRadius: 12,
                  boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
                  border: "1px solid #e8f4ff",
                  flexShrink: 0,
                }}
              >
                <VietQR amount={total} soChungTu={""} size={160} />
              </div>

              {/* Right Section - Payment Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontWeight: 700,
                    marginBottom: 16,
                    fontSize: 16,
                    color: "#1a1a1a",
                    lineHeight: 1.4,
                    textAlign: "center",
                  }}
                >
                  Quét mã QR để thanh toán
                </div>
                <div
                  style={{
                    background: "#fff",
                    borderRadius: 10,
                    border: "1px solid #e6e6e6",
                    padding: 16,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                  }}
                >
                  <div
                    style={{
                      color: "#1a1a1a",
                      fontSize: 16,
                      marginBottom: 8,
                      fontWeight: 700,
                      textAlign: "center",
                    }}
                  >
                    {process.env.REACT_APP_VIETQR_ACCOUNT_NAME ||
                      "DANG HUU DAT"}
                  </div>
                  <div
                    style={{
                      fontSize: 14,
                      color: "#666",
                      marginBottom: 12,
                      lineHeight: 1.4,
                      textAlign: "center",
                    }}
                  >
                    STK: {process.env.REACT_APP_VIETQR_ACCOUNT || "03775720401"}
                  </div>

                  <Divider
                    style={{ margin: "12px 0", borderColor: "#f0f0f0" }}
                  />
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: 16,
                      color: "#1890ff",
                      lineHeight: 1.4,
                      textAlign: "center",
                    }}
                  >
                    Số tiền: {prettyMoney(total)}₫
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {paymentMethod === "cash" && (
          <div style={{ display: "grid", gap: 12 }}>
            <div style={{ display: "grid", gap: 8 }}>
              <InputNumber
                min={0}
                value={paymentAmounts.tien_mat}
                formatter={(val) =>
                  `${Number(val || 0).toLocaleString("vi-VN")}đ`
                }
                parser={(val) => Number((val || "").replace(/\D/g, ""))}
                onChange={(v) =>
                  setPaymentAmounts({ ...paymentAmounts, tien_mat: v || 0 })
                }
                placeholder="Khách đưa"
                style={{ width: "100%" }}
                size="large"
                controls={false}
              />

              <div style={{ display: "grid", gap: 6 }}>
                <div style={{ color: "#8c8c8c", fontSize: 13 }}>Gợi ý:</div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: 6,
                  }}
                >
                  {quickCash.map((m) => (
                    <Button
                      key={m}
                      size="small"
                      onClick={() =>
                        setPaymentAmounts({
                          ...paymentAmounts,
                          tien_mat: (paymentAmounts.tien_mat || 0) + m,
                        })
                      }
                    >
                      +{prettyMoney(m)}
                    </Button>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <Button
                    type="dashed"
                    style={{ flex: 1 }}
                    size="small"
                    onClick={() =>
                      setPaymentAmounts({ ...paymentAmounts, tien_mat: total })
                    }
                  >
                    Đủ tiền
                  </Button>
                  <Button
                    onClick={() =>
                      setPaymentAmounts({ ...paymentAmounts, tien_mat: 0 })
                    }
                    style={{ width: 70 }}
                    size="small"
                  >
                    Xóa
                  </Button>
                </div>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "10px 12px",
                background: "#f5f5f5",
                borderRadius: 6,
                border: "1px solid #d9d9d9",
              }}
            >
              <span style={{ fontWeight: 500, color: "#262626", fontSize: 13 }}>
                Tiền thừa/Thiếu
              </span>
              <div
                style={{
                  background: "#fff",
                  border: "1px solid #d9d9d9",
                  borderRadius: 4,
                  padding: "4px 8px",
                  minWidth: 60,
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      fontWeight: 700,
                      fontSize: 13,
                      color:
                        lack > 0
                          ? "#ff4d4f"
                          : change > 0
                          ? "#52c41a"
                          : "#262626",
                    }}
                  >
                    {lack > 0
                      ? `-${prettyMoney(lack)}đ`
                      : change > 0
                      ? `+${prettyMoney(change)}đ`
                      : "0đ"}
                  </span>
                  <span style={{ fontSize: 11, color: "#666", marginTop: 2 }}>
                    {lack > 0
                      ? numberToVietnameseWords(lack)
                      : change > 0
                      ? numberToVietnameseWords(change)
                      : "Không"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {paymentMethod === "multi" && (
          <div style={{ display: "grid", gap: 12 }}>
            <div>
              <div style={{ marginBottom: 8, fontWeight: 600, fontSize: 14 }}>
                Nhập số tiền:
              </div>
              <div style={{ display: "grid", gap: 8 }}>
                <div>
                  <div
                    style={{ marginBottom: 4, fontWeight: 500, fontSize: 13 }}
                  >
                    Tiền mặt:
                  </div>
                  <InputNumber
                    min={0}
                    value={multiCash}
                    onChange={(value) => {
                      const cashValue = Math.round(Number(value) || 0);
                      const safeTotal = Math.round(Number(total) || 0);
                      if (!multiDriver) {
                        setMultiDriver("cash");
                        const transferValue = Math.max(0, safeTotal - cashValue);
                        setMultiCash(cashValue);
                        setMultiTransfer(transferValue);
                        return;
                      }
                      setMultiCash(cashValue);
                      if (multiDriver === "cash") {
                        const transferValue = Math.max(0, safeTotal - cashValue);
                        setMultiTransfer(transferValue);
                      }
                    }}
                    formatter={(val) =>
                      `${Number(val || 0).toLocaleString("vi-VN")}đ`
                    }
                    parser={(val) => Number((val || "").replace(/\D/g, ""))}
                    placeholder="0"
                    style={{ width: "100%" }}
                    size="middle"
                    controls={false}
                  />
                </div>
                <div>
                  <div
                    style={{ marginBottom: 4, fontWeight: 500, fontSize: 13 }}
                  >
                    Chuyển khoản:
                  </div>
                  <InputNumber
                    min={0}
                    value={multiTransfer}
                    onChange={(value) => {
                      const transferValue = Math.round(Number(value) || 0);
                      const safeTotal = Math.round(Number(total) || 0);
                      if (!multiDriver) {
                        setMultiDriver("transfer");
                        const cashValue = Math.max(0, safeTotal - transferValue);
                        setMultiTransfer(transferValue);
                        setMultiCash(cashValue);
                        return;
                      }
                      setMultiTransfer(transferValue);
                      if (multiDriver === "transfer") {
                        const cashValue = Math.max(0, safeTotal - transferValue);
                        setMultiCash(cashValue);
                      }
                    }}
                    formatter={(val) =>
                      `${Number(val || 0).toLocaleString("vi-VN")}đ`
                    }
                    parser={(val) => Number((val || "").replace(/\D/g, ""))}
                    placeholder="0"
                    style={{ width: "100%" }}
                    size="middle"
                    controls={false}
                  />
                </div>
              </div>
            </div>

            <Divider style={{ margin: "6px 0" }} />

            <div>
              <div style={{ marginBottom: 4, fontWeight: 500, fontSize: 13 }}>
                Tổng quan:
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                  padding: "8px 12px",
                  background: "#f8fafc",
                  borderRadius: 8,
                  border: "1px solid #e2e8f0",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span style={{ fontSize: 13, color: "#64748b" }}>
                    Tổng cần thanh toán:
                  </span>
                  <span
                    style={{ fontWeight: 600, fontSize: 14, color: "#1f2937" }}
                  >
                    {prettyMoney(total)}đ
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span style={{ fontSize: 13, color: "#64748b" }}>
                    Đã thanh toán:
                  </span>
                  <span
                    style={{ fontWeight: 600, fontSize: 14, color: "#059669" }}
                  >
                    {prettyMoney(multiTotal)}đ
                  </span>
                </div>
                <Divider style={{ margin: "4px 0" }} />
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span style={{ fontSize: 13, color: "#64748b" }}>
                    {multiChange > 0 ? "Trả lại:" : "Còn thiếu:"}
                  </span>
                  <span
                    style={{
                      fontWeight: 600,
                      fontSize: 14,
                      color: multiChange > 0 ? "#059669" : "#dc2626",
                    }}
                  >
                    {multiChange > 0
                      ? `+${prettyMoney(multiChange)}đ`
                      : `${prettyMoney(multiRemaining)}đ`}
                  </span>
                </div>
                {multiChange > 0 && (
                  <div
                    style={{
                      fontSize: 12,
                      color: "#059669",
                      fontStyle: "italic",
                    }}
                  >
                    {numberToVietnameseWords(multiChange)}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            marginTop: 20,
            paddingTop: 12,
            borderTop: "1px solid #f0f0f0",
          }}
        >
          <Space>
            <Button onClick={onClose} size="middle">
              Hủy
            </Button>
            <Tooltip
              title={
                paymentMethod === "cash" && lack > 0
                  ? `Còn thiếu ${prettyMoney(lack)}đ để thanh toán`
                  : paymentMethod === "multi" && multiRemaining > 0
                  ? `Còn thiếu ${prettyMoney(multiRemaining)}đ để thanh toán`
                  : ""
              }
            >
              <Button
                type="primary"
                size="middle"
                style={{
                  minWidth: 120,
                  background: "#16a34a",
                  borderColor: "#16a34a",
                }}
                onClick={handleConfirmWithPrint}
                disabled={
                  (paymentMethod === "cash" && lack > 0) ||
                  (paymentMethod === "multi" && multiRemaining > 0)
                }
              >
                Thanh toán & In
              </Button>
            </Tooltip>
          </Space>
        </div>
      </Modal>

      {/* Hidden print component */}
      <div style={{ display: "none" }}>
        <PrintComponent
          ref={printContent}
          master={preparePrintData().master}
          detail={preparePrintData().detail}
          orderNumber={preparePrintData().orderNumber}
        />
      </div>
    </>
  );
};

export default PaymentModal;
