import { message } from "antd";
import { multipleTablePutApi } from "../../../../../api";

// API để lấy danh sách phiếu nhặt hàng
export const fetchPhieuNhatHangList = async (params) => {
  const token = localStorage.getItem("access_token");

  const body = {
    store: "api_get_list_phieu_nhat_hang",
    param: {
      so_ct: params.so_ct || "",
      DateFrom: params.DateFrom || "",
      DateTo: params.DateTo || "",
      ngay_ct: params.ngay_ct || "",
      ma_kh: params.ma_kh || "",
      status: params.Status || "",
      ma_ban: params.ma_ban || "",
      s2: params.s2 || "",
      s3: params.s3 || "",
      so_don_hang: params.so_don_hang || "",
      ma_nhomvitri: params.ma_nhomvitri || "",
      pageIndex: params.pageIndex || 1,
      pageSize: params.pageSize || 20,
      userId: params.userId || "",
      unitId: params.unitId || "",
      storeId: params.storeId || "",
    },
    data: {},
    resultSetNames: ["data", "pagination"],
  };

  try {
    const response = await multipleTablePutApi(body);

    // Cập nhật để phù hợp với cấu trúc response mới
    const responseData = response?.listObject?.[0] || [];
    const paginationData = response?.listObject?.[1]?.[0] || {};

    return {
      data: responseData.filter(
        (item) => item.status !== "*" && item.status !== null
      ),
      pagination: paginationData,
      success: true,
    };
  } catch (error) {
    console.error("Lỗi gọi API danh sách phiếu nhặt hàng:", error);
    return {
      data: [],
      pagination: {},
      success: false,
      error: error.message,
    };
  }
};

// API để lấy chi tiết phiếu nhặt hàng
export const fetchPhieuNhatHangDetail = async (stt_rec) => {
  const token = localStorage.getItem("access_token");

  const body = {
    store: "api_get_data_detail_phieu_nhat_hang_voucher",
    param: {
      stt_rec: stt_rec,
    },
    data: {},
    resultSetNames: ["master", "detail"],
  };

  try {
    const response = await multipleTablePutApi(body);

    const data = response?.listObject?.dataLists || {};

    return {
      master: data?.master?.[0] || null,
      detail: data?.detail || [],
      success: true,
    };
  } catch (error) {
    console.error("Lỗi gọi API chi tiết phiếu nhặt hàng:", error);
    return {
      master: null,
      detail: [],
      success: false,
      error: error.message,
    };
  }
};

