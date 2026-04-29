import { staticMessage as message } from "../../../../../utils/antdStatic";
import https from "../../../../../utils/https";

const getUserInfo = () => {
  try {
    const userStr = localStorage.getItem("user");
    const user = userStr ? JSON.parse(userStr) : {};
    return user;
  } catch (error) {
    return {};
  }
};

// API để lấy danh sách phiếu xuất điều chuyển (Sử dụng api_list_phieu_xuat_dieu_chuyen)
export const fetchPhieuXuatDieuChuyenList = async (params) => {
  const token = localStorage.getItem("access_token");
  const userInfo = getUserInfo();

  const body = {
    store: "api_list_phieu_xuat_dieu_chuyen",
    param: {
      so_ct: params.so_ct || "",
      ma_kho: params.ma_khox || "",  // Mã kho xuất (@ma_kho)
      ma_khon: params.ma_kho || "",  // Mã kho nhận (@ma_khon)
      status: params.Status || params.status || "",
      DateFrom: params.DateFrom || null,
      DateTo: params.DateTo || null,
      UserId: userInfo.userId || 1,
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

    // Helper to extract data from different possible response structures
    const listObject = response.data?.listObject || [];
    const responseData = listObject[0] || [];
    const paginationData = listObject[1]?.[0] || {};

    return {
      data: responseData,
      pagination: {
        totalRecord: paginationData.totalRecord || paginationData.totalrow || responseData.length || 0,
        pageSize: paginationData.pagesize || params.PageSize || 20,
        totalPage: paginationData.totalpage || 1
      },
      success: true,
    };
  } catch (error) {
    console.error("Lỗi gọi API danh sách phiếu xuất điều chuyển:", error);
    return {
      data: [],
      pagination: {},
      success: false,
      error: error.message,
    };
  }
};

// API để lấy chi tiết phiếu xuất điều chuyển (Sử dụng api_get_phieu_xuat_dieu_chuyen)
export const fetchPhieuXuatDieuChuyenDetail = async (stt_rec) => {
  const token = localStorage.getItem("access_token");
  const userInfo = getUserInfo();

  const body = {
    store: "api_get_phieu_xuat_dieu_chuyen",
    param: {
      stt_rec: stt_rec,
      UserId: userInfo.userId || 1,
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
    const masterData = listObject[0]?.[0] || {};
    const detailData = listObject[1] || [];

    return {
      master: masterData,
      detail: detailData,
      success: true,
    };
  } catch (error) {
    console.error("Lỗi gọi API chi tiết phiếu xuất điều chuyển:", error);
    return {
      master: {},
      detail: [],
      success: false,
      error: error.message,
    };
  }
};

// API để tạo mới phiếu xuất điều chuyển (Sử dụng api_tao_phieu_xuat_dieu_chuyen)
export const createPhieuXuatDieuChuyen = async (payload) => {
  const token = localStorage.getItem("access_token");
  const userInfo = getUserInfo();

  // Mapping data master từ buildPayload sang các tham số của procedure
  const master = payload.data?.master85?.[0] || {};

  const body = {
    store: "api_tao_phieu_xuat_dieu_chuyen",
    param: {
      UnitId: master.ma_dvcs || "TAPMED",
      StoreID: "",
      userId: userInfo.userId || 1,
    },
    data: payload.data, // detail85 và master85
  };

  try {
    const response = await https.post("User/AddData", body, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const isSuccess = response?.data?.responseModel?.isSucceded === true;

    if (isSuccess) {
      message.success("Tạo phiếu xuất điều chuyển thành công");
      return { success: true };
    } else {
      const errorMessage = response.data?.responseModel?.message || response.data?.message || "Tạo phiếu xuất điều chuyển thất bại";
      message.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  } catch (error) {
    console.error("Lỗi khi tạo phiếu xuất điều chuyển:", error);
    message.error("Có lỗi xảy ra khi tạo phiếu xuất điều chuyển");
    return { success: false, error: error.message };
  }
};

// API để cập nhật phiếu xuất điều chuyển (Sử dụng api_sua_phieu_xuat_dieu_chuyen)
export const updatePhieuXuatDieuChuyen = async (payload, phieuData = {}) => {
  const token = localStorage.getItem("access_token");
  const userInfo = getUserInfo();

  // Mapping data master từ buildPayload sang các tham số của procedure
  const master = payload.data?.master85?.[0] || {};

  const body = {
    store: "api_sua_phieu_xuat_dieu_chuyen",
    param: {
      UnitId: master.ma_dvcs || "TAPMED",
      StoreID: "",
      userId: userInfo.userId || 1,
    },
    data: {
      master85: [master],
      detail85: [], // Chỉ sửa master theo yêu cầu
    },
  };

  try {
    const response = await https.post("User/AddData", body, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const isSuccess = response?.data?.responseModel?.isSucceded === true || response?.data?.statusCode === 200;

    if (isSuccess) {
      message.success("Cập nhật phiếu xuất điều chuyển thành công");
      return { success: true };
    } else {
      message.error(
        response.data?.responseModel?.message || response.data?.message || "Cập nhật phiếu xuất điều chuyển thất bại"
      );
      return { success: false, message: response.data?.message };
    }
  } catch (error) {
    console.error("Lỗi khi cập nhật phiếu xuất điều chuyển:", error);
    message.error("Có lỗi xảy ra khi cập nhật phiếu xuất điều chuyển");
    return { success: false, error: error.message };
  }
};

// API để xóa phiếu xuất điều chuyển (Sử dụng api_xoa_phieu_xuat_dieu_chuyen)
export const deletePhieuXuatDieuChuyen = async (stt_rec) => {
  const token = localStorage.getItem("access_token");
  const userInfo = getUserInfo();

  const body = {
    store: "api_xoa_phieu_xuat_dieu_chuyen",
    param: {
      stt_rec: stt_rec,
      userId: userInfo.userId || 3425,
    },
    data: {},
  };

  try {
    const response = await https.post("User/AddData", body, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const isSuccess = response?.data?.responseModel?.isSucceded === true;

    if (isSuccess) {
      message.success("Xóa phiếu xuất điều chuyển thành công");
      return { success: true };
    } else {
      const errorMessage = response.data?.responseModel?.message || response.data?.message || "Xóa phiếu xuất điều chuyển thất bại";
      message.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  } catch (error) {
    console.error("Lỗi khi xóa phiếu xuất điều chuyển:", error);
    message.error("Có lỗi xảy ra khi xóa phiếu xuất điều chuyển");
    return { success: false, error: error.message };
  }
};

// API để xóa phiếu xuất điều chuyển - Gọi trực tiếp
export const deletePhieuXuatDieuChuyenDirect = async (stt_rec) => {
  const token = localStorage.getItem("access_token");

  const body = {
    store: "api_delete_xuat_dieu_chuyen_voucher",
    param: {
      stt_rec: stt_rec,
    },
    data: {},
  };

  try {
    const response = await https.post("User/AddData", body, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const isSuccess = response?.data?.responseModel?.isSucceded === true;

    if (isSuccess) {
      message.success("Xóa phiếu xuất điều chuyển thành công");
      return { success: true };
    } else {
      const errorMessage = response.data?.responseModel?.message || response.data?.message || "Xóa phiếu xuất điều chuyển thất bại";
      message.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  } catch (error) {
    console.error("Lỗi khi xóa phiếu xuất điều chuyển:", error);
    message.error("Có lỗi xảy ra khi xóa phiếu xuất điều chuyển");
    return { success: false, error: error.message };
  }
};

