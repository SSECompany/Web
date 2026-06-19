import dayjs from "dayjs";
import { staticMessage as message } from "../../../../../utils/antdStatic";
import { multipleTablePutApi } from "../../../../../api";
import jwt from "../../../../../utils/jwt";

export const getUserInfo = () => {
  try {
    const userStr = localStorage.getItem("user");
    const unitsResponseStr = localStorage.getItem("unitsResponse");

    const user = userStr ? JSON.parse(userStr) : {};
    const unitsResponse = unitsResponseStr ? JSON.parse(unitsResponseStr) : {};

    const claims = jwt.getClaims();
    const userId = (claims && claims.Id) ? parseInt(claims.Id) : (user.id || user.userId || 1);

    return {
      userId: userId,
      userName: user.userName || claims?.Name || "",
      unitId: user.unitCode || user.unitId || claims?.MA_DVCS || unitsResponse.unitId || "TAPMED",
      unitName: user.unitName || claims?.DVCS || unitsResponse.unitName || "TAPMED",
    };
  } catch (error) {
    console.error("Error parsing localStorage:", error);
    return {
      userId: 1,
      userName: "",
      unitId: "TAPMED",
      unitName: "TAPMED",
    };
  }
};

export const formatDate = (date) => {
  const d = date ? new Date(date) : new Date();
  return d.toISOString().split(".")[0];
};

const roundNum = (v, decimals = 2) => {
  const n = parseFloat(v || 0);
  return Math.round(n * Math.pow(10, decimals)) / Math.pow(10, decimals);
};

const toDateVal = (v) => {
  if (!v) return null;
  if (dayjs.isDayjs(v)) return v.toDate();
  if (typeof v === "string") {
    const d = dayjs(v);
    return d.isValid() ? d.toDate() : v;
  }
  return v;
};

export const validateDataSource = (dataSource) => {
  if (dataSource.length === 0) {
    message.error("Vui lòng thêm ít nhất một vật tư");
    return { isValid: false };
  }
  return { isValid: true };
};

/**
 * Build payload cho #master71 và #detail71 theo đúng schema SQL
 * của stored procedure api_tao_phieu_nhap_hang_theo_don
 */
