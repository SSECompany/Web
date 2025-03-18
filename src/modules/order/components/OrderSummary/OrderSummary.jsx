import {
    message as messageAPI,
    notification
} from "antd";
import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { useReactToPrint } from "react-to-print";
import { multipleTablePutApi } from "../../../../api";
import SelectTableModal from "../../../../components/Modal/ModalSelectTable";
import PrintComponent from "../../../../modules/order/components/OrderSummary/PrintOrderModal/PrintComponent/PrintComponent";
import { clearTabData } from "../../../../store/reducers/order";
import "./OrderSummary.css";
import PaymentModal from "./PaymentModal/PaymentModal";

export default function OrderSummary({ total, itemCount }) {
    const { orderId } = useParams();
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedTable, setSelectedTable] = useState(null);
    const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);
    const [modalType, setModalType] = useState(null);
    const [message, contextHolder] = messageAPI.useMessage();

    const activeTabId = useSelector((state) => state.orders?.activeTabId);
    const activeTab = useSelector((state) =>
        state.orders?.orders?.find((tab) => tab.tableId === activeTabId)
    );

    const { id, storeId, unitId } = useSelector((state) => state.claimsReducer.userInfo || {});

    const dispatch = useDispatch();
    const [isCreatingOrder, setIsCreatingOrder] = useState(false);
    const [isPrinting, setIsPrinting] = useState(false);
    const [showQR, setShowQR] = useState(false);

    const printContent = useRef();
    const [printMaster, setPrintMaster] = useState({});
    const [printDetail, setPrintDetail] = useState([]);

    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    const handlePrint = useReactToPrint({
        content: () => printContent.current,
        documentTitle: "Print This Document",
        copyStyles: false,
        onAfterPrint: () => handleSaveOrder(),
    });

    useEffect(() => {
        if (isPrinting && Object.keys(printMaster).length > 0 && printDetail.length > 0) {
            handlePrint();
        }
    }, [printMaster, printDetail]);

    const handlePreparePrint = (selectedPayments = ["tien_mat", "chuyen_khoan"], paymentAmounts = { tien_mat: "0", chuyen_khoan: "0" }) => {
        if (!activeTab) {
            message.warning("Không có dữ liệu để in!");
            return;
        }

        const masterData = {
            ma_ban: activeTab?.tableId,
            dien_giai: activeTab?.master?.dien_giai || "",
            tong_tien: parseFloat(activeTab?.master?.tong_tien || 0).toString(),
            tong_sl: parseInt(activeTab?.master?.tong_sl || 0).toString(),
            tien_mat: (paymentAmounts.tien_mat).toString() || "0",
            chuyen_khoan: (paymentAmounts.chuyen_khoan).toString() || "0",
            tong_tt: (parseFloat(paymentAmounts.tien_mat || 0) + parseFloat(paymentAmounts.chuyen_khoan || 0)).toString(),
            httt: selectedPayments.join(","),
            stt_rec: activeTab?.master?.stt_rec || "",
            status: "2"
        };

        const detailData = activeTab?.detail?.flatMap((item) => {
            const mainItem = {
                ten_vt: item.ten_vt,
                ma_vt_root: item.ma_vt_root || "",
                ma_vt: item.ma_vt,
                so_luong: item.so_luong.toString(),
                don_gia: item.don_gia.toString(),
                thanh_tien: (item.so_luong * item.don_gia).toString(),
                ghi_chu: item.ghi_chu || "",
            };

            const extraItems = (item.extras || []).map((extra) => ({
                ten_vt: extra.ten_vt,
                ma_vt_root: item.ma_vt,
                ma_vt: extra.ma_vt_more,
                so_luong: (extra.quantity * item.so_luong).toString(),
                don_gia: extra.gia.toString(),
                thanh_tien: (extra.gia * extra.quantity * item.so_luong).toString(),
            }));

            return [mainItem, ...extraItems];
        });

        if (!detailData?.length) {
            message.warning("Vui lòng thêm vật tư!");
            return;
        }

        setPrintMaster(masterData);
        setPrintDetail(detailData);
        setIsPrinting(true);
    };

    const handleSendOrderDirectly = async () => {
        if (!activeTab) {
            message.warning("Không có dữ liệu để gửi!");
            return;
        }

        const masterData = {
            ma_ban: activeTab?.tableId,
            dien_giai: activeTab?.master?.dien_giai || "",
            tong_tien: parseFloat(activeTab?.master?.tong_tien || 0).toString(),
            tong_sl: parseInt(activeTab?.master?.tong_sl || 0).toString(),
            tien_mat: "0",
            chuyen_khoan: "0",
            tong_tt: "0",
            httt: "",
            stt_rec: "",
            status: "0"
        };

        const detailData = activeTab?.detail?.flatMap((item) => {
            const mainItem = {
                ten_vt: item.ten_vt,
                ma_vt_root: item.ma_vt_root || "",
                ma_vt: item.ma_vt,
                so_luong: item.so_luong.toString(),
                don_gia: item.don_gia.toString(),
                thanh_tien: (item.so_luong * item.don_gia).toString(),
                ghi_chu: item.ghi_chu || "",
            };

            const extraItems = (item.extras || []).map((extra) => ({
                ten_vt: extra.ten_vt,
                ma_vt_root: item.ma_vt,
                ma_vt: extra.ma_vt_more,
                so_luong: (extra.quantity * item.so_luong).toString(),
                don_gia: extra.gia.toString(),
                thanh_tien: (extra.gia * extra.quantity * item.so_luong).toString(),
            }));

            return [mainItem, ...extraItems];
        });

        if (!detailData?.length) {
            message.warning("Vui lòng thêm vật tư!");
            return;
        }

        setIsCreatingOrder(true);

        try {
            const payload = {
                store: "Api_create_retail_order",
                param: { StoreID: storeId, unitId: unitId, userId: id },
                data: { master: [masterData], detail: detailData },
            };

            const response = await multipleTablePutApi(payload);
            if (response?.responseModel?.isSucceded) {
                notification.success({ message: "Đơn hàng đã được gửi thành công!" });
                setTimeout(() => {
                    dispatch(clearTabData(activeTabId));
                }, 500);
            } else {
                notification.warning({ message: response?.responseModel?.message });
            }
        } catch (error) {
            notification.error({ message: "Có lỗi xảy ra khi gửi đơn hàng!", description: error.message });
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
                notification.success({ message: "Thực hiện thành công!" });
                dispatch(clearTabData(activeTabId));
            } else {
                notification.warning({ message: response?.responseModel?.message });
            }
        } catch (error) {
            notification.error({ message: "Có lỗi xảy ra, vui lòng thử lại!" });
        }
        setIsCreatingOrder(false);
    };

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
                    <p className="summary-total_font">{total.toLocaleString()}đ</p>
                </span>
            </div>

            <PaymentModal
                visible={isPaymentModalVisible}
                onClose={handleClosePaymentModal}
                onConfirm={handleConfirmPayment}
                total={total}
            />
            <SelectTableModal
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
            />

            <div className="summary-actions">
                <button className="select-table-button" onClick={() => {
                    setModalType("updateTable");
                    setIsModalVisible(true);
                }}>
                    {selectedTable ? selectedTable.name : orderId ? `Bàn ${orderId}` : "Đơn mới"}
                </button>

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