import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { multipleTablePutApi } from "../../../../api";
import { removeProductFromTab, setListItemExtra, setSelectedItem, updateProductQuantity } from "../../../../store/reducers/order";
import OrderItem from "../OrderItem/OrderItem";
import "./OrderList.css";

export default function OrderList({ order }) {
    const dispatch = useDispatch();
    const activeTabId = useSelector((state) => state.orders.activeTabId);
    const { id, unitId } = useSelector((state) => state.claimsReducer.userInfo || {});

    const handleAddNote = async (item) => {
        dispatch(setSelectedItem(item));
        try {
            const res = await multipleTablePutApi({
                store: "api_getListItemMore",
                param: {
                    Currency: "VND",
                    item: item.ma_vt,
                    unitId: unitId,
                    userId: id,
                    pageindex: 1,
                    pagesize: 100,
                },
                data: {},
            });

            const data = res?.listObject[0]?.map((extra) => ({
                ...extra,
                selected: false,
                quantity: 1,
            })) || [];

            dispatch(setListItemExtra(data));
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    };

    const handleDeleteItem = (index) => {
        dispatch(removeProductFromTab({ tableId: activeTabId, productIndex: index }));
    };

    const handleUpdateQuantity = (index, increment) => {
        dispatch(updateProductQuantity({ tableId: activeTabId, productIndex: index, increment }));
    };

    return (
        <div >
            <div className="order-header">
                <span className="order-header-index">STT</span>
                <span className="order-header-name"> Sản phẩm</span>
                <span className="order-header-quantity">SL</span>
                <span className="order-header-price">Giá</span>
            </div>
            <ul className="order-list">
                {order.map((item, index) => (
                    <OrderItem
                        key={index}
                        item={item}
                        index={index}
                        onUpdateQuantity={handleUpdateQuantity}
                        onDeleteItem={() => handleDeleteItem(index)}
                        onAddNote={() => handleAddNote(item)}
                    />
                ))}
            </ul>

        </div >
    );
}