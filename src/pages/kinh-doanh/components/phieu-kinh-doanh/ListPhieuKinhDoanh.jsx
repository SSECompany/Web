import {
    DeleteOutlined,
    EditOutlined,
    FileTextOutlined,
    LeftOutlined,
    PlusOutlined,
    SearchOutlined,
    ScissorOutlined,
    MergeCellsOutlined,
    FilterOutlined,
    ReloadOutlined,
    ExportOutlined,
    CloseCircleOutlined,
} from "@ant-design/icons";
import { Button, DatePicker, Input, message, Tag, Typography, Card, List, Empty, Spin, Modal, Table, Select, Row, Col, Checkbox } from "antd";
import dayjs from "dayjs";
import { useEffect, useState, useMemo, useCallback } from "react";
import _ from "lodash";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import showConfirm from "../../../../components/common/Modal/ModalConfirm";
import "../../../kho/components/common-phieu.css";
import "./ListPhieuKinhDoanh.css";
import CommonPhieuList from "../../../kho/components/CommonPhieuList";
import { 
    fetchPhieuKinhDoanhList, 
    fetchSplitPhieuKinhDoanhItems,
    splitPhieuKinhDoanh,
    mergePhieuKinhDoanh,
    transferDonHangBan,
    cancelDonHangBan as cancelOrderApi
} from "./phieuKinhDoanhApi";

const { RangePicker } = DatePicker;
const { Title, Text } = Typography;

