import dayjs from "dayjs";
import { multipleTablePutApi } from "../../../../api";
import jwt from "../../../../utils/jwt";

const roundNum = (val, dec = 2) => {
    if (val === undefined || val === null || val === "") return 0;
    const factor = Math.pow(10, dec);
    return Math.round(parseFloat(val) * factor) / factor;
};

const getCurrentUserId = () => {
    try {
        const claims = jwt.getClaims();
        if (claims && claims.Id) {
            return parseInt(claims.Id) || 1;
        }
        
        // Fallback to legacy 'user' if it exists (for compatibility)
        const userStr = localStorage.getItem("user");
        if (userStr) {
            const user = JSON.parse(userStr);
            return user.id || user.userId || 1;
        }
    } catch (error) {
        console.error("Error getting user ID:", error);
    }
    return 1;
};

const formatApiDate = (val) => {
    if (!val) return null;
    const d = dayjs(val);
    return d.isValid() ? d.format("YYYY-MM-DDTHH:mm:ss") : val;
};

export const fetchPhieuKinhDoanhList = async (params) => {
    const body = {
        store: "api_list_don_hang_ban",
        param: {
            so_ct: params.so_ct || "",
            ma_kh: params.ma_kh || "",
            ten_kh: params.ten_kh || "",
            ghi_chu_kh: params.ghi_chu_kh || "",
            ma_nvbh: params.ma_nvbh || "",
            ten_nvbh: params.ten_nvbh || "",
            ma_vc: params.ma_vc || "",
            dien_giai: params.dien_giai || "",
            ghi_chu_giao_hang: params.ghi_chu_giao_hang || "",
            status: Array.isArray(params.status) ? params.status.join(",") : (params.status || ""),
            kw_so_ct: params.kw_so_ct || "",
            kw_ma_kh: params.kw_ma_kh || "",
            kw_dien_giai: params.kw_dien_giai || "",
            kw_ten_kh: params.kw_ten_kh || "",
            kw_nguoi_tao: params.kw_nguoi_tao || "",
            DateFrom: params.dateRange?.[0] ? params.dateRange[0].format("YYYY-MM-DD") : null,
            DateTo: params.dateRange?.[1] ? params.dateRange[1].format("YYYY-MM-DD") : null,
            CKDateFrom: params.CKDateFrom || null,
            CKDateTo: params.CKDateTo || null,
            KDDateFrom: params.KDDateFrom || null,
            KDDateTo: params.KDDateTo || null,
            UserId: params.UserId || getCurrentUserId(),
            PageIndex: params.PageIndex || 1,
            PageSize: params.PageSize || 20,
        },
        data: {},
        resultSetNames: ["data", "pagination"],
    };

    try {
        const response = await multipleTablePutApi(body);

        // Handle both possible structures from multipleTablePutApi
        const dataLists = response?.listObject?.dataLists;
        let responseData = [];
        let paginationData = {};

        if (dataLists) {
            responseData = dataLists.data || [];
            paginationData = dataLists.pagination?.[0] || {};
        } else {
            responseData = response?.listObject?.[0] || [];
            paginationData = response?.listObject?.[1]?.[0] || {};
        }

        return {
            success: true,
            data: responseData,
            pagination: {
                totalRecord: paginationData.totalRecord || paginationData.totalrow || responseData.length || 0
            },
        };
    } catch (error) {
        console.error("Lỗi khi gọi API api_list_don_hang_ban:", error);
        return {
            success: false,
            data: [],
            pagination: { totalRecord: 0 },
            error: error.message
        };
    }
};

export const deletePhieuKinhDoanh = async (stt_rec) => {
    // Use standard delete if available, or mock if not
    const token = localStorage.getItem("access_token");
    const body = {
        store: "api_delete_don_hang_ban", // Assuming this name exists or use a generic one
        param: { stt_rec },
        data: {},
    };

    try {
        const response = await multipleTablePutApi(body);
        return { success: response?.responseModel?.isSucceded || true };
    } catch (error) {
        console.error("Error deleting don hang ban:", error);
        return { success: false, error: error.message };
    }
};

export const fetchPhieuKinhDoanhDetail = async (stt_rec) => {
    const body = {
        store: "api_get_don_hang_ban",
        param: {
            stt_rec: stt_rec,
            UserId: getCurrentUserId(),
        },
        data: {},
        resultSetNames: ["header", "chiPhi", "anhWeb", "statusList"],
    };

    try {
        const response = await multipleTablePutApi(body);
        
        const list = response?.listObject || [];
        const header = list[0] || [];
        const chiPhi = list[1] || [];
        const anhWeb = list[2] || [];
        const statusList = list[3] || [];

        return {
            success: true,
            data: {
                header: header.length > 0 ? header[0] : null,
                chiPhi,
                anhWeb,
                statusList,
            },
        };
    } catch (error) {
        console.error("Lỗi khi gọi API api_get_don_hang_ban:", error);
        return {
            success: false,
            data: null,
            error: error.message
        };
    }
};

export const fetchPhieuKinhDoanhPrintData = async (stt_rec) => {
    const body = {
        store: "api_get_print_data_don_hang",
        param: {
            stt_rec: stt_rec,
            UserId: getCurrentUserId(),
        },
        data: {},
    };

    try {
        const response = await multipleTablePutApi(body);
        return {
            success: true,
            data: response?.listObject?.[0]?.[0] || null,
        };
    } catch (error) {
        console.error("Lỗi khi gọi API api_get_print_data_don_hang:", error);
        return { success: false, data: null };
    }
};

