import { message as messageAPI, Modal, notification } from "antd";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useReactToPrint } from "react-to-print";
import { multipleTablePutApi, printOrderApi } from "../../../../api";
import jwt from "../../../../utils/jwt";
import simpleSyncGuard from "../../../../utils/simpleSyncGuard";
import {
  addTab,
  clearTabData,
  removeTab,
  switchTab,
  updateTabExtraProps,
} from "../../store/order";
import MergeOrder from "./MergeOrders/MergeOrder";
import "./OrderSummary.css";
import PaymentModal from "./PaymentModal/PaymentModal";
import PrintComponent from "./PrintComponent/PrintComponent";

const checkInternetConnection = async () => {
  try {
    if (!navigator.onLine) {
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
    return true;
  } catch (error) {
    console.warn("Internet connection check failed:", error);
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

// SimpleSyncGuard functions - đơn giản ensure syncFastApi được call
const addPendingSync = (sttRec, userId) => {
  return simpleSyncGuard.markForSync(sttRec, userId);
};

const retryPendingSyncs = async () => {
  return await simpleSyncGuard.checkAndRetry();
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

  useEffect(() => {
    if (activeTab && activeTab.autoOpenPayment) {
      setIsPaymentModalVisible(true);
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
        customerInfo.ong_ba?.trim() ||
        activeTab?.master?.ong_ba?.trim() ||
        "Khách hàng căng tin",
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
          if (!isSaveOnly) {
            addPendingSync(sttRec, id);

            try {
              await simpleSyncGuard.triggerSync(sttRec);
            } catch (error) {}
          }

          notification.success({
            message: isSaveOnly
              ? "Đã lưu đơn hàng thành công!"
              : "Đơn hàng đã được tạo thành công và sẽ được đồng bộ tự động!",
          });

          setTimeout(() => dispatch(clearTabData(internalActiveTabId)), 500);
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
    const alreadySynced = currentPrintData?.syncSuccess;
    const alreadyPrinted = currentPrintData?.printSuccess;

    if (sttRec) {
      let printSuccess = alreadyPrinted || false;
      let syncSuccess = alreadySynced || false;

      if (!alreadySynced) {
        if (!simpleSyncGuard.isPending(sttRec)) {
          syncSuccess = true;
        } else {
          notification.info({
            message: "🔄 Đồng bộ FAST đang được xử lý...",
            description: `Đơn ${sttRec} đang được đồng bộ tự động. Hệ thống sẽ thử lại cho đến khi thành công.`,
            duration: 4,
          });
        }
      }

      if (!alreadyPrinted) {
        try {
          await printOrderApi(sttRec, id);
          printSuccess = true;
        } catch (printError) {
          console.error("printOrderApi failed:", {
            error: printError,
            sttRec,
            userId: id,
            message: printError.message,
            stack: printError.stack,
          });
          notification.error({
            message: "Có lỗi xảy ra khi in đơn hàng!",
            description: printError.message,
          });
        }
      }

      if (printSuccess || syncSuccess) {
        const successMessage = [];
        if (syncSuccess) successMessage.push("Đồng bộ FAST");
        if (printSuccess) successMessage.push("In đơn hàng");

        notification.success({
          message: `Hoàn tất! (${successMessage.join(", ")})`,
        });
      } else {
        notification.warning({
          message: "Đơn đã lưu nhưng có lỗi xảy ra với các dịch vụ phụ trợ!",
        });
      }
    }

    setCurrentPrintData(null);
    setHasReprinted(false);
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
    setIsPaymentModalVisible(true);
  };

  const handleClosePaymentModal = () => {
    setIsPaymentModalVisible(false);
    setIsProcessingPayment(false);
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

        // ✅ BƯỚC 1: LUÔN LUÔN mark pending trước (đảm bảo không miss)
        if (sync) {
          addPendingSync(sttRec, id);
        }

        let syncSuccess = false;
        let printSuccess = false;

        // ✅ BƯỚC 2: Thử sync ngay (có thể miss nhưng order đã được marked)
        if (sync) {
          try {
            await simpleSyncGuard.triggerSync(sttRec);
            // Check nếu sync thành công
            if (!simpleSyncGuard.isPending(sttRec)) {
              syncSuccess = true;
            }
          } catch (error) {
            // Sync failed, nhưng order đã được marked → sẽ retry tự động
            notification.info({
              message: "🔄 Đồng bộ FAST đang được xử lý...",
              description: `Đơn ${sttRec} sẽ được đồng bộ tự động. Hệ thống sẽ thử lại cho đến khi thành công.`,
              duration: 4,
            });
          }
        } else {
          // Nếu không sync, đánh dấu syncSuccess = true để không hiển thị cảnh báo
          syncSuccess = true;
        }

        try {
          await printOrderApi(sttRec, id);
          printSuccess = true;
        } catch (printError) {
          console.error("printOrderApi failed:", {
            error: printError,
            sttRec,
            userId: id,
            message: printError.message,
            stack: printError.stack,
          });
          notification.error({
            message: "Có lỗi xảy ra khi in đơn hàng!",
            description: printError.message,
          });
        }

        // Thông báo kết quả
        if (syncSuccess && printSuccess) {
          notification.success({
            message: !sync
              ? "Thanh toán thành công! Đã gửi lệnh in (không đồng bộ)."
              : "Thanh toán thành công! Đã đồng bộ FAST và gửi lệnh in.",
          });
        } else if (syncSuccess || printSuccess) {
          const successMessage = [];
          if (syncSuccess && sync) successMessage.push("Đồng bộ FAST");
          if (printSuccess) successMessage.push("Gửi lệnh in");

          const baseMessage = !sync
            ? "Thanh toán thành công (không đồng bộ)!"
            : "Thanh toán thành công!";

          notification.success({
            message:
              successMessage.length > 0
                ? `${baseMessage} (${successMessage.join(", ")})`
                : baseMessage,
          });
        } else {
          notification.warning({
            message: !sync
              ? "Thanh toán thành công nhưng có lỗi với dịch vụ in!"
              : "Thanh toán thành công nhưng có lỗi với các dịch vụ phụ trợ!",
          });
        }

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
          syncSuccess,
          printSuccess,
          sync,
        });
        setHasReprinted(false);
        setIsPrinting(true);
        setIsPrinted(false);

        handleClosePaymentModal();
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
      notification.success({
        message: "Đã kết nối internet!",
        duration: 2,
      });
      // Retry pending syncs khi có mạng trở lại
      setTimeout(() => retryPendingSyncs(), 1000);
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

    // Retry pending syncs khi component mount
    retryPendingSyncs();

    // Setup interval để check pending syncs định kỳ (mỗi 3 phút, sync với background checker)
    const syncInterval = setInterval(() => {
      if (navigator.onLine) {
        retryPendingSyncs();
      }
    }, 180000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(syncInterval);
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
        dispatch(removeTab({ internalId: activeTab.internalId }));
        dispatch(clearTabData(activeTab.internalId));
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
        isCreatingOrder={isCreatingOrder}
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
                  ? () => handleSendOrderDirectly(false)
                  : handleOpenPaymentModal
              }
              disabled={isCreatingOrder || isPrinting || !isOnline}
              title={!isOnline ? "Không có kết nối internet" : ""}
            >
              {isMobile ? "Gửi" : "Thanh toán"}
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
