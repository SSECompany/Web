import { message } from "antd";
import dayjs from "dayjs";
import https from "../../../../../utils/https";
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
      unitId: user.unitCode || user.unitId || claims?.MA_DVCS || unitsResponse.unitCode || unitsResponse.unitId || "TAPMED",
      unitName: user.unitName || claims?.DVCS || unitsResponse.unitName || "TAPMED",
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
  
  const unitId = user.unitCode || user.unitId || unitsResponse.unitCode || unitsResponse.unitId || "TAPMED";
  const userId = String(user.id || user.userId || "1");

  const formatDate = (date) => {
    if (!date) return "";
    return dayjs(date).format("YYYY-MM-DD");
  };

  const ngay_ct = formatDate(values.ngay_ct || values.ngay);

  // MASTER - Match EXACTLY the SQL trace #master85 columns
  const master = {
    stt_rec: (phieuData?.stt_rec || "").trim(),
    ma_dvcs: unitId,
    ma_ct: "PXB",
    loai_ct: "3", // In SQL trace it is "3 "
    so_lo: (values.so_lo || "").trim(),
    ngay_lo: values.ngay_lo ? formatDate(values.ngay_lo) : null,
    ma_nk: (values.ma_nk || "").trim(),
    ma_gd: String(values.ma_gd || values.maGiaoDich || "3").trim(),
    ngay_lct: values.ngay_lct ? formatDate(values.ngay_lct) : ngay_ct,
    ngay_ct: ngay_ct,
    so_ct: (values.so_ct || values.soPhieu || "").trim(),
    ma_nt: "VND",
    ty_gia: 1.0,
    ma_kho: (values.ma_kho || values.maKhoXuat || "").trim(),
    ma_khon: (values.ma_khon || values.maKhoNhap || "").trim(),
    so_buoc: "2",
    ngay_den: null,
    so_pn: "",
    ngay_pn: null,
    ong_ba: (values.ong_ba || "").trim(),
    ma_kh: "",
    dien_giai: (values.dien_giai || "").trim(),
    t_so_luong: dataSource.reduce((acc, item) => acc + parseFloat(item.so_luong || item.soLuongDeNghi || 0), 0),
    t_tien_nt: 0.0,
    t_tien: 0.0,
    nam: parseInt(dayjs(ngay_ct).format("YYYY")) || 0,
    ky: parseInt(dayjs(ngay_ct).format("MM")) || 0,
    status: String(values.status || values.trangThai || "3").trim(),
    datetime0: phieuData?.datetime0 || "",
    datetime2: phieuData?.datetime2 || "",
    user_id0: parseInt(phieuData?.user_id0 || userId) || parseInt(userId),
    user_id2: parseInt(phieuData?.user_id2 || userId) || parseInt(userId),
    contract_id: "", bcontract_id: "", fee_id: "", so_dh: "", job_id: "",
    prd_id: "", dept_id: "", mo_nbr: "", fcode1: "", fcode2: "", fcode3: "",
    fdate1: null, fdate2: null, fdate3: null,
    fqty1: 0, fqty2: 0, fqty3: 0,
    fnote1: "", fnote2: "", fnote3: "",
    s1: "", s2: "", s3: "", s4: 0, s5: 0, s6: 0, s7: null, s8: null, s9: null
  };

  // DETAIL - Match EXACTLY the SQL trace #detail85 columns
  const detail = dataSource.map((item, index) => {
    return {
      stt_rec: (phieuData?.stt_rec || "").trim(),
      stt_rec0: String(index + 1).padStart(3, "0"),
      ma_ct: "PXB",
      ngay_ct: ngay_ct,
      so_ct: (values.so_ct || values.soPhieu || "").trim(),
      ma_vt: (item.ma_vt || item.maHang || "").trim(),
      ma_sp: (item.ma_sp || "").trim(),
      ma_bp: (item.ma_bp || "").trim(),
      so_lsx: (item.so_lsx || "").trim(),
      dvt: (item.dvt || "").trim(),
      he_so: parseFloat(item.he_so || 1),
      ma_kho: (values.ma_kho || values.maKhoXuat || "").trim(),
      ma_khon: (values.ma_khon || values.maKhoNhap || "").trim(),
      ma_vi_trin: (item.ma_vi_trin || "").trim(),
      ma_vi_tri: (item.ma_vi_tri || "").trim(),
      ma_lo: (item.ma_lo || "").trim(),
      ma_vv: (item.ma_vv || "").trim(),
      ma_nx: "156",
      tk_du: "156",
      tk_vt: (item.tk_vt || "156").trim(),
      so_luong: parseFloat(item.so_luong || item.soLuongDeNghi || 0),
      gia_nt: 0.0, gia: 0.0, tien_nt: 0.0, tien: 0.0,
      px_gia_dd: 0,
      stt_rec_pn: "", stt_rec0pn: "", stt_rec_yc: "", stt_rec0yc: "",
      line_nbr: index + 1,
      ma_hd: "", ma_ku: "", ma_phi: "", so_dh_i: "", ma_td1: "", ma_td2: "", ma_td3: "",
      sl_td1: 0, sl_td2: 0, sl_td3: 0,
      ngay_td1: null, ngay_td2: null, ngay_td3: null,
      gc_td1: "", gc_td2: "", gc_td3: "",
      s1: "", s2: "", s3: "", s4: 0, s5: 0, s6: 0, s7: null, s8: null, s9: null,
      so_luong2: 0
    };
  });

  return {
    store: isUpdate
      ? "api_sua_phieu_xuat_dieu_chuyen"
      : "api_tao_phieu_xuat_dieu_chuyen",
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
      "v1/web/xoa-ct-xuat-dieu-chuyen",
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
