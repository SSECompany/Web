import { Button, Checkbox, Col, Input, Modal, Row } from "antd";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addExtrasToOrder } from "../../../../../store/reducers/order";
import "./AddNoteAndExtrasModal.css";
export default function AddNoteAndExtrasModal({ isVisible, onClose, orderIndex }) {
    const [note, setNote] = useState("");
    const [extras, setExtras] = useState([]);
    const dispatch = useDispatch();

    const selectedItem = useSelector((state) => state.orders.selectedItem);
    const listItemExtra = useSelector((state) => state.orders.listItemExtra);
    const orders = useSelector((state) => state.orders.orders);
    const activeTabId = useSelector((state) => state.orders.activeTabId);

    useEffect(() => {
        if (isVisible) {
            const currentTab = orders.find((tab) => tab.tableId === activeTabId) || {};
            const currentOrder = currentTab.detail?.[orderIndex] || {};
            const currentOrderExtras = currentOrder.extras || [];
            const savedNote = currentOrder.ghi_chu || "";

            setExtras((prevExtras) => {
                if (prevExtras.length > 0) return prevExtras;
                return listItemExtra.map((item) => {
                    const matchedExtra = currentOrderExtras.find(
                        (extra) => extra.ma_vt === item.ma_vt
                    );
                    return {
                        ...item,
                        selected: !!matchedExtra,
                        quantity: matchedExtra?.quantity || 1,
                    };
                });
            });
            setNote(savedNote);
        }
    }, [listItemExtra, orders, activeTabId]);



    const handleCheckboxChange = (id) => {
        setExtras((prevExtras) =>
            prevExtras.map((extra) =>
                extra.ma_vt_more === id
                    ? { ...extra, selected: !extra.selected }
                    : extra
            )
        );
    };


    const handleQuantityChange = (id, increment) => {
        setExtras((prevExtras) =>
            prevExtras.map((extra) =>
                (extra.ma_vt_more) === id
                    ? {
                        ...extra,
                        quantity: Math.max(1, extra.quantity + increment),
                    }
                    : extra
            )
        );
    };

    const handleSave = () => {
        const selectedExtras = extras.filter((extra) => extra.selected);
        dispatch(
            addExtrasToOrder({
                tableId: activeTabId,
                orderIndex,
                extras: selectedExtras.map((extra) => ({
                    ma_vt: extra.ma_vt,
                    ma_vt_more: extra.ma_vt_more,
                    ten_vt: extra.ten_vt,
                    gia: extra.gia,
                    quantity: extra.quantity,
                })),
                note,
            })
        );
        onClose();
    };



    return (
        <Modal
            title={` ${selectedItem?.ten_vt}`}
            visible={isVisible}
            onCancel={onClose}
            footer={[
                <Button key="cancel" onClick={onClose}>
                    Bỏ qua
                </Button>,
                <Button key="save" type="primary" onClick={handleSave}>
                    Lưu
                </Button>,
            ]}
            className="main-modal"
        >
            <div style={{ marginBottom: "20px" }}>
                <Input.TextArea
                    rows={3}
                    placeholder="Nhập ghi chú..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                />
            </div>
            <div className="popup-info">
                {extras.map((extra) => (
                    <Row
                        key={extra.ma_vt_more}
                        align="middle"
                        style={{ marginBottom: "10px" }}
                    >
                        <Col span={1}>
                            <Checkbox
                                checked={extra.selected}
                                onChange={() =>
                                    handleCheckboxChange(extra.ma_vt_more)
                                }
                                className="custom-checkbox"
                            />
                        </Col>
                        <Col span={14} style={{ paddingLeft: "5px" }}>
                            <span>{extra.ten_vt}</span>
                        </Col>
                        <Col span={4} style={{ textAlign: "center" }}>
                            <span>
                                {extra.price?.toLocaleString() || extra.gia?.toLocaleString() || "0"}đ
                            </span>
                        </Col>
                        <Col className="update-quantity" span={5} style={{ textAlign: "center" }}>
                            <Button
                                size="small"
                                onClick={() =>
                                    handleQuantityChange(extra.ma_vt_more, -1)
                                }
                                disabled={!extra.selected}
                            >
                                -
                            </Button>
                            <span style={{ margin: "0 10px" }}>{extra.quantity || 1}</span>
                            <Button
                                size="small"
                                onClick={() =>
                                    handleQuantityChange(extra.ma_vt_more, 1)
                                }
                                disabled={!extra.selected}
                            >
                                +
                            </Button>
                        </Col>
                    </Row>
                ))}
            </div>
        </Modal>
    );
}