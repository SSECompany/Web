import * as signalR from "@microsoft/signalr";
import { Button, Tabs, Tooltip } from "antd";
import React, { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { multipleTablePutApi } from "../../../../api";
import Loading from "../../../../components/Loading/Loading";
import SelectTableModal from "../../../../components/Modal/ModalSelectTable";
import Navbar from "../../../../components/Navbar/Navbar";
import {
    addProductToTab,
    addTab,
    removeTab,
    setListCategory,
    setListOrderTable,
    switchTab
} from "../../../../store/reducers/order";
import jwt from "../../../../utils/jwt";
import Category from "../../components/Category/Category";
import MenuGrid from "../../components/Menu/MenuGrid";
import OrderList from "../../components/OrderList/OrderList";
import OrderSummary from "../../components/OrderSummary/OrderSummary";
import RetailOrderListModal from "../../components/RetailOrderListModal/RetailOrderListModal";
import "./POSPage.css";



const POSPage = () => {
    const dispatch = useDispatch();
    const { activeTabId, orders } = useSelector((state) => state.orders);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isOpenOrderList, setIsOpenOrderList] = useState(false);

    const { id, unitId } = useSelector((state) => state.claimsReducer.userInfo || {});

    useEffect(() => {
        const connection = new signalR.HubConnectionBuilder()
            .withUrl("https://api-phenika.sse.net.vn/api/Hub/orderHub")
            .withAutomaticReconnect()
            .build();

        connection.on("ReceiveNewOrder", (orderData) => {
            console.log("🔥 Nhận đơn hàng mới:", JSON.stringify(orderData));

            if (!orderData || !orderData.stt_rec) {
                console.warn("⚠️ Dữ liệu đơn hàng không hợp lệ:", orderData);
                return;
            }

            dispatch(addTab({
                tableName: `Đơn hàng ${orderData.stt_rec}`,
                tableId: orderData.stt_rec,
                master: {
                    dien_giai: orderData.dien_giai || "",
                    tong_tien: orderData.tong_tien || "0",
                    tong_sl: orderData.tong_sl || "0",
                    tong_tt: orderData.tong_tt || "0",
                    tien_mat: orderData.tien_mat || "0",
                    chuyen_khoan: orderData.chuyen_khoan || "0",
                    httt: orderData.httt || "",
                },
                detail: orderData.detail || []
            }));
        });

        async function start() {
            try {
                await connection.start();
                await connection.invoke("AddToGroup", "orderingArea");
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
        const fetchTableData = async () => {
            try {
                const res = await multipleTablePutApi({
                    store: "api_getListRestaurantTables",
                    param: {
                        searchValue: "",
                        unitId: unitId,
                        userId: id,
                        pageindex: 1,
                        pagesize: 100,
                    },
                    data: {},
                });
                const data = res?.listObject[0]?.map((item) => ({
                    id: item.value,
                    name: item.label,
                })) || [];
                dispatch(setListOrderTable(data));
            } catch (err) {
                console.error("❌ Lỗi khi lấy dữ liệu bàn:", err);
            }
        };

        const fetchCategoryData = async () => {
            try {
                const res = await multipleTablePutApi({
                    store: "api_getListItemGroup",
                    param: {
                        searchValue: "",
                        unitId: unitId,
                        userId: id,
                        pageindex: 1,
                        pagesize: 1000,
                    },
                    data: {},
                });
                const data = res?.listObject[0]?.map((item) => ({
                    loai_nh: item.loai_nh,
                    ma_nh: item.ma_nh,
                    ten_nh: item.ten_nh,
                })) || [];
                dispatch(setListCategory(data));
            } catch (err) {
                console.error("❌ Lỗi khi lấy dữ liệu danh mục:", err);
            }
        };

        fetchTableData();
        fetchCategoryData();
    }, [id, unitId, dispatch]);

    useEffect(() => {
        if (!activeTabId && orders.length === 0) {
            dispatch(
                addTab({
                    tableName: orders.tableName || "Đơn mới",
                    tableId: orders.tableName || "order",
                })
            );
        }
    }, [activeTabId, orders, dispatch]);

    const addNewTab = (tableData) => {
        dispatch(addTab({ tableName: tableData.name, tableId: tableData.id }));
        setIsModalVisible(false);
    };

    const removeTabHandler = (targetTableId) => {
        dispatch(removeTab({ tableId: targetTableId }));
    };

    const switchTabHandler = (tableId) => {
        dispatch(switchTab(tableId));
    };


    const addToOrder = (product) => {
        dispatch(addProductToTab({ tableId: activeTabId, product }));
    };

    const calculateTotal = () => {
        const tab = orders.find((tab) => {
            return tab.tableId === activeTabId
        })
        return parseFloat(tab?.master?.tong_tien || 0);
    };

    const calculateItemCount = () => {
        const tab = orders.find((tab) => tab.tableId === activeTabId);
        return parseInt(tab?.master?.tong_sl || 0);
    };

    const handleOrderListModal = useCallback(() => {
        setIsOpenOrderList(!isOpenOrderList);
    }, [isOpenOrderList]);


    useEffect(() => {
        localStorage.setItem("pos_orders", JSON.stringify(orders));
        localStorage.setItem("pos_activeTabId", activeTabId || "");
    }, [orders, activeTabId]);

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
                            activeKey={activeTabId}
                            onChange={switchTabHandler}
                            onEdit={(targetKey, action) => {
                                if (action === "add") {
                                    setIsModalVisible(true);
                                } else {
                                    removeTabHandler(targetKey);
                                }
                            }}
                            className="test"
                        >
                            {orders.map((tab) => (
                                <Tabs.TabPane tab={tab.tableName} key={tab.tableId}>
                                    <Category />
                                    <MenuGrid onAdd={addToOrder} />
                                </Tabs.TabPane>
                            ))}
                        </Tabs>
                    </div>

                    <div className="tool-tip">
                        {/* <Tooltip placement="topRight" title="Thanh toán">
                            <Button
                                className="default_button"
                                onClick={() => {
                                    const screenWidth = window.screen.width;
                                    const screenHeight = window.screen.height;
                                    const paymentWindow = window.open(
                                        "/transfer",
                                        "Thanh toán",
                                        `left=${screenWidth},top=0,width=1080,height=1920`
                                    );

                                    if (!paymentWindow) {
                                        alert("Vui lòng bật popup trên trình duyệt!");
                                    }
                                }}
                            >
                                <i className="pi pi-credit-card primary_color"></i>
                            </Button>
                        </Tooltip> */}

                        <Tooltip placement="topRight" title="Danh sách đơn">
                            <Button className="default_button" onClick={handleOrderListModal} >
                                <i className="pi pi-list sub_text_color"></i>
                            </Button>
                        </Tooltip>

                    </div>
                </div>
                <div className="right-panel">
                    <OrderList
                        order={orders.find((tab) => tab.tableId === activeTabId)?.detail || []}
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