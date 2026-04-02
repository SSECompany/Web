import { LoadingOutlined } from "@ant-design/icons";
import { message as messageAPI, Modal, notification } from "antd";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { multipleTablePutApi } from "../../../../api";
import jwt from "../../../../utils/jwt";
import IminPrinterService from "../../../../utils/IminPrinterService";
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
import ReceiptPreviewModal from "./ReceiptPreviewModal/ReceiptPreviewModal";
import { useReactToPrint } from "react-to-print";
import { buildVietQR } from "../../../../components/common/GenerateQR/VietQR";

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

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Tăng mạnh thời gian chờ in lên 1 phút để tránh mất hóa đơn khi đơn đầu ngày hoặc máy in khởi động chậm
const PRINT_FALLBACK_TIMEOUT_MS = 60 * 1000; // 60 giây
const PRINTER_INIT_MAX_RETRIES = 10; // Tăng từ 6 lên 10 lần retry
const PRINTER_INIT_RETRY_DELAY_MS = 3000; // 3 giây/lần => tổng 30s để máy in chuẩn bị

// Số liên hóa đơn mặc định khi in qua máy in nhiệt iMin (POS)
const DEFAULT_RECEIPT_COPIES = 3;
const MAX_RECEIPT_COPIES = 10;
const resolveReceiptCopiesFromClaims = (claims) => {
  const raw = claims?.PrintQuantity;
  const n = parseInt(String(raw ?? "").trim(), 10);
  if (!Number.isFinite(n) || n <= 0) return DEFAULT_RECEIPT_COPIES;
  return Math.min(n, MAX_RECEIPT_COPIES);
};

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

const createRetailOrderWithRetry = async ({
  payload,
  maxAttempts = 2,
  firstRetryDelayMs = 1200,
}) => {
  let lastResponse;
  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await multipleTablePutApi(payload);
      lastResponse = response;

      const isSuccess = response?.responseModel?.isSucceded;
      const sttRec = response?.listObject?.[0]?.[0]?.stt_rec;

      if (isSuccess && sttRec) {
        return {
          ok: true,
          response,
          sttRec,
          orderNumber: response?.listObject?.[0]?.[0]?.so_ct,
          attempts: attempt,
        };
      }

      if (attempt < maxAttempts) {
        await wait(firstRetryDelayMs * attempt);
      }
    } catch (error) {
      lastError = error;
      if (attempt < maxAttempts) {
        await wait(firstRetryDelayMs * attempt);
      }
    }
  }

  return {
    ok: false,
    response: lastResponse,
    error: lastError,
    attempts: maxAttempts,
  };
};

// Helper function để chạy song song print-order và InvoiceReceipt (syncFast)
const runParallelTasks = async (
  sttRec,
  userId,
  sync = true,
  isPrepaidStudent = false,
  isPostpaidStudent = false
) => {
  const parallelTasks = [];

  // Task đồng bộ InvoiceReceipt (nếu bật sync)
  if (sync) {
    const syncTask = callSyncFastApi(sttRec, userId)
      .then((result) => {
        return { type: "sync", success: result.success, result: result.result };
      })
      .catch((syncError) => {
        return { type: "sync", success: false, error: syncError };
      });

    parallelTasks.push(syncTask);
  }

  // Task print-order (bỏ qua nếu là sinh viên trả trước/trả sau)
  if (!isPrepaidStudent && !isPostpaidStudent) {
    const printTask = callPrintOrderApi(sttRec, userId)
      .then((result) => {
        return {
          type: "print",
          success: result.success,
          result: result.result,
        };
      })
      .catch((printError) => {
        notification.error({
          message: "Có lỗi xảy ra khi in đơn hàng!",
          description: printError.message,
        });
        return { type: "print", success: false, error: printError };
      });

    parallelTasks.push(printTask);
  }

  // Chạy tất cả tasks SONG SONG
  return Promise.allSettled(parallelTasks)
    .then((results) => {
      return results;
    })
    .catch((error) => {
      throw error;
    });
};