// API để tạo mới phiếu nhặt hàng
export const createPhieuNhatHang = async (payload, userInfo) => {
  const token = localStorage.getItem("access_token");

  // Lấy thông tin user từ Redux thay vì localStorage
  const userId = userInfo?.id;
  const unitId = userInfo?.unitId;
  const storeId = userInfo?.storeId;

  const body = {
    store: "Api_create_phieu_nhat_hang",
    param: {
      UnitId: unitId,
      StoreID: storeId,
      userId: userId,
    },
    data: {
      m28: [payload.Data.master],
      d28: payload.Data.detail,
    },
  };

  try {
    const response = await multipleTablePutApi(body);

    // Check new response structure with responseModel
    if (response?.responseModel?.isSucceded === true) {
      message.success(response.responseModel.message || "Tạo phiếu thành công");
      return { success: true };
    } else if (response && response.statusCode === 200) {
      // Fallback for old response structure
      message.success("Tạo phiếu thành công");
      return { success: true };
    } else {
      message.error(
        response?.responseModel?.message || response?.message || "Có lỗi xảy ra"
      );
      return { success: false };
    }
  } catch (error) {
    console.error("Error creating phieu nhat hang:", error);

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

// API để cập nhật phiếu nhặt hàng
export const updatePhieuNhatHang = async (payload, userInfo) => {
  const token = localStorage.getItem("access_token");

  // Lấy thông tin user từ Redux thay vì localStorage
  const userId = userInfo?.id || userInfo?.userId || "";
  const unitId = userInfo?.unitId || "";
  const storeId = userInfo?.storeId || "";

  const body = {
    store: "Api_update_phieu_nhat_hang",
    param: {
      UnitId: unitId,
      StoreID: storeId,
      userId: userId,
    },
    data: {
      m28: [payload.Data.master],
      d28: payload.Data.detail,
    },
  };

  try {
    const response = await multipleTablePutApi(body);

    // Check new response structure with responseModel
    if (response?.responseModel?.isSucceded === true) {
      message.success(
        response.responseModel.message || "Cập nhật phiếu thành công"
      );
      return { success: true };
    } else if (response && response.statusCode === 200) {
      // Fallback for old response structure
      message.success("Cập nhật phiếu thành công");
      return { success: true };
    } else {
      message.error(
        response?.responseModel?.message || response?.message || "Có lỗi xảy ra"
      );
      return { success: false };
    }
  } catch (error) {
    console.error("Error updating phieu nhat hang:", error);

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

// API để bắt đầu nhặt hàng
export const startPhieuNhatHang = async (stt_rec, userId) => {
  const token = localStorage.getItem("access_token");

  const body = {
    store: "api_bat_dau_phieu_nhat_hang",
    param: {
      stt_rec: stt_rec,
      userId: userId,
    },
    data: {},
    resultSetNames: [],
  };

  try {
    const response = await multipleTablePutApi(body);

    // Check new response structure with responseModel
    if (response?.responseModel?.isSucceded === true) {
      // Không hiển thị message ở đây, để component tự hiển thị message cụ thể
      return { success: true };
    } else if (response && response.statusCode === 200) {
      // Fallback for old response structure
      // Không hiển thị message ở đây, để component tự hiển thị message cụ thể
      return { success: true };
    } else {
      // Kiểm tra nếu message liên quan đến "đã hoàn thành" thì không hiển thị
      const errorMessage =
        response?.responseModel?.message ||
        response?.message ||
        "Có lỗi xảy ra";
      const lowerMessage = errorMessage.toLowerCase();
      if (
        !lowerMessage.includes("đã hoàn thành") &&
        !lowerMessage.includes("hoàn thành")
      ) {
        message.error(errorMessage);
      }
      return { success: false };
    }
  } catch (error) {
    console.error("Error starting phieu nhat hang:", error);

    // Kiểm tra nếu message liên quan đến "đã hoàn thành" thì không hiển thị
    let errorMessage = "";
    if (error.response?.data?.responseModel?.message) {
      errorMessage = error.response.data.responseModel.message;
    } else if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else {
      errorMessage = "Vui lòng kiểm tra lại thông tin";
    }

    const lowerMessage = errorMessage.toLowerCase();
    if (
      !lowerMessage.includes("đã hoàn thành") &&
      !lowerMessage.includes("hoàn thành")
    ) {
      message.error(errorMessage);
    }
    return { success: false };
  }
};

// API để lấy chi tiết phiếu nhặt hàng
export const fetchPhieuNhatHangData = async (stt_rec) => {
  const token = localStorage.getItem("access_token");

  const body = {
    store: "api_get_phieu_nhat_hang_data",
    param: {
      stt_rec: stt_rec,
    },
    data: {},
    resultSetNames: ["master", "detail"],
  };

  try {
    const response = await multipleTablePutApi(body);

    // Cập nhật để phù hợp với cấu trúc response mới
    const masterData = response?.listObject?.[0]?.[0] || null;
    const detailData = response?.listObject?.[1] || [];

    return {
      master: masterData,
      detail: detailData,
      success: true,
    };
  } catch (error) {
    console.error("Lỗi gọi API chi tiết phiếu nhặt hàng:", error);
    return {
      master: null,
      detail: [],
      success: false,
      error: error.message,
    };
  }
};

// API để cập nhật phiếu nhặt hàng với stored procedure
export const updatePhieuNhatHangWithStoredProc = async (
  payload,
  unitId,
  storeId,
  userId
) => {
  const token = localStorage.getItem("access_token");

  const body = {
    store: "Api_update_phieu_nhat_hang",
    param: {
      UnitId: unitId,
      StoreID: storeId,
      userId: userId,
    },
    data: {
      m28: [payload.master],
      d28: payload.detail,
    },
    resultSetNames: [],
  };

  try {
    const response = await multipleTablePutApi(body);

    // Check new response structure with responseModel
    if (response?.responseModel?.isSucceded === true) {
      message.success(
        response.responseModel.message || "Cập nhật phiếu nhặt hàng thành công"
      );
      return { success: true };
    } else if (response && response.statusCode === 200) {
      // Fallback for old response structure
      message.success("Cập nhật phiếu nhặt hàng thành công");
      return { success: true };
    } else {
      message.error(
        response?.responseModel?.message ||
          response?.message ||
          "Có lỗi xảy ra khi cập nhật phiếu"
      );
      return { success: false };
    }
  } catch (error) {
    console.error("Error updating phieu nhat hang with stored proc:", error);

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

// API để xóa phiếu nhặt hàng
export const deletePhieuNhatHang = async (stt_rec, userInfo) => {
  const token = localStorage.getItem("access_token");

  // Lấy thông tin user từ Redux thay vì localStorage
  const userId = userInfo?.id || userInfo?.userId || "";
  const unitId = userInfo?.unitId || "";
  const storeId = userInfo?.storeId || "";

  const body = {
    store: "Api_delete_phieu_nhat_hang",
    param: {
      UnitId: unitId,
      StoreID: storeId,
      userId: userId,
      stt_rec: stt_rec,
    },
    data: {},
    resultSetNames: [],
  };

  try {
    const response = await multipleTablePutApi(body);

    // Check new response structure with responseModel
    if (response?.responseModel?.isSucceded === true) {
      message.success(response.responseModel.message || "Xóa phiếu thành công");
      return { success: true };
    } else if (response && response.statusCode === 200) {
      // Fallback for old response structure
      message.success("Xóa phiếu thành công");
      return { success: true };
    } else {
      message.error(
        response?.responseModel?.message ||
          response?.message ||
          "Có lỗi xảy ra khi xóa phiếu"
      );
      return { success: false };
    }
  } catch (error) {
    console.error("Error deleting phieu nhat hang:", error);

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
