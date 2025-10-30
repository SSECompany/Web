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
    orderData.items?.map((item, index) => ({
      ten_vt: item.name || item.ten_vt,
      ma_vt_root: item.skuRoot,
      ma_vt: item.sku || item.ma_vt,
      so_luong: (item.quantity || item.qty)?.toString(),
      don_gia: item.price?.toString(),
      thanh_tien: (
        (item.price || 0) * (item.quantity || item.qty || 0)
      ).toString(),
      ghi_chu: item.note,
      uniqueid: item.uniqueId,
      ap_voucher: item.voucher,
    })) || [];

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

// ===== CUSTOMER APIs =====
export const createCustomer = async ({
  phone,
  name,
  idNumber,
  patientName,
}) => {
  const token = localStorage.getItem("access_token");

  const payload = {
    store: "api_createCustomer",
    param: {},
    data: {
      customer: [
        {
          phone: phone || "",
          name: name || "",
          idNumber: idNumber || "",
          patientName: patientName || "",
        },
      ],
    },
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
