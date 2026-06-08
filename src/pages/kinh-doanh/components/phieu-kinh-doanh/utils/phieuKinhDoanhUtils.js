import dayjs from "dayjs";

export const parseMaThue = (ma_thue) => {
    if (!ma_thue) return 0;
    const match = String(ma_thue).match(/(\d+)/);
    return match ? parseFloat(match[1]) : 0;
};

// Replaces calculateDetailRow to apply specific formula cascading
export const calculateRowOnChange = (row, field, value, ty_gia = 1) => {
    let updatedRow = { ...row, [field]: value };
    ty_gia = parseFloat(ty_gia || 1);

    // Variables used for computation
    // Read them freshly to ensure we operate on the updated values within the switch cases
    let so_luong = parseFloat(updatedRow.so_luong || 0);
    let gia_ban_nt = parseFloat(updatedRow.gia_ban_nt || 0);
    let gia_nt2 = parseFloat(updatedRow.gia_nt2 || 0);
    let gia2 = parseFloat(updatedRow.gia2 || 0);
    let tien_nt2 = parseFloat(updatedRow.tien_nt2 || 0);
    let tien2 = parseFloat(updatedRow.tien2 || updatedRow.tien2_tg || 0);
    let ck_nt = parseFloat(updatedRow.ck_nt || 0);
    let ck_khac_nt = parseFloat(updatedRow.ck_khac_nt || 0);
    let tl_ck = parseFloat(updatedRow.tl_ck || 0);
    let thue_nt = parseFloat(updatedRow.thue_nt || 0);
    let s4 = parseFloat(updatedRow.s4 || 0);
    const thue_suat = parseMaThue(updatedRow.ma_thue);

    const recomputeDeps = () => {
        so_luong = parseFloat(updatedRow.so_luong || 0);
        gia_ban_nt = parseFloat(updatedRow.gia_ban_nt || 0);
        gia_nt2 = parseFloat(updatedRow.gia_nt2 || 0);
        gia2 = parseFloat(updatedRow.gia2 || 0);
        tien_nt2 = parseFloat(updatedRow.tien_nt2 || 0);
        tien2 = parseFloat(updatedRow.tien2 || 0);
        ck_nt = parseFloat(updatedRow.ck_nt || 0);
        ck_khac_nt = parseFloat(updatedRow.ck_khac_nt || 0);
        tl_ck = parseFloat(updatedRow.tl_ck || 0);
        s4 = parseFloat(updatedRow.s4 || 0);

        updatedRow.thue_nt = gia_ban_nt * so_luong - s4 - tien_nt2 + ck_nt + ck_khac_nt;
        thue_nt = updatedRow.thue_nt;
    };

    switch (field) {
        case "so_luong":
            updatedRow.tien_nt2 = Math.round(so_luong * gia_nt2);
            updatedRow.tien2_tg = updatedRow.tien_nt2 * ty_gia;
            updatedRow.tien2 = updatedRow.tien2_tg;
            updatedRow.s4 = (gia_ban_nt * so_luong * tl_ck) / 100;
            updatedRow.ck_nt = Math.round((updatedRow.tien_nt2 * tl_ck) / 100);
            updatedRow.ck = Math.round(updatedRow.ck_nt * ty_gia);
            recomputeDeps();
            updatedRow.thue = Math.round(updatedRow.thue_nt * ty_gia);
            break;

        case "gia_ban_nt":
            updatedRow.gia_ban = Math.round(gia_ban_nt * ty_gia);
            updatedRow.gia_nt2_from_tax = gia_ban_nt / (1 + thue_suat / 100);
            updatedRow.gia2_from_tax = gia_nt2 * ty_gia;
            updatedRow.tien_nt2 = Math.round(so_luong * gia_nt2);
            updatedRow.tien2_tg = updatedRow.tien_nt2 * ty_gia;
            updatedRow.tien2 = updatedRow.tien2_tg;
            updatedRow.s4 = (gia_ban_nt * so_luong * tl_ck) / 100;
            updatedRow.ck_nt = Math.round((updatedRow.tien_nt2 * tl_ck) / 100);
            updatedRow.ck = Math.round(updatedRow.ck_nt * ty_gia);
            recomputeDeps();
            updatedRow.thue = Math.round(updatedRow.thue_nt * ty_gia);
            break;

        case "gia_nt2":
            updatedRow.gia2 = Math.round(gia_nt2 * ty_gia);
            updatedRow.tien_nt2 = Math.round(so_luong * gia_nt2);
            updatedRow.tien2_tg = updatedRow.tien_nt2 * ty_gia;
            updatedRow.tien2 = updatedRow.tien2_tg;
            updatedRow.s4 = (gia_ban_nt * so_luong * tl_ck) / 100;
            updatedRow.ck_nt = Math.round((updatedRow.tien_nt2 * tl_ck) / 100);
            updatedRow.ck = Math.round(updatedRow.ck_nt * ty_gia);
            recomputeDeps();
            updatedRow.thue = Math.round(updatedRow.thue_nt * ty_gia);
            break;

        case "gia2":
            updatedRow.tien2_sl = so_luong * gia2;
            updatedRow.tien2 = updatedRow.tien2_sl;
            recomputeDeps();
            updatedRow.thue = Math.round(thue_nt * ty_gia);
            break;

        case "tien_nt2":
            updatedRow.tien2_tg = tien_nt2 * ty_gia;
            updatedRow.tien2 = updatedRow.tien2_tg;
            recomputeDeps();
            updatedRow.thue = Math.round(updatedRow.thue_nt * ty_gia);
            break;

        case "tien2":
            updatedRow.thue = Math.round(thue_nt * ty_gia);
            break;

        case "ck_nt":
            updatedRow.ck = Math.round(ck_nt * ty_gia);
            updatedRow.s4 = (gia_ban_nt * so_luong * tl_ck) / 100;
            recomputeDeps();
            updatedRow.thue = Math.round(updatedRow.thue_nt * ty_gia);
            break;

        case "s4":
            updatedRow.ck_nt = Math.round((tien_nt2 * tl_ck) / 100);
            updatedRow.ck_tl = (tien2 * tl_ck) / 100;
            recomputeDeps();
            updatedRow.thue = Math.round(updatedRow.thue_nt * ty_gia);
            break;

        case "ck_khac_nt":
            updatedRow.ck_khac = Math.round(ck_khac_nt * ty_gia);
            recomputeDeps();
            updatedRow.thue = Math.round(updatedRow.thue_nt * ty_gia);
            break;

        case "ck":
        case "ck_khac":
        case "thue_nt":
            updatedRow.thue = Math.round(thue_nt * ty_gia);
            break;

        case "thue":
            break;

        case "tl_ck":
            updatedRow.ck_nt = Math.round((tien_nt2 * tl_ck) / 100);
            updatedRow.ck_tl = (tien2 * tl_ck) / 100;
            updatedRow.s4 = (gia_ban_nt * so_luong * tl_ck) / 100;
            recomputeDeps();
            updatedRow.thue = Math.round(updatedRow.thue_nt * ty_gia);
            break;

        case "ma_thue":
            updatedRow.gia_nt2_from_tax = gia_ban_nt / (1 + thue_suat / 100);
            updatedRow.gia2_from_tax = gia_nt2 * ty_gia;
            updatedRow.tien_nt2 = Math.round(so_luong * gia_nt2);
            updatedRow.tien2_sl = so_luong * gia2;
            updatedRow.tien2_tg = updatedRow.tien_nt2 * ty_gia;
            updatedRow.tien2 = updatedRow.tien2_tg;
            recomputeDeps();
            updatedRow.thue = Math.round(updatedRow.thue_nt * ty_gia);
            break;

        case "km_yn": {
            const isKM = parseInt(value) === 1;
            if (isKM) {
                updatedRow.gia_ban_nt_old = parseFloat(row.gia_ban_nt || 0);
                updatedRow.gia_nt2_old = parseFloat(row.gia_nt2 || 0);

                updatedRow.gia_ban_nt = 0;
                updatedRow.gia_ban = 0;
                updatedRow.gia_nt2 = 0;
                updatedRow.gia2 = 0;
                updatedRow.tien_nt2 = 0;
                updatedRow.tien2 = 0;
                updatedRow.tien2_tg = 0;
                updatedRow.tl_ck = 0;
                updatedRow.ck_nt = 0;
                updatedRow.ck = 0;
                updatedRow.s4 = 0;
                updatedRow.thue_nt = 0;
                updatedRow.thue = 0;
            } else {
                const restoredGiaBanNt = parseFloat(updatedRow.gia_ban_nt_old || 0);
                const restoredGiaNt2 = parseFloat(updatedRow.gia_nt2_old || 0);

                updatedRow.gia_ban_nt = restoredGiaBanNt;
                updatedRow.gia_nt2 = restoredGiaNt2;

                return calculateRowOnChange(updatedRow, "gia_nt2", restoredGiaNt2, ty_gia);
            }
            break;
        }

        default:
            break;
    }

    return updatedRow;
};

