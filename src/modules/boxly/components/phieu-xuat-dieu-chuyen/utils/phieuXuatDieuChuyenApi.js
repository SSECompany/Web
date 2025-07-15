import { message } from "antd";
import https from "../../../../../utils/https";

// API để lấy danh sách phiếu xuất điều chuyển
export const fetchPhieuXuatDieuChuyenList = async (params) => {
  const token = localStorage.getItem("access_token");

  const body = {
    store: "api_list_phieu_xuat_dieu_chuyen_voucher",
    param: {
      so_ct: params.so_ct || "",
      ma_kh: params.ma_kh || "",
      ten_kh: params.ten_kh || "",
      // ma_kho: params.ma_kho || "",
      // ma_khon: params.ma_khon || "",
      ngay_ct: "",
      DateFrom: params.DateFrom || null,
      DateTo: params.DateTo || null,
      PageIndex: params.PageIndex || 1,
      PageSize: params.PageSize || 10,
      Status: params.Status || "",
    },
    data: {},
    resultSetNames: ["data", "pagination"],
  };

  try {
    const response = await https.post("v1/dynamicApi/call-dynamic-api", body, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const responseData = response.data?.listObject?.dataLists?.data || [];
    const paginationData =
      response.data?.listObject?.dataLists?.pagination?.[0] || {};

    return {
      data: responseData.filter(
        (item) => item.status !== "*" && item.status !== null
      ),
      pagination: paginationData,
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

// API để lấy chi tiết phiếu xuất điều chuyển
export const fetchPhieuXuatDieuChuyenDetail = async (stt_rec) => {
  const token = localStorage.getItem("access_token");

  const body = {
    store: "api_get_data_detail_phieu_xuat_dieu_chuyen_voucher",
    param: {
      stt_rec: stt_rec,
    },
    data: {},
    resultSetNames: ["master", "detail"],
  };

  try {
    const response = await https.post("v1/dynamicApi/call-dynamic-api", body, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const masterData = response.data?.listObject?.dataLists?.master?.[0] || {};
    const detailData = response.data?.listObject?.dataLists?.detail || [];

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

// API để tạo mới phiếu xuất điều chuyển
export const createPhieuXuatDieuChuyen = async (data) => {
  const token = localStorage.getItem("access_token");

  const body = {
    store: "Api_create_phieu_xuat_dieu_chuyen_voucher",
    param: {},
    data: data,
  };

  try {
    const response = await https.post("v1/dynamicApi/call-dynamic-api", body, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const isSuccess =
      response.data &&
      (response.data.statusCode === 200 ||
        response.data.responseModel?.isSucceded ||
        (response.data?.responseModel?.message &&
          response.data.responseModel.message.includes("thành công")));

    if (isSuccess) {
      message.success("Tạo phiếu xuất điều chuyển thành công");
      return { success: true };
    } else {
      message.error(
        response.data?.message || "Tạo phiếu xuất điều chuyển thất bại"
      );
      return { success: false, message: response.data?.message };
    }
  } catch (error) {
    console.error("Lỗi khi tạo phiếu xuất điều chuyển:", error);
    message.error("Có lỗi xảy ra khi tạo phiếu xuất điều chuyển");
    return { success: false, error: error.message };
  }
};

// API để cập nhật phiếu xuất điều chuyển
export const updatePhieuXuatDieuChuyen = async (data) => {
  const token = localStorage.getItem("access_token");

  const body = {
    store: "Api_update_phieu_xuat_dieu_chuyen_voucher",
    param: {},
    data: data,
  };

  try {
    const response = await https.post("v1/dynamicApi/call-dynamic-api", body, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const isSuccess =
      response.data &&
      (response.data.statusCode === 200 ||
        response.data.responseModel?.isSucceded ||
        (response.data?.responseModel?.message &&
          response.data.responseModel.message.includes("thành công")));

    if (isSuccess) {
      message.success("Cập nhật phiếu xuất điều chuyển thành công");
      return { success: true };
    } else {
      message.error(
        response.data?.message || "Cập nhật phiếu xuất điều chuyển thất bại"
      );
      return { success: false, message: response.data?.message };
    }
  } catch (error) {
    console.error("Lỗi khi cập nhật phiếu xuất điều chuyển:", error);
    message.error("Có lỗi xảy ra khi cập nhật phiếu xuất điều chuyển");
    return { success: false, error: error.message };
  }
};

// API để xóa phiếu xuất điều chuyển
export const deletePhieuXuatDieuChuyen = async (stt_rec) => {
  const token = localStorage.getItem("access_token");

  const body = {
    store: "api_delete_xuat_dieu_chuyen_voucher",
    param: {
      stt_rec: stt_rec,
    },
    data: {},
  };

  try {
    const response = await https.post("v1/dynamicApi/call-dynamic-api", body, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const isSuccess =
      response.data &&
      (response.data.statusCode === 200 ||
        response.data.responseModel?.isSucceded ||
        (response.data?.responseModel?.message &&
          response.data.responseModel.message.includes("thành công")));

    if (isSuccess) {
      message.success("Xóa phiếu xuất điều chuyển thành công");
      return { success: true };
    } else {
      message.error(
        response.data?.message || "Xóa phiếu xuất điều chuyển thất bại"
      );
      return { success: false, message: response.data?.message };
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
    const response = await https.post("v1/dynamicApi/call-dynamic-api", body, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const isSuccess =
      response.data &&
      (response.data.statusCode === 200 ||
        response.data.responseModel?.isSucceded ||
        (response.data?.responseModel?.message &&
          response.data.responseModel.message.includes("thành công")));

    if (isSuccess) {
      message.success("Xóa phiếu xuất điều chuyển thành công");
      return { success: true };
    } else {
      message.error(
        response.data?.message || "Xóa phiếu xuất điều chuyển thất bại"
      );
      return { success: false, message: response.data?.message };
    }
  } catch (error) {
    console.error("Lỗi khi xóa phiếu xuất điều chuyển:", error);
    message.error("Có lỗi xảy ra khi xóa phiếu xuất điều chuyển");
    return { success: false, error: error.message };
  }
};
