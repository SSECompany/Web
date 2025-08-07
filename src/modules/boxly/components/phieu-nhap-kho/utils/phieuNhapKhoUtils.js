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

  let masterData = {};
  
  if (isUpdate && phieuData) {
    // Khi update: giữ nguyên toàn bộ dữ liệu từ response, chỉ override các trường được sửa
    masterData = { ...phieuData };
    
    // Chỉ cập nhật các trường từ form values (những trường người dùng có thể sửa)
    if (values.maGiaoDich !== undefined) {
      masterData.loai_ct = values.maGiaoDich;
      masterData.ma_gd = values.maGiaoDich;
    }
    if (values.soPhieu !== undefined) masterData.so_ct = values.soPhieu;
    if (values.donViTienTe !== undefined) masterData.ma_nt = values.donViTienTe;
    if (values.tyGia !== undefined) masterData.ty_gia = parseFloat(values.tyGia);
    if (values.maKhach !== undefined) {
      masterData.ong_ba = values.maKhach;
      masterData.ma_kh = values.maKhach;
    }
    if (values.dienGiai !== undefined) masterData.dien_giai = values.dienGiai;
    if (values.trangThai !== undefined) masterData.status = values.trangThai;
    
    // Cập nhật ngày và các trường bắt buộc
    masterData.ngay_lct = orderDate;
    masterData.ngay_ct = orderDate;
    masterData.t_so_luong = totalQuantity;
    masterData.datetime2 = orderDate;
    masterData.user_id2 = userInfo.userId;
  } else {
    // Khi tạo mới: tạo master data với giá trị mặc định
    masterData = {
      stt_rec: "",
      ma_dvcs: userInfo.unitId,
      ma_ct: "PND",
      loai_ct: values.maGiaoDich || "",
      ma_gd: values.maGiaoDich || "",
      ngay_lct: orderDate,
      ngay_ct: orderDate,
      so_ct: values.soPhieu || "",
      ma_nt: values.donViTienTe || "VND",
      ty_gia: parseFloat(values.tyGia || 1),
      ong_ba: values.maKhach || "",
      ma_kh: values.maKhach || "",
      dien_giai: values.dienGiai || "",
      t_so_luong: totalQuantity,
      status: values.trangThai || "3",
      datetime2: orderDate,
      user_id2: userInfo.userId,
    };
  }

  // Xử lý detail data
  const detailData = dataSource.map((item, index) => {
    let detailItem = {};
    
    if (isUpdate && item.stt_rec0) {
      // Khi update: giữ nguyên toàn bộ dữ liệu gốc, chỉ override các trường được sửa
      detailItem = { ...item };
      
      // Cập nhật các trường có thể thay đổi
      detailItem.ma_vt = item.maHang?.trim() || detailItem.ma_vt || "";
      detailItem.dvt = item.dvt || detailItem.dvt || "";
      detailItem.ma_kho = item.ma_kho || detailItem.ma_kho || "";
      detailItem.so_luong = parseFloat(item.soLuongDeNghi || detailItem.so_luong || 0);
      detailItem.sl_td3 = parseFloat(item.soLuong || detailItem.sl_td3 || 0);
      detailItem.tk_vt = item.tk_vt || detailItem.tk_vt || "";
      
      // Cập nhật thông tin phiếu
      detailItem.stt_rec = phieuData?.stt_rec || "";
      detailItem.ma_ct = "PND";
      detailItem.ngay_ct = orderDate;
      detailItem.so_ct = values.soPhieu || detailItem.so_ct || "";
    } else {
      // Khi tạo mới: tạo detail với cấu trúc đầy đủ
      detailItem = {
        stt_rec: phieuData?.stt_rec || "",
        stt_rec0: String(index + 1).padStart(3, "0"),
        ma_ct: "PND",
        ngay_ct: orderDate,
        so_ct: values.soPhieu || "",
        ma_vt: item.maHang?.trim() || "",
        ma_sp: item.ma_sp || "",
        ma_bp: item.ma_bp || "",
        so_lsx: item.so_lsx || "",
        dvt: item.dvt || "",
        he_so: parseFloat(item.he_so || 1),
        ma_kho: item.ma_kho || "",
        ma_vi_tri: item.ma_vi_tri || "",
        ma_lo: item.ma_lo || "",
        ma_vv: item.ma_vv || "",
        ma_nx: item.ma_nx || "",
        tk_du: item.tk_du || "",
        tk_vt: item.tk_vt || "",
        so_luong: parseFloat(item.soLuongDeNghi || 0),
        sl_td3: parseFloat(item.soLuong || 0),
        gia_nt: parseFloat(item.gia_nt || 0),
        gia: parseFloat(item.gia || 0),
        tien_nt: parseFloat(item.tien_nt || 0),
        tien: parseFloat(item.tien || 0),
        pn_gia_tb: item.pn_gia_tb !== undefined ? item.pn_gia_tb : false,
        stt_rec_px: item.stt_rec_px || "",
        stt_rec0px: item.stt_rec0px || "",
        line_nbr: parseFloat(item.line_nbr || index + 1),
      };
    }
    
    return detailItem;
  });

  const payload = {
    orderDate: orderDate,
    master: masterData,
    detail: detailData,
  };

  return payload;
};