export const buildPhieuNhapHangPayload = (
  values,
  dataSource,
  phieuData = null,
  isUpdate = false
) => {
  const userInfo = getUserInfo();
  const orderDate = toDateVal(values.ngay) || new Date();
  const hachToanDate = toDateVal(values.ngayHachToan) || orderDate;

  // ===== Tính tổng trước =====
  const detailCalc = dataSource.map((item, index) => {
    const soLuong = roundNum(parseFloat(item.soLuong || item.so_luong || 0), 3);
    const giaNt = roundNum(parseFloat(item.gia_nt || 0), 4);
    const gia = roundNum(parseFloat(item.gia || giaNt), 4);
    const giaNt0 = roundNum(parseFloat(item.gia_nt0 || giaNt), 4);
    const gia0 = roundNum(parseFloat(item.gia0 || gia), 4);
    const tienNt = roundNum(soLuong * giaNt);
    const tien = roundNum(soLuong * gia);
    const thueSuat = roundNum(parseFloat(item.thue_suat || 0));
    const thueNt = roundNum(tienNt * thueSuat / 100);
    const thue = roundNum(tien * thueSuat / 100);
    const ttNt = roundNum(tienNt + thueNt);
    const tt = roundNum(tien + thue);
    return {
      so_luong: soLuong,
      gia_nt: giaNt,
      gia: gia,
      gia_nt0: giaNt0,
      gia0: gia0,
      tien_nt: tienNt,
      tien: tien,
      tien0: roundNum(item.tien0 || tienNt),
      tien_nt0: roundNum(item.tien_nt0 || tienNt),
      thue_nt: thueNt,
      thue: thue,
      tt_nt: ttNt,
      tt: tt,
      tien_hang_nt: roundNum(item.tien_hang_nt || tienNt),
      tien_hang: roundNum(item.tien_hang || tienNt),
      ts_cktt: roundNum(item.ts_cktt || tienNt),
      cktt: roundNum(item.cktt || 0),
      tl_ck: roundNum(item.tl_ck || 0),
      _item: item,
      _index: index,
    };
  });

  const totalQuantity  = roundNum(detailCalc.reduce((s, d) => s + d.so_luong, 0), 3);
  const totalTienNt   = roundNum(detailCalc.reduce((s, d) => s + d.tien_nt, 0));
  const totalTien     = roundNum(detailCalc.reduce((s, d) => s + d.tien, 0));
  const totalThueNt   = roundNum(detailCalc.reduce((s, d) => s + d.thue_nt, 0));
  const totalThue     = roundNum(detailCalc.reduce((s, d) => s + d.thue, 0));
  const totalTtNt     = roundNum(detailCalc.reduce((s, d) => s + d.tt_nt, 0));
  const totalTt       = roundNum(detailCalc.reduce((s, d) => s + d.tt, 0));
  const totalTienNt0  = roundNum(detailCalc.reduce((s, d) => s + d.tien_nt0, 0));
  const totalTien0    = roundNum(detailCalc.reduce((s, d) => s + d.tien0, 0));

  // ===== MASTER71 =====
  const masterData = {
    ma_nk: values.ma_nk || phieuData?.ma_nk || "",
    loai_ct: values.loai_ct || phieuData?.loai_ct || "",
    stt_rec: isUpdate ? (phieuData?.stt_rec || "") : "",
    ma_dvcs: phieuData?.ma_dvcs || userInfo.unitId || "TAPMED",
    ma_ct: "PNA",
    ma_gd: values.maGiaoDich || phieuData?.ma_gd || "1",
    ngay_lct: hachToanDate,
    ngay_ct: orderDate,
    so_ct: values.soPhieu || phieuData?.so_ct || "",
    ma_nt: values.maNT || phieuData?.ma_nt || "VND",
    ty_gia: parseFloat(values.tyGia || phieuData?.ty_gia || 1),
    ong_ba: values.nguoiGiaoHang || phieuData?.ong_ba || "",
    ma_kh: values.maKhach || phieuData?.ma_kh || "",
    dien_giai: values.dienGiai || phieuData?.dien_giai || "",
    t_so_luong: totalQuantity,
    t_tien_nt: totalTienNt,
    t_tien: totalTien,
    t_thue_nt: totalThueNt,
    t_thue: totalThue,
    t_tt_nt: totalTtNt,
    t_tt: totalTt,
    t_tien0: totalTien0,
    t_tien_nt0: totalTienNt0,
    status: String(values.trangThai || values.status || phieuData?.status || "3").trim(),
    datetime2: isUpdate ? toDateVal(phieuData?.datetime2) : new Date(),
    user_id2: isUpdate ? phieuData?.user_id2 : userInfo.userId,
    fcode2: values.soDonHang || phieuData?.fcode2 || "",
    fdate1: toDateVal(values.ngayDonHang) || toDateVal(phieuData?.fdate1) || null,
    fcode1: (values.ma_nv_mua?.split(" – ")[0]) || phieuData?.fcode1 || "",
    nam: new Date(orderDate).getFullYear(),
    ky: new Date(orderDate).getMonth() + 1,
  };

  // Nếu thêm mới, thêm datetime0
  if (!isUpdate) {
    masterData.datetime0 = new Date();
    masterData.user_id0 = userInfo.userId;
  }

  // ===== DETAIL71 =====
  const detailData = detailCalc.map((d, index) => {
    const item = d._item;
    console.log("[DEBUG] buildPayload ma_lo:", { ma_lo: item.ma_lo, ma_lo_raw: item["ma_lo"], key: item.key });
    return {
      stt_rec: isUpdate ? (phieuData?.stt_rec || "") : "",
      ma_ct: "PNA",
      ngay_ct: orderDate,
      so_ct: values.soPhieu || phieuData?.so_ct || item.so_ct || "",
      ma_vt: (item.maHang || item.ma_vt || "").trim(),
      stt_rec0: item.stt_rec0 || String(index + 1).padStart(3, "0"),
      ma_sp: "",
      ma_bp: "",
      so_lsx: "",
      ma_vi_tri: (item.ma_vi_tri || "").trim(),
      ma_lo: (item.ma_lo || "").trim(),
      ma_vv: "",
      ma_hd: "",
      ma_ku: "",
      ma_phi: "",
      ma_td1: "",
      ma_td2: "",
      ma_td3: "",
      so_luong: d.so_luong,
      he_so: roundNum(item.he_so || 1, 3),
      dvt: (item.dvt || "").trim(),
      tk_vt: item.tk_vt || "156",
      ma_kho: (item.ma_kho || "").trim(),
      gia_nt0: d.gia_nt0,
      gia0: d.gia0,
      gia_nt: d.gia_nt,
      gia: d.gia,
      tien_nt: d.tien_nt,
      tien: d.tien,
      tien_nt0: d.tien_nt0,
      tien0: d.tien0,
      tien_hang_nt: d.tien_hang_nt,
      tien_hang: d.tien_hang,
      ma_thue: item.ma_thue || "",
      tk_thue: item.tk_thue || "1331",
      thue_suat: roundNum(item.thue_suat || 0),
      thue_nt: d.thue_nt,
      thue: d.thue,
      tt_nt: d.tt_nt,
      tt: d.tt,
      tl_ck: d.tl_ck,
      stt_rec_pn: "",
      stt_rec0pn: "",
      dh_ln: 0,
      stt_rec_dh: "",
      stt_rec0dh: "",
      dh_so: "",
      line_nbr: item.line_nbr || index + 1,
      ngay_td1: toDateVal(item.ngay_td1 || item.ngay_hh) || null,
      ts_cktt: d.ts_cktt,
      cktt: d.cktt,
    };
  });

  return {
    master: masterData,
    detail: detailData,
  };
};

