import { LoadingOutlined } from "@ant-design/icons";
import {
  Button,
  Card,
  message as messageAPI,
  notification,
  Select,
  Tag,
  Typography,
} from "antd";
import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useReactToPrint } from "react-to-print";
import { multipleTablePutApi, keyFileUploadsM81 } from "../../../api";
import PaymentModal from "../../../components/common/PaymentModal/PaymentModal";
import PrintComponent from "../../../components/common/PaymentModal/PrintComponent/PrintComponent";
import jwt from "../../../utils/jwt";
import CustomerInfo from "./CustomerInfo";
import emitter from "../../../utils/emitter";

const { Text } = Typography;

// Network check cache
let _networkCheckCache = null;
let _lastNetworkCheck = 0;
const NETWORK_CHECK_CACHE_DURATION = 10000;

const checkInternetConnection = async () => {
  const now = Date.now();
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

const PaymentSummary = ({
  customer,
  setCustomer,
  customerOpen,
  setCustomerOpen,
  payment,
  setPayment,
  subtotal,
  discount,
  vat,
  total,
  change,
  cart,
  uploadedKeyFields,
  onClearCart,
  currentOrderSttRec = "",
  onUpdateCurrentOrderSttRec,
}) => {
  const dispatch = useDispatch();
  const { id, storeId, unitId } = useSelector(
    (state) => state.claimsReducer.userInfo || {}
  );
  const rawToken = localStorage.getItem("access_token");
  const claims =
    rawToken && rawToken.split(".").length === 3 ? jwt.getClaims?.() || {} : {};

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
  const [currentPrintData, setCurrentPrintData] = useState(null);
  const [hasReprinted, setHasReprinted] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const generateOrderData = (
    status = "0",
    selectedPayments = [],
    paymentAmounts = {},
    customerInfo = {},
    sync = true
  ) => {
    if (!cart || cart.length === 0) {
      message.warning("Vui lòng thêm vật tư!");
      return null;
    }

    let finalTienMat = 0;
    let finalChuyenKhoan = 0;
    const totalAmount = Number(total || 0);

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

    const existingSttRec = (currentOrderSttRec || "").trim();
    const masterData = {
      ma_ban: "POS",
      dien_giai: "",
      tong_tien: totalAmount.toString(),
      tong_sl: cart.reduce((sum, item) => sum + (item.qty || 1), 0).toString(),
      tien_mat: finalTienMat.toString(),
      chuyen_khoan: finalChuyenKhoan.toString(),
      tong_tt: totalAmount.toString(),
      httt: selectedPayments.join(","),
      stt_rec: existingSttRec,
      status,
      // Add customer code into master
      ma_kh: customerInfo.ma_kh ?? customer?.code ?? "",
      cccd: customerInfo.cccd ?? customer?.idNumber ?? "",
      ong_ba: customerInfo.ong_ba?.trim() || customer?.name?.trim() || "",
      so_dt: customerInfo.so_dt ?? customer?.phone ?? "",
      dia_chi: customerInfo.dia_chi ?? "",
      email: customerInfo.email ?? "",
      ma_so_thue_kh: customerInfo.ma_so_thue_kh ?? customer?.idNumber ?? "",
      ten_dv_kh: customerInfo.ten_dv_kh ?? "",
      s3: sync ? "1" : "0",
    };

    const detailData = cart.flatMap((item) => {
      const uniqueid = item.uniqueid || generateRandomId();
      // Calculate discount and tax amounts
      const total = (item.qty || 0) * (item.price || 0);
      const discountAmount = item.discountAmount > 0 
        ? item.discountAmount 
        : Math.round((total * (item.discountPercent || 0)) / 100);
      const totalAfterDiscount = total - discountAmount;
      // Ưu tiên thue_nt nếu đã có, nếu không thì tính từ thue_suat hoặc vatPercent
      let vatAmount = 0;
      if (Number(item.thue_nt) > 0) {
        vatAmount = Math.round(Number(item.thue_nt));
      } else {
        let effectiveVatPercent = 0;
        if (Number(item.thue_suat) > 0) {
          effectiveVatPercent = Number(item.thue_suat);
        } else if (Number(item.vatPercent) > 0) {
          effectiveVatPercent = Number(item.vatPercent);
        }
        vatAmount = Math.round(
          (totalAfterDiscount * effectiveVatPercent) / 100
        );
      }
      
      const mainItem = {
        ten_vt: item.name,
        ma_vt_root: item.ma_vt_root || "",
        ma_vt: item.sku,
        so_luong: (item.qty || 0).toString(),
        don_gia: (item.price || 0).toString(),
        thanh_tien: ((item.qty || 0) * (item.price || 0)).toString(),
        ghi_chu: item.ghi_chu || "",
        uniqueid,
        ap_voucher: item.ap_voucher || "0",
        // Add missing fields
        dvt: item.unit || "",
        tl_ck: (item.discountPercent || 0).toString(),
        ck_nt: discountAmount.toString(),
        ma_thue: item.ma_thue || "",
        thue_nt: vatAmount.toString(),
        ma_lo: (item.batchExpiry || "").trim(),
      };
      const extras = (item.extras || []).map((extra) => {
        const quantity = parseFloat(extra.quantity || extra.so_luong || 0);
        const price = parseFloat(extra.gia || extra.don_gia || 0);
        const amount = quantity * price * (item.qty || 0);

        return {
          ten_vt: extra.ten_vt,
          ma_vt_root: item.sku,
          ma_vt: extra.ma_vt_more || extra.ma_vt,
          so_luong: (quantity * (item.qty || 0)).toString(),
          don_gia: price.toString(),
          thanh_tien: amount.toString(),
          uniqueid,
          // Add missing fields for extras (default values)
          dvt: extra.unit || item.unit || "",
          tl_ck: "0",
          ck_nt: "0",
          ma_thue: "",
          thue_nt: "0",
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
          // Link uploaded image to order if keyFields exists
          if (uploadedKeyFields && sttRec) {
            try {
              const linkResult = await keyFileUploadsM81({
                stt_rec: sttRec,
                keyFields: uploadedKeyFields,
              });
              if (!linkResult?.responseModel?.isSucceded) {
                console.warn("Không thể liên kết ảnh với đơn hàng");
              }
            } catch (linkError) {
              console.error("Lỗi khi liên kết ảnh:", linkError);
            }
          }

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

          const trimmedSttRec = (currentOrderSttRec || "").trim();
          const isEditingOrder = Boolean(trimmedSttRec);
          const successMessage = isSaveOnly
            ? isEditingOrder
              ? "Đã lưu cập nhật đơn hàng thành công!"
              : "Đã lưu đơn hàng mới thành công!"
            : isEditingOrder
            ? "Đơn hàng đã được cập nhật thành công!"
            : "Đơn hàng mới đã được tạo thành công!";

          notification.success({
            message: successMessage,
            duration: 4,
          });

          if (typeof onUpdateCurrentOrderSttRec === "function" && sttRec) {
            onUpdateCurrentOrderSttRec(sttRec);
          }

          if (isSaveOnly) {
            onClearCart();
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
    setCurrentPrintData(null);
    setHasReprinted(false);
    setIsProcessingPayment(false);
    onClearCart();
  };

  let hasPrinted = false;

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
        // Bỏ logic in lại, chỉ đóng luôn
        setTimeout(() => handleSaveOrder(), 100);
      }
    },
  });

  useEffect(() => {
    if (isPrinting && !isPrinted) {
      hasPrinted = false;
      handlePrint();
    }
  }, [printMaster, printDetail, isPrinting, isPrinted]);

  // Allow external trigger to open payment modal (e.g., from order list approve)
  useEffect(() => {
    const openHandler = () => {
      if (!isProcessingPayment) {
        setIsPaymentModalVisible(true);
      }
    };
    emitter.on("OPEN_PAYMENT_MODAL", openHandler);
    return () => {
      emitter.off("OPEN_PAYMENT_MODAL", openHandler);
    };
  }, [isProcessingPayment]);

  const handleOpenPaymentModal = () => {
    if (isProcessingPayment) {
      return;
    }
    setIsPaymentModalVisible(true);
  };

  const handleClosePaymentModal = () => {
    setIsPaymentModalVisible(false);
    setIsProcessingPayment(false);
  };

  const closeModalOnConfirm = () => {
    setIsPaymentModalVisible(false);
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

        // Link uploaded image to order if keyFields exists
        if (uploadedKeyFields && sttRec) {
          try {
            const linkResult = await keyFileUploadsM81({
              stt_rec: sttRec,
              keyFields: uploadedKeyFields,
            });
            if (!linkResult?.responseModel?.isSucceded) {
              console.warn("Không thể liên kết ảnh với đơn hàng");
            }
          } catch (linkError) {
            console.error("Lỗi khi liên kết ảnh:", linkError);
          }
        }

        const trimmedSttRec = (currentOrderSttRec || "").trim();
        const isEditingOrder = Boolean(trimmedSttRec);
        const updatedMasterData = {
          ...orderData.masterData,
          stt_rec: sttRec || orderData.masterData.stt_rec,
        };

        setPrintMaster(updatedMasterData);
        setPrintDetail(orderData.detailData);
        setCurrentPrintData({
          master: updatedMasterData,
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

        if (typeof onUpdateCurrentOrderSttRec === "function" && sttRec) {
          onUpdateCurrentOrderSttRec(sttRec);
        }

        notification.success({
          message: isEditingOrder
            ? "Cập nhật đơn hàng thành công!"
            : "Thanh toán đơn hàng mới thành công!",
          duration: 4,
        });
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

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const isOrderPage = window.location.pathname.includes("/order");
    setIsMobile(isOrderPage && !token);
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
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

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <div className="payment-summary-container">
      {/* Customer Info */}
      <CustomerInfo
        customer={customer}
        setCustomer={setCustomer}
        customerOpen={customerOpen}
        setCustomerOpen={setCustomerOpen}
      />

      {/* Payment Summary */}
      <Card size="small" title="Tổng quan thanh toán" className="summary-card">
        <div className="summary-content">
          {/* Order Summary - Compact */}
          <div className="order-summary">
            <div className="summary-row">
              <Text>Tạm tính:</Text>
              <Text strong>
                {new Intl.NumberFormat("vi-VN").format(subtotal)}đ
              </Text>
            </div>
            <div className="summary-row">
              <Text>Tiền chiết khấu:</Text>
              <Text style={{ color: "#f59e0b" }}>
                -{new Intl.NumberFormat("vi-VN").format(discount || 0)}đ
              </Text>
            </div>
            <div className="summary-row">
              <Text>VAT:</Text>
              <Text>{new Intl.NumberFormat("vi-VN").format(vat)}đ</Text>
            </div>
            <div className="summary-row total-row">
              <Text strong>Tổng cộng:</Text>
              <Text strong style={{ color: "#059669", fontSize: "13px" }}>
                {new Intl.NumberFormat("vi-VN").format(total)}đ
              </Text>
            </div>
          </div>

          {/* Payment Method - Compact */}
          <div className="payment-method-section">
            <Text
              strong
              style={{
                fontSize: "13px",
                color: "#262626",
                marginBottom: "6px",
                display: "block",
              }}
            >
              Phương thức:
            </Text>
            <Select
              value={payment.method}
              onChange={(value) =>
                setPayment({ ...payment, method: value, cash: 0 })
              }
              className="payment-method-select"
            >
              <Select.Option value="cash">Tiền mặt</Select.Option>
              <Select.Option value="transfer">Chuyển khoản</Select.Option>
              <Select.Option value="multi">Đa phương thức</Select.Option>
            </Select>
          </div>
        </div>

        {/* Action Buttons - Compact */}
        <div className="action-buttons">
          <Button
            onClick={onClearCart}
            disabled={cart.length === 0}
            className="clear-cart-btn"
          >
            Xóa giỏ hàng
          </Button>
          <Button
            onClick={() => handleSendOrderDirectly(true)}
            disabled={
              isCreatingOrder || isPrinting || cart.length === 0 || !isOnline
            }
            className="save-order-btn"
          >
            Lưu lại
          </Button>
          <Button
            onClick={
              isMobile
                ? () => handleSendOrderDirectly(false)
                : handleOpenPaymentModal
            }
            disabled={
              isCreatingOrder ||
              isPrinting ||
              !isOnline ||
              isProcessingPayment ||
              cart.length === 0
            }
            className="checkout-btn"
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
          </Button>
        </div>
      </Card>

      <PaymentModal
        visible={isPaymentModalVisible}
        onClose={handleClosePaymentModal}
        onConfirm={handleConfirmPayment}
        total={total}
        cart={cart}
        isCreatingOrder={false}
        initialPaymentMethod={payment?.method || "cash"}
        initialPaymentAmounts={{
          tien_mat: payment?.cash || 0,
          chuyen_khoan: payment?.method === "transfer" ? total : 0,
        }}
        initialCustomerInfo={{
          ong_ba: (customer?.name || "").trim(),
          cccd: (customer?.idNumber || "").trim(),
          dia_chi: "",
          so_dt: (customer?.phone || "").trim(),
          email: "",
          ma_so_thue_kh: (customer?.idNumber || "").trim(),
          ten_dv_kh: "",
        }}
        initialSync={true}
      />

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
};

export default PaymentSummary;
