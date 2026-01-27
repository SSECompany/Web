import https from "../utils/https";
import jwt from "../utils/jwt";
import simpleLogger from "../utils/simpleLogger";

// Use simple logger
const logger = simpleLogger;

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

export const apiGetShiftList = async (payload) => {
  const token = localStorage.getItem("access_token");

  return await https
    .post(`User/AddData`, payload, {
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
        "Content-Type": "application/json",
      },
    })
    .then((res) => {
      return res?.data || [];
    })
    .catch((err) => {
      console.error("❌ Error fetching shift list:", err);
      return [];
    });
};

export const printOrderApi = async (sttRec, userId) => {
  const token = getCachedToken();
  const startTime = Date.now();

  // Pre-request validation và logging
  const requestInfo = {
    sttRec,
    userId,
    hasToken: !!token,
    isOnline: navigator.onLine,
    timestamp: new Date().toISOString(),
    baseURL: "Print/print-order",
  };

  // Log request với network info
  logger.logRequest(sttRec, userId, "printOrderApi");

  // Check network status trước khi call
  if (!navigator.onLine) {
    const networkError = new Error("Network offline - no internet connection");
    networkError.type = "NETWORK_OFFLINE";
    networkError.networkInfo = requestInfo;

    const duration = Date.now() - startTime;
    logger.logError(sttRec, userId, networkError, duration, "printOrderApi");

    console.error("🌐 Network offline for print-order:", requestInfo);
    throw networkError;
  }

  try {
    // Set timeout để detect connection issues
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000); // 90 giây

    const response = await https.post(
      `Print/print-order`,
      {
        stt_rec: sttRec,
        action: "0",
        userId: userId.toString(),
      },
      {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
        signal: controller.signal, // Add timeout support
      }
    );

    clearTimeout(timeoutId); // Clear timeout nếu thành công

    const duration = Date.now() - startTime;

    // Check business logic success - giống syncFastApi
    const isBusinessSuccess =
      response?.data?.responseModel?.isSucceded === true;

    if (isBusinessSuccess) {
      // Log success chỉ khi business logic thành công
      logger.logSuccess(sttRec, userId, response, duration, "printOrderApi");
      return response?.data || [];
    } else {
      // HTTP 200 nhưng business logic fail → coi như lỗi và retry
      const businessError = new Error(
        response?.data?.responseModel?.message ||
          "API business logic failed (isSucceded: false)"
      );

      // Attach response data để có thể analyze
      businessError.response = {
        status: 200, // HTTP OK nhưng business fail
        statusText: "Business Logic Failed",
        data: response?.data,
      };

      // Log as error
      logger.logError(sttRec, userId, businessError, duration, "printOrderApi");

      console.error("❌ PrintOrderApi Business Logic Error:", {
        sttRec,
        userId,
        isSucceded: response?.data?.responseModel?.isSucceded,
        message: response?.data?.responseModel?.message,
        response: response?.data,
      });

      throw businessError;
    }
  } catch (error) {
    const duration = Date.now() - startTime;

    // Enhanced error classification cho no-response cases
    let enhancedError = error;
    const errorMessage = error?.message?.toLowerCase() || "";

    // Classify network errors chi tiết hơn
    if (error.name === "AbortError" || errorMessage.includes("aborted")) {
      enhancedError = new Error(
        `Request timeout after ${duration}ms - no response from server`
      );
      enhancedError.type = "REQUEST_TIMEOUT";
      enhancedError.originalError = error;
      enhancedError.networkInfo = requestInfo;
    } else if (
      errorMessage.includes("network error") ||
      errorMessage.includes("failed to fetch")
    ) {
      enhancedError = new Error(
        `Network connection failed - server unreachable`
      );
      enhancedError.type = "CONNECTION_FAILED";
      enhancedError.originalError = error;
      enhancedError.networkInfo = requestInfo;
    } else if (
      errorMessage.includes("dns") ||
      errorMessage.includes("name resolution")
    ) {
      enhancedError = new Error(
        `DNS resolution failed - cannot resolve server address`
      );
      enhancedError.type = "DNS_FAILED";
      enhancedError.originalError = error;
      enhancedError.networkInfo = requestInfo;
    } else if (
      errorMessage.includes("ssl") ||
      errorMessage.includes("certificate")
    ) {
      enhancedError = new Error(
        `SSL/TLS connection failed - certificate issue`
      );
      enhancedError.type = "SSL_FAILED";
      enhancedError.originalError = error;
      enhancedError.networkInfo = requestInfo;
    } else if (errorMessage.includes("cors")) {
      enhancedError = new Error(`CORS policy blocked request`);
      enhancedError.type = "CORS_BLOCKED";
      enhancedError.originalError = error;
      enhancedError.networkInfo = requestInfo;
    } else if (!error.response) {
      // Không có response object → network/connection issue
      enhancedError = new Error(
        `No response received - connection issue (${errorMessage})`
      );
      enhancedError.type = "NO_RESPONSE";
      enhancedError.originalError = error;
      enhancedError.networkInfo = requestInfo;
    }

    // Attach diagnostic info
    enhancedError.diagnostics = {
      duration,
      networkOnline: navigator.onLine,
      hasToken: !!token,
      timestamp: new Date().toISOString(),
      connectionType: navigator.connection?.effectiveType || "unknown",
      userAgent: navigator.userAgent,
    };

    // Log error với enhanced info
    logger.logError(sttRec, userId, enhancedError, duration, "printOrderApi");

    console.error(`❌ PrintOrderApi ${enhancedError.type || "FAILED"}:`, {
      type: enhancedError.type,
      message: enhancedError.message,
      duration: `${duration}ms`,
      networkInfo: requestInfo,
      diagnostics: enhancedError.diagnostics,
      originalError: error,
    });

    throw enhancedError;
  }
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