export const calculateMasterTotals = (details, chiPhi, headerValues) => {
    const ty_gia = parseFloat(headerValues.ty_gia || 1);

    let t_so_luong = 0;
    let t_tien_nt2 = 0;
    let t_tien2 = 0;
    let t_ck_nt = 0;
    let t_ck = 0;
    let t_thue_nt = 0;
    let t_thue = 0;

    details.forEach((row) => {
        const km_yn = parseInt(row.km_yn || 0);

        t_so_luong += parseFloat(row.so_luong || 0);
        t_tien_nt2 += parseFloat(row.tien_nt2 || 0);
        t_tien2 += parseFloat(row.tien2 || row.tien2_tg || 0);
        t_thue_nt += parseFloat(row.thue_nt || 0);
        t_thue += parseFloat(row.thue || 0);

        if (km_yn === 0) {
            t_ck_nt += parseFloat(row.ck_nt || 0) + parseFloat(row.ck_khac_nt || 0);
            t_ck += parseFloat(row.ck || 0) + parseFloat(row.ck_khac || 0);
        }
    });

    const t_cp_nt = chiPhi.reduce((sum, item) => sum + parseFloat(item.tien_cp_nt || 0), 0);
    const t_cp = chiPhi.reduce(
        (sum, item) => sum + parseFloat(item.tien_cp || (item.tien_cp_nt || 0) * ty_gia || 0),
        0
    );

    const t_ck_voucher_nt = parseFloat(headerValues.t_ck_voucher_nt || headerValues.t_ck_voucher || 0);
    const t_ck_voucher = parseFloat(
        headerValues.t_ck_voucher || (t_ck_voucher_nt || 0) * ty_gia || 0
    );
    const t_ck_tt_nt = parseFloat(headerValues.t_ck_tt_nt || headerValues.t_ck_tt || 0);
    const t_ck_tt = parseFloat(headerValues.t_ck_tt || (t_ck_tt_nt || 0) * ty_gia || 0);

    const t_tt_nt = t_tien_nt2 - t_ck_nt - t_ck_voucher_nt - t_ck_tt_nt + t_thue_nt + t_cp_nt;
    const t_tt = t_tien2 - t_ck - t_ck_voucher - t_ck_tt + t_thue + t_cp;

    return {
        t_so_luong: Math.round(t_so_luong),
        t_tien_nt2: Math.round(t_tien_nt2),
        t_tien2: Math.round(t_tien2),
        t_ck_nt: Math.round(t_ck_nt),
        t_ck: Math.round(t_ck),
        t_thue_nt: Math.round(t_thue_nt),
        t_thue: Math.round(t_thue),
        t_cp_nt: Math.round(t_cp_nt),
        t_cp: Math.round(t_cp),
        t_tt_nt: Math.round(t_tt_nt),
        t_tt: Math.round(t_tt),
    };
};