/**
 * Gọi stored procedure:
 *  - api_tao_phieu_nhap_hang_theo_don (thêm mới)
 *  - api_sua_phieu_nhap_hang_theo_don (cập nhật)
 */
export const submitPhieuNhapHangDynamic = async (
  payload,
  successMessage,
  isUpdate = false
) => {
  const userInfo = getUserInfo();

  const body = {
    store: isUpdate ? "api_sua_phieu_nhap_hang_theo_don" : "api_tao_phieu_nhap_hang_theo_don",
    param: {
      UnitId: userInfo.unitId,
      StoreID: "",
      userId: String(userInfo.userId)
      
    },
    data: {
      master71: [payload.master],
      detail71: payload.detail,
    },
  };

  try {
    const response = await multipleTablePutApi(body);

    if (response?.responseModel?.isSucceded === true) {
      message.success(
        response.responseModel.message || successMessage || "Thành công"
      );
      return { success: true, data: response };
    } else if (response?.statusCode === 200) {
      message.success(successMessage || "Thành công");
      return { success: true, data: response };
    } else {
      message.error(
        response?.responseModel?.message ||
          response?.message ||
          "Có lỗi xảy ra"
      );
      return { success: false };
    }
  } catch (error) {
    console.error("Lỗi gửi phiếu nhập hàng:", error);
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

export const deletePhieuNhapHangDynamic = async (stt_rec) => {
  const userInfo = getUserInfo();
  const token = localStorage.getItem("access_token");
  const https = (await import("../../../../../utils/https")).default;

  const body = {
    store: "api_xoa_phieu_nhap_hang_theo_don",
    param: {
      stt_rec: stt_rec,
      UserId: userInfo.userId,
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
    console.error("Lỗi xóa phiếu nhập hàng:", error);
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
  const userInfo = getUserInfo();
  const token = localStorage.getItem("access_token");
  const https = (await import("../../../../../utils/https")).default;

  // Use the same store and parameter structure as Business Order (KD) module
  const body = {
    store: "api_list_vat_tu",
    param: {
      PageIndex: params.pageIndex || 1,
      PageSize: params.pageSize || 100,
      ma_vt: "",
      ten_vt: params.keyword || "",
      userId: userInfo.userId, // use dynamic userId
    },
    data: {},
    resultSetNames: ["data"], // api_list_vat_tu usually returns only data table
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
    
    // api_list_vat_tu might not return pagination explicit table, 
    // we fallback to basic pagination based on record count if missing
    const paginationData = listObject[1]?.[0] || {};

    return {
      data: responseData,
      pagination: {
        totalRecord: paginationData.totalRecord || paginationData.totalrow || responseData.length || 0,
        pageSize: params.pageSize || 100,
        totalPage: paginationData.totalpage || 1,
      },
      success: true,
    };
  } catch (error) {
    console.error("Lỗi gọi API danh sách vật tư (KD-style):", error);
    return {
      data: [],
      pagination: { totalPage: 1 },
      success: false,
      error: error.message,
    };
  }
};

// Lấy thông tin phiếu nhập mặc định
export const fetchVoucherInfo = async () => {
  return null;
};