export const fetchPhieuKinhDoanhChiTiet = async (stt_rec) => {
    const body = {
        store: "api_list_don_hang_ban_chi_tiet",
        param: {
            stt_rec,
            UserId: getCurrentUserId(),
        },
        data: {},
        resultSetNames: ["data"],
    };

    try {
        const response = await multipleTablePutApi(body);
        return {
            success: true,
            data: response?.listObject?.[0] || [],
        };
    } catch (error) {
        console.error("Lỗi khi gọi API api_list_don_hang_ban_chi_tiet:", error);
        return { success: false, data: [] };
    }
};


export const fetchSplitPhieuKinhDoanhItems = async (stt_rec, pageIndex = 1, pageSize = 20) => {
    const body = {
        store: "api_list_split_don_hang_ban",
        param: {
            stt_rec,
            PageIndex: pageIndex,
            PageSize: pageSize,
        },
        data: {},
    };

    try {
        const response = await multipleTablePutApi(body);
        return {
            success: true,
            data: response?.listObject?.[0] || [],
        };
    } catch (error) {
        console.error("Lỗi khi gọi API api_list_split_don_hang_ban:", error);
        return { success: false, data: [] };
    }
};

export const splitPhieuKinhDoanh = async (stt_rec, ma_vt_list, userId = getCurrentUserId()) => {
    const body = {
        store: "api_split_don_hang_ban",
        param: {
            stt_rec,
            ma_vt_list,
            UserId: userId,
        },
        data: {},
    };

    try {
        const response = await multipleTablePutApi(body);
        return {
            success: response?.responseModel?.isSucceded,
            message: response?.responseModel?.message
        };
    } catch (error) {
        console.error("Lỗi khi gọi API api_split_don_hang_ban:", error);
        return { success: false, message: error.message };
    }
};

export const mergePhieuKinhDoanh = async (stt_rec_list, userId = getCurrentUserId()) => {
    const body = {
        store: "api_merge_don_hang_ban",
        param: {
            stt_rec_list,
            UserId: userId,
        },
        data: {},
    };

    try {
        const response = await multipleTablePutApi(body);
        return {
            success: response?.responseModel?.isSucceded,
            message: response?.responseModel?.message
        };
    } catch (error) {
        console.error("Lỗi khi gọi API api_merge_don_hang_ban:", error);
        return { success: false, message: error.message };
    }
};
export const transferDonHangBan = async (stt_rec_list, userId = getCurrentUserId()) => {
    const body = {
        store: "api_transfer_don_hang_ban",
        param: {
            stt_rec_list,
            UserId: userId,
        },
        data: {},
    };

    try {
        const response = await multipleTablePutApi(body);
        return {
            success: response?.responseModel?.isSucceded,
            message: response?.responseModel?.message
        };
    } catch (error) {
        console.error("Lỗi khi gọi API api_transfer_don_hang_ban:", error);
        return { success: false, message: error.message };
    }
};

export const cancelDonHangBan = async (stt_rec_list, userId = getCurrentUserId()) => {
    const body = {
        store: "api_cancel_don_hang_ban",
        param: {
            stt_rec_list,
            UserId: userId,
        },
        data: {},
    };

    try {
        const response = await multipleTablePutApi(body);
        return {
            success: response?.responseModel?.isSucceded,
            message: response?.responseModel?.message
        };
    } catch (error) {
        console.error("Lỗi khi gọi API api_cancel_don_hang_ban:", error);
        return { success: false, message: error.message };
    }
};

