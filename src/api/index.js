import axiosInstance from "../utils/axiosInstance";
import { APP_CONFIG } from "../utils/constants";
import https from "../utils/https";
import jwt from "../utils/jwt";

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

export const apiGetDVCS = async (username) => {
  return await https
    .get(
      `Authentication/DVCS`,
      { username },
      { headers: { Authorization: "" } }
    )
    .then((res) => res?.data || [])
    .catch(() => []);
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
  const token = localStorage.getItem("access_token");
  return await https
    .get(`User/GetStore`, payload, {
      headers: { Authorization: token ? `Bearer ${token}` : "" },
    })
    .then((res) => {
      return res?.data || [];
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
  const token = localStorage.getItem("access_token");
  return await https
    .post(
      `Print/print-order`,
      {
        stt_rec: sttRec,
        action: "0",
        userId: userId,
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

export const syncFastApi = async (sttRec, userId) => {
  const token = localStorage.getItem("access_token");
  return await https
    .post(
      `SynchronousFAST/CreateInvoiceFromMTT`,
      {
        stt_rec: sttRec,
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

// ===== TAPMED PHARMACY APIs =====

export const searchVatTu = async (
  searchValue = "",
  pageindex = 1,
  pagesize = 1000,
  unitId = null,
  userId = null
) => {
  const token = localStorage.getItem("access_token");

  const payload = {
    store: "api_getListItem",
    param: {
      Currency: "VND",
      searchValue: searchValue,
      unitId: unitId,
      userId: userId,
      pageindex: pageindex,
      pagesize: pagesize,
    },
    data: {},
  };

  return await https
    .post(`User/AddData`, payload, {
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
        "Content-Type": "application/json",
      },
    })
    .then((res) => {
      // Trả về response nguyên bản từ API
      return (
        res?.data || {
          responseModel: {
            isSucceded: false,
            message: "Không có dữ liệu",
          },
          listObject: [],
        }
      );
    })
    .catch((error) => {
      console.error("Error searching vat tu:", error);
      return {
        responseModel: {
          isSucceded: false,
          message: "Lỗi kết nối mạng",
        },
        listObject: [],
      };
    });
};

// === Tax Info API ===
export const api_getTaxInfo = async (ten_thue = "") => {
  const token = localStorage.getItem("access_token");

  const payload = {
    store: "api_getTaxInfo",
    param: {
      ten_thue: ten_thue,
    },
    data: {},
  };

  return await https
    .post(`User/AddData`, payload, {
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
        "Content-Type": "application/json",
      },
    })
    .then((res) => {
      return (
        res?.data || {
          responseModel: {
            isSucceded: false,
            message: "Không có dữ liệu",
          },
          listObject: [],
        }
      );
    })
    .catch((error) => {
      console.error("Error getting tax info:", error);
      return {
        responseModel: {
          isSucceded: false,
          message: "Lỗi kết nối mạng",
        },
        listObject: [],
      };
    });
};

// === Warehouse helpers for Mã lô / Vị trí ===
export const getViTriByKho = async ({
  ma_kho = "ST",
  ten_vi_tri = "",
  pageIndex = 1,
  pageSize = 10,
} = {}) => {
  const token = localStorage.getItem("access_token");

  const payload = {
    store: "api_getViTriByKho",
    param: {
      ma_kho,
      ten_vi_tri,
      pageIndex,
      pageSize,
    },
    data: {},
  };

  return await https
    .post(`User/AddData`, payload, {
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
        "Content-Type": "application/json",
      },
    })
    .then((res) => {
      const data = res?.data || {};
      const responseModel = data?.responseModel || { isSucceded: true };
      const list = data?.listObject;
      let listObject;
      if (Array.isArray(list)) {
        listObject = Array.isArray(list[0]) ? list : [list];
      } else {
        const fallback = Array.isArray(data?.data) ? data.data : [];
        listObject = [fallback];
      }
      return { responseModel, listObject };
    })
    .catch((error) => {
      console.error("Error getViTriByKho:", error);
      return {
        responseModel: { isSucceded: false, message: "Lỗi kết nối mạng" },
        listObject: [[]],
      };
    });
};

export const getLoItem = async ({
  ma_vt = "",
  ma_lo = "",
  ten_lo = "",
  ngay_hhsd_tu = null,
  ngay_hhsd_den = null,
  pageIndex = 1,
  pageSize = 10,
} = {}) => {
  const token = localStorage.getItem("access_token");

  const payload = {
    store: "api_getLoItem",
    param: {
      ma_vt,
      ma_lo,
      ten_lo,
      ngay_hhsd_tu,
      ngay_hhsd_den,
      pageIndex,
      pageSize,
    },
    data: {},
  };

  return await https
    .post(`User/AddData`, payload, {
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
        "Content-Type": "application/json",
      },
    })
    .then((res) => {
      const data = res?.data || {};
      const responseModel = data?.responseModel || { isSucceded: true };
      const list = data?.listObject;
      let listObject;
      if (Array.isArray(list)) {
        listObject = Array.isArray(list[0]) ? list : [list];
      } else {
        const fallback = Array.isArray(data?.data) ? data.data : [];
        listObject = [fallback];
      }
      return { responseModel, listObject };
    })
    .catch((error) => {
      console.error("Error getLoItem:", error);
      return {
        responseModel: { isSucceded: false, message: "Lỗi kết nối mạng" },
        listObject: [[]],
      };
    });
};

// Get item price and unit list for a product
export const getItemPriceAndUnit = async (ma_vt = "") => {
  const token = localStorage.getItem("access_token");

  const payload = {
    store: "api_getItemPriceAndUnit",
    param: {
      ma_vt: ma_vt,
    },
    data: {},
  };

  return await https
    .post(`User/AddData`, payload, {
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
        "Content-Type": "application/json",
      },
    })
    .then((res) => {
      const data = res?.data || {};
      const responseModel = data?.responseModel || { isSucceded: true };
      const list = data?.listObject;
      let listObject;
      if (Array.isArray(list)) {
        listObject = Array.isArray(list[0]) ? list : [list];
      } else {
        const fallback = Array.isArray(data?.data) ? data.data : [];
        listObject = [fallback];
      }
      return { responseModel, listObject };
    })
    .catch((error) => {
      console.error("Error getItemPriceAndUnit:", error);
      return {
        responseModel: { isSucceded: false, message: "Lỗi kết nối mạng" },
        listObject: [[]],
      };
    });
};

export const getKhoInfo = async (unitId = null, userId = null) => {
  const token = localStorage.getItem("access_token");

  const payload = {
    store: "api_getKhoInfo",
    param: {
      unitId: unitId,
      userId: userId,
    },
    data: {},
  };

  return await https
    .post(`User/AddData`, payload, {
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
        "Content-Type": "application/json",
      },
    })
    .then((res) => {
      if (res?.data?.responseModel?.isSucceded === true) {
        return {
          success: true,
          data: res?.data?.listObject || res?.data || null,
          message: null,
        };
      } else {
        const errorMessage =
          res?.data?.responseModel?.message || "Lỗi không xác định";
        return {
          success: false,
          data: null,
          message: errorMessage,
        };
      }
    })
    .catch((error) => {
      console.error("Error getting kho info:", error);
      return {
        success: false,
        data: null,
        message: "Lỗi kết nối mạng",
      };
    });
};

export const createKhoOrder = async (
  orderData,
  unitId = null,
  userId = null
) => {
  const token = localStorage.getItem("access_token");

  const payload = {
    store: "api_createKhoOrder",
    param: {
      unitId: unitId,
      userId: userId,
      customer: orderData.customer,
      items: orderData.items,
      totals: orderData.totals,
      payment: orderData.payment,
      Currency: "VND",
    },
    data: {},
  };

  return await https
    .post(`User/AddData`, payload, {
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
        "Content-Type": "application/json",
      },
    })
    .then((res) => {
      // Kiểm tra responseModel.isSucceded
      if (res?.data?.responseModel?.isSucceded === true) {
        return {
          success: true,
          data: res?.data?.listObject || res?.data || null,
          message: null,
        };
      } else {
        // Response có lỗi
        const errorMessage =
          res?.data?.responseModel?.message || "Lỗi không xác định";
        return {
          success: false,
          data: null,
          message: errorMessage,
        };
      }
    })
    .catch((error) => {
      console.error("Error creating kho order:", error);
      return {
        success: false,
        data: null,
        message: "Lỗi kết nối mạng",
      };
    });
};

export const createPharmacyOrder = async (
  orderData,
  unitId = null,
  userId = null
) => {
  const token = localStorage.getItem("access_token");

  const payload = {
    store: "api_createPharmacyOrder",
    param: {
      unitId: unitId,
      userId: userId,
      customer: orderData.customer,
      items: orderData.items,
      totals: orderData.totals,
      payment: orderData.payment,
      Currency: "VND",
    },
    data: {},
  };

  return await https
    .post(`User/AddData`, payload, {
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
        "Content-Type": "application/json",
      },
    })
    .then((res) => {
      // Kiểm tra responseModel.isSucceded
      if (res?.data?.responseModel?.isSucceded === true) {
        return {
          success: true,
          data: res?.data?.listObject || res?.data || null,
          message: null,
        };
      } else {
        // Response có lỗi
        const errorMessage =
          res?.data?.responseModel?.message || "Lỗi không xác định";
        return {
          success: false,
          data: null,
          message: errorMessage,
        };
      }
    })
    .catch((error) => {
      console.error("Error creating pharmacy order:", error);
      return {
        success: false,
        data: null,
        message: "Lỗi kết nối mạng",
      };
    });
};

