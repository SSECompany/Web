// import * as signalR from "@microsoft/signalr";
import { Button, Modal, notification, Tabs, Tooltip } from "antd";
import React, { useCallback, useEffect, useReducer, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useParams } from "react-router-dom";
// Remove Navbar import - using DMS navbar
import { multipleTablePutApi } from "../../API/posApi";
import Category from "../../order/components/Category/Category";
import FamilyMealListModal from "../../order/components/FamilyMealListModal/FamilyMealListModal";
import MenuGrid from "../../order/components/Menu/MenuGrid";
import OrderList from "../../order/components/OrderList/OrderList";
import OrderSummary from "../../order/components/OrderSummary/OrderSummary";
import PrepaidStudentMealListModal from "../../order/components/PrepaidStudentMealListModal/PrepaidStudentMealListModal";
import ReportModal from "../../order/components/ReportModal/ReportModal";
import RetailOrderListModal from "../../order/components/RetailOrderListModal/RetailOrderListModal";
import StudentMealListModal from "../../order/components/StudentMealListModal/StudentMealListModal";
import Loading from "../../Utils/Loading/Loading";
import SelectTableModal from "../../Utils/Modal/ModalSelectTable";

import jwt from "../../../../utils/jwt";
import {
  // addOrderFromSignal, // COMMENTED OUT: SignalR functionality
  addProductToTab,
  addTab,
  clearTabData,
  removeTab,
  setListCategory,
  setListOrderTable,
  switchTab,
} from "../../Store/order";
import "./POSPage.css";

// COMMENTED OUT: SignalR realtime connection
/*
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
        console.log("✅ Kết nối SignalR Order Hub thành công!");
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
      console.log("🛑 SignalR Order Hub Disconnected!");
    };
  }, [onNewOrder]);
};
*/

// COMMENTED OUT: SignalR print connection
/*
const useSignalRPrintConnection = (onPrintResult, userId) => {
  useEffect(() => {
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${process.env.REACT_APP_ROOT_API}Hub/orderHub`)
      .withAutomaticReconnect()
      .build();

    // Log tất cả các event được nhận
    connection.onreconnecting((error) => {});

    connection.onreconnected((connectionId) => {});

    connection.onclose((error) => {});

    connection.on("ReceivePrintResult", (printData) => {
      // Kiểm tra xem data có null/undefined không
      if (!printData) {
        console.warn("⚠️ printData là null hoặc undefined");
        return;
      }

      // Kiểm tra xem có phải là object không
      if (typeof printData !== "object") {
        return;
      }

      onPrintResult(printData);
    });

    const startConnection = async () => {
      try {
        await connection.start();
        console.log("✅ Kết nối SignalR Print Hub thành công!");
        await connection.invoke("AddToGroup", `printResult_${userId}`);
      } catch (err) {
        console.error("❌ Lỗi kết nối Print SignalR Hub:", err);
        console.error("🔍 Chi tiết lỗi:", err.toString());
        console.error("📊 Error object:", {
          name: err.name,
          message: err.message,
          stack: err.stack,
        });
        console.log("⏰ Sẽ thử kết nối lại sau 5 giây...");
        setTimeout(startConnection, 5000);
      }
    };

    startConnection();

    return () => {
      connection.off("ReceivePrintResult");
      connection.stop();
      console.log("🛑 SignalR Print Hub Disconnected!");
    };
  }, [onPrintResult, userId]);
};
*/