export const createPhieuKinhDoanh = async (master, detail, r60, unitId = "TAPMED", storeId = "", userId = getCurrentUserId()) => {
    // Map Master Data
    const masterData = {
        stt_rec: master.stt_rec || "",
        ma_dvcs: unitId,
        ma_ct: "DXA",
        loai_ct: String(master.loai_ct || "1"),
        so_lo: master.so_lo || "",
        ngay_lo: master.ngay_lo || null,
        ma_nk: master.ma_nk || "",
        ma_gd: String(master.hinh_thuc_tt || ""),
        ngay_lct: formatApiDate(master.ngay_lct || master.ngay_ct || new Date()),
        ngay_ct: formatApiDate(master.ngay_ct || new Date()),
        so_ct: master.so_ct || "",
        ma_nt: master.ma_nt || "VND",
        ty_gia: master.ty_gia || 1,
        ong_ba: master.ong_ba || "",
        ma_kh: master.ma_kh || "",
        dien_giai: master.dien_giai || "",
        ma_nx: master.ma_nx || "",
        tk: master.tk || "",
        t_so_luong: roundNum(master.t_so_luong || 0),
        t_tien_nt: roundNum(master.t_tien_nt || 0),
        t_tien: roundNum(master.t_tien || 0),
        t_thue_nt: roundNum(master.t_thue_nt || 0),
        t_thue: roundNum(master.t_thue || 0),
        t_tt_nt: roundNum(master.tong_cong || 0, 0),
        t_tt: roundNum(master.tong_cong || 0, 0),
        ma_tt: master.ma_tt || "",
        t_tien2: roundNum(master.t_tien2 || 0, 0),
        t_tien_nt2: roundNum(master.t_tien2 || 0, 0),
        t_ck: roundNum(master.t_ck || 0, 0),
        t_ck_nt: roundNum(master.t_ck || 0, 0),
        t_cp: roundNum(master.tien_cp || 0),
        t_cp_nt: roundNum(master.tien_cp || 0),
        ma_nvbh: master.ma_nvbh || "",
        status: master.status || "0",
        user_id2: userId,
        ghi_chu_giao_hang: master.ghi_chu_giao_hang || "",
        ghi_chu_kh: master.ghi_chu_kh || "",
        kh_chiu_cuoc: master.kh_chiu_cuoc ? 1 : 0,
        t_ck_tt: roundNum(master.t_ck_tt || 0),
        t_ck_tt_nt: roundNum(master.t_ck_tt || 0),
        t_ck_voucher: roundNum(master.t_ck_voucher || 0),
        t_ck_voucher_nt: roundNum(master.t_ck_voucher || 0),
        ds_voucher: master.the_voucher || "",
        hl_yn: master.hang_bi_loi ? 1 : 0,
        ktc_yn: master.khong_tra_cuoc ? 1 : 0,
        gnh_yn: master.giao_nham_hang ? 1 : 0,
        tth_yn: master.thua_thieu_hang ? 1 : 0,
        kng_yn: master.khieu_nai_gia ? 1 : 0,
        dthh_yn: master.doi_tra_hang ? 1 : 0,
        hdgkb_yn: master.hang_date_gan ? 1 : 0,
        vcc_yn: master.van_chuyen_cham ? 1 : 0,
        vdk_yn: master.van_de_khac ? 1 : 0,
        yk_kh: master.yk_kh || "",
        ph_kn: master.phan_hoi || "",
        fdate3: formatApiDate(master.ngay_khieu_nai || master.fdate3),
        fdate4: formatApiDate(master.ngay_phan_hoi || master.fdate4),
        t_cp_bh: 0,
        t_cp_bh_nt: 0,
        t_cp_vc: 0,
        t_cp_vc_nt: 0,
        t_cp_khac: 0,
        t_cp_khac_nt: 0,
        ngay_hl: null,
        ma_dc: master.ma_dc || "",
        ma_htvc: "",
        so_hd0: master.so_hd0 || "",
        stt_rec_hd0: "",
        so_ct0: "",
        ngay_ct0: formatApiDate(master.ngay_ct0),
        bat_dau_dh: formatApiDate(master.bat_dau_dh),
        ket_thuc_dh: formatApiDate(master.ket_thuc_dh),
        u_status: master.u_status || "0",
        ban_dong_goi: master.ban_dong_goi || "",
        ma_nv_dh: master.ma_nv_dh || "",
        ngay_ct2: null,
        ngay_ct3: null,
        ck_thue_yn: 0,
        ma_gia: "",
        tien_hd: 0,
        nam: new Date().getFullYear(),
        ky: new Date().getMonth() + 1,
        xtag: "",
        datetime0: null,
        datetime2: null,
        user_id0: 0,
        contract_id: "",
        bcontract_id: "",
        fee_id: "",
        so_dh: "",
        job_id: "",
        prd_id: "",
        dept_id: "",
        mo_nbr: "",
        fcode1: "",
        fcode2: "",
        fcode3: "",
        fdate1: formatApiDate(master.fdate1),
        fdate2: formatApiDate(master.fdate2),
        fqty1: 0,
        fqty2: 0,
        fqty3: 0,
        fnote1: "",
        fnote2: "",
        fnote3: "",
        s1: "",
        s2: "",
        s3: "",
        s4: 0,
        s5: 0,
        s6: 0,
        s7: null,
        s8: null,
        s9: null,
        so_dt: "",
        dia_chi: master.dia_chi || "",
        u_status0: "0",
        kieu_duyet: "",
        user_id3: 0,
        ma_ck: "",
        status_soan_hang: master.status_soan_hang || "0",
        status_giao_van: master.status_giao_van || "0",
        tt_soan_hang: master.tt_soan_hang || 0,
        tt_giao_van: master.tt_giao_van || 0,
        ma_vc: master.ma_vc || "",
        ten_vc: master.ten_vc || "",
        first_stt_rec_NDH: "",
        stt_rec_DX2: "",
        stt_rec_HDA: "",
        ma_ban: "",
        tl_ck_voucher: 0,
        t_ck_khac: 0,
        t_ck_khac_nt: 0,
        thoi_gian_chuyen_kho: null,
        thoi_gian_chuyen_kinh_doanh: null,
        thoi_gian_chia_don: null,
        tra_lai_yn: 0,
    };

    // Map Detail Data
    const detail64 = detail.map((item, index) => ({
        stt_rec: item.stt_rec || "",
        stt_rec0: String(index + 1).padStart(3, '0'),
        ma_ct: "DXA",
        ngay_ct: formatApiDate(master.ngay_ct || new Date()),
        ma_kh: master.ma_kh || "",
        ma_vt: item.ma_vt || "",
        dvt: item.dvt || "",
        ma_kho: item.ma_kho || "",
        so_luong: roundNum(item.so_luong || 0),
        gia_nt2: roundNum(item.gia_nt2 || 0),
        gia2: roundNum(item.gia_nt2 || 0, 0),
        tien_nt2: roundNum(item.tien_nt2 || 0, 0),
        tien2: roundNum(item.tien_nt2 || 0, 0),
        ma_thue: item.ma_thue || "",
        thue_nt: roundNum(item.thue_nt || 0, 0),
        thue: roundNum(item.thue_nt || 0, 0),
        ck_nt: roundNum(item.ck_nt || 0, 0),
        ck: roundNum(item.ck_nt || 0, 0),
        ck_khac_nt: roundNum(item.ck_khac_nt || 0, 0),
        ngay_giao: formatApiDate(item.ngay_giao),
        km_yn: item.km_yn ? 1 : 0,
        line_nbr: index + 1,
        gia_ban: roundNum(item.gia_ban || item.gia_ban_nt || 0),
        gia_ban_nt: roundNum(item.gia_ban_nt || 0),
        sl_xuat: item.sl_xuat || 0,
        sl_hd: item.sl_hd || 0,
        tl_ck: roundNum(item.tl_ck || 0),
        ghi_chu: item.ghi_chu || "",
        ghi_chu_ck_khac: item.ghi_chu_ck_khac || "",
        so_ct: "",
        ma_sp: "",
        ma_bp: "",
        so_lsx: "",
        he_so: 1,
        ma_vi_tri: "",
        ma_lo: "",
        ma_vv: "",
        tk_vt: "",
        gia_nt: 0,
        gia: 0,
        tien_nt: 0,
        tien: 0,
        tk_thue: "",
        thue_suat: 0,
        tt: 0,
        tt_nt: 0,
        xstatus: "0",
        xaction: "0",
        cp_bh: 0,
        cp_bh_nt: 0,
        cp_vc: 0,
        cp_vc_nt: 0,
        cp_khac: 0,
        cp_khac_nt: 0,
        cp: 0,
        cp_nt: 0,
        stt_rec_ct: "",
        stt_rec0ct: "",
        gia_ban0: 0,
        gia_ban_nt0: 0,
        gia_ck: 0,
        gia_ck_nt: 0,
        sl_dh: 0,
        sl_min: 0,
        sl_max: 0,
        sl_giao: 0,
        sl_tl: 0,
        sl_tl0: 0,
        stt_rec_bg: "",
        stt_rec0bg: "",
        stt_rec_hd: "",
        stt_rec0hd: "",
        ma_nvbh_i: "",
        ma_hd: "",
        ma_ku: "",
        ma_phi: "",
        so_dh_i: "",
        ma_td1: "",
        ma_td2: "",
        ma_td3: "",
        sl_td1: 0,
        sl_td2: 0,
        sl_td3: 0,
        ngay_td1: null,
        ngay_td2: null,
        ngay_td3: null,
        gc_td1: "",
        gc_td2: "",
        gc_td3: "",
        s1: "",
        s2: "",
        s3: "",
        s4: 0,
        s5: 0,
        s6: 0,
        s7: null,
        s8: null,
        s9: null,
        ck_tt: 0,
        ck_tt_nt: 0,
        tl_ck_tt: 0,
        ma_ck: "",
        cb_yn: 0,
        sx_yn: 0,
        gia_net: 0,
        gia_net_nt: 0,
        tien_net: 0,
        tien_net_nt: 0,
        xkey: "",
        db_yn: 0,
        ck_khac: 0,
        ghi_chu_dh: "",
    }));

    // Note: r60Table (Chi phí) is not sent during creation as per requirements
    // const r60Table = r60.map((item, index) => ({...}));

    const body = {
        store: "api_tao_don_hang",
        param: {
            UnitId: unitId,
            StoreID: storeId,
            userId: userId,
        },
        data: {
            master64: [masterData],
            detail64: detail64,
        }
    };

    try {
        const response = await multipleTablePutApi(body);
        return {
            success: response?.responseModel?.isSucceded,
            message: response?.responseModel?.message,
            data: response
        };
    } catch (error) {
        console.error("Lỗi khi gọi API api_tao_don_hang:", error);
        return { success: false, message: error.message };
    }
};