export const createRetailOrder = async (
  orderData,
  unitId = null,
  userId = null
) => {
  const token = localStorage.getItem("access_token");

  const master = {
    ma_ban: orderData.tableId,
    dien_giai: orderData.description || "",
    tong_tien: orderData.totals?.subtotal?.toString(),
    tong_sl: orderData.totals?.quantity?.toString(),
    tien_mat: orderData.payment?.cash?.toString(),
    chuyen_khoan: orderData.payment?.transfer?.toString(),
    tong_tt: orderData.totals?.total?.toString(),
    httt: orderData.payment?.method,
    stt_rec: orderData.orderId || "",
    status: orderData.status,
    cccd: orderData.customer?.idNumber,
    ong_ba: orderData.customer?.name,
    so_dt: orderData.customer?.phone,
    dia_chi: orderData.customer?.address,
    email: orderData.customer?.email,
    ma_so_thue_kh: orderData.customer?.taxCode,
    ten_dv_kh: orderData.customer?.companyName,
    s3: orderData.s3,
  };

  const detail =
    orderData.items?.map((item, index) => {
      // Calculate discount and VAT amounts
      const itemTotal = (item.price || 0) * (item.quantity || item.qty || 0);
      const itemDiscountAmount = item.discountAmount > 0
        ? item.discountAmount
        : Math.round((itemTotal * (item.discountPercent || 0)) / 100);
      const itemTotalAfterDiscount = itemTotal - itemDiscountAmount;
      const itemVatAmount = Math.round(
        (itemTotalAfterDiscount * (item.vatPercent || 0)) / 100
      );
      
      // Get tax code from customer info
      const maThue = orderData.customer?.taxCode || orderData.customer?.idNumber || "";
      
      return {
        ten_vt: item.name || item.ten_vt,
        ma_vt_root: item.skuRoot,
        ma_vt: item.sku || item.ma_vt,
        so_luong: (item.quantity || item.qty)?.toString(),
        don_gia: item.price?.toString(),
        thanh_tien: itemTotal.toString(),
        ghi_chu: item.note || item.ghi_chu || "",
        uniqueid: item.uniqueId,
        ap_voucher: item.voucher,
        // Add new fields for detail
        tl_ck: (item.discountPercent || 0).toString(),
        ck_nt: itemDiscountAmount.toString(),
        ma_thue: maThue,
        thue_nt: itemVatAmount.toString(),
        dvt: (item.unit || item.dvt || "").trim(),
      };
    }) || [];

  const payload = {
    store: "Api_create_retail_order",
    param: {
      StoreID: orderData.storeId,
      unitId: unitId,
      userId: userId,
    },
    data: {
      master: [master],
      detail: detail,
    },
  };

  return await https
    .post(`User/AddData`, payload, {
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
        "Content-Type": "application/json",
      },
    })
    .then((res) => {
      // Kiểm tra responseModel.isSucceded
      if (res?.data?.responseModel?.isSucceded === true) {
        return {
          success: true,
          data: res?.data?.listObject || res?.data || null,
          message: null,
        };
      } else {
        // Response có lỗi
        const errorMessage =
          res?.data?.responseModel?.message || "Lỗi không xác định";
        return {
          success: false,
          data: null,
          message: errorMessage,
        };
      }
    })
    .catch((error) => {
      console.error("❌ Error creating retail order:", error);
      return {
        success: false,
        data: null,
        message: "Lỗi kết nối mạng",
      };
    });
};

