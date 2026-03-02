import { message } from "antd";
import https from "../../../../../utils/https";

export const getUserInfo = () => {
  try {
    const userStr = localStorage.getItem("user");
    const unitsResponseStr = localStorage.getItem("unitsResponse");

    const user = userStr ? JSON.parse(userStr) : {};
    const unitsResponse = unitsResponseStr ? JSON.parse(unitsResponseStr) : {};

    return {
      userId: user.userId || 4061,
      userName: user.userName || "",
      unitId: user.unitId || unitsResponse.unitId || "VIKOSAN",
      unitName: user.unitName || unitsResponse.unitName || "VIKOSAN",
    };
  } catch (error) {
    console.error("Error parsing localStorage:", error);
    return {
      userId: 4061,
      userName: "",
      unitId: "VIKOSAN",
      unitName: "VIKOSAN",
    };
  }
};

export const formatDate = (date) => {
  const d = date ? new Date(date) : new Date();
  return d.toISOString().split(".")[0];
};

export const validateDataSource = (dataSource) => {
  if (dataSource.length === 0) {
    message.error("Vui lòng thêm ít nhất một vật tư");
    return { isValid: false };
  }

  const missingData = [];
  dataSource.forEach((item, index) => {
    if (!item.ma_kho) {
      missingData.push(`Dòng ${index + 1}: Chưa chọn mã kho`);
    }
  });

  if (missingData.length > 0) {
    message.error({
      content: (
        <div>
          <div>Vui lòng bổ sung thông tin bắt buộc:</div>
          {missingData.map((msg, idx) => (
            <div key={idx}>• {msg}</div>
          ))}
        </div>
      ),
      duration: 6,
    });
    return { isValid: false };
  }

  return { isValid: true };
};

export const buildPhieuNhapKhoPayload = (
  values,
  dataSource,
  phieuData = null,
  isUpdate = false
) => {
  const userInfo = getUserInfo();
  const orderDate = formatDate(values.ngay);

  const totalQuantity = dataSource.reduce(
    (sum, item) => sum + parseFloat(item.soLuong || 0),
    0
  );

  const totalAmount = dataSource.reduce(
    (sum, item) => sum + parseFloat(item.tien || 0),
    0
  );
  const totalAmountNt = dataSource.reduce(
    (sum, item) => sum + parseFloat(item.tien_nt || 0),
    0
  );

  const masterData = {
    ...(phieuData || {}),
    ma_gd: values.maGiaoDich || "",
    ngay_ct: orderDate,
    so_ct: values.soPhieu || "",
    ong_ba: values.maKhach || "",
    ma_kh: values.maKhach || "",
    dien_giai: values.dienGiai || "",
    status: values.trangThai || "0",
    t_so_luong: totalQuantity,
    t_tien_nt: totalAmountNt,
    t_tien: totalAmount,
    datetime2: orderDate,
    user_id2: userInfo.userId.toString(),
  };

  if (!isUpdate) {
    if (!masterData.stt_rec) {
      masterData.stt_rec = "";
    }
    if (!masterData.ma_dvcs) {
      masterData.ma_dvcs = userInfo.ma_dvcs || "";
    }
    if (!masterData.ma_ct) {
      masterData.ma_ct = "PND";
    }
    if (!masterData.loai_ct) {
      masterData.loai_ct = "2";
    }
    if (!masterData.so_lo) {
      masterData.so_lo = "";
    }
    if (!masterData.ngay_lo) {
      masterData.ngay_lo = null;
    }
    if (!masterData.ma_nk) {
      masterData.ma_nk = "";
    }
    if (!masterData.ngay_lct) {
      masterData.ngay_lct = orderDate;
    }
    if (!masterData.ma_nt) {
      masterData.ma_nt = "VND";
    }
    if (!masterData.ty_gia) {
      masterData.ty_gia = 1;
    }
    if (!masterData.nam) {
      masterData.nam = new Date().getFullYear();
    }
    if (!masterData.ky) {
      masterData.ky = new Date().getMonth() + 1;
    }
    if (!masterData.datetime0) {
      masterData.datetime0 = orderDate;
    }
    if (!masterData.user_id0) {
      masterData.user_id0 = userInfo.userId;
    }
  }

  const uiOnlyMasterFields = [
    "sttRec",
    "ngay",
    "soPhieu",
    "maKhach",
    "dienGiai",
    "tenKhach",
    "maGiaoDich",
    "trangThai",
    "donViTienTe",
    "tyGia",
  ];

  uiOnlyMasterFields.forEach((field) => {
    if (field in masterData) {
      delete masterData[field];
    }
  });

  Object.keys(masterData).forEach((key) => {
    const value = masterData[key];

    if (
      typeof value === "number" ||
      (!isNaN(parseFloat(value)) && value !== null && value !== undefined)
    ) {
      masterData[key] = parseFloat(value || 0);
    }

    if (typeof value === "string") {
      masterData[key] = value.trim();
    } else if (value === null || value === undefined) {
      if (
        [
          "stt_rec",
          "ma_dvcs",
          "ma_ct",
          "loai_ct",
          "so_lo",
          "ngay_lo",
          "ma_nk",
          "ma_gd",
          "ngay_lct",
          "ngay_ct",
          "so_ct",
          "ma_nt",
          "ong_ba",
          "ma_kh",
          "dien_giai",
          "status",
          "datetime0",
          "datetime2",
          "user_id0",
          "user_id2",
        ].includes(key)
      ) {
        masterData[key] = "";
      }
    }
  });

  const detailData = dataSource.map((item, index) => {
    const dynamicItem = { ...item };

    dynamicItem.ngay_ct = orderDate;
    dynamicItem.so_ct = values.soPhieu || "";

    if (item.maHang) dynamicItem.ma_vt = item.maHang.trim();
    if (item.soLuongDeNghi !== undefined)
      dynamicItem.so_luong = parseFloat(item.soLuongDeNghi || 0);
    if (item.soLuong !== undefined)
      dynamicItem.sl_td3 = parseFloat(item.soLuong || 0);

    if (!dynamicItem.stt_rec && phieuData?.stt_rec) {
      dynamicItem.stt_rec = phieuData.stt_rec;
    }
    if (!dynamicItem.stt_rec0) {
      dynamicItem.stt_rec0 = String(index + 1).padStart(3, "0");
    }
    if (!dynamicItem.ma_ct) {
      dynamicItem.ma_ct = "PND";
    }
    if (!dynamicItem.gia_nt) {
      dynamicItem.gia_nt = 0;
    }
    if (!dynamicItem.gia) {
      dynamicItem.gia = 0;
    }
    if (!dynamicItem.tien_nt) {
      dynamicItem.tien_nt = 0;
    }
    if (!dynamicItem.tien) {
      dynamicItem.tien = 0;
    }

    return dynamicItem;
  });

  return {
    Data: {
      master: masterData,
      detail: detailData,
    },
  };
};