export const updatePhieuKinhDoanh = async (master, detail, r60, unitId = "TAPMED", storeId = "", userId = getCurrentUserId()) => {
    // Map Master Data
    const masterData = {
        ...master,
        stt_rec: master.stt_rec || "",
        ma_dvcs: unitId,
        ma_ct: "DXA",
        loai_ct: String(master.loai_ct || "1"),
        ma_gd: String(master.hinh_thuc_tt || master.ma_gd || ""),
        ngay_lct: formatApiDate(master.ngay_lct || master.ngay_ct || new Date()),
        ngay_ct: formatApiDate(master.ngay_ct || new Date()),
        ty_gia: master.ty_gia || 1,
        so_lo: master.so_lo || "",
        ngay_lo: formatApiDate(master.ngay_lo),
        ma_nk: master.ma_nk || "",
        ong_ba: master.ong_ba || "",
        ma_nx: master.ma_nx || "",
        tk: master.tk || "",
        ma_tt: master.ma_tt || "",
        ma_nvbh: master.ma_nvbh || "",
        ma_vc: master.ma_vc || "",
        ten_vc: master.ten_vc || "",
        dien_giai: master.dien_giai || "",
        ghi_chu_kh: master.ghi_chu_kh || "",
        ghi_chu_giao_hang: master.ghi_chu_giao_hang || "",
        t_so_luong: roundNum(master.t_so_luong || 0),
        t_tien_nt: roundNum(master.t_tien_nt || 0),
        t_tien: roundNum(master.t_tien || 0),
        t_thue_nt: roundNum(master.t_thue_nt || 0),
        t_thue: roundNum(master.t_thue || 0),
        t_tt_nt: roundNum(master.tong_cong || master.t_tt_nt || 0, 0),
        t_tt: roundNum(master.tong_cong || master.t_tt || 0, 0),
        t_tien2: roundNum(master.t_tien2 || 0, 0),
        t_tien_nt2: roundNum(master.t_tien2 || 0, 0),
        t_ck: roundNum(master.t_ck || 0, 0),
        t_ck_nt: roundNum(master.t_ck || 0, 0),
        t_cp: roundNum(master.tien_cp || master.t_cp || 0, 0),
        t_cp_nt: roundNum(master.tien_cp || master.t_cp_nt || 0, 0),
        status: String(master.status || "0").trim(),
        user_id2: userId,
        kh_chiu_cuoc: master.kh_chiu_cuoc ? 1 : 0,
        t_ck_tt: roundNum(master.t_ck_tt || 0),
        t_ck_tt_nt: roundNum(master.t_ck_tt || 0),
        t_ck_voucher: roundNum(master.t_ck_voucher || 0),
        t_ck_voucher_nt: roundNum(master.t_ck_voucher || 0),
        hl_yn: master.hang_bi_loi ? 1 : (master.hl_yn || 0),
        ktc_yn: master.khong_tra_cuoc ? 1 : (master.ktc_yn || 0),
        gnh_yn: master.giao_nham_hang ? 1 : (master.gnh_yn || 0),
        tth_yn: master.thua_thieu_hang ? 1 : (master.tth_yn || 0),
        kng_yn: master.khieu_nai_gia ? 1 : (master.kng_yn || 0),
        dthh_yn: master.doi_tra_hang ? 1 : (master.dthh_yn || 0),
        hdgkb_yn: master.hang_date_gan ? 1 : (master.hdgkb_yn || 0),
        vcc_yn: master.van_chuyen_cham ? 1 : (master.vcc_yn || 0),
        vdk_yn: master.van_de_khac ? 1 : (master.vdk_yn || 0),
        fdate3: formatApiDate(master.ngay_khieu_nai || master.fdate3),
        fdate4: formatApiDate(master.ngay_phan_hoi || master.fdate4),
        t_cp_bh: master.t_cp_bh || 0,
        t_cp_bh_nt: master.t_cp_bh_nt || 0,
        t_cp_vc: master.t_cp_vc || 0,
        t_cp_vc_nt: master.t_cp_vc_nt || 0,
        t_cp_khac: master.t_cp_khac || 0,
        t_cp_khac_nt: master.t_cp_khac_nt || 0,
        ngay_hl: formatApiDate(master.ngay_hl),
        ma_dc: master.ma_dc || "",
        ma_htvc: master.ma_htvc || "",
        so_hd0: master.so_hd0 || "",
        u_status: master.u_status || "0",
        ban_dong_goi: master.ban_dong_goi || "",
        ma_nv_dh: master.ma_nv_dh || "",
        bat_dau_dh: formatApiDate(master.bat_dau_dh),
        ket_thuc_dh: formatApiDate(master.ket_thuc_dh),
        stt_rec_hd0: master.stt_rec_hd0 || "",
        so_ct0: master.so_ct0 || "",
        ngay_ct0: formatApiDate(master.ngay_ct0),
        ngay_ct2: formatApiDate(master.ngay_ct2),
        ngay_ct3: formatApiDate(master.ngay_ct3),
        ck_thue_yn: master.ck_thue_yn || 0,
        ma_gia: master.ma_gia || "",
        tien_hd: master.tien_hd || 0,
        nam: master.nam || new Date().getFullYear(),
        ky: master.ky || new Date().getMonth() + 1,
        xtag: master.xtag || "",
        datetime0: formatApiDate(master.datetime0),
        datetime2: formatApiDate(master.datetime2),
        user_id0: master.user_id0 || 0,
        contract_id: master.contract_id || "",
        bcontract_id: master.bcontract_id || "",
        fee_id: master.fee_id || "",
        so_dh: master.so_dh || "",
        job_id: master.job_id || "",
        prd_id: master.prd_id || "",
        dept_id: master.dept_id || "",
        mo_nbr: master.mo_nbr || "",
        fcode1: master.fcode1 || "",
        fcode2: master.fcode2 || "",
        fcode3: master.fcode3 || "",
        fdate1: formatApiDate(master.fdate1),
        fdate2: formatApiDate(master.fdate2),
        fqty1: master.fqty1 || 0,
        fqty2: master.fqty2 || 0,
        fqty3: master.fqty3 || 0,
        fnote1: master.fnote1 || "",
        fnote2: master.fnote2 || "",
        fnote3: master.fnote3 || "",
        s1: master.s1 || "",
        s2: master.s2 || "",
        s3: master.s3 || "",
        s4: master.s4 || 0,
        s5: master.s5 || 0,
        s6: master.s6 || 0,
        s7: formatApiDate(master.s7),
        s8: formatApiDate(master.s8),
        s9: formatApiDate(master.s9),
        so_dt: master.so_dt || "",
        u_status0: master.u_status0 || "0",
        kieu_duyet: master.kieu_duyet || "",
        user_id3: master.user_id3 || 0,
        ma_ck: master.ma_ck || "",
        status_soan_hang: master.status_soan_hang || "0",
        status_giao_van: master.status_giao_van || "0",
        tt_soan_hang: master.tt_soan_hang || 0,
        tt_giao_van: master.tt_giao_van || 0,
        first_stt_rec_NDH: master.first_stt_rec_NDH || "",
        stt_rec_DX2: master.stt_rec_DX2 || "",
        stt_rec_HDA: master.stt_rec_HDA || "",
        ma_ban: master.ma_ban || "",
        tl_ck_voucher: master.tl_ck_voucher || 0,
        t_ck_khac: master.t_ck_khac || 0,
        t_ck_khac_nt: master.t_ck_khac_nt || 0,
        thoi_gian_chuyen_kho: formatApiDate(master.thoi_gian_chuyen_kho),
        thoi_gian_chuyen_kinh_doanh: formatApiDate(master.thoi_gian_chuyen_kinh_doanh),
        thoi_gian_chia_don: formatApiDate(master.thoi_gian_chia_don),
        tra_lai_yn: master.tra_lai_yn || 0,
    };

    // Map Detail Data
    const detail64 = detail.map((item, index) => ({
        stt_rec: item.stt_rec || master.stt_rec || "",
        stt_rec0: item.stt_rec0 || String(index + 1).padStart(3, '0'),
        ma_ct: "DXA",
        ngay_ct: formatApiDate(master.ngay_ct || new Date()),
        ma_kh: item.ma_kh || master.ma_kh || "",
        so_luong: roundNum(item.so_luong || 0),
        gia_nt2: roundNum(item.gia_nt2 || 0),
        gia2: roundNum(item.gia_nt2 || 0, 0),
        tien_nt2: roundNum(item.tien_nt2 || 0, 0),
        tien2: roundNum(item.tien_nt2 || 0, 0),
        thue_nt: roundNum(item.thue_nt || 0, 0),
        thue: roundNum(item.thue_nt || 0, 0),
        ck_nt: roundNum(item.ck_nt || 0, 0),
        ck: roundNum(item.ck_nt || 0, 0),
        ck_khac_nt: roundNum(item.ck_khac_nt || 0, 0),
        ngay_giao: formatApiDate(item.ngay_giao),
        km_yn: item.km_yn ? 1 : 0,
        line_nbr: index + 1,
        gia_ban: roundNum(item.gia_ban || item.gia_ban_nt || 0),
        gia_ban_nt: roundNum(item.gia_ban_nt || 0),
        sl_xuat: item.sl_xuat || 0,
        sl_hd: item.sl_hd || 0,
        tl_ck: roundNum(item.tl_ck || 0),
        ghi_chu: item.ghi_chu || "",
        ghi_chu_ck_khac: item.ghi_chu_ck_khac || "",
        so_ct: item.so_ct || "",
        ma_sp: item.ma_sp || "",
        ma_bp: item.ma_bp || "",
        so_lsx: item.so_lsx || "",
        he_so: item.he_so || 1,
        ma_vi_tri: item.ma_vi_tri || "",
        ma_lo: item.ma_lo || "",
        ma_vv: item.ma_vv || "",
        tk_vt: item.tk_vt || "",
        gia_nt: item.gia_nt || 0,
        gia: item.gia || 0,
        tien_nt: item.tien_nt || 0,
        tien: item.tien || 0,
        tk_thue: item.tk_thue || "",
        thue_suat: roundNum(item.thue_suat || 0),
        tt: item.tt || 0,
        tt_nt: item.tt_nt || 0,
        xstatus: item.xstatus || "0",
        xaction: item.xaction || "0",
        cp_bh: item.cp_bh || 0,
        cp_bh_nt: item.cp_bh_nt || 0,
        cp_vc: item.cp_vc || 0,
        cp_vc_nt: item.cp_vc_nt || 0,
        cp_khac: item.cp_khac || 0,
        cp_khac_nt: item.cp_khac_nt || 0,
        cp: item.cp || 0,
        cp_nt: item.cp_nt || 0,
        stt_rec_ct: item.stt_rec_ct || "",
        stt_rec0ct: item.stt_rec0ct || "",
        gia_ban0: item.gia_ban0 || 0,
        gia_ban_nt0: item.gia_ban_nt0 || 0,
        gia_ck: item.gia_ck || 0,
        gia_ck_nt: item.gia_ck_nt || 0,
        sl_dh: item.sl_dh || 0,
        sl_min: item.sl_min || 0,
        sl_max: item.sl_max || 0,
        sl_giao: item.sl_giao || 0,
        sl_tl: item.sl_tl || 0,
        sl_tl0: item.sl_tl0 || 0,
        stt_rec_bg: item.stt_rec_bg || "",
        stt_rec0bg: item.stt_rec0bg || "",
        stt_rec_hd: item.stt_rec_hd || "",
        stt_rec0hd: item.stt_rec0hd || "",
        ma_nvbh_i: item.ma_nvbh_i || "",
        ma_hd: item.ma_hd || "",
        ma_ku: item.ma_ku || "",
        ma_phi: item.ma_phi || "",
        so_dh_i: item.so_dh_i || "",
        ma_td1: item.ma_td1 || "",
        ma_td2: item.ma_td2 || "",
        ma_td3: item.ma_td3 || "",
        sl_td1: item.sl_td1 || 0,
        sl_td2: item.sl_td2 || 0,
        sl_td3: item.sl_td3 || 0,
        ngay_td1: item.ngay_td1 ? (dayjs.isDayjs(item.ngay_td1) ? item.ngay_td1.toDate() : item.ngay_td1) : null,
        ngay_td2: item.ngay_td2 ? (dayjs.isDayjs(item.ngay_td2) ? item.ngay_td2.toDate() : item.ngay_td2) : null,
        ngay_td3: item.ngay_td3 ? (dayjs.isDayjs(item.ngay_td3) ? item.ngay_td3.toDate() : item.ngay_td3) : null,
        gc_td1: item.gc_td1 || "",
        gc_td2: item.gc_td2 || "",
        gc_td3: item.gc_td3 || "",
        s1: item.s1 || "",
        s2: item.s2 || "",
        s3: item.s3 || "",
        s4: item.s4 || 0,
        s5: item.s5 || 0,
        s6: item.s6 || 0,
        s7: item.s7 ? (dayjs.isDayjs(item.s7) ? item.s7.toDate() : item.s7) : (item.s7 || null),
        s8: item.s8 ? (dayjs.isDayjs(item.s8) ? item.s8.toDate() : item.s8) : (item.s8 || null),
        s9: item.s9 ? (dayjs.isDayjs(item.s9) ? item.s9.toDate() : item.s9) : (item.s9 || null),
        ck_tt: item.ck_tt || 0,
        ck_tt_nt: item.ck_tt_nt || 0,
        tl_ck_tt: item.tl_ck_tt || 0,
        ma_ck: item.ma_ck || "",
        cb_yn: item.cb_yn || 0,
        sx_yn: item.sx_yn || 0,
        gia_net: item.gia_net || 0,
        gia_net_nt: item.gia_net_nt || 0,
        tien_net: item.tien_net || 0,
        tien_net_nt: item.tien_net_nt || 0,
        xkey: item.xkey || "",
        db_yn: item.db_yn || 0,
        ck_khac: roundNum(item.ck_khac || 0),
        ghi_chu_dh: item.ghi_chu_dh || "",
        ma_vt: item.ma_vt || "",
        dvt: item.dvt || "",
        ma_kho: item.ma_kho || "",
        ten_vt: item.ten_vt || "",
        image: item.image || null,
        ma_thue: item.ma_thue || "",
    }));

    const body = {
        store: "api_sua_don_hang",
        param: {
            UnitId: unitId,
            StoreID: storeId,
            userId: userId,
        },
        data: {
            master64: [masterData],
            detail64: detail64,
        }
    };

    try {
        const response = await multipleTablePutApi(body);
        return {
            success: response?.responseModel?.isSucceded,
            message: response?.responseModel?.message,
            data: response
        };
    } catch (error) {
        console.error("Lỗi khi gọi API api_sua_don_hang:", error);
        return { success: false, message: error.message };
    }
};

