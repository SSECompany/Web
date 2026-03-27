import dayjs from "dayjs";
import { message } from "antd";
import { multipleTablePutApi } from "../../../../../api";

export const getUserInfo = () => {
  try {
    const userStr = localStorage.getItem("user");
    const unitsResponseStr = localStorage.getItem("unitsResponse");

    const user = userStr ? JSON.parse(userStr) : {};
    const unitsResponse = unitsResponseStr ? JSON.parse(unitsResponseStr) : {};

    return {
      userId: user.userId || 4061,
      userName: user.userName || "",
      unitId: user.unitId || unitsResponse.unitId || "TAPMED",
      unitName: user.unitName || unitsResponse.unitName || "TAPMED",
    };
  } catch (error) {
    console.error("Error parsing localStorage:", error);
    return {
      userId: 4061,
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

  // ===== DETAIL71 - Build detail rows FIRST =====
  const detailData = dataSource.map((item, index) => {
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
      stt_rec: isUpdate ? (phieuData?.stt_rec || "") : "",
      stt_rec0: item.stt_rec0 || String(index + 1).padStart(3, "0"),
      ma_ct: "PNA",
      ngay_ct: orderDate,
      so_ct: values.soPhieu || phieuData?.so_ct || "",
      ma_vt: (item.maHang || item.ma_vt || "").trim(),
      ma_sp: item.ma_sp || "",
      ma_bp: item.ma_bp || "",
      so_lsx: item.so_lsx || "",
      dvt: (item.dvt || "").trim(),
      he_so: roundNum(item.he_so || 1, 3),
      ma_kho: (item.ma_kho || "").trim(),
      ma_vi_tri: (item.ma_vi_tri || "").trim(),
      ma_lo: (item.ma_lo || "").trim(),
      ma_vv: item.ma_vv || "",
      tk_vt: item.tk_vt || "156",
      so_luong: soLuong,
      gia_nt: giaNt,
      gia: gia,
      gia_nt0: giaNt0,
      gia0: gia0,
      tien_nt: tienNt,
      tien: tien,
      ma_thue: item.ma_thue || "",
      tk_thue: item.tk_thue || "1331",
      thue_suat: thueSuat,
      thue: thue,
      thue_nt: thueNt,
      tt: tt,
      tt_nt: ttNt,
      xstatus: item.xstatus || " ",
      xaction: item.xaction || " ",
      tien0: roundNum(item.tien0 || tienNt),
      tien_nt0: roundNum(item.tien_nt0 || tienNt),
      ma_thue_nk: item.ma_thue_nk || "",
      thue_suat_nk: roundNum(item.thue_suat_nk || 0),
      tk_thue_nk: item.tk_thue_nk || "",
      nk: roundNum(item.nk || 0),
      nk_nt: roundNum(item.nk_nt || 0),
      ma_thue_ttdb: item.ma_thue_ttdb || "",
      thue_suat_ttdb: roundNum(item.thue_suat_ttdb || 0),
      tk_thue_ttdb: item.tk_thue_ttdb || "",
      ttdb: roundNum(item.ttdb || 0),
      ttdb_nt: roundNum(item.ttdb_nt || 0),
      cp_bh: roundNum(item.cp_bh || 0),
      cp_bh_nt: roundNum(item.cp_bh_nt || 0),
      cp_vc: roundNum(item.cp_vc || 0),
      cp_vc_nt: roundNum(item.cp_vc_nt || 0),
      cp_khac: roundNum(item.cp_khac || 0),
      cp_khac_nt: roundNum(item.cp_khac_nt || 0),
      cp: roundNum(item.cp || 0),
      cp_nt: roundNum(item.cp_nt || 0),
      stt_rec_ct: item.stt_rec_ct || "",
      stt_rec0ct: item.stt_rec0ct || "",
      ct_so: item.ct_so || "",
      ct_ln: item.ct_ln || 0,
      stt_rec_dh: item.stt_rec_dh || "",
      stt_rec0dh: item.stt_rec0dh || "",
      dh_so: item.dh_so || "",
      dh_ln: item.dh_ln || 0,
      stt_rec_pn: item.stt_rec_pn || "",
      stt_rec0pn: item.stt_rec0pn || "",
      pn_so: item.pn_so || "",
      pn_ln: item.pn_ln || 0,
      tien_hang: roundNum(item.tien_hang || tienNt),
      tien_hang_nt: roundNum(item.tien_hang_nt || tienNt),
      line_nbr: item.line_nbr || index + 1,
      ma_hd: item.ma_hd || "",
      ma_ku: item.ma_ku || "",
      ma_phi: item.ma_phi || "",
      so_dh_i: item.so_dh_i || "",
      ma_td1: item.ma_td1 || "",
      ma_td2: item.ma_td2 || "",
      ma_td3: item.ma_td3 || "",
      sl_td1: roundNum(item.sl_td1 || 0, 4),
      sl_td2: roundNum(item.sl_td2 || 0, 4),
      sl_td3: roundNum(item.sl_td3 || 0, 4),
      ngay_td1: toDateVal(item.ngay_td1 || item.ngay_hh) || null,
      ngay_td2: toDateVal(item.ngay_td2) || null,
      ngay_td3: toDateVal(item.ngay_td3) || null,
      gc_td1: item.gc_td1 || "",
      gc_td2: item.gc_td2 || " ",
      gc_td3: item.gc_td3 || " ",
      s1: item.s1 || "",
      s2: item.s2 || "",
      s3: item.s3 || "",
      s4: roundNum(item.s4 || 0, 4),
      s5: roundNum(item.s5 || 0, 4),
      s6: roundNum(item.s6 || 0, 4),
      s7: toDateVal(item.s7) || null,
      s8: toDateVal(item.s8) || null,
      s9: toDateVal(item.s9) || null,
      ts_cktt: roundNum(item.ts_cktt || tienNt),
      cktt: roundNum(item.cktt || 0),
      tl_ck: roundNum(item.tl_ck || 0),
      ma_ck: item.ma_ck || "",
    };
  });

  // ===== Tính tổng TỪ detail đã build (đảm bảo khớp 100%) =====
  const totalQuantity = roundNum(
    detailData.reduce((sum, d) => sum + d.so_luong, 0), 3
  );
  const totalTienNt = roundNum(
    detailData.reduce((sum, d) => sum + d.tien_nt, 0)
  );
  const totalTien = roundNum(
    detailData.reduce((sum, d) => sum + d.tien, 0)
  );
  const totalThueNt = roundNum(
    detailData.reduce((sum, d) => sum + d.thue_nt, 0)
  );
  const totalThue = roundNum(
    detailData.reduce((sum, d) => sum + d.thue, 0)
  );
  const totalTtNt = roundNum(
    detailData.reduce((sum, d) => sum + d.tt_nt, 0)
  );
  const totalTt = roundNum(
    detailData.reduce((sum, d) => sum + d.tt, 0)
  );
  const totalTienNt0 = roundNum(
    detailData.reduce((sum, d) => sum + d.tien_nt0, 0)
  );
  const totalTien0 = roundNum(
    detailData.reduce((sum, d) => sum + d.tien0, 0)
  );

  // ===== MASTER71 - Bảng header =====
  const masterData = {
    stt_rec: isUpdate ? (phieuData?.stt_rec || "") : "",
    ma_dvcs: phieuData?.ma_dvcs || userInfo.unitId || "TAPMED",
    ma_ct: "PNA",
    loai_ct: phieuData?.loai_ct || "2 ",
    so_lo: phieuData?.so_lo || "",
    ngay_lo: toDateVal(phieuData?.ngay_lo) || null,
    ma_nk: phieuData?.ma_nk || "",
    ma_gd: values.maGiaoDich || phieuData?.ma_gd || "2 ",
    ngay_lct: hachToanDate,
    ngay_ct: orderDate,
    so_ct: values.soPhieu || phieuData?.so_ct || "",
    ma_nt: values.maNT || phieuData?.ma_nt || "VND",
    ty_gia: parseFloat(values.tyGia || phieuData?.ty_gia || 1),
    ong_ba: values.nguoiGiaoHang || phieuData?.ong_ba || "",
    ma_kh: values.maKhach || phieuData?.ma_kh || "",
    dien_giai: values.dienGiai || phieuData?.dien_giai || "",
    ma_nx: phieuData?.ma_nx || "",
    tk: phieuData?.tk || "331",
    so_ct0: phieuData?.so_ct0 || "",
    so_seri0: phieuData?.so_seri0 || "",
    ngay_ct0: toDateVal(phieuData?.ngay_ct0) || null,
    t_so_luong: totalQuantity,
    t_tien_nt: totalTienNt,
    t_tien: totalTien,
    t_thue_nt: totalThueNt,
    t_thue: totalThue,
    tk_thue_no: phieuData?.tk_thue_no || "",
    so_hd_gtgt: phieuData?.so_hd_gtgt || 0,
    t_tt_nt: totalTtNt,
    t_tt: totalTt,
    ma_kh2: phieuData?.ma_kh2 || "",
    ma_tt: values.trangThai || phieuData?.ma_tt || "03",
    t_tien0: totalTien0,
    t_tien_nt0: totalTienNt0,
    t_nk: roundNum(phieuData?.t_nk || 0),
    t_nk_nt: roundNum(phieuData?.t_nk_nt || 0),
    t_ttdb: roundNum(phieuData?.t_ttdb || 0),
    t_ttdb_nt: roundNum(phieuData?.t_ttdb_nt || 0),
    t_cp_bh: roundNum(phieuData?.t_cp_bh || 0),
    t_cp_bh_nt: roundNum(phieuData?.t_cp_bh_nt || 0),
    t_cp_vc: roundNum(phieuData?.t_cp_vc || 0),
    t_cp_vc_nt: roundNum(phieuData?.t_cp_vc_nt || 0),
    t_cp_khac: roundNum(phieuData?.t_cp_khac || 0),
    t_cp_khac_nt: roundNum(phieuData?.t_cp_khac_nt || 0),
    t_cp: roundNum(phieuData?.t_cp || 0),
    t_cp_nt: roundNum(phieuData?.t_cp_nt || 0),
    gia_thue_yn: phieuData?.gia_thue_yn || 0,
    nam: new Date(orderDate).getFullYear(),
    ky: new Date(orderDate).getMonth() + 1,
    xtag: phieuData?.xtag || " ",
    status: values.trangThai || phieuData?.status || "2",
    datetime0: isUpdate ? toDateVal(phieuData?.datetime0) : new Date(),
    datetime2: new Date(),
    user_id0: isUpdate ? (phieuData?.user_id0 || userInfo.userId) : userInfo.userId,
    user_id2: userInfo.userId,
    contract_id: phieuData?.contract_id || "",
    bcontract_id: phieuData?.bcontract_id || "",
    fee_id: phieuData?.fee_id || "",
    so_dh: phieuData?.so_dh || "",
    job_id: phieuData?.job_id || "",
    prd_id: phieuData?.prd_id || "",
    dept_id: phieuData?.dept_id || "",
    mo_nbr: phieuData?.mo_nbr || "",
    fcode1: phieuData?.fcode1 || "",
    fcode2: values.soDonHang || phieuData?.fcode2 || "",
    fcode3: phieuData?.fcode3 || "",
    fdate1: toDateVal(values.ngayDonHang) || toDateVal(phieuData?.fdate1) || null,
    fdate2: toDateVal(phieuData?.fdate2) || null,
    fdate3: toDateVal(phieuData?.fdate3) || null,
    fqty1: roundNum(phieuData?.fqty1 || 0, 4),
    fqty2: roundNum(phieuData?.fqty2 || totalTtNt, 4),
    fqty3: roundNum(phieuData?.fqty3 || 0, 4),
    fnote1: phieuData?.fnote1 || "",
    fnote2: phieuData?.fnote2 || " ",
    fnote3: phieuData?.fnote3 || " ",
    s1: phieuData?.s1 || "",
    s2: phieuData?.s2 || "",
    s3: phieuData?.s3 || "",
    s4: roundNum(phieuData?.s4 || 0, 4),
    s5: roundNum(phieuData?.s5 || 0, 4),
    s6: roundNum(phieuData?.s6 || 0, 4),
    s7: toDateVal(phieuData?.s7) || null,
    s8: toDateVal(phieuData?.s8) || null,
    s9: toDateVal(phieuData?.s9) || null,
  };

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
      userId: String(userInfo.userId),
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
  const token = localStorage.getItem("access_token");
  const https = (await import("../../../../../utils/https")).default;

  const body = {
    store: "Api_delete_phieu_nhap_hang_voucher",
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
      userId: 0, // Default to 0 as in KD module
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
  const token = localStorage.getItem("access_token");
  const https = (await import("../../../../../utils/https")).default;

  try {
    const response = await https.get(
      "v1/web/thong-tin-phieu-nhap",
      { voucherCode: "PNA" },
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
    console.error("Lỗi lấy thông tin phiếu nhập hàng:", error);
    return null;
  }
};
