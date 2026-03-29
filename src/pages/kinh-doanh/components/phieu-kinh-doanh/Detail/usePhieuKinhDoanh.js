import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Form, message } from 'antd';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import dayjs from 'dayjs';
import _ from 'lodash';
import {
    fetchPhieuKinhDoanhDetail,
    fetchPhieuKinhDoanhChiTiet,
    createPhieuKinhDoanh,
    updatePhieuKinhDoanh,
    fetchKhachHangSelection,
    fetchNhanVienKDSelection,
    fetchThanhToanSelection,
    fetchVatTuSelection,
    fetchThongTinVatTu,
    fetchVanChuyenSelection,
    fetchVoucherSelection,
    calculateDiscounts,
    fetchNoiGiaoSelection,
    fetchThongTinNganHang
} from '../phieuKinhDoanhApi';
import showConfirm from '../../../../../components/common/Modal/ModalConfirm';
import { calculateRowOnChange, calculateMasterTotals, validateKinhDoanh } from '../utils/phieuKinhDoanhUtils';
import notificationManager from '../../../../../utils/notificationManager';
import { ALL_STATUSES } from './constants';

export const usePhieuKinhDoanh = (initialEditMode = false) => {
    const [form] = Form.useForm();
    const navigate = useNavigate();
    const { stt_rec } = useParams();
    const location = useLocation();
    
    const watchSoCt = Form.useWatch('so_ct', form);
    const watchBContractId = Form.useWatch('bcontract_id', form);
    const watchNgayCt = Form.useWatch('ngay_ct', form);
    const watchStatus = Form.useWatch('status', form);
    const watchTenKh = Form.useWatch('ten_kh', form);
    const watchMaKh = Form.useWatch('ma_kh', form);
    const [originalHeader, setOriginalHeader] = useState({});
    
    const watchStatusSoanHang = Form.useWatch('status_soan_hang', form) || originalHeader?.status_soan_hang;

    const [isEditMode, setIsEditMode] = useState(
        initialEditMode || location.pathname.includes("/edit/") || !stt_rec
    );
    const [loading, setLoading] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [showGeneralInfo, setShowGeneralInfo] = useState(true);
    const [tinhCKLoading, setTinhCKLoading] = useState(false);
    const [discountModalVisible, setDiscountModalVisible] = useState(false);
    const [discountItemsSelection, setDiscountItemsSelection] = useState([]);
    const [discountResults, setDiscountResults] = useState([]);
    const [selectedDiscountResultsKeys, setSelectedDiscountResultsKeys] = useState([]);
    const [discountModalStage, setDiscountModalStage] = useState('selection');
    const [discountSearchText, setDiscountSearchText] = useState('');
    const [printModalVisible, setPrintModalVisible] = useState(false);

    const toggleGeneralInfo = () => setShowGeneralInfo(!showGeneralInfo);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const [statusList, setStatusList] = useState(ALL_STATUSES);
    const [chiTietData, setChiTietData] = useState([]);
    const [chiPhiData, setChiPhiData] = useState([]);
    const [anhWebData, setAnhWebData] = useState([]);
    const [bankInfo, setBankInfo] = useState([]);

    const [khSelectOptions, setKhSelectOptions] = useState([]);
    const [nvSelectOptions, setNvSelectOptions] = useState([]);
    const [ttSelectOptions, setTtSelectOptions] = useState([]);
    const [vcSelectOptions, setVcSelectOptions] = useState([]);
    const [voucherSelectOptions, setVoucherSelectOptions] = useState([]);
    const [noiGiaoSelectOptions, setNoiGiaoSelectOptions] = useState([]);
    
    const [khSearchLoading, setKhSearchLoading] = useState(false);
    const [nvSearchLoading, setNvSearchLoading] = useState(false);
    const [ttSearchLoading, setTtSearchLoading] = useState(false);
    const [vcSearchLoading, setVcSearchLoading] = useState(false);
    const [voucherSearchLoading, setVoucherSearchLoading] = useState(false);
    const [noiGiaoSearchLoading, setNoiGiaoSearchLoading] = useState(false);
    const [vtSearchLoading, setVtSearchLoading] = useState({});
    const [waitingVatTu, setWaitingVatTu] = useState({}); 

    const [vatTuInput, setVatTuInput] = useState("");
    const [barcodeEnabled, setBarcodeEnabled] = useState(false);
    const [barcodeJustEnabled, setBarcodeJustEnabled] = useState(false);
    const [showQRScanner, setShowQRScanner] = useState(false);
    const [vatTuSearchList, setVatTuSearchList] = useState([]);
    const [pageIndexVt, setPageIndexVt] = useState(1);
    const [totalPageVt, setTotalPageVt] = useState(1);
    const [currentKeywordVt, setCurrentKeywordVt] = useState("");
    const vatTuSelectRef = useRef();
    const searchTimeoutRef = useRef();
    const qrProcessingRef = useRef(false);
    const [selectedDetailRowKeys, setSelectedDetailRowKeys] = useState([]);

    useEffect(() => {
        if (stt_rec) {
            loadData();
            loadDetails();
        } else {
            form.setFieldsValue({
                ma_gd: "1",
                hinh_thuc_tt: "1",
                ty_gia: 1,
                ngay_ct: dayjs(),
                status: "0",
                kh_chiu_cuoc: 0,
            });
        }
        loadBankInfo();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [stt_rec]);

    const loadBankInfo = async () => {
        try {
            const res = await fetchThongTinNganHang("TAPMED");
            setBankInfo(res);
        } catch (error) {
            console.error("Error loading bank info:", error);
        }
    };

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await fetchPhieuKinhDoanhDetail(stt_rec);
            if (res.success && res.data) {
                const { header, statusList: statuses, chiPhi, anhWeb } = res.data;
                const currentStatus = header?.status !== undefined && header?.status !== null ? String(header.status).trim() : "0";
                const currentSoanHang = String(header?.status_soan_hang || "").trim();
                const isEditableStatus = ["0", "1", "2"].includes(currentStatus);
                const isSoanHangLocked = ['1', '2', '3', '4', '5', '6'].includes(currentSoanHang);
                
                if (stt_rec && (!isEditableStatus || isSoanHangLocked)) {
                    setIsEditMode(false);
                }

                setStatusList(statuses && statuses.length > 0 ? statuses : ALL_STATUSES);
                
                if (header) {
                    setOriginalHeader(header);
                    form.setFieldsValue({
                        ...header,
                        status: header.status !== undefined && header.status !== null ? String(header.status).trim() : "0",
                        hinh_thuc_tt: header.ma_gd ? String(header.ma_gd).trim() : "1",
                        kh_chiu_cuoc: header.kh_chiu_cuoc ? 1 : 0,
                        ma_vc: header.ma_vc || "",
                        dia_chi: header.dia_chi || "",
                        ngay_ct: header.ngay_ct ? dayjs(header.ngay_ct) : null,
                        ngay_ct0: header.ngay_ct0 ? dayjs(header.ngay_ct0) : null,
                        bat_dau_dh: header.bat_dau_dh ? dayjs(header.bat_dau_dh) : null,
                        ket_thuc_dh: header.ket_thuc_dh ? dayjs(header.ket_thuc_dh) : null,
                        hang_bi_loi: !!header.hl_yn,
                        khong_tra_cuoc: !!header.ktc_yn,
                        giao_nham_hang: !!header.gnh_yn,
                        thua_thieu_hang: !!header.tth_yn,
                        khieu_nai_gia: !!header.kng_yn,
                        doi_tra_hang: !!header.dthh_yn,
                        hang_date_gan: !!header.hdgkb_yn,
                        van_chuyen_cham: !!header.vcc_yn,
                        van_de_khac: !!header.vdk_yn,
                        y_kien_kh: header.yk_kh || "",
                        phan_hoi: header.ph_kn || "",
                        ngay_khieu_nai: header.fdate3 ? dayjs(header.fdate3) : null,
                        ngay_phan_hoi: header.fdate4 ? dayjs(header.fdate4) : null,
                        t_ck_tt: header.t_ck_tt_nt || header.t_ck_tt || 0,
                        t_ck: header.t_ck_nt || header.t_ck || 0,
                        tien_cp: header.t_cp_nt || header.t_cp || 0,
                        t_tien2: header.t_tien_nt2 || header.t_tien2 || 0,
                        t_ck_voucher: header.t_ck_voucher_nt || header.t_ck_voucher || 0,
                        t_thue_nt: header.t_thue_nt || header.t_thue || 0,
                        tong_cong: header.t_tt_nt || header.t_tt || 0,
                        the_voucher: header.ds_voucher || "",
                        khach_hang_display: header.ma_kh || header.ten_kh || header.ten_kh2 
                            ? `Khách hàng: ${header.ma_kh || ""} - ${header.ten_kh || ""}${header.ten_kh2 ? " - " + header.ten_kh2 : ""}` 
                            : "",
                        gio_dat_hang: header.datetime0 ? dayjs(header.datetime0).format("HH:mm DD/MM/YYYY") : "",
                        gio_chuyen_kho: header.thoi_gian_chuyen_kho ? dayjs(header.thoi_gian_chuyen_kho).format("HH:mm DD/MM/YYYY") : "",
                        gio_chuyen_kinh_doanh: header.thoi_gian_chuyen_kinh_doanh ? dayjs(header.thoi_gian_chuyen_kinh_doanh).format("HH:mm DD/MM/YYYY") : "",
                    });

                    if (header.ma_nvbh) {
                        setNvSelectOptions([{ 
                            value: header.ma_nvbh.trim(), 
                            label: `${header.ma_nvbh.trim()} - ${header.ten_nvbh ? header.ten_nvbh.trim() : ""}` 
                        }]);
                    }
                    if (header.ma_vc) {
                        setVcSelectOptions([{ 
                            value: header.ma_vc.trim(), 
                            label: `${header.ma_vc.trim()} - ${header.ten_vc ? header.ten_vc.trim() : ""}` 
                        }]);
                    }
                    if (header.ma_tt) {
                        setTtSelectOptions([{ 
                            value: header.ma_tt.trim(), 
                            label: `${header.ma_tt.trim()} - ${header.ten_tt ? header.ten_tt.trim() : ""}` 
                        }]);
                    }

                    if (header.ma_nvbh) handleSearchNv("");
                    if (header.ma_tt) handleSearchTt("");
                    if (header.ma_vc) handleSearchVc("");
                    if (header.ma_kh && header.dia_chi) handleSearchNoiGiao(header.dia_chi);
                }
            } else {
                message.error("Không thể tải dữ liệu phiếu");
            }
        } catch (error) {
            console.error(error);
            message.error("Lỗi hệ thống khi tải phiếu");
        } finally {
            setLoading(false);
        }
    };

    const loadDetails = async () => {
        try {
            const res = await fetchPhieuKinhDoanhChiTiet(stt_rec);
            if (res.success) {
                setChiTietData(res.data || []);
            }
        } catch (error) {
            console.error("Error loading details:", error);
        }
    };

    const updateTotals = (details, chiPhi) => {
        let headerValues = form.getFieldsValue();
        
        const tl_ck_voucher = parseFloat(headerValues.tl_ck_voucher || 0);
        if (tl_ck_voucher > 0) {
            const currentTien2 = details.reduce((sum, row) => sum + parseFloat(row.tien_nt2 || 0), 0);
            const newVoucherAmt = Math.round(currentTien2 * (tl_ck_voucher / 100));
            form.setFieldsValue({ t_ck_voucher: newVoucherAmt });
            headerValues = form.getFieldsValue();
        }

        const totals = calculateMasterTotals(details, chiPhi, headerValues);
        
        form.setFieldsValue({
            t_tien2: totals.t_tien_nt2,
            t_ck: totals.t_ck_nt,
            tien_cp: totals.t_cp_nt,
            t_thue_nt: totals.t_thue_nt,
            tong_cong: totals.t_tt_nt
        });
    };

    const handleFormValuesChange = (changedValues) => {
        const ty_gia = changedValues.ty_gia || form.getFieldValue("ty_gia") || 1;
        
        if ("ty_gia" in changedValues) {
            const updatedDetails = chiTietData.map(row => calculateRowOnChange(row, "so_luong", row.so_luong, ty_gia));
            setChiTietData(updatedDetails);
            updateTotals(updatedDetails, chiPhiData);
        } else if ("t_ck_tt" in changedValues || "t_ck_voucher" in changedValues || "tien_cp" in changedValues) {
            updateTotals(chiTietData, chiPhiData);
        }
    };

    const handleCellChange = async (record, field, value) => {
        const ty_gia = form.getFieldValue("ty_gia") || 1;
        
        let newData = chiTietData.map(item => {
            if (item.line_nbr === record.line_nbr) {
                return calculateRowOnChange(item, field, value, ty_gia);
            }
            return item;
        });

        if (field === "ma_vt" && value) {
            const selectedOpt = record.vtOptions?.find(opt => opt.ma_vt === value);
            if (selectedOpt) {
                newData = newData.map(item => 
                    item.line_nbr === record.line_nbr 
                    ? { ...item, ma_vt: selectedOpt.ma_vt, ten_vt: selectedOpt.ten_vt, dvt: selectedOpt.dvt } 
                    : item
                );
            }
        }

        // Handle KM uncheck for existing data where backup price is missing
        if ((field === "ma_vt" && value) || (field === "km_yn" && value === 0)) {
            const targetRow = newData.find(i => i.line_nbr === record.line_nbr);
            if (targetRow && (field === "ma_vt" || !targetRow.gia_nt2_old)) {
                const maKh = form.getFieldValue("ma_kh");
                const ngayCt = form.getFieldValue("ngay_ct");
                const maNt = form.getFieldValue("ma_nt") || "VND";
                
                try {
                    const resList = await fetchThongTinVatTu({
                        ma_vt: targetRow.ma_vt,
                        ma_kho: targetRow.ma_kho || "KOL-T2",
                        ma_kh: maKh,
                        ngay_ct: ngayCt,
                        ma_nt: maNt
                    });
                    
                    if (resList && resList.length > 0) {
                        const info = resList[0];
                        const ton_st = resList.map(item => `${(item.ma_kho || "").trim()}: ${item.ton13 || 0}`).join(", ");

                        newData = newData.map(item => {
                            if (item.line_nbr === record.line_nbr) {
                                const updated = { 
                                    ...item, 
                                    gia_ban_nt: info.gia_ban_nt || item.gia_ban_nt,
                                    gia_nt2: info.gia_nt2 || info.gia_ban_nt || item.gia_nt2,
                                    ma_thue: info.ma_thue || item.ma_thue,
                                    ton13: info.ton13 || item.ton13,
                                    ton_kho_st: ton_st,
                                    // Backup fields to avoid repeated fetches and support standard KM toggle logic
                                    gia_ban_nt_old: info.gia_ban_nt || item.gia_ban_nt,
                                    gia_nt2_old: info.gia_nt2 || info.gia_ban_nt || item.gia_nt2,
                                };
                                return calculateRowOnChange(updated, "gia_nt2", updated.gia_nt2, ty_gia);
                            }
                            return item;
                        });
                        setChiTietData(newData);
                        updateTotals(newData, chiPhiData);
                    }
                } catch (err) {
                    console.error("Error fetching VT info:", err);
                }
            }
        }

        setChiTietData(newData);
        updateTotals(newData, chiPhiData);
    };

    const handleChiPhiChange = (record, field, value) => {
        const ty_gia = form.getFieldValue("ty_gia") || 1;
        const newData = chiPhiData.map(item => {
            if (item.line_nbr === record.line_nbr || (item.ma_cp === record.ma_cp && item.ma_cp)) {
                const updatedItem = { ...item, [field]: value };
                if (field === "tien_cp_nt") {
                    updatedItem.tien_cp = value * ty_gia;
                }
                return updatedItem;
            }
            return item;
        });
        setChiPhiData(newData);
        updateTotals(chiTietData, newData);
    };

    const handleCalculateDiscounts = async () => {
        const values = form.getFieldsValue();
        if (!values.ma_kh) {
            message.warning("Vui lòng chọn khách hàng trước khi tính chiết khấu");
            return;
        }
        if (chiTietData.length === 0) {
            message.warning("Vui lòng thêm vật tư vào đơn hàng");
            return;
        }

        setTinhCKLoading(true);
        try {
            const regularLines = chiTietData.filter(i => !i.km_yn);
            
            const payload = {
                ma_kh: values.ma_kh,
                ngay_ct: values.ngay_ct ? values.ngay_ct.format("YYYY-MM-DD") : dayjs().format("YYYY-MM-DD"),
                ds_vt: regularLines.map(i => i.ma_vt).join(","),
                ds_so_luong: regularLines.map(i => i.so_luong).join(","),
                ds_gia: regularLines.map(i => i.gia_nt2 || 0).join(","),
                ds_tien: regularLines.map(i => i.tien_nt2 || 0).join(","),
                ds_ma_kho: regularLines.map(i => i.ma_kho || "KOL-T2").join(","),
                ds_ma_lo: regularLines.map(i => i.ma_lo || "").join(","),
                t_tien_hang: regularLines.reduce((sum, i) => sum + parseFloat(i.tien_nt2 || 0), 0),
                stt_rec: stt_rec || "",
                kh_chiu_cuoc: values.kh_chiu_cuoc || "1",
                UnitId: "TAPMED"
            };

            const listObject = await calculateDiscounts(payload);
            
            if (!listObject || listObject.length === 0) {
                message.info("Không có chiết khấu hoặc khuyến mại nào được áp dụng");
                return;
            }

            const results = (listObject[0] || []).map((r, idx) => ({ ...r, key: idx }));
            setDiscountResults(results);
            setSelectedDiscountResultsKeys([]);
            setDiscountModalStage('results');
            setDiscountSearchText('');
            setDiscountModalVisible(true);

        } catch (error) {
            console.error("Error handleCalculateDiscounts:", error);
            message.error("Lỗi khi tính chiết khấu: " + (error.message || ""));
        } finally {
            setTinhCKLoading(false);
        }
    };

    const applySelectedDiscounts = () => {
        const resultsToApply = discountResults.filter(r => selectedDiscountResultsKeys.includes(r.key));
        if (resultsToApply.length === 0) {
            message.warning("Chưa chọn chiết khấu nào để áp dụng");
            return;
        }

        const values = form.getFieldsValue();
        let updatedDetails = [...chiTietData];
        let updatedChiPhi = [...chiPhiData];
        
        let current_t_ck_tt = 0;
        let last_ma_ck = values.ma_ck || "";
        const ty_gia = values.ty_gia || 1;

        resultsToApply.forEach(res => {
            const kieu_ck = String(res.kieu_ck || "").trim();
            const ma_ck = String(res.ma_ck || "").trim();
            
            if (kieu_ck === 'H') {
                const ma_vts = res.ma_vt ? String(res.ma_vt).split(',') : [];
                const ten_vts = res.ten_vt ? String(res.ten_vt).split(',') : [];
                const dvts = res.dvt ? String(res.dvt).split(',') : [];
                const sls = res.so_luong_tang ? String(res.so_luong_tang).split(',') : (res.so_luong ? String(res.so_luong).split(',') : []);
                
                ma_vts.forEach((mvt, idx) => {
                    const newRow = {
                        line_nbr: Date.now() + Math.round(Math.random() * 1000000),
                        stt_rec: "",
                        stt_rec0: "",
                        ma_vt: mvt.trim(),
                        ten_vt: (ten_vts[idx] || "").trim(),
                        dvt: (dvts[idx] || "").trim(),
                        ma_kho: String(res.ma_kho || "KOL-T2").trim(),
                        so_luong: parseFloat(sls[idx] || 1),
                        gia_ban_nt: 0,
                        gia_nt2: 0,
                        tien_nt2: 0,
                        ma_thue: "08",
                        thue_suat: 0,
                        km_yn: 1,
                        ma_ck: ma_ck,
                        tl_ck: parseFloat(res.tl_ck || 0),
                        ck_nt: parseFloat(res.ck_nt || res.ck || 0)
                    };
                    updatedDetails.push(calculateRowOnChange(newRow, "so_luong", newRow.so_luong, ty_gia));
                    last_ma_ck = ma_ck;
                });
            } else if (kieu_ck === 'D') {
                const ma_vt_mua = String(res.ma_vt_mua || res.ma_vt || "").trim();
                updatedDetails = updatedDetails.map(row => {
                    if (String(row.ma_vt || "").trim() === ma_vt_mua && !row.km_yn) {
                        let updatedRow = { ...row, ma_ck: ma_ck || row.ma_ck };
                        if (res.gia_nt && parseFloat(res.gia_nt) !== 0) {
                            updatedRow = calculateRowOnChange(updatedRow, "gia_nt2", parseFloat(res.gia_nt), ty_gia);
                        } else if (res.tl_ck && parseFloat(res.tl_ck) !== 0) {
                            updatedRow = calculateRowOnChange(updatedRow, "tl_ck", parseFloat(res.tl_ck), ty_gia);
                            if (res.tien_ck_toi_da > 0 && updatedRow.ck_nt > res.tien_ck_toi_da) {
                                updatedRow = calculateRowOnChange(updatedRow, "ck_nt", parseFloat(res.tien_ck_toi_da), ty_gia);
                            }
                        } else if (res.ck_nt || res.ck) {
                            updatedRow = calculateRowOnChange(updatedRow, "ck_nt", parseFloat(res.ck_nt || res.ck), ty_gia);
                        }
                        last_ma_ck = ma_ck;
                        return updatedRow;
                    }
                    return row;
                });
            } else if (kieu_ck === 'M') {
                let disc_val = 0;
                if ((res.ck_nt && parseFloat(res.ck_nt) !== 0) || (res.ck && parseFloat(res.ck) !== 0)) {
                    disc_val = parseFloat(res.ck_nt || res.ck);
                } else if (res.tl_ck && parseFloat(res.tl_ck) !== 0) {
                    const tl = parseFloat(res.tl_ck);
                    const t_tien_nt2 = updatedDetails.reduce((sum, row) => sum + parseFloat(row.tien_nt2 || 0), 0);
                    const t_ck_nt = updatedDetails.filter(r => !r.km_yn).reduce((sum, row) => sum + parseFloat(row.ck_nt || 0) + parseFloat(row.ck_khac_nt || 0), 0);

                    const stt_ut = parseInt(res.stt_ut || 0);
                    if (stt_ut <= 1) {
                        disc_val = (tl * t_tien_nt2) / 100;
                    } else {
                        disc_val = (tl * (t_tien_nt2 - t_ck_nt - current_t_ck_tt)) / 100;
                    }

                    if (res.tien_ck_toi_da > 0 && disc_val > res.tien_ck_toi_da) {
                        disc_val = res.tien_ck_toi_da;
                    }
                    disc_val = Math.round(disc_val);
                }

                if (disc_val !== 0) {
                    current_t_ck_tt += disc_val;
                    last_ma_ck = ma_ck;
                    updatedChiPhi.push({
                        line_nbr: Date.now() + Math.round(Math.random() * 1000000),
                        ma_cp: '21',
                        ten_cp: 'Chiết khấu tổng đơn (' + ma_ck + ')',
                        tien_cp: disc_val,
                        tien_cp_nt: disc_val,
                        ma_td1: ma_ck
                    });
                }
            }
        });

        setChiTietData(updatedDetails);
        setChiPhiData(updatedChiPhi);
        
        form.setFieldsValue({
            ma_ck: last_ma_ck,
            t_ck_tt: current_t_ck_tt
        });

        updateTotals(updatedDetails, updatedChiPhi);
        setDiscountModalVisible(false);
        message.success("Đã áp dụng các chiết khấu/khuyến mại đã chọn");
    };

    const handleSearchKh = useMemo(() => _.debounce(async (val, searchField = "ten_kh") => {
        setKhSearchLoading(true);
        try {
            const list = await fetchKhachHangSelection(val, searchField);
            setKhSelectOptions(list.map(i => ({ value: i.ma_kh, label: `${i.ma_kh} - ${i.ten_kh}`, ...i  })));
        } catch (err) {
            console.error("error searching kh", err);
        } finally {
            setKhSearchLoading(false);
        }
    }, 300), []);

    const handleSearchNv = useMemo(() => _.debounce(async (val) => {
        setNvSearchLoading(true);
        try {
            const list = await fetchNhanVienKDSelection(val);
            setNvSelectOptions(list.map(i => ({ value: i.ma_nvbh, label: `${i.ma_nvbh} - ${i.ten_nvbh}`, ...i })));
        } finally {
            setNvSearchLoading(false);
        }
    }, 300), []);

    const handleSearchTt = useMemo(() => _.debounce(async (val) => {
        setTtSearchLoading(true);
        try {
            const list = await fetchThanhToanSelection(val);
            setTtSelectOptions(list.map(i => ({ value: i.ma_tt, label: `${i.ma_tt} - ${i.ten_tt}`, ...i })));
        } finally {
            setTtSearchLoading(false);
        }
    }, 300), []);

    const handleSearchVc = useMemo(() => _.debounce(async (val) => {
        setVcSearchLoading(true);
        try {
            const list = await fetchVanChuyenSelection(val);
            setVcSelectOptions(list.map(i => ({ value: i.ma_vc, label: `${i.ma_vc} - ${i.ten_vc}`, ...i })));
        } finally {
            setVcSearchLoading(false);
        }
    }, 300), []);

    const handleSearchVoucher = useMemo(() => _.debounce(async (val) => {
        const currentVals = form.getFieldsValue();
        setVoucherSearchLoading(true);
        try {
            const list = await fetchVoucherSelection(
                currentVals.ma_kh || "", 
                currentVals.ngay_ct ? currentVals.ngay_ct.format("YYYY-MM-DD") : dayjs().format("YYYY-MM-DD"),
                1,
                50
            );
            setVoucherSelectOptions(list.map(i => ({ value: i.the_voucher, label: `${i.the_voucher} - ${i.ten_loai_the}`, ...i })));
        } finally {
            setVoucherSearchLoading(false);
        }
    }, 300), [form]);

    const handleSearchNoiGiao = useMemo(() => _.debounce(async (val) => {
        const maKh = form.getFieldValue("ma_kh");
        setNoiGiaoSearchLoading(true);
        try {
            const list = await fetchNoiGiaoSelection(maKh, val);
            setNoiGiaoSelectOptions(list.map(i => ({ value: i.ten_dc, label: `${i.ma_dc} - ${i.ten_dc}`, ...i })));
        } finally {
            setNoiGiaoSearchLoading(false);
        }
    }, 300), [form]);

    const handleSearchVt = useMemo(() => _.debounce(async (keyword, record) => {
        setVtSearchLoading(prev => ({ ...prev, [record.line_nbr]: true }));
        try {
            const list = await fetchVatTuSelection(keyword);
            const options = list.map(i => ({ value: i.ma_vt, label: `${i.ma_vt} - ${i.ten_vt}`, ...i }));
            setChiTietData(prev => prev.map(item => 
                item.line_nbr === record.line_nbr ? { ...item, vtOptions: options } : item
            ));
        } finally {
            setVtSearchLoading(prev => ({ ...prev, [record.line_nbr]: false }));
        }
    }, 300), []);

    const fetchVatTuListWrapper = useCallback(async (keyword = "", page = 1, append = false) => {
        setCurrentKeywordVt(keyword);
        try {
            const list = await fetchVatTuSelection(keyword, page);
            const options = list.map(i => ({ value: i.ma_vt, label: `${i.ma_vt} - ${i.ten_vt}`, ...i }));
            if (append) {
                setVatTuSearchList(prev => [...prev, ...options]);
            } else {
                setVatTuSearchList(options);
            }
            setTotalPageVt(1); 
        } catch (error) {
            console.error("fetchVatTuListWrapper error", error);
        }
    }, []);

    const handleVatTuSelect = async (ma_vt) => {
        setLoading(true);
        try {
            const searchItem = vatTuSearchList.find(i => i.ma_vt === ma_vt || i.value === ma_vt);
            const currentFormValues = form.getFieldsValue();
            const resList = await fetchThongTinVatTu({
                ma_vt: ma_vt,
                ma_kho: "KOL-T2", 
                ma_kh: currentFormValues.ma_kh || "",
                ngay_ct: currentFormValues.ngay_ct ? currentFormValues.ngay_ct.format("YYYY-MM-DD") : dayjs().format("YYYY-MM-DD"),
            });

            if (resList && resList.length > 0) {
                const detail = resList[0];
                const ton_st = resList.map(item => `${(item.ma_kho || "").trim()}: ${item.ton13 || 0}`).join(", ");

                const newLine = {
                    line_nbr: chiTietData.length > 0 ? Math.max(...chiTietData.map(i => (typeof i.line_nbr === 'number' && i.line_nbr < 1000000) ? i.line_nbr : 0)) + 1 : 1,
                    stt_rec: "",
                    stt_rec0: "",
                    ma_vt: detail.ma_vt || ma_vt,
                    ten_vt: detail.ten_vt || searchItem?.ten_vt || "",
                    image: detail.image || searchItem?.image || null,
                    dvt: detail.dvt || searchItem?.dvt || "",
                    ma_kho: "KOL-T2",
                    so_luong: 1,
                    gia_ban_nt: detail.gia_ban_nt || 0,
                    gia_nt2: detail.gia_nt2 || detail.gia_ban_nt || 0,
                    tien_nt2: detail.gia_nt2 || detail.gia_ban_nt || 0,
                    ma_thue: detail.ma_thue || "08",
                    thue_suat: detail.thue_suat || 0,
                    ton13: detail.ton13 !== undefined ? detail.ton13 : (detail.stock !== undefined ? detail.stock : 0),
                    ton_kho_st: ton_st,
                    km_yn: 0,
                    db_yn: 0,
                    tl_ck: 0,
                    ck_nt: 0,
                    ck_khac_nt: 0,
                    s4: 0,
                    ghi_chu_ck_khac: "",
                    ghi_chu_dh: "",
                    ghi_chu: "",
                    sl_xuat: 0,
                    sl_hd: 0,
                    gia_ban_nt_old: detail.gia_ban_nt || 0,
                    gia_nt2_old: detail.gia_nt2 || detail.gia_ban_nt || 0,
                    tonl1: detail.tonl1 || 0,
                    tong_chuyen: detail.tong_chuyen || 0,
                    pvkd_yn: detail.pvkd_yn !== undefined ? detail.pvkd_yn : 1,
                };
                
                const ty_gia = currentFormValues.ty_gia || 1;
                const calculatedLine = calculateRowOnChange(newLine, "so_luong", 1, ty_gia);
                
                const updatedData = [calculatedLine, ...chiTietData];
                setChiTietData(updatedData);
                updateTotals(updatedData, chiPhiData);
                
                notificationManager.showMessageOnce(detail.ma_vt, `Đã thêm: ${detail.ten_vt}`);
                setVatTuInput("");
            } else {
                message.error("Không tìm thấy thông tin vật tư này trên hệ thống");
            }
        } catch (error) {
            console.error("handleVatTuSelect error:", error);
            message.error("Lỗi khi lấy thông tin vật tư: " + (error.message || ""));
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteRow = (record) => {
        showConfirm({
            title: "Xác nhận xoá",
            content: `Bạn có chắc chắn muốn xoá mặt hàng "${record.ten_vt}" không?`,
            type: "error",
            onOk: () => {
                const newData = chiTietData.filter(item => item.line_nbr !== record.line_nbr);
                setChiTietData(newData);
                updateTotals(newData, chiPhiData);
                
                // Clear from selection if it was selected
                const key = record.stt_rec + "_" + record.line_nbr;
                setSelectedDetailRowKeys(prev => prev.filter(k => k !== key));
                
                message.success(`Đã xoá mặt hàng: ${record.ten_vt}`);
            }
        });
    };

    const handleDeleteChiPhi = (record) => {
        showConfirm({
            title: "Xác nhận xoá",
            content: `Bạn có chắc chắn muốn xoá chi phí "${record.ten_cp || record.ma_cp}" không?`,
            type: "error",
            onOk: () => {
                const newData = chiPhiData.filter(item => !(item.ma_cp === record.ma_cp && item.line_nbr === record.line_nbr));
                setChiPhiData(newData);
                updateTotals(chiTietData, newData);
                message.success(`Đã xoá chi phí: ${record.ten_cp || record.ma_cp}`);
            }
        });
    };

    const handleDeleteSelected = () => {
        if (selectedDetailRowKeys.length === 0) return;

        showConfirm({
            title: "Xác nhận xoá",
            content: `Bạn có chắc chắn muốn xoá ${selectedDetailRowKeys.length} mặt hàng đã chọn không?`,
            type: "error",
            onOk: () => {
                const newData = chiTietData.filter(item => {
                    const rowKey = item.stt_rec + "_" + item.line_nbr;
                    return !selectedDetailRowKeys.includes(rowKey);
                });
                setChiTietData(newData);
                updateTotals(newData, chiPhiData);
                setSelectedDetailRowKeys([]);
                message.success(`Đã xoá ${selectedDetailRowKeys.length} mặt hàng`);
            }
        });
    };

    const handleQRScanSuccess = async (scannedCode) => {
        if (qrProcessingRef.current) return;
        qrProcessingRef.current = true;
        try {
            const trimmedCode = scannedCode.trim();
            const maVt = trimmedCode.split('#')[0].trim();
            await handleVatTuSelect(maVt);
        } finally {
            setTimeout(() => { qrProcessingRef.current = false; }, 2000);
        }
    };

    const handleSwitchToBarcodeMode = () => {
        setShowQRScanner(false);
        setBarcodeEnabled(true);
        setBarcodeJustEnabled(true);
    };

    const handleToggleEdit = () => {
        const currentStatus = form.getFieldValue("status");
        const currentSoanHang = String(form.getFieldValue("status_soan_hang") || originalHeader?.status_soan_hang || "").trim();
        
        if (!["0", "1", "2"].includes(String(currentStatus).trim())) {
            message.warning("Đơn hàng đã ở trạng thái không thể chỉnh sửa");
            return;
        }

        if (['1', '2', '3', '4', '5', '6'].includes(currentSoanHang)) {
            message.warning("Đơn hàng đã chuyển kho. Không thể sửa!");
            return;
        }

        if (!isEditMode && stt_rec) {
            navigate(`/kinh-doanh/edit/${stt_rec}`);
        }
        setIsEditMode(true);
    };

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            
            const validationErrors = validateKinhDoanh(values, chiTietData, chiPhiData);
            if (validationErrors.length > 0) {
                validationErrors.forEach(err => message.error(err));
                return;
            }

            if (parseFloat(values.tong_cong || 0) < 0) {
                message.warning("Tổng tiền thanh toán không được âm. Vui lòng kiểm tra lại các khoản chiết khấu.");
                return;
            }

            setLoading(true);
            const userInfoStr = localStorage.getItem("user_info");
            const userInfo = userInfoStr ? JSON.parse(userInfoStr) : null;
            
            const saveFunc = stt_rec ? updatePhieuKinhDoanh : createPhieuKinhDoanh;
            const masterPayload = stt_rec ? { ...originalHeader, ...values, stt_rec } : { ...values };

            const res = await saveFunc(
                masterPayload, 
                chiTietData, 
                chiPhiData,
                userInfo?.ma_dvcs || "TAPMED",
                "",
                userInfo?.id || userInfo?.userId || "3425"
            );

            if (res.success) {
                message.success(res.message || "Lưu đơn hàng thành công");
                navigate("/kinh-doanh/danh-sach");
            } else {
                message.error(res.message || "Lỗi khi lưu đơn hàng");
            }
            setLoading(false);
        } catch (error) {
            console.error("Validation failed:", error);
            message.error("Vui lòng kiểm tra lại thông tin");
        }
    };

    return {
        form,
        navigate,
        stt_rec,
        watchSoCt,
        watchBContractId,
        watchNgayCt,
        watchStatus,
        watchStatusSoanHang,
        watchTenKh,
        watchMaKh,
        isEditMode,
        loading,
        isMobile,
        showGeneralInfo,
        tinhCKLoading,
        discountModalVisible,
        setDiscountModalVisible,
        discountItemsSelection,
        setDiscountItemsSelection,
        discountResults,
        selectedDiscountResultsKeys,
        setSelectedDiscountResultsKeys,
        discountModalStage,
        discountSearchText,
        setDiscountSearchText,
        printModalVisible,
        setPrintModalVisible,
        toggleGeneralInfo,
        statusList,
        chiTietData,
        setChiTietData,
        chiPhiData,
        setChiPhiData,
        khSelectOptions,
        nvSelectOptions,
        ttSelectOptions,
        vcSelectOptions,
        voucherSelectOptions,
        noiGiaoSelectOptions,
        khSearchLoading,
        nvSearchLoading,
        ttSearchLoading,
        vcSearchLoading,
        voucherSearchLoading,
        noiGiaoSearchLoading,
        vatTuInput,
        setVatTuInput,
        barcodeEnabled,
        setBarcodeEnabled,
        barcodeJustEnabled,
        setBarcodeJustEnabled,
        showQRScanner,
        setShowQRScanner,
        vatTuSearchList,
        setVatTuSearchList,
        pageIndexVt,
        setPageIndexVt,
        totalPageVt,
        currentKeywordVt,
        vatTuSelectRef,
        searchTimeoutRef,
        handleFormValuesChange,
        handleCellChange,
        handleChiPhiChange,
        handleCalculateDiscounts,
        applySelectedDiscounts,
        handleSearchKh,
        handleSearchNv,
        handleSearchTt,
        handleSearchVc,
        handleSearchVoucher,
        handleSearchNoiGiao,
        handleSearchVt,
        fetchVatTuListWrapper,
        handleVatTuSelect,
        handleQRScanSuccess,
        handleSwitchToBarcodeMode,
        handleToggleEdit,
        handleSubmit,
        updateTotals,
        bankInfo,
        selectedDetailRowKeys,
        setSelectedDetailRowKeys,
        handleDeleteSelected,
        handleDeleteRow,
        handleDeleteChiPhi
    };
};
