import * as signalR from "@microsoft/signalr";
import { Button, Tabs, Tooltip } from "antd";
import React, { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { multipleTablePutApi } from "../../api";
import Loading from "../../components/common/Loading/Loading";
import SelectTableModal from "../../components/common/Modal/ModalSelectTable";
import Navbar from "../../components/layout/Navbar/Navbar";
import Category from "../../modules/order/components/Category/Category";
import MenuGrid from "../../modules/order/components/Menu/MenuGrid";
import OrderList from "../../modules/order/components/OrderList/OrderList";
import OrderSummary from "../../modules/order/components/OrderSummary/OrderSummary";
import RetailOrderListModal from "../../modules/order/components/RetailOrderListModal/RetailOrderListModal";
import {
    addOrderFromSignal,
    addProductToTab,
    addTab,
    removeTab,
    setListCategory,
    setListOrderTable,
    switchTab
} from "../../store/reducers/order";
import jwt from "../../utils/jwt";
import "./POSPage.css";

const POSPage = () => {
    const dispatch = useDispatch();
    const { activeTabId, internalActiveTabId, orders } = useSelector((state) => state.orders);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isOpenOrderList, setIsOpenOrderList] = useState(false);

    const { id, unitId } = useSelector((state) => state.claimsReducer.userInfo || {});
    const { orderId } = useParams();

    const token = localStorage.getItem("access_token");
    const isOrderPage = window.location.pathname.includes("/order");

    useEffect(() => {
        const connection = new signalR.HubConnectionBuilder()
            .withUrl(`${process.env.REACT_APP_ROOT_API}Hub/orderHub`)
            .withAutomaticReconnect()
            .build();

        connection.on("ReceiveNewOrder", (orderData) => {
            if (!orderData || !orderData.master || !orderData.detail) {
                console.warn("⚠️ Dữ liệu đơn hàng không hợp lệ:", orderData);
                return;
            }

            const masterData = orderData.master[0] || {};
            const flatDetailData = orderData.detail || [];
            const groupedDetailData = [];
            const groupedMap = {};

            flatDetailData.forEach(item => {
                const { uniqueid, ma_vt_root } = item;

                if (ma_vt_root) {
                    if (groupedMap[uniqueid]) {
                        groupedMap[uniqueid].extras.push(item);
                    }
                } else {
                    const mainItem = { ...item, extras: [] };
                    groupedDetailData.push(mainItem);
                    groupedMap[uniqueid] = mainItem;
                }
            });

            const detailData = groupedDetailData;

            const tableData = {
                name: masterData.ma_ban ? `${masterData.ma_ban}` : "Đơn mới",
                id: masterData.ma_ban || `order_${Date.now()}`
            };

            dispatch(addTab({
                tableName: tableData.name,
                tableId: tableData.id,
                isRealtime: true,
                master: masterData,
                detail: detailData
            }));

            setTimeout(() => {
                dispatch(addOrderFromSignal({ tableId: tableData.id, detailData }));
            }, 100);
        });

        async function start() {
            try {
                if (token && !isOrderPage) {
                    await connection.start();
                    await connection.invoke("AddToGroup", "orderingArea");
                } else {
                    console.warn("⚠️ Không tham gia orderingArea do thiếu token hoặc đang ở trang /order");
                }
            } catch (err) {
                console.error("❌ SignalR Connection Error:", err);
                setTimeout(start, 5000);
            }
        }

        start();

        return () => {
            connection.off("ReceiveNewOrder");
            connection.stop();
            console.log("🛑 SignalR Disconnected!");
        };
    }, [dispatch]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [tableRes, categoryRes] = await Promise.all([
                    multipleTablePutApi({
                        store: "api_getListRestaurantTables",
                        param: {
                            searchValue: "",
                            unitId: unitId,
                            userId: id,
                            pageindex: 1,
                            pagesize: 100,
                        },
                        data: {},
                    }),
                    multipleTablePutApi({
                        store: "api_getListItemGroup",
                        param: {
                            searchValue: "",
                            unitId: unitId,
                            userId: id,
                            pageindex: 1,
                            pagesize: 1000,
                        },
                        data: {},
                    })
                ]);

                const tableData = tableRes?.listObject[0]?.map((item) => ({
                    id: item.value,
                    name: item.label,
                })) || [];

                const categoryData = categoryRes?.listObject[0]?.map((item) => ({
                    loai_nh: item.loai_nh,
                    ma_nh: item.ma_nh,
                    ten_nh: item.ten_nh,
                })) || [];

                dispatch(setListOrderTable(tableData));
                dispatch(setListCategory(categoryData));
            } catch (err) {
                console.error("❌ Lỗi khi lấy dữ liệu:", err);
            }
        };

        fetchData();
    }, [unitId, id, dispatch]);

    useEffect(() => {
        if (!internalActiveTabId && orders.length === 0) {
            const defaultId = orderId || "Đơn mới";
            const internalId = `${defaultId}_${Date.now()}`;
            dispatch(addTab({ tableName: defaultId, tableId: defaultId }));
            dispatch(switchTab(internalId));
        }
    }, [internalActiveTabId, orders, dispatch, orderId]);

    useEffect(() => {
        localStorage.setItem("pos_orders", JSON.stringify(orders));
        localStorage.setItem("pos_activeTabId", activeTabId || "");
    }, [orders, activeTabId]);

    useEffect(() => {
        const token = localStorage.getItem("token");
        const isOrderPage = window.location.pathname.includes("/order");

        document.body.classList.toggle("hide-tabs-and-buttons", isOrderPage && !token);
    }, []);

    const addNewTab = (tableData) => {
        dispatch(addTab({ tableName: tableData.name, tableId: tableData.id }));
        setIsModalVisible(false);
    };

    const removeTabHandler = (targetTableId) => {
        dispatch(removeTab({ tableId: targetTableId }));
    };

    const switchTabHandler = (internalId) => {
        dispatch(switchTab(internalId));
    };

    const addToOrder = (product) => {
        dispatch(addProductToTab({ tableId: activeTabId, product }));
    };

    const calculateTotal = () => {
        const tab = orders.find((tab) => tab.internalId === internalActiveTabId);
        return parseFloat(tab?.master?.tong_tien || 0);
    };

    const calculateItemCount = () => {
        const tab = orders.find((tab) => tab.internalId === internalActiveTabId);
        return parseInt(tab?.master?.tong_sl || 0);
    };

    const handleOrderListModal = useCallback(() => {
        setIsOpenOrderList(!isOpenOrderList);
    }, [isOpenOrderList]);

    return (
        <div div className="pos-page" >
            <div>
                {jwt.checkExistToken() && <Navbar />}
            </div>
            <div className="main-container">
                <div className="left-middle-panel">
                    <div className="tabs-menu-container">
                        <Tabs
                            type="editable-card"
                            activeKey={internalActiveTabId}
                            onChange={switchTabHandler}
                            onEdit={(targetKey, action) => {
                                if (action === "add") {
                                    setIsModalVisible(true);
                                } else {
                                    removeTabHandler(targetKey);
                                }
                            }}
                        >
                            {orders.map((tab) => (
                                <Tabs.TabPane tab={tab.tableName} key={tab.internalId} >
                                    <Category />
                                    <MenuGrid onAdd={addToOrder} />
                                </Tabs.TabPane>
                            ))}
                        </Tabs>
                    </div>

                    <div className="tool-tip">
                        <Tooltip placement="topRight" title="Danh sách đơn">
                            <Button className="default_button" onClick={handleOrderListModal} >
                                <i className="pi pi-list sub_text_color"></i>
                            </Button>
                        </Tooltip>
                    </div>
                </div>
                <div className="right-panel">
                    <OrderList
                        order={orders.find((tab) => tab.internalId === internalActiveTabId)?.detail || []}
                    />
                    <OrderSummary
                        total={calculateTotal()}
                        itemCount={calculateItemCount()}
                    />
                </div>
            </div>

            <SelectTableModal
                visible={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                onConfirm={addNewTab}
            />
            <RetailOrderListModal
                isOpen={isOpenOrderList}
                onClose={handleOrderListModal}
            />
            <Loading />
        </div >
    );
};

export default POSPage;