import { Button, Divider, InputNumber, Modal, Radio, Space } from "antd";
import React, { useMemo, useState } from "react";
// import VietQR from "../../../../../components/common/GenerateQR/VietQR";
import { formatCurrency } from "../../../pharmacy-utils/hook/dataFormatHelper";
import { num2words } from "../../../pharmacy-utils/Options/DataFomater";
import VietQR from "../GenerateQR/VietQR";

const prettyMoney = (v) => formatCurrency(v || 0, 0);

const numberToVietnameseWords = (num) => {
  if (num === null || num === undefined || isNaN(num) || num === 0) {
    return "Không";
  }
  return num2words(Math.floor(Number(num)));
};

const PaymentModal = ({
  open,
  onClose,
  onConfirm,
  total,
  change,
  payment,
  setPayment,
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
  const [multiCash, setMultiCash] = useState(0);
  const [multiTransfer, setMultiTransfer] = useState(0);

  // Reset multi payment when method changes
  React.useEffect(() => {
    if (payment.method !== "multi") {
      setMultiCash(0);
      setMultiTransfer(0);
    }
  }, [payment.method]);

  const lack = Math.max(0, total - (payment.cash || 0));
  const multiTotal = useMemo(
    () => multiCash + multiTransfer,
    [multiCash, multiTransfer]
  );
  const multiRemaining = Math.max(0, total - multiTotal);
  const multiChange = Math.max(0, multiTotal - total);

  return (
    <Modal
      title="Phiếu thanh toán"
      open={open}
      onCancel={onClose}
      footer={null}
      width={480}
      destroyOnClose
      maskClosable={false}
      styles={{
        header: { borderBottom: "none", paddingBottom: 0 },
        body: { paddingTop: 8 },
      }}
    >
      <div style={{ marginBottom: 16 }}>
        <div style={{ marginBottom: 8, fontWeight: 600, color: "#262626" }}>
          Hình thức thanh toán:
        </div>
        <Radio.Group
          value={payment.method}
          onChange={(e) => setPayment({ ...payment, method: e.target.value })}
          buttonStyle="solid"
          size="middle"
        >
          <Radio.Button value="transfer">Chuyển khoản</Radio.Button>
          <Radio.Button value="cash">Tiền mặt</Radio.Button>
          <Radio.Button value="multi">Đa phương thức</Radio.Button>
        </Radio.Group>
      </div>

      {payment.method === "transfer" && (
        <div
          style={{
            display: "grid",
            gap: 12,
            background: "#eef4ff",
            border: "1px solid #d6e4ff",
            borderRadius: 10,
            padding: 16,
          }}
        >
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <div
              style={{
                display: "flex",
                gap: 20,
                alignItems: "flex-start",
                background: "#fafafa",
                borderRadius: 12,
                padding: 16,
                border: "1px solid #e8e8e8",
              }}
            >
              {/* Left Section - QR Code */}
              <div
                style={{
                  background: "#fff",
                  padding: 12,
                  borderRadius: 8,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                  border: "1px solid #f0f0f0",
                  flexShrink: 0,
                }}
              >
                <VietQR amount={total} soChungTu={""} size={150} />
              </div>

              {/* Right Section - Payment Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontWeight: 600,
                    marginBottom: 12,
                    fontSize: 15,
                    color: "#1a1a1a",
                    lineHeight: 1.4,
                  }}
                >
                  Quét mã QR để thanh toán
                </div>
                <div
                  style={{
                    background: "#fff",
                    borderRadius: 8,
                    border: "1px solid #e6e6e6",
                    padding: 12,
                    boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
                  }}
                >
                  <div
                    style={{
                      color: "#1a1a1a",
                      fontSize: 14,
                      marginBottom: 6,
                      fontWeight: 600,
                    }}
                  >
                    {process.env.REACT_APP_VIETQR_ACCOUNT_NAME ||
                      "DANG HUU DAT"}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "#666",
                      marginBottom: 8,
                      lineHeight: 1.3,
                    }}
                  >
                    STK: {process.env.REACT_APP_VIETQR_ACCOUNT || "03775720401"}
                  </div>

                  <Divider
                    style={{ margin: "8px 0", borderColor: "#f0f0f0" }}
                  />
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: 15,
                      color: "#1a1a1a",
                      lineHeight: 1.4,
                    }}
                  >
                    Số tiền: {prettyMoney(total)}₫
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {payment.method === "cash" && (
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ display: "grid", gap: 8 }}>
            <InputNumber
              min={0}
              value={payment.cash}
              formatter={(val) =>
                `${Number(val || 0).toLocaleString("vi-VN")}đ`
              }
              parser={(val) => Number((val || "").replace(/\D/g, ""))}
              onChange={(v) => setPayment({ ...payment, cash: v || 0 })}
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
                      setPayment({ ...payment, cash: (payment.cash || 0) + m })
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
                  onClick={() => setPayment({ ...payment, cash: total })}
                >
                  Đủ tiền
                </Button>
                <Button
                  onClick={() => setPayment({ ...payment, cash: 0 })}
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
                      lack > 0 ? "#ff4d4f" : change > 0 ? "#52c41a" : "#262626",
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

      {payment.method === "multi" && (
        <div style={{ display: "grid", gap: 12 }}>
          <div>
            <div style={{ marginBottom: 8, fontWeight: 600, fontSize: 14 }}>
              Nhập số tiền:
            </div>
            <div style={{ display: "grid", gap: 8 }}>
              <div>
                <div style={{ marginBottom: 4, fontWeight: 500, fontSize: 13 }}>
                  Tiền mặt:
                </div>
                <InputNumber
                  min={0}
                  value={multiCash}
                  onChange={setMultiCash}
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
                <div style={{ marginBottom: 4, fontWeight: 500, fontSize: 13 }}>
                  Chuyển khoản:
                </div>
                <InputNumber
                  min={0}
                  value={multiTransfer}
                  onChange={setMultiTransfer}
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
          <Button
            type="primary"
            size="middle"
            style={{
              minWidth: 120,
              background: "#16a34a",
              borderColor: "#16a34a",
            }}
            onClick={onConfirm}
            disabled={payment.method === "multi" && multiRemaining > 0}
          >
            Thanh toán
          </Button>
        </Space>
      </div>
    </Modal>
  );
};

export default PaymentModal;
