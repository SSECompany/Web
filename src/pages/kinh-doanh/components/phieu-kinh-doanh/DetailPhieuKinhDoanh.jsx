import {
    LeftOutlined,
    EditOutlined,
    SaveOutlined,
    CloseCircleOutlined,
    PlusOutlined,
    DeleteOutlined,
    SearchOutlined,
    DownOutlined,
    UpOutlined,
} from "@ant-design/icons";
import {
    Button, Form, Input, Select, Typography,
    message, Checkbox, Tabs, Row, Col, DatePicker,
    Table, Spin, InputNumber
} from "antd";
import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import dayjs from "dayjs";
import _ from "lodash";
import { useRef } from "react";
import VatTuSelectFullPOS from "../../../../components/common/ProductSelectFull/VatTuSelectFullPOS";
import QRScanner from "../../../../components/common/QRScanner/QRScanner";
import notificationManager from "../../../../utils/notificationManager";
import { 
    fetchPhieuKinhDoanhDetail, 
    fetchPhieuKinhDoanhChiTiet,
    transferDonHangBan,
    cancelDonHangBan as cancelOrderApi,
    createPhieuKinhDoanh,
    updatePhieuKinhDoanh,
    fetchKhachHangSelection,
    fetchNhanVienKDSelection,
    fetchThanhToanSelection,
    fetchVatTuSelection,
    fetchThongTinVatTu,
    fetchVanChuyenSelection,
    fetchVoucherSelection
} from "./phieuKinhDoanhApi";
import { calculateRowOnChange, calculateMasterTotals, validateKinhDoanh } from "./utils/phieuKinhDoanhUtils";
import "../../../kho/components/common-phieu.css";
import "./DetailPhieuKinhDoanh.css";

const { Title, Text } = Typography;
const numFmt = (val, precision = 0) => {
    if (val === undefined || val === null || val === "") return "";
    // If precision is boolean false (old behavior), use 2 as default for prices
    const dec = typeof precision === 'boolean' ? (precision ? 0 : 2) : precision;
    let value = parseFloat(val);
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: dec
    }).format(value);
};

