 import * as signalR from "@microsoft/signalr";
import {
  DollarOutlined,
  FullscreenExitOutlined,
  FullscreenOutlined,
} from "@ant-design/icons";
import { Button, Modal, notification, Tabs, Tooltip } from "antd";
import React, { useCallback, useEffect, useReducer, useRef, useState } from "react";
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
import ShiftReportModal from "../../modules/order/components/ShiftReportModal/ShiftReportModal";
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
import IminPrinterService from "../../utils/IminPrinterService";
import "./POSPage.css";

/** Một kết nối SignalR duy nhất cho orderHub (Order + Print), tránh gọi negotiate nhiều lần */
const useOrderHubSignalR = (onNewOrder, onPrintResult, userId) => {
  const onNewOrderRef = React.useRef(onNewOrder);
  const onPrintResultRef = React.useRef(onPrintResult);
  onNewOrderRef.current = onNewOrder;
  onPrintResultRef.current = onPrintResult;

  useEffect(() => {
    if (!userId || userId === 0) return;
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${process.env.REACT_APP_ROOT_API}Hub/orderHub`)
      .withAutomaticReconnect()
      .build();

    connection.on("ReceiveNewOrder", (data) => {
      onNewOrderRef.current?.(data);
    });
    connection.on("ReceivePrintResult", (printData) => {
      if (printData && typeof printData === "object") {
        onPrintResultRef.current?.(printData);
      }
    });

    const startConnection = async () => {
      try {
        await connection.start();
        console.log("✅ Kết nối SignalR Order Hub thành công!");
        await connection.invoke("AddToGroup", "orderingArea");
        if (userId) {
          await connection.invoke("AddToGroup", `printResult_${userId}`);
        }
      } catch (err) {
        console.error("❌ SignalR Connection Error:", err);
        setTimeout(startConnection, 5000);
      }
    };

    startConnection();

    return () => {
      connection.off("ReceiveNewOrder");
      connection.off("ReceivePrintResult");
      connection.stop();
      console.log("🛑 SignalR Order Hub Disconnected!");
    };
  }, [userId]); // Chỉ tạo lại connection khi userId đổi, callbacks dùng ref
};

const modalReducer = (state, action) => {
  switch (action.type) {
    case "TOGGLE_ORDER_LIST":
      return { ...state, isOpenOrderList: !state.isOpenOrderList };
    case "TOGGLE_SELECT_TABLE":
      return { ...state, isModalVisible: !state.isModalVisible };
    case "TOGGLE_REPORT":
      return { ...state, isReportModalVisible: !state.isReportModalVisible };
    case "TOGGLE_SHIFT_REPORT":
      return { ...state, isShiftReportVisible: !state.isShiftReportVisible };
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
    isShiftReportVisible: false,
    isFamilyMealListVisible: false,
    isPrepaidStudentMealListVisible: false,
    isStudentMealListVisible: false,
  });
  const [drinkFilter, setDrinkFilter] = useState(null);
  const [salesStaff, setSalesStaff] = useState([]);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const onFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      const el = document.documentElement;
      if (el.requestFullscreen) el.requestFullscreen();
      else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
      else if (el.msRequestFullscreen) el.msRequestFullscreen();
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
      else if (document.msExitFullscreen) document.msExitFullscreen();
    }
  }, []);

  const [isOpeningDrawer, setIsOpeningDrawer] = useState(false);
  const handleOpenCashDrawer = useCallback(async () => {
    setIsOpeningDrawer(true);
    try {
      const printerService = new IminPrinterService();
      await printerService.initPrinter();
      await printerService.openCashBox();
      notification.success({
        message: "Mở két tiền",
        description: "Đã gửi lệnh mở két tiền.",
        duration: 2,
      });
    } catch (err) {
      notification.error({
        message: "Không mở được két tiền",
        description: err?.message || "Kiểm tra kết nối máy in / két tiền.",
        duration: 4,
      });
    } finally {
      setIsOpeningDrawer(false);
    }
  }, []);

  const { id, unitId } = useSelector(
    (state) => state.claimsReducer.userInfo || {}
  );
  const { orderId } = useParams();
  const location = useLocation();
  const isOrderPage = /^\/order(\/|$)/.test(location.pathname);
  const rawToken = localStorage.getItem("access_token");
  const claims =
    rawToken && rawToken.split(".").length === 3 ? jwt.getClaims?.() || {} : {};

  // Warmup máy in sớm để tránh bill đầu tiên rơi vào simulation (SDK iMin inject/service lên chậm)
  const printerWarmupRef = useRef({ started: false });
  useEffect(() => {
    if (!isOrderPage) return;
    if (printerWarmupRef.current.started) return;
    printerWarmupRef.current.started = true;

    let canceled = false;
    const t = setTimeout(async () => {
      try {
        const printerService = new IminPrinterService();
        const res = await printerService.initPrinter();
        if (!canceled) {
          // Không spam UI; chỉ log để debug khi cần
          console.log("🖨️ Printer warmup:", res?.message || res);
        }
      } catch (err) {
        if (!canceled) {
          console.warn("🖨️ Printer warmup failed:", err?.message || err);
        }
      }
    }, 300);

    return () => {
      canceled = true;
      clearTimeout(t);
    };
  }, [isOrderPage]);

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

      // [COMMENTED] Mỗi đơn mới từ SignalR → tạo 1 tab mới
      // dispatch(
      //   addTab({
      //     tableName: tableData.name,
      //     tableId: tableData.id,
      //     isRealtime: true,
      //     master: masterData,
      //     detail: groupedDetailData,
      //     unseen: true,
      //   })
      // );

      // setTimeout(() => {
      //   dispatch(
      //     addOrderFromSignal({
      //       tableId: tableData.id,
      //       detailData: groupedDetailData,
      //     })
      //   );
      // }, 100);
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

  useOrderHubSignalR(handleNewOrder, handlePrintResult, id);

  const fetchedKeyRef = React.useRef(null);

  useEffect(() => {
    if (!unitId || !id) return;
    const key = `${unitId}-${id}-${drinkFilter ?? "all"}`;
    if (fetchedKeyRef.current === key) return;
    fetchedKeyRef.current = key;

    const fetchData = async () => {
      try {
        const needTables = !listOrderTable || listOrderTable.length === 0;
        const categoryPromise = multipleTablePutApi({
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
        });
        const tablePromise = needTables
          ? multipleTablePutApi({
              store: "api_getListRestaurantTables",
              param: {
                searchValue: "",
                unitId: unitId,
                userId: id,
                pageindex: 1,
                pagesize: 100,
              },
              data: {},
            })
          : null;

        const [tableRes, categoryRes] = await Promise.all([
          tablePromise,
          categoryPromise,
        ]);

        if (needTables && tableRes?.listObject?.[0]) {
          const tableData = tableRes.listObject[0].map((item) => ({
            id: item.value,
            name: item.label,
          }));
          dispatch(setListOrderTable(tableData));
        }

        const categoryData =
          categoryRes?.listObject?.[0]?.map((item) => ({
            loai_nh: item.loai_nh,
            ma_nh: item.ma_nh,
            ten_nh: item.ten_nh,
          })) || [];
        dispatch(setListCategory(categoryData));
      } catch (err) {
        console.error("❌ Lỗi khi lấy dữ liệu:", err);
        fetchedKeyRef.current = null;
      }
    };

    fetchData();
  }, [unitId, id, dispatch, drinkFilter]);

  // Lấy danh sách nhân viên bán hàng - chỉ gọi 1 lần khi đã có userId hợp lệ
  useEffect(() => {
    // Kiểm tra SalesManDefault từ token
    const salesManDefault = claims?.SalesManDefault?.trim();
    
    // Nếu có SalesManDefault từ token, không cần gọi API
    if (salesManDefault) {
      // Tạo object nhân viên từ SalesManDefault
      const defaultStaff = [{
        ma_nvbh: salesManDefault,
        value: salesManDefault,
        id: salesManDefault,
        ten_nvbh: salesManDefault, // Có thể cần cập nhật sau nếu có thông tin tên
        label: salesManDefault,
        name: salesManDefault,
      }];
      setSalesStaff(defaultStaff);
      return;
    }

    // Nếu không có SalesManDefault, gọi API
    const fetchSalesStaff = async () => {
      try {
        const res = await multipleTablePutApi({
          store: "api_get_DMNVBH_Paging",
          param: {
            searchValue: "",
            userId: id,
            pageIndex: 1,
            pageSize: 20,
          },
          data: {},
        });

        const staffData = res?.listObject?.[0] || [];
        setSalesStaff(staffData);
      } catch (err) {
        console.error("❌ Lỗi khi lấy danh sách nhân viên bán hàng:", err);
      }
    };

    // Không gọi khi chưa có id hoặc đã load rồi
    if (!id || salesStaff.length > 0) return;

    fetchSalesStaff();
  }, [id, salesStaff.length, claims?.SalesManDefault]);

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

  const handleShiftReportModal = useCallback(() => {
    dispatchModal({ type: "TOGGLE_SHIFT_REPORT" });
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
              <Tooltip placement="topRight" title={isFullscreen ? "Thu nhỏ" : "Phóng to màn hình"}>
                <Button
                  className="default_button"
                  onClick={toggleFullscreen}
                  icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
                />
              </Tooltip>
              <Tooltip placement="topRight" title="Danh sách đơn">
                <Button
                  className="default_button"
                  onClick={handleOrderListModal}
                >
                  <i className="pi pi-list sub_text_color"></i>
                </Button>
              </Tooltip>
              {claims?.RoleWeb !== "isPosMini" && (
                <Tooltip placement="topRight" title="Bảng kê hóa đơn">
                  <Button
                    className="default_button"
                    onClick={handleReportModal}
                  >
                    <i className="pi pi-chart-line sub_text_color"></i>
                  </Button>
                </Tooltip>
              )}
              <Tooltip placement="topRight" title="Báo cáo chốt ca">
                <Button
                  className="default_button"
                  onClick={handleShiftReportModal}
                >
                  <i className="pi pi-print sub_text_color"></i>
                </Button>
              </Tooltip>
              <Tooltip placement="topRight" title="Mở két tiền">
                <Button
                  className="default_button"
                  loading={isOpeningDrawer}
                  onClick={handleOpenCashDrawer}
                  icon={<DollarOutlined />}
                />
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
            salesStaff={salesStaff}
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
        unitId={unitId}
        id={id}
      />
      <ShiftReportModal
        isOpen={modalState.isShiftReportVisible}
        onClose={handleShiftReportModal}
        unitId={unitId}
        userId={id}
        cashierName={claims?.FullName}
      />
      <Loading />
    </div>
  );
};

export default React.memo(POSPage);
