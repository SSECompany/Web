import { Button, Input, Modal } from "antd";
import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";

import { formatNumber } from "../../../../../app/hook/dataFormatHelper";
import { updateProductDiscount } from "../../../store/order";
import "./DiscountModal.css";

const DiscountModal = ({ isVisible, onClose, orderIndex, item }) => {
  const [discountPercent, setDiscountPercent] = useState("0");
  const [discountAmount, setDiscountAmount] = useState("0");
  const [discountAmountDisplay, setDiscountAmountDisplay] = useState("0");
  const [percentError, setPercentError] = useState("");
  const [amountError, setAmountError] = useState("");
  const [originalDiscountPercent, setOriginalDiscountPercent] = useState("0");
  const [originalDiscountAmount, setOriginalDiscountAmount] = useState("0");
  const dispatch = useDispatch();

  useEffect(() => {
    if (isVisible && item) {
      const currentPercent = item.tl_ck?.toString() || "0";
      const currentAmount = item.ck_nt?.toString() || "0";
      setDiscountPercent(currentPercent);
      setDiscountAmount(currentAmount);
      setDiscountAmountDisplay(currentAmount);
      setOriginalDiscountPercent(currentPercent);
      setOriginalDiscountAmount(currentAmount);
    }
  }, [isVisible, item]);

  const handleDiscountPercentChange = (value) => {
    const newPercent = value || "0";

    // Validation: Chỉ cho phép nhập số và dấu chấm
    const numericRegex = /^[0-9]*\.?[0-9]*$/;
    if (newPercent !== "" && !numericRegex.test(newPercent)) {
      setPercentError("Chỉ được nhập số");
      return;
    }

    // Loại bỏ số 0 ở đầu, nhưng giữ lại "0" nếu rỗng và giữ lại "0." nếu có dấu chấm
    let cleanPercent = newPercent.replace(/^0+/, "") || "0";
    if (newPercent.includes(".") && cleanPercent === "0") {
      cleanPercent = "0.";
    }

    setDiscountPercent(cleanPercent);

    // Validation: Không cho phép nhập quá 100%
    if (parseFloat(cleanPercent) > 100) {
      setPercentError("Phần trăm giảm giá không được vượt quá 100%");
      return;
    } else {
      setPercentError("");
    }

    // Nếu tl_ck > 0, tự động tính ck_nt
    if (parseFloat(cleanPercent) > 0) {
      const basePrice =
        parseFloat(item.don_gia || 0) * parseInt(item.so_luong || 0);
      const extrasTotal = (item.extras || []).reduce(
        (sum, extra) =>
          sum +
          parseFloat(extra.don_gia || extra.gia || 0) *
            parseInt(extra.so_luong || extra.quantity || 0) *
            parseInt(item.so_luong || 0),
        0
      );
      const totalBeforeDiscount = basePrice + extrasTotal;
      const calculatedDiscount =
        (totalBeforeDiscount * parseFloat(cleanPercent)) / 100;
      setDiscountAmount(calculatedDiscount.toFixed(0));
      setDiscountAmountDisplay(calculatedDiscount.toFixed(0));
    } else {
      setDiscountAmount("0");
      setDiscountAmountDisplay("0");
    }
  };

  const handleDiscountAmountChange = (value) => {
    // Không cho phép nhập khi discountPercent > 0
    if (parseFloat(discountPercent) > 0) {
      return;
    }

    // Loại bỏ tất cả ký tự không phải số từ giá trị nhập vào
    const numericOnly = value.replace(/\D/g, "");

    // Loại bỏ số 0 ở đầu
    const cleanAmount = numericOnly.replace(/^0+/, "") || "0";

    // Clear error nếu input hợp lệ
    setAmountError("");
    setDiscountAmount(cleanAmount);
    setDiscountAmountDisplay(cleanAmount);

    // Tính tổng tiền gốc để validation
    const basePrice =
      parseFloat(item.don_gia || 0) * parseInt(item.so_luong || 0);
    const extrasTotal = (item.extras || []).reduce(
      (sum, extra) =>
        sum +
        parseFloat(extra.don_gia || extra.gia || 0) *
          parseInt(extra.so_luong || extra.quantity || 0) *
          parseInt(item.so_luong || 0),
      0
    );
    const totalBeforeDiscount = basePrice + extrasTotal;

    // Validation: Tiền giảm không được vượt quá tổng tiền gốc
    if (parseFloat(cleanAmount) > totalBeforeDiscount) {
      setAmountError(
        `Số tiền giảm không được vượt quá tổng tiền gốc (${formatNumber(
          totalBeforeDiscount
        )}đ)`
      );
      return;
    } else {
      setAmountError("");
    }

    // Không dispatch ngay lập tức, chỉ cập nhật state local
  };

  const handleClose = () => {
    // Reset về giá trị ban đầu khi mở modal
    setDiscountPercent(originalDiscountPercent);
    setDiscountAmount(originalDiscountAmount);
    setDiscountAmountDisplay(originalDiscountAmount);
    setPercentError("");
    setAmountError("");
    onClose();
  };

  const calculateTotalAfterDiscount = () => {
    if (!item) return 0;

    const basePrice =
      parseFloat(item.don_gia || 0) * parseInt(item.so_luong || 0);
    const extrasTotal = (item.extras || []).reduce(
      (sum, extra) =>
        sum +
        parseFloat(extra.don_gia || extra.gia || 0) *
          parseInt(extra.so_luong || extra.quantity || 0) *
          parseInt(item.so_luong || 0),
      0
    );

    const totalBeforeDiscount = basePrice + extrasTotal;
    const tl_ckValue = parseFloat(discountPercent || 0);
    const ck_ntValue = parseFloat(discountAmount || 0);

    let finalDiscount = 0;
    if (tl_ckValue > 0) {
      finalDiscount = (totalBeforeDiscount * tl_ckValue) / 100;
    } else {
      finalDiscount = ck_ntValue;
    }

    return totalBeforeDiscount - finalDiscount;
  };

  const handleSave = () => {
    // Kiểm tra validation trước khi lưu
    if (percentError || amountError) {
      return;
    }

    // Dispatch để cập nhật giá khi lưu
    dispatch(
      updateProductDiscount({
        index: orderIndex,
        tl_ck: discountPercent,
        ck_nt: discountAmount,
      })
    );

    onClose();
  };

  return (
    <Modal
      title="Giảm giá món"
      open={isVisible}
      onCancel={handleClose}
      footer={[
        <Button key="cancel" onClick={handleClose}>
          Hủy
        </Button>,
        <Button
          key="save"
          type="primary"
          onClick={handleSave}
          disabled={percentError || amountError}
        >
          Lưu
        </Button>,
      ]}
      className="discount-modal"
    >
      <div className="discount-modal-content">
        <div className="discount-info">
          <h4>{item?.selected_meal?.label || item?.ten_vt}</h4>
          <p>
            Giá gốc: {formatNumber(item?.don_gia || 0)}đ x {item?.so_luong}
          </p>
          {item?.extras && item.extras.length > 0 && (
            <p>Món thêm: {item.extras.length} món</p>
          )}
        </div>

        <div className="discount-inputs">
          <div className="discount-input-group">
            <label>Giảm giá %:</label>
            <Input
              type="number"
              value={discountPercent}
              onChange={(e) => handleDiscountPercentChange(e.target.value)}
              onInput={(e) => {
                // Chặn ngay khi input, chỉ giữ lại số và dấu chấm, loại bỏ số 0 ở đầu
                const value = e.target.value;
                const numericOnly = value.replace(/[^0-9.]/g, "");
                // Loại bỏ số 0 ở đầu, nhưng giữ lại "0" nếu rỗng và giữ lại "0." nếu có dấu chấm
                let cleanValue = numericOnly.replace(/^0+/, "") || "0";
                if (numericOnly.includes(".") && cleanValue === "0") {
                  cleanValue = "0.";
                }
                if (value !== cleanValue) {
                  e.target.value = cleanValue;
                  setDiscountPercent(cleanValue);
                }
              }}
              onKeyPress={(e) => {
                // Chặn nhập ký tự không phải số, dấu chấm, và phím điều khiển
                if (
                  !/[0-9.]/.test(e.key) &&
                  ![
                    "Backspace",
                    "Delete",
                    "Tab",
                    "Enter",
                    "ArrowLeft",
                    "ArrowRight",
                  ].includes(e.key)
                ) {
                  e.preventDefault();
                }
              }}
              onPaste={(e) => {
                // Chặn paste nội dung không phải số hoặc dấu chấm
                const paste = e.clipboardData.getData("text");
                if (!/^[0-9.]*$/.test(paste)) {
                  e.preventDefault();
                }
              }}
              min="0"
              max="100"
              step="0.1"
              placeholder="0"
              suffix="%"
              status={percentError ? "error" : ""}
            />
            {percentError && (
              <div
                style={{ color: "#ff4d4f", fontSize: "12px", marginTop: "4px" }}
              >
                {percentError}
              </div>
            )}
          </div>
          <div className="discount-input-group">
            <label>Giảm tiền:</label>
            <Input
              type="text"
              value={formatNumber(discountAmountDisplay)}
              onChange={(e) => handleDiscountAmountChange(e.target.value)}
              onInput={(e) => {
                // Chặn ngay khi input, chỉ giữ lại số và loại bỏ số 0 ở đầu
                const value = e.target.value;
                const numericOnly = value.replace(/\D/g, ""); // Loại bỏ tất cả ký tự không phải số
                const cleanValue = numericOnly.replace(/^0+/, "") || "0"; // Loại bỏ số 0 ở đầu, giữ lại "0" nếu rỗng
                if (value !== formatNumber(cleanValue)) {
                  e.target.value = formatNumber(cleanValue);
                  setDiscountAmount(cleanValue);
                  setDiscountAmountDisplay(cleanValue);
                }
              }}
              onKeyPress={(e) => {
                // Chặn nhập ký tự không phải số và phím điều khiển
                if (
                  !/[0-9]/.test(e.key) &&
                  ![
                    "Backspace",
                    "Delete",
                    "Tab",
                    "Enter",
                    "ArrowLeft",
                    "ArrowRight",
                  ].includes(e.key)
                ) {
                  e.preventDefault();
                }
              }}
              onPaste={(e) => {
                // Chặn paste nội dung không phải số
                const paste = e.clipboardData.getData("text");
                if (!/^\d*$/.test(paste)) {
                  e.preventDefault();
                }
              }}
              inputMode="numeric"
              placeholder="0"
              addonAfter="VND"
              readOnly={parseFloat(discountPercent) > 0}
              status={amountError ? "error" : ""}
              style={{
                width: "100%",
                backgroundColor:
                  parseFloat(discountPercent) > 0 ? "#f5f5f5" : "white",
                cursor:
                  parseFloat(discountPercent) > 0 ? "not-allowed" : "text",
              }}
            />
            {amountError && (
              <div
                style={{ color: "#ff4d4f", fontSize: "12px", marginTop: "4px" }}
              >
                {amountError}
              </div>
            )}
          </div>
        </div>

        <div className="discount-summary">
          <p>
            <strong>Tổng tiền sau giảm: </strong>
            <span style={{ color: "#28a745", fontSize: "16px" }}>
              {formatNumber(calculateTotalAfterDiscount())}đ
            </span>
          </p>
        </div>
      </div>
    </Modal>
  );
};

export default DiscountModal;




