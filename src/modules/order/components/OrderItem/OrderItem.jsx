import { EllipsisOutlined } from "@ant-design/icons";
import { Button, Dropdown, Menu } from "antd";
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addExtrasToOrder } from "../../../../store/reducers/order";
import AddNoteAndExtrasModal from "./modal/AddNoteAndExtrasModal";
import "./OrderItem.css";

export default function OrderItem({ item, index, onUpdateQuantity, onDeleteItem, onAddNote }) {
    const [isModalVisible, setIsModalVisible] = useState(false);
    const activeTabId = useSelector((state) => state.orders.activeTabId);

    const dispatch = useDispatch();

    const handleAddNote = () => {
        onAddNote();
        setIsModalVisible(true);
    };

    const handleUpdateExtraQuantity = (ma_vt_more, increment) => {
        const updatedExtras = item.extras.map((extra) => {
            if (extra.ma_vt_more === ma_vt_more) {
                return {
                    ...extra,
                    quantity: Math.max(1, extra.quantity + increment),
                };
            }
            return extra;
        });

        dispatch(
            addExtrasToOrder({
                tableId: activeTabId,
                orderIndex: index,
                extras: updatedExtras,
                note: item.ghi_chu || "",
            })
        );
    };

    const menu = (
        <Menu>
            <Menu.Item key="add-note" onClick={handleAddNote}>
                Ghi chú/Món thêm
            </Menu.Item>
            <Menu.Item key="delete-item" danger onClick={() => onDeleteItem(index)}>
                Xóa món
            </Menu.Item>
        </Menu>
    );

    return (
        <>
            <li className="order-item">
                <div className="order-item-main">
                    <span className="order-item-index">{index + 1}.</span>
                    <span className="order-item-name">{item.ten_vt}</span>
                    <div className="quantity-controls">
                        <Button
                            onClick={() => onUpdateQuantity(index, -1)}
                            disabled={item.so_luong <= 1}
                        >
                            -
                        </Button>
                        <span>{item.so_luong}</span>
                        <Button
                            onClick={() => onUpdateQuantity(index, 1)}
                        >
                            +
                        </Button>
                    </div>
                    <span className="order-item-price">
                        {(item.don_gia * item.so_luong).toLocaleString()}đ
                    </span>
                    <Dropdown overlay={menu} trigger={["click"]} placement="bottomRight">
                        <Button
                            type="text"
                            icon={<EllipsisOutlined style={{ fontSize: "20px" }} />}
                        />
                    </Dropdown>
                </div>

                {item.extras && item.extras.length > 0 && (
                    <ul className="order-item-extras">
                        {item.extras.map((extra) => (
                            <li key={extra.ma_vt_more} className="order-extra-item">
                                <span className="extra-name">+ {extra.ten_vt}</span>
                                <div className="extra-main">
                                    <div className="extra-quantity-controls">
                                        <Button
                                            onClick={() => handleUpdateExtraQuantity(extra.ma_vt_more, -1)}
                                            disabled={extra.quantity <= 1}
                                        >
                                            -
                                        </Button>
                                        <span className="extra-quantity">{extra.quantity}</span>
                                        <Button onClick={() => handleUpdateExtraQuantity(extra.ma_vt_more, 1)}>
                                            +
                                        </Button>
                                    </div>
                                    <span className="extra-price">
                                        {(extra.gia || extra.price)?.toLocaleString()}đ
                                    </span>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </li>

            <AddNoteAndExtrasModal
                isVisible={isModalVisible}
                onClose={() => setIsModalVisible(false)}
                orderIndex={index}
            />
        </>
    );
}