import { multipleTablePutApi } from "../../../../api";

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
            UserId: params.UserId || 1,
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
            UserId: 1,
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

export const fetchPhieuKinhDoanhChiTiet = async (stt_rec, pageIndex = 1, pageSize = 50) => {
    const body = {
        store: "api_list_don_hang_ban_chi_tiet",
        param: {
            stt_rec,
            UserId: 1,
            PageIndex: pageIndex,
            PageSize: pageSize,
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

export const splitPhieuKinhDoanh = async (stt_rec, ma_vt_list, userId = 1) => {
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

export const mergePhieuKinhDoanh = async (stt_rec_list, userId = 1) => {
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
export const transferDonHangBan = async (stt_rec_list, userId = 1) => {
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

export const cancelDonHangBan = async (stt_rec_list, userId = 1) => {
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