const DetailPhieuKinhDoanh = ({ isEditMode: initialEditMode = false }) => {
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

    const [isEditMode, setIsEditMode] = useState(
        initialEditMode || location.pathname.includes("/edit/") || !stt_rec
    );
    const [loading, setLoading] = useState(false);
    const [originalHeader, setOriginalHeader] = useState({});
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [showGeneralInfo, setShowGeneralInfo] = useState(true);

    const toggleGeneralInfo = () => setShowGeneralInfo(!showGeneralInfo);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const [statusList, setStatusList] = useState([]);
    const [chiTietData, setChiTietData] = useState([]);
    const [chiPhiData, setChiPhiData] = useState([]);
    const [anhWebData, setAnhWebData] = useState([]);

    const [khSelectOptions, setKhSelectOptions] = useState([]);
    const [nvSelectOptions, setNvSelectOptions] = useState([]);
    const [ttSelectOptions, setTtSelectOptions] = useState([]);
    const [vcSelectOptions, setVcSelectOptions] = useState([]);
    const [voucherSelectOptions, setVoucherSelectOptions] = useState([]);
    
    const [khSearchLoading, setKhSearchLoading] = useState(false);
    const [nvSearchLoading, setNvSearchLoading] = useState(false);
    const [ttSearchLoading, setTtSearchLoading] = useState(false);
    const [vcSearchLoading, setVcSearchLoading] = useState(false);
    const [voucherSearchLoading, setVoucherSearchLoading] = useState(false);
    const [vtSearchLoading, setVtSearchLoading] = useState({});
    const [waitingVatTu, setWaitingVatTu] = useState({}); 

    // States for top-level Product Search (VatTuSelectFullPOS)
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
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [stt_rec]);

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await fetchPhieuKinhDoanhDetail(stt_rec);
            if (res.success && res.data) {
                const { header, statusList: statuses, chiPhi, anhWeb } = res.data;
                setStatusList(statuses || []);
                setChiPhiData(chiPhi || []);
                setAnhWebData(anhWeb || []);
                if (header) {
                    setOriginalHeader(header);
                    form.setFieldsValue({
                        ...header,
                        // Explicitly map and format key fields
                        status: header.status !== undefined && header.status !== null ? String(header.status).trim() : "0",
                        hinh_thuc_tt: header.ma_gd ? String(header.ma_gd).trim() : "1",
                        kh_chiu_cuoc: header.kh_chiu_cuoc ? 1 : 0,
                        ma_vc: header.ma_vc || "",
                        dia_chi: header.dia_chi || "",
                        
                        ngay_ct: header.ngay_ct ? dayjs(header.ngay_ct) : null,
                        ngay_ct0: header.ngay_ct0 ? dayjs(header.ngay_ct0) : null,
                        // Complaint tab mapping
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
                        // Totals mapping
                        t_ck_tt: header.t_ck_tt_nt || header.t_ck_tt || 0,
                        t_ck: header.t_ck_nt || header.t_ck || 0,
                        tien_cp: header.t_cp_nt || header.t_cp || 0,
                        t_tien2: header.t_tien_nt2 || header.t_tien2 || 0,
                        t_ck_voucher: header.t_ck_voucher_nt || header.t_ck_voucher || 0,
                        t_thue_nt: header.t_thue_nt || header.t_thue || 0,
                        tong_cong: header.t_tt_nt || header.t_tt || 0,
                        the_voucher: header.ds_voucher || "",
                        khach_hang_display: header.ma_kh || header.ten_kh ? `Khách hàng: ${header.ten_kh || ""} - ${header.ma_kh || ""}` : "",
                        // Timestamp fields
                        gio_dat_hang: header.datetime0 ? dayjs(header.datetime0).format("HH:mm DD/MM/YYYY") : "",
                        gio_chuyen_kho: header.thoi_gian_chuyen_kho ? dayjs(header.thoi_gian_chuyen_kho).format("HH:mm DD/MM/YYYY") : "",
                    });
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
                // Initialize details exactly as loaded without recalculation
                setChiTietData(res.data || []);
            }
        } catch (error) {
            console.error("Error loading details:", error);
        }
    };

    const updateTotals = (details, chiPhi) => {
        let headerValues = form.getFieldsValue();
        
        // Recalculate voucher amount if it's percentage-based
        const tl_ck_voucher = parseFloat(headerValues.tl_ck_voucher || 0);
        if (tl_ck_voucher > 0) {
            // First get the latest t_tien_nt2 from details
            const currentTien2 = details.reduce((sum, row) => sum + parseFloat(row.tien_nt2 || 0), 0);
            const newVoucherAmt = Math.round(currentTien2 * (tl_ck_voucher / 100));
            form.setFieldsValue({ t_ck_voucher: newVoucherAmt });
            // Refresh headerValues for calculateMasterTotals
            headerValues = form.getFieldsValue();
        }

        const totals = calculateMasterTotals(details, chiPhi, headerValues);
        
        form.setFieldsValue({
            t_tien2: totals.t_tien_nt2, // Mapping total item value to t_tien2
            t_ck: totals.t_ck_nt,
            tien_cp: totals.t_cp_nt,
            t_thue_nt: totals.t_thue_nt,
            tong_cong: totals.t_tt_nt
        });
    };

    const handleFormValuesChange = (changedValues) => {
        const ty_gia = changedValues.ty_gia || form.getFieldValue("ty_gia") || 1;
        
        if ("ty_gia" in changedValues) {
            // Recalculate every row in Chi Tiet if ty_gia changes
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

        // Special handling for ma_vt change: fetch item details
        if (field === "ma_vt" && value) {
            const selectedOpt = record.vtOptions?.find(opt => opt.ma_vt === value);
            if (selectedOpt) {
                // Update basic info first
                newData = newData.map(item => 
                    item.line_nbr === record.line_nbr 
                    ? { ...item, ma_vt: selectedOpt.ma_vt, ten_vt: selectedOpt.ten_vt, dvt: selectedOpt.dvt } 
                    : item
                );
                
                // Fetch full details (prices, etc.)
                const maKh = form.getFieldValue("ma_kh");
                const ngayCt = form.getFieldValue("ngay_ct");
                const maNt = form.getFieldValue("ma_nt") || "VND";
                
                try {
                    const info = await fetchThongTinVatTu({
                        ma_vt: selectedOpt.ma_vt,
                        ma_kho: record.ma_kho || "KOL-T2",
                        ma_kh: maKh,
                        ngay_ct: ngayCt,
                        ma_nt: maNt
                    });
                    
                    if (info) {
                        newData = newData.map(item => {
                            if (item.line_nbr === record.line_nbr) {
                                // Apply info from API
                                const updated = { 
                                    ...item, 
                                    gia_ban_nt: info.gia_ban_nt || item.gia_ban_nt,
                                    gia_nt2: info.gia_nt2 || info.gia_ban_nt || item.gia_nt2,
                                    ma_thue: info.ma_thue || item.ma_thue,
                                    ton13: info.ton13 || item.ton13,
                                };
                                // Force recalculate totals for this row
                                return calculateRowOnChange(updated, "gia_nt2", updated.gia_nt2, ty_gia);
                            }
                            return item;
                        });
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

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            
            // Perform custom validations
            const validationErrors = validateKinhDoanh(values, chiTietData, chiPhiData);
            if (validationErrors.length > 0) {
                validationErrors.forEach(err => message.error(err));
                return;
            }

            setLoading(true);
            const userInfoStr = localStorage.getItem("user_info");
            const userInfo = userInfoStr ? JSON.parse(userInfoStr) : null;
            
            const saveFunc = stt_rec ? updatePhieuKinhDoanh : createPhieuKinhDoanh;
            
            // Merge form values with original header to preserve fields not in form
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


    const handleSearchKh = useMemo(() => _.debounce(async (val, searchField = "ten_kh") => {
        console.log(`🔍 Searching Customer by ${searchField}: "${val}"`);
        setKhSearchLoading(true);
        try {
            const list = await fetchKhachHangSelection(val, searchField);
            console.log(`✅ Found ${list.length} customers`);
            setKhSelectOptions(list.map(i => ({ value: i.ma_kh, label: `${i.ma_kh} - ${i.ten_kh}`, ...i  })));
        } catch (err) {
            console.error("❌ Error searching customer:", err);
        } finally {
            setKhSearchLoading(false);
        }
    }, 300), []);

    const handleSearchNv = useMemo(() => _.debounce(async (val) => {
        console.log(`🔍 Searching NVKD: "${val}"`);
        setNvSearchLoading(true);
        try {
            const list = await fetchNhanVienKDSelection(val);
            setNvSelectOptions(list.map(i => ({ value: i.ma_nvbh, label: `${i.ma_nvbh} - ${i.ten_nvbh}`, ...i })));
        } finally {
            setNvSearchLoading(false);
        }
    }, 300), []);

    const handleSearchTt = useMemo(() => _.debounce(async (val) => {
        console.log(`🔍 Searching Thanh Toan: "${val}"`);
        setTtSearchLoading(true);
        try {
            const list = await fetchThanhToanSelection(val);
            setTtSelectOptions(list.map(i => ({ value: i.ma_tt, label: `${i.ma_tt} - ${i.ten_tt}`, ...i })));
        } finally {
            setTtSearchLoading(false);
        }
    }, 300), []);

    const handleSearchVc = useMemo(() => _.debounce(async (val) => {
        console.log(`🔍 Searching Van Chuyen: "${val}"`);
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
        console.log(`🔍 Searching Voucher: "${val}" for Ma_KH: ${currentVals.ma_kh}`);
        setVoucherSearchLoading(true);
        try {
            const list = await fetchVoucherSelection(
                currentVals.ma_kh || "", 
                currentVals.ngay_ct ? currentVals.ngay_ct.format("YYYY-MM-DD") : dayjs().format("YYYY-MM-DD"),
                1,
                50
            );
            // Deduplicate if needed, but assuming API provides the list
            setVoucherSelectOptions(list.map(i => ({ value: i.the_voucher, label: `${i.the_voucher} - ${i.ten_loai_the}`, ...i })));
        } finally {
            setVoucherSearchLoading(false);
        }
    }, 300), [form]);

    const handleSearchVt = useMemo(() => _.debounce(async (keyword, record) => {
        console.log(`🔍 Searching Vật tư: "${keyword}"`);
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

    // ===== TOP-LEVEL PRODUCT SEARCH HANDLERS =====
    const fetchVatTuListWrapper = async (keyword = "", page = 1, append = false) => {
        setCurrentKeywordVt(keyword);
        try {
            const list = await fetchVatTuSelection(keyword, page);
            // Assuming fetchVatTuSelection returns the list directly or handles pagination internally
            // For now, let's treat it as returning the list
            const options = list.map(i => ({ value: i.ma_vt, label: `${i.ma_vt} - ${i.ten_vt}`, ...i }));
            if (append) {
                setVatTuSearchList(prev => [...prev, ...options]);
            } else {
                setVatTuSearchList(options);
            }
            // Update totalPage if the API provides it (default to 1 for now)
            setTotalPageVt(1); 
        } catch (error) {
            console.error("fetchVatTuListWrapper error", error);
        }
    };

    const handleVatTuSelect = async (ma_vt) => {
        console.log(`🎯 Top-level selected Vat tu: ${ma_vt}`);
        setLoading(true);
        try {
            // Find in search list for fallback info (name, image, etc.)
            const searchItem = vatTuSearchList.find(i => i.ma_vt === ma_vt || i.value === ma_vt);
            
            const currentFormValues = form.getFieldsValue();
            const detail = await fetchThongTinVatTu({
                ma_vt: ma_vt,
                ma_kho: "KOL-T2", 
                ma_kh: currentFormValues.ma_kh || "",
                ngay_ct: currentFormValues.ngay_ct ? currentFormValues.ngay_ct.format("YYYY-MM-DD") : dayjs().format("YYYY-MM-DD"),
            });

            if (detail) {
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
                    // Map correctly to match existing data pattern:
                    // gia_ban_nt -> Giá niêm yết (Price WITH tax)
                    // gia_nt2 -> Giá bán (Price WITHOUT tax)
                    gia_ban_nt: detail.gia_ban_nt || 0,
                    gia_nt2: detail.gia_nt2 || detail.gia_ban_nt || 0,
                    tien_nt2: detail.gia_nt2 || detail.gia_ban_nt || 0,
                    ma_thue: detail.ma_thue || "08",
                    thue_suat: detail.thue_suat || 0,
                    ton13: detail.ton13 !== undefined ? detail.ton13 : (detail.stock !== undefined ? detail.stock : 0),
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
                };
                
                // Ensure row is fully calculated (especially for tien2, thue, etc.)
                const ty_gia = currentFormValues.ty_gia || 1;
                const calculatedLine = calculateRowOnChange(newLine, "so_luong", 1, ty_gia);
                
                const updatedData = [...chiTietData, calculatedLine];
                setChiTietData(updatedData);
                
                // Recalculate totals using central helper
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

    const handleQRScanSuccess = async (scannedCode) => {
        if (qrProcessingRef.current) return;
        qrProcessingRef.current = true;
        try {
            const trimmedCode = scannedCode.trim();
            // Handle cases where QR might have ma_vt#ma_lo
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
        if (!isEditMode && stt_rec) {
            navigate(`/kinh-doanh/edit/${stt_rec}`);
        }
        setIsEditMode(true);
    };

    // ============ Tabs ============
    const chiPhiColumns = [
        { title: "Mã chi phí", dataIndex: "ma_cp", key: "ma_cp", width: 120, align: "center" },
        { title: "Tên chi phí", dataIndex: "ten_cp", key: "ten_cp", align: "center" },
        {
            title: "Tiền (NT)",
            dataIndex: "tien_cp_nt",
            key: "tien_cp_nt",
            align: "center",
            width: 140,
            render: (v, record) => isEditMode ? (
                <InputNumber
                    size="small"
                    value={v}
                    controls={false}
                    className="phieu-table-input"
                    formatter={numFmt}
                    style={{ width: '100%' }}
                    onChange={(val) => handleChiPhiChange(record, "tien_cp_nt", val)}
                />
            ) : (v ? v.toLocaleString() : "0"),
        },
        { 
            title: "Ghi chú", 
            dataIndex: "ghi_chu", 
            key: "ghi_chu", 
            align: "center", 
            width: 200,
            render: (v, record) => isEditMode ? (
                <Input
                    size="small"
                    value={v}
                    className="phieu-table-input"
                    onChange={(e) => {
                        setChiPhiData(prev => prev.map(item => 
                            (item.ma_cp === record.ma_cp && item.line_nbr === record.line_nbr) ? { ...item, ghi_chu: e.target.value } : item
                        ));
                    }}
                />
            ) : v
        },
        {
            title: "Hành động",
            key: "action",
            width: 80,
            align: "center",
            render: (_, record) => (
                <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    disabled={!isEditMode}
                    onClick={() => {
                        setChiPhiData(prev => prev.filter(item => !(item.ma_cp === record.ma_cp && item.line_nbr === record.line_nbr)));
                        message.success("Đã xóa chi phí khỏi đơn");
                    }}
                />
            )
        },
    ];

    const tabItems = [
        {
            key: "chi_tiet",
            label: "Chi tiết",
            children: (
                <div style={{ minHeight: 120 }}>
                    {isEditMode && (
                        <div style={{ marginBottom: 16 }}>
                            <div style={{ marginBottom: 8, fontWeight: 'bold', fontSize: '14px' }}>Tìm kiếm vật tư</div>
                            <VatTuSelectFullPOS
                                isEditMode={isEditMode}
                                barcodeEnabled={barcodeEnabled}
                                setBarcodeEnabled={setBarcodeEnabled}
                                setBarcodeJustEnabled={setBarcodeJustEnabled}
                                vatTuInput={vatTuInput}
                                setVatTuInput={setVatTuInput}
                                vatTuSelectRef={vatTuSelectRef}
                                loadingVatTu={false}
                                vatTuList={vatTuSearchList}
                                searchTimeoutRef={searchTimeoutRef}
                                fetchVatTuList={fetchVatTuListWrapper}
                                handleVatTuSelect={handleVatTuSelect}
                                totalPage={totalPageVt}
                                pageIndex={pageIndexVt}
                                setPageIndex={setPageIndexVt}
                                setVatTuList={setVatTuSearchList}
                                currentKeyword={currentKeywordVt}
                                onOpenQRScanner={() => setShowQRScanner(true)}
                            />
                        </div>
                    )}
                    <Table
                        size="small"
                        dataSource={chiTietData}
                        columns={[
                            { title: "Đ.bộ", dataIndex: "db_yn", width: 50, align: "center", render: (v, record) => (
                                <Checkbox
                                    checked={!!v}
                                    disabled={!isEditMode}
                                    onChange={(e) => {
                                        setChiTietData(prev => prev.map(item =>
                                            item.line_nbr === record.line_nbr ? { ...item, db_yn: e.target.checked ? 1 : 0 } : item
                                        ));
                                    }}
                                />
                            ) },
                            {
                                title: "Sản phẩm",
                                key: "san_pham",
                                width: 220,
                                align: "center",
                                render: (_, record) => (
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '4px 0' }}>
                                        {record.image ? (
                                            <img src={record.image} alt="" style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 8, border: '1px solid #f0f0f0' }} />
                                        ) : (
                                            <div style={{ width: 60, height: 60, background: '#f8f9fb', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#94a3b8', border: '1px solid #eef2f7' }}>No Image</div>
                                        )}
                                        <div style={{ width: '100%', textAlign: 'center' }}>
                                            <div style={{ marginBottom: 4 }}>
                                                <Text strong style={{ fontSize: '13px', lineHeight: '1.4', whiteSpace: 'normal', wordBreak: 'break-word', display: 'block' }}>
                                                    {record.ten_vt}
                                                </Text>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'center', gap: 6, fontSize: '11px', color: '#64748b', background: '#f1f5f9', borderRadius: 4, padding: '2px 6px', width: 'fit-content', margin: '0 auto' }}>
                                                <span style={{ fontWeight: 600 }}>{record.ma_vt}</span>
                                                <span style={{ color: '#cbd5e1' }}>|</span>
                                                <span>{record.dvt}</span>
                                            </div>
                                        </div>
                                    </div>
                                )
                            },
                       
                            { title: "KM", dataIndex: "km_yn", width: 50, align: "center", render: (v, record) => (
                                <Checkbox
                                    checked={!!v}
                                    disabled={!isEditMode}
                                    onChange={(e) => handleCellChange(record, "km_yn", e.target.checked ? 1 : 0)}
                                />
                            ) },
                            { title: "SL", dataIndex: "so_luong", width: 80, align: "center", render: (v, record) => isEditMode ? (
                                <InputNumber 
                                    size="small" 
                                    value={v} 
                                    controls={false} 
                                    formatter={val => numFmt(val)}
                                    parser={val => val.replace(/\$\s?|(,*)/g, '')}
                                    onChange={(val) => handleCellChange(record, "so_luong", val)} 
                                    style={{ width: '100%', textAlign: 'right' }} 
                                />
                            ) : numFmt(v) },
                            { title: "Tồn", dataIndex: "ton13", width: 65, align: "center", render: (v) => numFmt(v) },
                            { title: "Giá niêm yết", dataIndex: "gia_ban_nt", width: 100, align: "center", render: (v, record) => isEditMode ? (
                                <InputNumber 
                                    size="small" 
                                    value={v} 
                                    controls={false} 
                                    precision={2}
                                    formatter={val => `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                    parser={val => val.replace(/\$\s?|(,*)/g, '')}
                                    onChange={(val) => handleCellChange(record, "gia_ban_nt", val)} 
                                    style={{ width: '100%' }} 
                                />
                            ) : numFmt(v, 2) },
                            { title: "Giá bán", dataIndex: "gia_nt2", width: 100, align: "center", render: (v, record) => isEditMode ? (
                                <InputNumber 
                                    size="small" 
                                    value={v} 
                                    controls={false} 
                                    precision={2}
                                    formatter={val => `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                    parser={val => val.replace(/\$\s?|(,*)/g, '')}
                                    onChange={(val) => handleCellChange(record, "gia_nt2", val)} 
                                    style={{ width: '100%' }} 
                                />
                            ) : numFmt(v, 2) },
                            { title: "Tiền hàng", dataIndex: "tien_nt2", width: 110, align: "center", render: (v, record) => isEditMode ? (
                                <InputNumber 
                                    size="small" 
                                    value={v} 
                                    controls={false} 
                                    formatter={val => numFmt(val)}
                                    parser={val => val.replace(/\$\s?|(,*)/g, '')}
                                    onChange={(val) => handleCellChange(record, "tien_nt2", val)} 
                                    style={{ width: '100%', textAlign: 'right' }} 
                                />
                            ) : numFmt(v) },
                            { title: "CK%", dataIndex: "tl_ck", width: 70, align: "center", render: (v) => (v ? `${v}%` : "") },
                            { title: "Tiền CK", dataIndex: "ck_nt", width: 90, align: "center", render: (v, record) => isEditMode ? (
                                <InputNumber 
                                    size="small" 
                                    value={v} 
                                    controls={false} 
                                    formatter={val => numFmt(val)}
                                    parser={val => val.replace(/\$\s?|(,*)/g, '')}
                                    onChange={(val) => handleCellChange(record, "ck_nt", val)} 
                                    style={{ width: '100%', textAlign: 'right' }} 
                                />
                            ) : (v ? numFmt(v) : "") },
                            { title: "Thuế", dataIndex: "thue_nt", width: 90, align: "center", render: (v, record) => isEditMode ? (
                                <InputNumber 
                                    size="small" 
                                    value={v} 
                                    controls={false} 
                                    formatter={val => numFmt(val)}
                                    parser={val => val.replace(/\$\s?|(,*)/g, '')}
                                    onChange={(val) => handleCellChange(record, "thue_nt", val)} 
                                    style={{ width: '100%', textAlign: 'right' }} 
                                />
                            ) : numFmt(v) },
                            { title: "Mã thuế", dataIndex: "ma_thue", width: 80, align: "center", render: (v, record) => isEditMode ? (
                                <Input size="small" value={v} onChange={(e) => handleCellChange(record, "ma_thue", e.target.value)} />
                            ) : v },
                            { title: "Ngày giao", dataIndex: "ngay_giao", width: 120, align: "center", render: (v, record) => {
                                const dateVal = v || record.ngay_gh || record.ngay_ct0 || record.fdate1;
                                return isEditMode ? (
                                    <DatePicker 
                                        size="small" 
                                        value={dateVal && dayjs(dateVal).year() > 1900 ? dayjs(dateVal) : null} 
                                        format="DD/MM/YYYY"
                                        onChange={(date) => handleCellChange(record, "ngay_giao", date ? date.format("YYYY-MM-DD") : null)} 
                                    />
                                ) : (dateVal && dayjs(dateVal).year() > 1900 ? dayjs(dateVal).format("DD/MM/YYYY") : "")
                            }},
                            { title: "Ghi chú giao hàng", dataIndex: "ghi_chu", width: 120, align: "center", render: (v, record) => isEditMode ? (
                                <Input size="small" value={v} onChange={(e) => handleCellChange(record, "ghi_chu", e.target.value)} />
                            ) : v },
                            {
                                title: "Hành động",
                                key: "action",
                                width: 80,
                                fixed: "right",
                                align: "center",
                                render: (_, record) => (
                                    <Button
                                        type="text"
                                        danger
                                        icon={<DeleteOutlined />}
                                        disabled={!isEditMode}
                                        onClick={() => {
                                            const newData = chiTietData.filter(item => item.line_nbr !== record.line_nbr);
                                            setChiTietData(newData);
                                            updateTotals(newData, chiPhiData);
                                            message.success("Đã xóa mã hàng khỏi đơn");
                                        }}
                                    />
                                )
                            },
                        ]}
                        pagination={{
                            pageSize: 10,
                            size: "small",
                            showSizeChanger: false,
                            simple: true,
                            align: "center",
                            style: { marginTop: 16, marginBottom: 16 }
                        }}
                        bordered
                        scroll={{ x: 1250 }}
                        rowKey={(r) => r.stt_rec + "_" + r.line_nbr}
                    />
                </div>
            ),
        },

        {
            key: "chi_phi",
            label: "Chi phí",
            children: (
                <div>
                    {isEditMode && (
                        <div style={{ marginBottom: 10, display: "flex", gap: 6 }}>
                            <Button 
                                icon={<PlusOutlined />} 
                                size="small" 
                                onClick={() => {
                                    setChiPhiData([...chiPhiData, { ma_cp: "", ten_cp: "", tien_cp: 0, ghi_chu: "", line_nbr: Date.now() }]);
                                }}
                            />
                            <Button 
                                icon={<DeleteOutlined />} 
                                size="small" 
                                danger 
                                onClick={() => {
                                    setChiPhiData(prev => prev.slice(0, -1));
                                    message.success("Đã xóa dòng chi phí cuối cùng");
                                }}
                            />
                        </div>
                    )}
                    <Table
                        size="small"
                        dataSource={chiPhiData}
                        columns={chiPhiColumns}
                        rowKey={(r) => r.ma_cp || r.line_nbr}
                        pagination={false}
                        bordered
                    />
                </div>
            ),
        },
        {
            key: "khieu_nai",
            label: "Khiếu nại",
            children: (
                <div>
                    <div className="detail-don-hang__complaint-grid">
                        <Form.Item name="hang_bi_loi" valuePropName="checked" noStyle><Checkbox>Hàng bị lỗi</Checkbox></Form.Item>
                        <Form.Item name="khong_tra_cuoc" valuePropName="checked" noStyle><Checkbox>Không trả cước</Checkbox></Form.Item>
                        <Form.Item name="giao_nham_hang" valuePropName="checked" noStyle><Checkbox>Giao nhầm hàng</Checkbox></Form.Item>
                        <Form.Item name="thua_thieu_hang" valuePropName="checked" noStyle><Checkbox>Thừa thiếu hàng</Checkbox></Form.Item>
                        <Form.Item name="khieu_nai_gia" valuePropName="checked" noStyle><Checkbox>Khiếu nại giá</Checkbox></Form.Item>
                        <Form.Item name="doi_tra_hang" valuePropName="checked" noStyle><Checkbox>Đổi trả hàng hóa</Checkbox></Form.Item>
                        <Form.Item name="hang_date_gan" valuePropName="checked" noStyle><Checkbox>Hàng Date gần không báo</Checkbox></Form.Item>
                        <Form.Item name="van_chuyen_cham" valuePropName="checked" noStyle><Checkbox>Vận chuyển chậm</Checkbox></Form.Item>
                        <Form.Item name="van_de_khac" valuePropName="checked" noStyle><Checkbox>Vấn đề khác</Checkbox></Form.Item>
                    </div>
                    <div style={{ marginTop: 16 }}>
                        <Form.Item name="y_kien_kh" label="Ý kiến khách hàng"><Input.TextArea rows={2} /></Form.Item>
                        <Form.Item name="phan_hoi" label="Phản hồi khiếu nại"><Input.TextArea rows={2} /></Form.Item>
                        <Row gutter={24}>
                            <Col span={12}><Form.Item name="ngay_khieu_nai" label="Ngày khiếu nại"><DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} /></Form.Item></Col>
                            <Col span={12}><Form.Item name="ngay_phan_hoi" label="Ngày phản hồi"><DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} /></Form.Item></Col>
                        </Row>
                    </div>
                </div>
            ),
        },
        { key: "khac", label: "Khác", children: <div style={{ minHeight: 120, color: '#94a3b8', padding: 20 }}>Chưa có dữ liệu</div> },
        { key: "dinh_kem", label: "Tệp đính kèm", children: <div style={{ minHeight: 120, color: '#94a3b8', padding: 20 }}>Chưa có tệp đính kèm</div> },
        { key: "anh_web", label: "Ảnh Web", children: <div style={{ minHeight: 120, color: '#94a3b8', padding: 20 }}>Chưa có ảnh</div> },
    ];

    if (loading && !isEditMode) {
        return (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}>
                <Spin size="large" />
            </div>
        );
    }

    return (
        <div className="detail-don-hang">
            <div className="detail-don-hang__card">
                <Form
                    form={form}
                    layout="vertical"
                    className="phieu-form--floating"
                    disabled={!isEditMode && !!stt_rec}
                    size="middle"
                    colon={false}
                    onValuesChange={handleFormValuesChange}
                >
                    {/* Hidden fields to support useWatch for header display */}
                    <Form.Item name="bcontract_id" noStyle><Input type="hidden" /></Form.Item>
                    <Form.Item name="so_ct" noStyle><Input type="hidden" /></Form.Item>
                    <Form.Item name="ngay_ct" noStyle><Input type="hidden" /></Form.Item>
                    <Form.Item name="ma_kh" noStyle><Input type="hidden" /></Form.Item>
                    <Form.Item name="tl_ck_voucher" noStyle><Input type="hidden" /></Form.Item>
                    
                    {/* ===== HEADER ===== */}
                    <div className="detail-don-hang__header">
                        <Button
                            type="text"
                            icon={<LeftOutlined />}
                            className="phieu-back-button"
                            onClick={() => navigate(-1)}
                            disabled={false}
                        />

                        <div className="phieu-header-info">
                            <div className="phieu-header-tags">
                                <span className={`phieu-header-badge ${!stt_rec ? 'phieu-header-badge--green' : isEditMode ? 'phieu-header-badge--orange' : 'phieu-header-badge--blue'}`}>
                                    {stt_rec ? (isEditMode ? "SỬA ĐƠN HÀNG" : "CHI TIẾT ĐƠN HÀNG") : "THÊM ĐƠN HÀNG MỚI"}
                                </span>
                            </div>

                            <div className="phieu-header-meta-stack">
                                {stt_rec && (
                                    <div className="phieu-header-meta-item">
                                        ĐƠN HÀNG: <span className="phieu-header-meta-value">
                                            {watchSoCt || '.........'} 
                                            {watchBContractId && (
                                                <span className="phieu-header-meta-sequence">
                                                    ({watchBContractId})
                                                </span>
                                            )}
                                        </span>
                                    </div>
                                )}
                                <div className="phieu-header-meta-item">
                                    NGÀY: <span className="phieu-header-meta-value">{watchNgayCt ? dayjs(watchNgayCt).format('DD/MM/YYYY') : '.........'}</span>
                                </div>
                                <div className="phieu-header-status-row">
                                    <span className="phieu-header-status-label">TRẠNG THÁI:</span>
                                    <Form.Item name="status" noStyle>
                                        <Select 
                                            size="small"
                                            className="phieu-header-status-select"
                                            dropdownMatchSelectWidth={false}
                                        >
                                            {statusList.length > 0 ? (
                                                statusList.map((s) => (
                                                    <Select.Option key={s.status} value={String(s.status).trim()}>
                                                        {String(s.status).trim()}. {s.statusname}
                                                    </Select.Option>
                                                ))
                                            ) : (
                                                <>
                                                    <Select.Option value="0">0. Lập chứng từ</Select.Option>
                                                    <Select.Option value="1">1. Chờ duyệt</Select.Option>
                                                    <Select.Option value="2">2. Duyệt</Select.Option>
                                                    <Select.Option value="4">4. Hoàn tất</Select.Option>
                                                    <Select.Option value="6">6. Đã hủy</Select.Option>
                                                </>
                                            )}
                                        </Select>
                                    </Form.Item>
                                </div>
                            </div>
                        </div>

                        <div className="detail-don-hang__header-right">
                            {stt_rec && !isEditMode ? (
                                <Button
                                    type="text"
                                    icon={<EditOutlined />}
                                    className="detail-don-hang__edit-btn"
                                    onClick={handleToggleEdit}
                                    title="Chỉnh sửa"
                                    disabled={false}
                                />
                            ) : (
                                <div style={{ width: 36 }}></div>
                            )}
                        </div>
                    </div>

                    {/* ===== BODY ===== */}
                    <div className="detail-don-hang__body">
                        {/* ---- Thông tin chung ---- */}
                        <div className="detail-don-hang__section" style={{ marginBottom: 16 }}>
                            {/* ---- Khách hàng (Dòng riêng trên cùng) ---- */}
                            <div style={{ 
                                display: 'flex', 
                                alignItems: 'flex-end', 
                                gap: '12px',
                                paddingBottom: showGeneralInfo ? '16px' : '0',
                                borderBottom: showGeneralInfo ? '1px solid #f0f0f0' : 'none',
                                marginBottom: showGeneralInfo ? '16px' : '0'
                            }}>
                                <div style={{ flex: 1 }}>
                                    {!stt_rec ? (
                                        <div style={{ display: 'flex', gap: '8px', flex: 1 }}>
                                            <div style={{ flex: 1 }}>
                                                <Form.Item name="ten_kh" label="Tên khách hàng" style={{ marginBottom: 0 }}>
                                                    <Select
                                                        showSearch
                                                        placeholder="Tìm theo tên hoặc mã khách hàng"
                                                        loading={khSearchLoading}
                                                        onSearch={(val) => handleSearchKh(val, "ten_kh")}
                                                        onFocus={() => !khSelectOptions.length && handleSearchKh("", "ten_kh")}
                                                        onChange={(val) => {
                                                            const opt = khSelectOptions.find(o => o.value === val);
                                                            if (opt) {
                                                                form.setFieldsValue({ 
                                                                    ma_kh: opt.ma_kh,
                                                                    ten_kh: opt.ten_kh 
                                                                });
                                                            }
                                                        }}
                                                        filterOption={false}
                                                        options={khSelectOptions}
                                                    />
                                                </Form.Item>
                                            </div>
                                        </div>
                                    ) : (
                                        <Form.Item name="khach_hang_display" noStyle>
                                            <Input disabled className="customer-display" />
                                        </Form.Item>
                                    )}
                                </div>

                                <Button
                                    type="text"
                                    disabled={false}
                                    icon={showGeneralInfo ? <UpOutlined /> : <DownOutlined />}
                                    onClick={toggleGeneralInfo}
                                    style={{ 
                                        color: "#6c63ff", 
                                        height: '32px',
                                        width: '40px',
                                        background: 'rgba(108, 99, 255, 0.05)',
                                        borderRadius: '8px',
                                        opacity: 1,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                />
                            </div>

                            {/* ---- Lưới thông tin chi tiết ---- */}
                            {showGeneralInfo && (
                                <Row gutter={[16, 0]}>
                                    {/* Left Column: Who - Where - How */}
                                    <Col xs={24} lg={11}>
                                        <Row gutter={16}>
                                            <Col span={24}>
                                                <Form.Item name="ma_nvbh" label="NVKD">
                                                    <Select
                                                        showSearch
                                                        placeholder="Chọn NVKD"
                                                        loading={nvSearchLoading}
                                                        onSearch={handleSearchNv}
                                                        onFocus={() => !nvSelectOptions.length && handleSearchNv("")}
                                                        filterOption={false}
                                                        options={nvSelectOptions}
                                                    />
                                                </Form.Item>
                                            </Col>
                                        </Row>
                                        <Row gutter={16}>
                                            <Col span={24}>
                                                <Form.Item name="ma_tt" label="Mã TT">
                                                    <Select
                                                        showSearch
                                                        placeholder="Chọn Mã TT"
                                                        loading={ttSearchLoading}
                                                        onSearch={handleSearchTt}
                                                        onFocus={() => !ttSelectOptions.length && handleSearchTt("")}
                                                        filterOption={false}
                                                        options={ttSelectOptions}
                                                    />
                                                </Form.Item>
                                            </Col>
                                        </Row>
                                        
                                        <Form.Item name="dien_giai" label="Diễn giải">
                                            <Input.TextArea autoSize={{ minRows: 1, maxRows: 6 }} style={{ borderRadius: '6px' }} />
                                        </Form.Item>
                                        <Form.Item name="ghi_chu_kh" label="Ghi chú KH">
                                            <Input.TextArea autoSize={{ minRows: 1, maxRows: 6 }} style={{ borderRadius: '6px' }} />
                                        </Form.Item>
                                    </Col>

                                    {/* Right Column: Other Info */}
                                    <Col xs={24} lg={{ span: 11, offset: 1 }}>
                                        <Row gutter={16}>
                                            <Col span={12}>
                                                <Form.Item name="loai_ct" label="Loại CT" hidden>
                                                    <Select>
                                                        <Select.Option value="1">1. Bán hàng</Select.Option>
                                                        <Select.Option value="2">2. Trả hàng</Select.Option>
                                                        <Select.Option value="3">3. Khác</Select.Option>
                                                    </Select>
                                                </Form.Item>
                                            </Col>
                                            <Col span={12}>
                                                <Form.Item name="ty_gia" label="Tỷ giá" hidden>
                                                    <InputNumber controls={false} style={{ width: '100%' }} />
                                                </Form.Item>
                                            </Col>
                                        </Row>
                                        <Row gutter={16}>
                                            <Col span={12}>
                                                <Form.Item name="hinh_thuc_tt" label="Hình thức">
                                                    <Select>
                                                        <Select.Option value="1">1. Chuyển khoản</Select.Option>
                                                        <Select.Option value="2">2. Tiền mặt</Select.Option>
                                                        <Select.Option value="3">3. COD</Select.Option>
                                                    </Select>
                                                </Form.Item>
                                            </Col>
                                            <Col span={12}>
                                                <Form.Item name="kh_chiu_cuoc" label="Cước phí">
                                                    <Select>
                                                        <Select.Option value={1}>1. Khách chịu</Select.Option>
                                                        <Select.Option value={0}>0. Shop chịu</Select.Option>
                                                    </Select>
                                                </Form.Item>
                                            </Col>
                                        </Row>
                                        <Row gutter={16}>
                                            <Col span={24}>
                                                <Form.Item name="ma_vc" label="P.tiện d.chuyển">
                                                    <Select
                                                        showSearch
                                                        placeholder="Chọn phương tiện vận chuyển"
                                                        loading={vcSearchLoading}
                                                        onSearch={handleSearchVc}
                                                        onFocus={() => !vcSelectOptions.length && handleSearchVc("")}
                                                        filterOption={false}
                                                        options={vcSelectOptions}
                                                        style={{ borderRadius: '6px' }}
                                                    />
                                                </Form.Item>
                                            </Col>
                                        </Row>
                                        <Form.Item name="dia_chi" label="Nơi giao">
                                            <Input.TextArea autoSize={{ minRows: 1, maxRows: 6 }} style={{ borderRadius: '6px' }} />
                                        </Form.Item>
                                        <Form.Item name="ghi_chu_giao_hang" label="Ghi chú giao hàng">
                                            <Input.TextArea autoSize={{ minRows: 1, maxRows: 6 }} style={{ borderRadius: '6px' }} />
                                        </Form.Item>
                                    </Col>
                                </Row>
                            )}
                        </div>

                        {/* ---- Tabs ---- */}
                        <Tabs
                            defaultActiveKey="chi_tiet"
                            items={tabItems}
                            className="detail-don-hang__tabs"
                        />

                        {/* ---- Tổng tiền ---- */}
                        <div className="detail-don-hang__totals">
                            <Row gutter={[32, 0]}>
                                {/* --- Cột bên trái: Các khoản giảm trừ & Chi phí --- */}
                                <Col xs={24} lg={12}>
                                    <Form.Item name="the_voucher" label="Thẻ voucher">
                                        <Select
                                            showSearch
                                            placeholder="Chọn thẻ voucher"
                                            loading={voucherSearchLoading}
                                            onSearch={handleSearchVoucher}
                                            onFocus={() => !voucherSelectOptions.length && handleSearchVoucher("")}
                                            onChange={(val) => {
                                                const opt = voucherSelectOptions.find(o => o.value === val);
                                                if (opt) {
                                                    const headerValues = form.getFieldsValue();
                                                    // Calculate current items total
                                                    const currentTien2 = chiTietData.reduce((sum, row) => sum + parseFloat(row.tien_nt2 || 0), 0);
                                                    
                                                    const ck_tien = parseFloat(opt.tien_ck || 0);
                                                    const ck_phantram = parseFloat(opt.tl_ck || 0);
                                                    
                                                    let tienck = 0;
                                                    if (ck_tien !== 0) {
                                                        tienck = ck_tien;
                                                        // If it's fixed, we clear tl_ck_voucher so it doesn't recalculate on total changes
                                                        form.setFieldsValue({
                                                            t_ck_voucher: Math.round(tienck),
                                                            tl_ck_voucher: 0
                                                        });
                                                    } else if (ck_phantram !== 0) {
                                                        tienck = currentTien2 * (ck_phantram / 100);
                                                        form.setFieldsValue({
                                                            t_ck_voucher: Math.round(tienck),
                                                            tl_ck_voucher: ck_phantram
                                                        });
                                                    } else {
                                                        form.setFieldsValue({
                                                            t_ck_voucher: 0,
                                                            tl_ck_voucher: 0
                                                        });
                                                    }
                                                } else {
                                                    form.setFieldsValue({
                                                        t_ck_voucher: 0,
                                                        tl_ck_voucher: 0
                                                    });
                                                }
                                                updateTotals(chiTietData, chiPhiData);
                                            }}
                                            filterOption={false}
                                            options={voucherSelectOptions}
                                            allowClear
                                            disabled={!watchMaKh}
                                        />
                                    </Form.Item>
                                    <Form.Item name="t_ck_tt" label="CK tổng đơn">
                                        <InputNumber controls={false} style={{ width: "100%", textAlign: "right" }} formatter={v => numFmt(v)} />
                                    </Form.Item>
                                    <Form.Item name="t_ck" label="Tiền chiết khấu">
                                        <InputNumber controls={false} style={{ width: "100%", textAlign: "right" }} formatter={v => numFmt(v)} />
                                    </Form.Item>
                                    <Form.Item name="tien_cp" label="Chi phí">
                                        <InputNumber controls={false} style={{ width: "100%", textAlign: "right" }} formatter={v => numFmt(v)} />
                                    </Form.Item>
                                </Col>

                                {/* --- Cột bên phải: Tiền hàng, Thuế & Tổng cộng --- */}
                                <Col xs={24} lg={12}>
                                    <Form.Item name="t_tien2" label="Tiền hàng">
                                        <InputNumber controls={false} style={{ width: "100%", textAlign: "right" }} disabled formatter={v => numFmt(v)} />
                                    </Form.Item>
                                    <Form.Item name="t_ck_voucher" label="CK voucher">
                                        <InputNumber controls={false} style={{ width: "100%", textAlign: "right" }} disabled formatter={v => numFmt(v)} />
                                    </Form.Item>
                                    <Form.Item name="t_thue_nt" label="Tiền thuế">
                                        <InputNumber controls={false} style={{ width: "100%", textAlign: "right" }} disabled formatter={v => numFmt(v)} />
                                    </Form.Item>

                                    <div className="total-grand-divider" style={{ borderTop: '1px solid #f0f0f0', paddingTop: '16px', marginTop: '8px' }}>
                                        <Form.Item name="tong_cong" label="Tổng cộng" className="detail-don-hang__totals-grand">
                                            <InputNumber controls={false} style={{ width: "100%", textAlign: "right" }} disabled formatter={v => numFmt(v)} />
                                        </Form.Item>
                                    </div>
                                </Col>
                            </Row>
                        </div>

                        {/* ---- Actions ---- */}
                        {(isEditMode || !stt_rec) && (
                            <div className="detail-don-hang__actions">
                                <Button type="primary" icon={<SaveOutlined />} onClick={handleSubmit} loading={loading}>
                                    Lưu
                                </Button>
                                <Button icon={<CloseCircleOutlined />} onClick={() => navigate("/kinh-doanh/danh-sach")}>
                                    Hủy
                                </Button>
                            </div>
                        )}
                    </div>
                </Form>
            </div>
            <QRScanner
                isOpen={showQRScanner}
                onClose={() => setShowQRScanner(false)}
                onScanSuccess={handleQRScanSuccess}
                onSwitchToBarcode={handleSwitchToBarcodeMode}
                openWithCamera={true}
            />
        </div>
    );
};

export default DetailPhieuKinhDoanh;
