import dayjs from "dayjs";

export const parseMaThue = (ma_thue) => {
    if (!ma_thue) return 0;
    const match = String(ma_thue).match(/(\d+)/);
    return match ? parseFloat(match[1]) : 0;
};

// Replaces calculateDetailRow to apply specific formula cascading
export const calculateRowOnChange = (row, field, value, ty_gia = 1) => {
    const updatedRow = { ...row, [field]: value };
    
    // Convert all dependent variables to number before calculation
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
        thue_nt = parseFloat(updatedRow.thue_nt || 0);
        s4 = parseFloat(updatedRow.s4 || 0);
    };

    switch (field) {
        case 'so_luong':
            updatedRow.tien_nt2 = so_luong * gia_nt2;
            updatedRow.tien2_tg = updatedRow.tien_nt2 * ty_gia;
            updatedRow.tien2 = updatedRow.tien2_tg; // tien2 is derived heavily from tien2_tg usually
            updatedRow.s4 = gia_ban_nt * so_luong * tl_ck / 100;
            updatedRow.ck_nt = updatedRow.tien_nt2 * tl_ck / 100;
            updatedRow.ck = updatedRow.ck_nt * ty_gia;
            recomputeDeps();
            updatedRow.thue_nt = Math.round((tien_nt2 - ck_nt - ck_khac_nt) * thue_suat / 100);
            updatedRow.thue = updatedRow.thue_nt * ty_gia;
            break;

        case 'gia_ban_nt':
            updatedRow.gia_ban = gia_ban_nt * ty_gia;
            updatedRow.gia_nt2_from_tax = gia_ban_nt / (1 + thue_suat / 100);
            updatedRow.gia2_from_tax = gia_nt2 * ty_gia;
            updatedRow.tien_nt2 = so_luong * gia_nt2;
            updatedRow.tien2_tg = updatedRow.tien_nt2 * ty_gia;
            updatedRow.tien2 = updatedRow.tien2_tg;
            updatedRow.s4 = gia_ban_nt * so_luong * tl_ck / 100;
            updatedRow.ck_nt = updatedRow.tien_nt2 * tl_ck / 100;
            updatedRow.ck = updatedRow.ck_nt * ty_gia;
            recomputeDeps();
            updatedRow.thue_nt = Math.round((tien_nt2 - ck_nt - ck_khac_nt) * thue_suat / 100);
            updatedRow.thue = updatedRow.thue_nt * ty_gia;
            break;

        case 'gia_nt2':
            updatedRow.gia2 = gia_nt2 * ty_gia;
            updatedRow.tien_nt2 = so_luong * gia_nt2;
            updatedRow.tien2_tg = updatedRow.tien_nt2 * ty_gia;
            updatedRow.tien2 = updatedRow.tien2_tg;
            updatedRow.s4 = gia_ban_nt * so_luong * tl_ck / 100; // Not strictly dependent on gia_nt2 but in formulas
            updatedRow.ck_nt = updatedRow.tien_nt2 * tl_ck / 100;
            updatedRow.ck = updatedRow.ck_nt * ty_gia;
            recomputeDeps();
            updatedRow.thue_nt = Math.round((tien_nt2 - ck_nt - ck_khac_nt) * thue_suat / 100);
            updatedRow.thue = updatedRow.thue_nt * ty_gia;
            break;

        case 'gia2':
            updatedRow.tien2_sl = so_luong * gia2;
            updatedRow.tien2 = updatedRow.tien2_sl; // Map tien2 logic
            recomputeDeps();
            updatedRow.thue = thue_nt * ty_gia;
            break;

        case 'tien_nt2':
            updatedRow.tien2_tg = tien_nt2 * ty_gia;
            updatedRow.tien2 = updatedRow.tien2_tg;
            recomputeDeps();
            updatedRow.thue_nt = Math.round((tien_nt2 - ck_nt - ck_khac_nt) * thue_suat / 100);
            updatedRow.thue = updatedRow.thue_nt * ty_gia;
            break;

        case 'tien2':
            // According to spec, just thue
            updatedRow.thue = thue_nt * ty_gia;
            break;

        case 'ck_nt':
            updatedRow.ck = ck_nt * ty_gia;
            updatedRow.s4 = gia_ban_nt * so_luong * tl_ck / 100;
            recomputeDeps();
            updatedRow.thue_nt = Math.round((tien_nt2 - ck_nt - ck_khac_nt) * thue_suat / 100);
            updatedRow.thue = updatedRow.thue_nt * ty_gia;
            break;

        case 's4':
            updatedRow.ck_nt = tien_nt2 * tl_ck / 100;
            updatedRow.ck_tl = tien2 * tl_ck / 100;
            recomputeDeps();
            updatedRow.thue_nt = Math.round((tien_nt2 - ck_nt - ck_khac_nt) * thue_suat / 100);
            updatedRow.thue = updatedRow.thue_nt * ty_gia;
            break;

        case 'ck_khac_nt':
            updatedRow.ck_khac = ck_khac_nt * ty_gia;
            recomputeDeps();
            updatedRow.thue_nt = Math.round((tien_nt2 - ck_nt - ck_khac_nt) * thue_suat / 100);
            updatedRow.thue = updatedRow.thue_nt * ty_gia;
            break;

        case 'ck':
        case 'ck_khac':
        case 'thue_nt':
            updatedRow.thue = thue_nt * ty_gia; // Technically ck/ck_khac just updates thue, thue_nt updates thue
            break;

        case 'thue':
            // Master explicitly listens
            break;

        case 'tl_ck':
            updatedRow.ck_nt = tien_nt2 * tl_ck / 100;
            updatedRow.ck_tl = tien2 * tl_ck / 100;
            updatedRow.s4 = gia_ban_nt * so_luong * tl_ck / 100;
            recomputeDeps();
            updatedRow.thue_nt = Math.round((tien_nt2 - ck_nt - ck_khac_nt) * thue_suat / 100);
            updatedRow.thue = updatedRow.thue_nt * ty_gia;
            break;

        case 'ma_thue':
            updatedRow.gia_nt2_from_tax = gia_ban_nt / (1 + thue_suat / 100);
            updatedRow.gia2_from_tax = gia_nt2 * ty_gia;
            updatedRow.tien_nt2 = so_luong * gia_nt2;
            updatedRow.tien2_sl = so_luong * gia2;
            updatedRow.tien2_tg = updatedRow.tien_nt2 * ty_gia;
            updatedRow.tien2 = updatedRow.tien2_tg; // Tie to tien2
            recomputeDeps();
            updatedRow.thue_nt = Math.round((tien_nt2 - ck_nt - ck_khac_nt) * thue_suat / 100);
            updatedRow.thue = updatedRow.thue_nt * ty_gia;
            break;

        case 'km_yn': {
            const isKM = parseInt(value) === 1;
            if (isKM) {
                // Save current prices to backup fields before zeroing out
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
                // Restore original prices
                const restoredGiaBanNt = parseFloat(updatedRow.gia_ban_nt_old || 0);
                const restoredGiaNt2 = parseFloat(updatedRow.gia_nt2_old || 0);
                
                updatedRow.gia_ban_nt = restoredGiaBanNt;
                updatedRow.gia_nt2 = restoredGiaNt2;
                
                // Trigger full recalculation as if gia_nt2 was just manually entered
                return calculateRowOnChange(updatedRow, 'gia_nt2', restoredGiaNt2, ty_gia);
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

    details.forEach(row => {
        const km_yn = parseInt(row.km_yn || 0);
        
        t_so_luong += parseFloat(row.so_luong || 0);
        t_tien_nt2 += parseFloat(row.tien_nt2 || 0);
        t_tien2 += parseFloat(row.tien2 || row.tien2_tg || 0); // Explicitly sum tien2
        t_thue_nt += parseFloat(row.thue_nt || 0);
        t_thue += parseFloat(row.thue || 0);

        if (km_yn === 0) {
            t_ck_nt += parseFloat(row.ck_nt || 0) + parseFloat(row.ck_khac_nt || 0);
            t_ck += parseFloat(row.ck || 0) + parseFloat(row.ck_khac || 0);
        }
    });

    // Cost (Chi phi)
    const t_cp_nt = chiPhi.reduce((sum, item) => sum + parseFloat(item.tien_cp_nt || 0), 0);
    const t_cp = chiPhi.reduce((sum, item) => sum + parseFloat(item.tien_cp || item.tien_cp_nt * ty_gia || 0), 0);

    // Other discounts - check for both *_nt and the form field names used in the UI
    const t_ck_voucher_nt = parseFloat(headerValues.t_ck_voucher_nt || headerValues.t_ck_voucher || 0);
    const t_ck_voucher = parseFloat(headerValues.t_ck_voucher || t_ck_voucher_nt * ty_gia || 0);
    const t_ck_tt_nt = parseFloat(headerValues.t_ck_tt_nt || headerValues.t_ck_tt || 0);
    const t_ck_tt = parseFloat(headerValues.t_ck_tt || t_ck_tt_nt * ty_gia || 0);

    // Total Amount
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
        t_tt: Math.round(t_tt)
    };
};

export const validateKinhDoanh = (header, details, chiPhi) => {
    const loai_ct = parseInt(header.loai_ct || 0);
    const status = parseInt(header.status || 0);
    const ngay_ct = header.ngay_ct;
    const errors = [];

    // 1) Điều kiện lỗi: loai_ct = 3 và status = 2
    if (loai_ct === 3 && status === 2) {
        errors.push("Mã giao dịch hoặc xử lý không đúng.");
    }

    // 2) Check tổng tiền master khớp công thức
    const hd_t_tien_nt2 = parseFloat(header.t_tien2 || header.t_tien_nt2 || 0);
    const hd_t_thue_nt = parseFloat(header.t_thue_nt || 0);
    const hd_t_ck_nt = parseFloat(header.t_ck || header.t_ck_nt || 0);
    const hd_t_ck_tt_nt = parseFloat(header.t_ck_tt || header.t_ck_tt_nt || 0);
    const hd_t_ck_voucher_nt = parseFloat(header.t_ck_voucher || header.t_ck_voucher_nt || 0);
    const hd_t_cp_nt = parseFloat(header.tien_cp || 0);
    const hd_t_tt_nt = parseFloat(header.tong_cong || 0);
    
    // Formula: t_tien_nt2 - t_ck_nt - t_ck_voucher_nt - t_ck_tt_nt + t_thue_nt + t_cp_nt
    const calculated_t_tt_nt = hd_t_tien_nt2 - hd_t_ck_nt - hd_t_ck_voucher_nt - hd_t_ck_tt_nt + hd_t_thue_nt + hd_t_cp_nt;
    
    if (Math.abs(calculated_t_tt_nt - hd_t_tt_nt) > 2) { // Increase margin slightly for rounding variants
         errors.push("Có lỗi từ hệ thống. (Lệch tổng tiền Master)");
    }

    details.forEach((row, index) => {
        const line = index + 1;
        
        // 3) Check ghi chú chiết khấu khác
        if (parseFloat(row.ck_khac_nt || 0) > 0 && !(row.ghi_chu_ck_khac || "").trim()) {
            errors.push(`Dòng ${line}: Ghi chú chiết khấu khác không được để trống!!`);
        }

        // 4) Check ngày giao hàng so với ngày lập
        const row_ngay_giao = row.ngay_giao || row.ngay_gh || row.ngay_ct0 || row.fdate1;
        if (row_ngay_giao && ngay_ct) {
            const d_giao = dayjs(row_ngay_giao).startOf('day');
            const d_ct = dayjs(ngay_ct).startOf('day');

            // Skip validation if date is a "zero" date (common in some databases) or invalid
            const isZeroDate = d_giao.year() <= 1900 || d_giao.year() === 1;

            if (d_giao.isValid() && d_ct.isValid() && !isZeroDate) {
                if (loai_ct === 3) {
                    if (d_giao.isAfter(d_ct)) {
                        errors.push(`(Dòng ${line}): Ngày giao (${d_giao.format("DD/MM/YYYY")}) phải ≤ ngày lập (${d_ct.format("DD/MM/YYYY")}) khi loai_ct=3.`);
                    }
                } else {
                    if (d_giao.isBefore(d_ct)) {
                        errors.push(`(Dòng ${line}): Ngày giao (${d_giao.format("DD/MM/YYYY")}) phải ≥ ngày lập (${d_ct.format("DD/MM/YYYY")}) khi loai_ct!=3.`);
                    }
                }
            }
        }

        // 5) Check khách hàng đồng nhất
        if (row.stt_rec_hd || row.stt_rec_bg) {
            // Note: DB mapping usually has ma_kh. 
            // In case it's on details, if it differs from header.ma_kh -> Error e4
            if (row.ma_kh && header.ma_kh && row.ma_kh !== header.ma_kh) {
                errors.push(`(Dòng ${line}): Thông tin mã khách của đơn hàng phải giống với giấy báo giá hoặc hợp đồng.`);
            }
        }

        // 8) Check hàng khuyến mại có giá trị
        if (parseInt(row.km_yn || 0) === 1) {
            const value = parseFloat(row.tien_nt2 || 0) + parseFloat(row.thue_nt || 0) + parseFloat(row.ck_nt || 0);
            if (Math.abs(value) > 0.01) { // practically > 0
                errors.push(`(Dòng ${line}): Dữ liệu trong chi tiết có hàng khuyến mại mà có giá trị.`);
            }
        }

        // 9) Check lệch tiền hàng dòng thường
        if (parseInt(row.km_yn || 0) === 0) {
            const check_tien_nt2 = parseFloat(row.tien_nt2 || 0);
            const check_gia_nt2 = parseFloat(row.gia_nt2 || 0);
            const check_so_luong = parseFloat(row.so_luong || 0);
            const diff = Math.abs(check_tien_nt2 - (check_gia_nt2 * check_so_luong));
            if (diff > 100) {
                errors.push(`(Dòng ${line}): Có lỗi từ hệ thống. (Lệch tiền hàng dòng thường)`);
            }
        }
    });

    // 6) Check chi tiết lấy từ nhiều hợp đồng khác nhau
    const distinctHd = [...new Set(details.map(r => r.stt_rec_hd).filter(Boolean))];
    if (distinctHd.length > 1) {
        errors.push("Dữ liệu trong chi tiết không được lấy từ nhiều hợp đồng.");
    }

    // 7) Check chi tiết vừa lấy từ báo giá vừa từ hợp đồng
    const countHdDetail = details.filter(r => r.stt_rec_hd).length;
    const countBgDetail = details.filter(r => r.stt_rec_bg).length;
    // Condition: n1 + n2 > 1 AND has both
    if (countHdDetail > 0 && countBgDetail > 0) {
        errors.push("Dữ liệu trong chi tiết chỉ được lấy số liệu từ giấy báo giá hoặc hợp đồng.");
    }

    return errors;
};