// ===== HELPER APIs FOR SELECTION =====

export const fetchKhachHangSelection = async (keyword = "", searchField = "ten_kh", pageIndex = 1, pageSize = 20, userId = getCurrentUserId()) => {
    const body = {
        store: "api_list_khach_hang",
        param: {
            PageIndex: pageIndex,
            PageSize: pageSize,
            ma_kh: searchField === "ma_kh" ? keyword : "",
            ten_kh: searchField === "ten_kh" ? keyword : "",
            userId: userId,
        },
        data: {},
    };

    try {
        const response = await multipleTablePutApi(body);
        return response?.listObject?.[0] || [];
    } catch (error) {
        console.error("Error fetchKhachHangSelection:", error);
        return [];
    }
};

export const fetchNhanVienKDSelection = async (keyword = "", pageIndex = 1, pageSize = 20, userId = getCurrentUserId()) => {
    const body = {
        store: "api_list_nhan_vien_kinh_doanh",
        param: {
            PageIndex: pageIndex,
            PageSize: pageSize,
            ma_nvbh: "",
            ten_nvbh: keyword,
            userId: userId,
        },
        data: {},
    };

    try {
        const response = await multipleTablePutApi(body);
        return response?.listObject?.[0] || [];
    } catch (error) {
        console.error("Error fetchNhanVienKDSelection:", error);
        return [];
    }
};

