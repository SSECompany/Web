import { message } from "antd";
import https from "../../../../../utils/https";

// API để lấy danh sách phiếu giao hàng - Sử dụng API mới /api/Delivery
export const fetchPhieuGiaoHangList = async (params) => {
  const token = localStorage.getItem("access_token");

  try {
    // Build query params
    const queryParams = {};
    if (params.FromDate) queryParams.FromDate = params.FromDate;
    if (params.ToDate) queryParams.ToDate = params.ToDate;
    if (params.MaDvcs) queryParams.MaDvcs = params.MaDvcs;
    if (params.CustomerCode) queryParams.CustomerCode = params.CustomerCode;
    if (params.VoucherNo) queryParams.VoucherNo = params.VoucherNo;
    if (params.Status) queryParams.Status = params.Status;
    if (params.OrderNumber) queryParams.OrderNumber = params.OrderNumber;
    if (params.VehicleCode) queryParams.VehicleCode = params.VehicleCode;
    if (params.PageIndex) queryParams.PageIndex = params.PageIndex;
    if (params.PageSize) queryParams.PageSize = params.PageSize;

    const response = await https.get("Delivery", queryParams, {
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
        accept: "*/*",
      },
    });

    if (response?.data?.isSucceeded === true && response?.data?.data) {
      const apiData = response.data.data;
      const items = apiData.items || [];

      // Map API response sang format hiện tại
      const mappedData = items.map((item) => ({
        stt_rec: item.voucherId || "",
        so_ct: item.voucherNo?.trim() || "",
        ngay_ct: item.voucherDate || "",
        ma_dvs: item.unitCode?.trim() || "",
        ma_kh: item.customerCode?.trim() || "",
        ten_kh: item.customerName?.trim() || "",
        sdt_kh: item.customerPhone?.trim() || "",
        dia_chi: item.shippingAddressName || "",
        so_don_hang: item.orderNumber?.trim() || "",
        ngay_don_hang: item.orderDate || "",
        status: item.status || "1", // Default: 1 (Lập chứng từ)
        statusname: item.statusName || "",
        ten_nha_xe: item.carrierName || "",
        sdt_nha_xe: item.carrierPhone || "",
        gio_chay: item.departureTime || "",
        tong_so_kien: item.totalPackages || 0,
        ghi_chu: item.description || "",
      }));

      return {
        data: mappedData,
        pagination: {
          totalRecord: apiData.totalCount || 0,
          pageIndex: apiData.pageIndex || 1,
          pageSize: apiData.pageSize || 20,
        },
        success: true,
      };
    } else {
      return {
        data: [],
        pagination: {},
        success: false,
        error: response?.data?.message || "Lỗi không xác định",
      };
    }
  } catch (error) {
    console.error("Lỗi gọi API danh sách phiếu giao hàng:", error);
    return {
      data: [],
      pagination: {},
      success: false,
      error: error?.response?.data?.message || error?.message || "Lỗi không xác định",
    };
  }
};

// Helper function để map API response sang format hiện tại
const mapDeliveryDataToMaster = (apiData) => {
  return {
    stt_rec: apiData.voucherId || "",
    so_ct: apiData.voucherNo?.trim() || "",
    ngay_ct: apiData.voucherDate || "",
    ma_dvs: apiData.unitCode?.trim() || "",
    ma_kh: apiData.customerCode?.trim() || "",
    ten_kh: apiData.customerName?.trim() || "",
    sdt_kh: apiData.customerPhone?.trim() || "",
    dia_chi: apiData.shippingAddressName || "",
    so_don_hang: apiData.orderNumber?.trim() || "",
    ngay_don_hang: apiData.orderDate || "",
    status: apiData.status || "1", // Default: 1 (Lập chứng từ)
    statusname: apiData.statusName || "",
    ten_nha_xe: apiData.carrierName || "",
    sdt_nha_xe: apiData.carrierPhone || "",
    gio_chay: apiData.departureTime || "",
    tong_so_kien: apiData.totalPackages || 0,
    ghi_chu: apiData.description || "",
    vehicleCode: apiData.vehicleCode || "",
    deliveryCode: apiData.deliveryCode || "",
    dispatcherCode: apiData.dispatcherCode || "",
    deliveryStaffCode: apiData.deliveryStaffCode || "",
    routeName: apiData.routeName || "",
  };
};

