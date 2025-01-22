import { message, notification } from "antd";
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { multipleTablePutApi } from "../../../../api";
import SelectTableModal from "../../../../components/modal/ModalSelectTable";
import { clearTabData } from "../../../../store/reducers/order";
import "./OrderSummary.css";
import QRCodeComponent from "./QRCode/QRCode";

export default function OrderSummary({ total, itemCount }) {
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [modalType, setModalType] = useState(null);

    const activeTabId = useSelector((state) => state.orders?.activeTabId);
    const activeTab = useSelector((state) =>
        state.orders?.orders?.find((tab) => tab.tableId === activeTabId)
    );

    const { id: userId, storeId, unitId } = useSelector((state) => state.user || {}); // Fallback for undefined

    const dispatch = useDispatch();
    const [isCreatingOrder, setIsCreatingOrder] = useState(false);

    const handleSaveOrder = async () => {
        if (isCreatingOrder) return;

        setIsCreatingOrder(true);

        try {
            const masterData = {
                ma_ban: activeTab?.tableId,
                dien_giai: activeTab?.master?.dien_giai || "",
                tong_tien: parseFloat(activeTab?.master?.tong_tien || 0).toString(),
                tong_sl: parseInt(activeTab?.master?.tong_sl || 0).toString(),
                tien_mat: "0",
                qr: "0",
                httt: "tien_mat,qr",
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
                setIsCreatingOrder(false);
                return;
            }

            const response = await multipleTablePutApi({
                store: "Api_create_retail_order",
                param: {
                    StoreID: storeId,
                    unitId: unitId,
                    userId: userId,
                },
                data: {
                    master: [masterData],
                    detail: detailData,
                },
            });

            if (response?.responseModel?.isSucceded) {
                notification.success({ message: "Thực hiện thành công!" });
                dispatch(clearTabData(activeTabId));
                setIsCreatingOrder(false);
            } else {
                notification.warning({ message: response?.responseModel?.message });
                setIsCreatingOrder(false);
            }
        } catch (error) {
            notification.error({ message: "Có lỗi xảy ra, vui lòng thử lại!" });
            setIsCreatingOrder(false);
        }
    };

    const handleSelectTable = (selectedTable) => {
        if (modalType === "updateTable") {
            dispatch({
                type: "orders/updateTabTableName",
                payload: { tableId: selectedTable.id, tableName: selectedTable.name },
            });
        }
        setIsModalVisible(false);
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
            <SelectTableModal
                visible={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                onConfirm={handleSelectTable}
                modalTitle={modalType === "updateTable" ? "Chọn bàn cho tab hiện tại" : "Chọn bàn"}
            />
            <div className="summary-actions">
                <button
                    className="select-table-button"
                    onClick={() => {
                        setModalType("updateTable");
                        setIsModalVisible(true);
                    }}
                >
                    {activeTab?.tableName || "Chọn bàn"}
                </button>
                <QRCodeComponent
                    activeTab={activeTab}
                    userId={userId}
                    storeId={storeId}
                    unitId={unitId}
                    onGenerateSuccess={(qrUrl) => console.log("QR URL:", qrUrl)}
                />
                <button
                    className="summary-button primary"
                    onClick={handleSaveOrder}
                    disabled={isCreatingOrder}
                >
                    Thanh toán
                </button>
            </div>
        </div>
    );
}