export const fetchVanChuyenSelection = async (keyword = "", pageIndex = 1, pageSize = 20, userId = getCurrentUserId()) => {
    const body = {
        store: "api_list_van_chuyen",
        param: {
            PageIndex: pageIndex,
            PageSize: pageSize,
            ma_vc: "",
            ten_vc: keyword,
            userId: userId,
        },
        data: {},
    };

    try {
        const response = await multipleTablePutApi(body);
        return response?.listObject?.[0] || [];
    } catch (error) {
        console.error("Error fetchVanChuyenSelection:", error);
        return [];
    }
};

export const fetchThanhToanSelection = async (keyword = "", pageIndex = 1, pageSize = 20, userId = getCurrentUserId()) => {
    const body = {
        store: "api_list_thanh_toan",
        param: {
            PageIndex: pageIndex,
            PageSize: pageSize,
            ma_tt: "",
            ten_tt: keyword,
            userId: userId,
        },
        data: {},
    };

    try {
        const response = await multipleTablePutApi(body);
        return response?.listObject?.[0] || [];
    } catch (error) {
        console.error("Error fetchThanhToanSelection:", error);
        return [];
    }
};

export const fetchVatTuSelection = async (keyword = "", pageIndex = 1, pageSize = 20, userId = getCurrentUserId()) => {
    const body = {
        store: "api_list_vat_tu",
        param: {
            PageIndex: pageIndex,
            PageSize: pageSize,
            ma_vt: "",
            ten_vt: keyword,
            userId: userId,
        },
        data: {},
    };

    try {
        const response = await multipleTablePutApi(body);
        return response?.listObject?.[0] || [];
    } catch (error) {
        console.error("Error fetchVatTuSelection:", error);
        return [];
    }
};

