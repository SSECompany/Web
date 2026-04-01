import { message } from "antd";
import https from "../../../../../utils/https";
import jwt from "../../../../../utils/jwt";

const getCurrentUserId = () => {
  try {
    const claims = jwt.getClaims();
    if (claims && claims.Id) {
      return parseInt(claims.Id) || 1;
    }
    
    // Fallback to legacy 'user'
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      return user.id || user.userId || 1;
    }
  } catch (error) {
    console.error("Error getting user ID:", error);
  }
  return 1;
};

// API để lấy danh sách phiếu nhập hàng
export const fetchPhieuNhapHangList = async (params) => {
  const token = localStorage.getItem("access_token");

  const body = {
    store: "api_list_phieu_nhap_hang_theo_don",
    param: {
      so_ct: params.so_ct || "",
      ma_kh: params.ma_kh || "",
      ten_kh: params.ten_kh || "",
      status: params.Status || "",
      kw_so_ct: "",
      kw_ma_kh: "",
      kw_ten_kh: "",
      DateFrom: params.DateFrom || null,
      DateTo: params.DateTo || null,
      PageIndex: params.PageIndex || 1,
      PageSize: params.PageSize || 20,
    },
    data: {},
    resultSetNames: ["data", "pagination"],
  };

  try {
    const response = await https.post("User/AddData", body, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const listObject = response.data?.listObject || [];
    const responseData = listObject[0] || [];
    const paginationData = listObject[1]?.[0] || {};

    return {
      data: responseData,
      pagination: {
        totalRecord: paginationData.totalRecord || paginationData.totalrow || responseData.length || 0,
        pageSize: paginationData.pagesize || 20,
        totalPage: paginationData.totalpage || 1
      },
      success: true,
    };
  } catch (error) {
    console.error("Lỗi gọi API danh sách phiếu nhập hàng:", error);
    return {
      data: [],
      pagination: {},
      success: false,
      error: error.message,
    };
  }
};

// API để lấy chi tiết phiếu nhập hàng
export const fetchPhieuNhapHangDetail = async (stt_rec) => {
  const token = localStorage.getItem("access_token");

  const body = {
    store: "api_list_phieu_nhap_hang_theo_don_chi_tiet",
    param: {
      stt_rec: stt_rec,
      UserId: getCurrentUserId(),
    },
    data: {},
    resultSetNames: ["master", "detail"],
  };

  try {
    const response = await https.post("User/AddData", body, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const listObject = response.data?.listObject || [];
    const master = listObject[0]?.[0] || null;
    const detail = listObject[1] || [];

    return {
      master,
      detail,
      success: true,
    };
  } catch (error) {
    console.error("Lỗi gọi API chi tiết phiếu nhập hàng:", error);
    return {
      master: null,
      detail: [],
      success: false,
      error: error.message,
    };
  }
};

// API để tạo mới phiếu nhập hàng
export const createPhieuNhapHang = async (payload) => {
  const token = localStorage.getItem("access_token");

  const body = {
    store: "Api_create_phieu_nhap_hang_voucher",
    param: {},
    data: {
      master: [payload.Data.master],
      detail: payload.Data.detail,
    },
  };

  try {
    const response = await https.post("User/AddData", body, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.data?.responseModel?.isSucceded === true) {
      message.success(
        response.data.responseModel.message || "Tạo phiếu nhập hàng thành công"
      );
      return { success: true };
    } else if (response.data && response.data.statusCode === 200) {
      message.success("Tạo phiếu nhập hàng thành công");
      return { success: true };
    } else {
      message.error(
        response.data?.responseModel?.message ||
          response.data?.message ||
          "Có lỗi xảy ra"
      );
      return { success: false };
    }
  } catch (error) {
    console.error("Error creating phieu nhap hang:", error);

    if (error.response?.data?.responseModel?.message) {
      message.error(error.response.data.responseModel.message);
    } else if (error.response?.data?.message) {
      message.error(error.response.data.message);
    } else {
      message.error("Vui lòng kiểm tra lại thông tin");
    }
    return { success: false };
  }
};

// API để cập nhật phiếu nhập hàng
export const updatePhieuNhapHang = async (payload) => {
  const token = localStorage.getItem("access_token");

  const master = payload.Data.master || {};
  const userInfo = JSON.parse(localStorage.getItem("user") || "{}");

  const body = {
    store: "api_sua_phieu_nhap_hang_theo_don",
    param: {
      stt_rec: master.stt_rec || "",
      ma_kh: master.ma_kh || "",
      ong_ba: master.ong_ba || "",
      dien_giai: master.dien_giai || "",
      ma_gd: master.ma_gd || "1",
      status: master.status || "0",
      UserId: getCurrentUserId(),
    },
    data: {}, // Chỉ cập nhật thông tin master
  };

  try {
    const response = await https.post("User/AddData", body, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.data?.responseModel?.isSucceded === true) {
      message.success(
        response.data.responseModel.message || "Cập nhật phiếu nhập hàng thành công"
      );
      return { success: true };
    } else if (response.data && response.data.statusCode === 200) {
      message.success("Cập nhật phiếu nhập hàng thành công");
      return { success: true };
    } else {
      message.error(
        response.data?.responseModel?.message ||
          response.data?.message ||
          "Có lỗi xảy ra"
      );
      return { success: false };
    }
  } catch (error) {
    console.error("Error updating phieu nhap hang:", error);

    if (error.response?.data?.responseModel?.message) {
      message.error(error.response.data.responseModel.message);
    } else if (error.response?.data?.message) {
      message.error(error.response.data.message);
    } else {
      message.error("Vui lòng kiểm tra lại thông tin");
    }
    return { success: false };
  }
};

// API để xóa phiếu nhập hàng
export const deletePhieuNhapHang = async (stt_rec, userInfo) => {
  const token = localStorage.getItem("access_token");
  const userId = userInfo?.userId || userInfo?.id || "";

  const body = {
    store: "api_xoa_phieu_nhap_hang_theo_don",
    param: {
      stt_rec: stt_rec,
      UserId: userId,
    },
    data: {},
    resultSetNames: [],
  };

  try {
    const response = await https.post("User/AddData", body, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.data?.responseModel?.isSucceded === true) {
      message.success(
        response.data.responseModel.message || "Xóa phiếu nhập hàng thành công"
      );
      return { success: true };
    } else if (response.data && response.data.statusCode === 200) {
      message.success("Xóa phiếu nhập hàng thành công");
      return { success: true };
    } else {
      message.error(
        response.data?.responseModel?.message ||
          response.data?.message ||
          "Có lỗi xảy ra khi xóa phiếu nhập hàng"
      );
      return { success: false };
    }
  } catch (error) {
    console.error("Error deleting phieu nhap hang:", error);

    if (error.response?.data?.responseModel?.message) {
      message.error(error.response.data.responseModel.message);
    } else if (error.response?.data?.message) {
      message.error(error.response.data.message);
    } else {
      message.error("Vui lòng kiểm tra lại thông tin");
    }
    return { success: false };
  }
};

// API để lấy danh sách đơn hàng mua trong nước kế thừa
export const fetchDonHangKeThua = async (params) => {
  const token = localStorage.getItem("access_token");

  const body = {
    store: "api_list_don_hang_mua_trong_nuoc_ke_thua",
    param: {
      ma_dvcs: params.ma_dvcs || "TAPMED",
      ma_kh: params.ma_kh || "",
      so_ct: params.so_ct || "",
      status: params.status || "2,3",
      DateFrom: params.DateFrom || null,
      DateTo: params.DateTo || null,
      PageIndex: params.PageIndex || 1,
      PageSize: params.PageSize || 20,
    },
    data: {},
    resultSetNames: ["data", "pagination"],
  };

  try {
    const response = await https.post("User/AddData", body, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const listObject = response.data?.listObject || [];
    const responseData = listObject[0] || [];
    const paginationData = listObject[1]?.[0] || {};

    return {
      data: responseData,
      pagination: {
        totalRecord: paginationData.totalRecord || paginationData.totalrow || responseData.length || 0,
        pageSize: paginationData.pagesize || params.PageSize || 20,
        totalPage: paginationData.totalpage || 1,
      },
      success: true,
    };
  } catch (error) {
    console.error("Lỗi gọi API danh sách đơn hàng kế thừa:", error);
    return {
      data: [],
      pagination: {},
      success: false,
      error: error.message,
    };
  }
};

// API để lấy chi tiết đơn hàng mua trong nước kế thừa
export const fetchDonHangKeThuaDetail = async (stt_rec) => {
  const token = localStorage.getItem("access_token");
  // Lấy UserId thực từ localStorage
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : {};
  const userId = user.userId || 1;

  const body = {
    store: "api_get_don_hang_mua_trong_nuoc_ke_thua_chi_tiet",
    param: {
      stt_rec: stt_rec,
      UserId: userId,
    },
    data: {},
    resultSetNames: ["master", "detail"],
  };

  try {
    const response = await https.post("User/AddData", body, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const listObject = response.data?.listObject || [];

    let master = null;
    let detail = [];

    if (listObject.length === 1) {
      // Chỉ có 1 mảng — có thể là detail hoặc master+detail gộp chung
      detail = listObject[0] || [];
    } else if (listObject.length >= 2) {
      master = listObject[0]?.[0] || null;
      detail = listObject[1] || [];
    }

    return {
      master,   // Chứa: so_ct (→ fcode2), ngay_ct (→ fdate1), ma_nv (→ fcode1)
      detail,
      success: true,
    };
  } catch (error) {
    console.error("Lỗi gọi API chi tiết đơn hàng kế thừa:", error);
    return {
      master: null,
      detail: [],
      success: false,
      error: error.message,
    };
  }
};

// API lấy danh sách kho: api_list_kho
export const fetchMaKhoApi = async (keyword = "", pageIndex = 1, pageSize = 20) => {
  const token = localStorage.getItem("access_token");

  const body = {
    store: "api_list_kho",
    param: {
      ma_kho: "",
      ten_kho: keyword || "",
      ma_dvcs: "TAPMED",
      PageIndex: pageIndex,
      PageSize: pageSize,
    },
    data: {},
    resultSetNames: ["data"],
  };

  try {
    const response = await https.post("User/AddData", body, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const listObject = response.data?.listObject || [];
    const data = listObject[0] || [];

    return data.map((item) => ({
      value: (item.ma_kho || "").trim(),
      label: `${(item.ma_kho || "").trim()} - ${(item.ten_kho || "").trim()}`,
    }));
  } catch (error) {
    console.error("Lỗi gọi API danh sách kho:", error);
    return [];
  }
};
