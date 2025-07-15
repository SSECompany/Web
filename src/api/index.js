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
        stt_rec: [sttRec], // giống syncFastApi
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
    const isBusinessSuccess = response?.data?.responseModel?.isSucceded === true;

    if (isBusinessSuccess) {
      // Log success chỉ khi business logic thành công
      logger.logSuccess(sttRec, userId, response, duration, "printOrderApi");
      return response?.data || [];
    } else {
      // HTTP 200 nhưng business logic fail → coi như lỗi và retry
      const businessError = new Error(
        response?.data?.responseModel?.message || "API business logic failed (isSucceded: false)"
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

    console.error(`❌ PrintOrderApi ${enhancedError.type || "ERROR"}:`, {
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
    const isBusinessSuccess = response?.data?.responseModel?.isSucceded === true;

    if (isBusinessSuccess) {
      // Log success chỉ khi business logic thành công
      logger.logSuccess(sttRec, userId, response, duration, "syncFastApi");
      return response?.data || [];
    } else {
      // HTTP 200 nhưng business logic fail → coi như lỗi và retry
      const businessError = new Error(
        response?.data?.responseModel?.message || "API business logic failed (isSucceded: false)"
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

    console.error(`❌ SyncFastApi ${enhancedError.type || "ERROR"}:`, {
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