export const syncFastApi = async (sttRec, userId) => {
  const token = getCachedToken();
  const startTime = Date.now();

  // Pre-request validation và logging
  const requestInfo = {
    sttRec,
    userId,
    hasToken: !!token,
    isOnline: navigator.onLine,
    timestamp: new Date().toISOString(),
    baseURL: "SynchronousFAST/InvoiceReceipt",
  };

  // Log request với network info
  logger.logRequest(sttRec, userId, "syncFastApi");

  // Check network status trước khi call
  if (!navigator.onLine) {
    const networkError = new Error("Network offline - no internet connection");
    networkError.type = "NETWORK_OFFLINE";
    networkError.networkInfo = requestInfo;

    const duration = Date.now() - startTime;
    logger.logError(sttRec, userId, networkError, duration, "syncFastApi");

    console.error("🌐 Network offline:", requestInfo);
    throw networkError;
  }

  try {
    // Set timeout để detect connection issues
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000); // 90 giây

    const response = await https.post(
      `SynchronousFAST/InvoiceReceipt`,
      {
        stt_rec: [sttRec],
        action: "",
        userId: userId.toString(),
      },
      {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
        signal: controller.signal, // Add timeout support
      }
    );

    clearTimeout(timeoutId); // Clear timeout nếu thành công

    const duration = Date.now() - startTime;

    // Check business logic success
    const isBusinessSuccess =
      response?.data?.responseModel?.isSucceded === true;

    if (isBusinessSuccess) {
      // Log success chỉ khi business logic thành công
      logger.logSuccess(sttRec, userId, response, duration, "syncFastApi");
      return response?.data || [];
    } else {
      // HTTP 200 nhưng business logic fail → coi như lỗi và retry
      const businessError = new Error(
        response?.data?.responseModel?.message ||
          "API business logic failed (isSucceded: false)"
      );

      // Attach response data để có thể analyze
      businessError.response = {
        status: 200, // HTTP OK nhưng business fail
        statusText: "Business Logic Failed",
        data: response?.data,
      };

      // Log as error
      logger.logError(sttRec, userId, businessError, duration, "syncFastApi");

      console.error("❌ SyncFastApi Business Logic Error:", {
        sttRec,
        userId,
        isSucceded: response?.data?.responseModel?.isSucceded,
        message: response?.data?.responseModel?.message,
        response: response?.data,
      });

      throw businessError;
    }
  } catch (error) {
    const duration = Date.now() - startTime;

    // Enhanced error classification cho no-response cases
    let enhancedError = error;
    const errorMessage = error?.message?.toLowerCase() || "";

    // Classify network errors chi tiết hơn
    if (error.name === "AbortError" || errorMessage.includes("aborted")) {
      enhancedError = new Error(
        `Request timeout after ${duration}ms - no response from server`
      );
      enhancedError.type = "REQUEST_TIMEOUT";
      enhancedError.originalError = error;
      enhancedError.networkInfo = requestInfo;
    } else if (
      errorMessage.includes("network error") ||
      errorMessage.includes("failed to fetch")
    ) {
      enhancedError = new Error(
        `Network connection failed - server unreachable`
      );
      enhancedError.type = "CONNECTION_FAILED";
      enhancedError.originalError = error;
      enhancedError.networkInfo = requestInfo;
    } else if (
      errorMessage.includes("dns") ||
      errorMessage.includes("name resolution")
    ) {
      enhancedError = new Error(
        `DNS resolution failed - cannot resolve server address`
      );
      enhancedError.type = "DNS_FAILED";
      enhancedError.originalError = error;
      enhancedError.networkInfo = requestInfo;
    } else if (
      errorMessage.includes("ssl") ||
      errorMessage.includes("certificate")
    ) {
      enhancedError = new Error(
        `SSL/TLS connection failed - certificate issue`
      );
      enhancedError.type = "SSL_FAILED";
      enhancedError.originalError = error;
      enhancedError.networkInfo = requestInfo;
    } else if (errorMessage.includes("cors")) {
      enhancedError = new Error(`CORS policy blocked request`);
      enhancedError.type = "CORS_BLOCKED";
      enhancedError.originalError = error;
      enhancedError.networkInfo = requestInfo;
    } else if (!error.response) {
      // Không có response object → network/connection issue
      enhancedError = new Error(
        `No response received - connection issue (${errorMessage})`
      );
      enhancedError.type = "NO_RESPONSE";
      enhancedError.originalError = error;
      enhancedError.networkInfo = requestInfo;
    }

    // Attach diagnostic info
    enhancedError.diagnostics = {
      duration,
      networkOnline: navigator.onLine,
      hasToken: !!token,
      timestamp: new Date().toISOString(),
      connectionType: navigator.connection?.effectiveType || "unknown",
      userAgent: navigator.userAgent,
    };

    // Log error với enhanced info
    logger.logError(sttRec, userId, enhancedError, duration, "syncFastApi");

    console.error(`❌ SyncFastApi ${enhancedError.type || "FAILED"}:`, {
      type: enhancedError.type,
      message: enhancedError.message,
      duration: `${duration}ms`,
      networkInfo: requestInfo,
      diagnostics: enhancedError.diagnostics,
      originalError: error,
    });

    throw enhancedError;
  }
};

export const syncFastMutiApi = async (sttRecList, userId) => {
  const token = localStorage.getItem("access_token");
  return await https
    .post(
      `SynchronousFAST/CreateInvoiceMutiFromMTT`,
      {
        stt_rec: sttRecList,
        action: "",
        userId: userId.toString(),
      },
      {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
      }
    )
    .then((res) => {
      return res?.data || [];
    });
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
export const printOrderRetry = async (payload) => {
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

// API lấy danh sách suất ăn người nhà người bệnh
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
  // Sử dụng ngày hiện tại nếu không truyền ngay_ct
  const today = new Date();
  const day = String(today.getDate()).padStart(2, "0");
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const year = today.getFullYear();
  const todayString = `${day}/${month}/${year}`; // Format: DD/MM/YYYY
  const finalNgayCt = ngay_ct || todayString;

  try {
    const response = await multipleTablePutApi({
      store: "api_get_retail_order_patientIs_family",
      param: {
        so_ct,
        ngay_ct: finalNgayCt,
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