// ===== PRESCRIPTION APIs =====

export const searchPrescriptionByCode = async (
  prescriptionCode,
  unitId = null,
  userId = null
) => {
  const token = localStorage.getItem("access_token");

  const payload = {
    store: "api_getPrescriptionByCode",
    param: {
      prescriptionCode: prescriptionCode,
      unitId: unitId,
      userId: userId,
    },
    data: {},
  };

  return await https
    .post(`User/AddData`, payload, {
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
        "Content-Type": "application/json",
      },
    })
    .then((res) => {
      // Kiểm tra responseModel.isSucceded
      if (res?.data?.responseModel?.isSucceded === true) {
        return {
          success: true,
          data: res?.data?.listObject || res?.data || null,
          message: null,
        };
      } else {
        // Response có lỗi
        const errorMessage =
          res?.data?.responseModel?.message || "Không tìm thấy đơn thuốc";
        return {
          success: false,
          data: null,
          message: errorMessage,
        };
      }
    })
    .catch((error) => {
      console.error("❌ Error searching prescription:", error);
      return {
        success: false,
        data: null,
        message: "Lỗi kết nối mạng",
      };
    });
};

// ===== FILE UPLOAD (separate path, not AddData) =====
// Upload file to FileUpload/upload with multipart/form-data
export const uploadPrescriptionImage = async ({
  file,
  controllerFields = "m81$",
  keyFields,
  isPublicAccess = true,
}) => {
  if (!file) {
    console.warn("No file provided to uploadPrescriptionImage");
    return { success: false, message: "Chưa chọn file" };
  }

  try {
    const token = localStorage.getItem("access_token");
    // generate 16-char random key if not provided
    const randomKey =
      keyFields ||
      (typeof crypto !== "undefined" && crypto.getRandomValues
        ? (() => {
            const bytes = new Uint8Array(12);
            crypto.getRandomValues(bytes);
            return Array.from(bytes, (b) => b.toString(16).padStart(2, "0"))
              .join("")
              .slice(0, 16);
          })()
        : Math.random().toString(36).slice(2, 18).padEnd(16, "0"));
    const formData = new FormData();
    formData.append("file", file);
    formData.append("controllerFields", controllerFields);
    formData.append("keyFields", randomKey);
    formData.append("isPublicAccess", String(isPublicAccess));

    const res = await axiosInstance.post(`FileUpload/upload`, formData, {
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
        Accept: "text/plain",
        "Content-Type": "multipart/form-data",
      },
      timeout: 60000, // 60 seconds timeout
    });

    // Normalize possible return values into a resolvable URL
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

    return { success: true, data: { url, keyFields: randomKey, raw } };
  } catch (error) {
    console.error("Error uploading image:", error);
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

// Optional: execute linking procedure after upload
export const keyFileUploadsM81 = async ({ stt_rec, keyFields }) => {
  const token = localStorage.getItem("access_token");

  const payload = {
    store: "api_keyFileUploadsM81",
    param: {
      stt_rec,
      keyFields,
    },
    data: {},
  };

  return await https
    .post(`User/AddData`, payload, {
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
        "Content-Type": "application/json",
      },
    })
    .then((res) => res?.data)
    .catch((err) => {
      console.error("Error calling api_keyFileUploadsM81:", err);
      return { responseModel: { isSucceded: false } };
    });
};

