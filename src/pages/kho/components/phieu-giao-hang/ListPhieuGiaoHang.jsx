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
  SearchOutlined,
  InboxOutlined,
  SettingOutlined,
  PhoneOutlined,
  CalendarOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import { Input, Spin, message, Tag, Badge } from "antd";
import dayjs from "dayjs";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import QRScanner from "../../../../components/common/QRScanner/QRScanner";
import "./PhieuGiaoHang.css";
import { fetchPhieuGiaoHangList } from "./utils/phieuGiaoHangApi";

const ListPhieuGiaoHang = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const userInfo = useSelector((state) => state?.claimsReducer?.userInfo || {});

  const [allData, setAllData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [activeFilter, setActiveFilter] = useState("exported");
  const [searchText, setSearchText] = useState("");
  const [expandedCards, setExpandedCards] = useState(() => new Set());
  const [showSearch, setShowSearch] = useState(false);

  const pageSize = 20;

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

  useEffect(() => {
    userInfoRef.current = userInfo;
  }, [userInfo]);

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
        const params = {
          MaDvcs: unitId || "",
          Status: statusFilter || undefined,
          PageIndex: pageIndex,
          PageSize: pageSize,
        };

        const result = await fetchPhieuGiaoHangList(params);

        if (result.success) {
          setAllData(result.data);
          setCurrentPage(result.pagination?.pageIndex || pageIndex);
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
    [pageSize, isLoading]
  );

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) return;
    if (hasInitialLoad.current) return;
    hasInitialLoad.current = true;
    fetchPhieuGiaoHang(1, "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleQRScan = (decodedText) => {
    message.success(`Quét thành công: ${decodedText}`);
    setShowQRScanner(false);
    // Navigate to xử lý giao hàng với mã QR - dùng API /Delivery/:voucherId
    navigate(`/kho/giao-hang/xu-ly/${decodedText}`, {
      state: { 
        sctRec: decodedText, 
        returnUrl: location.pathname, 
        fromQR: true,
        mode: "process"
      }
    });
  };

  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
    // Không gọi API, chỉ filter local
  };

  // Lọc data theo search text và filter
  const filteredData = useMemo(() => {
    let data = allData;
    
    // Lọc theo status - 6 trạng thái riêng biệt (mapping mới: 2-7, bỏ 1)
    const statusMap = {
      "exported": "3",      // Xuất hàng
      "received": "4",      // Đã tiếp nhận
      "handover": "5",      // Bàn giao ĐVVC
      "completed": "6",    // Hoàn thành
      "failed": "7",       // Thất bại
    };
    const targetStatus = statusMap[activeFilter];
    if (targetStatus) {
      data = data.filter(item => String(item.status) === targetStatus);
    }
    
    // Lọc theo search text
    if (searchText) {
      const search = searchText.toLowerCase();
      data = data.filter(item => 
        (item.so_ct && item.so_ct.toLowerCase().includes(search)) ||
        (item.ten_kh && item.ten_kh.toLowerCase().includes(search)) ||
        (item.so_don_hang && item.so_don_hang.toLowerCase().includes(search)) ||
        (item.ma_kh && item.ma_kh.toLowerCase().includes(search))
      );
    }
    
    return data;
  }, [allData, activeFilter, searchText]);

  // Đếm số lượng theo trạng thái - 7 trạng thái mới
  // 1: Lập chứng từ, 2: Lưu kho, 3: Xuất hàng, 4: Đã tiếp nhận, 5: Bàn giao ĐVVC, 6: Hoàn thành, 7: Thất bại
  const stats = useMemo(() => {
    const created = allData.filter(item => String(item.status) === "1").length;    // Lập chứng từ
    const stored = allData.filter(item => String(item.status) === "2").length;       // Lưu kho
    const exported = allData.filter(item => String(item.status) === "3").length;     // Xuất hàng
    const received = allData.filter(item => String(item.status) === "4").length;     // Đã tiếp nhận
    const handover = allData.filter(item => String(item.status) === "5").length;     // Bàn giao ĐVVC
    const completed = allData.filter(item => String(item.status) === "6").length;   // Hoàn thành
    const failed = allData.filter(item => String(item.status) === "7").length;       // Thất bại
    return { created, stored, exported, received, handover, completed, failed, total: allData.length };
  }, [allData]);

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
            <h1 className={`giao-hang-title ${showSearch ? "giao-hang-title-hidden" : ""}`}>
              GIAO HÀNG
            </h1>
            <div className={`giao-hang-search-in-header ${showSearch ? "giao-hang-search-open" : ""}`}>
              <Input
                className="giao-hang-search-input"
                placeholder="Tìm phiếu, khách hàng, đơn hàng..."
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                allowClear
                autoFocus={showSearch}
              />
            </div>
          </div>
          <button 
            className="giao-hang-search-btn" 
            onClick={() => setShowSearch(!showSearch)}
          >
            <SearchOutlined />
          </button>
        </div>
      </div>

      {/* Filter tabs - 5 trạng thái (bỏ Tất cả, Lập chứng từ và Lưu kho, bắt đầu từ Xuất hàng) */}
      <div className="giao-hang-filter-tabs">
        <button 
          className={`giao-hang-filter-tab ${activeFilter === "exported" ? "active" : ""}`}
          onClick={() => handleFilterChange("exported")}
        >
          Xuất hàng ({stats.exported})
        </button>
        <button 
          className={`giao-hang-filter-tab ${activeFilter === "received" ? "active" : ""}`}
          onClick={() => handleFilterChange("received")}
        >
          Đã tiếp nhận ({stats.received})
        </button>
        <button 
          className={`giao-hang-filter-tab ${activeFilter === "handover" ? "active" : ""}`}
          onClick={() => handleFilterChange("handover")}
        >
          Bàn giao ĐVVC ({stats.handover})
        </button>
        <button 
          className={`giao-hang-filter-tab ${activeFilter === "completed" ? "active" : ""}`}
          onClick={() => handleFilterChange("completed")}
        >
          Hoàn thành ({stats.completed})
        </button>
        <button 
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
                    Mã vận đơn: <span className="giao-hang-card-code">{item.ma_van_don || item.so_don_hang || "---"}</span>
                  </span>
                  <span className="giao-hang-card-date">
                    <CalendarOutlined /> {item.ngay_don_hang ? dayjs(item.ngay_don_hang).format("DD/MM/YYYY") : "---"}
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

      {/* Floating QR Button */}
      <button className="giao-hang-fab" onClick={() => setShowQRScanner(true)}>
        <QrcodeOutlined />
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
