import { Button, InputNumber, Modal } from "antd";
import React, { useEffect, useState } from "react";
import { formatCurrency } from "../../../../../app/hook/dataFormatHelper";
import { num2words } from "../../../../../app/Options/DataFomater";
import "./PaymentModal.css";

const PaymentModal = ({ visible, onClose, onConfirm, total }) => {
    const [selectedPayments, setSelectedPayments] = useState(["tien_mat"]);
    const [paymentAmounts, setPaymentAmounts] = useState({
        tien_mat: total,
        chuyen_khoan: 0,
    });
    const [change, setChange] = useState(0);

    const showQRCode = selectedPayments.length === 1 && selectedPayments.includes("chuyen_khoan");

    const account = process.env.REACT_APP_VIETQR_ACCOUNT;
    const accountName = encodeURIComponent(process.env.REACT_APP_VIETQR_ACCOUNT_NAME);
    const qrUrl = `https://img.vietqr.io/image/${account}-compact2.png?amount=${total}&accountName=${accountName}`;

    const handlePaymentSelection = (method) => {
        setSelectedPayments((prev) => {
            const newSelectedPayments = prev.includes(method)
                ? prev.filter((item) => item !== method)
                : [...prev, method];

            if (!newSelectedPayments.includes("tien_mat") && paymentAmounts.tien_mat !== 0) {
                setPaymentAmounts((amounts) => ({
                    ...amounts,
                    tien_mat: paymentAmounts.tien_mat,
                }));
            }

            return newSelectedPayments;
        });
    };

    const handleAmountChange = (method, value) => {
        const newAmounts = { ...paymentAmounts, [method]: value || 0 };
        setPaymentAmounts(newAmounts);

        const totalAmount = Object.values(newAmounts).reduce((sum, val) => sum + val, 0);
        setChange(totalAmount - total);
    };

    const handleClose = () => {
        setSelectedPayments(["tien_mat"]);
        setPaymentAmounts({ tien_mat: total, chuyen_khoan: 0 });
        setChange(0);
        onClose();
    };

    useEffect(() => {
        if (visible) {
            setSelectedPayments(["tien_mat"]);
            setPaymentAmounts({ tien_mat: total, chuyen_khoan: 0 });
            setChange(0);
        }
    }, [visible, total]);

    const formatNumber = (val) => {
        if (!val) return 0;
        return `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ".").replace(/\.(?=\d{0,2}$)/g, ",");
    };

    const parserNumber = (val) => {
        if (!val) return 0;
        return Number.parseFloat(val.replace(/\$\s?|(\.*)/g, "").replace(/(\,{1})/g, ".")).toFixed(2);
    };

    return (
        <Modal
            title={<p className="payment-title">Phiếu thanh toán</p>}
            visible={visible}
            onCancel={handleClose}
            footer={null}
            className="payment-modal"
        >
            <div className="payment-summary">
                <span>Tổng tiền hàng:</span>
                <strong>{total.toLocaleString()}đ</strong>
            </div>

            <div className="payment-divider"></div>

            <p className="payment-text"><strong>Hình thức thanh toán:</strong></p>
            <div className="payment-methods">
                {["tien_mat", "chuyen_khoan"].map((method) => (
                    <div
                        key={method}
                        className={`payment-option ${selectedPayments.includes(method) ? 'selected' : ''}`}
                        onClick={() => handlePaymentSelection(method)}
                    >
                        {method === "tien_mat" ? "Tiền mặt" : "Chuyển khoản"}
                    </div>
                ))}
            </div>

            {showQRCode && (
                <div className="qr-code-container">
                    <p className="payment-text"><strong>Quét mã QR để thanh toán:</strong></p>
                    <img src={qrUrl} alt="QR Code" className="qr-code-image" />
                </div>
            )}

            {!showQRCode && (
                <>
                    <p className="payment-text"><strong>Nhập số tiền:</strong></p>
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
                                formatter={(value) => value ? formatNumber(value) : ''}
                                parser={(value) => value ? parserNumber(value) : 0}
                                onKeyDownCapture={(event) => {
                                    if ((!/[0-9]/.test(event.key)) && (![8, 46, 37, 38, 39, 40].includes(event.keyCode))) {
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
                <Button key="cancel" onClick={handleClose} className="payment-button secondary">
                    Huỷ
                </Button>
                <Button
                    key="pay"
                    type="primary"
                    onClick={() => onConfirm(selectedPayments, paymentAmounts)}
                    className="payment-button primary"
                    disabled={selectedPayments.length === 0 || Object.values(paymentAmounts).reduce((sum, val) => sum + val, 0) < total}
                >
                    Thanh toán
                </Button>
            </div>
        </Modal>
    );
};

export default PaymentModal;