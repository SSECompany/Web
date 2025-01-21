import { Tabs } from "antd";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { multipleTablePutApi } from "../../../../api";
import Loading from "../../../../components/Loading/Loading";
import SelectTableModal from "../../../../components/modal/ModalSelectTable";
import {
    addProductToTab,
    addTab,
    removeTab,
    setListCategory,
    setListOrderTable,
    switchTab
} from "../../../../store/reducers/order";
import Category from "../../components/Category/Category";
import MenuGrid from "../../components/Menu/MenuGrid";
import OrderList from "../../components/OrderList/OrderList";
import OrderSummary from "../../components/OrderSummary/OrderSummary";
import "./POSPage.css";

const POSPage = () => {
    const dispatch = useDispatch();
    const { activeTabId, orders } = useSelector((state) => state.orders);
    const [isModalVisible, setIsModalVisible] = useState(false);

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
    }, [dispatch]);

    useEffect(() => {
        if (!activeTabId && orders.length === 0) {
            dispatch(
                addTab({
                    tableName: "Đơn mới",
                    tableId: "order",
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
    return (
        <div className="pos-page">
            <div className="main-container">
                <div className="left-middle-panel">
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
            <Loading />
        </div>
    );
};

export default POSPage;