// --- Validation helpers for inline field errors ---

const HEADER_FIELD_MAP = {
    "Mã giao dịch hoặc xử lý không đúng.": "hinh_thuc_tt",
    "Lệch tổng tiền Master": "tong_cong",
};

const DETAIL_ROW_FIELD_MAP = [
    [/Ghi chú chiết khấu khác/i, "ghi_chu_ck_khac"],
    [/Ngày giao.*ngày lập/i, "ngay_giao"],
    [/Thông tin mã khách/i, "ma_kh"],
    [/Hàng khuyến mại mà có giá trị/i, "tien_nt2"],
    [/Lệch tiền hàng dòng thường/i, "gia_nt2"],
];

function extractRowLine(errStr) {
    const match = String(errStr).match(/Dòng\s*(\d+)/i);
    return match ? parseInt(match[1], 10) - 1 : -1;
}

function matchDetailField(errStr) {
    for (const [re, field] of DETAIL_ROW_FIELD_MAP) {
        if (re.test(errStr)) return field;
    }
    return null;
}

// Returns: { errors: string[], fieldErrors: { [fieldName]: string }, rowFieldErrors: Map<rowIndex, Map<fieldName, string>> }
export const validateKinhDoanh = (header, details, chiPhi) => {
    const loai_ct = parseInt(header.loai_ct || 0);
    const status = parseInt(header.status || 0);
    const ngay_ct = header.ngay_ct;
    const errors = [];
    const fieldErrors = {};
    const rowFieldErrors = new Map();

    // 1) loai_ct = 3 && status = 2
    if (loai_ct === 3 && status === 2) {
        const err = "Mã giao dịch hoặc xử lý không đúng.";
        errors.push(err);
        fieldErrors.hinh_thuc_tt = err;
    }

    // 2) Tổng tiền master
    const hd_t_tien_nt2 = parseFloat(header.t_tien2 || header.t_tien_nt2 || 0);
    const hd_t_thue_nt = parseFloat(header.t_thue_nt || 0);
    const hd_t_ck_nt = parseFloat(header.t_ck || header.t_ck_nt || 0);
    const hd_t_ck_tt_nt = parseFloat(header.t_ck_tt || header.t_ck_tt_nt || 0);
    const hd_t_ck_voucher_nt = parseFloat(header.t_ck_voucher || header.t_ck_voucher_nt || 0);
    const hd_t_cp_nt = parseFloat(header.tien_cp || 0);
    const hd_t_tt_nt = parseFloat(header.tong_cong || 0);
    const calculated = hd_t_tien_nt2 - hd_t_ck_nt - hd_t_ck_voucher_nt - hd_t_ck_tt_nt + hd_t_thue_nt + hd_t_cp_nt;

    if (Math.abs(calculated - hd_t_tt_nt) > 2) {
        const err = "Có lỗi từ hệ thống. (Lệch tổng tiền Master)";
        errors.push(err);
        fieldErrors.tong_cong = err;
    }

    details.forEach((row, index) => {
        const line = index + 1;

        // 3) Ghi chú chiết khấu khác
        if (parseFloat(row.ck_khac_nt || 0) > 0 && !(row.ghi_chu_ck_khac || "").trim()) {
            const err = `Dòng ${line}: Ghi chú chiết khấu khác không được để trống!!`;
            errors.push(err);
            if (!rowFieldErrors.has(index)) rowFieldErrors.set(index, new Map());
            rowFieldErrors.get(index).set("ghi_chu_ck_khac", err);
        }

        // 4) Ngày giao
        const row_ngay_giao = row.ngay_giao || row.ngay_gh || row.ngay_ct0 || row.fdate1;
        if (row_ngay_giao && ngay_ct) {
            const d_giao = dayjs(row_ngay_giao).startOf("day");
            const d_ct = dayjs(ngay_ct).startOf("day");
            const isZeroDate = d_giao.year() <= 1900 || d_giao.year() === 1;
            if (d_giao.isValid() && d_ct.isValid() && !isZeroDate) {
                if (loai_ct === 3) {
                    if (d_giao.isAfter(d_ct)) {
                        const err = `(Dòng ${line}): Ngày giao (${d_giao.format("DD/MM/YYYY")}) phải ≤ ngày lập (${d_ct.format("DD/MM/YYYY")}) khi loai_ct=3.`;
                        errors.push(err);
                        if (!rowFieldErrors.has(index)) rowFieldErrors.set(index, new Map());
                        rowFieldErrors.get(index).set("ngay_giao", err);
                    }
                } else {
                    if (d_giao.isBefore(d_ct)) {
                        const err = `(Dòng ${line}): Ngày giao (${d_giao.format("DD/MM/YYYY")}) phải ≥ ngày lập (${d_ct.format("DD/MM/YYYY")}) khi loai_ct!=3.`;
                        errors.push(err);
                        if (!rowFieldErrors.has(index)) rowFieldErrors.set(index, new Map());
                        rowFieldErrors.get(index).set("ngay_giao", err);
                    }
                }
            }
        }

        // 5) Khách hàng đồng nhất
        if (row.stt_rec_hd || row.stt_rec_bg) {
            if (row.ma_kh && header.ma_kh && row.ma_kh !== header.ma_kh) {
                const err = `(Dòng ${line}): Thông tin mã khách của đơn hàng phải giống với giấy báo giá hoặc hợp đồng.`;
                errors.push(err);
                if (!rowFieldErrors.has(index)) rowFieldErrors.set(index, new Map());
                rowFieldErrors.get(index).set("ma_kh", err);
            }
        }

        // 8) Hàng khuyến mại có giá trị
        if (parseInt(row.km_yn || 0) === 1) {
            const value = parseFloat(row.tien_nt2 || 0) + parseFloat(row.thue_nt || 0) + parseFloat(row.ck_nt || 0);
            if (Math.abs(value) > 0.01) {
                const err = `(Dòng ${line}): Dữ liệu trong chi tiết có hàng khuyến mại mà có giá trị.`;
                errors.push(err);
                if (!rowFieldErrors.has(index)) rowFieldErrors.set(index, new Map());
                rowFieldErrors.get(index).set("tien_nt2", err);
            }
        }

        // 9) Lệch tiền hàng dòng thường
        if (parseInt(row.km_yn || 0) === 0) {
            const check_tien_nt2 = parseFloat(row.tien_nt2 || 0);
            const check_gia_nt2 = parseFloat(row.gia_nt2 || 0);
            const check_so_luong = parseFloat(row.so_luong || 0);
            const diff = Math.abs(check_tien_nt2 - check_gia_nt2 * check_so_luong);
            if (diff > 100) {
                const err = `(Dòng ${line}): Có lỗi từ hệ thống. (Lệch tiền hàng dòng thường)`;
                errors.push(err);
                if (!rowFieldErrors.has(index)) rowFieldErrors.set(index, new Map());
                rowFieldErrors.get(index).set("gia_nt2", err);
            }
        }
    });

    // 6) Nhiều hợp đồng
    const distinctHd = [...new Set(details.map((r) => r.stt_rec_hd).filter(Boolean))];
    if (distinctHd.length > 1) {
        errors.push("Dữ liệu trong chi tiết không được lấy từ nhiều hợp đồng.");
    }

    // 7) Báo giá + hợp đồng
    const countHdDetail = details.filter((r) => r.stt_rec_hd).length;
    const countBgDetail = details.filter((r) => r.stt_rec_bg).length;
    if (countHdDetail > 0 && countBgDetail > 0) {
        errors.push("Dữ liệu trong chi tiết chỉ được lấy số liệu từ giấy báo giá hoặc hợp đồng.");
    }

    return { errors, fieldErrors, rowFieldErrors };
};
