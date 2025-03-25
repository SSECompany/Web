import {
    message as messageAPI,
    notification
} from "antd";
import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { useReactToPrint } from "react-to-print";
import { multipleTablePutApi, printOrderApi, syncFastApi } from "../../../../api";
import { clearTabData } from "../../../../store/reducers/order";
import "./OrderSummary.css";
import PaymentModal from "./PaymentModal/PaymentModal";
import PrintComponent from "./PrintComponent/PrintComponent";

export default function OrderSummary({ total, itemCount }) {
    const { orderId } = useParams();
    const dispatch = useDispatch();
    const { activeTabId, orders } = useSelector((state) => state.orders);
    const { id, storeId, unitId } = useSelector((state) => state.claimsReducer.userInfo || {});
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedTable, setSelectedTable] = useState(null);
    const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);
    const [modalType, setModalType] = useState(null);
    const [message, contextHolder] = messageAPI.useMessage();
    const [isCreatingOrder, setIsCreatingOrder] = useState(false);
    const [isPrinting, setIsPrinting] = useState(false);
    const [showQR, setShowQR] = useState(false);
    const printContent = useRef();
    const [printMaster, setPrintMaster] = useState({});
    const [printDetail, setPrintDetail] = useState([]);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    const activeTab = orders?.find((tab) => tab.tableId === activeTabId);

    const generateOrderData = (status = "0", selectedPayments = [], paymentAmounts = {}) => {
        if (!activeTab) {
            message.warning("Không có dữ liệu!");
            return null;
        }

        const masterData = {
            ma_ban: activeTab?.tableId,
            dien_giai: activeTab?.master?.dien_giai || "",
            tong_tien: parseFloat(activeTab?.master?.tong_tien || 0).toString(),
            tong_sl: parseInt(activeTab?.master?.tong_sl || 0).toString(),
            tien_mat: (paymentAmounts.tien_mat || "0").toString(),
            chuyen_khoan: (paymentAmounts.chuyen_khoan || "0").toString(),
            tong_tt: (parseFloat(paymentAmounts.tien_mat || 0) + parseFloat(paymentAmounts.chuyen_khoan || 0)).toString(),
            httt: selectedPayments.join(","),
            stt_rec: status === "2" ? activeTab?.master?.stt_rec || "" : "",
            status
        };

        const detailData = activeTab?.detail?.flatMap((item) => [
            {
                ten_vt: item.ten_vt,
                ma_vt_root: item.ma_vt_root || "",
                ma_vt: item.ma_vt,
                so_luong: item.so_luong.toString(),
                don_gia: item.don_gia.toString(),
                thanh_tien: (item.so_luong * item.don_gia).toString(),
                ghi_chu: item.ghi_chu || "",
            },
            ...(item.extras || []).map((extra) => ({
                ten_vt: extra.ten_vt,
                ma_vt_root: item.ma_vt,
                ma_vt: extra.ma_vt_more,
                so_luong: (extra.quantity * item.so_luong).toString(),
                don_gia: extra.gia.toString(),
                thanh_tien: (extra.gia * extra.quantity * item.so_luong).toString(),
            })),
        ]);

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
                setTimeout(() => dispatch(clearTabData(activeTabId)), 500);
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
                        notification.success({ message: "Thực hiện thành công và đồng bộ!" });
                    } catch (error) {
                        notification.error({ message: "Có lỗi xảy ra khi thực hiện thanh toán hoặc đồng bộ!", description: error.message });
                    }
                } else {
                    notification.warning({ message: "Không có `stt_rec` để thực hiện các API!" });
                }
                dispatch(clearTabData(activeTabId));
            } else {
                notification.warning({ message: response?.responseModel?.message });
            }
        } catch (error) {
            notification.error({ message: "Có lỗi xảy ra, vui lòng thử lại!" });
        }
        setIsCreatingOrder(false);
    };

    const handlePreparePrint = (selectedPayments = ["tien_mat", "chuyen_khoan"], paymentAmounts = { tien_mat: "0", chuyen_khoan: "0" }) => {
        const orderData = generateOrderData("2", selectedPayments, paymentAmounts);
        if (!orderData) return;

        setPrintMaster(orderData.masterData);
        setPrintDetail(orderData.detailData);
        setIsPrinting(true);
    };

    const handlePrint = useReactToPrint({
        content: () => printContent.current,
        documentTitle: "Print This Document",
        copyStyles: false,
        onAfterPrint: () => handleSaveOrder(),
    });

    useEffect(() => {
        if (isPrinting && printMaster?.ma_ban && printDetail.length) handlePrint();
    }, [printMaster, printDetail]);

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

    const openSelectTableModal = (type) => {
        setModalType(type);
        setIsModalVisible(true);
    };

    return (
        <div className="order-summary">
            <div className="summary-info">
                <span className="summary-total">
                    <p>Tổng tiền</p>
                    <span className="summary-count">{itemCount}</span>
                    <p className="summary-total_font">{total.toLocaleString()}đ</p>
                </span>
            </div>

            <PaymentModal
                visible={isPaymentModalVisible}
                onClose={handleClosePaymentModal}
                onConfirm={handleConfirmPayment}
                total={total}
            />
            {/* <SelectTableModal
                visible={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                onConfirm={(selectedTable) => {
                    if (modalType === "updateTable") {
                        dispatch({
                            type: "orders/updateTabTableName",
                            payload: { tableId: selectedTable.id, tableName: selectedTable.name },
                        });
                    }
                    setSelectedTable(selectedTable);
                    setIsModalVisible(false);
                }}
                modalTitle={modalType === "updateTable" ? "Chọn bàn cho tab hiện tại" : "Chọn bàn"}
            /> */}

            <div className="summary-actions">
                {/* <button className="select-table-button" onClick={() => openSelectTableModal("updateTable")}>
                    {selectedTable ? selectedTable.name : orderId ? `Bàn ${orderId}` : "Đơn mới"}
                </button> */}

                <button
                    className="summary-button primary"
                    onClick={isMobile ? handleSendOrderDirectly : handleOpenPaymentModal}
                    disabled={isCreatingOrder || isPrinting}
                >
                    {isMobile ? "Gửi" : "Thanh toán"}
                </button>
            </div>

            <div style={{ display: "none" }}>
                <PrintComponent ref={printContent} master={printMaster} detail={printDetail} />
            </div>

            {contextHolder}
        </div>
    );
}