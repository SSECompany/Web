import https from "../../../utils/https";
import jwt from "../../../utils/jwt";

// Simple logger replacement
const logger = console;

export const refreshToken = async () => {
  return await https
    .post(`Authentication/Refresh`, {
      token: await jwt.getAccessToken(),
      refreshToken: await jwt.getRefreshToken(),
    })
    .then(async (res) => {
      const token = res?.data?.token;
      const refreshToken = res?.data?.refreshToken;

      return [token, refreshToken];
    });
};

export const apiCreateAccount = async ({ name, userName, password, email }) => {
  return await https
    .post(`User/CreateUser`, {
      roleId: 2,
      isDisable: false,
      name,
      userName,
      password,
      email,
    })
    .then(async (res) => {
      return res.data;
    })
    .catch((err) => {
      return null;
    });
};

export const apiGetStoreByUser = async (payload) => {
  return await https.get(`User/GetStore`, payload).then((res) => {
    return res.data;
  });
};

export const multipleTablePutApi = async (payload) => {
  const isCustomerView = window.location.pathname.includes("order");
  const token = localStorage.getItem("access_token");

  let apiUrl;

  if (isCustomerView && !token) {
    apiUrl = `User/AddDataCustomerPre`;
  } else if (!isCustomerView && token) {
    apiUrl = `User/AddData`;
  } else {
    console.warn(
      "⚠️ Không xác định endpoint phù hợp, sử dụng mặc định AddDataCustomerPre"
    );
    apiUrl = `User/AddDataCustomerPre`;
  }

  return await https
    .post(apiUrl, payload, {
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
      },
    })
    .then((res) => {
      return res?.data || [];
    });
};

export const addDataMultiObjectApi = async (payload) => {
  const token = localStorage.getItem("access_token");

  return await https
    .post(`User/AddDataMutiObject`, payload, {
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
        "Content-Type": "application/json",
      },
    })
    .then((res) => {
      return res?.data || [];
    });
};


// ✅ PERFORMANCE OPTIMIZATION: Cached token
let _cachedToken = null;
let _tokenCacheTime = 0;
const TOKEN_CACHE_DURATION = 300000; // 5 minutes

const getCachedToken = () => {
  const now = Date.now();
  if (_cachedToken && now - _tokenCacheTime < TOKEN_CACHE_DURATION) {
    return _cachedToken;
  }

  _cachedToken = localStorage.getItem("access_token");
  _tokenCacheTime = now;
  return _cachedToken;
};



// Print Job Tracking API
export const getPrintJobTracking = async (params = {}) => {
  try {
    // Nếu không có ngày thì để null
    const payload = {
      ...params,
      ngay: params.ngay || null,
    };

    const response = await multipleTablePutApi({
      store: "api_getPrintJobTracking",
      param: payload,
      data: {},
    });

    return response;
  } catch (error) {
    console.error("Error fetching print job tracking:", error);
    throw error;
  }
};

// Print Order Retry API
  try {
    const token = localStorage.getItem("access_token");
    const response = await https.post("Print/print-order-retry", payload, {
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error retrying print order:", error);
    throw error;
  }
};

// Lấy danh sách máy in (store: api_getDMMayIn)
export const getPrinterList = async ({
  tenMay = "",
  pageIndex = 1,
  pageSize = 10,
} = {}) => {
  try {
    const response = await multipleTablePutApi({
      store: "api_getDMMayIn",
      param: { tenMay, pageIndex, pageSize },
      data: {},
    });
    return response;
  } catch (error) {
    console.error("Error fetching printer list:", error);
    throw error;
  }
};

// Cập nhật máy in (store: api_updateDMMayIn)
export const updatePrinter = async ({ ma_may, ten_may, IpAddress, status }) => {
  try {
    const response = await multipleTablePutApi({
      store: "api_updateDMMayIn",
      param: { ma_may, ten_may, IpAddress, status },
      data: {},
    });
    return response;
  } catch (error) {
    console.error("Error updating printer:", error);
    throw error;
  }
};

// Đếm tổng số lỗi in theo ngày (store: api_countPrintStatus_ByDate)
export const api_countPrintStatus_ByDate = async (ngay) => {
  try {
    const response = await multipleTablePutApi({
      store: "api_countPrintStatus_ByDate",
      param: { ngay },
      data: {},
    });
    return response;
  } catch (error) {
    console.error("Error fetching print status count:", error);
    throw error;
  }
};

// API gọi stored procedure api_ProcessCombinedMealOrder
export const apiProcessCombinedMealOrder = async ({
  StoreID,
  unitId,
  userId,
  masterData,
  detailData,
}) => {
  const token = localStorage.getItem("access_token");

  try {
    const payload = {
      store: "api_ProcessCombinedMealOrder",
      param: {
        StoreID,
        unitId,
        UserID: userId,
      },
      data: {
        masterCombinedMealOrder: masterData,
        detailCombinedMealOrder: detailData,
      },
    };

    const response = await https.post(`User/AddData`, payload, {
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
        "Content-Type": "application/json",
      },
    });

    return response?.data || [];
  } catch (error) {
    console.error("Error calling api_ProcessCombinedMealOrder:", error);
    throw error;
  }
};