// Lấy thông tin phiếu nhập mặc định (số phiếu, ngày, mã GD, khách, diễn giải...)
export const fetchVoucherInfo = async () => {
  const token = localStorage.getItem("access_token");

  try {
    const response = await https.get(
      "v1/web/thong-tin-phieu-nhap",
      { voucherCode: "PND" },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (
      response.data &&
      response.data.data &&
      response.data.data.length > 0
    ) {
      return response.data.data[0];
    }

    return null;
  } catch (error) {
    console.error("Error fetching voucher info (phieu nhap kho):", error);
    return null;
  }
};

export const submitPhieuNhapKhoDynamic = async (
  payload,
  successMessage,
  isUpdate
) => {
  const token = localStorage.getItem("access_token");

  const body = {
    store: isUpdate
      ? "Api_update_phieu_nhap_kho_voucher"
      : "Api_create_phieu_nhap_kho_voucher",
    param: {},
    data: {
      master: [payload.Data.master],
      detail: payload.Data.detail,
    },
  };

  try {
    const response = await https.post("v1/dynamicApi/call-dynamic-api", body, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.data?.responseModel?.isSucceded === true) {
      message.success(
        response.data.responseModel.message || successMessage || "Thành công"
      );
      return { success: true };
    } else if (response.data && response.data.statusCode === 200) {
      message.success(successMessage || "Thành công");
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
    console.error("Error submit phieu nhap kho:", error);

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

export const deletePhieuNhapKhoDynamic = async (stt_rec) => {
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
    const response = await https.post("v1/dynamicApi/call-dynamic-api", body, {
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

export const fetchVatTuListDynamicApi = async (params) => {
  const token = localStorage.getItem("access_token");

  const body = {
    store: "api_list_vat_tu_dynamic",
    param: {
      keyword: params.keyword || "",
      unitCode: params.unitCode || "",
      pageIndex: params.pageIndex || 1,
      pageSize: params.pageSize || 100,
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
      data: responseData,
      pagination: paginationData,
      success: true,
    };
  } catch (error) {
    console.error("Lỗi gọi API danh sách vật tư (dynamic):", error);
    return {
      data: [],
      pagination: {},
      success: false,
      error: error.message,
    };
  }
};

