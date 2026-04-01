import { message } from "antd";
import dayjs from "dayjs";
import https from "../../../../../utils/https";

export const getUserInfo = () => {
  try {
    const userStr = localStorage.getItem("user");
    const unitsResponseStr = localStorage.getItem("unitsResponse");

    const user = userStr ? JSON.parse(userStr) : {};
    const unitsResponse = unitsResponseStr ? JSON.parse(unitsResponseStr) : {};

    return {
      userId: user.userId,
      userName: user.userName,
      unitId: user.unitId,
      unitName: user.unitName || unitsResponse.unitName,
    };
  } catch (error) {
    console.error("Error parsing localStorage:", error);
    return null;
  }
};

export const formatDate = (date) => {
  const d = date ? new Date(date) : new Date();
  return d.toISOString().split(".")[0];
};

export const validateDataSource = (dataSource) => {
  if (!dataSource || !Array.isArray(dataSource) || dataSource.length === 0) {
    message.error("Vui lòng thêm ít nhất một vật tư");
    return false;
  }
  return true;
};

export const buildPayload = (
  values,
  dataSource,
  phieuData = null,
  isUpdate = false
) => {
  const userStr = localStorage.getItem("user");
  const unitsResponseStr = localStorage.getItem("unitsResponse");
  const user = userStr ? JSON.parse(userStr) : {};
  const unitsResponse = unitsResponseStr ? JSON.parse(unitsResponseStr) : {};
  
  const unitId = user.unitCode || unitsResponse.unitCode || "TAPMED";
  const userId = String(user.id || "1");

  const formatDate = (date) => {
    if (!date) return "";
    return dayjs(date).format("YYYY-MM-DD");
  };

  const ngay_ct = formatDate(values.ngay_ct || values.ngay);

  // MASTER - 13 fields exactly as requested
  const master = {
    ma_gd: String(values.ma_gd || values.maGiaoDich || "3").trim(),
    ngay_ct: ngay_ct,
    so_ct: (values.so_ct || values.soPhieu || "").trim(),
    ma_kho: (values.ma_kho || values.maKhoNhap || "").trim(),
    ma_khon: (values.ma_khon || values.maKhoXuat || "").trim(),
    status: String(values.status || values.trangThai || "3").trim(),
    stt_rec: (phieuData?.stt_rec || "").trim(),
    ma_dvcs: unitId,
    ma_ct: "PXB",
    loai_ct: "2",
    so_lo: (values.so_lo || "").trim(),
    ngay_lo: values.ngay_lo ? formatDate(values.ngay_lo) : "",
    ma_nk: (values.ma_nk || "").trim(),
  };

  // DETAIL - 72 fields exactly as requested
  const detail = dataSource.map((item, index) => {
    return {
      so_luong: parseFloat(item.so_luong || item.soLuongDeNghi || 0),
      so_luong_goc: parseFloat(item.so_luong_goc || 0),
      sl_td3: parseFloat(item.sl_td3 || 0),
      sl_td3_goc: parseFloat(item.sl_td3_goc || 0),
      he_so: parseFloat(item.he_so || 1),
      dvt: (item.dvt || "").trim(),
      tk_vt: (item.tk_vt || "156").trim(),
      ma_kho: (item.ma_kho || "").trim(),
      stt_rec: (phieuData?.stt_rec || "").trim(),
      stt_rec0: String(index + 1).padStart(3, "0"),
      ma_ct: "PXB",
      ngay_ct: ngay_ct,
      so_ct: (values.so_ct || values.soPhieu || "").trim(),
      ma_vt: (item.ma_vt || item.maHang || "").trim(),
      gia_nt2: parseFloat(item.gia_nt2 || 0),
      gia2: parseFloat(item.gia2 || 0),
      thue: parseFloat(item.thue || 0),
      thue_nt: parseFloat(item.thue_nt || 0),
      tien2: parseFloat(item.tien2 || 0),
      tien_nt2: parseFloat(item.tien_nt2 || 0),
      tl_ck: parseFloat(item.tl_ck || 0),
      ck: parseFloat(item.ck || 0),
      ck_nt: parseFloat(item.ck_nt || 0),
      tl_ck_khac: parseFloat(item.tl_ck_khac || 0),
      gia_ck: parseFloat(item.gia_ck || 0),
      tien_ck_khac: parseFloat(item.tien_ck_khac || 0),
      tk_gv: (item.tk_gv || "").trim(),
      tk_dt: (item.tk_dt || "").trim(),
      ma_thue: (item.ma_thue || "").trim(),
      thue_suat: parseFloat(item.thue_suat || 0),
      tk_thue: (item.tk_thue || "").trim(),
      tk_ck: (item.tk_ck || "").trim(),
      tk_cpbh: (item.tk_cpbh || "").trim(),
      sl_td1: parseFloat(item.sl_td1 || 0),
      sl_td2: parseFloat(item.sl_td2 || 0),
      sl_dh: parseFloat(item.sl_dh || 0),
      sl_giao: parseFloat(item.sl_giao || 0),
      dh_ln: parseFloat(item.dh_ln || 0),
      px_ln: parseFloat(item.px_ln || 0),
      stt_rec_dh: (item.stt_rec_dh || "").trim(),
      stt_rec0dh: (item.stt_rec0dh || "").trim(),
      stt_rec_px: (item.stt_rec_px || "").trim(),
      stt_rec0px: (item.stt_rec0px || "").trim(),
      dh_so: (item.dh_so || "").trim(),
      px_so: (item.px_so || "").trim(),
      taoma_yn: item.taoma_yn ? 1 : 0,
      km_yn: item.km_yn ? 1 : 0,
      px_gia_dd: item.px_gia_dd ? 1 : 0,
      ma_sp: (item.ma_sp || "").trim(),
      ma_bp: (item.ma_bp || "").trim(),
      so_lsx: (item.so_lsx || "").trim(),
      ma_vi_tri: (item.ma_vi_tri || "").trim(),
      ma_lo: (item.ma_lo || "").trim(),
      ma_vv: (item.ma_vv || "").trim(),
      ma_nx: (item.ma_nx || "").trim(),
      tk_du: (item.tk_du || "").trim(),
      ten_vt: (item.ten_vt || item.ma_vt || item.maHang || "").trim(),
      gia_nt: parseFloat(item.gia_nt || 0),
      gia: parseFloat(item.gia || 0),
      tien_nt: parseFloat(item.tien_nt || 0),
      tien: parseFloat(item.tien || 0),
      line_nbr: parseFloat(item.line_nbr || index + 1),
      ma_kh2: (item.ma_kh2 || "").trim(),
      ma_td1: (item.ma_td1 || "").trim(),
      datetime0: "",
      datetime2: "",
      user_id0: "",
      user_id2: "",
      nam: parseInt(dayjs(ngay_ct).format("YYYY")) || 0,
      ky: parseInt(dayjs(ngay_ct).format("MM")) || 0,
      ma_dvcs: unitId,
      loai_ct: "2",
    };
  });

  return {
    store: isUpdate
      ? "api_sua_phieu_nhap_dieu_chuyen" // Đã standardize lại tên store cho chuẩn bộ API mới
      : "api_tao_phieu_nhap_dieu_chuyen",
    param: {
      UnitId: unitId,
      StoreID: "",
      userId: userId,
    },
    data: {
      master85: [master],
      detail85: detail,
    },
  };
};

