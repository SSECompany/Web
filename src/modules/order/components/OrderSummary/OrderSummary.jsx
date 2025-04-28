import {
    message as messageAPI,
    notification
} from "antd";
import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useReactToPrint } from "react-to-print";
import { multipleTablePutApi, printOrderApi, syncFastApi } from "../../../../api";
import jwt from '../../../../utils/jwt';
import { clearTabData, removeTab } from "../../store/order";
import "./OrderSummary.css";
import PaymentModal from "./PaymentModal/PaymentModal";
import PrintComponent from "./PrintComponent/PrintComponent";

const generateRandomId = () => Array.from({ length: 16 }, () => Math.floor(Math.random() * 36).toString(36)).join('');

export default function OrderSummary({ total, itemCount }) {
    const dispatch = useDispatch();
    const { internalActiveTabId, orders } = useSelector((state) => state.orders);
    const { id, storeId, unitId } = useSelector((state) => state.claimsReducer.userInfo || {});
    const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);
    const [message, contextHolder] = messageAPI.useMessage();
    const [isCreatingOrder, setIsCreatingOrder] = useState(false);
    const [isPrinting, setIsPrinting] = useState(false);
    const [showQR, setShowQR] = useState(false);
    const printContent = useRef();
    const [printMaster, setPrintMaster] = useState({});
    const [printDetail, setPrintDetail] = useState([]);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const [isPrinted, setIsPrinted] = useState(false); // Thêm cờ kiểm soát in

    const activeTab = orders?.find((tab) => tab.internalId === internalActiveTabId);
    const rawToken = localStorage.getItem("access_token");
    const claims = rawToken && rawToken.split(".").length === 3 ? jwt.getClaims?.() || {} : {};
    const fullName = claims?.FullName;

    const generateOrderData = (status = "0", selectedPayments = [], paymentAmounts = {}) => {
        if (!activeTab) {
            message.warning("Không có dữ liệu!");
            return null;
        }

        const masterData = {
            ma_ban: activeTab?.tableId,
            dien_giai: activeTab?.master?.dien_giai || "",
            tong_tien: Number(activeTab?.master?.tong_tien || 0).toString(),
            tong_sl: Number(activeTab?.master?.tong_sl || 0).toString(),
            tien_mat: Number(paymentAmounts.tien_mat || 0).toString(),
            chuyen_khoan: Number(paymentAmounts.chuyen_khoan || 0).toString(),
            tong_tt: (Number(paymentAmounts.tien_mat || 0) + Number(paymentAmounts.chuyen_khoan || 0)).toString(),
            httt: selectedPayments.join(","),
            stt_rec: status === "2" ? activeTab?.master?.stt_rec || "" : "",
            status
        };

        const detailData = activeTab?.detail?.flatMap((item) => {
            const uniqueid = item.uniqueid || generateRandomId();
            const mainItem = {
                ten_vt: item.ten_vt,
                ma_vt_root: item.ma_vt_root || "",
                ma_vt: item.ma_vt,
                so_luong: (item.so_luong || 0).toString(),
                don_gia: (item.don_gia || 0).toString(),
                thanh_tien: ((item.so_luong || 0) * (item.don_gia || 0)).toString(),
                ghi_chu: item.ghi_chu || "",
                uniqueid,
                ap_voucher: item.ap_voucher || "0",
            };
            const extras = (item.extras || []).map((extra) => {
                const quantity = parseFloat(extra.quantity || extra.so_luong || 0);
                const price = parseFloat(extra.gia || extra.don_gia || 0);
                const amount = quantity * price * (item.so_luong || 0);

                return {
                    ten_vt: extra.ten_vt,
                    ma_vt_root: item.ma_vt,
                    ma_vt: extra.ma_vt_more || extra.ma_vt,
                    so_luong: (quantity * (item.so_luong || 0)).toString(),
                    don_gia: price.toString(),
                    thanh_tien: amount.toString(),
                    uniqueid
                };
            });
            return [mainItem, ...extras];
        });

        if (!detailData?.length) {
            message.warning("Vui lòng thêm vật tư!");
            return null;
        }

        return { masterData, detailData };
    };

    const handleSendOrderDirectly = async () => {
        const orderData = generateOrderData();
        if (!orderData) return;

        setIsCreatingOrder(true);
        try {
            const payload = {
                store: "Api_create_retail_order",
                param: { StoreID: storeId, unitId: unitId, userId: id },
                data: { master: [orderData.masterData], detail: orderData.detailData },
            };

            const response = await multipleTablePutApi(payload);
            if (response?.responseModel?.isSucceded) {
                notification.success({ message: "Đơn hàng đã được gửi thành công!" });
                setTimeout(() => dispatch(clearTabData(internalActiveTabId)), 500);
            } else {
                notification.warning({ message: response?.responseModel?.message });
            }
        } catch (error) {
            notification.error({ message: "Có lỗi xảy ra!", description: error.message });
        }
        setIsCreatingOrder(false);
    };

    const handleSaveOrder = async () => {
        setIsPrinting(false);
        if (isCreatingOrder) return;

        if (!printMaster || !printDetail.length) {
            notification.warning({ message: "Chưa đủ dữ liệu để thực hiện thanh toán!" });
            return;
        }

        setIsCreatingOrder(true);

        try {
            const payload = {
                store: "Api_create_retail_order",
                param: { StoreID: storeId, unitId: unitId, userId: id },
                data: { master: [printMaster], detail: printDetail },
            };

            const response = await multipleTablePutApi(payload);
            if (response?.responseModel?.isSucceded) {
                const sttRec = response?.listObject[0][0]?.stt_rec;
                if (sttRec) {
                    try {
                        await printOrderApi(sttRec, id);
                        await syncFastApi(sttRec, id);
                        notification.success({ message: "Thanh toán thành công !" });
                    } catch (error) {
                        notification.error({ message: "Có lỗi xảy ra khi thực hiện thanh toán hoặc đồng bộ!", description: error.message });
                    }
                } else {
                    notification.warning({ message: "Không có `stt_rec` để thực hiện các API!" });
                }
                dispatch(removeTab({ tableId: internalActiveTabId }));
            } else {
                notification.warning({ message: response?.responseModel?.message });
            }
        } catch (error) {
            notification.error({ message: "Có lỗi xảy ra, vui lòng thử lại!" });
        } finally {
            setIsCreatingOrder(false);
        }
    };

    const handlePreparePrint = (selectedPayments = ["tien_mat", "chuyen_khoan"], paymentAmounts = { tien_mat: "0", chuyen_khoan: "0" }) => {
        const orderData = generateOrderData("2", selectedPayments, paymentAmounts);
        if (!orderData) return;

        setPrintMaster(orderData.masterData);
        setPrintDetail(orderData.detailData);
        setIsPrinting(true);
        setIsPrinted(false);
    };

    let hasPrinted = false;

    const handlePrint = useReactToPrint({
        content: () => {
            return printContent.current;
        },
        documentTitle: "Print This Document",
        copyStyles: false,
        onAfterPrint: () => {
            if (!hasPrinted) {
                hasPrinted = true;
                setTimeout(() => handleSaveOrder(), 100);
            } else {
            }
        },
    });

    useEffect(() => {
        if (isPrinting && !isPrinted) {
            hasPrinted = false;
            handlePrint();
        } else {
        }
    }, [printMaster, printDetail, isPrinting, isPrinted]);

    const handleOpenPaymentModal = () => {
        setIsPaymentModalVisible(true);
    };

    const handleClosePaymentModal = () => {
        setIsPaymentModalVisible(false);
    };

    const handleConfirmPayment = (selectedPayments, paymentAmounts) => {
        handleClosePaymentModal();
        if (selectedPayments.includes("chuyen_khoan")) {
            setShowQR(true);
        }
        handlePreparePrint(selectedPayments, paymentAmounts);
    };

    useEffect(() => {
        const token = localStorage.getItem("access_token");
        const isOrderPage = window.location.pathname.includes("/order");
        setIsMobile(isOrderPage && !token);
    }, []);

    return (
        <div className="order-summary">
            <div className="summary-info">
                <span className="summary-total">
                    <p>Tổng tiền</p>
                    <span className="summary-count">{itemCount}</span>
                    <p className="summary-total_font">{total.toLocaleString()} đ</p>
                </span>
            </div>

            <PaymentModal
                visible={isPaymentModalVisible}
                onClose={handleClosePaymentModal}
                onConfirm={handleConfirmPayment}
                total={total}
                isCreatingOrder={isCreatingOrder}
            />

            <div className="summary-actions">
                <button
                    className="summary-button primary"
                    onClick={isMobile ? handleSendOrderDirectly : handleOpenPaymentModal}
                    disabled={isCreatingOrder || isPrinting}
                >
                    {isMobile ? "Gửi" : "Thanh toán"}
                </button>
            </div>

            <div style={{ display: "none" }}>
                <PrintComponent ref={printContent} master={printMaster} detail={printDetail} fullName={fullName} />
            </div>

            {contextHolder}
        </div>
    );
}           