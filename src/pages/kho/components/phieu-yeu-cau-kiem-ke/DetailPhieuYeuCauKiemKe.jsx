import { Button, Checkbox, Col, Empty, Form, Input, InputNumber, Layout, Modal, Row, Select, Space, Table, Spin, notification, Popconfirm, Tabs, Tag, Descriptions, Divider, DatePicker, Typography } from "antd";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { LeftOutlined, PlusOutlined, DeleteOutlined, EditOutlined, SaveOutlined, CloseOutlined, CheckCircleOutlined, SearchOutlined, CheckOutlined, FilterOutlined, ReloadOutlined } from "@ant-design/icons";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import dayjs from "dayjs";
import https from "../../../../utils/https";
import { getLoItem, searchVatTu } from "../../../../api";
import { useSelector } from "react-redux";
import showConfirm from "../../../../components/common/Modal/ModalConfirm";
import "../common-phieu.css";

const { Content } = Layout;
const { Title } = Typography;

const DetailPhieuYeuCauKiemKe = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const location = useLocation();

    const userInfo = useSelector((state) => state?.claimsReducer?.userInfo || {});
    const token = localStorage.getItem("access_token");
    const currentUserId = userInfo?.id || userInfo?.userId || 1;

    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    // Ngăn chặn gọi API double khi thay đổi bộ lọc
    const filterChangeFromSearchRefKKSS = React.useRef(false);
    const filterChangeFromSearchRefKKCT = React.useRef(false);
    const [loadingKKSS, setLoadingKKSS] = useState(false);
    const [loadingKKCT, setLoadingKKCT] = useState(false);

    // Tab 1: Vật tư CẦN kiểm kê (api_get_list_kkss)
    const [dataCanKiemKe, setDataCanKiemKe] = useState([]);
    const [paginationKKSS, setPaginationKKSS] = useState({ current: 1, pageSize: 25, total: 0 });
    const [filterKKSS, setFilterKKSS] = useState({ ma_vt: "", ten_vt: "", ma_lo: "", ma_kho: "", ma_vi_tri: "", ma_vung: "" });

    // Tab 2: Vật tư ĐÃ kiểm kê (api_get_list_kkct)
    const [dataDaKiemKe, setDataDaKiemKe] = useState([]);
    const [paginationKKCT, setPaginationKKCT] = useState({ current: 1, pageSize: 25, total: 0 });
    const [filterKKCT, setFilterKKCT] = useState({ ma_vt: "", ten_vt: "", ma_lo: "", ma_kho: "", ma_vi_tri: "", ma_vung: "", ng_tao: "" });

    // Edit state cho Tab 2
    const [editingKey, setEditingKey] = useState("");
    const isEditing = useCallback((record) => record.line_nbr === editingKey, [editingKey]);

    // Header info từ location.state 
    const [headerProps, setHeaderProps] = useState({
        ngay_ct: location.state?.ngay_ct || dayjs().format("YYYY-MM-DD"),
        so_ct: location.state?.so_ct || "",
        ma_kho: location.state?.ma_kho || "",
    });

    // Trạng thái số lượng nhập nhanh cho từng dòng Tab 1
    const [quickQty, setQuickQty] = useState({});

    // Modal kiểm tra vật tư
    const [checkModalVisible, setCheckModalVisible] = useState(false);
    const [checkLoading, setCheckLoading] = useState(false);
    const [vtCheckInfo, setVtCheckInfo] = useState(null);       // Bảng 2: thông tin VT
    const [dsLoYeuCau, setDsLoYeuCau] = useState([]);           // Bảng 3: Lô yêu cầu (Case 1)
    const [dsLoGoiY, setDsLoGoiY] = useState([]);               // Bảng 4: Lô gợi ý (Case 2)
    const [selectedLots, setSelectedLots] = useState({});       // { maLo: soLuong } - chọn nhiều lô
    const [loSearchOptions, setLoSearchOptions] = useState([]);  // kết quả tìm kiếm mã lô
    const [cachedLoHsd, setCachedLoHsd] = useState({}); // { [maLo]: "DD/MM/YYYY" }
    const [loSearchLoading, setLoSearchLoading] = useState(false);
    const [selectedSearchLots, setSelectedSearchLots] = useState([]); // các mã lô tạm thời chọn trong dropdown
    const [searchQty, setSearchQty] = useState(0); // SL nhập nhanh khi tìm lô

    // Tìm kiếm đổi vật tư
    const [vtSearchLoading, setVtSearchLoading] = useState(false);
    const [vtSearchOptions, setVtSearchOptions] = useState([]);
    const [invalidLots, setInvalidLots] = useState({}); // { [maLo]: true } - lô chưa nhập SL

    // Modal tạo lô mới
    const [newLotModalVisible, setNewLotModalVisible] = useState(false);
    const [newLotForm, setNewLotForm] = useState({ maLo: "", tenLo: "", hsd: null, soLuong: 0 });
    const [createdLots, setCreatedLots] = useState({}); // { [maLo]: { hsd: 'YYYY-MM-DD' } }

    // ==================== API: Tab 1 - Vật tư CẦN kiểm kê (api_get_list_kkss) ====================
    const fetchCanKiemKe = useCallback(async (page = 1, pageSize = 25, filters = filterKKSS) => {
        setLoadingKKSS(true);
        try {
            const body = {
                store: "api_get_list_kkss",
                param: {
                    stt_rec_yc: id,
                    ngay_ct: headerProps.ngay_ct,
                    ma_vt: filters.ma_vt || "",
                    ten_vt: filters.ten_vt || "",
                    ma_lo: filters.ma_lo || "",
                    ma_kho: filters.ma_kho || "",
                    ma_vi_tri: filters.ma_vi_tri || "",
                    ma_vung: filters.ma_vung || "",
                    UserId: currentUserId,
                    PageIndex: page,
                    PageSize: pageSize,
                },
                data: {},
            };
            const response = await https.post("User/AddData", body, {
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            });

            const listObj = response.data?.listObject;
            let items = [];
            let totalCount = 0;
            if (listObj?.dataLists) {
                items = listObj.dataLists.data || [];
                const pag = listObj.dataLists.pagination?.[0] || {};
                totalCount = pag.totalCount ?? pag.TotalCount ?? pag.totalRecord ?? pag.TotalRecord ?? pag.Total_Row ?? pag.total_row ?? items.length;
            } else if (Array.isArray(listObj)) {
                items = Array.isArray(listObj[0]) ? listObj[0] : [];
                if (listObj[1] && Array.isArray(listObj[1]) && listObj[1][0]) {
                    const pag = listObj[1][0];
                    totalCount = pag.totalCount ?? pag.TotalCount ?? pag.totalRecord ?? pag.TotalRecord ?? pag.Total_Row ?? pag.total_row ?? items.length;
                }
            }
            setDataCanKiemKe(items);
            setPaginationKKSS({ current: page, pageSize, total: totalCount });

            // Cập nhật header info nếu thiếu
            if (items.length > 0) {
                const first = items[0];
                if (!headerProps.ma_kho && first.ma_kho) {
                    setHeaderProps(prev => ({ ...prev, ma_kho: first.ma_kho.trim() }));
                }
                if (!headerProps.so_ct && first.so_ct) {
                    setHeaderProps(prev => ({ ...prev, so_ct: first.so_ct.trim() }));
                }
            }
        } catch (error) {
            console.error("Lỗi lấy vật tư cần kiểm kê:", error);
            notification.error({ message: "Không thể lấy danh sách vật tư cần kiểm kê" });
        } finally {
            setLoadingKKSS(false);
        }
    }, [id, headerProps.ngay_ct, currentUserId, token, filterKKSS]);

    // ==================== API: Tab 2 - Vật tư ĐÃ kiểm kê (api_get_list_kkct) ====================
    const fetchDaKiemKe = useCallback(async (page = 1, pageSize = 25, filters = filterKKCT) => {
        setLoadingKKCT(true);
        try {
            const body = {
                store: "api_get_list_kkct",
                param: {
                    stt_rec_yc: id,
                    ngay_ct: headerProps.ngay_ct ? dayjs(headerProps.ngay_ct).format("YYYY-MM-DD") : "",
                    ma_vt: filters.ma_vt || "",
                    ten_vt: filters.ten_vt || "",
                    ng_tao: filters.ng_tao || "",
                    ma_lo: filters.ma_lo || "",
                    ma_kho: filters.ma_kho || "",
                    ma_vi_tri: filters.ma_vi_tri || "",
                    ma_vung: filters.ma_vung || "",
                    UserId: currentUserId,
                    PageIndex: page,
                    PageSize: pageSize,
                },
                data: {},
            };
            const response = await https.post("User/AddData", body, {
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            });

            const listObj = response.data?.listObject;
            let items = [];
            let totalCount = 0;
            if (listObj?.dataLists) {
                items = listObj.dataLists.data || [];
                const pag = listObj.dataLists.pagination?.[0] || {};
                totalCount = pag.totalCount ?? pag.TotalCount ?? pag.totalRecord ?? pag.TotalRecord ?? pag.Total_Row ?? pag.total_row ?? items.length;
            } else if (Array.isArray(listObj)) {
                items = Array.isArray(listObj[0]) ? listObj[0] : [];
                if (listObj[1] && Array.isArray(listObj[1]) && listObj[1][0]) {
                    const pag = listObj[1][0];
                    totalCount = pag.totalCount ?? pag.TotalCount ?? pag.totalRecord ?? pag.TotalRecord ?? pag.Total_Row ?? pag.total_row ?? items.length;
                }
            }
            setDataDaKiemKe(items);
            setPaginationKKCT({ current: page, pageSize, total: totalCount });

            // Cập nhật header info nếu thiếu (phòng trường hợp tab 1 trống)
            if (items.length > 0) {
                const first = items[0];
                if (!headerProps.ma_kho && first.ma_kho) {
                    setHeaderProps(prev => ({ ...prev, ma_kho: first.ma_kho.trim() }));
                }
                if (!headerProps.so_ct && first.so_ct) {
                    setHeaderProps(prev => ({ ...prev, so_ct: first.so_ct.trim() }));
                }
            }
        } catch (error) {
            console.error("Lỗi lấy vật tư đã kiểm kê:", error);
            notification.error({ message: "Không thể lấy danh sách vật tư đã kiểm kê" });
        } finally {
            setLoadingKKCT(false);
        }
    }, [id, headerProps.ngay_ct, currentUserId, token, filterKKCT]);

    // ==================== Init ====================
    useEffect(() => {
        if (id) {
            fetchCanKiemKe();
            fetchDaKiemKe();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    // Làm tươi mềm: gọi lại API lấy data mới nhất (không reload trang)
    useEffect(() => {
        const handler = () => {
            if (id) {
                fetchCanKiemKe(1, paginationKKSS.pageSize, filterKKSS);
                fetchDaKiemKe(1, paginationKKCT.pageSize, filterKKCT);
            }
        };
        window.addEventListener("appRefreshRequested", handler);
        return () => window.removeEventListener("appRefreshRequested", handler);
    }, [id, paginationKKSS.pageSize, filterKKSS, paginationKKCT.pageSize, filterKKCT, fetchCanKiemKe, fetchDaKiemKe]);

    const handleRefreshClick = useCallback(() => {
        fetchCanKiemKe(1, paginationKKSS.pageSize, filterKKSS);
        fetchDaKiemKe(1, paginationKKCT.pageSize, filterKKCT);
    }, [paginationKKSS.pageSize, filterKKSS, paginationKKCT.pageSize, filterKKCT, fetchCanKiemKe, fetchDaKiemKe]);

    // ==================== API: Tìm kiếm vật tư để add (api_check_vt_kiem_ke) ====================
    const handleCheckVtKiemKe = useCallback(async (record) => {
        setCheckLoading(true);
        try {
            const body = {
                store: "api_check_vt_kiem_ke",
                data: {},
                param: {
                    stt_rec_yc: id,
                    ngay_ct: headerProps.ngay_ct,
                    ma_vt: record.ma_vt,
                    ma_kho: record.ma_kho || headerProps.ma_kho || "",
                    ma_vung: record.ma_kv || record.ma_vung || "",
                    ma_vi_tri: record.ma_vi_tri || "",
                },
            };

            const res = await https.post("User/AddData", body, {
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            });

            const hasRM = res?.data && typeof res.data.responseModel !== "undefined";
            const isSuccess = hasRM ? res.data.responseModel.isSucceded === true : res?.data?.statusCode === 200;

            if (isSuccess) {
                const listObject = res.data?.listObject || [];
                // Bảng 2: Thông tin VT (listObject[0])
                const vtInfo = Array.isArray(listObject[0]) && listObject[0].length > 0 ? { ...listObject[0][0], image: record.image } : null;
                // Bảng 3: Lô Yêu Cầu - Case 1 (listObject[1])
                const loYeuCau = Array.isArray(listObject[1]) ? listObject[1] : [];
                // Bảng 4: Lô Gợi Ý - Case 2 (listObject[2])
                const loGoiY = Array.isArray(listObject[2]) ? listObject[2] : [];

                setVtCheckInfo(vtInfo);
                setDsLoYeuCau(loYeuCau);
                setDsLoGoiY(loGoiY);
                // Dùng trực tiếp dữ liệu lô từ api_check_vt_kiem_ke (listObject[1]) 
                // để auto-populate selectedLots + cachedLoHsd + loSearchOptions
                const newCachedHsd = {};
                const autoSelectedLots = {};
                const opts = loYeuCau.map(x => {
                    const val = (x?.ma_lo || x?.value || x?.ten_lo || "").toString().trim();
                    let label = val;
                    if (x?.ngay_hhsd || x?.hanLo) {
                        const dateVal = x?.ngay_hhsd || x?.hanLo;
                        const hsdStr = dayjs(dateVal).format("DD/MM/YYYY");
                        label = `${val} - HSD: ${hsdStr}`;
                        newCachedHsd[val] = hsdStr;
                    }
                    // Auto thêm lô vào selectedLots với SL = 0
                    autoSelectedLots[val] = 0;
                    return { value: val, label };
                });

                setSelectedLots(autoSelectedLots);
                setSelectedSearchLots([]);
                setCreatedLots({});
                setCachedLoHsd(newCachedHsd);
                setLoSearchOptions(opts);
                setCheckModalVisible(true);
            } else {
                notification.warning({ message: res.data?.responseModel?.message || `Vật tư ${record.ma_vt} không hợp lệ` });
            }
        } catch (error) {
            console.error("Lỗi check VT:", error);
            notification.error({ message: "Lỗi khi kiểm tra vật tư" });
        } finally {
            setCheckLoading(false);
        }
    }, [id, headerProps.ngay_ct, headerProps.ma_kho, token]);

    // ==================== Xử lý Insert từ Modal ====================
    const handleModalInsert = useCallback(async () => {
        // Validate: tất cả lô đã chọn phải có SL >= 0
        const lotsEntries = Object.entries(selectedLots);

        if (lotsEntries.length === 0) {
            notification.warning({
                message: "Chưa chọn lô",
                description: "Vui lòng chọn hoặc tìm ít nhất 1 lô vật tư để thực hiện kiểm kê."
            });
            return;
        }

        const lotsWithoutQty = lotsEntries.filter(([maLo, sl]) => sl === null || sl === undefined || sl === "" || parseFloat(sl) < 0);
        if (lotsWithoutQty.length > 0) {
            const firstInvalidLo = lotsWithoutQty[0][0];
            const invalidMap = {};
            lotsWithoutQty.forEach(([maLo]) => { invalidMap[maLo] = true; });
            setInvalidLots(invalidMap);

            notification.error({
                message: "Số lượng không hợp lệ",
                description: `Lô "${firstInvalidLo}" chưa được nhập số lượng (>= 0).`
            });

            // Focus và select ô SL lỗi
            setTimeout(() => {
                const el = document.getElementById(`lot-qty-${firstInvalidLo}`);
                if (el) {
                    el.focus();
                    el.select();
                }
            }, 100);
            return;
        }

        setInvalidLots({});

        // Thu thập danh sách lô hợp lệ, loại các lô có SL = 0 để không gửi đi
        const lotsToInsert = lotsEntries
            .filter(([_, sl]) => parseFloat(sl) > 0)
            .map(([maLo, soLuong]) => ({
                maLo,
                soLuong: parseFloat(soLuong)
            }));

        if (lotsToInsert.length === 0) {
            notification.success({ message: `Đã xác nhận thành công (các thay đổi SL = 0 sẽ không gửi lên)` });
            setCheckModalVisible(false);
            return;
        }

        setLoading(true);
        try {
            // Chuẩn bị dữ liệu chi tiết cho DataDetails
            const details = lotsToInsert.map(lot => {
                let hsd = null;
                let ten_lo = lot.maLo;

                if (createdLots[lot.maLo]) {
                    hsd = createdLots[lot.maLo].hsd;
                    ten_lo = createdLots[lot.maLo].tenLo || lot.maLo;
                } else if (cachedLoHsd[lot.maLo]) {
                    const dateStr = cachedLoHsd[lot.maLo];
                    const [d, m, y] = dateStr.split("/");
                    if (d && m && y) hsd = `${y}-${m}-${d}`;
                } else {
                    const opt = loSearchOptions.find(o => o.value === lot.maLo);
                    if (opt && opt.label && opt.label.includes(" - HSD: ")) {
                        const dateStr = opt.label.split(" - HSD: ")[1];
                        const [d, m, y] = dateStr.split("/");
                        if (d && m && y) hsd = `${y}-${m}-${d}`;
                    } else {
                        const loInfo = dsLoYeuCau.find(l => (l.maLo || l.ma_lo || "").trim() === lot.maLo) ||
                            dsLoGoiY.find(l => (l.maLo || l.ma_lo || "").trim() === lot.maLo);
                        if (loInfo && loInfo.hanSuDung) {
                            hsd = dayjs(loInfo.hanSuDung).format("YYYY-MM-DD");
                        }
                    }
                }

                return {
                    ma_lo: lot.maLo,
                    ten_lo: ten_lo,
                    so_luong: lot.soLuong,
                    ngay_hhsd: hsd || ""
                };
            });

            const body = {
                store: "api_insert_kkct",
                data: {},
                param: {
                    stt_rec_yc: id,
                    so_ct_yc: vtCheckInfo?.so_ct_yc || headerProps.so_ct || "",
                    ngay_ct: (vtCheckInfo?.ngay_ct || headerProps.ngay_ct) ? dayjs(vtCheckInfo?.ngay_ct || headerProps.ngay_ct).format("YYYY-MM-DD") : "",
                    ma_kho: vtCheckInfo?.ma_kho || headerProps.ma_kho || "",
                    ma_vung: vtCheckInfo?.ma_vung?.trim() || "",
                    ma_vi_tri: vtCheckInfo?.ma_vi_tri?.trim() || "",
                    ma_vt: vtCheckInfo?.ma_vt?.trim() || "",
                    dvt: vtCheckInfo?.dvt?.trim() || "",
                    UserId: currentUserId,
                    DataDetails: details,
                },
            };

            const res = await https.post("User/AddData", body, {
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            });

            const hasRM = res?.data && typeof res.data.responseModel !== "undefined";
            const isSuccess = hasRM ? res.data.responseModel.isSucceded === true : res?.data?.statusCode === 200;

            if (isSuccess) {
                notification.success({ message: `Đã kiểm kê thành công ${lotsToInsert.length} lô!` });
                setCheckModalVisible(false);
                fetchCanKiemKe(paginationKKSS.current, paginationKKSS.pageSize, filterKKSS);
                fetchDaKiemKe(paginationKKCT.current, paginationKKCT.pageSize, filterKKCT);
            } else {
                notification.error({ message: res.data?.responseModel?.message || res.data?.message || "Thêm kiểm kê thất bại. Vui lòng kiểm tra lại thông tin." });
            }
        } catch (error) {
            console.error(error);
            notification.error({ message: "Lỗi kết nối / xử lý" });
        } finally {
            setLoading(false);
        }
    }, [selectedLots, id, vtCheckInfo, headerProps, currentUserId, token, createdLots, cachedLoHsd, loSearchOptions, dsLoYeuCau, dsLoGoiY, paginationKKSS, filterKKSS, paginationKKCT, filterKKCT, fetchCanKiemKe, fetchDaKiemKe]);

    // ==================== API: Thêm mới kiểm kê (api_insert_kkct) ====================
    const handleInsertKKCT = useCallback(async (record) => {
        const soLuong = quickQty[record.ma_vt] ?? 0;
        if (!soLuong || soLuong <= 0) {
            notification.warning({ message: "Vui lòng nhập số lượng đếm > 0" });
            return;
        }
        setLoading(true);
        try {
            const body = {
                store: "api_insert_kkct",
                data: {},
                param: {
                    stt_rec_yc: id,
                    so_ct_yc: headerProps.so_ct,
                    ngay_ct: headerProps.ngay_ct,
                    ma_kho: record.ma_kho || headerProps.ma_kho,
                    ma_vung: record.ma_kv || record.ma_vung || "",
                    ma_vi_tri: record.ma_vi_tri || "",
                    ma_vt: record.ma_vt,
                    dvt: record.dvt || "",
                    UserId: currentUserId,
                    DataDetails: [{
                        ma_lo: record.ma_lo || "",
                        so_luong: parseFloat(soLuong),
                    }],
                },
            };

            const res = await https.post("User/AddData", body, {
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            });

            const hasRM = res?.data && typeof res.data.responseModel !== "undefined";
            const isSuccess = hasRM ? res.data.responseModel.isSucceded === true : res?.data?.statusCode === 200;

            if (isSuccess) {
                notification.success({ message: `Đã kiểm kê ${record.ma_vt} thành công!` });
                // Reset qty
                setQuickQty((prev) => ({ ...prev, [record.ma_vt]: undefined }));
                // Reload cả 2 tab
                fetchCanKiemKe(paginationKKSS.current, paginationKKSS.pageSize, filterKKSS);
                fetchDaKiemKe(paginationKKCT.current, paginationKKCT.pageSize, filterKKCT);
            } else {
                notification.error({ message: res.data?.responseModel?.message || res.data?.message || "Thêm kiểm kê thất bại" });
            }
        } catch (error) {
            console.error(error);
            notification.error({ message: "Lỗi kết nối / xử lý" });
        } finally {
            setLoading(false);
        }
    }, [quickQty, id, headerProps, currentUserId, token, paginationKKSS, filterKKSS, paginationKKCT, filterKKCT, fetchCanKiemKe, fetchDaKiemKe]);

    // ==================== API: Sửa kiểm kê (api_update_kkct) ====================
    const handleEdit = useCallback((record) => {
        if (editingKey !== "") return;
        form.setFieldsValue({ so_luong: record.so_luong });
        setEditingKey(record.line_nbr);
    }, [editingKey, form]);

    const handleCancelEdit = useCallback(() => {
        setEditingKey("");
        form.resetFields();
    }, [form]);

    const handleSaveEdit = useCallback(async (record) => {
        showConfirm({
            title: 'Xác nhận lưu',
            content: `Bạn muốn cập nhật số lượng cho lô "${record.ma_lo}" là "${form.getFieldValue('so_luong')}"?`,
            type: 'info',
            confirmLoading: true,
            onOk: async () => {
                try {
                    const values = await form.validateFields();
                    setLoading(true);
                    const body = {
                        store: "api_update_kkct",
                        data: {},
                        param: {
                            stt_rec_yc: id,
                            line_nbr: record.line_nbr,
                            ngay_ct: headerProps.ngay_ct,
                            so_luong: parseFloat(values.so_luong) || 0,
                            UserId: currentUserId,
                        },
                    };

                    const res = await https.post("User/AddData", body, {
                        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                    });

                    const hasRM = res?.data && typeof res.data.responseModel !== "undefined";
                    const isSuccess = hasRM ? res.data.responseModel.isSucceded === true : res?.data?.statusCode === 200;

                    if (isSuccess) {
                        notification.success({ message: "Cập nhật số lượng thành công" });
                        setEditingKey("");
                        fetchDaKiemKe(paginationKKCT.current, paginationKKCT.pageSize, filterKKCT);
                    } else {
                        notification.error({ message: res.data?.responseModel?.message || res.data?.message || "Cập nhật thất bại" });
                    }
                } catch (errInfo) {
                    console.log("Validate or API Failed:", errInfo);
                } finally {
                    setLoading(false);
                }
            }
        });
    }, [form, id, headerProps.ngay_ct, currentUserId, token, paginationKKCT, filterKKCT, fetchDaKiemKe]);

    // ==================== API: Xóa kiểm kê (api_delete_kkct) ====================
    const handleDeleteKKCT = useCallback(async (record) => {
        setLoading(true);
        try {
            const body = {
                store: "api_delete_kkct",
                data: {},
                param: {
                    stt_rec_yc: id,
                    line_nbr: record.line_nbr,
                    ngay_ct: headerProps.ngay_ct,
                    UserId: currentUserId,
                },
            };

            const res = await https.post("User/AddData", body, {
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            });

            const hasRM = res?.data && typeof res.data.responseModel !== "undefined";
            const isSuccess = hasRM ? res.data.responseModel.isSucceded === true : res?.data?.statusCode === 200;

            if (isSuccess) {
                notification.success({ message: "Xóa thành công" });
                fetchDaKiemKe(paginationKKCT.current, paginationKKCT.pageSize, filterKKCT);
                fetchCanKiemKe(paginationKKSS.current, paginationKKSS.pageSize, filterKKSS);
            } else {
                notification.error({ message: res.data?.responseModel?.message || res.data?.message || "Xóa thất bại" });
            }
        } catch (error) {
            console.error("Lỗi xóa:", error);
            notification.error({ message: "Lỗi khi xóa" });
        } finally {
            setLoading(false);
        }
    }, [id, headerProps.ngay_ct, currentUserId, token, paginationKKCT, filterKKCT, paginationKKSS, filterKKSS, fetchDaKiemKe, fetchCanKiemKe]);

    // ==================== Logic Bộ lọc (Chips) ====================
    const activeChipsKKSS = useMemo(() => {
        const chips = [];
        if (filterKKSS.ma_vt) chips.push({ key: "ma_vt", label: "Mã VT", value: filterKKSS.ma_vt });
        if (filterKKSS.ten_vt) chips.push({ key: "ten_vt", label: "Tên VT", value: filterKKSS.ten_vt });
        if (filterKKSS.ma_vung) chips.push({ key: "ma_vung", label: "Vùng", value: filterKKSS.ma_vung });
        if (filterKKSS.ma_vi_tri) chips.push({ key: "ma_vi_tri", label: "Vị trí", value: filterKKSS.ma_vi_tri });
        return chips;
    }, [filterKKSS]);

    const activeChipsKKCT = useMemo(() => {
        const chips = [];
        if (filterKKCT.ma_vt) chips.push({ key: "ma_vt", label: "Mã VT", value: filterKKCT.ma_vt });
        if (filterKKCT.ten_vt) chips.push({ key: "ten_vt", label: "Tên VT", value: filterKKCT.ten_vt });
        if (filterKKCT.ma_lo) chips.push({ key: "ma_lo", label: "Lô", value: filterKKCT.ma_lo });
        if (filterKKCT.ma_vung) chips.push({ key: "ma_vung", label: "Vùng", value: filterKKCT.ma_vung });
        if (filterKKCT.ma_vi_tri) chips.push({ key: "ma_vi_tri", label: "Vị trí", value: filterKKCT.ma_vi_tri });
        if (filterKKCT.ng_tao) chips.push({ key: "ng_tao", label: "Người kiểm kê", value: filterKKCT.ng_tao });
        return chips;
    }, [filterKKCT]);

    const removeChipKKSS = (chipKey) => {
        filterChangeFromSearchRefKKSS.current = true;
        const newFilters = { ...filterKKSS, [chipKey]: "" };
        setFilterKKSS(newFilters);
        fetchCanKiemKe(1, paginationKKSS.pageSize, newFilters);
    };

    const clearAllChipsKKSS = () => {
        filterChangeFromSearchRefKKSS.current = true;
        const cleared = { ma_vt: "", ten_vt: "", ma_lo: "", ma_kho: "", ma_vi_tri: "", ma_vung: "" };
        setFilterKKSS(cleared);
        fetchCanKiemKe(1, paginationKKSS.pageSize, cleared);
    };

    const removeChipKKCT = (chipKey) => {
        filterChangeFromSearchRefKKCT.current = true;
        const newFilters = { ...filterKKCT, [chipKey]: "" };
        setFilterKKCT(newFilters);
        fetchDaKiemKe(1, paginationKKCT.pageSize, newFilters);
    };

    const clearAllChipsKKCT = () => {
        filterChangeFromSearchRefKKCT.current = true;
        const cleared = { ma_vt: "", ten_vt: "", ma_lo: "", ma_kho: "", ma_vi_tri: "", ma_vung: "", ng_tao: "" };
        setFilterKKCT(cleared);
        fetchDaKiemKe(1, paginationKKCT.pageSize, cleared);
    };

    const renderChipsBar = (chips, onRemove, onClearAll) => {
        if (chips.length === 0) return null;
        return (
            <div className="filter-chips-container">
                <div className="filter-chips-left">
                    <FilterOutlined className="filter-chips-icon" />
                    <span className="filter-chips-title">Đang áp dụng {chips.length} bộ lọc</span>
                    <div className="filter-chips-list">
                        {chips.map((chip) => (
                            <Tag
                                key={chip.key}
                                closable
                                onClose={(e) => { e.preventDefault(); onRemove(chip.key); }}
                                className={`filter-chip ${chip.key === "ma_vt" ? "filter-chip--blue" :
                                    chip.key === "ten_vt" ? "filter-chip--magenta" :
                                        chip.key === "ma_lo" ? "filter-chip--orange" :
                                            chip.key === "ma_vung" ? "filter-chip--geekblue" :
                                                "filter-chip--cyan"
                                    }`}
                            >
                                {chip.label}: {chip.value}
                            </Tag>
                        ))}
                    </div>
                </div>
                <div className="filter-chips-right">
                    <Button size="small" onClick={onClearAll}>Xóa tất cả</Button>
                </div>
            </div>
        );
    };
    // ==================== Columns Tab 1: Vật tư CẦN kiểm kê ====================
    const columnsCanKiemKe = useMemo(() => [
        {
            title: "Ảnh",
            dataIndex: "image",
            key: "image",
            width: 120,
            align: "center",
            fixed: "left",
            onCell: (record) => ({
                onClick: () => handleCheckVtKiemKe(record),
                style: { cursor: 'pointer' },
                title: 'Bấm để kiểm kê',
                onMouseEnter: (e) => {
                    const cell = e.currentTarget;
                    cell.style.backgroundColor = '#f6faff';
                    const img = cell.querySelector('img');
                    if (img) img.style.transform = "scale(1.08)";
                },
                onMouseLeave: (e) => {
                    const cell = e.currentTarget;
                    cell.style.backgroundColor = '';
                    const img = cell.querySelector('img');
                    if (img) img.style.transform = "scale(1)";
                }
            }),
            render: (url) => (
                <div style={{ position: "relative", width: 120, height: 120, margin: "0 auto", borderRadius: "8px", overflow: "hidden", border: "1px solid #f0f0f0" }}>
                    {url ? (
                        <div
                            style={{
                                width: "100%",
                                height: "100%",
                                backgroundImage: `url(${url})`,
                                backgroundSize: "cover",
                                backgroundPosition: "center",
                                transition: "transform 0.3s ease"
                            }}
                        />
                    ) : (
                        <div style={{ width: "100%", height: "100%", background: "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center", color: "#ccc", fontSize: "12px" }}>
                            Bấm để kiểm kê
                        </div>
                    )}
                </div>
            ),
        },
        {
            title: "Thông tin vật tư",
            dataIndex: "ma_vt", key: "ma_vt", width: 150, align: "center", fixed: "left",
            filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) => (
                <div style={{ padding: 8 }}>
                    <Input
                        placeholder="Tìm Tên VT"
                        value={selectedKeys[1]}
                        onChange={(e) => setSelectedKeys([selectedKeys[0] || "", e.target.value])}
                        onPressEnter={() => {
                            filterChangeFromSearchRefKKSS.current = true;
                            confirm();
                            const newFilters = { ...filterKKSS, ma_vt: selectedKeys[0] || "", ten_vt: selectedKeys[1] || "" };
                            setFilterKKSS(newFilters);
                            fetchCanKiemKe(1, paginationKKSS.pageSize, newFilters);
                        }}
                        style={{ marginBottom: 8, display: "block" }}
                    />
                    <Button
                        className="search_button"
                        type="primary"
                        onClick={() => {
                            filterChangeFromSearchRefKKSS.current = true;
                            confirm();
                            const newFilters = { ...filterKKSS, ma_vt: selectedKeys[0] || "", ten_vt: selectedKeys[1] || "" };
                            setFilterKKSS(newFilters);
                            fetchCanKiemKe(1, paginationKKSS.pageSize, newFilters);
                        }}
                        size="small"
                    >
                        Tìm kiếm
                    </Button>
                </div>
            ),
            filteredValue: (filterKKSS.ma_vt || filterKKSS.ten_vt) ? [filterKKSS.ma_vt, filterKKSS.ten_vt].filter(Boolean) : null,
            render: (_, record) => (
                <div style={{ textAlign: "center", padding: "4px 0" }}>
                    <div style={{ fontSize: "15px", wordBreak: "break-word", marginBottom: 8 }}>
                        <span style={{ color: "#1890ff", fontWeight: 500 }}>{record.ma_vt?.trim()}</span>
                        {" - "}
                        <span style={{ color: "#333" }}>{record.ten_vt?.trim()}</span>
                    </div>
                    <Tag style={{ fontSize: "14px", padding: "4px 12px", borderRadius: "12px", background: "#f8f9fa", border: "none", color: "#000", fontWeight: 500 }}>{record.dvt?.trim()}</Tag>
                </div>
            ),
        },
        {
            title: "Mã vùng",
            dataIndex: "ma_vung", key: "ma_vung", width: 100, align: "center",
            filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) => (
                <div style={{ padding: 8 }}>
                    <Input
                        placeholder="Tìm Mã vùng"
                        value={selectedKeys[0]}
                        onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
                        onPressEnter={() => {
                            filterChangeFromSearchRefKKSS.current = true;
                            confirm();
                            const newFilters = { ...filterKKSS, ma_vung: selectedKeys[0] || "" };
                            setFilterKKSS(newFilters);
                            fetchCanKiemKe(1, paginationKKSS.pageSize, newFilters);
                        }}
                        style={{ marginBottom: 8, display: "block" }}
                    />
                    <Button
                        className="search_button"
                        type="primary"
                        onClick={() => {
                            filterChangeFromSearchRefKKSS.current = true;
                            confirm();
                            const newFilters = { ...filterKKSS, ma_vung: selectedKeys[0] || "" };
                            setFilterKKSS(newFilters);
                            fetchCanKiemKe(1, paginationKKSS.pageSize, newFilters);
                        }}
                        size="small"
                    >
                        Tìm kiếm
                    </Button>
                </div>
            ),
            filteredValue: filterKKSS.ma_vung ? [filterKKSS.ma_vung] : null,
            render: (text) => text ? text.trim() : "-"
        },
        {
            title: "Mã vị trí",
            dataIndex: "ma_vi_tri", key: "ma_vi_tri", width: 100, align: "center",
            filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) => (
                <div style={{ padding: 8 }}>
                    <Input
                        placeholder="Tìm Mã vị trí"
                        value={selectedKeys[0]}
                        onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
                        onPressEnter={() => {
                            filterChangeFromSearchRefKKSS.current = true;
                            confirm();
                            const newFilters = { ...filterKKSS, ma_vi_tri: selectedKeys[0] || "" };
                            setFilterKKSS(newFilters);
                            fetchCanKiemKe(1, paginationKKSS.pageSize, newFilters);
                        }}
                        style={{ marginBottom: 8, display: "block" }}
                    />
                    <Button
                        className="search_button"
                        type="primary"
                        onClick={() => {
                            filterChangeFromSearchRefKKSS.current = true;
                            confirm();
                            const newFilters = { ...filterKKSS, ma_vi_tri: selectedKeys[0] || "" };
                            setFilterKKSS(newFilters);
                            fetchCanKiemKe(1, paginationKKSS.pageSize, newFilters);
                        }}
                        size="small"
                    >
                        Tìm kiếm
                    </Button>
                </div>
            ),
            filteredValue: filterKKSS.ma_vi_tri ? [filterKKSS.ma_vi_tri] : null,
            render: (text) => text ? text.trim() : "-"
        },

    ], [filterKKSS, paginationKKSS, fetchCanKiemKe, handleCheckVtKiemKe]);

    // ==================== Columns Tab 2: Vật tư ĐÃ kiểm kê ====================
    const columnsDaKiemKe = useMemo(() => [
        {
            title: "Ảnh",
            dataIndex: "image",
            key: "image",
            width: 120,
            align: "center",
            fixed: "left",
            render: (url) => url ? (
                <div key={url} style={{
                    width: 120, height: 120,
                    backgroundImage: `url(${url})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    borderRadius: "8px", border: "1px solid #f0f0f0"
                }} />
            ) : (
                <div style={{ width: 120, height: 120, background: "#f5f5f5", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", color: "#ccc", fontSize: "12px" }}>N/A</div>
            ),
        },
        {
            title: "Thông tin vật tư",
            dataIndex: "ma_vt", key: "ma_vt", width: 200, align: "center", fixed: "left",
            filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) => (
                <div style={{ padding: 8 }}>
                    <Input
                        placeholder="Tìm Tên VT"
                        value={selectedKeys[1]}
                        onChange={(e) => setSelectedKeys([selectedKeys[0] || "", e.target.value])}
                        onPressEnter={() => {
                            filterChangeFromSearchRefKKCT.current = true;
                            confirm();
                            const newFilters = { ...filterKKCT, ma_vt: selectedKeys[0] || "", ten_vt: selectedKeys[1] || "" };
                            setFilterKKCT(newFilters);
                            fetchDaKiemKe(1, paginationKKCT.pageSize, newFilters);
                        }}
                        style={{ marginBottom: 8, display: "block" }}
                    />
                    <Button
                        className="search_button"
                        type="primary"
                        onClick={() => {
                            filterChangeFromSearchRefKKCT.current = true;
                            confirm();
                            const newFilters = { ...filterKKCT, ma_vt: selectedKeys[0] || "", ten_vt: selectedKeys[1] || "" };
                            setFilterKKCT(newFilters);
                            fetchDaKiemKe(1, paginationKKCT.pageSize, newFilters);
                        }}
                        size="small"
                    >
                        Tìm kiếm
                    </Button>
                </div>
            ),
            filteredValue: (filterKKCT.ma_vt || filterKKCT.ten_vt) ? [filterKKCT.ma_vt, filterKKCT.ten_vt].filter(Boolean) : null,
            render: (_, record) => (
                <div style={{ textAlign: "center", padding: "4px 0" }}>
                    <div style={{ fontSize: "15px", wordBreak: "break-word", marginBottom: 8 }}>
                        <span style={{ color: "#1890ff", fontWeight: 500 }}>{record.ma_vt?.trim()}</span>
                        {" - "}
                        <span style={{ color: "#333" }}>{record.ten_vt?.trim()}</span>
                    </div>
                    <Tag style={{ fontSize: "14px", padding: "4px 12px", borderRadius: "12px", background: "#f8f9fa", border: "none", color: "#000", fontWeight: 500 }}>{record.dvt?.trim()}</Tag>
                </div>
            ),
        },
        {
            title: "Mã lô",
            dataIndex: "ma_lo", key: "ma_lo", width: 120, align: "center",
            filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) => (
                <div style={{ padding: 8 }}>
                    <Input
                        placeholder="Tìm Mã lô"
                        value={selectedKeys[0]}
                        onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
                        onPressEnter={() => {
                            filterChangeFromSearchRefKKCT.current = true;
                            confirm();
                            const newFilters = { ...filterKKCT, ma_lo: selectedKeys[0] || "" };
                            setFilterKKCT(newFilters);
                            fetchDaKiemKe(1, paginationKKCT.pageSize, newFilters);
                        }}
                        style={{ marginBottom: 8, display: "block" }}
                    />
                    <Button
                        className="search_button"
                        type="primary"
                        onClick={() => {
                            filterChangeFromSearchRefKKCT.current = true;
                            confirm();
                            const newFilters = { ...filterKKCT, ma_lo: selectedKeys[0] || "" };
                            setFilterKKCT(newFilters);
                            fetchDaKiemKe(1, paginationKKCT.pageSize, newFilters);
                        }}
                        size="small"
                    >
                        Tìm kiếm
                    </Button>
                </div>
            ),
            filteredValue: filterKKCT.ma_lo ? [filterKKCT.ma_lo] : null,
        },
        {
            title: "Hạn sử dụng",
            dataIndex: "ngay_hhsd", key: "ngay_hhsd", width: 110, align: "center",
            render: (text) => text ? dayjs(text).format("DD/MM/YYYY") : "-",
        },
        {
            title: "Mã vùng",
            dataIndex: "ma_vung", key: "ma_vung", width: 100, align: "center",
            filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) => (
                <div style={{ padding: 8 }}>
                    <Input
                        placeholder="Tìm Mã vùng"
                        value={selectedKeys[0]}
                        onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
                        onPressEnter={() => {
                            filterChangeFromSearchRefKKCT.current = true;
                            confirm();
                            const newFilters = { ...filterKKCT, ma_vung: selectedKeys[0] || "" };
                            setFilterKKCT(newFilters);
                            fetchDaKiemKe(1, paginationKKCT.pageSize, newFilters);
                        }}
                        style={{ marginBottom: 8, display: "block" }}
                    />
                    <Button
                        className="search_button"
                        type="primary"
                        onClick={() => {
                            filterChangeFromSearchRefKKCT.current = true;
                            confirm();
                            const newFilters = { ...filterKKCT, ma_vung: selectedKeys[0] || "" };
                            setFilterKKCT(newFilters);
                            fetchDaKiemKe(1, paginationKKCT.pageSize, newFilters);
                        }}
                        size="small"
                    >
                        Tìm kiếm
                    </Button>
                </div>
            ),
            filteredValue: filterKKCT.ma_vung ? [filterKKCT.ma_vung] : null,
            render: (text) => text ? text.trim() : "-"
        },
        {
            title: "Mã vị trí",
            dataIndex: "ma_vi_tri", key: "ma_vi_tri", width: 100, align: "center",
            filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) => (
                <div style={{ padding: 8 }}>
                    <Input
                        placeholder="Tìm Mã vị trí"
                        value={selectedKeys[0]}
                        onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
                        onPressEnter={() => {
                            filterChangeFromSearchRefKKCT.current = true;
                            confirm();
                            const newFilters = { ...filterKKCT, ma_vi_tri: selectedKeys[0] || "" };
                            setFilterKKCT(newFilters);
                            fetchDaKiemKe(1, paginationKKCT.pageSize, newFilters);
                        }}
                        style={{ marginBottom: 8, display: "block" }}
                    />
                    <Button
                        className="search_button"
                        type="primary"
                        onClick={() => {
                            filterChangeFromSearchRefKKCT.current = true;
                            confirm();
                            const newFilters = { ...filterKKCT, ma_vi_tri: selectedKeys[0] || "" };
                            setFilterKKCT(newFilters);
                            fetchDaKiemKe(1, paginationKKCT.pageSize, newFilters);
                        }}
                        size="small"
                    >
                        Tìm kiếm
                    </Button>
                </div>
            ),
            filteredValue: filterKKCT.ma_vi_tri ? [filterKKCT.ma_vi_tri] : null,
            render: (text) => text ? text.trim() : "-"
        },
        {
            title: "Người kiểm kê",
            key: "nguoi_kiem_ke",
            width: 150,
            align: "center",
            filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) => (
                <div style={{ padding: 8 }}>
                    <Input
                        placeholder="Tìm Người tạo"
                        value={selectedKeys[0]}
                        onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
                        onPressEnter={() => {
                            filterChangeFromSearchRefKKCT.current = true;
                            confirm();
                            const newFilters = { ...filterKKCT, ng_tao: selectedKeys[0] || "" };
                            setFilterKKCT(newFilters);
                            fetchDaKiemKe(1, paginationKKCT.pageSize, newFilters);
                        }}
                        style={{ marginBottom: 8, display: "block" }}
                    />
                    <Button
                        className="search_button"
                        type="primary"
                        onClick={() => {
                            filterChangeFromSearchRefKKCT.current = true;
                            confirm();
                            const newFilters = { ...filterKKCT, ng_tao: selectedKeys[0] || "" };
                            setFilterKKCT(newFilters);
                            fetchDaKiemKe(1, paginationKKCT.pageSize, newFilters);
                        }}
                        size="small"
                    >
                        Tìm kiếm
                    </Button>
                </div>
            ),
            filteredValue: filterKKCT.ng_tao ? [filterKKCT.ng_tao] : null,
            render: (_, record) => {
                const user = record.user_name || "-";
                const time = record.datetime0 ? dayjs(record.datetime0).format("DD/MM/YYYY HH:mm") : "";
                return (
                    <div style={{ fontSize: "13px" }}>
                        <div style={{ fontWeight: 500, color: "#1890ff" }}>{user}</div>
                        {time && <div style={{ color: "#8c8c8c", marginTop: 2 }}>{time}</div>}
                    </div>
                );
            }
        },
        {
            title: "SL",
            dataIndex: "so_luong",
            key: "so_luong",
            width: 60,
            align: "center",
            render: (text, record) => {
                if (isEditing(record)) {
                    return (
                        <Form.Item name="so_luong" style={{ margin: 0 }} rules={[{ required: true, message: "Nhập SL!" }]}>
                            <InputNumber
                                min={0}
                                style={{ width: "100%", fontWeight: "bold" }}
                                controls={false}
                                inputMode="numeric"
                                onFocus={(e) => e.target.select()}
                                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                                parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
                            />
                        </Form.Item>
                    );
                }
                return (
                    <div style={{ fontWeight: "bold", color: "#1890ff", fontSize: "14px" }}>
                        {text != null ? Number(text).toLocaleString("vi-VN") : "-"}
                    </div>
                );
            },
        },
        {
            title: "Hành động",
            key: "action",
            width: 80,
            align: "center",
            render: (_, record) => {
                if (isEditing(record)) {
                    return (
                        <Space size={12}>
                            <Button
                                type="text"
                                style={{ color: "#fff", background: "#52c41a", fontSize: "16px", width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center" }}
                                icon={<CheckOutlined />}
                                onClick={() => handleSaveEdit(record)}
                            />
                            <Button
                                type="text"
                                style={{ color: "#666", background: "#f0f0f0", fontSize: "16px", width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center" }}
                                icon={<CloseOutlined />}
                                onClick={handleCancelEdit}
                            />
                        </Space>
                    );
                }
                return (
                    <Space size={12}>
                        <Button
                            type="text"
                            style={{ color: "#38b2ac", background: "#e6fffa", fontSize: "16px", width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center" }}
                            icon={<EditOutlined />}
                            disabled={editingKey !== ""}
                            onClick={() => handleEdit(record)}
                        />
                        <Button
                            type="text"
                            style={{ color: "#ee5a52", background: "#fff5f5", fontSize: "16px", width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center" }}
                            icon={<DeleteOutlined />}
                            disabled={editingKey !== ""}
                            onClick={() => {
                                showConfirm({
                                    title: 'Xác nhận xóa',
                                    content: `Bạn có chắc chắn muốn xóa dòng vật tư "${record.ma_vt}" lô "${record.ma_lo}" này không?`,
                                    confirmLoading: true,
                                    onOk: () => handleDeleteKKCT(record)
                                });
                            }}
                        />
                    </Space>
                );
            },
        },
    ], [filterKKCT, paginationKKCT, fetchDaKiemKe, editingKey, handleSaveEdit, handleCancelEdit, handleEdit, handleDeleteKKCT, isEditing]);



    // Tính toán khung cuộn cho bảng Cần Kiểm Kê
    const getScrollConfigCanKiemKe = useCallback(() => {
        const columnWidths = columnsCanKiemKe.reduce((sum, col) => sum + (col.width || 100), 0);
        const minWidth = Math.max(columnWidths, typeof window !== 'undefined' ? window.innerWidth - 100 : 1000);
        const rowHeight = 160;
        const headerHeight = 50;
        const maxRows = 25;
        const y = headerHeight + rowHeight * maxRows;
        return { x: minWidth, y };
    }, [columnsCanKiemKe]);

    // Tính toán khung cuộn cho bảng Đã Kiểm Kê
    const getScrollConfigDaKiemKe = useCallback(() => {
        const columnWidths = columnsDaKiemKe.reduce((sum, col) => sum + (col.width || 100), 0);
        const minWidth = Math.max(columnWidths, typeof window !== 'undefined' ? window.innerWidth - 100 : 1000);
        const rowHeight = 160;
        const headerHeight = 50;
        const maxRows = 25;
        const y = headerHeight + rowHeight * maxRows;
        return { x: minWidth, y };
    }, [columnsDaKiemKe]);

    // ==================== RENDER ====================
    return (
        <Layout className="phieu-container" style={{ background: "#f5f6fa", minHeight: "100vh" }} >
            <Row align="middle" className="phieu-header" style={{ position: "relative" }}>
                <Col flex={1} style={{ zIndex: 1, textAlign: "left" }}>
                    <Button type="text" icon={<LeftOutlined />} onClick={() => navigate("/kho/yeu-cau-kiem-ke")} className="phieu-back-button">
                        Trở về
                    </Button>
                </Col>

                <div style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", zIndex: 0, whiteSpace: "nowrap" }}>
                    <Title level={5} className="phieu-title">
                        KIỂM KÊ: {headerProps.so_ct || id}
                    </Title>
                </div>

                <Col flex={1} style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", zIndex: 1 }}>
                    <button
                        type="button"
                        className="navbar_fullscreen_btn"
                        onClick={handleRefreshClick}
                        title="Làm tươi"
                        aria-label="Làm tươi"
                    >
                        <ReloadOutlined />
                    </button>
                </Col>
            </Row>

            <Content style={{ padding: "0 20px" }}>
                {/* Thông tin chung */}
                <div style={{ background: "white", padding: "20px", borderRadius: "16px", marginBottom: "20px" }}>
                    <h3 style={{ marginBottom: "16px", fontSize: "15px", color: "#6c63ff", borderBottom: "1px solid #f0f0f0", paddingBottom: "10px", fontWeight: "bold", textTransform: "uppercase" }}>THÔNG TIN CHUNG YÊU CẦU</h3>
                    <Row gutter={24}>
                        <Col span={8}>
                            <div><strong>Số chứng từ:</strong> {headerProps.so_ct || "-"}</div>
                        </Col>
                        <Col span={8}>
                            <div><strong>Ngày chứng từ:</strong> {dayjs(headerProps.ngay_ct).format("DD/MM/YYYY")}</div>
                        </Col>
                        <Col span={8}>
                            <div><strong>Mã kho:</strong> {headerProps.ma_kho || "-"}</div>
                        </Col>
                    </Row>
                </div>

                {/* Tabs */}
                <Tabs
                    defaultActiveKey="1"
                    type="card"
                    items={[
                        {
                            key: "1",
                            label: `Vật tư cần kiểm kê (${paginationKKSS.total})`,
                            children: (
                                <div style={{ background: "white", padding: "20px", borderRadius: "0 16px 16px 16px" }}>
                                    {renderChipsBar(activeChipsKKSS, removeChipKKSS, clearAllChipsKKSS)}
                                    <Table
                                        className="vat-tu-table hidden_scroll_bar"
                                        bordered
                                        dataSource={dataCanKiemKe}
                                        columns={columnsCanKiemKe}
                                        rowKey={(r) => r.ma_vt + "_" + (r.ma_lo || "") + "_" + (r.ma_kho || "")}
                                        loading={loadingKKSS || loading}
                                        size="small"
                                        scroll={getScrollConfigCanKiemKe()}
                                        pagination={{
                                            current: paginationKKSS.current,
                                            pageSize: paginationKKSS.pageSize,
                                            total: paginationKKSS.total,
                                            showSizeChanger: true,
                                            onChange: (page, pageSize) => {
                                                if (filterChangeFromSearchRefKKSS.current && page === 1) {
                                                    filterChangeFromSearchRefKKSS.current = false;
                                                    return;
                                                }
                                                fetchCanKiemKe(page, pageSize, filterKKSS);
                                            },
                                        }}
                                        locale={{ emptyText: <Empty description="Không có vật tư cần kiểm kê" /> }}
                                    />
                                </div>
                            ),
                        },
                        {
                            key: "2",
                            label: `Vật tư đã kiểm kê (${paginationKKCT.total})`,
                            children: (
                                <div style={{ background: "white", padding: "20px", borderRadius: "0 16px 16px 16px" }}>
                                    {renderChipsBar(activeChipsKKCT, removeChipKKCT, clearAllChipsKKCT)}
                                    <Form form={form} component={false}>
                                        <Table
                                            className="vat-tu-table hidden_scroll_bar"
                                            bordered
                                            dataSource={dataDaKiemKe}
                                            columns={columnsDaKiemKe}
                                            rowKey="line_nbr"
                                            loading={loadingKKCT || loading}
                                            size="small"
                                            scroll={getScrollConfigDaKiemKe()}
                                            pagination={{
                                                current: paginationKKCT.current,
                                                pageSize: paginationKKCT.pageSize,
                                                total: paginationKKCT.total,
                                                showSizeChanger: true,
                                                onChange: (page, pageSize) => {
                                                    if (filterChangeFromSearchRefKKCT.current && page === 1) {
                                                        filterChangeFromSearchRefKKCT.current = false;
                                                        return;
                                                    }
                                                    fetchDaKiemKe(page, pageSize, filterKKCT);
                                                },
                                            }}
                                            locale={{ emptyText: <Empty description="Chưa kiểm kê vật tư nào" /> }}
                                        />
                                    </Form>
                                </div>
                            ),
                        },
                    ]}
                />
            </Content>

            {/* ==================== Modal Kiểm tra Vật tư ==================== */}
            < Modal
                title={< span style={{ fontSize: "16px", fontWeight: "bold" }}> Kiểm tra vật tư: {vtCheckInfo?.ma_vt?.trim()}</span >}
                open={checkModalVisible}
                onCancel={() => { setInvalidLots({}); setCheckModalVisible(false); }}
                width={700}
                maskClosable={false}
                footer={
                    [
                        <Button key="cancel" onClick={() => { setInvalidLots({}); setCheckModalVisible(false); }}>Hủy</Button>,
                        <Button
                            key="submit"
                            type="primary"
                            loading={loading}
                            onClick={handleModalInsert}
                            disabled={Object.keys(selectedLots).length === 0}
                            style={{ background: "#52c41a", borderColor: "#52c41a" }}
                        >
                            Xác nhận kiểm kê
                        </Button>,
                    ]}
            >
                {
                    checkLoading ? (
                        <div style={{ textAlign: "center", padding: "40px" }} > <Spin size="large" /></div >
                    ) : vtCheckInfo ? (
                        <>
                            {/* Tìm kiếm đổi vật tư khác */}
                            <div style={{ marginBottom: "16px" }}>
                                <Select
                                    showSearch
                                    placeholder="Tìm kiếm vật tư khác để kiểm kê..."
                                    filterOption={false}
                                    loading={vtSearchLoading}
                                    onSearch={(keyword) => {
                                        if (!keyword) {
                                            setVtSearchOptions([]);
                                            return;
                                        }
                                        setVtSearchLoading(true);

                                        if (window.vtSearchTimeout) clearTimeout(window.vtSearchTimeout);
                                        window.vtSearchTimeout = setTimeout(async () => {
                                            try {
                                                const res = await searchVatTu(keyword, 1, 20, userInfo?.unitId, currentUserId);
                                                const data = res?.listObject?.[0] || [];
                                                const opts = data.map(x => ({
                                                    value: x.value || x.ma_vt,
                                                    label: `${x.value || x.ma_vt} - ${x.label || x.ten_vt}`,
                                                    item: x
                                                }));
                                                setVtSearchOptions(opts);
                                            } catch (e) {
                                                console.error(e);
                                            } finally {
                                                setVtSearchLoading(false);
                                            }
                                        }, 500);
                                    }}
                                    onChange={(val, opt) => {
                                        if (val) {
                                            handleCheckVtKiemKe({
                                                ma_vt: val,
                                                image: opt?.item?.image || "",
                                                ma_kho: vtCheckInfo?.ma_kho || "",
                                                ma_vung: vtCheckInfo?.ma_vung || "",
                                                ma_vi_tri: vtCheckInfo?.ma_vi_tri || ""
                                            });
                                            // clear options
                                            setVtSearchOptions([]);
                                        }
                                    }}
                                    style={{ width: "100%" }}
                                    options={vtSearchOptions}
                                    notFoundContent={vtSearchLoading ? <Spin size="small" /> : null}
                                />
                            </div>

                            {/* Thông tin vật tư */}
                            <div style={{
                                padding: "16px",
                                background: "#f0f5ff",
                                borderRadius: "8px",
                                marginBottom: "16px",
                                fontSize: "15px",
                                border: "1px solid #d6e4ff",
                                display: "flex",
                                alignItems: "center",
                                gap: "16px"
                            }}>
                                {vtCheckInfo.image ? (
                                    <div style={{
                                        width: 120, height: 120, flexShrink: 0,
                                        backgroundImage: `url(${vtCheckInfo.image})`,
                                        backgroundSize: "cover",
                                        backgroundPosition: "center",
                                        borderRadius: "8px", border: "1px solid #f0f0f0"
                                    }} />
                                ) : (
                                    <div style={{ width: 120, height: 120, background: "#f5f5f5", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", color: "#ccc", fontSize: "12px", flexShrink: 0 }}>N/A</div>
                                )}
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", flex: 1 }}>
                                    <span style={{ color: "#1890ff", fontWeight: "bold", fontSize: "16px" }}>{(vtCheckInfo.ma_vt || "").trim()}</span>
                                    <span style={{ color: "#8c8c8c" }}>-</span>
                                    <span style={{ color: "#262626", fontWeight: 500 }}>{(vtCheckInfo.ten_vt || "").trim()}</span>
                                    <span style={{ color: "#8c8c8c" }}>-</span>
                                    <Tag color="cyan" style={{ margin: 0, fontSize: "14px", padding: "2px 8px" }}>{(vtCheckInfo.dvt || "").trim()}</Tag>
                                </div>
                            </div>

                            {/* Tìm kiếm mã lô */}
                            <Divider orientation="left" style={{ fontSize: "14px", fontWeight: "bold", color: "#fa8c16" }}>
                                Tìm kiếm mã lô
                            </Divider>
                            <div style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
                                <Select
                                    showSearch
                                    placeholder="Tìm kiếm và chọn xuất lô..."
                                    loading={loSearchLoading}
                                    filterOption={false}
                                    value={selectedSearchLots[0] || null}
                                    allowClear
                                    style={{ flex: 1 }}
                                    onChange={(val) => {
                                        if (val) {
                                            if (searchQty === null || searchQty === undefined || searchQty === "" || parseFloat(searchQty) < 0) {
                                                setSelectedSearchLots([]); // Xóa selection ngay lập tức
                                                notification.error({
                                                    message: "Chưa nhập số lượng hợp lệ",
                                                    description: "Vui lòng nhập số lượng kiểm kê (>= 0) trước khi chọn lô."
                                                });
                                                return;
                                            }
                                            if (val.trim() in selectedLots) {
                                                notification.warning({ message: `Lô "${val.trim()}" đã có trong danh sách` });
                                            } else {
                                                setSelectedLots(prev => ({
                                                    ...prev,
                                                    [val.trim()]: parseFloat(searchQty)
                                                }));
                                            }
                                            setSelectedSearchLots([]);
                                            setSearchQty(0);
                                        } else {
                                            setSelectedSearchLots([]);
                                        }
                                    }}
                                    onFocus={async () => {
                                        if (loSearchOptions.length > 0) return;
                                        setLoSearchLoading(true);
                                        try {
                                            const res = await getLoItem({
                                                ma_vt: vtCheckInfo?.ma_vt?.trim() || "",
                                                ten_lo: "",
                                                pageIndex: 1,
                                                pageSize: 100,
                                            });
                                            const data = res?.listObject?.[0] || [];
                                            const newCachedHsd = {};
                                            const opts = data.map(x => {
                                                const val = (x?.ma_lo || x?.value || x?.ten_lo || "").toString();
                                                let label = val;
                                                if (x?.ngay_hhsd || x?.hanLo) {
                                                    const dateVal = x?.ngay_hhsd || x?.hanLo;
                                                    const hsdStr = dayjs(dateVal).format("DD/MM/YYYY");
                                                    label = `${val} - HSD: ${hsdStr}`;
                                                    newCachedHsd[val] = hsdStr;
                                                }
                                                return { value: val, label };
                                            });
                                            setLoSearchOptions(opts);
                                            setCachedLoHsd(prev => ({ ...prev, ...newCachedHsd }));
                                        } catch (e) {
                                            console.error("Load lo error:", e);
                                        } finally {
                                            setLoSearchLoading(false);
                                        }
                                    }}
                                    onSearch={async (keyword) => {
                                        setLoSearchLoading(true);
                                        try {
                                            const res = await getLoItem({
                                                ma_vt: vtCheckInfo?.ma_vt?.trim() || "",
                                                ten_lo: keyword,
                                                pageIndex: 1,
                                                pageSize: 20,
                                            });
                                            const data = res?.listObject?.[0] || [];
                                            const newCachedHsd = {};
                                            const opts = data.map(x => {
                                                const val = (x?.ma_lo || x?.value || x?.ten_lo || "").toString();
                                                let label = val;
                                                if (x?.ngay_hhsd || x?.hanLo) {
                                                    const dateVal = x?.ngay_hhsd || x?.hanLo;
                                                    const hsdStr = dayjs(dateVal).format("DD/MM/YYYY");
                                                    label = `${val} - HSD: ${hsdStr}`;
                                                    newCachedHsd[val] = hsdStr;
                                                }
                                                return { value: val, label };
                                            });
                                            setLoSearchOptions(opts);
                                            setCachedLoHsd(prev => ({ ...prev, ...newCachedHsd }));
                                        } catch (e) {
                                            console.error("Search lo error:", e);
                                            setLoSearchOptions([]);
                                        } finally {
                                            setLoSearchLoading(false);
                                        }
                                    }}
                                    options={loSearchOptions}
                                    notFoundContent={loSearchLoading ? <Spin size="small" /> : "Không tìm thấy"}
                                    dropdownRender={(menu) => (
                                        <>
                                            <div style={{
                                                display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8,
                                                padding: "6px 12px",
                                                background: "#fafafa",
                                                borderBottom: "1px solid #e8e8e8"
                                            }}>
                                                <span style={{ fontWeight: 600, fontSize: 13, color: "#595959", whiteSpace: "nowrap" }}>Nhập SL:</span>
                                                <InputNumber
                                                    inputMode="decimal"
                                                    controls={false}
                                                    min={0}
                                                    value={searchQty}
                                                    onChange={val => setSearchQty(val || 0)}
                                                    placeholder="0"
                                                    size="small"
                                                    style={{ width: 80, textAlign: "center", fontWeight: 600 }}
                                                    onFocus={e => e.target.select()}
                                                    onMouseDown={e => e.stopPropagation()}
                                                />
                                            </div>
                                            {menu}
                                        </>
                                    )}
                                />
                                <Button
                                    type="primary"
                                    title="Tạo lô mới"
                                    icon={<PlusOutlined />}
                                    onClick={() => {
                                        setNewLotForm({ maLo: "", tenLo: "", hsd: null, soLuong: 0 });
                                        setNewLotModalVisible(true);
                                    }}
                                />
                            </div>
                            {/* Lô đã chọn */}
                            {Object.keys(selectedLots).length > 0 && (
                                <Space direction="vertical" style={{ width: "100%" }}>
                                    {Object.keys(selectedLots).map(maLo => (
                                        <div key={maLo} style={{ padding: "8px 12px", background: "#fff7e6", borderRadius: "8px", border: "1px solid #ffd591", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                                            <Checkbox
                                                checked={true}
                                                onChange={() => {
                                                    showConfirm({
                                                        title: 'Xác nhận xóa lô',
                                                        content: `Bạn có chắc chắn muốn bỏ chọn lô "${maLo}" không?`,
                                                        onOk: () => {
                                                            setSelectedLots(prev => {
                                                                const next = { ...prev };
                                                                delete next[maLo];
                                                                return next;
                                                            });
                                                        }
                                                    });
                                                }}
                                                style={{ flex: 1 }}
                                            >
                                                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                                    <span style={{ minWidth: 100 }}><strong>Lô: {maLo}</strong></span>
                                                    {(() => {
                                                        let hsd = null;
                                                        if (createdLots[maLo]) {
                                                            const h = createdLots[maLo].hsd;
                                                            if (h) hsd = dayjs(h).format("DD/MM/YYYY");
                                                        } else if (cachedLoHsd[maLo]) {
                                                            hsd = cachedLoHsd[maLo];
                                                        } else {
                                                            const opt = loSearchOptions.find(o => o.value === maLo);
                                                            if (opt && opt.label && opt.label.includes(" - HSD: ")) {
                                                                hsd = opt.label.split(" - HSD: ")[1];
                                                            }
                                                        }
                                                        return hsd ? <span style={{ color: "#888" }}>HSD: {hsd}</span> : null;
                                                    })()}
                                                </div>
                                            </Checkbox>
                                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                <span style={{ color: "#666", fontSize: "14px", fontWeight: 500 }}>SL:</span>
                                                <InputNumber
                                                    id={`lot-qty-${maLo}`}
                                                    controls={false}
                                                    inputMode="decimal"
                                                    min={0}
                                                    value={selectedLots[maLo]}
                                                    onChange={(val) => {
                                                        setSelectedLots(prev => ({ ...prev, [maLo]: val || 0 }));
                                                        if (val > 0) setInvalidLots(prev => { const n = { ...prev }; delete n[maLo]; return n; });
                                                    }}
                                                    placeholder="0"
                                                    status={invalidLots[maLo] ? "error" : undefined}
                                                    onFocus={e => e.target.select()}
                                                    style={{ width: 80, textAlign: "center" }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </Space>
                            )}

                            {/* Lô Gợi Ý - chỉ hiện khi có */}
                            {dsLoGoiY.length > 0 && (
                                <>
                                    <Divider orientation="left" style={{ fontSize: "14px", fontWeight: "bold", color: "#1890ff" }}>
                                        Lô gợi ý từ hệ thống ({dsLoGoiY.length})
                                    </Divider>
                                    <Space direction="vertical" style={{ width: "100%" }}>
                                        {dsLoGoiY.map((lo, idx) => {
                                            const maLo = (lo.maLo || lo.ma_lo || "").trim();
                                            const isChecked = maLo in selectedLots;
                                            return (
                                                <div key={idx} style={{ padding: "8px 12px", background: "#e6f7ff", borderRadius: "8px", border: "1px solid #91d5ff", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                                                    <Checkbox
                                                        checked={isChecked}
                                                        onChange={(e) => {
                                                            if (!e.target.checked) {
                                                                showConfirm({
                                                                    title: 'Xác nhận xóa lô',
                                                                    content: `Bạn có chắc chắn muốn bỏ chọn lô "${maLo}" không?`,
                                                                    onOk: () => {
                                                                        setSelectedLots(prev => {
                                                                            const next = { ...prev };
                                                                            delete next[maLo];
                                                                            return next;
                                                                        });
                                                                    }
                                                                });
                                                            } else {
                                                                setSelectedLots(prev => ({ ...prev, [maLo]: 0 }));
                                                            }
                                                        }}
                                                        style={{ flex: 1 }}
                                                    >
                                                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                                            <span style={{ minWidth: 100 }}><strong>Lô: {maLo}</strong></span>
                                                            {lo.hanSuDung && <span style={{ color: "#888" }}>HSD: {dayjs(lo.hanSuDung).format("DD/MM/YYYY")}</span>}
                                                        </div>
                                                    </Checkbox>
                                                    {isChecked && (
                                                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                            <span style={{ color: "#666", fontSize: "14px", fontWeight: 500 }}>SL:</span>
                                                            <InputNumber
                                                                id={`lot-qty-${maLo}`}
                                                                controls={false}
                                                                inputMode="decimal"
                                                                min={0}
                                                                value={selectedLots[maLo]}
                                                                onChange={(val) => {
                                                                    setSelectedLots(prev => ({ ...prev, [maLo]: val || 0 }));
                                                                    if (val > 0) setInvalidLots(prev => { const n = { ...prev }; delete n[maLo]; return n; });
                                                                }}
                                                                onFocus={e => e.target.select()}
                                                                placeholder="0"
                                                                status={invalidLots[maLo] ? "error" : undefined}
                                                                style={{ width: 80, textAlign: "center" }}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </Space>
                                </>
                            )}

                        </>
                    ) : (
                        <Empty description="Không tìm thấy thông tin vật tư" />
                    )}
            </Modal >

            {/* Modal Thêm Lô Mới */}
            < Modal
                title="Nhập thông tin lô mới"
                open={newLotModalVisible}
                onCancel={() => setNewLotModalVisible(false)}
                maskClosable={false}
                onOk={async () => {
                    const maLo = newLotForm.maLo.trim();
                    if (!maLo) {
                        notification.warning({ message: "Vui lòng nhập mã lô" });
                        return;
                    }
                    const tenLo = maLo; // Gán tên lô bằng mã lô
                    const hsdStr = newLotForm.hsd ? newLotForm.hsd.format("YYYY-MM-DD") : null;
                    const soLuong = parseFloat(newLotForm.soLuong);
                    if (isNaN(soLuong) || soLuong <= 0) {
                        notification.warning({ message: "Vui lòng nhập số lượng cho lô mới (> 0)" });
                        return;
                    }

                    // Gọi API tạo lô mới
                    try {
                        const body = {
                            store: "api_create_new_lot",
                            param: {
                                ma_vt: vtCheckInfo?.ma_vt?.trim() || "",
                                ma_lo: maLo,
                                ngay_hhsd: hsdStr || "",
                                ten_lo: tenLo,
                                UserId: currentUserId,
                            },
                            data: {},
                        };
                        const res = await https.post("User/AddData", body, {
                            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                        });
                        const isSuccess = res?.data?.responseModel?.isSucceded === true || res?.data?.statusCode === 200;
                        if (!isSuccess) {
                            notification.error({ message: res?.data?.responseModel?.message || "Tạo lô mới thất bại" });
                            return;
                        }
                        notification.success({ message: `Tạo lô "${maLo}" thành công` });
                    } catch (err) {
                        console.error("Lỗi tạo lô mới:", err);
                        notification.error({ message: "Lỗi khi tạo lô mới" });
                        return;
                    }

                    setCreatedLots(prev => ({ ...prev, [maLo]: { hsd: hsdStr, tenLo: tenLo } }));
                    if (hsdStr) {
                        setCachedLoHsd(prev => ({ ...prev, [maLo]: dayjs(hsdStr).format("DD/MM/YYYY") }));
                    }
                    setSelectedLots(prev => ({ ...prev, [maLo]: soLuong }));

                    setNewLotModalVisible(false);
                }}
                okText="Xác nhận"
                cancelText="Hủy"
                width={400}
            >
                <div style={{ marginBottom: 16 }}>
                    <div style={{ marginBottom: 8, fontWeight: 500 }}>Mã lô <span style={{ color: 'red' }}>*</span></div>
                    <Input
                        value={newLotForm.maLo}
                        onChange={e => setNewLotForm({ ...newLotForm, maLo: e.target.value })}
                        placeholder="Nhập mã lô"
                    />
                </div>

                <div style={{ marginBottom: 16 }}>
                    <div style={{ marginBottom: 8, fontWeight: 500 }}>Hạn sử dụng</div>
                    <DatePicker
                        format={["DD/MM/YYYY", "DDMMYYYY"]}
                        style={{ width: "100%" }}
                        value={newLotForm.hsd}
                        onChange={date => setNewLotForm({ ...newLotForm, hsd: date })}
                        placeholder="VD: 10032026 hoặc 10/03/2026"
                        onFocus={(e) => {
                            if (e.target && e.target.setAttribute) {
                                e.target.setAttribute("inputmode", "numeric");
                                e.target.setAttribute("pattern", "[0-9]*");
                            }
                        }}
                    />
                </div>
                <div>
                    <div style={{ marginBottom: 8, fontWeight: 500 }}>Số lượng</div>
                    <InputNumber
                        inputMode="decimal"
                        min={0}
                        style={{ width: "100%" }}
                        value={newLotForm.soLuong}
                        onChange={val => setNewLotForm({ ...newLotForm, soLuong: val || 0 })}
                        placeholder="Nhập số lượng"
                        onFocus={e => e.target.select()}
                        controls={false}
                    />
                </div>
            </Modal >
        </Layout >
    );
};

export default DetailPhieuYeuCauKiemKe;