// ===== CUSTOMER APIs =====
export const createCustomer = async ({
  phone,
  name,
  birthday,
  address,
  note,
  userId,
}) => {
  const token = localStorage.getItem("access_token");

  const payload = {
    store: "api_createKhachHang",
    param: {
      ten_kh: name || "",
      dien_thoai: phone || "",
      ngay_sinh: birthday || "",
      dia_chi: address || "",
      ghi_chu: note || "",
      userid: Number(userId) || 0,
    },
    data: {},
  };

  return await https
    .post(`User/AddData`, payload, {
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
        "Content-Type": "application/json",
      },
    })
    .then((res) => res?.data)
    .catch((error) => {
      console.error("Error creating customer:", error);
      return {
        responseModel: {
          isSucceded: false,
          message: "Lỗi kết nối mạng",
        },
      };
    });
};

// Update existing customer via stored procedure api_updateKhachHang
export const updateKhachHang = async ({
  code,
  name,
  phone,
  birthday,
  address,
  note,
  userId,
}) => {
  const token = localStorage.getItem("access_token");

  const payload = {
    store: "api_updateKhachHang",
    param: {
      ma_kh: code || "",
      ten_kh: name || "",
      dien_thoai: phone || "",
      ngay_sinh: birthday || "",
      dia_chi: address || "",
      ghi_chu: note || "",
      userid: Number(userId) || 0,
    },
    data: {},
  };

  return await https
    .post(`User/AddData`, payload, {
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
        "Content-Type": "application/json",
      },
    })
    .then((res) => res?.data)
    .catch((error) => {
      console.error("Error updating customer:", error);
      return {
        responseModel: {
          isSucceded: false,
          message: "Lỗi kết nối mạng",
        },
      };
    });
};

export const searchCustomer = async (keyword = "") => {
  const token = localStorage.getItem("access_token");
  const payload = {
    store: "api_searchCustomer",
    param: { keyword },
    data: {},
  };

  return await https
    .post(`User/AddData`, payload, {
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
        "Content-Type": "application/json",
      },
    })
    .then((res) => res?.data || { listObject: [[]] })
    .catch((error) => {
      console.error("Error searching customer:", error);
      return { listObject: [[]] };
    });
};

// Search customers via api_getKhachHang
export const searchKhachHang = async (
  keyword = "",
  pageIndex = 1,
  pageSize = 10
) => {
  const token = localStorage.getItem("access_token");
  const payload = {
    store: "api_getKhachHang",
    param: {
      searchValue: keyword || "",
      pageIndex,
      pageSize,
    },
    data: {},
  };

  return await https
    .post(`User/AddData`, payload, {
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
        "Content-Type": "application/json",
      },
    })
    .then((res) => res?.data || { listObject: [[]] })
    .catch((error) => {
      console.error("Error searching khach hang:", error);
      return { listObject: [[]] };
    });
};
