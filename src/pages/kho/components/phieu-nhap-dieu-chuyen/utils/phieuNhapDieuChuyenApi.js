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

// API để lấy danh sách phiếu nhập điều chuyển (Sử dụng api_list_phieu_nhap_dieu_chuyen)
export const fetchPhieuNhapDieuChuyenList = async (params) => {
  const token = localStorage.getItem("access_token");
  const userInfo = getUserInfo();

  const body = {
    store: "api_list_phieu_nhap_dieu_chuyen",
    param: {
      so_ct: params.so_ct || "",
      ma_kho: params.ma_khon || "", // Mã kho nhận
      ma_khox: params.ma_kho || "",   // Mã kho xuất
      status: params.Status || "",
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
    console.error("Lỗi gọi API danh sách phiếu nhập điều chuyển:", error);
    return {
      data: [],
      pagination: {},
      success: false,
      error: error.message,
    };
  }
};

// API để lấy chi tiết phiếu nhập điều chuyển (Sử dụng api_get_phieu_nhap_dieu_chuyen)
export const fetchPhieuNhapDieuChuyenDetail = async (stt_rec) => {
  const token = localStorage.getItem("access_token");
  const userInfo = getUserInfo();

  const body = {
    store: "api_get_phieu_nhap_dieu_chuyen",
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
    console.error("Lỗi gọi API chi tiết phiếu nhập điều chuyển:", error);
    return {
      master: {},
      detail: [],
      success: false,
      error: error.message,
    };
  }
};

// API để tạo mới phiếu nhập điều chuyển (Sử dụng api_tao_phieu_nhap_dieu_chuyen)
export const createPhieuNhapDieuChuyen = async (payload) => {
  const token = localStorage.getItem("access_token");
  const userInfo = getUserInfo();

  // Mapping data master từ buildPayload sang các tham số của procedure
  const master = payload.data?.master85?.[0] || {};

  const body = {
    store: "api_tao_phieu_nhap_dieu_chuyen",
    param: {
      stt_rec: "", // Tạo mới
      ong_ba: master.ong_ba || "",
      ma_gd: master.ma_gd || "2",
      dien_giai: master.dien_giai || "",
      status: master.status || "1",
      UserId: userInfo.userId || 1,
    },
    data: payload.data, // detail85 (và master85 dự phòng)
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
      message.success("Tạo phiếu nhập điều chuyển thành công");
      return { success: true };
    } else {
      message.error(
        response.data?.message || "Tạo phiếu nhập điều chuyển thất bại"
      );
      return { success: false, message: response.data?.message };
    }
  } catch (error) {
    console.error("Lỗi khi tạo phiếu nhập điều chuyển:", error);
    message.error("Có lỗi xảy ra khi tạo phiếu nhập điều chuyển");
    return { success: false, error: error.message };
  }
};

// API để cập nhật phiếu nhập điều chuyển (Sử dụng api_sua_phieu_nhap_dieu_chuyen)
export const updatePhieuNhapDieuChuyen = async (data, phieuData = {}) => {
  const token = localStorage.getItem("access_token");
  const userInfo = getUserInfo();

  // Mapping data master từ buildPayload sang các tham số của procedure
  const master = data.master85?.[0] || {};
  
  const body = {
    store: "api_sua_phieu_nhap_dieu_chuyen",
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
      message.success("Cập nhật phiếu nhập điều chuyển thành công");
      return { success: true };
    } else {
      message.error(
        response.data?.responseModel?.message || response.data?.message || "Cập nhật phiếu nhập điều chuyển thất bại"
      );
      return { success: false, message: response.data?.message };
    }
  } catch (error) {
    console.error("Lỗi khi cập nhật phiếu nhập điều chuyển:", error);
    message.error("Có lỗi xảy ra khi cập nhật phiếu nhập điều chuyển");
    return { success: false, error: error.message };
  }
};

// API để xóa phiếu nhập điều chuyển
export const deletePhieuNhapDieuChuyen = async (stt_rec) => {
  const token = localStorage.getItem("access_token");

  const body = {
    store: "api_delete_nhap_dieu_chuyen_voucher",
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
      message.success("Xóa phiếu nhập điều chuyển thành công");
      return { success: true };
    } else {
      message.error(
        response.data?.message || "Xóa phiếu nhập điều chuyển thất bại"
      );
      return { success: false, message: response.data?.message };
    }
  } catch (error) {
    console.error("Lỗi khi xóa phiếu nhập điều chuyển:", error);
    message.error("Có lỗi xảy ra khi xóa phiếu nhập điều chuyển");
    return { success: false, error: error.message };
  }
};

// API để xóa phiếu nhập điều chuyển - Gọi trực tiếp
export const deletePhieuNhapDieuChuyenDirect = async (stt_rec) => {
  const token = localStorage.getItem("access_token");

  const body = {
    store: "api_delete_nhap_dieu_chuyen_voucher",
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
      message.success("Xóa phiếu nhập điều chuyển thành công");
      return { success: true };
    } else {
      message.error(
        response.data?.message || "Xóa phiếu nhập điều chuyển thất bại"
      );
      return { success: false, message: response.data?.message };
    }
  } catch (error) {
    console.error("Lỗi khi xóa phiếu nhập điều chuyển:", error);
    message.error("Có lỗi xảy ra khi xóa phiếu nhập điều chuyển");
    return { success: false, error: error.message };
  }
};