// API lấy danh sách suất ăn người nhà bệnh nhân
export const apiGetRetailOrderPatientIsFamily = async ({
  so_ct = "",
  ngay_ct = "",
  ma_kh = "",
  status = "",
  ma_ban = "",
  s2 = "",
  s3 = "",
  ten_bp = "",
  so_giuong = "",
  so_phong = "",
  ca_an = "",
  thutien_yn = "",
  pageIndex = "1",
  pageSize = "20",
  userId,
  unitId,
  storeId,
  ma_gd = "3",
}) => {
  try {
    const response = await multipleTablePutApi({
      store: "api_get_retail_order_patientIs_family",
      param: {
        so_ct,
        ngay_ct,
        ma_kh,
        status,
        ma_ban,
        s2,
        s3,
        ten_bp,
        so_giuong,
        so_phong,
        ca_an,
        thutien_yn,
        pageIndex,
        pageSize,
        userId: userId.toString(),
        unitId,
        storeId,
        ma_gd,
      },
      data: {},
    });

    return response;
  } catch (error) {
    console.error(
      "Error calling api_get_retail_order_patientIs_family:",
      error
    );
    throw error;
  }
};

// API lấy danh sách đơn hàng sinh viên
export const apiGetRetailOrderStudentOrders = async ({
  storeId = "",
  ts_yn = 0,
  unitId = "PHENIKAA",
  dateFrom,
  dateTo,
  pageIndex = 1,
  pageSize = 20,
  ten_bp = "",
  ten_kh = "",
  ma_ca = "",
  ten_vt = "",
}) => {
  // Sử dụng ngày hiện tại nếu không truyền dateFrom/dateTo
  const today = new Date();
  const todayString = today.toISOString().split("T")[0]; // Format: YYYY-MM-DD
  const finalDateFrom = dateFrom || todayString;
  const finalDateTo = dateTo || todayString;
  try {
    const response = await multipleTablePutApi({
      store: "api_get_retail_order_student_orders",
      param: {
        StoreId: storeId,
        ts_yn: ts_yn,
        UnitId: unitId,
        DateFrom: finalDateFrom,
        DateTo: finalDateTo,
        PageIndex: pageIndex,
        PageSize: pageSize,
        // Thêm các tham số filter
        ten_bp: ten_bp,
        ten_kh: ten_kh,
        ma_ca: ma_ca,
        ten_vt: ten_vt,
      },
      data: {},
    });

    return response;
  } catch (error) {
    console.error("Error calling api_get_retail_order_student_orders:", error);
    throw error;
  }
};

// API lấy danh sách đơn hàng sinh viên trả sau
export const apiGetRetailOrderPostpaidStudentOrders = async ({
  storeId = "",
  ts_yn = 1,
  unitId = "PHENIKAA",
  dateFrom,
  dateTo,
  pageIndex = 1,
  pageSize = 20,
  ten_bp = "",
  ten_kh = "",
  ma_ca = "",
  ten_vt = "",
}) => {
  // Sử dụng ngày hiện tại nếu không truyền dateFrom/dateTo
  const today = new Date();
  const todayString = today.toISOString().split("T")[0]; // Format: YYYY-MM-DD
  const finalDateFrom = dateFrom || todayString;
  const finalDateTo = dateTo || todayString;
  try {
    const response = await multipleTablePutApi({
      store: "api_get_retail_order_student_orders",
      param: {
        StoreId: storeId,
        ts_yn: ts_yn,
        UnitId: unitId,
        DateFrom: finalDateFrom,
        DateTo: finalDateTo,
        PageIndex: pageIndex,
        PageSize: pageSize,
        // Thêm các tham số filter
        ten_bp: ten_bp,
        ten_kh: ten_kh,
        ma_ca: ma_ca,
        ten_vt: ten_vt,
      },
      data: {},
    });

    return response;
  } catch (error) {
    console.error(
      "Error calling api_get_retail_order_student_orders (postpaid):",
      error
    );
    throw error;
  }
};

// API xác nhận đơn hàng sinh viên (cả trả trước và trả sau)
export const apiConfirmStudentOrder = async ({
  ngay_ct,
  ma_kh,
  storeId = "BP001",
  ca_an,
  ma_vt,
  so_luong,
  ts_yn = 0, // 0 = trả trước, 1 = trả sau
  unitId = "PHENIKAA",
  userId,
}) => {
  try {
    const response = await multipleTablePutApi({
      store: "api_get_data_retail_order_student_orders",
      param: {
        ngay_ct: ngay_ct,
        ma_kh: ma_kh,
        StoreID: storeId,
        ca_an: ca_an,
        ma_vt: ma_vt,
        so_luong: so_luong,
        ts_yn: ts_yn,
        UnitId: unitId,
        userId: userId,
      },
      data: {},
    });
    return response;
  } catch (error) {
    console.error(
      "Error calling api_get_data_retail_order_student_orders:",
      error
    );
    throw error;
  }
};

// API xác nhận đơn hàng sinh viên trả trước (deprecated - sử dụng apiConfirmStudentOrder)
export const apiConfirmPrepaidStudentOrder = async ({
  ngay_ct,
  ma_kh,
  storeId = "BP001",
  ca_an,
  ma_vt,
  so_luong,
  unitId = "PHENIKAA",
  userId,
}) => {
  return await apiConfirmStudentOrder({
    ngay_ct,
    ma_kh,
    storeId,
    ca_an,
    ma_vt,
    so_luong,
    ts_yn: 0, // trả trước
    unitId,
    userId,
  });
};