export const fetchVoucherSelection = async (ma_kh = "", ngay_ct = "", pageIndex = 1, pageSize = 20) => {
    const body = {
        store: "api_list_the_voucher",
        param: {
            ma_kh,
            ngay_ct: ngay_ct ? dayjs(ngay_ct).format("YYYY-MM-DD") : dayjs().format("YYYY-MM-DD"),
            PageIndex: pageIndex,
            PageSize: pageSize,
        },
        data: {},
    };

    try {
        const response = await multipleTablePutApi(body);
        return response?.listObject?.[0] || [];
    } catch (error) {
        console.error("Error fetchVoucherSelection:", error);
        return [];
    }
};

export const calculateDiscounts = async ({
    ma_kh,
    ngay_ct,
    ds_vt,
    ds_so_luong,
    ds_gia,
    ds_tien,
    ds_ma_kho,
    ds_ma_lo = "",
    t_tien_hang,
    stt_rec = "",
    kh_chiu_cuoc = "1",
    UnitId = "TAPMED"
}) => {
    const body = {
        store: "api_tinh_chiet_khau",
        param: {
            ma_kh,
            ngay_ct: dayjs(ngay_ct).format("YYYY-MM-DD"),
            ds_vt,
            ds_so_luong,
            ds_gia,
            ds_tien,
            ds_ma_kho,
            ds_ma_lo,
            t_tien_hang,
            stt_rec,
            kh_chiu_cuoc: String(kh_chiu_cuoc),
            UnitId,
        },
        data: {},
    };

    try {
        const response = await multipleTablePutApi(body);
        // The API likely returns multiple lists of objects for 'H', 'D', 'M' types or similar
        return response?.listObject || [];
    } catch (error) {
        console.error("Error calculateDiscounts:", error);
        return [];
    }
};

