import * as signalR from "@microsoft/signalr";
import { Button, Modal, Tabs, Tooltip } from "antd";
import React, { useCallback, useEffect, useReducer, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useParams } from "react-router-dom";
import { multipleTablePutApi } from "../../api";
import Loading from "../../components/common/Loading/Loading";
import SelectTableModal from "../../components/common/Modal/ModalSelectTable";
import Navbar from "../../components/layout/Navbar/Navbar";
import Category from "../../modules/order/components/Category/Category";
import MenuGrid from "../../modules/order/components/Menu/MenuGrid";
import OrderList from "../../modules/order/components/OrderList/OrderList";
import OrderSummary from "../../modules/order/components/OrderSummary/OrderSummary";
import ReportModal from "../../modules/order/components/ReportModal/ReportModal";
import RetailOrderListModal from "../../modules/order/components/RetailOrderListModal/RetailOrderListModal";

import {
  addOrderFromSignal,
  addProductToTab,
  addTab,
  clearTabData,
  removeTab,
  setListCategory,
  setListOrderTable,
  switchTab,
} from "../../modules/order/store/order";
import jwt from "../../utils/jwt";
import "./POSPage.css";

// Custom hook for SignalR connection
const useSignalRConnection = (onNewOrder) => {
  useEffect(() => {
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${process.env.REACT_APP_ROOT_API}Hub/orderHub`)
      .withAutomaticReconnect()
      .build();

    connection.on("ReceiveNewOrder", onNewOrder);

    const startConnection = async () => {
      try {
        await connection.start();
        await connection.invoke("AddToGroup", "orderingArea");
      } catch (err) {
        console.error("❌ SignalR Connection Error:", err);
        setTimeout(startConnection, 5000);
      }
    };

    startConnection();

    return () => {
      connection.off("ReceiveNewOrder");
      connection.stop();
      console.log("🛑 SignalR Disconnected!");
    };
  }, [onNewOrder]);
};

// State reducer
const modalReducer = (state, action) => {
  switch (action.type) {
    case "TOGGLE_ORDER_LIST":
      return { ...state, isOpenOrderList: !state.isOpenOrderList };
    case "TOGGLE_SELECT_TABLE":
      return { ...state, isModalVisible: !state.isModalVisible };
    case "TOGGLE_REPORT":
      return { ...state, isReportModalVisible: !state.isReportModalVisible };
    default:
      return state;
  }
};

const POSPage = () => {
  const dispatch = useDispatch();
  const { activeTabId, internalActiveTabId, orders } = useSelector(
    (state) => state.orders
  );
  const [modalState, dispatchModal] = useReducer(modalReducer, {
    isModalVisible: false,
    isOpenOrderList: false,
    isReportModalVisible: false,
  });
  const [drinkFilter, setDrinkFilter] = useState(null);

  const { id, unitId } = useSelector(
    (state) => state.claimsReducer.userInfo || {}
  );
  const { orderId } = useParams();
  const location = useLocation();
  const isOrderPage = /^\/order(\/|$)/.test(location.pathname);
  const rawToken = localStorage.getItem("access_token");
  const claims =
    rawToken && rawToken.split(".").length === 3 ? jwt.getClaims?.() || {} : {};

  const listOrderTable = useSelector(
    (state) => state.orders.listOrderTable || []
  );

  const handleNewOrder = useCallback(
    (orderData) => {
      const isPos = claims?.RoleWeb === "isPos";
      if (!isPos || !orderData?.master || !orderData?.detail) {
        console.warn("⚠️ Invalid order data or not POS role:", orderData);
        return;
      }

      const masterData = orderData.master[0] || {};
      const flatDetailData = orderData.detail || [];
      const groupedDetailData = [];
      const groupedMap = {};

      flatDetailData.forEach((item) => {
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

      // Lấy label từ listOrderTable nếu có
      let tableLabel = masterData.ma_ban;
      if (masterData.ma_ban && listOrderTable.length > 0) {
        const found = listOrderTable.find(
          (t) => t.id === masterData.ma_ban || t.value === masterData.ma_ban
        );
        if (found) tableLabel = found.name || found.label || masterData.ma_ban;
      }

      const tableData = {
        name: tableLabel ? `${tableLabel}` : "POS",
        id: masterData.ma_ban || `order_${Date.now()}`,
      };

      dispatch(
        addTab({
          tableName: tableData.name,
          tableId: tableData.id,
          isRealtime: true,
          master: masterData,
          detail: groupedDetailData,
          unseen: true,
        })
      );

      setTimeout(() => {
        dispatch(
          addOrderFromSignal({
            tableId: tableData.id,
            detailData: groupedDetailData,
          })
        );
      }, 100);
    },
    [claims?.RoleWeb, dispatch, listOrderTable]
  );

  useSignalRConnection(handleNewOrder);

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
              ...(drinkFilter !== null && { do_uong_yn: drinkFilter }),
            },
            data: {},
          }),
        ]);

        const tableData =
          tableRes?.listObject[0]?.map((item) => ({
            id: item.value,
            name: item.label,
          })) || [];

        const categoryData =
          categoryRes?.listObject[0]?.map((item) => ({
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
  }, [unitId, id, dispatch, drinkFilter]);

  useEffect(() => {
    const timestamp = Date.now();
    const token = localStorage.getItem("access_token");
    const isTokenValid = jwt.checkExistToken() && token;

    if (
      !isTokenValid &&
      orderId &&
      !internalActiveTabId &&
      orders.length === 0
    ) {
      const tableId = orderId;
      const tableLabel = localStorage.getItem("pos_table_label") || orderId;
      const internalId = `${tableId}_${timestamp}`;
      dispatch(
        addTab({ tableName: tableLabel, tableId: tableId, isRealtime: false })
      );
      dispatch(switchTab(internalId));
      localStorage.removeItem("pos_table_label");
      return;
    }

    if (isTokenValid && !internalActiveTabId && orders.length === 0) {
      const roleWeb = claims?.RoleWeb;
      let tableId, tableName;

      if (roleWeb === "isPosMini") {
        tableId = "POS_Mini";
        tableName = "POS Mini";
      } else {
        tableId = "POS";
        tableName = "POS";
      }

      const internalId = `${tableId}_${timestamp}`;
      dispatch(addTab({ tableName, tableId, roleWeb, isRealtime: false }));
      dispatch(switchTab(internalId));
    }
  }, [internalActiveTabId, orders, dispatch, claims, orderId]);

  useEffect(() => {
    localStorage.setItem("pos_orders", JSON.stringify(orders));
    localStorage.setItem("pos_activeTabId", activeTabId || "");
  }, [orders, activeTabId]);

  useEffect(() => {
    const isOrderPage = window.location.pathname.includes("/order");
    document.body.classList.toggle("hide-tabs-and-buttons", isOrderPage);
  }, []);

  // Đảm bảo hiệu ứng viền ngoài tab hoạt động với mọi trường hợp
  useEffect(() => {
    setTimeout(() => {
      const tabEls = document.querySelectorAll(".ant-tabs-tab");
      tabEls.forEach((el, idx) => {
        const tab = orders[idx];
        if (tab && tab.unseen) {
          el.classList.add("blinking-tab");
        } else {
          el.classList.remove("blinking-tab");
        }
      });
    }, 0);
  }, [orders]);

  const addNewTab = (tableData) => {
    dispatch(addTab({ tableName: tableData.name, tableId: tableData.id }));
    dispatchModal({ type: "TOGGLE_SELECT_TABLE" });
  };

  const removeTabHandler = (targetTableId) => {
    const targetTab = orders.find((tab) => tab.internalId === targetTableId);

    if (!targetTab) return;

    const isPOS = targetTab?.tableId === "POS";
    const isDefaultPOS =
      isPOS && (!targetTab.master?.stt_rec || targetTab.master?.stt_rec === "");
    const confirmTitle = isPOS ? "Xác nhận xóa dữ liệu" : "Xác nhận đóng tab";
    const confirmContent = isPOS
      ? "Bạn có chắc muốn xoá toàn bộ dữ liệu của tab POS?"
      : `Bạn có chắc muốn đóng tab "${targetTab.tableName}"?`;

    Modal.confirm({
      title: confirmTitle,
      content: confirmContent,
      okText: "Xác nhận",
      cancelText: "Hủy",
      onOk: () => {
        if (isDefaultPOS) {
          dispatch(clearTabData(targetTableId));
        } else {
          dispatch(removeTab({ internalId: targetTableId }));
        }
      },
    });
  };

  const switchTabHandler = (internalId) => {
    dispatch(switchTab(internalId));
  };

  const addToOrder = (product) => {
    dispatch(addProductToTab({ internalId: internalActiveTabId, product }));
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
    dispatchModal({ type: "TOGGLE_ORDER_LIST" });
  }, []);

  const handleReportModal = useCallback(() => {
    dispatchModal({ type: "TOGGLE_REPORT" });
  }, []);

  const handleSelectTableModal = useCallback(() => {
    dispatchModal({ type: "TOGGLE_SELECT_TABLE" });
  }, []);

  return (
    <div className="pos-page">
      <div>{jwt.checkExistToken() && <Navbar />}</div>
      <div className="main-container">
        <div className="left-middle-panel">
          <div className="tabs-menu-container">
            <div className="custom-tabs">
              <Tabs
                type="editable-card"
                activeKey={internalActiveTabId}
                onChange={switchTabHandler}
                onEdit={(targetKey, action) => {
                  if (action === "add") {
                    dispatchModal({ type: "TOGGLE_SELECT_TABLE" });
                  } else {
                    removeTabHandler(targetKey);
                  }
                }}
                items={orders.map((tab) => ({
                  key: tab.internalId,
                  label: tab.tableName,
                  className: tab.unseen ? "blinking-tab" : "",
                  children: (
                    <>
                      <Category
                        drinkFilter={drinkFilter}
                        setDrinkFilter={setDrinkFilter}
                      />
                      <MenuGrid onAdd={addToOrder} />
                    </>
                  ),
                }))}
              ></Tabs>
            </div>
          </div>

          {!isOrderPage && (
            <div className="tool-tip">
              <Tooltip placement="topRight" title="Danh sách đơn">
                <Button
                  className="default_button"
                  onClick={handleOrderListModal}
                >
                  <i className="pi pi-list sub_text_color"></i>
                </Button>
              </Tooltip>
              {claims?.RoleWeb !== "isPosMini" && (
                <Tooltip placement="topRight" title="Báo cáo kết ca">
                  <Button
                    className="default_button"
                    onClick={handleReportModal}
                  >
                    <i className="pi pi-chart-line sub_text_color"></i>
                  </Button>
                </Tooltip>
              )}
            </div>
          )}
        </div>
        <div className="right-panel">
          <OrderList
            order={
              orders.find((tab) => tab.internalId === internalActiveTabId)
                ?.detail || []
            }
          />
          <OrderSummary
            total={calculateTotal()}
            itemCount={calculateItemCount()}
          />
        </div>
      </div>

      <SelectTableModal
        visible={modalState.isModalVisible}
        onCancel={handleSelectTableModal}
        onConfirm={addNewTab}
      />
      <RetailOrderListModal
        isOpen={modalState.isOpenOrderList}
        onClose={handleOrderListModal}
      />
      <ReportModal
        isOpen={modalState.isReportModalVisible}
        onClose={handleReportModal}
      />
      <Loading />
    </div>
  );
};

export default React.memo(POSPage);