export default function OrderSummary({ total, itemCount, salesStaff = [] }) {
  const dispatch = useDispatch();
  const { internalActiveTabId, orders } = useSelector((state) => state.orders);
  const { id, storeId, unitId, unitName } = useSelector(
    (state) => state.claimsReducer.userInfo || {}
  );
  const qrCodeData = useSelector((state) => state.qrCode?.qrCodeData);
  const qrPayloadFromStore = useSelector((state) => state.qrCode?.qrPayload || "");
  const rawToken = localStorage.getItem("access_token");
  const claims =
    rawToken && rawToken.split(".").length === 3 ? jwt.getClaims?.() || {} : {};
  const roleWeb = claims?.RoleWeb;
  const receiptCopies = resolveReceiptCopiesFromClaims(claims);
  const qrInfoForPrint = Array.isArray(qrCodeData)
    ? qrCodeData[0] || {}
    : qrCodeData || {};

  const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);
  const [isCustomerPaymentModalVisible, setIsCustomerPaymentModalVisible] =
    useState(false);
  const [paymentFormCache, setPaymentFormCache] = useState(null);
  const [customerPaymentFormCache, setCustomerPaymentFormCache] = useState(null);
  const [message, contextHolder] = messageAPI.useMessage();
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [printMaster, setPrintMaster] = useState({});
  const [printDetail, setPrintDetail] = useState([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isPrinted, setIsPrinted] = useState(false);
  const [isMergeModalVisible, setIsMergeModalVisible] = useState(false);
  const [isCombining, setIsCombining] = useState(false);
  const [currentPrintData, setCurrentPrintData] = useState(null);
  const [hasReprinted, setHasReprinted] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [receiptPreviewVisible, setReceiptPreviewVisible] = useState(false);
  const [confirmPrintLoading, setConfirmPrintLoading] = useState(false);
  const printContent = useRef(null);
  const handlePrint = useReactToPrint({
    content: () => printContent.current,
  });

  const activeTab = orders?.find(
    (tab) => tab.internalId === internalActiveTabId
  );

  const isReadOnly =
    activeTab?.master?.isReadOnly || activeTab?.metadata?.isReadOnly;
  const isConfirmed = activeTab?.metadata?.isConfirmed;
  const isStudentReadOnlyMode = isConfirmed;

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
    sync = true,
    orderStatus = { xuat_hoa_don: false, khach_tra_sau: false },
    selectedStaff = null
  ) => {
    if (!activeTab) {
      message.warning("Không có dữ liệu!");
      return null;
    }

    let finalTienMat = 0;
    let finalChuyenKhoan = 0;
    const totalAmount = Number(activeTab?.master?.tong_tien || 0);

    let finalHttt = "";

    // Nếu là công nợ (xuất hóa đơn hoặc khách trả sau) => tiền vào công nợ, không vào tiền mặt/chuyển khoản
    const isCredit =
      orderStatus?.xuat_hoa_don === true ||
      orderStatus?.khach_tra_sau === true ||
      selectedPayments.includes("cong_no");

    if (isCredit) {
      // Công nợ: tiền mặt và chuyển khoản = 0
      finalTienMat = 0;
      finalChuyenKhoan = 0;
      finalHttt = "cong_no";
    } else if (selectedPayments.length === 1) {
      if (selectedPayments[0] === "tien_mat") {
        finalTienMat = totalAmount;
      } else {
        finalChuyenKhoan = totalAmount;
      }
      finalHttt = selectedPayments.join(",");
    } else if (selectedPayments.length === 2) {
      finalChuyenKhoan = Number(paymentAmounts.chuyen_khoan || 0);
      finalTienMat = totalAmount - finalChuyenKhoan;
      finalHttt = selectedPayments.join(",");
    } else {
      finalHttt = selectedPayments.join(",");
    }

    const masterData = {
      ma_ban: customerInfo.so_the?.trim() || activeTab?.tableId || "",
      ma_kh: activeTab?.master?.ma_kh || activeTab?.metadata?.ma_kh || "",
      dien_giai: activeTab?.master?.dien_giai || "",
      tong_tien: totalAmount.toString(),
      tong_sl: Number(activeTab?.master?.tong_sl || 0).toString(),
      tien_mat: finalTienMat.toString(),
      chuyen_khoan: finalChuyenKhoan.toString(),
      tong_tt: totalAmount.toString(),
      httt: finalHttt,
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
      so_the: customerInfo.so_the ?? activeTab?.master?.so_the ?? "",
      so_giuong: activeTab?.master?.so_giuong ?? "",
      so_phong: activeTab?.master?.so_phong ?? "",
      ca_an: activeTab?.master?.ca_an ?? "",
      thutien_yn: activeTab?.master?.thutien_yn ?? "",
      s3: sync ? "1" : "0",
      StoreID: activeTab?.master?.StoreID || storeId || "",
      fcode1: "",
      // Các trường bắt buộc bổ sung cho master
      ngay_ct:
        activeTab?.master?.ngay_ct ||
        new Date().toISOString().split("T")[0],
      ma_gd: activeTab?.master?.ma_gd || "2",
      typeStudent:
        activeTab?.metadata?.typeStudent ||
        activeTab?.master?.typeStudent ||
        "",
      // Cờ phân loại trả trước
      sinhvien_tratruoc:
        activeTab?.metadata?.typeStudent === "prepaid_student" ? "1" : "0",
      benhnhan_tratruoc: activeTab?.master?.benhnhan_tratruoc || "0",
      // Các trường mới - lấy từ API khi sửa đơn, nếu không có thì dùng giá trị từ form
      cookie_voucher: activeTab?.master?.cookie_voucher ?? "",
      kh_ts_yn: activeTab?.master?.kh_ts_yn ?? (orderStatus?.khach_tra_sau ? "1" : "0"),
      xuat_hoa_don_yn: activeTab?.master?.xuat_hoa_don_yn ?? (orderStatus?.xuat_hoa_don ? "1" : "0"),
      cong_no: activeTab?.master?.cong_no ?? (selectedPayments.includes("cong_no")
        ? (paymentAmounts.cong_no || totalAmount).toString()
        : "0"),
      ma_nvbh: (selectedStaff
        ? (selectedStaff.ma_nvbh || selectedStaff.value || selectedStaff.id || "")
        : "") || activeTab?.master?.ma_nvbh || (salesStaff?.length > 0 ? (salesStaff[0].ma_nvbh || salesStaff[0].value || salesStaff[0].id) : ""),
      ten_nvbh: (selectedStaff
        ? (selectedStaff.ten_nvbh || selectedStaff.label || selectedStaff.name || "")
        : "") || activeTab?.master?.ten_nvbh || (salesStaff?.length > 0 ? (salesStaff[0].ten_nvbh || salesStaff[0].label || salesStaff[0].name) : ""),
    };

    const detailData = activeTab?.detail?.flatMap((item) => {
      const uniqueid = item.uniqueid || generateRandomId();
      const mainItem = {
        ten_vt: item.selected_meal?.label || item.ten_vt,
        ma_vt_root: item.ma_vt_root || "",
        // ma_vt giờ đã là mã món suất đã chọn rồi (được cập nhật trong store)
        ma_vt: item.ma_vt,
        so_luong: (item.so_luong || 0).toString(),
        don_gia: (item.don_gia || 0).toString(),
        thanh_tien: (item.thanh_tien || ((item.so_luong || 0) * (item.don_gia || 0))).toString(),
        ghi_chu: item.ghi_chu || "",
        // gc_td1 giờ chứa mã vật tư ban đầu
        gc_td1: item.gc_td1 || "",
        uniqueid,
        ap_voucher: item.ap_voucher || "0",
        // Thêm mã ca bọc nếu có
        ma_ca: item.selected_meal?.shift || "",
        // Thêm thông tin giảm giá
        tl_ck: item.tl_ck || "0",
        ck_nt: item.ck_nt || "0",
      };
      const extras = (item.extras || []).map((extra) => {
        const quantity = parseFloat(extra.quantity || extra.so_luong || 0);
        const price = parseFloat(extra.gia || extra.don_gia || 0);
        const amount = quantity * price * (item.so_luong || 0);

        return {
          ten_vt: extra.ten_vt,
          // ma_vt_root sử dụng ma_vt hiện tại (đã là mã món suất đã chọn)
          ma_vt_root: item.ma_vt,
          ma_vt: extra.ma_vt_more || extra.ma_vt,
          so_luong: (quantity * (item.so_luong || 0)).toString(),
          don_gia: price.toString(),
          thanh_tien: amount.toString(),
          uniqueid,
          // Thêm mã ca bọc cho extras (kế thừa từ item chính)
          ma_ca: item.selected_meal?.shift || "",
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

    const orderData = generateOrderData("0", [], {}, {}, true, { xuat_hoa_don: false, khach_tra_sau: false }, null);
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

      const createOrderResult = await createRetailOrderWithRetry({
        payload,
        maxAttempts: 2,
        firstRetryDelayMs: 1200,
      });
      const response = createOrderResult?.response;

      if (createOrderResult?.ok) {
        const sttRec = createOrderResult?.sttRec;
        const orderNumber = createOrderResult?.orderNumber;

        if (sttRec) {
          // Hiển thị message thành công ngay lập tức để người dùng và app ghi nhận đơn xong
          notification.success({
            message: isSaveOnly
              ? "Đã lưu đơn hàng thành công!"
              : "Đơn hàng đã được tạo thành công!",
            duration: 4,
          });

          if (isSaveOnly) {
            setTimeout(() => {
              dispatch(clearTabData(internalActiveTabId));
            }, 500);
          } else {
            const typeStudent =
              activeTab?.metadata?.typeStudent || activeTab?.master?.typeStudent;
            const isPrepaidStudent = typeStudent === "prepaid_student";
            const isPostpaidStudent = typeStudent === "postpaid_student";

            // Đợi hoàn thành các tiến trình ngầm (syncFast, printOrder API)
            runParallelTasks(sttRec, id, true, isPrepaidStudent, isPostpaidStudent).catch((error) => {
               console.error("Lỗi chạy tiến trình ngầm:", error);
            });

            // Đợi 800ms để thông báo hiển thị xong rồi mới gọi máy in SDK
            setTimeout(async () => {
              // BƯỚC TUẦN TỰ: Chuẩn bị dữ liệu và gọi Print
              const masterWithDvcs = {
                ...orderData.masterData,
                ten_dvcs: unitName || "",
                HotlineBill: qrInfoForPrint?.HotlineBill || "",
                EmailBill: qrInfoForPrint?.EmailBill || "",
                ...(orderNumber ? { so_ct: orderNumber } : {}),
              };

              setPrintMaster(masterWithDvcs);
              setPrintDetail(orderData.detailData);
              setCurrentPrintData({
                master: masterWithDvcs,
                detail: orderData.detailData,
                sttRec,
                orderNumber,
                sync: true,
              });

              // GỌI IN BẰNG SDK CHO MỌI THIẾT BỊ
              try {
                const printerService = new IminPrinterService();
                await printerService.initPrinter();
                if (printerService.isInitialized && printerService.printerInstance) {
                  // Mở két và in
                  try {
                    await printerService.openCashBox();
                  } catch (drawerErr) {
                    console.warn("Két tiền không mở được:", drawerErr?.message);
                  }
                  await printerService.printReceipt(
                    masterWithDvcs,
                    orderData.detailData,
                    receiptCopies,
                    { isReprint: false, qrPayload: qrPayloadFromStore }
                  );
                  handleSaveOrder();
                } else {
                  throw new Error("Không có kết nối máy in POS.");
                }
              } catch (printErr) {
                console.error("❌ Lỗi in tuần tự:", printErr);
                setReceiptPreviewVisible(true);
                notification.warning({
                  message: "Máy in chưa sẵn sàng",
                  description: "Vui lòng kiểm tra máy in và bấm In lại.",
                });
              }
            }, 800);
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
    setPaymentFormCache(null);
    setCustomerPaymentFormCache(null);
    dispatch(clearTabData(internalActiveTabId));
  };

  const hasPrintedRef = useRef(false);
  const printFallbackTimerRef = useRef(null);
  const isMountedRef = useRef(true);

  const handleReprint = () => {
    if (currentPrintData) {
      setPrintMaster(currentPrintData.master);
      setPrintDetail(currentPrintData.detail);
      setIsPrinting(true);
      setIsPrinted(false);
    }
  };

  const handleConfirmPreviewPrint = async () => {
    if (!currentPrintData) return;
    setConfirmPrintLoading(true);
    try {
      const printerService = new IminPrinterService();
      await printerService.initPrinter();
      const masterForPrint = {
        ...currentPrintData.master,
        so_ct: currentPrintData.orderNumber ?? currentPrintData.master?.so_ct ?? "Chưa có",
      };

      const hasRealPrinter = printerService.isInitialized && printerService.printerInstance;

      if (hasRealPrinter) {
        await printerService.printReceipt(
          masterForPrint,
          currentPrintData.detail,
          receiptCopies,
          { isReprint: true, qrPayload: qrPayloadFromStore }
        );
        notification.success({
          message: "In lại hóa đơn",
          description: "Đã in lại hóa đơn bằng máy in nhiệt.",
          duration: 3,
        });
        setReceiptPreviewVisible(false);
      } else {
        const isAndroid = /Android/i.test(navigator?.userAgent || "");
        if (isAndroid) {
          notification.error({
            message: "Không thể in lại",
            description: "Máy in POS chưa sẵn sàng.",
            duration: 3,
          });
          setReceiptPreviewVisible(false);
        } else {
          // Fallback react-to-print (PC/Dev)
          setPrintMaster(masterForPrint);
          setPrintDetail(currentPrintData.detail);
          setReceiptPreviewVisible(false);
          setTimeout(() => handlePrint(), 300);
        }
      }
    } catch (err) {
      notification.error({
        message: "Lỗi in lại hóa đơn",
        description: err?.message || "Vui lòng kiểm tra máy in.",
        duration: 4,
      });
    } finally {
      setConfirmPrintLoading(false);
    }
  };

    const clearPrintFallbackTimer = () => {
    if (printFallbackTimerRef.current) {
      clearTimeout(printFallbackTimerRef.current);
      printFallbackTimerRef.current = null;
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      clearPrintFallbackTimer();
    };
  }, []);

  // In hóa đơn: ưu tiên máy in nhiệt iMin (POS, nhiều liên + cắt giấy), fallback react-to-print
  useEffect(() => {
    if (!isPrinting || isPrinted) return;
    hasPrintedRef.current = false;

    const runPrint = async () => {
      try {
        const printerService = new IminPrinterService();

        // Chỉ init 1 lần, chờ SDK response (đã xoá timeout/retry phức tạp)
        await printerService.initPrinter();

        // Kiểm tra xem có máy in thật không
        const hasRealPrinter = printerService.isInitialized && printerService.printerInstance;

        if (hasRealPrinter) {
          // Có máy in thật → in qua máy in nhiệt
          try {
            // Mở két tiền khi thanh toán (trước khi in hóa đơn)
            try {
              await printerService.openCashBox();
            } catch (drawerErr) {
              console.warn("Két tiền không mở được (có thể không kết nối):", drawerErr?.message);
            }
            const masterForPrint = {
              ...printMaster,
              so_ct: currentPrintData?.orderNumber ?? printMaster?.so_ct ?? "Chưa có",
            };

            let finalQrPayload = qrPayloadFromStore;
            if (currentPrintData?.useDynamicQR) {
                finalQrPayload = buildVietQR({
                    account: qrInfoForPrint?.SoTaiKhoanBill || process.env.REACT_APP_VIETQR_ACCOUNT,
                    bankId: process.env.REACT_APP_VIETQR_BANK_ID,
                    amount: masterForPrint.tong_tien,
                    content: masterForPrint.so_ct !== "Chưa có" ? masterForPrint.so_ct : "",
                });
            }

            await printerService.printReceipt(
              masterForPrint,
              printDetail,
              receiptCopies,
              { isReprint: false, qrPayload: finalQrPayload }
            );
            clearPrintFallbackTimer();
            handleSaveOrder(); // In xong tự clear dữ liệu (logic cũ)
          } catch (err) {
            notification.error({
              message: "Lỗi in hóa đơn",
              description: err?.message || "Máy in chưa sẵn sàng",
            });
            clearPrintFallbackTimer();
            setIsPrinting(false);
            setReceiptPreviewVisible(true);
            notification.warning({
              message: "Đơn đã tạo nhưng chưa in",
              description: "Vui lòng bấm In lại để đảm bảo hóa đơn được in ra.",
              duration: 5,
            });
          }
        } else {
          // Không có máy in thật, không in giả
          notification.error({
            message: "Máy in POS chưa sẵn sàng",
            description: "Không thể in hóa đơn trên máy in nhiệt.",
            duration: 5,
          });
          clearPrintFallbackTimer();
          setIsPrinting(false);
          setReceiptPreviewVisible(true);
        }
      } catch (initErr) {
        // initPrinter() lỗi/treo: giữ dữ liệu đơn để người dùng in lại
        clearPrintFallbackTimer();
        setIsPrinting(false);
        setReceiptPreviewVisible(true);
        notification.warning({
          message: "Máy in chưa sẵn sàng",
          description:
            initErr?.message || "Đơn đã tạo. Vui lòng bấm In lại để in hóa đơn.",
          duration: 5,
        });
      }
    };

    runPrint();
    // Không clear timer ở đây: khi initPrinter() treo, effect không chạy lại → timer không bị xóa → sau 10s vẫn fire.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const handleClosePaymentModal = (cached) => {
    if (cached?.fromPaymentModal) setPaymentFormCache(cached);
    if (cached?.fromCustomerModal) setCustomerPaymentFormCache(cached);
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
    sync,
    orderStatus = { xuat_hoa_don: false, khach_tra_sau: false },
    selectedStaff = null,
    useDynamicQR = false
  ) => {
    if (isProcessingPayment) {
      return;
    }

    // Ping Server Khẩn Cấp Ngay Khi Mở/Xác Nhận Hộp Thoại Thanh Toán:
    multipleTablePutApi({ store: "api_getListRestaurantTables", param: { searchValue: "ping" }, data: {} }).catch(()=>{});

    // ✅ Kiểm tra món = 0đ mà không phải voucher
    const invalidItems = [];
    if (activeTab?.detail) {
      activeTab.detail.forEach((item, index) => {
        const price = parseFloat(item.don_gia || 0);
        const isVoucher = item.ap_voucher === "1";
        const itemName = item.selected_meal
          ? item.selected_meal.label
          : item.ten_vt;

        if (price === 0 && !isVoucher) {
          invalidItems.push({
            index: index + 1,
            name: itemName,
            price: price,
          });
        }
      });
    }

    if (invalidItems.length > 0) {
      notification.error({
        message: "Không thể thanh toán!",
        description: (
          <div>
            <p>
              Có {invalidItems.length} món có giá = 0đ mà không phải voucher:
            </p>
            <ul style={{ margin: "8px 0", paddingLeft: "20px" }}>
              {invalidItems.map((item, idx) => (
                <li key={idx}>
                  {item.index}. {item.name} - {item.price}đ
                </li>
              ))}
            </ul>
            <p style={{ fontSize: "13px", color: "#666", marginTop: "8px" }}>
              Vui lòng áp dụng voucher hoặc cập nhật giá cho các món này.
            </p>
          </div>
        ),
        duration: 8,
      });
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

    // Nếu là công nợ thì ép httt = 'cong_no' và không có số tiền thanh toán
    const isCredit =
      orderStatus?.xuat_hoa_don === true || orderStatus?.khach_tra_sau === true;

    const finalSelectedPayments = isCredit ? ["cong_no"] : selectedPayments;
    const finalPaymentAmounts = isCredit
      ? { tien_mat: 0, chuyen_khoan: 0 }
      : paymentAmounts;

    const orderData = generateOrderData(
      "2",
      finalSelectedPayments,
      finalPaymentAmounts,
      customerInfo,
      sync,
      orderStatus,
      selectedStaff
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

      const createOrderResult = await createRetailOrderWithRetry({
        payload,
        maxAttempts: 2,
        firstRetryDelayMs: 1200,
      });
      const response = createOrderResult?.response;

      if (createOrderResult?.ok) {
        const sttRec = createOrderResult?.sttRec;
        const orderNumber = createOrderResult?.orderNumber;

        if (sttRec) {
          const typeStudent =
            activeTab?.metadata?.typeStudent || activeTab?.master?.typeStudent;
          const isPrepaidStudent = typeStudent === "prepaid_student";
          const isPostpaidStudent = typeStudent === "postpaid_student";

          // Đợi hoàn thành các tiến trình ngầm (syncFast, printOrder API) để chắc chắn server đã xử lý xong
          // KHÔNG AWAIT ĐỂ TRÁNH COLD START LÀM CHẬM UI VÀ QUÁ TRÌNH IN LOCAL
          runParallelTasks(sttRec, id, sync, isPrepaidStudent, isPostpaidStudent).catch((e) => {
             console.error("Lỗi chạy tiến trình ngầm:", e);
          });

          // Khai báo trước
          notification.success({
            message: "Thanh toán thành công!",
            duration: 4,
          });
          setIsCreatingOrder(false);
          // Không setIsProcessingPayment(false) ở đây — loading nút thanh toán chạy đến khi handleSaveOrder (sau khi in xong + clear dữ liệu)
          setIsPaymentModalVisible(false);
          setIsCustomerPaymentModalVisible(false);
          setPaymentFormCache(null);
          setCustomerPaymentFormCache(null);

          // BƯỚC 2: Bật hộp thoại in và chạy SDK sau 800ms
          setTimeout(() => {
            const masterWithDvcs = {
              ...orderData.masterData,
              ten_dvcs: unitName || "",
              HotlineBill: qrInfoForPrint?.HotlineBill || "",
              EmailBill: qrInfoForPrint?.EmailBill || "",
            };
            setPrintMaster(masterWithDvcs);
            setPrintDetail(orderData.detailData);
            setCurrentPrintData({
              master: masterWithDvcs,
              detail: orderData.detailData,
              selectedPayments,
              paymentAmounts,
              customerInfo,
              sttRec,
              orderNumber,
              sync,
              useDynamicQR,
            });
            setHasReprinted(false);
            setIsPrinting(true);
            setIsPrinted(false);
          }, 800);
        } else {
          // Không có stt_rec, không in — clear ngay và tắt loading
          notification.success({
            message: "Thanh toán thành công!",
            duration: 4,
          });
          setIsProcessingPayment(false);
          setIsCreatingOrder(false);
          dispatch(clearTabData(internalActiveTabId));
          setIsPaymentModalVisible(false);
          setIsCustomerPaymentModalVisible(false);
          setPaymentFormCache(null);
          setCustomerPaymentFormCache(null);
        }
      } else {
        notification.warning({
          message: "Thanh toán thất bại!",
          description: response?.responseModel?.message,
        });
        setIsProcessingPayment(false);
        setIsCreatingOrder(false);
      }
    } catch (error) {
      notification.error({
        message: "Có lỗi xảy ra khi thanh toán!",
        description: error.message,
      });
      setIsProcessingPayment(false);
      setIsCreatingOrder(false);
    }
  };

  // Hàm xử lý khi khách hàng xác nhận đơn hàng
  const handleConfirmCustomerPayment = async (customerInfo, selectedStaff = null) => {
    if (isProcessingPayment) {
      return;
    }

    // Ping Server Khẩn Cấp Ngay Khi Mở/Xác Nhận Đơn Khách Hàng:
    multipleTablePutApi({ store: "api_getListRestaurantTables", param: { searchValue: "ping" }, data: {} }).catch(()=>{});

    // ✅ Kiểm tra món = 0đ mà không phải voucher
    const invalidItems = [];
    if (activeTab?.detail) {
      activeTab.detail.forEach((item, index) => {
        const price = parseFloat(item.don_gia || 0);
        const isVoucher = item.ap_voucher === "1";
        const itemName = item.selected_meal
          ? item.selected_meal.label
          : item.ten_vt;

        if (price === 0 && !isVoucher) {
          invalidItems.push({
            index: index + 1,
            name: itemName,
            price: price,
          });
        }
      });
    }

    if (invalidItems.length > 0) {
      notification.error({
        message: "Không thể xác nhận đơn hàng!",
        description: (
          <div>
            <p>
              Có {invalidItems.length} món có giá = 0đ mà không phải voucher:
            </p>
            <ul style={{ margin: "8px 0", paddingLeft: "20px" }}>
              {invalidItems.map((item, idx) => (
                <li key={idx}>
                  {item.index}. {item.name} - {item.price}đ
                </li>
              ))}
            </ul>
            <p style={{ fontSize: "13px", color: "#666", marginTop: "8px" }}>
              Vui lòng áp dụng voucher hoặc cập nhật giá cho các món này.
            </p>
          </div>
        ),
        duration: 8,
      });
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
      false, // Không đồng bộ
      { xuat_hoa_don: false, khach_tra_sau: false }, // Trạng thái đơn hàng
      selectedStaff // Nhân viên (CustomerPaymentModal)
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

        // Chỉ clear dữ liệu đơn, giữ tab
        dispatch(clearTabData(internalActiveTabId));

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
      ma_kh: activeTab?.master?.ma_kh || activeTab?.metadata?.ma_kh || "",
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
        isCreatingOrder={false}
        initialPaymentMethod={
          paymentFormCache?.selectedPayments?.length
            ? paymentFormCache.selectedPayments.join(",")
            : activeTab?.master?.httt
        }
        initialPaymentAmounts={
          paymentFormCache?.paymentAmounts ?? {
            tien_mat: activeTab?.master?.tien_mat || 0,
            chuyen_khoan: activeTab?.master?.chuyen_khoan || 0,
            cong_no: activeTab?.master?.cong_no || 0,
          }
        }
        initialCustomerInfo={
          paymentFormCache?.customerInfo ?? {
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
            so_the: (activeTab?.master?.so_the || "").trim(),
          }
        }
        initialSync={paymentFormCache?.sync ?? activeTab?.master?.s3 !== "0"}
        initialOrderStatus={
          paymentFormCache?.orderStatus ?? {
            xuat_hoa_don: activeTab?.master?.xuat_hoa_don_yn === "1",
            khach_tra_sau: activeTab?.master?.kh_ts_yn === "1",
          }
        }
        initialSelectedStaff={
          paymentFormCache?.selectedStaff?.ma_nvbh || activeTab?.master?.ma_nvbh || ""
        }
        salesStaff={salesStaff}
      />

      <CustomerPaymentModal
        visible={isCustomerPaymentModalVisible}
        onClose={handleClosePaymentModal}
        onConfirm={handleConfirmCustomerPayment}
        total={total}
        customerInfo={
          customerPaymentFormCache?.customerInfo ?? {
            ong_ba: (activeTab?.master?.ong_ba || "").trim(),
            cccd: (activeTab?.master?.cccd || "").trim(),
            dia_chi: (activeTab?.master?.dia_chi || "").trim(),
            so_dt: (activeTab?.master?.so_dt || "").trim(),
            email: (activeTab?.master?.email || "").trim(),
            ma_so_thue_kh: (activeTab?.master?.ma_so_thue_kh || "").trim(),
            ten_dv_kh: (activeTab?.master?.ten_dv_kh || "").trim(),
          }
        }
        initialSelectedStaff={
          customerPaymentFormCache?.selectedStaff?.ma_nvbh || activeTab?.master?.ma_nvbh || ""
        }
        isSubmitting={isProcessingPayment}
        salesStaff={salesStaff}
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
                disabled={
                  isCreatingOrder ||
                  isPrinting ||
                  !isOnline ||
                  isStudentReadOnlyMode
                }
                title={
                  !isOnline
                    ? "Không có kết nối internet"
                    : isStudentReadOnlyMode
                      ? "Đơn sinh viên đã xác nhận không thể gộp"
                      : ""
                }
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
                  !isOnline ||
                  isStudentReadOnlyMode
                }
                title={
                  !isOnline
                    ? "Không có kết nối internet"
                    : isStudentReadOnlyMode
                      ? "Đơn sinh viên đã xác nhận không thể lưu"
                      : ""
                }
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

      <ReceiptPreviewModal
        visible={receiptPreviewVisible}
        onCancel={() => setReceiptPreviewVisible(false)}
        onConfirm={handleConfirmPreviewPrint}
        master={currentPrintData?.master || {}}
        detail={currentPrintData?.detail || []}
        orderNumber={currentPrintData?.orderNumber || ""}
        isReprint={true}
        confirmLoading={confirmPrintLoading}
      />



      {contextHolder}
    </div>
  );
}