export const submitPhieu = async (endpoint, payload, successMessage) => {
  const token = localStorage.getItem("access_token");

  try {
    const response = await https.post(endpoint, payload, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.data && response.data.statusCode === 200) {
      message.success(successMessage);
      return { success: true };
    } else {
      message.error(response.data?.message || "Có lỗi xảy ra");
      return { success: false };
    }
  } catch (error) {
    console.error("Error submitting phieu:", error);
    if (error.response?.data?.message) {
      message.error(error.response.data.message);
    } else {
      message.error("Vui lòng kiểm tra lại thông tin");
    }
    return { success: false };
  }
};

export const deletePhieu = async (stt_rec) => {
  const token = localStorage.getItem("access_token");

  try {
    const response = await https.post(
      "v1/web/xoa-ct-nhap-dieu-chuyen",
      {},
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        params: {
          sctRec: stt_rec,
        },
      }
    );

    if (response.data && response.data.statusCode === 200) {
      message.success("Xóa phiếu thành công");
      return { success: true };
    } else {
      message.error(response.data?.message || "Có lỗi xảy ra khi xóa phiếu");
      return { success: false };
    }
  } catch (error) {
    console.error("Lỗi khi xóa phiếu:", error);
    message.error("Không thể xóa phiếu. Vui lòng thử lại sau.");
    return { success: false };
  }
};
