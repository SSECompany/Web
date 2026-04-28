import { 
  LeftOutlined, 
  QrcodeOutlined, 
  UserOutlined, 
  EnvironmentOutlined, 
  ShoppingOutlined,
  CarOutlined,
  EyeOutlined,
  CheckOutlined,
  CloseOutlined,
  InboxOutlined,
  SettingOutlined,
  PhoneOutlined,
  CalendarOutlined,
  FileTextOutlined,
  FilterOutlined,
} from "@ant-design/icons";
import { Input, Spin, message, Tag, Badge, Pagination, Drawer, DatePicker, Button, Select } from "antd";
import dayjs from "dayjs";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import QRScanner from "../../../../components/common/QRScanner/QRScanner";
import "./PhieuGiaoHang.css";
import { fetchPhieuGiaoHangList, fetchPhieuGiaoHangDataByQR } from "./utils/phieuGiaoHangApi";

const STATUS_KEYS = ["3", "4", "5", "6", "7"];

const ListPhieuGiaoHang = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const userInfo = useSelector((state) => state?.claimsReducer?.userInfo || {});

  const [allData, setAllData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecord, setTotalRecord] = useState(0);
  const [countByStatus, setCountByStatus] = useState(() => ({ "3": 0, "4": 0, "5": 0, "6": 0, "7": 0 }));
  const [isLoading, setIsLoading] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [activeFilter, setActiveFilter] = useState("exported");
  const [debouncedSearchText, setDebouncedSearchText] = useState("");
  const [expandedCards, setExpandedCards] = useState(() => new Set());
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  // Bộ lọc theo API DeliveryFilter
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [filterOrderNumber, setFilterOrderNumber] = useState("");
  const [filterCustomerCode, setFilterCustomerCode] = useState("");
  const [filterVehicleCode, setFilterVehicleCode] = useState("");
  // Trạng thái trong bộ lọc: "" = Tất cả (không gửi Status), "3","4",... = lọc đúng trạng thái đó
  const [filterStatus, setFilterStatus] = useState("");
  // Đã áp dụng bộ lọc trạng thái từ drawer (null = dùng tab, "" = all, "3"=... = lọc theo status)
  const [appliedFilterStatus, setAppliedFilterStatus] = useState(null);

  const pageSize = 20;

  // Build object lọc gửi API (FromDate, ToDate, OrderNumber, CustomerCode, VehicleCode, Keyword)
  const buildApiFilter = useCallback(() => {
    const filter = {};
    if (fromDate && dayjs.isDayjs(fromDate)) filter.FromDate = fromDate.format("YYYY-MM-DD");
    if (toDate && dayjs.isDayjs(toDate)) filter.ToDate = toDate.format("YYYY-MM-DD");
    if (filterOrderNumber?.trim()) filter.OrderNumber = filterOrderNumber.trim();
    if (filterCustomerCode?.trim()) filter.CustomerCode = filterCustomerCode.trim();
    if (filterVehicleCode?.trim()) filter.VehicleCode = filterVehicleCode.trim();
    if (debouncedSearchText?.trim()) filter.Keyword = debouncedSearchText.trim();
    return filter;
  }, [fromDate, toDate, filterOrderNumber, filterCustomerCode, filterVehicleCode, debouncedSearchText]);

  const toggleCardExpand = (key) => {
    setExpandedCards((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };
  const hasInitialLoad = useRef(false);
  const userInfoRef = useRef(userInfo);
  const prevDebouncedSearchRef = useRef(null);
  const tabRefs = useRef({});

  useEffect(() => {
    userInfoRef.current = userInfo;
  }, [userInfo]);

  // Khi debounced search thay đổi → gọi lại API (bỏ qua lần chạy đầu sau mount)
  useEffect(() => {
    if (!hasInitialLoad.current) return;
    const isFirstRun = prevDebouncedSearchRef.current === null;
    prevDebouncedSearchRef.current = debouncedSearchText;
    if (isFirstRun) return;
    fetchPhieuGiaoHang(1, effectiveStatus);
    fetchCountsByStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchText]);

  const fetchPhieuGiaoHang = useCallback(
    async (pageIndex = 1, statusFilter = "") => {
      if (isLoading) return;

      const token = localStorage.getItem("access_token");
      if (!token) return;

      const unitsResponse = JSON.parse(localStorage.getItem("unitsResponse") || "{}");
      const currentUserInfo = userInfoRef.current;
      const unitId = currentUserInfo?.unitId || unitsResponse?.unitId || unitsResponse?.unitCode || "";

      setIsLoading(true);
      try {
        const apiFilter = buildApiFilter();
        const params = {
          MaDvcs: unitId || "",
          Status: statusFilter || undefined,
          PageIndex: pageIndex,
          PageSize: pageSize,
          ...apiFilter,
        };

        const result = await fetchPhieuGiaoHangList(params);

        if (result.success) {
          setAllData(result.data);
          setCurrentPage(result.pagination?.pageIndex || pageIndex);
          const total = result.pagination?.totalRecord ?? 0;
          setTotalRecord(total);
          if (statusFilter) {
            setCountByStatus((prev) => ({ ...prev, [statusFilter]: total }));
          }
        } else {
          message.error(result.error || "Lỗi khi tải dữ liệu");
        }
      } catch (err) {
        console.error("Lỗi gọi API danh sách phiếu giao hàng:", err);
        message.error("Không thể tải danh sách phiếu giao hàng. Vui lòng thử lại.");
      } finally {
        setIsLoading(false);
      }
    },
    [pageSize, isLoading, buildApiFilter]
  );

  // Gọi API lấy tổng số theo từng trạng thái (chỉ cần totalCount, PageSize=1), có áp dụng bộ lọc
  // excludeStatuses: bỏ qua các status đã có (vd. "3" đã lấy từ response danh sách)
  const fetchCountsByStatus = useCallback(async (opts = {}) => {
    const { excludeStatuses = [] } = opts;
    const token = localStorage.getItem("access_token");
    if (!token) return;
    const unitsResponse = JSON.parse(localStorage.getItem("unitsResponse") || "{}");
    const currentUserInfo = userInfoRef.current;
    const unitId = currentUserInfo?.unitId || unitsResponse?.unitId || unitsResponse?.unitCode || "";
    const apiFilter = buildApiFilter();
    const statusesToFetch = STATUS_KEYS.filter((s) => !excludeStatuses.includes(s));
    if (statusesToFetch.length === 0) return;
    const promises = statusesToFetch.map((status) =>
      fetchPhieuGiaoHangList({
        MaDvcs: unitId || "",
        Status: status,
        PageIndex: 1,
        PageSize: 1,
        ...apiFilter,
      })
    );
    try {
      const results = await Promise.all(promises);
      setCountByStatus((prev) => {
        const next = { ...prev };
        results.forEach((res, i) => {
          const status = statusesToFetch[i];
          if (res.success && res.pagination != null && status) {
            next[status] = res.pagination.totalRecord ?? 0;
          }
        });
        return next;
      });
    } catch (e) {
      console.error("Lỗi tải số lượng theo trạng thái:", e);
    }
  }, [buildApiFilter]);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) return;
    if (hasInitialLoad.current) return;
    hasInitialLoad.current = true;
    // Chỉ gọi 1 API danh sách trước → hiển thị nhanh
    fetchPhieuGiaoHang(1, "3");
    // Trì hoãn gọi đếm theo tab (4 request: status 4,5,6,7), bỏ status 3 vì đã có từ response danh sách
    const countTimer = setTimeout(() => {
      fetchCountsByStatus({ excludeStatuses: ["3"] });
    }, 400);
    return () => clearTimeout(countTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleQRScan = async (decodedText) => {
    const trimmed = decodedText?.trim();
    if (!trimmed) return;

    setShowQRScanner(false);
    message.loading({ content: "Đang kiểm tra phiếu giao hàng...", key: "qr-check" });

    try {
      const result = await fetchPhieuGiaoHangDataByQR(trimmed);
      message.destroy("qr-check");

      if (result.success) {
        // Kiểm tra status = 0 → không cho phép truy cập xử lý giao hàng
        const status = result.master?.status;
        if (status != null && String(status) === "0") {
          message.error("Phiếu giao hàng chưa lưu kho");
          return;
        }
        message.success(`Quét thành công: ${trimmed}`);
        navigate(`/kho/giao-hang/xu-ly/${trimmed}`, {
          state: { 
            sctRec: trimmed, 
            returnUrl: location.pathname, 
            fromQR: true,
            mode: "process"
          }
        });
      } else {
        // Không tìm thấy hoặc lỗi → chỉ báo lỗi, không navigate
        const errorMsg = result.error || "Không tìm thấy phiếu giao hàng với mã này";
        message.error(errorMsg);
      }
    } catch (err) {
      message.destroy("qr-check");
      const errorMsg = err?.response?.data?.message || err?.message || "Không tìm thấy phiếu giao hàng với mã này";
      message.error(errorMsg);
    }
  };

  // Map tab key -> API Status
  const statusMap = useMemo(() => ({
    exported: "3",
    received: "4",
    handover: "5",
    completed: "6",
    failed: "7",
  }), []);

  // Map API Status -> tab key (để đồng bộ tab khi áp dụng bộ lọc trạng thái)
  const statusToTabKey = useMemo(() => ({
    "3": "exported",
    "4": "received",
    "5": "handover",
    "6": "completed",
    "7": "failed",
  }), []);

  // Ưu tiên trạng thái từ bộ lọc (drawer): null = dùng tab, "" = lọc tất cả (không gửi Status), "3"=... = lọc theo status
  const effectiveStatus = useMemo(() => {
    if (appliedFilterStatus !== null) return appliedFilterStatus;
    return debouncedSearchText?.trim() ? "" : (statusMap[activeFilter] || "");
  }, [appliedFilterStatus, debouncedSearchText, activeFilter, statusMap]);

  // Luôn focus tab theo trạng thái đang áp dụng: appliedFilterStatus thay đổi → activeFilter đồng bộ
  useEffect(() => {
    if (appliedFilterStatus === null) return;
    const tabKey = appliedFilterStatus && statusToTabKey[appliedFilterStatus] ? statusToTabKey[appliedFilterStatus] : "exported";
    setActiveFilter(tabKey);
  }, [appliedFilterStatus, statusToTabKey]);

  // Scroll tab đang chọn vào vùng nhìn thấy (focus) khi activeFilter thay đổi (vd. chọn "Hoàn thành" từ bộ lọc)
  useEffect(() => {
    const el = tabRefs.current[activeFilter];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, [activeFilter]);

  // Làm tươi mềm: bấm logo TAPMED → gọi lại API lấy data mới nhất (không reload trang)
  useEffect(() => {
    const handler = () => {
      if (hasInitialLoad.current) {
        fetchPhieuGiaoHang(currentPage, effectiveStatus);
        fetchCountsByStatus();
      }
    };
    window.addEventListener("appRefreshRequested", handler);
    return () => window.removeEventListener("appRefreshRequested", handler);
  }, [currentPage, effectiveStatus, fetchPhieuGiaoHang, fetchCountsByStatus]);

  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
    setAppliedFilterStatus(null); // Chuyển sang chế độ tab, bỏ trạng thái từ bộ lọc
    const statusParam = debouncedSearchText?.trim() ? "" : (statusMap[filter] || "");
    fetchPhieuGiaoHang(1, statusParam);
  };

  const handleApplyFilter = () => {
    setAppliedFilterStatus(filterStatus);
    // Luôn focus tab theo trạng thái: trạng thái cụ thể → tab tương ứng, "Tất cả" → tab Xuất hàng
    setActiveFilter(filterStatus && statusToTabKey[filterStatus] ? statusToTabKey[filterStatus] : "exported");
    setShowFilterDrawer(false);
    // Chỉ gọi 1 lần API với status ("" = tất cả) + điều kiện lọc, không gọi fetchCountsByStatus (tránh N call theo từng status)
    fetchPhieuGiaoHang(1, filterStatus);
    message.success("Đã áp dụng bộ lọc");
  };

  const handleClearFilter = () => {
    setFromDate(null);
    setToDate(null);
    setFilterOrderNumber("");
    setFilterCustomerCode("");
    setFilterVehicleCode("");
    setFilterStatus("");
    setAppliedFilterStatus(null);
    setShowFilterDrawer(false);
    const nextStatus = debouncedSearchText?.trim() ? "" : (statusMap[activeFilter] || "");
    // Chỉ gọi 1 lần API, không gọi fetchCountsByStatus
    fetchPhieuGiaoHang(1, nextStatus);
    message.info("Đã xóa bộ lọc");
  };

  const hasActiveFilter = fromDate || toDate || filterOrderNumber?.trim() || filterCustomerCode?.trim() || filterVehicleCode?.trim() || appliedFilterStatus !== null;

  // Khi mở drawer, đồng bộ trạng thái trong form với bộ lọc đang áp dụng
  useEffect(() => {
    if (showFilterDrawer) {
      setFilterStatus(appliedFilterStatus !== null ? appliedFilterStatus : "");
    }
  }, [showFilterDrawer, appliedFilterStatus]);

  // Danh sách hiển thị = kết quả từ API (đã filter theo Keyword + Status + bộ lọc)
  const filteredData = useMemo(() => allData, [allData]);

  // Số lượng theo trạng thái lấy từ API (countByStatus), dùng cho nhãn tab
  const stats = useMemo(() => ({
    exported: countByStatus["3"] ?? 0,
    received: countByStatus["4"] ?? 0,
    handover: countByStatus["5"] ?? 0,
    completed: countByStatus["6"] ?? 0,
    failed: countByStatus["7"] ?? 0,
  }), [countByStatus]);

  // Trạng thái theo yêu cầu mới: 
  // 1: Lập chứng từ, 2: Lưu kho, 3: Xuất hàng, 4: Đã tiếp nhận, 5: Bàn giao ĐVVC, 6: Hoàn thành, 7: Thất bại
  const getStatusClass = (status) => {
    switch (String(status)) {
      case "1": return "created";     // Lập chứng từ
      case "3": return "exported";     // Xuất hàng
      case "4": return "received";     // Đã tiếp nhận
      case "5": return "handover";     // Bàn giao ĐVVC
      case "6": return "completed";    // Hoàn thành
      case "7": return "failed";       // Thất bại
      default: return "created";
    }
  };

  const getStatusText = (status) => {
    switch (String(status)) {
      case "1": return "Lập chứng từ";
      case "3": return "Xuất hàng";
      case "4": return "Đã tiếp nhận";
      case "5": return "Bàn giao ĐVVC";
      case "6": return "Hoàn thành";
      case "7": return "Thất bại";
      default: return "Lập chứng từ";
    }
  };

  const getStatusColor = (status) => {
    switch (String(status)) {
      case "1": return "#8c8c8c";   // gray - Lập chứng từ
      case "2": return "#faad14";   // yellow - Lưu kho
      case "3": return "#1890ff";   // blue - Xuất hàng
      case "4": return "#722ed1";   // purple - Đã tiếp nhận
      case "5": return "#13c2c2";   // cyan - Bàn giao ĐVVC
      case "6": return "#52c41a";   // green - Hoàn thành
      case "7": return "#ff4d4f";   // red - Thất bại
      default: return "#8c8c8c";
    }
  };

  // Cột ngày: DD/MM/YYYY + giờ (ưu tiên datetime0, không có thì lấy từ ngay_don_hang nếu có phần T)
  const formatNgayGio = (item) => {
    if (!item?.ngay_don_hang) return "---";
    const dateStr = dayjs(item.ngay_don_hang).format("DD/MM/YYYY");
    const raw = item.datetime0;
    if (raw) {
      const d = dayjs(raw);
      if (d.isValid()) return `${dateStr} ${d.format("HH:mm")}`;
      if (typeof raw === "string" && raw.includes(":")) {
        const part = raw.trim().split(" ").pop() || raw;
        const timeMatch = part.match(/^(\d{1,2}):(\d{2})/);
        if (timeMatch) return `${dateStr} ${timeMatch[0]}`;
      }
    }
    // Fallback: ngay_don_hang dạng ISO có giờ (vd. 2026-01-22T14:30:00)
    const orderDateStr = String(item.ngay_don_hang || "");
    if (orderDateStr.includes("T")) {
      const t = dayjs(item.ngay_don_hang);
      if (t.isValid() && (t.hour() !== 0 || t.minute() !== 0)) return `${dateStr} ${t.format("HH:mm")}`;
    }
    return dateStr;
  };

  const handleViewDetail = (record) => {
    // Format voucherDate thành YYYYMMDD cho API /Delivery/:voucherDateStr/:voucherId
    let voucherDateStr = null;
    if (record.ngay_ct) {
      // record.ngay_ct có thể là string "2026-01-21" hoặc "2026-01-22T00:00:00" hoặc dayjs object
      let dateStr;
      if (typeof record.ngay_ct === 'string') {
        // Lấy phần ngày từ string (bỏ phần thời gian nếu có)
        dateStr = record.ngay_ct.split('T')[0]; // "2026-01-22T00:00:00" -> "2026-01-22"
      } else {
        // dayjs object
        dateStr = record.ngay_ct.format('YYYY-MM-DD');
      }
      voucherDateStr = dateStr.replace(/-/g, ''); // "2026-01-22" -> "20260122"
    }
    
    navigate(`/kho/giao-hang/chi-tiet/${record.stt_rec}`, {
      state: { 
        sctRec: record.stt_rec, 
        returnUrl: location.pathname, 
        mode: "view",
        voucherDateStr: voucherDateStr,
        fromQR: false
      }
    });
  };

  const handleProcess = (record) => {
    // Format voucherDate thành YYYYMMDD cho API /Delivery/:voucherDateStr/:voucherId
    let voucherDateStr = null;
    if (record.ngay_ct) {
      // record.ngay_ct có thể là string "2026-01-21" hoặc "2026-01-22T00:00:00" hoặc dayjs object
      let dateStr;
      if (typeof record.ngay_ct === 'string') {
        // Lấy phần ngày từ string (bỏ phần thời gian nếu có)
        dateStr = record.ngay_ct.split('T')[0]; // "2026-01-22T00:00:00" -> "2026-01-22"
      } else {
        // dayjs object
        dateStr = record.ngay_ct.format('YYYY-MM-DD');
      }
      voucherDateStr = dateStr.replace(/-/g, ''); // "2026-01-22" -> "20260122"
    }
    
    navigate(`/kho/giao-hang/xu-ly/${record.stt_rec}`, {
      state: { 
        sctRec: record.stt_rec, 
        returnUrl: location.pathname, 
        mode: "process",
        voucherDateStr: voucherDateStr,
        fromQR: false
      }
    });
  };

  return (
    <div className="giao-hang-container">
      {/* Header */}
      <div className="giao-hang-header">
        <div className="giao-hang-header-content">
          <button className="giao-hang-back-btn" onClick={() => navigate("/kho")}>
            <LeftOutlined />
          </button>
          <div className="giao-hang-header-center">
            <h1 className="giao-hang-title">GIAO HÀNG</h1>
          </div>
          <div className="giao-hang-header-actions">
            <button 
              className="giao-hang-filter-btn"
              onClick={() => setShowQRScanner(true)}
              title="Quét QR"
            >
              <QrcodeOutlined />
            </button>
          </div>
        </div>
      </div>

      {/* Drawer bộ lọc theo API DeliveryFilter */}
      <Drawer
        title="Bộ lọc phiếu giao hàng"
        placement="right"
        onClose={() => setShowFilterDrawer(false)}
        open={showFilterDrawer}
        width={320}
        footer={
          <div className="giao-hang-filter-drawer-footer">
            <Button onClick={handleClearFilter}>Xóa bộ lọc</Button>
            <Button type="primary" onClick={handleApplyFilter}>Áp dụng</Button>
          </div>
        }
      >
        <div className="giao-hang-filter-form">
          <div className="giao-hang-filter-item">
            <label>Trạng thái</label>
            <Select
              className="giao-hang-filter-status"
              placeholder="Tất cả"
              allowClear
              value={filterStatus || undefined}
              onChange={(v) => setFilterStatus(v ?? "")}
              options={[
                { value: "", label: "Tất cả" },
                { value: "3", label: "Xuất hàng" },
                { value: "4", label: "Đã tiếp nhận" },
                { value: "5", label: "Bàn giao ĐVVC" },
                { value: "6", label: "Hoàn thành" },
                { value: "7", label: "Thất bại" },
              ]}
              style={{ width: "100%" }}
            />
          </div>
          <div className="giao-hang-filter-item">
            <label>Từ ngày</label>
            <DatePicker
              className="giao-hang-filter-date"
              value={fromDate}
              onChange={setFromDate}
              format="DD/MM/YYYY"
              allowClear
              placeholder="Chọn từ ngày"
            />
          </div>
          <div className="giao-hang-filter-item">
            <label>Đến ngày</label>
            <DatePicker
              className="giao-hang-filter-date"
              value={toDate}
              onChange={setToDate}
              format="DD/MM/YYYY"
              allowClear
              placeholder="Chọn đến ngày"
            />
          </div>
          <div className="giao-hang-filter-item">
            <label>Số đơn hàng</label>
            <Input
              placeholder="Số đơn hàng"
              value={filterOrderNumber}
              onChange={(e) => setFilterOrderNumber(e.target.value)}
              allowClear
            />
          </div>
          <div className="giao-hang-filter-item">
            <label>Mã khách hàng</label>
            <Input
              placeholder="Mã khách hàng"
              value={filterCustomerCode}
              onChange={(e) => setFilterCustomerCode(e.target.value)}
              allowClear
            />
          </div>
          <div className="giao-hang-filter-item">
            <label>Mã phương tiện</label>
            <Input
              placeholder="Mã phương tiện vận chuyển"
              value={filterVehicleCode}
              onChange={(e) => setFilterVehicleCode(e.target.value)}
              allowClear
            />
          </div>
        </div>
      </Drawer>

      {/* Filter tabs - 5 trạng thái (bỏ Tất cả, Lập chứng từ và Lưu kho, bắt đầu từ Xuất hàng) */}
      <div className="giao-hang-filter-tabs">
        <button 
          ref={(el) => { tabRefs.current.exported = el; }}
          className={`giao-hang-filter-tab ${activeFilter === "exported" ? "active" : ""}`}
          onClick={() => handleFilterChange("exported")}
        >
          Xuất hàng ({stats.exported})
        </button>
        <button 
          ref={(el) => { tabRefs.current.received = el; }}
          className={`giao-hang-filter-tab ${activeFilter === "received" ? "active" : ""}`}
          onClick={() => handleFilterChange("received")}
        >
          Đã tiếp nhận ({stats.received})
        </button>
        <button 
          ref={(el) => { tabRefs.current.handover = el; }}
          className={`giao-hang-filter-tab ${activeFilter === "handover" ? "active" : ""}`}
          onClick={() => handleFilterChange("handover")}
        >
          Bàn giao ĐVVC ({stats.handover})
        </button>
        <button 
          ref={(el) => { tabRefs.current.completed = el; }}
          className={`giao-hang-filter-tab ${activeFilter === "completed" ? "active" : ""}`}
          onClick={() => handleFilterChange("completed")}
        >
          Hoàn thành ({stats.completed})
        </button>
        <button 
          ref={(el) => { tabRefs.current.failed = el; }}
          className={`giao-hang-filter-tab ${activeFilter === "failed" ? "active" : ""}`}
          onClick={() => handleFilterChange("failed")}
        >
          Thất bại ({stats.failed})
        </button>
      </div>

      {/* List */}
      <div className="giao-hang-list">
        {isLoading ? (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <Spin size="large" />
          </div>
        ) : filteredData.length === 0 ? (
          <div className="giao-hang-empty">
            <div className="giao-hang-empty-icon">
              <InboxOutlined />
            </div>
            <div className="giao-hang-empty-text">Không có phiếu giao hàng</div>
            <div className="giao-hang-empty-hint">Quét mã QR để nhận phiếu mới</div>
          </div>
        ) : (
          filteredData.map((item, index) => {
            const cardKey = item.stt_rec || `idx-${index}`;
            const isExpanded = expandedCards.has(cardKey);
            return (
            <div key={cardKey} className="giao-hang-card">
              {/* Header: Đơn hàng + Trạng thái */}
              <div
                className="giao-hang-card-header giao-hang-card-header-toggle"
                onClick={() => toggleCardExpand(cardKey)}
              >
                <div className="giao-hang-card-header-left">
                  <span className="giao-hang-card-van-don">
                    Số đơn hàng: <span className="giao-hang-card-code">{item.ma_van_don || item.so_don_hang || "---"}</span>
                  </span>
                  <span className="giao-hang-card-date">
                    <CalendarOutlined />{" "}
                    {formatNgayGio(item)}
                  </span>
                </div>
                <div className="giao-hang-card-header-right">
                  <Tag color={getStatusColor(item.status)} className="giao-hang-card-status-tag">
                    {getStatusText(item.status)}
                  </Tag>
                </div>
              </div>
              
              {isExpanded && (
              <div className="giao-hang-card-body">
                {/* Khách hàng */}
                <div className="giao-hang-card-row">
                  <div className="giao-hang-card-icon customer">
                    <UserOutlined />
                  </div>
                  <div className="giao-hang-card-info">
                    <div className="giao-hang-card-label">Khách hàng</div>
                    <div className="giao-hang-card-value">
                      {item.ma_kh && <span className="giao-hang-card-code-small">[{item.ma_kh}]</span>}
                      {item.ten_kh || "Chưa có"}
                    </div>
                    {item.sdt_kh && (
                      <div className="giao-hang-card-phone">
                        <PhoneOutlined /> {item.sdt_kh}
                      </div>
                    )}
                  </div>
                </div>

                {/* Địa chỉ nhận */}
                <div className="giao-hang-card-row">
                  <div className="giao-hang-card-icon address">
                    <EnvironmentOutlined />
                  </div>
                  <div className="giao-hang-card-info">
                    <div className="giao-hang-card-label">Địa chỉ nhận</div>
                    <div className="giao-hang-card-value">{item.dia_chi || "Chưa có địa chỉ"}</div>
                  </div>
                </div>

                {/* Thông tin vận chuyển */}
                <div className="giao-hang-card-row">
                  <div className="giao-hang-card-icon transport">
                    <CarOutlined />
                  </div>
                  <div className="giao-hang-card-info">
                    <div className="giao-hang-card-label">TT vận chuyển</div>
                    <div className="giao-hang-card-value">
                      {item.ten_nha_xe || "Chưa có"}
                      {item.sdt_nha_xe && <span className="giao-hang-card-subtext"> - {item.sdt_nha_xe}</span>}
                      {item.gio_chay && <span className="giao-hang-card-subtext"> - {item.gio_chay}</span>}
                    </div>
                  </div>
                </div>
              </div>
              )}

              {/* Khi ẩn: hiển thị thông tin khách hàng */}
              {!isExpanded && (
                <div className="giao-hang-card-collapsed-info">
                  <div className="giao-hang-card-row">
                    <div className="giao-hang-card-icon customer">
                      <UserOutlined />
                    </div>
                    <div className="giao-hang-card-info">
                      <div className="giao-hang-card-label">Khách hàng</div>
                      <div className="giao-hang-card-value">
                        {item.ma_kh && <span className="giao-hang-card-code-small">[{item.ma_kh}]</span>}
                        {item.ten_kh || "Chưa có"}
                      </div>
                      {item.sdt_kh && (
                        <div className="giao-hang-card-phone">
                          <PhoneOutlined /> {item.sdt_kh}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Footer: Các nút hành động - chỉ hiển thị khi expanded */}
              {isExpanded && (
                <div className="giao-hang-card-footer">
                  <button 
                    className="giao-hang-action-btn view"
                    onClick={(e) => { e.stopPropagation(); handleViewDetail(item); }}
                  >
                    <EyeOutlined /> Xem
                  </button>
                  <button 
                    className="giao-hang-action-btn process"
                    onClick={(e) => { e.stopPropagation(); handleProcess(item); }}
                  >
                    <SettingOutlined /> Xử lý
                  </button>
                </div>
              )}
            </div>
          );
          })
        )}
      </div>

      {/* Phân trang */}
      {!isLoading && totalRecord > 0 && (
        <div className="giao-hang-pagination-wrap">
          <Pagination
            current={currentPage}
            total={totalRecord}
            pageSize={pageSize}
            showSizeChanger={false}
            showTotal={(total) => `Tổng ${total} phiếu`}
            onChange={(page) => {
              fetchPhieuGiaoHang(page, effectiveStatus);
            }}
          />
        </div>
      )}

      {/* Floating Filter Button */}
      <button 
        className={`giao-hang-fab ${hasActiveFilter ? "active" : ""}`}
        onClick={() => setShowFilterDrawer(true)}
        title="Bộ lọc"
      >
        <FilterOutlined />
      </button>

      {/* QR Scanner */}
      <QRScanner
        isOpen={showQRScanner}
        onClose={() => setShowQRScanner(false)}
        onScanSuccess={handleQRScan}
        openWithCamera={true}
      />
    </div>
  );
};

export default ListPhieuGiaoHang;