const modalReducer = (state, action) => {
  switch (action.type) {
    case "TOGGLE_ORDER_LIST":
      return { ...state, isOpenOrderList: !state.isOpenOrderList };
    case "TOGGLE_SELECT_TABLE":
      return { ...state, isModalVisible: !state.isModalVisible };
    case "TOGGLE_REPORT":
      return { ...state, isReportModalVisible: !state.isReportModalVisible };
    case "TOGGLE_FAMILY_MEAL_LIST":
      return {
        ...state,
        isFamilyMealListVisible: !state.isFamilyMealListVisible,
      };
    case "TOGGLE_PREPAID_STUDENT_MEAL_LIST":
      return {
        ...state,
        isPrepaidStudentMealListVisible: !state.isPrepaidStudentMealListVisible,
      };
    case "TOGGLE_STUDENT_MEAL_LIST":
      return {
        ...state,
        isStudentMealListVisible: !state.isStudentMealListVisible,
      };
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
    isFamilyMealListVisible: false,
    isPrepaidStudentMealListVisible: false,
    isStudentMealListVisible: false,
  });
  const [drinkFilter, setDrinkFilter] = useState(null);

  const { id, unitId } = useSelector(
    (state) => state.claimsReducer?.userInfo || {}
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

      // COMMENTED OUT: SignalR order dispatch
      /*
      setTimeout(() => {
        dispatch(
          addOrderFromSignal({
            tableId: tableData.id,
            detailData: groupedDetailData,
          })
        );
      }, 100);
      */
    },
    [claims?.RoleWeb, dispatch, listOrderTable]
  );

  const handlePrintResult = useCallback((printData) => {
    // Kiểm tra nhiều trường hợp khác nhau
    const isSuccess =
      printData.isSucceded === true ||
      printData.isSucceded === "true" ||
      printData.isSucceded === 1 ||
      printData.isSucceded === "1" ||
      (typeof printData.isSucceded === "boolean" && printData.isSucceded) ||
      (typeof printData.isSucceded === "string" &&
        printData.isSucceded.toLowerCase() === "true");

    if (isSuccess) {
      try {
        notification.success({
          message: "In thành công",
          description: `Đã in thành công trên máy ${printData.ip}`,
          placement: "topRight",
          duration: 20,
          style: {
            borderRadius: "8px",
            border: "1px solid #52c41a",
          },
        });
      } catch (error) {
        console.error("❌ Lỗi khi hiển thị notification success:", error);
      }
    } else {
      console.log("❌ Print thất bại - Hiển thị notification error");

      try {
        // Hiển thị thông báo lỗi - người dùng tự đóng
        notification.error({
          message: "In thất bại",
          description:
            printData.message || `In thất bại tại máy ${printData.ip}`,
          placement: "topRight",
          duration: 0, // 0 = không tự tắt, người dùng tự đóng
          style: {
            borderRadius: "8px",
            border: "1px solid #ff4d4f",
          },
        });
        console.log("❌ Notification error đã được gọi");
      } catch (error) {
        console.error("❌ Lỗi khi hiển thị notification error:", error);
      }
    }
  }, []);

  // COMMENTED OUT: SignalR connections
  // useSignalRConnection(handleNewOrder);
  // useSignalRPrintConnection(handlePrintResult, id);

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

  // ✅ Removed auto-tab creation logic to avoid conflicts with DMS
  useEffect(() => {
    // Simple initialization - let DMS handle navigation
    if (orders.length === 0) {
      const timestamp = Date.now();
      dispatch(
        addTab({
          tableName: "POS",
          tableId: "POS",
          isRealtime: false,
        })
      );
    }
  }, [dispatch, orders.length]);

  // ✅ Removed localStorage and body class manipulation to avoid DMS conflicts

  // ✅ Removed blinking tabs logic to avoid DOM conflicts with DMS

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

  const handleFamilyMealList = useCallback(() => {
    dispatchModal({ type: "TOGGLE_FAMILY_MEAL_LIST" });
  }, []);

  const handlePrepaidStudentMealList = useCallback(() => {
    dispatchModal({ type: "TOGGLE_PREPAID_STUDENT_MEAL_LIST" });
  }, []);

  const handleStudentMealList = useCallback(() => {
    dispatchModal({ type: "TOGGLE_STUDENT_MEAL_LIST" });
  }, []);

  return (
    <div className="pos-page">
      {/* Using DMS navbar - no need to render navbar here */}
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
                      <MenuGrid
                        onAdd={addToOrder}
                        isReadOnlyMode={
                          (tab?.master?.isPrepaidStudent &&
                            tab?.master?.isReadOnly) ||
                          (tab?.metadata?.isPrepaidStudent &&
                            tab?.metadata?.isReadOnly) ||
                          (tab?.master?.isPostpaidStudent &&
                            tab?.master?.isReadOnly) ||
                          (tab?.metadata?.isPostpaidStudent &&
                            tab?.metadata?.isReadOnly) ||
                          tab?.metadata?.isConfirmed
                        }
                      />
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
              <Tooltip placement="topRight" title="Suất ăn người nhà bệnh nhân">
                <Button
                  className="default_button"
                  onClick={handleFamilyMealList}
                >
                  <i className="pi pi-users sub_text_color"></i>
                </Button>
              </Tooltip>
              <Tooltip
                placement="topRight"
                title="Suất ăn cho sinh viên trả trước"
              >
                <Button
                  className="default_button"
                  onClick={handlePrepaidStudentMealList}
                >
                  <i className="pi pi-credit-card sub_text_color"></i>
                </Button>
              </Tooltip>
              <Tooltip
                placement="topRight"
                title="Suất ăn cho sinh viên trả sau"
              >
                <Button
                  className="default_button"
                  onClick={handleStudentMealList}
                >
                  <i className="pi pi-calendar sub_text_color"></i>
                </Button>
              </Tooltip>
            </div>
          )}
        </div>
        <div className="right-panel">
          <OrderList
            order={
              orders.find((tab) => tab.internalId === internalActiveTabId)
                ?.detail || []
            }
            currentTab={orders.find(
              (tab) => tab.internalId === internalActiveTabId
            )}
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
      <FamilyMealListModal
        isOpen={modalState.isFamilyMealListVisible}
        onClose={handleFamilyMealList}
      />
      <PrepaidStudentMealListModal
        isOpen={modalState.isPrepaidStudentMealListVisible}
        onClose={handlePrepaidStudentMealList}
      />
      <StudentMealListModal
        isOpen={modalState.isStudentMealListVisible}
        onClose={handleStudentMealList}
      />
      <Loading />
    </div>
  );
};

export default React.memo(POSPage);
