import { message } from "antd";
import https from "../../../../../utils/https";

// API để lấy danh sách phiếu nhập kho
export const fetchPhieuNhapKhoList = async (params) => {
  const token = localStorage.getItem("access_token");

  const body = {
    store: "api_list_phieu_nhap_kho_voucher",
    param: {
      so_ct: params.so_ct || "",
      ma_kh: params.ma_kh || "",
      ten_kh: params.ten_kh || "",
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
    const response = await https.post("User/AddData", body, {
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
    console.error("Lỗi gọi API danh sách phiếu nhập kho:", error);
    return {
      data: [],
      pagination: {},
      success: false,
      error: error.message,
    };
  }
};

// API để lấy chi tiết phiếu nhập kho
export const fetchPhieuNhapKhoDetail = async (stt_rec) => {
  const token = localStorage.getItem("access_token");

  const body = {
    store: "api_get_data_detail_phieu_nhap_kho_voucher",
    param: {
      stt_rec: stt_rec,
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

    const data = response.data?.listObject?.dataLists || {};

    return {
      master: data?.master?.[0] || null,
      detail: data?.detail || [],
      success: true,
    };
  } catch (error) {
    console.error("Lỗi gọi API chi tiết phiếu nhập kho:", error);
    return {
      master: null,
      detail: [],
      success: false,
      error: error.message,
    };
  }
};

// API để tạo mới phiếu nhập kho
export const createPhieuNhapKho = async (payload) => {
  const token = localStorage.getItem("access_token");

  const body = {
    store: "Api_create_phieu_nhap_kho_voucher",
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
        response.data.responseModel.message || "Tạo phiếu nhập kho thành công"
      );
      return { success: true };
    } else if (response.data && response.data.statusCode === 200) {
      message.success("Tạo phiếu nhập kho thành công");
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
    console.error("Error creating phieu nhap kho:", error);

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

// API để cập nhật phiếu nhập kho
export const updatePhieuNhapKho = async (payload) => {
  const token = localStorage.getItem("access_token");

  const body = {
    store: "Api_update_phieu_nhap_kho_voucher",
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
        response.data.responseModel.message || "Cập nhật phiếu nhập kho thành công"
      );
      return { success: true };
    } else if (response.data && response.data.statusCode === 200) {
      message.success("Cập nhật phiếu nhập kho thành công");
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
    console.error("Error updating phieu nhap kho:", error);

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

// API để xóa phiếu nhập kho
export const deletePhieuNhapKho = async (stt_rec) => {
  const token = localStorage.getItem("access_token");

  const body = {
    store: "Api_delete_phieu_nhap_kho_voucher",
    param: {
      stt_rec: stt_rec,
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
        response.data.responseModel.message || "Xóa phiếu nhập kho thành công"
      );
      return { success: true };
    } else if (response.data && response.data.statusCode === 200) {
      message.success("Xóa phiếu nhập kho thành công");
      return { success: true };
    } else {
      message.error(
        response.data?.responseModel?.message ||
          response.data?.message ||
          "Có lỗi xảy ra khi xóa phiếu nhập kho"
      );
      return { success: false };
    }
  } catch (error) {
    console.error("Error deleting phieu nhap kho:", error);

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

