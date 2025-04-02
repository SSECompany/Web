import { EllipsisOutlined } from "@ant-design/icons";
import { Button, Dropdown, Menu } from "antd";
import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { formatNumber } from "../../../../app/hook/dataFormatHelper";
import { updateProductPrice } from "../../../../store/reducers/order";
import AddNoteAndExtrasModal from "./modal/AddNoteAndExtrasModal";
import "./OrderItem.css";

export default function OrderItem({ item, index, onUpdateQuantity, onDeleteItem, onAddNote }) {
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [priceInput, setPriceInput] = useState("");
    const dispatch = useDispatch();

    useEffect(() => {
        setPriceInput(item.don_gia?.toString() || "");
    }, [item.don_gia]);

    const handleAddNote = () => {
        onAddNote();
        setIsModalVisible(true);
    };

    const handleApplyVoucher = () => {
        dispatch(updateProductPrice({ index, newPrice: 0 }));
        setPriceInput("0");
    };

    const menu = (
        <Menu>
            <Menu.Item key="add-note" onClick={handleAddNote}>
                Ghi chú/Món thêm
            </Menu.Item>
            <Menu.Item key="apply-voucher" onClick={handleApplyVoucher}>
                Áp dụng voucher
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
                    <input
                        className="order-item-price-input"
                        type="text"
                        value={formatNumber(priceInput)}
                        onChange={(e) => {
                            const raw = e.target.value.replace(/[^0-9]/g, "");
                            setPriceInput(raw);
                        }}
                        onBlur={() => {
                            const numeric = parseInt(priceInput);
                            if (!isNaN(numeric)) {
                                dispatch(updateProductPrice({ index, newPrice: numeric }));
                                setPriceInput(formatNumber(numeric));
                            } else {
                                dispatch(updateProductPrice({ index, newPrice: 0 }));
                                setPriceInput(formatNumber(0));
                            }
                        }}
                        style={{ width: "90px", textAlign: "right", color: "#28a745" }}
                    />
                    <Dropdown overlay={menu} trigger={["click"]} placement="bottomRight">
                        <Button
                            type="text"
                            icon={<EllipsisOutlined style={{ fontSize: "20px" }} />}
                        />
                    </Dropdown>
                </div>

                {item.extras && item.extras.length > 0 && (
                    <ul className="order-item-extras">
                        {item.extras.map((extra) => {
                            return (
                                <li key={extra.ma_vt_more} className="order-extra-item">
                                    <span className="extra-name">+ {extra.ten_vt}</span>
                                    <span className="extra-quantity">{extra.quantity || extra.so_luong}</span>
                                    <span className="extra-price">
                                        {formatNumber(extra.gia || extra.don_gia)} đ
                                    </span>
                                </li>
                            );
                        })}
                    </ul>
                )}
                {item.ghi_chu && <div className="order-item-note">Ghi chú: {item.ghi_chu}</div>}

            </li>

            <AddNoteAndExtrasModal
                isVisible={isModalVisible}
                onClose={() => setIsModalVisible(false)}
                orderIndex={index}
            />
        </>
    );
}