const ListPhieuKinhDoanh = () => {
    const navigate = useNavigate();
    const userInfo = useSelector((state) => state?.claimsReducer?.userInfo || {});

    const [allData, setAllData] = useState([]);
    const [totalRecords, setTotalRecords] = useState(0);
    const [currentPage, setCurrentPage] = useState(() => {
        try {
            const savedPage = sessionStorage.getItem("don_hang_kinh_doanh_page");
            return savedPage ? parseInt(savedPage) : 1;
        } catch (e) { return 1; }
    });
    const [loading, setLoading] = useState(false);
    const [screenSize, setScreenSize] = useState("desktop");
    const [showMobileFilter, setShowMobileFilter] = useState(false);
    
    // Persistence
    const FILTER_STORAGE_KEY = "don_hang_kinh_doanh_filters";
    const PAGE_STORAGE_KEY = "don_hang_kinh_doanh_page";

    const getSavedFilters = () => {
        try {
            const saved = sessionStorage.getItem(FILTER_STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed.dateRange && Array.isArray(parsed.dateRange)) {
                    parsed.dateRange = parsed.dateRange.map(d => d ? dayjs(d) : null);
                }
                if (!parsed.status) {
                    parsed.status = ["0", "1", "2"];
                }
                return parsed;
            }
        } catch (e) { console.error(e); }
        return {
            so_ct: "",
            ma_kh: "",
            ten_kh: "",
            ten_nvbh: "",
            kw_nguoi_tao: "",
            dateRange: null,
            status: ["0", "1", "2"],
        };
    };

    const [filters, setFilters] = useState(getSavedFilters());

    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const [selectedRowsData, setSelectedRowsData] = useState([]);
    
    // Split state
    const [splitModalVisible, setSplitModalVisible] = useState(false);
    const [splitItems, setSplitItems] = useState([]);
    const [selectedSplitKeys, setSelectedSplitKeys] = useState([]);
    const [currentSplitSttRec, setCurrentSplitSttRec] = useState(null);
    const [splitLoading, setSplitLoading] = useState(false);

    // Merge state
    const [mergeLoading, setMergeLoading] = useState(false);

    // Transfer state
    const [transferLoading, setTransferLoading] = useState(false);

    // Cancel state
    const [cancelLoading, setCancelLoading] = useState(false);


    const pageSize = 20;

    useEffect(() => {
        const checkScreenSize = () => {
            const width = window.innerWidth;
            if (width < 480) setScreenSize("mobile");
            else if (width < 768) setScreenSize("mobileLandscape");
            else if (width < 1024) setScreenSize("tablet");
            else setScreenSize("desktop");
        };
        checkScreenSize();
        window.addEventListener("resize", checkScreenSize);
        return () => window.removeEventListener("resize", checkScreenSize);
    }, []);

    const fetchData = useCallback(async (page = 1, currentFilters = filters) => {
        setLoading(true);
        try {
            const res = await fetchPhieuKinhDoanhList({
                ...currentFilters,
                UserId: userInfo?.id || userInfo?.userId || 1,
                PageIndex: page,
                PageSize: pageSize
            });

            if (res.success && Array.isArray(res.data)) {
                setAllData(res.data);
                setTotalRecords(res.pagination?.totalRecord || res.data.length || 0);
            } else {
                setAllData([]);
                setTotalRecords(0);
            }
        } catch (err) {
            console.error("Lỗi gọi danh sách phiếu kinh doanh:", err);
            message.error("Không thể tải danh sách đơn hàng");
            setAllData([]);
            setTotalRecords(0);
        } finally {
            setLoading(false);
        }
    }, [userInfo, pageSize, filters]);

    // Lưu filters vào sessionStorage mỗi khi filters thay đổi
    useEffect(() => {
        try {
            const forStorage = { ...filters };
            if (forStorage.dateRange) {
                forStorage.dateRange = forStorage.dateRange.map(d => d ? d.format("YYYY-MM-DD") : null);
            }
            sessionStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(forStorage));
        } catch (e) { console.error(e); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters]);

    // Lưu currentPage vào sessionStorage mỗi khi trang thay đổi
    useEffect(() => {
        try {
            sessionStorage.setItem(PAGE_STORAGE_KEY, currentPage.toString());
        } catch (e) { console.error(e); }
    }, [currentPage]);

    // Tạo hàm fetch đã được debounce
    const debouncedFetchData = useMemo(
        () => _.debounce((page, currentFilters) => {
            fetchData(page, currentFilters);
        }, 500),
        [fetchData]
    );

    useEffect(() => {
        setLoading(true); // Hiển thị loading ngay lập tức để người dùng biết hệ thống đang xử lý
        debouncedFetchData(currentPage, filters);
        
        return () => {
            debouncedFetchData.cancel();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage, filters]);

    const handleFilter = (key, value, confirm) => {
        if (confirm) confirm();
        const newFilters = { ...filters, [key]: value };
        setFilters(newFilters);
        setCurrentPage(1);
        // fetch will be triggered by useEffect
    };

    const handleRefresh = () => {
        fetchData(currentPage, filters);
    };

    const clearAllFilters = () => {
        const cleared = {
            so_ct: "",
            ma_kh: "",
            ten_kh: "",
            ten_nvbh: "",
            kw_nguoi_tao: "",
            dateRange: null,
            status: ["0", "1", "2", "3", "4", "5", "6", "9"],
        };
        // Xóa cả trong sessionStorage
        try { sessionStorage.removeItem(FILTER_STORAGE_KEY); } catch (e) { console.error(e); }
        setFilters(cleared);
        setCurrentPage(1);
    };

    const removeFilter = (key) => {
        handleFilter(key, key === "dateRange" ? null : "");
    };

    const activeChips = useMemo(() => {
        const chips = [];
        if (filters.so_ct) chips.push({ key: "so_ct", label: "Số ĐH", value: filters.so_ct });
        if (filters.ten_kh) chips.push({ key: "ten_kh", label: "Khách hàng", value: filters.ten_kh });
        if (filters.ten_nvbh) chips.push({ key: "ten_nvbh", label: "NVKD", value: filters.ten_nvbh });
        if (filters.kw_nguoi_tao) chips.push({ key: "kw_nguoi_tao", label: "Người lập", value: filters.kw_nguoi_tao });
        if (filters.status && Array.isArray(filters.status) && filters.status.length > 0) {
            const statusMap = { 
                "0": "Lập ctừ", 
                "1": "Chờ duyệt", 
                "2": "Duyệt",
                "3": "Treo",
                "4": "Đang xuất",
                "5": "Hoàn thành",
                "6": "Đóng",
                "9": "Hủy"
            };
            const labels = filters.status.map(s => statusMap[s] || s);
            chips.push({ key: "status", label: "Trạng thái", value: labels.join(", "), rawValue: filters.status });
        }
        if (filters.dateRange && filters.dateRange[0] && filters.dateRange[1]) {
            chips.push({
                key: "dateRange",
                label: "Ngày",
                value: `${filters.dateRange[0].format("DD-MM-YYYY")} - ${filters.dateRange[1].format("DD-MM-YYYY")}`
            });
        }
        return chips;
    }, [filters]);

    const chipsBar = activeChips.length > 0 ? (
        <div className="filter-chips-container">
            <div className="filter-chips-left">
                <FilterOutlined className="filter-chips-icon" />
                <span className="filter-chips-title">Bộ lọc đang áp dụng:</span>
                <div className="filter-chips-list">
                    {activeChips.map(chip => (
                        <Tag 
                            key={chip.key} 
                            closable 
                            onClose={(e) => { 
                                e.preventDefault(); 
                                if (chip.key === "status") {
                                    // Status is now multi-select
                                    handleFilter("status", []);
                                } else {
                                    removeFilter(chip.key); 
                                }
                            }}
                            className={`filter-chip ${
                                chip.key === "status"
                                  ? "filter-chip--blue"
                                  : chip.key === "dateRange"
                                  ? "filter-chip--green"
                                  : chip.key === "so_ct"
                                  ? "filter-chip--orange"
                                  : chip.key === "ten_kh"
                                  ? "filter-chip--magenta"
                                  : chip.key === "ten_nvbh" || chip.key === "kw_nguoi_tao"
                                  ? "filter-chip--purple"
                                  : "filter-chip--blue"
                              }`}
                        >
                            {chip.label}: {chip.value}
                        </Tag>
                    ))}
                </div>
            </div>
            <div className="filter-chips-right">
                <Button size="small" type="text" onClick={clearAllFilters}>Xóa lọc</Button>
            </div>
        </div>
    ) : null;

    const getStatusColor = (status) => {
        switch (String(status).trim()) {
            case "0": return "orange";
            case "1": return "magenta";
            case "2": return "blue";
            case "3": return "purple";
            case "4": return "green";
            case "5": return "cyan";
            case "6": return "red";
            case "9": return "green";
            default: return "default";
        }
    };




    const handleOpenSplitModal = async (record) => {
        // 1. Kiểm tra trạng thái phiếu (Chỉ '0' - Lập chứng từ hoặc '1' - Chờ duyệt)
        if (String(record.status) !== "0" && String(record.status) !== "1") {
            message.error(`Đơn hàng ${record.so_ct} có trạng thái không hợp lệ. Chỉ đơn 'Lập chứng từ' hoặc 'Chờ duyệt' mới được tách.`);
            return;
        }

        // 2. Kiểm tra trạng thái soạn hàng (Chỉ cho phép '0' hoặc trống)
        const s = (record.status_soan_hang || "").trim();
        if (s !== "" && s !== "0") {
            message.error(`Đơn hàng ${record.so_ct} đã được xử lý ở kho (Trạng thái soạn hàng: ${s}). Không thể tách đơn.`);
            return;
        }

        setCurrentSplitSttRec(record.stt_rec);
        setSplitLoading(true);
        const res = await fetchSplitPhieuKinhDoanhItems(record.stt_rec);
        if (res.success) {
            setSplitItems(res.data);
            setSplitModalVisible(true);
        } else {
            message.error("Không thể tải danh sách vật tư để tách đơn");
        }
        setSplitLoading(false);
    };

    const onHandleSplit = async () => {
        if (selectedSplitKeys.length === 0) {
            message.warning("Vui lòng chọn ít nhất một vật tư để tách");
            return;
        }
        setLoading(true);
        const ma_vt_list = selectedSplitKeys.join(",") + ",";
        const res = await splitPhieuKinhDoanh(currentSplitSttRec, ma_vt_list, 1);
        if (res.success) {
            message.success(res.message || "Tách đơn hàng thành công");
            setSplitModalVisible(false);
            setSelectedSplitKeys([]);
            fetchData(currentPage, filters);
        } else {
            message.error(res.message || "Lỗi khi tách đơn hàng");
        }
        setLoading(false);
    };

    const onHandleMerge = async () => {
        if (selectedRowKeys.length < 2) {
            message.warning("Vui lòng chọn ít nhất 2 đơn hàng để gộp");
            return;
        }

        const selectedRows = selectedRowsData;

        // 1. Kiểm tra trạng thái: chỉ cho phép gộp đơn ở trạng thái '0' (Lập chứng từ) hoặc '1' (Chờ duyệt)
        const invalidStatus = selectedRows.find(item => String(item.status) !== "0" && String(item.status) !== "1");
        if (invalidStatus) {
            message.error(`Đơn hàng ${invalidStatus.so_ct} có trạng thái không hợp lệ. Chỉ đơn 'Lập chứng từ' hoặc 'Chờ duyệt' mới được gộp.`);
            return;
        }

        // 1.1 Kiểm tra trạng thái soạn hàng (Phải là '0' hoặc trống mới được gộp)
        const invalidSoanHang = selectedRows.find(item => {
            const s = (item.status_soan_hang || "").trim();
            return s !== "" && s !== "0";
        });
        if (invalidSoanHang) {
            const s = (invalidSoanHang.status_soan_hang || "").trim();
            message.error(`Đơn hàng ${invalidSoanHang.so_ct} đã được xử lý ở kho (Trạng thái soạn hàng: ${s}). Không thể gộp đơn.`);
            return;
        }

        // 2. Kiểm tra chung mã khách hàng (Sử dụng trim() để loại bỏ khoảng trắng thừa từ DB)
        const firstMaKh = (selectedRows[0].ma_kh || "").toString().trim();
        const differentMaKh = selectedRows.find(item => (item.ma_kh || "").toString().trim() !== firstMaKh);
        if (differentMaKh) {
            message.error("Các đơn hàng được gộp phải có cùng Mã khách hàng.");
            return;
        }

        // 3. Kiểm tra chung mã nhân viên (Sử dụng trim() để loại bỏ khoảng trắng thừa từ DB)
        const firstMaNv = (selectedRows[0].ma_nvbh || "").toString().trim();
        const differentMaNv = selectedRows.find(item => (item.ma_nvbh || "").toString().trim() !== firstMaNv);
        if (differentMaNv) {
            message.error("Các đơn hàng được gộp phải có cùng Nhân viên kinh doanh.");
            return;
        }

        showConfirm({
            title: "Xác nhận gộp đơn hàng",
            content: `Bạn có chắc chắn muốn gộp ${selectedRowKeys.length} đơn hàng đã chọn?`,
            type: "info",
            onOk: async () => {
                setMergeLoading(true);
                const stt_rec_list = selectedRowKeys.join(",");
                const res = await mergePhieuKinhDoanh(stt_rec_list, userInfo?.id || userInfo?.userId || 1);
                if (res.success) {
                    message.success(res.message || "Gộp đơn hàng thành công");
                    setSelectedRowKeys([]);
                    setSelectedRowsData([]);
                    fetchData(currentPage, filters);
                } else {
                    message.error(res.message || "Lỗi khi gộp đơn hàng");
                }
                setMergeLoading(false);
            }
        });
    };

    const onHandleTransferToWarehouse = async () => {
        if (selectedRowKeys.length === 0) {
            message.warning("Vui lòng chọn ít nhất một đơn hàng để chuyển kho");
            return;
        }

        const selectedRows = selectedRowsData;

        // 1. Kiểm tra trạng thái: chỉ cho phép chuyển đơn ở trạng thái '2' (Duyệt)
        const invalidStatus = selectedRows.find(item => String(item.status) !== "2");
        if (invalidStatus) {
            message.error(`Đơn hàng ${invalidStatus.so_ct} chưa được duyệt. Chỉ đơn trạng thái 'Duyệt' mới được chuyển kho.`);
            return;
        }

        // 2. Kiểm tra trạng thái soạn hàng: chỉ cho phép '0' hoặc trống
        const invalidSoanHang = selectedRows.find(item => {
            const s = (item.status_soan_hang || "").trim();
            return s !== "" && s !== "0";
        });
        if (invalidSoanHang) {
            const s = (invalidSoanHang.status_soan_hang || "").trim();
            message.error(`Đơn hàng ${invalidSoanHang.so_ct} đã có trạng thái soạn hàng (${s}). Không thể chuyển lại.`);
            return;
        }

        showConfirm({
            title: "Xác nhận chuyển kho",
            content: `Bạn có chắc chắn muốn chuyển ${selectedRowKeys.length} đơn hàng đã chọn xuống kho không?`,
            type: "info",
            onOk: async () => {
                setTransferLoading(true);
                const stt_rec_list = selectedRowKeys.join(",");
                const res = await transferDonHangBan(stt_rec_list, userInfo?.id || userInfo?.userId || 1);
                if (res.success) {
                    message.success(res.message || "Chuyển đơn hàng xuống kho thành công");
                    setSelectedRowKeys([]);
                    setSelectedRowsData([]);
                    fetchData(currentPage, filters);
                } else {
                    message.error(res.message || "Lỗi khi chuyển đơn hàng xuống kho");
                }
                setTransferLoading(false);
            }
        });
    };

    const onHandleCancelOrders = async () => {
        if (selectedRowKeys.length === 0) {
            message.warning("Vui lòng chọn ít nhất một đơn hàng để hủy");
            return;
        }

        const selectedRows = selectedRowsData;

        // 1. Kiểm tra trạng thái: Không cho phép hủy nếu đã hoàn thành (5), đóng (6) hoặc đã hủy (9)
        const invalidStatus = selectedRows.find(item => 
            String(item.status) === "5" || 
            String(item.status) === "6" || 
            String(item.status) === "9"
        );
        if (invalidStatus) {
            const statusLabel = 
                String(invalidStatus.status) === "9" ? "Đã hủy" : 
                String(invalidStatus.status) === "5" ? "Hoàn thành" : 
                String(invalidStatus.status) === "6" ? "Đóng" : 
                (invalidStatus.statusname || invalidStatus.status);

            message.error(`Đơn hàng ${invalidStatus.so_ct} đang ở trạng thái "${statusLabel}". Không thể tiếp tục hủy.`);
            return;
        }

        showConfirm({
            title: "Xác nhận hủy đơn hàng",
            content: `Bạn có chắc chắn muốn hủy ${selectedRowKeys.length} đơn hàng đã chọn không?`,
            type: "danger",
            onOk: async () => {
                setCancelLoading(true);
                const stt_rec_list = selectedRowKeys.join(",");
                const res = await cancelOrderApi(stt_rec_list, userInfo?.id || userInfo?.userId || 1);
                if (res.success) {
                    message.success(res.message || "Hủy đơn hàng thành công");
                    setSelectedRowKeys([]);
                    setSelectedRowsData([]);
                    fetchData(currentPage, filters);
                } else {
                    message.error(res.message || "Lỗi khi hủy đơn hàng");
                }
                setCancelLoading(false);
            }
        });
    };


    const numFmt = (val) => `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

    const getColumns = () => {
        const baseColumns = [
            {
                title: "Thời gian",
                key: "thoi_gian",
                width: 140,
                align: "center",
                render: (_, record) => {
                    const hasKhoKD = record.thoi_gian_chuyen_kinh_doanh && 
                        !String(record.thoi_gian_chuyen_kinh_doanh).startsWith("1900") && 
                        !String(record.thoi_gian_chuyen_kinh_doanh).startsWith("0001");
                    
                    const cellStyle = hasKhoKD ? { color: '#ff4d4f' } : {};
                    const labelStyle = { fontSize: '10px', color: hasKhoKD ? '#ff4d4f' : undefined };

                    return (
                        <div style={{ fontSize: '11px', lineHeight: '1.4', ...cellStyle }}>
                            <div><Text type={hasKhoKD ? "" : "secondary"} style={labelStyle}>Tạo:</Text> {record.datetime0 ? dayjs(record.datetime0).format("HH:mm DD/MM") : "--"}</div>
                            <div><Text type={hasKhoKD ? "" : "secondary"} style={labelStyle}>KD-Kho:</Text> {record.thoi_gian_chuyen_kho ? dayjs(record.thoi_gian_chuyen_kho).format("HH:mm DD/MM") : "--"}</div>
                            {hasKhoKD && (
                                <div><Text style={labelStyle}>Kho-KD:</Text> {dayjs(record.thoi_gian_chuyen_kinh_doanh).format("HH:mm DD/MM")}</div>
                            )}
                        </div>
                    );
                }
            },
            {
                title: "NVKD",
                dataIndex: "ten_nvbh",
                key: "ten_nvbh",
                width: 140,
                align: "center",
                render: (val, record) => (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <span style={{ fontSize: '11px', fontWeight: 600 }}>{val}</span>
                        {record.stt_rec_hightlight && String(record.stt_rec_hightlight).trim() !== '' && (
                            <div style={{ color: '#ff4d4f', fontSize: '10px', marginTop: '2px', lineHeight: 1 }}>★★★★★</div>
                        )}
                    </div>
                ),
                filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) => (
                    <div style={{ padding: 8 }}>
                        <Input
                            placeholder="Tên NVKD"
                            value={selectedKeys[0]}
                            onChange={e => setSelectedKeys(e.target.value ? [e.target.value] : [])}
                            onPressEnter={() => handleFilter("ten_nvbh", selectedKeys[0], confirm)}
                            style={{ marginBottom: 8, display: 'block' }}
                        />
                        <Button
                            type="primary"
                            onClick={() => handleFilter("ten_nvbh", selectedKeys[0], confirm)}
                            size="small"
                        >
                            Tìm
                        </Button>
                    </div>
                ),
                filteredValue: filters.ten_nvbh ? [filters.ten_nvbh] : null,
            },
            {
                title: "Đơn hàng",
                key: "don_hang",
                width: 160,
                align: "center",
                render: (_, record) => (
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                            <Text strong>{record.so_ct}</Text>
                        </div>
                        <div style={{ fontSize: '11px', color: '#8c8c8c' }}>{dayjs(record.ngay_ct).format("DD-MM-YYYY")}</div>
                        {record.thu_tu_don_hang && (
                            <div style={{ fontSize: '10px', color: '#6366f1', fontWeight: 600 }}>{record.thu_tu_don_hang.trim()}</div>
                        )}
                    </div>
                ),
                filterDropdown: ({ confirm }) => (
                    <div style={{ padding: 12, width: 280 }}>
                        <div style={{ marginBottom: 8, fontWeight: 600, fontSize: '12px', color: '#6366f1' }}>Số đơn hàng:</div>
                        <Input
                            placeholder="Nhập số đơn hàng..."
                            value={filters.so_ct}
                            onChange={e => {
                                const val = e.target.value;
                                setFilters(prev => ({ ...prev, so_ct: val }));
                            }}
                            onPressEnter={() => {
                                fetchData(1, filters);
                                confirm();
                            }}
                            style={{ marginBottom: 16, display: 'block' }}
                        />

                        <div style={{ marginBottom: 8, fontWeight: 600, fontSize: '12px', color: '#6366f1' }}>Khoảng ngày:</div>
                        <RangePicker
                            value={filters.dateRange}
                            onChange={(dates) => {
                                setFilters(prev => ({ ...prev, dateRange: dates }));
                            }}
                            format={["DD-MM-YYYY", "DD/MM/YYYY", "DDMMYYYY"]}
                            style={{ width: '100%', marginBottom: 16 }}
                            placeholder={['Từ ngày', 'Đến ngày']}
                        />

                        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                            <Button 
                                onClick={() => {
                                    const cleared = { ...filters, so_ct: "", dateRange: null };
                                    setFilters(cleared);
                                    fetchData(1, cleared);
                                    confirm();
                                }}
                                style={{ 
                                    flex: 1, 
                                    height: '36px', 
                                    borderRadius: '8px', 
                                    fontSize: '13px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    margin: 0
                                }}
                            >
                                Xóa lọc
                            </Button>
                            <Button 
                                type="primary" 
                                onClick={() => {
                                    fetchData(1, filters);
                                    confirm();
                                }}
                                style={{ 
                                    flex: 1, 
                                    height: '36px', 
                                    borderRadius: '8px', 
                                    fontSize: '13px', 
                                    fontWeight: 600,
                                    background: '#6366f1',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    margin: 0
                                }}
                            >
                                Tìm kiếm
                            </Button>
                        </div>
                    </div>
                ),
                filteredValue: (filters.so_ct || filters.dateRange) ? [1] : null,
            },
            {
                title: "Khách hàng",
                key: "khach_hang",
                width: 220,
                align: "center",
                render: (_, record) => (
                    <div>
                        <div style={{ fontWeight: 600, color: '#1a1a1a' }}>{record.ten_kh}</div>
                        <div style={{ fontSize: '12px', color: '#8c8c8c' }}>{record.ma_kh}</div>
                        {record.ten_kh2 && <div style={{ fontSize: '10px', color: '#475569', fontStyle: 'italic' }}>{record.ten_kh2}</div>}
                        {record.dien_thoai && <div style={{ fontSize: '11px', color: '#6366f1', fontWeight: 500 }}>{record.dien_thoai}</div>}
                    </div>
                ),
                filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) => (
                    <div style={{ padding: 8 }}>
                        <Input
                            placeholder="Mã hoặc tên khách"
                            value={selectedKeys[0]}
                            onChange={e => setSelectedKeys(e.target.value ? [e.target.value] : [])}
                            onPressEnter={() => handleFilter("ten_kh", selectedKeys[0], confirm)}
                            style={{ marginBottom: 8, display: 'block' }}
                        />
                        <Button type="primary" onClick={() => handleFilter("ten_kh", selectedKeys[0], confirm)} size="small">Tìm</Button>
                    </div>
                ),
                filteredValue: filters.ten_kh ? [filters.ten_kh] : null,
            },
            {
                title: "Ghi chú / Diễn giải",
                key: "ghi_chu",
                width: 180,
                align: "center",
                render: (_, record) => (
                    <div style={{ fontSize: '11px', lineHeight: '1.4' }}>
                        {record.ghi_chu_kh && <div style={{ color: '#fa8c16' }}><Text type="secondary">KH:</Text> {record.ghi_chu_kh}</div>}
                        {record.ghi_chu_giao_hang && <div style={{ color: '#52c41a' }}><Text type="secondary">VC:</Text> {record.ghi_chu_giao_hang}</div>}
                        {record.dien_giai && <div><Text type="secondary">DG:</Text> {record.dien_giai}</div>}
                    </div>
                )
            },

            {
                title: "Tổng tiền",
                dataIndex: "t_tt_nt",
                key: "t_tt_nt",
                width: 120,
                align: "center",
                render: (val) => <Text strong style={{ color: '#52c41a', fontSize: '15px' }}>{numFmt(val || 0)}</Text>,
            },
            {
                title: "Nhà xe",
                key: "nha_xe",
                width: 180,
                align: "center",
                render: (_, record) => (
                    <div style={{ fontSize: '11px', lineHeight: '1.4' }}>
                        <div style={{ fontWeight: 600, color: '#1a1a1a' }}>{record.ten_vc || "--"}</div>
                        {record.gio_xe && (
                            <div style={{ fontSize: '10px', color: '#ef4444' }}>
                                <Text type="secondary" style={{ fontSize: '10px' }}>Giờ:</Text> {record.gio_xe.trim()}
                            </div>
                        )}
                        {record.sdt_xe && (
                            <div style={{ fontSize: '10px', color: '#64748b' }}>
                                <Text type="secondary" style={{ fontSize: '10px' }}>SĐT:</Text> {record.sdt_xe.trim()}
                            </div>
                        )}
                    </div>
                )
            },

            // {
            //     title: "Người lập",
            //     dataIndex: "nguoi_tao",
            //     key: "nguoi_tao",
            //     width: 120,
            //     align: "center",
            //     render: (val) => <span style={{ fontSize: '11px' }}>{val ? val.trim() : ""}</span>,
            //     filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) => (
            //         <div style={{ padding: 8 }}>
            //             <Input
            //                 placeholder="Tên người lập"
            //                 value={selectedKeys[0]}
            //                 onChange={e => setSelectedKeys(e.target.value ? [e.target.value] : [])}
            //                 onPressEnter={() => handleFilter("kw_nguoi_tao", selectedKeys[0], confirm)}
            //                 style={{ marginBottom: 8, display: 'block' }}
            //             />
            //             <Button
            //                 type="primary"
            //                 onClick={() => handleFilter("kw_nguoi_tao", selectedKeys[0], confirm)}
            //                 size="small"
            //             >
            //                 Tìm
            //             </Button>
            //         </div>
            //     ),
            //     filteredValue: filters.kw_nguoi_tao ? [filters.kw_nguoi_tao] : null,
            // },
            {
                title: "Trạng thái",
                dataIndex: "statusname",
                key: "status",
                width: 120,
                align: "center",
                render: (statusname, record) => {
                    const status = String(record.status).trim();
                    const displayStatus = statusname ? statusname.replace(/^\d+\.\s*/, '') : "";
                        
                    return (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                            <Tag color={getStatusColor(status)} style={{ margin: 0, textAlign: 'center', fontSize: '11px' }}>
                                {displayStatus}
                            </Tag>
                        <div style={{ fontSize: '10px', color: '#8c8c8c' }}>
                            Soạn: <Text style={{ 
                                color: (record.status_soan_hang && String(record.status_soan_hang).trim() !== "0" && String(record.status_soan_hang).trim() !== "") ? '#52c41a' : '#bfbfbf', 
                                fontSize: '10px' 
                            }}>
                                {(!record.status_soan_hang || String(record.status_soan_hang).trim() === "0" || String(record.status_soan_hang).trim() === "") 
                                    ? "Chưa soạn" 
                                    : (String(record.status_soan_hang).trim() === "1" ? "Đã soạn" : record.status_soan_hang)}
                            </Text>
                        </div>
                        {record.tt_giao_van && (
                            <div style={{ fontSize: '10px', color: '#8c8c8c' }}>
                                Giao: <Text type="secondary" style={{ fontSize: '10px' }}>{record.tt_giao_van}</Text>
                            </div>
                        )}
                        </div>
                    );
                },
                filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) => (
                    <div className="status-filter-dropdown">
                        <div className="status-filter-dropdown__title">
                            Trạng thái đơn hàng:
                        </div>
                        <div style={{ maxHeight: '180px', overflowY: 'auto', marginBottom: '8px', paddingRight: '4px' }}>
                            <Checkbox.Group
                                value={selectedKeys}
                                onChange={value => {
                                    setSelectedKeys(value || []);
                                }}
                                className="status-filter-dropdown__checkbox-group"
                            >
                                <Checkbox value="0">Lập ctừ</Checkbox>
                                <Checkbox value="1">Chờ duyệt</Checkbox>
                                <Checkbox value="2">Duyệt</Checkbox>
                                <Checkbox value="3">Treo</Checkbox>
                                <Checkbox value="4">Đang xuất</Checkbox>
                                <Checkbox value="5">Hoàn thành</Checkbox>
                                <Checkbox value="6">Đóng</Checkbox>
                                <Checkbox value="9">Hủy</Checkbox>
                            </Checkbox.Group>
                        </div>
                        <div className="status-filter-dropdown__actions">
                            <Button
                                size="small"
                                style={{ flex: 1 }}
                                onClick={() => {
                                    setSelectedKeys([]);
                                    handleFilter("status", [], confirm);
                                }}
                            >
                                Xóa
                            </Button>
                            <Button
                                type="primary"
                                size="small"
                                className="status-filter-dropdown__confirm-btn"
                                style={{ flex: 1 }}
                                onClick={() => {
                                    handleFilter("status", selectedKeys, confirm);
                                }}
                            >
                                Xác nhận
                            </Button>
                        </div>
                    </div>
                ),
                filteredValue: filters.status && filters.status.length > 0 ? filters.status : null,
            },
            {
                title: "Hành động",
                key: "action",
                width: 160,
                align: "center",
                fixed: "right",
                render: (_, record) => (
                    <div className="phieu-action-group">
                        <button
                            className="phieu-action-btn phieu-action-btn--view"
                            title="Xem chi tiết"
                            onClick={() => navigate(`/kinh-doanh/chi-tiet/${record.stt_rec}`)}
                        >
                            <FileTextOutlined />
                        </button>
                        <button
                            className="phieu-action-btn phieu-action-btn--edit"
                            title="Tách đơn"
                            onClick={() => handleOpenSplitModal(record)}
                            style={{ color: '#eb2f96' }}
                        >
                            <ScissorOutlined />
                        </button>
                        {/* <button
                            className="phieu-action-btn phieu-action-btn--edit"
                            title="Sửa"
                            onClick={() => navigate(`/kinh-doanh/edit/${record.stt_rec}`)}
                        >
                            <EditOutlined />
                        </button> */}
                    </div>
                ),
            },
        ];
        return baseColumns;
    };

    const renderMobileItem = (item) => {
        const isSelected = selectedRowKeys.includes(item.stt_rec);
        
        const toggleSelect = (e) => {
            e.stopPropagation();
            const keys = [...selectedRowKeys];
            let nextData = [...selectedRowsData];
            
            if (isSelected) {
                const index = keys.indexOf(item.stt_rec);
                if (index > -1) keys.splice(index, 1);
                nextData = nextData.filter(f => f.stt_rec !== item.stt_rec);
            } else {
                keys.push(item.stt_rec);
                nextData.push(item);
            }
            setSelectedRowKeys(keys);
            setSelectedRowsData(nextData);
        };

        return (
            <Card
                className={`mobile-phieu-card ${isSelected ? 'is-selected' : ''} ${(item.stt_rec_hightlight !== null && String(item.stt_rec_hightlight).trim() !== '') ? 'row-new-highlight' : ''}`}
                key={item.stt_rec}
                onClick={toggleSelect}
                actions={[
                    <FileTextOutlined key="view" onClick={(e) => { e.stopPropagation(); navigate(`/kinh-doanh/chi-tiet/${item.stt_rec}`); }} style={{ color: '#1890ff' }} />,
                    <ScissorOutlined key="split" onClick={(e) => { e.stopPropagation(); handleOpenSplitModal(item); }} style={{ color: '#eb2f96' }} />,
                    <div key="select" onClick={toggleSelect} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                         <Checkbox checked={isSelected} onClick={toggleSelect} />
                    </div>
                ]}
            >
                <div className="mobile-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {item.bcontract_id && (
                            <Tag color="blue" style={{ margin: 0, fontWeight: 700, fontSize: '12px' }}>
                                {item.bcontract_id.trim()}
                            </Tag>
                        )}
                        <Text strong style={{ fontSize: '15px' }}>{item.so_ct}</Text>
                        <Text type="secondary" style={{ fontSize: '13px' }}> - {dayjs(item.ngay_ct).format("DD-MM-YYYY")}</Text>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                        <Tag color={getStatusColor(item.status)} style={{ margin: 0 }}>{item.statusname ? item.statusname.replace(/^\d+\.\s*/, '') : ""}</Tag>
                        <div style={{ fontSize: '10px', color: '#8c8c8c' }}>
                            <Text style={{ 
                                color: (item.status_soan_hang && String(item.status_soan_hang).trim() !== "0" && String(item.status_soan_hang).trim() !== "") ? '#52c41a' : '#bfbfbf', 
                                fontSize: '10px' 
                            }}>
                                {(!item.status_soan_hang || String(item.status_soan_hang).trim() === "0" || String(item.status_soan_hang).trim() === "") 
                                    ? "Chưa soạn" 
                                    : (String(item.status_soan_hang).trim() === "1" ? "Đã soạn" : item.status_soan_hang)}
                            </Text>
                        </div>
                    </div>
                </div>
                <div className="mobile-card-body">
                    <div className="mobile-card-row">
                        <Text type="secondary">Khách hàng:</Text>
                        <div style={{ textAlign: 'right' }}>
                            <div><Text strong>{item.ten_kh}</Text></div>
                            <div><Text size="small" type="secondary">{item.ma_kh}</Text></div>
                        </div>
                    </div>
                    <div className="mobile-card-row" style={{ marginTop: 2 }}>
                        <Text type="secondary">Tổng tiền:</Text>
                        <Text strong style={{ color: '#52c41a', fontSize: '16px' }}>{numFmt(item.t_tt_nt || 0)}</Text>
                    </div>
                    <div className="mobile-card-row" style={{ marginTop: 4, borderTop: '1px solid #f0f0f0', paddingTop: 4 }}>
                        <div style={{ fontSize: '11px', color: '#8c8c8c' }}>
                            Giờ đặt: {item.datetime0 ? dayjs(item.datetime0).format("HH:mm DD/MM") : "--"}
                        </div>
                        <div style={{ fontSize: '11px', color: '#8c8c8c' }}>
                            Chuyển kho: {item.thoi_gian_chuyen_kho ? dayjs(item.thoi_gian_chuyen_kho).format("HH:mm DD/MM") : "--"}
                        </div>
                    </div>
                    {item.ten_nvbh && (
                        <div className="mobile-card-row">
                            <Text type="secondary">Nhân viên:</Text>
                            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                <Text>{item.ten_nvbh}</Text>
                                {item.stt_rec_hightlight && String(item.stt_rec_hightlight).trim() !== '' && (
                                    <div style={{ color: '#ff4d4f', fontSize: '10px', lineHeight: 1 }}>★★★★★</div>
                                )}
                            </div>
                        </div>
                    )}
                    {(item.dien_giai || item.ghi_chu_kh || item.ghi_chu_giao_hang) && (
                        <div className="mobile-card-notes" style={{ 
                            marginTop: 10, 
                            borderTop: '1px dashed #eee', 
                            paddingTop: 10,
                            fontSize: '12px'
                        }}>
                             {item.dien_giai && (
                                <div style={{ marginBottom: 2 }}>
                                    <Text type="secondary" style={{ fontSize: '11px' }}>Diễn giải: </Text>
                                    <Text>{item.dien_giai}</Text>
                                </div>
                             )}
                             {item.ghi_chu_kh && (
                                <div style={{ marginBottom: 2, color: '#fa8c16' }}>
                                    <Text type="secondary" style={{ fontSize: '11px', color: '#fa8c16' }}>Ghi chú KH: </Text>
                                    <Text style={{ color: '#fa8c16' }}>{item.ghi_chu_kh}</Text>
                                </div>
                             )}
                             {item.ghi_chu_giao_hang && (
                                <div style={{ color: '#52c41a' }}>
                                    <Text type="secondary" style={{ fontSize: '11px', color: '#52c41a' }}>Ghi chú VC: </Text>
                                    <Text style={{ color: '#52c41a' }}>{item.ghi_chu_giao_hang}</Text>
                                </div>
                             )}
                        </div>
                    )}
                </div>
            </Card>
        );
    };

    const mobileFilterHeader = (
        <div className="mobile-filter-header">
            <Button
                icon={<SearchOutlined />}
                onClick={() => setShowMobileFilter(!showMobileFilter)}
                type={showMobileFilter ? "primary" : "default"}
            >
                Bộ lọc
            </Button>
            {showMobileFilter && (
                <div className="mobile-filter-content" style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
                    <div>
                        <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Số đơn hàng:</div>
                        <Input
                            placeholder="Nhập số đơn hàng..."
                            value={filters.so_ct}
                            onChange={e => handleFilter("so_ct", e.target.value)}
                            style={{ borderRadius: '8px' }}
                        />
                    </div>
                    <div>
                        <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Khách hàng:</div>
                        <Input
                            placeholder="Mã hoặc tên khách hàng"
                            value={filters.ten_kh}
                            onChange={e => handleFilter("ten_kh", e.target.value)}
                            style={{ borderRadius: '8px' }}
                        />
                    </div>
                    <div>
                        <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>NVKD:</div>
                        <Input
                            placeholder="Tên nhân viên (NVKD)"
                            value={filters.ten_nvbh}
                            onChange={e => handleFilter("ten_nvbh", e.target.value)}
                            style={{ borderRadius: '8px' }}
                        />
                    </div>
                    <div>
                        <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Khoảng ngày:</div>
                        <RangePicker
                            style={{ width: '100%', borderRadius: '8px' }}
                            onChange={dates => handleFilter("dateRange", dates)}
                            placeholder={['Từ ngày', 'Đến ngày']}
                            inputReadOnly={false}
                            format={["DD-MM-YYYY", "DD/MM/YYYY", "DDMMYYYY"]}
                        />
                    </div>
                    <div>
                        <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Trạng thái:</div>
                        <Select
                            mode="multiple"
                            placeholder="Chọn trạng thái"
                            value={filters.status && filters.status.length > 0 ? filters.status : []}
                            onChange={value => handleFilter("status", value)}
                            style={{ width: '100%' }}
                            allowClear
                            className="mobile-status-select"
                        >
                            <Select.Option value="0">Lập ctừ</Select.Option>
                            <Select.Option value="1">Chờ duyệt</Select.Option>
                            <Select.Option value="2">Duyệt</Select.Option>
                            <Select.Option value="3">Treo</Select.Option>
                            <Select.Option value="4">Đang xuất</Select.Option>
                            <Select.Option value="5">Hoàn thành</Select.Option>
                            <Select.Option value="6">Đóng</Select.Option>
                            <Select.Option value="9">Hủy</Select.Option>
                        </Select>
                    </div>
                    <Button 
                        block 
                        type="dashed" 
                        onClick={clearAllFilters}
                        style={{ marginTop: '4px', borderRadius: '8px' }}
                    >
                        Xóa tất cả bộ lọc
                    </Button>
                </div>
            )}
        </div>
    );

    return (
        <div className={`list-phieu-wrapper ${screenSize === 'mobile' ? 'is-mobile' : ''}`}>
            {screenSize === 'mobile' ? (
                <div className="phieu-container mobile-app-layout">
                    <Row align="middle" className="phieu-header mobile-sticky-header" style={{ position: "relative" }}>
                        <Col flex={1} style={{ textAlign: "left", zIndex: 1 }}>
                            <Button type="text" icon={<LeftOutlined />} onClick={() => navigate("/kinh-doanh")} />
                        </Col>

                        <div style={{
                            position: "absolute",
                            left: "50%",
                            transform: "translateX(-50%)",
                            zIndex: 0,
                            whiteSpace: "nowrap"
                        }}>
                            <Title level={5} className="phieu-title" style={{ margin: 0 }}>
                                ĐƠN HÀNG KD
                            </Title>
                        </div>

                        <Col flex={1} style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", zIndex: 1, gap: 8 }}>
                            <Button
                                type="text"
                                icon={<ReloadOutlined />}
                                onClick={handleRefresh}
                                title="Làm tươi"
                            />
                            <Button type="primary" shape="circle" icon={<PlusOutlined />} onClick={() => navigate("/kinh-doanh/them-moi")} />
                        </Col>
                    </Row>

                    {mobileFilterHeader}

                    <div className="mobile-list-content" style={{ paddingBottom: selectedRowKeys.length > 0 ? '120px' : '20px' }}>
                        {loading ? (
                            <div className="mobile-loading"><Spin size="large" /></div>
                        ) : allData.length > 0 ? (
                            <List
                                dataSource={allData}
                                renderItem={renderMobileItem}
                                pagination={{
                                    current: currentPage,
                                    pageSize: pageSize,
                                    total: totalRecords,
                                    onChange: (page) => {
                                        setCurrentPage(page);
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                    },
                                    simple: true,
                                    align: 'center',
                                    style: { marginTop: 16, marginBottom: 16 }
                                }}
                            />
                        ) : (
                            <Empty description="Không có đơn hàng nào" style={{ marginTop: 50 }} />
                        )}
                    </div>

                    {selectedRowKeys.length > 0 && (
                        <div className="mobile-sticky-actions">
                            <div className="mobile-sticky-actions__header">
                                <Text strong>Đã chọn {selectedRowKeys.length} đơn hàng</Text>
                                <Button size="small" type="link" onClick={() => { setSelectedRowKeys([]); setSelectedRowsData([]); }}>Bỏ chọn</Button>
                            </div>
                            <div className="mobile-sticky-actions__buttons">
                                <Button 
                                    icon={<ExportOutlined />} 
                                    type="primary" 
                                    size="small"
                                    onClick={onHandleTransferToWarehouse}
                                    loading={transferLoading}
                                >
                                    Chuyển kho
                                </Button>
                                <Button 
                                    icon={<MergeCellsOutlined />} 
                                    type="primary" 
                                    ghost
                                    size="small"
                                    disabled={selectedRowKeys.length < 2}
                                    onClick={onHandleMerge}
                                    loading={mergeLoading}
                                >
                                    Gộp đơn
                                </Button>
                                <Button 
                                    icon={<CloseCircleOutlined />} 
                                    type="primary" 
                                    danger 
                                    size="small"
                                    onClick={onHandleCancelOrders}
                                    loading={cancelLoading}
                                >
                                    Hủy đơn
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <CommonPhieuList
                    title="DANH SÁCH ĐƠN HÀNG KINH DOANH"
                    columns={getColumns()}
                    data={allData}
                    loading={loading}
                    onBack={() => navigate("/kinh-doanh")}
                    rowKey="stt_rec"
                    extraButtons={null}
                    extraHeader={
                        <>
                            {chipsBar}
                            <div className={`list-phieu-extra-header-actions ${chipsBar ? 'has-chips' : ''}`}>
                                <Button
                                    type="primary"
                                    icon={<PlusOutlined />}
                                    onClick={() => navigate("/kinh-doanh/them-moi")}
                                    style={{ background: '#1d4ed8', borderColor: '#1d4ed8' }}
                                >
                                    Tạo đơn hàng
                                </Button>
                                <div style={{ borderLeft: '1px solid #e5e7eb', height: '24px', margin: '0 4px' }} />
                                <Button 
                                    icon={<ExportOutlined />}
                                    type="primary" 
                                    disabled={selectedRowKeys.length === 0}
                                    onClick={onHandleTransferToWarehouse}
                                    loading={transferLoading}
                                >
                                    Chuyển kho ({selectedRowKeys.length})
                                </Button>
                                <Button 
                                    icon={<CloseCircleOutlined />}
                                    type="primary" 
                                    danger
                                    disabled={selectedRowKeys.length === 0}
                                    onClick={onHandleCancelOrders}
                                    loading={cancelLoading}
                                >
                                    Hủy đơn ({selectedRowKeys.length})
                                </Button>
                                <Button 
                                    icon={<MergeCellsOutlined />}
                                    type="primary" 
                                    ghost
                                    disabled={selectedRowKeys.length < 2}
                                    onClick={onHandleMerge}
                                    loading={mergeLoading}
                                >
                                    Gộp đơn ({selectedRowKeys.length})
                                </Button>
                                {selectedRowKeys.length > 0 && (
                                    <Button onClick={() => {
                                        setSelectedRowKeys([]);
                                        setSelectedRowsData([]);
                                    }}>Bỏ chọn</Button>
                                )}
                                
                                <div style={{ flex: 1 }} /> {/* Push refresh button to the end */}
                                
                                <Button
                                    icon={<ReloadOutlined />}
                                    onClick={handleRefresh}
                                    title="Làm tươi"
                                >
                                    Làm tươi
                                </Button>
                            </div>
                        </>
                    }
                    tableProps={{
                        onRow: (record) => ({
                            className: (record.stt_rec_hightlight !== null && String(record.stt_rec_hightlight).trim() !== '') 
                                ? 'row-new-highlight' 
                                : ''
                        }),
                        rowSelection: {
                            selectedRowKeys,
                            preserveSelectedRowKeys: true,
                            onChange: (keys, rows) => {
                                setSelectedRowKeys(keys);
                                setSelectedRowsData(prev => {
                                    const nextData = prev.filter(item => keys.includes(item.stt_rec));
                                    rows.forEach(row => {
                                        if (row && !nextData.find(f => f.stt_rec === row.stt_rec)) {
                                            nextData.push(row);
                                        }
                                    });
                                    return nextData;
                                });
                            },
                        },
                        scroll: { x: 1300 }
                    }}
                    pagination={{
                        current: currentPage,
                        pageSize: pageSize,
                        total: totalRecords,
                        onChange: (page) => {
                            setCurrentPage(page);
                        },
                        showSizeChanger: false,
                    }}
                />
            )}

            {/* ===== Split Modal ===== */}
            <Modal
                title="Tách đơn hàng"
                open={splitModalVisible}
                onCancel={() => setSplitModalVisible(false)}
                onOk={onHandleSplit}
                confirmLoading={loading}
                width={700}
                centered
                style={{ maxWidth: screenSize === 'mobile' ? '90vw' : '700px', margin: '0 auto' }}
                bodyStyle={{ padding: screenSize === 'mobile' ? '12px' : '20px' }}
                okText="Xác nhận tách"
                cancelText="Hủy"
            >
                <div style={{ marginBottom: 12, fontSize: screenSize === 'mobile' ? '13px' : '14px' }}>
                    Chọn các vật tư muốn tách sang đơn hàng mới:
                </div>
                <div style={{ width: '100%', overflowX: screenSize === 'mobile' ? 'auto' : 'hidden' }}>
                    <Table
                        size="small"
                        dataSource={splitItems}
                        pagination={false}
                        rowKey="ma_vt"
                        rowSelection={{
                            selectedRowKeys: selectedSplitKeys,
                            onChange: (keys) => setSelectedSplitKeys(keys),
                        }}
                        columns={[
                            { title: "Mã VT", dataIndex: "ma_vt", width: 80, align: "left" },
                            { title: "Tên vật tư", dataIndex: "ten_vt", minWidth: 150, align: "left" },
                            { title: "ĐVT", dataIndex: "dvt", width: 60, align: "center" },
                            { title: "SL", dataIndex: "so_luong", width: 60, align: "right", render: numFmt },
                        ]}
                        scroll={{ x: screenSize === 'mobile' ? 450 : undefined, y: 400 }}
                    />
                </div>
            </Modal>
        </div>
    );
};

export default ListPhieuKinhDoanh;
