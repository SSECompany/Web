import { message, notification } from "antd";
import _ from "lodash";
import React, { useState } from "react";
import { useSelector } from "react-redux";
import { multipleTablePutApi } from "../../../../api";
import "./OrderSummary.css";

export default function OrderSummary({ total, itemCount }) {
    const [isCreatingOrder, setIsCreatingOrder] = useState(false);
    const orders = useSelector((state) => state.orders.orders);


    const handleSaveOrder = async () => {
        if (isCreatingOrder) return;

        setIsCreatingOrder(true);

        try {
            const masterData = {
                dien_giai: orders[0]?.master?.dien_giai || "",
                tong_tien: orders.reduce((sum, order) => sum + parseFloat(order.master.tong_tien), 0).toString(),
                tong_sl: orders.reduce((sum, order) => sum + parseInt(order.master.tong_sl), 0).toString(),
                tien_mat: "0",
                qr: "0",
                httt: "tien_mat,qr",
            };

            const detailData = orders.flatMap((order) =>
                order.detail.flatMap((item) => {
                    // Chi tiết món chính
                    const mainItem = {
                        ten_vt: item.ten_vt,
                        ma_vt_root: item.ma_vt_root || "",
                        ma_vt: item.ma_vt,
                        so_luong: item.so_luong.toString(),
                        don_gia: item.don_gia.toString(),
                        thanh_tien: item.thanh_tien.toString(),
                        ghi_chu: item.ghi_chu || "",
                    };

                    // Chi tiết món phụ (extras)
                    const extraItems = (item.extras || []).map((extra) => ({
                        ten_vt: extra.ten_vt,
                        ma_vt_root: item.ma_vt,
                        ma_vt: extra.ma_vt_more,
                        so_luong: extra.quantity.toString(),
                        don_gia: extra.gia.toString(),
                        thanh_tien: (extra.gia * extra.quantity).toString(),
                    }));

                    return [mainItem, ...extraItems];
                })
            );

            if (_.isEmpty(detailData)) {
                message.warning("Vui lòng thêm vật tư!");
                setIsCreatingOrder(false);
                return;
            }

            const response = await multipleTablePutApi({
                store: "Api_create_retail_order",
                param: {
                    StoreID: "",
                    unitId: "1BVBD",
                    userId: 10036,
                },
                data: {
                    master: [masterData],
                    detail: detailData,
                },
            });

            if (response?.responseModel?.isSucceded) {
                notification.success({ message: "Thực hiện thành công!" });

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

    return (
        <div className="order-summary">
            <div className="summary-info">
                <span className="summary-total">
                    <p>Tổng tiền</p>
                    <span className="summary-count">{itemCount}</span>
                    <p className="summary-total_font">{total.toLocaleString()}đ</p></span>
            </div>
            <div className="summary-actions">
                <button
                    className="qr-code-button"
                    disabled={isCreatingOrder}
                >
                    QRCode
                </button>
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