export const submitPhieuNhapKho = async (endpoint, payload, successMessage) => {
  const token = localStorage.getItem("access_token");

  try {
    const response = await https.post(
      endpoint,
      { Data: payload },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (
      response.data &&
      (response.data.statusCode === 200 ||
        response.data.statusCode === "200" ||
        response.status === 200 ||
        response.data.success === true ||
        (response.data.message && response.data.message.includes("thành công")))
    ) {
      message.success(successMessage);
      return { success: true };
    } else {
      message.error(response.data?.message || "Có lỗi xảy ra");
      return { success: false };
    }
  } catch (error) {
    console.error("Error submitting phieu nhap kho:", error);

    if (error.response?.data?.message) {
      message.error(error.response.data.message);
    } else {
      message.error("Vui lòng kiểm tra lại thông tin");
    }
    return { success: false };
  }
};

export const deletePhieuNhapKho = async (sctRec) => {
  const token = localStorage.getItem("access_token");

  try {
    const response = await https.post(
      `v1/web/xoa-ct-nhap-kho?sctRec=${sctRec}`,
      {},
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.data && response.data.statusCode === 200) {
      message.success("Xóa phiếu nhập kho thành công");
      return { success: true };
    } else {
      message.error(response.data?.message || "Xóa phiếu nhập kho thất bại");
      return { success: false };
    }
  } catch (error) {
    console.error("Lỗi khi xóa phiếu nhập kho:", error);
    if (error.response?.data?.message) {
      message.error(error.response.data.message);
    } else {
      message.error("Có lỗi xảy ra khi xóa phiếu nhập kho");
    }
    return { success: false };
  }
};

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

    if (response.data && response.data.data && response.data.data.length > 0) {
      return response.data.data[0];
    }
    return null;
  } catch (error) {
    console.error("Error fetching voucher info:", error);
    message.error("Không thể tải thông tin phiếu nhập");
    return null;
  }
};

// API để lấy danh sách vật tư qua callDynamicApi (sp_GetVatTuList)
export const fetchVatTuListDynamicApi = async (params) => {
  const token = localStorage.getItem("access_token");

  const body = {
    store: "sp_GetVatTuList",
    param: {
      Keyword: params.keyword || "",
      UnitCode: params.unitCode || "",
      PageIndex: 1,
      PageSize: 100,
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

/**
 * Xử lý trường ma_kho từ API response
 * @param {string} apiMaKho - ma_kho từ API
 * @param {string} fallbackMaKho - ma_kho fallback (cho trường hợp update item)
 * @returns {string} ma_kho đã được trim
 */
export const processMaKho = (apiMaKho, fallbackMaKho = "") => {
  return (apiMaKho || fallbackMaKho || "").trim();
};

// Dynamic API functions for phieu nhap kho
export const submitPhieuNhapKhoDynamic = async (payload, successMessage, isUpdate = false) => {
  const token = localStorage.getItem("access_token");
  
  const storeName = isUpdate ? "Api_update_phieu_nhap_kho_voucher" : "Api_create_phieu_nhap_kho_voucher";
  
  const body = {
    store: storeName,
    param: {},
    data: {
      master: [payload.master],
      detail: payload.detail,
    },
  };

  try {
    const response = await https.post("v1/dynamicApi/call-dynamic-api", body, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    // Check new response structure with responseModel
    if (response.data?.responseModel?.isSucceded === true) {
      message.success(response.data.responseModel.message || successMessage);
      return { success: true };
    } else if (
      response.data &&
      (response.data.statusCode === 200 ||
        response.data.statusCode === "200" ||
        response.status === 200 ||
        response.data.success === true ||
        (response.data.message && response.data.message.includes("thành công")))
    ) {
      // Fallback for old response structure
      message.success(successMessage);
      return { success: true };
    } else {
      message.error(response.data?.responseModel?.message || response.data?.message || "Có lỗi xảy ra");
      return { success: false };
    }
  } catch (error) {
    console.error("Error submitting phieu nhap kho:", error);

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

export const deletePhieuNhapKhoDynamic = async (sctRec) => {
  const token = localStorage.getItem("access_token");

  const body = {
    store: "api_delete_phieu_nhap_kho_voucher",
    param: {
      stt_rec: sctRec,
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

    // Check new response structure with responseModel
    if (response.data?.responseModel?.isSucceded === true) {
      message.success(response.data.responseModel.message || "Xóa phiếu nhập kho thành công");
      return { success: true };
    } else {
      message.error(response.data?.responseModel?.message || "Xóa phiếu nhập kho thất bại");
      return { success: false };
    }
  } catch (error) {
    console.error("Lỗi khi xóa phiếu nhập kho:", error);
    if (error.response?.data?.responseModel?.message) {
      message.error(error.response.data.responseModel.message);
    } else if (error.response?.data?.message) {
      message.error(error.response.data.message);
    } else {
      message.error("Có lỗi xảy ra khi xóa phiếu nhập kho");
    }
    return { success: false };
  }
};
