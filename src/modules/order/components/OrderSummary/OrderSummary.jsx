import { message as messageAPI, Modal, notification } from "antd";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useReactToPrint } from "react-to-print";
import {
  multipleTablePutApi,
  printOrderApi
} from "../../../../api";
import jwt from "../../../../utils/jwt";
import { addTab, clearTabData, removeTab, switchTab, updateTabExtraProps } from "../../store/order";
import MergeOrder from "./MergeOrders/MergeOrder";
import "./OrderSummary.css";
import PaymentModal from "./PaymentModal/PaymentModal";
import PrintComponent from "./PrintComponent/PrintComponent";

const generateRandomId = () =>
  Array.from({ length: 16 }, () =>
    Math.floor(Math.random() * 36).toString(36)
  ).join("");

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
  const printContent = useRef();
  const [printMaster, setPrintMaster] = useState({});
  const [printDetail, setPrintDetail] = useState([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isPrinted, setIsPrinted] = useState(false);
  const [isMergeModalVisible, setIsMergeModalVisible] = useState(false);
  const [isCombining, setIsCombining] = useState(false);
  const [currentPrintData, setCurrentPrintData] = useState(null);
  const [hasReprinted, setHasReprinted] = useState(false);

  const activeTab = orders?.find(
    (tab) => tab.internalId === internalActiveTabId
  );

  useEffect(() => {
    if (activeTab && activeTab.autoOpenPayment) {
      setIsPaymentModalVisible(true);
      // Xóa flag ngay sau khi mở modal
      dispatch(updateTabExtraProps({ internalId: activeTab.internalId, autoOpenPayment: false }));
    }
  }, [activeTab, dispatch]);


  const generateOrderData = (
    status = "0",
    selectedPayments = [],
    paymentAmounts = {},
    customerInfo = {}
  ) => {
    if (!activeTab) {
      message.warning("Không có dữ liệu!");
      return null;
    }

    // Xử lý tiền thanh toán
    let finalTienMat = 0;
    let finalChuyenKhoan = 0;
    const totalAmount = Number(activeTab?.master?.tong_tien || 0);

    if (selectedPayments.length === 1) {
      // Nếu chỉ chọn 1 phương thức
      if (selectedPayments[0] === "tien_mat") {
        finalTienMat = totalAmount; // Luôn gửi đúng tổng tiền cần thanh toán
      } else {
        finalChuyenKhoan = totalAmount;
      }
    } else {
      // Nếu chọn cả 2 phương thức
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
      tong_tt: totalAmount.toString(), // Tổng thanh toán luôn bằng tổng tiền
      httt: selectedPayments.join(","),
      stt_rec: status === "2" ? activeTab?.master?.stt_rec || "" : "",
      status,
      cccd: customerInfo.cccd ?? activeTab?.master?.cccd ?? "",
      ong_ba: (customerInfo.ong_ba?.trim() || activeTab?.master?.ong_ba?.trim()) || "Khách hàng căng tin",
      so_dt: customerInfo.so_dt ?? activeTab?.master?.so_dt ?? "",
      dia_chi: customerInfo.dia_chi ?? activeTab?.master?.dia_chi ?? "",
      email: customerInfo.email ?? activeTab?.master?.email ?? "",
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
    const orderData = generateOrderData();
    if (!orderData) return;

    setIsCreatingOrder(true);
    try {
      const payload = {
        store: "Api_create_retail_order",
        param: { StoreID: storeId, unitId: unitId, userId: id },
        data: { master: [orderData.masterData], detail: orderData.detailData },
      };

      const response = await multipleTablePutApi(payload);
      if (response?.responseModel?.isSucceded) {
        notification.success({
          message: isSaveOnly
            ? "Đã lưu đơn hàng thành công!"
            : "Đơn hàng đã được gửi thành công!",
        });
        setTimeout(() => dispatch(clearTabData(internalActiveTabId)), 500);
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
    if (isCreatingOrder) return;

    if (!printMaster || !printDetail.length) {
      notification.warning({
        message: "Chưa đủ dữ liệu để thực hiện thanh toán!",
      });
      return;
    }

    setIsCreatingOrder(true);

    try {
      const payload = {
        store: "Api_create_retail_order",
        param: { StoreID: storeId, unitId: unitId, userId: id },
        data: { master: [printMaster], detail: printDetail },
      };

      const response = await multipleTablePutApi(payload);
      if (response?.responseModel?.isSucceded) {
        const sttRec = response?.listObject[0][0]?.stt_rec;
        if (sttRec) {
          try {
            await printOrderApi(sttRec, id);
            await syncFastApi(sttRec, id);
            notification.success({ message: "Thanh toán thành công !" });
          } catch (error) {
            notification.error({
              message: "Có lỗi xảy ra khi thực hiện thanh toán hoặc đồng bộ!",
              description: error.message,
            });
          }
        } else {
          notification.warning({
            message: "Không có `stt_rec` để thực hiện các API!",
          });
        }
        dispatch(removeTab({ internalId: internalActiveTabId })); 
      } else {
        notification.warning({ message: response?.responseModel?.message });
      }
    } catch (error) {
      notification.error({ message: "Có lỗi xảy ra, vui lòng thử lại!" });
    } finally {
      setIsCreatingOrder(false);
    }
  };

  const handlePreparePrint = (
    selectedPayments = ["tien_mat", "chuyen_khoan"],
    paymentAmounts = { tien_mat: "0", chuyen_khoan: "0" },
    customerInfo = {}
  ) => {
    const orderData = generateOrderData("2", selectedPayments, paymentAmounts, customerInfo);
    if (!orderData) return;

    setPrintMaster(orderData.masterData);
    setPrintDetail(orderData.detailData);
    setCurrentPrintData({ 
      master: orderData.masterData, 
      detail: orderData.detailData,
      selectedPayments,
      paymentAmounts,
      customerInfo
    });
    setHasReprinted(false);
    setIsPrinting(true);
    setIsPrinted(false);
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
        
        // Chỉ hỏi in thêm nếu chưa in thêm lần nào và có dữ liệu để in
        if (currentPrintData && !hasReprinted) {
          Modal.confirm({
            title: 'In thêm bản khác?',
            content: 'Bạn có muốn in thêm một bản nữa không?',
            onOk: () => {
              setHasReprinted(true); // Đánh dấu đã in thêm
              handleReprint();
            },
            onCancel: () => {
              setTimeout(() => handleSaveOrder(), 100);
            },
            okText: 'In thêm',
            cancelText: 'Đóng',
          });
        } else {
          // Đã in thêm rồi hoặc không có dữ liệu, lưu order luôn
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
  };

  const handleConfirmPayment = (selectedPayments, paymentAmounts, customerInfo) => {
    handleClosePaymentModal();
    if (selectedPayments.includes("chuyen_khoan")) {
      setShowQR(true);
    }
    handlePreparePrint(selectedPayments, paymentAmounts, customerInfo);
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
            disabled={isCombining || !activeTab?.detail?.length}
            onClick={handleCompleteCombineOrder}
          >
            {isCombining ? "Đang gộp..." : "Hoàn thành gộp đơn"}
          </button>
        ) : (
          <>
            {rawToken && roleWeb !== "isPosMini" && (
              <button
                className="summary-button secondary"
                onClick={handleMergeOrders}
                disabled={isCreatingOrder || isPrinting}
              >
                Gộp đơn
              </button>
            )}
            {rawToken && (
              <button
                className="summary-button save"
                onClick={() => handleSendOrderDirectly(true)}
                disabled={
                  isCreatingOrder || isPrinting || !activeTab?.detail?.length
                }
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
              disabled={isCreatingOrder || isPrinting}
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
        />
      </div>

      {contextHolder}
    </div>
  );
}
