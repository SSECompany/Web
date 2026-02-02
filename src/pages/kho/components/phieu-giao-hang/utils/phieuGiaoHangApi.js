import { message } from "antd";
import https from "../../../../../utils/https";
import axiosInstance from "../../../../../utils/axiosInstance";
import { APP_CONFIG } from "../../../../../utils/constants";

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
    if (params.Keyword) queryParams.Keyword = params.Keyword;
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
        ma_van_don: item.orderNumber?.trim() || "",
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
          totalRecord: apiData.totalCount ?? apiData.totalRecords ?? apiData.total ?? 0,
          pageIndex: apiData.pageIndex ?? params.PageIndex ?? 1,
          pageSize: apiData.pageSize ?? params.PageSize ?? 20,
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
  // Build full URL cho imageUrls (không async, chỉ build URL)
  const buildImageUrl = (url) => {
    if (!url) return "";
    
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }
    
    // Nếu là relative path, thêm base URL
    const base = (APP_CONFIG?.apiUrl || "").replace(/\/$/, "");
    let path = url.startsWith("/") ? url : `/${url}`;
    
    // Xử lý trường hợp trùng lặp /api/
    if (base.includes("/api") && path.startsWith("/api/")) {
      path = path.replace(/^\/api/, "");
    }
    if (!path.startsWith("/")) {
      path = `/${path}`;
    }
    
    return `${base}${path}`;
  };

  const imageUrls = (apiData.imageUrls || []).map((img) => ({
    url: buildImageUrl(img.url),
    originalName: img.originalName || "",
  }));

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
    imageUrls: imageUrls, // Thêm imageUrls vào master data
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
        imageUrls: masterData.imageUrls || [], // Trả về imageUrls
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
        statusCode: response?.status || response?.data?.statusCode,
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
      statusCode: error?.response?.status || error?.response?.data?.statusCode,
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
        imageUrls: masterData.imageUrls || [], // Trả về imageUrls
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
        statusCode: response?.status || response?.data?.statusCode,
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
      statusCode: error?.response?.status || error?.response?.data?.statusCode,
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
      // Không hiển thị message ở đây, để component tự xử lý
      return {
        success: true,
        message: response?.data?.data || response?.data?.message,
      };
    } else {
      // Không hiển thị message ở đây, để component tự xử lý
      return {
        success: false,
        message: response?.data?.message || "Có lỗi xảy ra",
      };
    }
  } catch (error) {
    console.error("Lỗi cập nhật trạng thái:", error);
    const errorMessage = error?.response?.data?.message || error?.message || "Lỗi không xác định";
    // Không hiển thị message ở đây, để component tự xử lý
    return {
      success: false,
      message: errorMessage,
    };
  }
};

// API để upload ảnh cho phiếu giao hàng
export const uploadDeliveryImage = async ({
  file,
  stt_rec,
  isPublicAccess = false,
  slug = "",
}) => {
  if (!file) {
    console.warn("No file provided to uploadDeliveryImage");
    return { success: false, message: "Chưa chọn file" };
  }

  if (!stt_rec) {
    console.warn("No stt_rec provided to uploadDeliveryImage");
    return { success: false, message: "Chưa có mã phiếu giao hàng" };
  }

  try {
    const token = localStorage.getItem("access_token");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("controllerFields", "delivery");
    formData.append("keyFields", stt_rec);
    formData.append("isPublicAccess", String(isPublicAccess));
    formData.append("slug", slug || "");    const res = await axiosInstance.post(`FileUpload/upload`, formData, {
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
        Accept: "text/plain",
        "Content-Type": "multipart/form-data",
      },
      timeout: 60000, // 60 seconds timeout
    });    // Normalize possible return values into a resolvable URL
    let raw = res?.data;
    let url = "";
    if (typeof raw === "string") {
      // try to extract URL-like segment
      const match = raw.match(/https?:\/\/[^\s"']+/i);
      if (match) {
        url = match[0];
      } else {
        // treat as path
        const base = (APP_CONFIG?.apiUrl || "").replace(/\/$/, "");
        let path = raw.replace(/^"|"$/g, "").replace(/^\//, "");
        // Remove duplicate /api/ if path starts with api/ and base already contains /api
        if (path.startsWith("api/") && base.includes("/api")) {
          path = path.replace(/^api\//, "");
        }
        url = `${base}/${path}`;
      }
    } else if (raw && typeof raw === "object") {
      url = raw.url || raw.fileUrl || raw.path || "";
      if (url && !/^https?:\/\//i.test(url)) {
        const base = (APP_CONFIG?.apiUrl || "").replace(/\/$/, "");
        let path = url.replace(/^\//, "");
        // Remove duplicate /api/ if path starts with api/ and base already contains /api
        if (path.startsWith("api/") && base.includes("/api")) {
          path = path.replace(/^api\//, "");
        }
        url = `${base}/${path}`;
      }
    }
    
    // Fix duplicate /api/ in URL - replace all occurrences of /api/api/ with /api/
    if (url) {
      // Replace /api/api/ with /api/ (can happen multiple times)
      while (url.includes("/api/api/")) {
        url = url.replace(/\/api\/api\//g, "/api/");
      }
    }

    return { success: true, data: { url, keyFields: stt_rec, raw } };
  } catch (error) {
    console.error("Error uploading delivery image:", error);
    console.error("Error details:", {
      message: error?.message,
      response: error?.response?.data,
      status: error?.response?.status,
      config: error?.config,
    });
    const errorMessage = error?.response?.data?.message || error?.message || "Tải ảnh thất bại";
    return { success: false, message: errorMessage };
  }
};

// API để xóa ảnh cho phiếu giao hàng
export const deleteDeliveryImage = async (fileId) => {
  if (!fileId) {
    console.warn("No fileId provided to deleteDeliveryImage");
    return { success: false, message: "Chưa có ID file để xóa" };
  }

  try {
    const token = localStorage.getItem("access_token");
    
    // Extract fileId từ URL nếu là full URL
    let fileIdToDelete = fileId;
    if (fileId.includes("/")) {
      // Nếu là URL, extract ID từ cuối URL
      const parts = fileId.split("/");
      fileIdToDelete = parts[parts.length - 1];
    }

    const response = await axiosInstance.delete(`FileUpload/${fileIdToDelete}`, {
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
        Accept: "application/json",
      },
    });

    return { success: true, data: response.data };
  } catch (error) {
    console.error("Error deleting delivery image:", error);
    console.error("Error details:", {
      message: error?.message,
      response: error?.response?.data,
      status: error?.response?.status,
    });
    const errorMessage = error?.response?.data?.message || error?.message || "Xóa ảnh thất bại";
    return { success: false, message: errorMessage };
  }
};
