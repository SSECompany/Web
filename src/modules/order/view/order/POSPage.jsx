import { Button, Tabs, Tooltip } from "antd";
import React, { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { multipleTablePutApi } from "../../../../api";
import Loading from "../../../../components/Loading/Loading";
import SelectTableModal from "../../../../components/modal/ModalSelectTable";
import {
    addProductToTab,
    addTab,
    removeTab,
    setListCategory,
    setListOrderInfo,
    setListOrderTable,
    switchTab
} from "../../../../store/reducers/order";
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

    useEffect(() => {
        const fetchTableData = async () => {
            try {
                const res = await multipleTablePutApi({
                    store: "api_getListRestaurantTables",
                    param: {
                        searchValue: "",
                        unitId: "1BVBD",
                        userId: 10036,
                        pageindex: 1,
                        pagesize: 10,
                    },
                    data: {},
                });
                const data = res?.listObject[0]?.map((item) => ({
                    id: item.value,
                    name: item.label,
                })) || [];
                dispatch(setListOrderTable(data));
            } catch (err) {
                console.error("Error fetching data:", err);
            }
        };
        fetchTableData();

        const fetchCategoryData = async () => {
            try {
                const res = await multipleTablePutApi({
                    store: "api_getListItemGroup",
                    param: {
                        searchValue: "",
                        unitId: "1BVBD",
                        userId: 10036,
                        pageindex: 1,
                        pagesize: 10,
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
                console.error("Error fetching data:", err);
            }
        };

        fetchCategoryData();

        const fetchListOrderData = async () => {
            try {
                const res = await multipleTablePutApi({
                    store: "api_get_retail_order",
                    param: {
                        so_ct: "",
                        ngay_ct: "",
                        ma_kh: "",
                        ten_kh: "",
                        dien_thoai: "",
                        pageIndex: 1,
                        pageSize: 10,
                        userId: 10036,
                        storeId: "",
                        unitId: "1BVBD "
                    },
                    data: {},
                });
                const data = res?.listObject[0];

                dispatch(setListOrderInfo(data));
            } catch (err) {
                console.error("Error fetching data:", err);
            }
        };
        fetchListOrderData();
    }, [dispatch]);

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
        <div className="pos-page">
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
                        >
                            {orders.map((tab) => (
                                <Tabs.TabPane tab={tab.tableName} key={tab.tableId}>
                                    <Category />
                                    <MenuGrid onAdd={addToOrder} />
                                </Tabs.TabPane>
                            ))}
                        </Tabs>
                    </div>

                    {/* Tool-tip Div */}
                    <div className="tool-tip">
                        <Tooltip placement="topRight" title="Thanh toán">
                            <Button
                                className="default_button"
                                onClick={() => {
                                    window.open(
                                        `${window.location.origin}/transfer`,
                                        "Thanh toán",
                                        `screenX=1,screenY=1,left=1,top=1,menubar=0,height=${window.screen.height},width=${window.screen.width}`
                                    );
                                }}
                            >
                                <i className="pi pi-credit-card primary_color"></i>
                            </Button>
                        </Tooltip>

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
        </div>
    );
};

export default POSPage;