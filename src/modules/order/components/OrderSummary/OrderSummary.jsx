import { LoadingOutlined } from "@ant-design/icons";
import { message as messageAPI, Modal, notification } from "antd";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useReactToPrint } from "react-to-print";
import { multipleTablePutApi } from "../../../../api";
import jwt from "../../../../utils/jwt";
import {
  addTab,
  clearTabData,
  removeTab,
  switchTab,
  updateTabExtraProps,
} from "../../store/order";
import CustomerPaymentModal from "./CustomerPaymentModal/CustomerPaymentModal";
import MergeOrder from "./MergeOrders/MergeOrder";
import "./OrderSummary.css";
import PaymentModal from "./PaymentModal/PaymentModal";
import PrintComponent from "./PrintComponent/PrintComponent";

// ✅ PERFORMANCE OPTIMIZATION: Cached network check
let _networkCheckCache = null;
let _lastNetworkCheck = 0;
const NETWORK_CHECK_CACHE_DURATION = 10000; // 10 seconds

const checkInternetConnection = async () => {
  const now = Date.now();

  // Return cached result if still valid
  if (
    _networkCheckCache !== null &&
    now - _lastNetworkCheck < NETWORK_CHECK_CACHE_DURATION
  ) {
    return _networkCheckCache;
  }

  try {
    if (!navigator.onLine) {
      _networkCheckCache = false;
      _lastNetworkCheck = now;
      return false;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const response = await fetch("https://www.google.com/favicon.ico", {
      method: "HEAD",
      mode: "no-cors",
      signal: controller.signal,
      cache: "no-cache",
    });

    clearTimeout(timeoutId);

    _networkCheckCache = true;
    _lastNetworkCheck = now;
    return true;
  } catch (error) {
    _networkCheckCache = false;
    _lastNetworkCheck = now;
    return false;
  }
};

const showOfflineWarning = () => {
  notification.warning({
    message: "Không có kết nối internet!",
    description: "Vui lòng kiểm tra kết nối mạng và thử lại.",
    duration: 5,
  });
};

const generateRandomId = () =>
  Array.from({ length: 16 }, () =>
    Math.floor(Math.random() * 36).toString(36)
  ).join("");

// Helper function để gọi trực tiếp API syncFast với tracking
const callSyncFastApi = async (sttRec, userId) => {
  // Tạo lock để track
  const syncPromise = (async () => {
    try {
      const { syncFastApi } = await import("../../../../api");
      const result = await syncFastApi(sttRec, userId);
      return { success: true, result };
    } catch (error) {
      return { success: false, error };
    }
  })();

  try {
    const result = await syncPromise;
    return result;
  } finally {
  }
};

// Helper function để gọi trực tiếp API print-order với tracking
const callPrintOrderApi = async (sttRec, userId) => {
  // Tạo lock để track
  const printPromise = (async () => {
    try {
      const { printOrderApi } = await import("../../../../api");
      const result = await printOrderApi(sttRec, userId);
      return { success: true, result };
    } catch (error) {
      return { success: false, error };
    }
  })();

  try {
    const result = await printPromise;
    return result;
  } finally {
  }
};

// Helper function để chạy song song print-order và InvoiceReceipt
const runParallelTasks = async (sttRec, userId, sync = true) => {
  const parallelTasks = [];

  // Thêm task đồng bộ (nếu có)
  if (sync) {
    const syncTask = callSyncFastApi(sttRec, userId)
      .then((result) => {
        // Đã loại bỏ logic mark
        return { type: "sync", success: result.success, result: result.result };
      })
      .catch((syncError) => {
        // Đã loại bỏ logic mark
        return { type: "sync", success: false, error: syncError };
      });

    parallelTasks.push(syncTask);
  }

  // Thêm task in order - GỌI TRỰC TIẾP API
  const printTask = callPrintOrderApi(sttRec, userId)
    .then((result) => {
      // Đã loại bỏ logic mark
      return { type: "print", success: result.success, result: result.result };
    })
    .catch((printError) => {
      // Đã loại bỏ logic mark
      notification.error({
        message: "Có lỗi xảy ra khi in đơn hàng!",
        description: printError.message,
      });
      return { type: "print", success: false, error: printError };
    });

  parallelTasks.push(printTask);

  // Chạy tất cả tasks SONG SONG
  return Promise.allSettled(parallelTasks)
    .then((results) => {
      return results;
    })
    .catch((error) => {
      throw error;
    });
};

export default function OrderSummary({ total, itemCount }) {
  const dispatch = useDispatch();
  const { internalActiveTabId, orders } = useSelector((state) => state.orders);
  const { id, storeId, unitId } = useSelector(
    (state) => state.claimsReducer.userInfo || {}
  );
  const rawToken = localStorage.getItem("access_token");
  const claims =
    rawToken && rawToken.split(".").length === 3 ? jwt.getClaims?.() || {} : {};
  const roleWeb = claims?.RoleWeb;

  const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);
  const [isCustomerPaymentModalVisible, setIsCustomerPaymentModalVisible] =
    useState(false);
  const [message, contextHolder] = messageAPI.useMessage();
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const printContent = useRef();
  const [printMaster, setPrintMaster] = useState({});
  const [printDetail, setPrintDetail] = useState([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isPrinted, setIsPrinted] = useState(false);
  const [isMergeModalVisible, setIsMergeModalVisible] = useState(false);
  const [isCombining, setIsCombining] = useState(false);
  const [currentPrintData, setCurrentPrintData] = useState(null);
  const [hasReprinted, setHasReprinted] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const activeTab = orders?.find(
    (tab) => tab.internalId === internalActiveTabId
  );

  // Kiểm tra xem có phải khách hàng truy cập từ QR không
  const isCustomerQR = () => {
    const path = window.location.pathname;
    const search = window.location.search;
    const isOrderPath = /^\/order\/[\w-]+(\?ma_qr=[\w-]+)?$/.test(path);
    const hasQRParam = search.includes("ma_qr=");
    const noToken = !localStorage.getItem("access_token");

    return isOrderPath && hasQRParam && noToken;
  };

  useEffect(() => {
    if (activeTab && activeTab.autoOpenPayment) {
      // Kiểm tra xem có phải khách hàng QR không
      if (isCustomerQR()) {
        setIsCustomerPaymentModalVisible(true);
      } else {
        setIsPaymentModalVisible(true);
      }
      dispatch(
        updateTabExtraProps({
          internalId: activeTab.internalId,
          autoOpenPayment: false,
        })
      );
    }
  }, [activeTab, dispatch]);

  const generateOrderData = (
    status = "0",
    selectedPayments = [],
    paymentAmounts = {},
    customerInfo = {},
    sync = true
  ) => {
    if (!activeTab) {
      message.warning("Không có dữ liệu!");
      return null;
    }

    let finalTienMat = 0;
    let finalChuyenKhoan = 0;
    const totalAmount = Number(activeTab?.master?.tong_tien || 0);

    if (selectedPayments.length === 1) {
      if (selectedPayments[0] === "tien_mat") {
        finalTienMat = totalAmount;
      } else {
        finalChuyenKhoan = totalAmount;
      }
    } else {
      finalChuyenKhoan = Number(paymentAmounts.chuyen_khoan || 0);
      finalTienMat = totalAmount - finalChuyenKhoan;
    }

    const masterData = {
      ma_ban: activeTab?.tableId,
      dien_giai: activeTab?.master?.dien_giai || "",
      tong_tien: totalAmount.toString(),
      tong_sl: Number(activeTab?.master?.tong_sl || 0).toString(),
      tien_mat: finalTienMat.toString(),
      chuyen_khoan: finalChuyenKhoan.toString(),
      tong_tt: totalAmount.toString(),
      httt: selectedPayments.join(","),
      stt_rec: activeTab?.master?.stt_rec || "",
      status,
      cccd: customerInfo.cccd ?? activeTab?.master?.cccd ?? "",
      ong_ba:
        customerInfo.ong_ba?.trim() || activeTab?.master?.ong_ba?.trim() || "",
      so_dt: customerInfo.so_dt ?? activeTab?.master?.so_dt ?? "",
      dia_chi: customerInfo.dia_chi ?? activeTab?.master?.dia_chi ?? "",
      email: customerInfo.email ?? activeTab?.master?.email ?? "",
      ma_so_thue_kh:
        customerInfo.ma_so_thue_kh ?? activeTab?.master?.ma_so_thue_kh ?? "",
      ten_dv_kh: customerInfo.ten_dv_kh ?? activeTab?.master?.ten_dv_kh ?? "",
      s3: sync ? "1" : "0",
    };

    const detailData = activeTab?.detail?.flatMap((item) => {
      const uniqueid = item.uniqueid || generateRandomId();
      const mainItem = {
        ten_vt: item.ten_vt,
        ma_vt_root: item.ma_vt_root || "",
        ma_vt: item.ma_vt,
        so_luong: (item.so_luong || 0).toString(),
        don_gia: (item.don_gia || 0).toString(),
        thanh_tien: ((item.so_luong || 0) * (item.don_gia || 0)).toString(),
        ghi_chu: item.ghi_chu || "",
        uniqueid,
        ap_voucher: item.ap_voucher || "0",
      };
      const extras = (item.extras || []).map((extra) => {
        const quantity = parseFloat(extra.quantity || extra.so_luong || 0);
        const price = parseFloat(extra.gia || extra.don_gia || 0);
        const amount = quantity * price * (item.so_luong || 0);

        return {
          ten_vt: extra.ten_vt,
          ma_vt_root: item.ma_vt,
          ma_vt: extra.ma_vt_more || extra.ma_vt,
          so_luong: (quantity * (item.so_luong || 0)).toString(),
          don_gia: price.toString(),
          thanh_tien: amount.toString(),
          uniqueid,
        };
      });
      return [mainItem, ...extras];
    });

    if (!detailData?.length) {
      message.warning("Vui lòng thêm vật tư!");
      return null;
    }

    return { masterData, detailData };
  };

  const handleSendOrderDirectly = async (isSaveOnly = false) => {
    const hasInternet = await checkInternetConnection();
    if (!hasInternet) {
      showOfflineWarning();
      return;
    }

    const orderData = generateOrderData();
    if (!orderData) return;

    if (isSaveOnly) {
      orderData.masterData.tien_mat = "";
      orderData.masterData.chuyen_khoan = "";
      orderData.masterData.tong_tt = "";
      orderData.masterData.httt = "";
      orderData.masterData.s3 = "0";
    }

    setIsCreatingOrder(true);
    try {
      const payload = {
        store: "Api_create_retail_order",
        param: { StoreID: storeId, unitId: unitId, userId: id },
        data: { master: [orderData.masterData], detail: orderData.detailData },
      };

      const response = await multipleTablePutApi(payload);
      if (response?.responseModel?.isSucceded) {
        const sttRec = response?.listObject[0][0]?.stt_rec;

        if (sttRec) {
          // Đã loại bỏ logic mark pending

          // BƯỚC 2: Bật hộp thoại in NGAY LẬP TỨC
          if (!isSaveOnly) {
            setPrintMaster(orderData.masterData);
            setPrintDetail(orderData.detailData);
            setCurrentPrintData({
              master: orderData.masterData,
              detail: orderData.detailData,
              sttRec,
              sync: true,
            });
            setHasReprinted(false);
            setIsPrinting(true);
            setIsPrinted(false);
          }

          // BƯỚC 3: Chạy InvoiceReceipt và print-order trong background
          if (!isSaveOnly) {
            runParallelTasks(sttRec, id, true)
              .then((results) => {
                // Silent success - chạy background
              })
              .catch((error) => {
                // Silent error - already handled by simpleSyncGuard and printOrderGuard
              });
          }

          notification.success({
            message: isSaveOnly
              ? "Đã lưu đơn hàng thành công!"
              : "Đơn hàng đã được tạo thành công!",
            duration: 4,
          });

          if (isSaveOnly) {
            setTimeout(() => {
              dispatch(clearTabData(internalActiveTabId));
              dispatch(removeTab({ internalId: internalActiveTabId }));
            }, 500);
          }
        }
      } else {
        notification.warning({ message: response?.responseModel?.message });
      }
    } catch (error) {
      notification.error({
        message: "Có lỗi xảy ra!",
        description: error.message,
      });
    }
    setIsCreatingOrder(false);
  };

  const handleSaveOrder = async () => {
    setIsPrinting(false);

    const sttRec = currentPrintData?.sttRec;
    const sync = currentPrintData?.sync;

    if (sttRec) {
      // Không hiển thị thông báo về trạng thái đồng bộ và in
    }

    setCurrentPrintData(null);
    setHasReprinted(false);
    setIsProcessingPayment(false); // ✅ Reset trạng thái thanh toán khi hoàn tất
    dispatch(clearTabData(internalActiveTabId));
    dispatch(removeTab({ internalId: internalActiveTabId }));
  };

  let hasPrinted = false;

  const handleReprint = () => {
    if (currentPrintData) {
      setPrintMaster(currentPrintData.master);
      setPrintDetail(currentPrintData.detail);
      setIsPrinting(true);
      setIsPrinted(false);
    }
  };

  const handlePrint = useReactToPrint({
    content: () => {
      return printContent.current;
    },
    documentTitle: "Print This Document",
    copyStyles: false,
    onAfterPrint: () => {
      if (!hasPrinted) {
        hasPrinted = true;
        setIsPrinting(false);

        if (currentPrintData && !hasReprinted) {
          Modal.confirm({
            title: "In thêm bản khác?",
            content: "Bạn có muốn in thêm một bản nữa không?",
            onOk: () => {
              setHasReprinted(true);
              handleReprint();
            },
            onCancel: () => {
              setTimeout(() => handleSaveOrder(), 100);
            },
            okText: "In thêm",
            cancelText: "Đóng",
          });
        } else {
          setTimeout(() => handleSaveOrder(), 100);
        }
      }
    },
  });

  useEffect(() => {
    if (isPrinting && !isPrinted) {
      hasPrinted = false;
      handlePrint();
    } else {
    }
  }, [printMaster, printDetail, isPrinting, isPrinted]);

  const handleOpenPaymentModal = () => {
    if (isProcessingPayment) {
      return; // ✅ Không mở modal nếu đang thanh toán
    }

    // Kiểm tra xem có phải khách hàng QR không
    if (isCustomerQR()) {
      setIsCustomerPaymentModalVisible(true);
    } else {
      setIsPaymentModalVisible(true);
    }
  };

  const handleClosePaymentModal = () => {
    setIsPaymentModalVisible(false);
    setIsCustomerPaymentModalVisible(false);
    setIsProcessingPayment(false);
  };

  // ✅ Function riêng để đóng modal khi confirm thanh toán (không reset processing state)
  const closeModalOnConfirm = () => {
    setIsPaymentModalVisible(false);
    setIsCustomerPaymentModalVisible(false);
    // Không reset isProcessingPayment ở đây
  };

  const handleConfirmPayment = async (
    selectedPayments,
    paymentAmounts,
    customerInfo,
    sync
  ) => {
    if (isProcessingPayment) {
      return;
    }

    setIsProcessingPayment(true);
    // ✅ Sử dụng function riêng để đóng modal mà không reset processing state
    closeModalOnConfirm();

    const hasInternet = await checkInternetConnection();
    if (!hasInternet) {
      showOfflineWarning();
      setIsProcessingPayment(false);
      return;
    }

    if (selectedPayments.includes("chuyen_khoan")) {
      setShowQR(true);
    }

    const orderData = generateOrderData(
      "2",
      selectedPayments,
      paymentAmounts,
      customerInfo,
      sync
    );
    if (!orderData) {
      setIsProcessingPayment(false);
      return;
    }

    setIsCreatingOrder(true);

    try {
      const payload = {
        store: "Api_create_retail_order",
        param: { StoreID: storeId, unitId: unitId, userId: id },
        data: { master: [orderData.masterData], detail: orderData.detailData },
      };

      const response = await multipleTablePutApi(payload);

      if (response?.responseModel?.isSucceded) {
        const sttRec = response?.listObject[0][0]?.stt_rec;
        const orderNumber = response?.listObject[0][0]?.so_ct;

        // Đã loại bỏ logic mark pending

        // BƯỚC 2: Mở hộp thoại in NGAY LẬP TỨC
        setPrintMaster(orderData.masterData);
        setPrintDetail(orderData.detailData);
        setCurrentPrintData({
          master: orderData.masterData,
          detail: orderData.detailData,
          selectedPayments,
          paymentAmounts,
          customerInfo,
          sttRec,
          orderNumber,
          syncSuccess: false,
          printSuccess: false,
          sync,
        });
        setHasReprinted(false);
        setIsPrinting(true);
        setIsPrinted(false);

        // BƯỚC 3: Chạy InvoiceReceipt và print-order trong background
        runParallelTasks(sttRec, id, sync)
          .then((results) => {
            // Silent success - chạy background
          })
          .catch((error) => {
            // Silent error - already handled by simpleSyncGuard
          });

        // Thông báo thành công ngay lập tức
        notification.success({
          message: "Thanh toán thành công!",
          duration: 4,
        });

        // ✅ Không gọi handleClosePaymentModal() ở đây nữa vì đã đóng ở trên
      } else {
        notification.warning({
          message: "Thanh toán thất bại!",
          description: response?.responseModel?.message,
        });
        setIsProcessingPayment(false);
      }
    } catch (error) {
      notification.error({
        message: "Có lỗi xảy ra khi thanh toán!",
        description: error.message,
      });
      setIsProcessingPayment(false);
    } finally {
      setIsCreatingOrder(false);
    }
  };

  // Hàm xử lý khi khách hàng xác nhận đơn hàng
  const handleConfirmCustomerPayment = async (customerInfo) => {
    if (isProcessingPayment) {
      return;
    }

    setIsProcessingPayment(true);
    closeModalOnConfirm();

    const hasInternet = await checkInternetConnection();
    if (!hasInternet) {
      showOfflineWarning();
      setIsProcessingPayment(false);
      return;
    }

    // Tạo đơn hàng đơn giản
    const orderData = generateOrderData(
      "0", // status = 0 (chưa thanh toán)
      [], // Chưa có hình thức thanh toán
      { tien_mat: 0, chuyen_khoan: 0 }, // Chưa có số tiền thanh toán
      customerInfo, // Thông tin khách hàng
      false // Không đồng bộ
    );

    if (!orderData) {
      setIsProcessingPayment(false);
      return;
    }

    setIsCreatingOrder(true);

    try {
      const payload = {
        store: "Api_create_retail_order",
        param: { StoreID: storeId, unitId: unitId, userId: id },
        data: { master: [orderData.masterData], detail: orderData.detailData },
      };

      const response = await multipleTablePutApi(payload);

      if (response?.responseModel?.isSucceded) {
        // Chỉ thông báo thành công đơn giản
        notification.success({
          message: "Đã gửi đơn hàng thành công!",
          duration: 3,
        });

        // Clear data và đóng tab ngay lập tức
        dispatch(clearTabData(internalActiveTabId));
        dispatch(removeTab({ internalId: internalActiveTabId }));

        // Reset processing state để bỏ loading
        setIsProcessingPayment(false);
      } else {
        notification.warning({
          message: "Gửi đơn hàng thất bại!",
          description: response?.responseModel?.message,
        });
        setIsProcessingPayment(false);
      }
    } catch (error) {
      notification.error({
        message: "Có lỗi xảy ra khi gửi đơn hàng!",
        description: error.message,
      });
      setIsProcessingPayment(false);
    } finally {
      setIsCreatingOrder(false);
    }
  };

  const openMergeModal = () => {
    setIsMergeModalVisible(true);
  };

  const closeMergeModal = () => {
    setIsMergeModalVisible(false);
  };

  const handleMergeOrders = () => {
    openMergeModal();
  };

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const isOrderPage = window.location.pathname.includes("/order");
    setIsMobile(isOrderPage && !token);
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Đóng thông báo mất mạng và hiển thị thông báo kết nối lại
      notification.destroy();
      notification.success({
        message: "Đã kết nối internet!",
        duration: 3,
      });
      // Đã loại bỏ logic retry pending
    };

    const handleOffline = () => {
      setIsOnline(false);
      notification.warning({
        message: "Mất kết nối internet!",
        description: "Vui lòng kiểm tra kết nối mạng.",
        duration: 0,
      });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Đã loại bỏ interval retry pending

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      // Đã loại bỏ clearInterval
    };
  }, []);

  const handleSubmitCombineOrder = (combineMaster, combineDetail) => {
    if (!combineMaster || !combineDetail) return;

    const internalId = `gop-don_${Date.now()}`;
    dispatch(
      addTab({
        tableId: "gop-don",
        tableName: "Gộp đơn",
        isRealtime: false,
        master: combineMaster,
        detail: combineDetail,
        internalId,
      })
    );
    setTimeout(() => {
      dispatch(switchTab(internalId));
    }, 0);
    setIsMergeModalVisible(false);
  };

  const handleCompleteCombineOrder = async () => {
    if (activeTab?.tableId !== "gop-don" || !activeTab?.detail?.length) return;

    const hasInternet = await checkInternetConnection();
    if (!hasInternet) {
      showOfflineWarning();
      return;
    }

    setIsCombining(true);

    let listCombineSttRec = "";
    if (activeTab.master?.list_combine_stt_rec) {
      listCombineSttRec = activeTab.master.list_combine_stt_rec;
    } else if (Array.isArray(activeTab.master)) {
      listCombineSttRec = activeTab.master
        .map((m) => m.stt_rec)
        .filter(Boolean)
        .join(",");
    } else if (activeTab.master?.stt_rec) {
      listCombineSttRec = activeTab.master.stt_rec;
    } else {
      const sttRecArr = (activeTab.detail || [])
        .map((item) => item.stt_rec)
        .filter(Boolean);
      listCombineSttRec = Array.from(new Set(sttRecArr)).join(",");
    }

    const formattedDetail = [];
    (activeTab.detail || []).forEach((item) => {
      const { extras, ...mainItem } = item;
      formattedDetail.push({
        ...mainItem,
        ap_voucher: mainItem.ap_voucher ?? "0",
      });
      if (Array.isArray(extras)) {
        extras.forEach((extra) => {
          formattedDetail.push({
            ...extra,
            ap_voucher: extra.ap_voucher ?? "0",
          });
        });
      }
    });

    const masterPayload = {
      ma_ban: "gop_don",
      dien_giai: "",
      tong_tien: "0",
      tong_sl: formattedDetail.length.toString(),
      tien_mat: "0",
      chuyen_khoan: "0",
      tong_tt: "0",
      httt: "tien_mat",
      stt_rec: "",
      status: "0",
      list_combine_stt_rec: listCombineSttRec,
    };

    const payload = {
      store: "Api_create_retail_combine_order",
      param: { StoreID: storeId, unitId: unitId, userId: id },
      data: {
        master: [masterPayload],
        detail: formattedDetail,
      },
    };

    try {
      const res = await multipleTablePutApi(payload);
      if (res?.responseModel?.isSucceded) {
        notification.success({ message: "Gộp đơn thành công!" });
        dispatch(clearTabData(activeTab.internalId));
        dispatch(removeTab({ internalId: activeTab.internalId }));
      } else {
        notification.warning({
          message: res?.responseModel?.message || "Gộp đơn thất bại!",
        });
      }
    } catch (err) {
      notification.error({
        message: "Lỗi khi gộp đơn!",
        description: err.message,
      });
    }
    setIsCombining(false);
  };
  return (
    <div className="order-summary">
      <div className="summary-info">
        <span className="summary-total">
          <p>Tổng tiền</p>
          <span className="summary-count">{itemCount}</span>
          <p className="summary-total_font">{total.toLocaleString()} đ</p>
        </span>
      </div>

      <PaymentModal
        visible={isPaymentModalVisible}
        onClose={handleClosePaymentModal}
        onConfirm={handleConfirmPayment}
        total={total}
        isCreatingOrder={false} // ✅ Không disable modal khi thanh toán
        initialPaymentMethod={activeTab?.master?.httt}
        initialPaymentAmounts={{
          tien_mat: activeTab?.master?.tien_mat || 0,
          chuyen_khoan: activeTab?.master?.chuyen_khoan || 0,
        }}
        initialCustomerInfo={{
          ong_ba: (
            activeTab?.master?.ong_ba ||
            activeTab?.master?.ten_kh ||
            ""
          ).trim(),
          cccd: (activeTab?.master?.cccd || "").trim(),
          dia_chi: (activeTab?.master?.dia_chi || "").trim(),
          so_dt: (activeTab?.master?.so_dt || "").trim(),
          email: (activeTab?.master?.email || "").trim(),
          ma_so_thue_kh: (activeTab?.master?.ma_so_thue_kh || "").trim(),
          ten_dv_kh: (activeTab?.master?.ten_dv_kh || "").trim(),
        }}
        initialSync={activeTab?.master?.s3 !== "0"}
      />

      <CustomerPaymentModal
        visible={isCustomerPaymentModalVisible}
        onClose={handleClosePaymentModal}
        onConfirm={handleConfirmCustomerPayment}
        total={total}
        customerInfo={{
          ong_ba: (activeTab?.master?.ong_ba || "").trim(),
          cccd: (activeTab?.master?.cccd || "").trim(),
          dia_chi: (activeTab?.master?.dia_chi || "").trim(),
          so_dt: (activeTab?.master?.so_dt || "").trim(),
          email: (activeTab?.master?.email || "").trim(),
          ma_so_thue_kh: (activeTab?.master?.ma_so_thue_kh || "").trim(),
          ten_dv_kh: (activeTab?.master?.ten_dv_kh || "").trim(),
        }}
        isSubmitting={isProcessingPayment}
      />

      <MergeOrder
        visible={isMergeModalVisible}
        onClose={closeMergeModal}
        onSubmitCombineOrder={handleSubmitCombineOrder}
      />

      <div className="summary-actions">
        {activeTab?.tableId === "gop-don" ? (
          <button
            className="summary-button primary"
            disabled={isCombining || !activeTab?.detail?.length || !isOnline}
            onClick={handleCompleteCombineOrder}
            title={!isOnline ? "Không có kết nối internet" : ""}
          >
            {isCombining ? "Đang gộp..." : "Hoàn thành gộp đơn"}
          </button>
        ) : (
          <>
            {rawToken && roleWeb !== "isPosMini" && (
              <button
                className="summary-button secondary"
                onClick={handleMergeOrders}
                disabled={isCreatingOrder || isPrinting || !isOnline}
                title={!isOnline ? "Không có kết nối internet" : ""}
              >
                Gộp đơn
              </button>
            )}
            {rawToken && (
              <button
                className="summary-button save"
                onClick={() => handleSendOrderDirectly(true)}
                disabled={
                  isCreatingOrder ||
                  isPrinting ||
                  !activeTab?.detail?.length ||
                  !isOnline
                }
                title={!isOnline ? "Không có kết nối internet" : ""}
              >
                Lưu lại
              </button>
            )}
            <button
              className="summary-button primary"
              onClick={
                isMobile
                  ? () => {
                      // Kiểm tra xem có phải khách hàng QR không
                      if (isCustomerQR()) {
                        handleOpenPaymentModal(); // Sử dụng modal customer
                      } else {
                        handleSendOrderDirectly(false); // Sử dụng logic cũ
                      }
                    }
                  : handleOpenPaymentModal
              }
              disabled={
                isCreatingOrder ||
                isPrinting ||
                !isOnline ||
                isProcessingPayment
              }
              title={!isOnline ? "Không có kết nối internet" : ""}
            >
              {isProcessingPayment && (
                <LoadingOutlined
                  className="payment-spinner"
                  style={{
                    marginRight: "8px",
                    fontSize: "16px",
                  }}
                />
              )}
              {isProcessingPayment
                ? "Đang gửi..."
                : isMobile
                ? "Xác nhận"
                : "Thanh toán"}
            </button>
          </>
        )}
      </div>

      <div style={{ display: "none" }}>
        <PrintComponent
          ref={printContent}
          master={printMaster}
          detail={printDetail}
          orderNumber={currentPrintData?.orderNumber || ""}
        />
      </div>

      {contextHolder}
    </div>
  );
}