// Helper function để map history sang format log
const mapHistoryToLog = (history) => {
  return (history || []).map((log) => ({
    time: log.createdDate || "",
    action: log.statusName || "",
    user: log.userId || "",
    note: log.note || "",
    actionType: log.actionType || "",
  }));
};

// API để lấy chi tiết phiếu giao hàng khi QUÉT QR - Sử dụng /api/Delivery/:voucherId
export const fetchPhieuGiaoHangDataByQR = async (voucherId) => {
  const token = localStorage.getItem("access_token");

  try {
    const response = await https.get(`Delivery/${voucherId}`, {}, {
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
        accept: "*/*",
      },
    });

    if (response?.data?.isSucceeded === true && response?.data?.data) {
      const apiData = response.data.data;
      const masterData = mapDeliveryDataToMaster(apiData);
      const statusLog = mapHistoryToLog(apiData.history);

      return {
        master: masterData,
        detail: [], // API mới không có detail, có thể bổ sung sau
        log: statusLog,
        statusLog: statusLog, // Keep both for compatibility
        success: true,
      };
    } else {
      return {
        master: null,
        detail: [],
        log: [],
        statusLog: [],
        success: false,
        error: response?.data?.message || "Lỗi không xác định",
      };
    }
  } catch (error) {
    console.error("Lỗi gọi API chi tiết phiếu giao hàng (QR):", error);
    return {
      master: null,
      detail: [],
      log: [],
      statusLog: [],
      success: false,
      error: error?.response?.data?.message || error?.message || "Lỗi không xác định",
    };
  }
};

// API để lấy chi tiết phiếu giao hàng khi XEM TRỰC TIẾP - Sử dụng /api/Delivery/:voucherDateStr/:voucherId
// voucherDateStr format: YYYYMMDD (ví dụ: 20260121)
export const fetchPhieuGiaoHangDataByView = async (voucherDateStr, voucherId) => {
  const token = localStorage.getItem("access_token");

  try {
    const response = await https.get(`Delivery/${voucherDateStr}/${voucherId}`, {}, {
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
        accept: "*/*",
      },
    });

    if (response?.data?.isSucceeded === true && response?.data?.data) {
      const apiData = response.data.data;
      const masterData = mapDeliveryDataToMaster(apiData);
      const statusLog = mapHistoryToLog(apiData.history);

      return {
        master: masterData,
        detail: [], // API mới không có detail, có thể bổ sung sau
        log: statusLog,
        statusLog: statusLog, // Keep both for compatibility
        success: true,
      };
    } else {
      return {
        master: null,
        detail: [],
        log: [],
        statusLog: [],
        success: false,
        error: response?.data?.message || "Lỗi không xác định",
      };
    }
  } catch (error) {
    console.error("Lỗi gọi API chi tiết phiếu giao hàng (View):", error);
    return {
      master: null,
      detail: [],
      log: [],
      statusLog: [],
      success: false,
      error: error?.response?.data?.message || error?.message || "Lỗi không xác định",
    };
  }
};


// API để cập nhật trạng thái phiếu giao hàng - Sử dụng API mới /api/Delivery/update-status
export const updateDeliveryStatus = async (payload) => {
  const token = localStorage.getItem("access_token");

  try {
    const response = await https.post(
      "Delivery/update-status",
      {
        unitCode: payload.unitCode,
        voucherId: payload.voucherId,
        VoucherDate: payload.VoucherDate,
        newStatus: payload.newStatus,
        note: payload.note || "",
      },
      {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          accept: "*/*",
          "Content-Type": "application/json",
        },
      }
    );

    if (response?.data?.isSucceeded === true) {
      message.success(response?.data?.data || "Cập nhật trạng thái thành công");
      return {
        success: true,
        message: response?.data?.data || response?.data?.message,
      };
    } else {
      message.error(response?.data?.message || "Có lỗi xảy ra");
      return {
        success: false,
        message: response?.data?.message || "Có lỗi xảy ra",
      };
    }
  } catch (error) {
    console.error("Lỗi cập nhật trạng thái:", error);
    const errorMessage = error?.response?.data?.message || error?.message || "Lỗi không xác định";
    message.error(errorMessage);
    return {
      success: false,
      message: errorMessage,
    };
  }
};