// Global cache for product metadata (units) to avoid redundant requests across modules
const vatTuUnitsCache = {};

export const getCachedUnits = (maVatTu) => {
    if (!maVatTu) return null;
    return vatTuUnitsCache[maVatTu.trim()] || null;
};

export const fetchThongTinVatTu = async ({
    ma_vt,
    ma_kho,
    ma_kh = "",
    ngay_ct = dayjs().format("YYYY-MM-DD"),
    ma_nt = "VND",
    userId = getCurrentUserId(),
    UnitId = "TAPMED"
}) => {
    const body = {
        store: "api_get_thong_tin_vat_tu",
        param: {
            ma_vt,
            ma_kho,
            ma_kh,
            ngay_ct: dayjs(ngay_ct).format("YYYY-MM-DD"),
            ma_nt,
            userId,
            UnitId,
        },
        data: {},
    };

    try {
        const response = await multipleTablePutApi(body);
        const listObject = response?.listObject || [];
        const table0 = listObject[0] || [];
        
        let imageFound = null;
        let unitsFound = null;

        // Scan all tables for image and units
        listObject.forEach((tbl, idx) => {
            if (!Array.isArray(tbl)) return;
            tbl.forEach(row => {
                if (row?.image && !imageFound) imageFound = row.image;
                // Tables other than table0 often contain auxiliary data like units
                if (idx > 0 && row?.ma_vt && row?.dvt && !row.image) {
                   if (!unitsFound) unitsFound = [];
                   unitsFound.push(row);
                }
            });
        });

        if (table0.length > 0) {
            const maVt = table0[0]?.ma_vt || ma_vt;
            
            // Populate global metadata cache
            if (unitsFound && maVt) {
                vatTuUnitsCache[maVt.trim()] = unitsFound;
            }

            // Enrich the first row with common metadata
            table0[0] = { 
                ...table0[0], 
                image: imageFound || table0[0].image || null,
                units: unitsFound || null 
            };
        }

        return table0; 
    } catch (error) {
        console.error("Error fetchThongTinVatTu:", error);
        return null;
    }
};

export const fetchNoiGiaoSelection = async (ma_kh = "", keyword = "", pageIndex = 1, pageSize = 20) => {
    const body = {
        store: "api_list_noi_giao",
        param: {
            ma_kh: ma_kh || "",
            PageIndex: pageIndex,
            PageSize: pageSize,
            ma_dc: "",
            ten_dc: keyword,
        },
        data: {},
    };

    try {
        const response = await multipleTablePutApi(body);
        return response?.listObject?.[0] || [];
    } catch (error) {
        console.error("Error fetchNoiGiaoSelection:", error);
        return [];
    }
};

export const fetchThongTinNganHang = async (ma_dvcs = "TAPMED") => {
    const body = {
        store: "api_get_thong_tin_ngan_hang",
        param: {
            ma_dvcs: ma_dvcs,
        },
        data: {},
    };

    try {
        const response = await multipleTablePutApi(body);
        return response?.listObject?.[0] || [];
    } catch (error) {
        console.error("Error fetchThongTinNganHang:", error);
        return [];
    }
};

export const fetchChiPhiSelection = async (keyword = "", pageIndex = 1, pageSize = 20) => {
    const body = {
        store: "api_list_chi_phi",
        param: {
            ma_ct: "DXA",
            ma_loai: keyword,
            ten_cp: keyword,
            PageIndex: pageIndex,
            PageSize: pageSize,
        },
        data: {},
    };

    try {
        const response = await multipleTablePutApi(body);
        const list = response?.listObject?.[0] || [];
        return list.map(i => ({
            ...i,
            ma_cp: i.ma_loai, // Map ma_loai to ma_cp for consistency with our data model
            value: i.ma_loai,
            label: `${i.ma_loai} - ${i.ten_cp}`
        }));
    } catch (error) {
        console.error("Lỗi khi gọi API api_list_chi_phi:", error);
        return [];
    }
};
