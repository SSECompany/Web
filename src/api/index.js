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
  pagesize = 1000
) => {
  const token = localStorage.getItem("access_token");

  // Lấy unitId và userId từ Redux store hoặc localStorage
  let unitId = "TAPMED";
  let userId = 10036;

  try {
    // Cách 1: Lấy từ Redux store
    if (window.__REDUX_STORE__) {
      const state = window.__REDUX_STORE__.getState();
      unitId =
        state?.claimsReducer?.userInfo?.unitId ||
        state?.claimsReducer?.claims?.userInfo?.unitId ||
        "TAPMED";
      userId =
        state?.claimsReducer?.userInfo?.id ||
        state?.claimsReducer?.claims?.userInfo?.id ||
        10036;
    }

    // Cách 2: Fallback từ localStorage
    if (unitId === "TAPMED" || userId === 10036) {
      const claims = JSON.parse(localStorage.getItem("claims") || "{}");
      unitId = claims?.userInfo?.unitId || "TAPMED";
      userId = claims?.userInfo?.id || 10036;
    }
  } catch (error) {
    console.error("Error getting Redux data:", error);
  }

  const payload = {
    store: "api_getListItem",
    param: {
      Currency: "VND",
      searchValue: searchValue,
      unitId: unitId || "TAPMED", // Sử dụng unitId từ Redux, fallback về TAPMED
      userId: userId || 10036,
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
      console.log("🔍 API Response:", res?.data);

      // Kiểm tra response structure
      if (res?.data?.responseModel?.isSucceded) {
        // Response thành công, trả về listObject (chữ thường)
        const listObject = res?.data?.listObject || res?.data?.ListObject || [];
        console.log("✅ Success response, listObject:", listObject);

        // Kiểm tra nếu listObject là nested array
        if (
          Array.isArray(listObject) &&
          listObject.length > 0 &&
          Array.isArray(listObject[0])
        ) {
          console.log("📋 Detected nested array, using first element");
          return listObject[0] || [];
        }

        return listObject;
      } else {
        // Response không thành công hoặc không có listObject
        console.log("⚠️ Response not successful or no listObject");
        return res?.data || [];
      }
    })
    .catch((error) => {
      console.error("Error searching vat tu:", error);
      return [];
    });
};

export const createPharmacyOrder = async (orderData) => {
  const token = localStorage.getItem("access_token");

  // Lấy unitId và userId từ Redux store hoặc localStorage
  let unitId = "TAPMED";
  let userId = 10036;

  try {
    // Cách 1: Lấy từ Redux store
    if (window.__REDUX_STORE__) {
      const state = window.__REDUX_STORE__.getState();
      unitId =
        state?.claimsReducer?.userInfo?.unitId ||
        state?.claimsReducer?.claims?.userInfo?.unitId ||
        "TAPMED";
      userId =
        state?.claimsReducer?.userInfo?.id ||
        state?.claimsReducer?.claims?.userInfo?.id ||
        10036;
    }

    // Cách 2: Fallback từ localStorage
    if (unitId === "TAPMED" || userId === 10036) {
      const claims = JSON.parse(localStorage.getItem("claims") || "{}");
      unitId = claims?.userInfo?.unitId || "TAPMED";
      userId = claims?.userInfo?.id || 10036;
    }
  } catch (error) {
    console.error("Error getting Redux data:", error);
  }

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
      return res?.data || null;
    })
    .catch((error) => {
      console.error("Error creating pharmacy order:", error);
      return null;
    });
};

export const createRetailOrder = async (orderData) => {
  const token = localStorage.getItem("access_token");

  // Lấy unitId và userId từ Redux store hoặc localStorage
  let unitId = "TAPMED";
  let userId = 10036;

  try {
    // Cách 1: Lấy từ Redux store
    if (window.__REDUX_STORE__) {
      const state = window.__REDUX_STORE__.getState();
      unitId =
        state?.claimsReducer?.userInfo?.unitId ||
        state?.claimsReducer?.claims?.userInfo?.unitId ||
        "TAPMED";
      userId =
        state?.claimsReducer?.userInfo?.id ||
        state?.claimsReducer?.claims?.userInfo?.id ||
        10036;
    }

    // Cách 2: Fallback từ localStorage
    if (unitId === "TAPMED" || userId === 10036) {
      const claims = JSON.parse(localStorage.getItem("claims") || "{}");
      unitId = claims?.userInfo?.unitId || "TAPMED";
      userId = claims?.userInfo?.id || 10036;
    }
  } catch (error) {
    console.error("Error getting Redux data:", error);
  }

  // Transform orderData to match API format
  const master = {
    ma_ban: orderData.tableId || "POS",
    dien_giai: "", // Phải để rỗng theo API mẫu
    tong_tien: orderData.totals?.subtotal?.toString() || "0",
    tong_sl: orderData.totals?.quantity?.toString() || "0",
    tien_mat: orderData.payment?.cash?.toString() || "0",
    chuyen_khoan: orderData.payment?.transfer?.toString() || "0",
    tong_tt: orderData.totals?.total?.toString() || "0",
    httt: orderData.payment?.method || "tien_mat",
    stt_rec: "", // Phải để rỗng theo API mẫu
    status: orderData.status || "2",
    cccd: orderData.customer?.idNumber || "",
    ong_ba: orderData.customer?.name || "",
    so_dt: orderData.customer?.phone || "",
    dia_chi: orderData.customer?.address || "",
    email: orderData.customer?.email || "",
    ma_so_thue_kh: orderData.customer?.taxCode || "",
    ten_dv_kh: orderData.customer?.companyName || "",
    s3: "1",
  };

  const detail =
    orderData.items?.map((item, index) => ({
      ten_vt: item.name || item.ten_vt || "",
      ma_vt_root: item.skuRoot || "",
      ma_vt: item.sku || item.ma_vt || "",
      so_luong: item.quantity?.toString() || item.qty?.toString() || "1",
      don_gia: item.price?.toString() || "0",
      thanh_tien: (
        (item.price || 0) * (item.quantity || item.qty || 1)
      ).toString(),
      ghi_chu: item.note || "",
      uniqueid: item.uniqueId || `item_${Date.now()}_${index}`,
      ap_voucher: item.voucher || "0",
    })) || [];

  const payload = {
    store: "Api_create_retail_order",
    param: {
      StoreID: orderData.storeId || "",
      unitId: unitId,
      userId: userId,
    },
    data: {
      master: [master],
      detail: detail,
    },
  };

  console.log("🛒 Creating retail order with payload:", payload);

  return await https
    .post(`User/AddData`, payload, {
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
        "Content-Type": "application/json",
      },
    })
    .then((res) => {
      console.log("✅ Retail order created successfully:", res?.data);
      return res?.data || null;
    })
    .catch((error) => {
      console.error("❌ Error creating retail order:", error);
      return null;
    });
};
