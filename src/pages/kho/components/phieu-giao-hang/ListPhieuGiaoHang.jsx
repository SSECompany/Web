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
  GiftOutlined
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
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchText, setSearchText] = useState("");

  const pageSize = 20;
  const hasInitialLoad = useRef(false);
  const userInfoRef = useRef(userInfo);

  useEffect(() => {
    userInfoRef.current = userInfo;
  }, [userInfo]);

  const fetchPhieuGiaoHang = useCallback(
    async (pageIndex = currentPage, statusFilter = "") => {
      if (isLoading) return;

      const currentUserInfo = userInfoRef.current;
      if (!currentUserInfo || (!currentUserInfo.id && !currentUserInfo.userId)) {
        return;
      }

      const unitsResponse = JSON.parse(localStorage.getItem("unitsResponse") || "{}");
      const userId = currentUserInfo?.id || currentUserInfo?.userId || "";
      const unitId = currentUserInfo?.unitId || unitsResponse?.unitId || "";
      const storeId = currentUserInfo?.storeId || "";

      setIsLoading(true);
      try {
        // Map params sang format API mới
        const params = {
          MaDvcs: unitId || "",
          Status: statusFilter || undefined,
          PageIndex: pageIndex,
          PageSize: pageSize,
          // Có thể thêm các filter khác sau
          // FromDate: "",
          // ToDate: "",
          // CustomerCode: "",
          // VoucherNo: "",
          // OrderNumber: "",
          // VehicleCode: "",
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
      } finally {
        setIsLoading(false);
      }
    },
    [currentPage, pageSize, isLoading]
  );

  useEffect(() => {
    const currentUserInfo = userInfoRef.current;
    if (!currentUserInfo || (!currentUserInfo.id && !currentUserInfo.userId)) {
      return;
    }
    if (!hasInitialLoad.current) {
      hasInitialLoad.current = true;
      fetchPhieuGiaoHang(1, "");
    }
  }, [userInfo?.id, userInfo?.userId]);

  const handleQRScan = (decodedText) => {
    message.success(`Quét thành công: ${decodedText}`);
    setShowQRScanner(false);
    // Navigate to detail với mã QR - dùng API /Delivery/:voucherId
    navigate(`/kho/giao-hang/chi-tiet/${decodedText}`, {
      state: { sctRec: decodedText, returnUrl: location.pathname, fromQR: true }
    });
  };

  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
    // Không gọi API, chỉ filter local
  };

  // Lọc data theo search text và filter
  const filteredData = useMemo(() => {
    let data = allData;
    
    // Lọc theo status - 7 trạng thái riêng biệt (mapping mới: 1-7)
    if (activeFilter !== "all") {
      const statusMap = {
        "created": "1",      // Lập chứng từ
        "stored": "2",        // Lưu kho
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
      case "2": return "stored";       // Lưu kho
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
      case "2": return "Lưu kho";
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
          <h1 className="giao-hang-title">GIAO HÀNG</h1>
          <div style={{ width: 40 }} />
        </div>
      </div>

      {/* Stats - Hiển thị đầy đủ 7 trạng thái */}
      <div className="giao-hang-stats">
        <div className="giao-hang-stat-item created">
          <div className="giao-hang-stat-value">{stats.created}</div>
          <div className="giao-hang-stat-label">Lập chứng từ</div>
        </div>
        <div className="giao-hang-stat-item stored">
          <div className="giao-hang-stat-value">{stats.stored}</div>
          <div className="giao-hang-stat-label">Lưu kho</div>
        </div>
        <div className="giao-hang-stat-item exported">
          <div className="giao-hang-stat-value">{stats.exported}</div>
          <div className="giao-hang-stat-label">Xuất hàng</div>
        </div>
        <div className="giao-hang-stat-item received">
          <div className="giao-hang-stat-value">{stats.received}</div>
          <div className="giao-hang-stat-label">Đã tiếp nhận</div>
        </div>
        <div className="giao-hang-stat-item handover">
          <div className="giao-hang-stat-value">{stats.handover}</div>
          <div className="giao-hang-stat-label">Bàn giao ĐVVC</div>
        </div>
        <div className="giao-hang-stat-item completed">
          <div className="giao-hang-stat-value">{stats.completed}</div>
          <div className="giao-hang-stat-label">Hoàn thành</div>
        </div>
        <div className="giao-hang-stat-item failed">
          <div className="giao-hang-stat-value">{stats.failed}</div>
          <div className="giao-hang-stat-label">Thất bại</div>
        </div>
      </div>

      {/* Search */}
      <div className="giao-hang-search">
        <Input
          className="giao-hang-search-input"
          placeholder="Tìm phiếu, khách hàng, đơn hàng..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          allowClear
        />
      </div>

      {/* Filter tabs - 7 trạng thái */}
      <div className="giao-hang-filter-tabs">
        <button 
          className={`giao-hang-filter-tab ${activeFilter === "all" ? "active" : ""}`}
          onClick={() => handleFilterChange("all")}
        >
          Tất cả ({stats.total})
        </button>
        <button 
          className={`giao-hang-filter-tab ${activeFilter === "created" ? "active" : ""}`}
          onClick={() => handleFilterChange("created")}
        >
          Lập chứng từ ({stats.created})
        </button>
        <button 
          className={`giao-hang-filter-tab ${activeFilter === "stored" ? "active" : ""}`}
          onClick={() => handleFilterChange("stored")}
        >
          Lưu kho ({stats.stored})
        </button>
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
          filteredData.map((item, index) => (
            <div key={item.stt_rec || index} className="giao-hang-card">
              {/* Header: Số phiếu + Trạng thái */}
              <div className="giao-hang-card-header">
                <div className="giao-hang-card-header-left">
                  <span className="giao-hang-card-code">{item.so_ct || "---"}</span>
                  <span className="giao-hang-card-date">
                    <CalendarOutlined /> {item.ngay_ct ? dayjs(item.ngay_ct).format("DD/MM/YYYY") : "---"}
                  </span>
                </div>
                <Tag color={getStatusColor(item.status)} className="giao-hang-card-status-tag">
                  {getStatusText(item.status)}
                </Tag>
              </div>
              
              <div className="giao-hang-card-body">
                {/* Đơn hàng */}
                <div className="giao-hang-card-row">
                  <div className="giao-hang-card-icon order">
                    <FileTextOutlined />
                  </div>
                  <div className="giao-hang-card-info">
                    <div className="giao-hang-card-label">Đơn hàng</div>
                    <div className="giao-hang-card-value">
                      {item.so_don_hang || "---"}
                      {item.ngay_don_hang && (
                        <span className="giao-hang-card-subtext"> - {dayjs(item.ngay_don_hang).format("DD/MM/YYYY")}</span>
                      )}
                    </div>
                  </div>
                </div>

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

                {/* Tổng số kiện */}
                {item.tong_so_kien && (
                  <div className="giao-hang-card-row">
                    <div className="giao-hang-card-icon package">
                      <GiftOutlined />
                    </div>
                    <div className="giao-hang-card-info">
                      <div className="giao-hang-card-label">Tổng số kiện</div>
                      <div className="giao-hang-card-value giao-hang-card-value-highlight">
                        {item.tong_so_kien} kiện
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer: Các nút hành động */}
              <div className="giao-hang-card-footer">
                <button 
                  className="giao-hang-action-btn view"
                  onClick={() => handleViewDetail(item)}
                >
                  <EyeOutlined /> Xem
                </button>
                <button 
                  className="giao-hang-action-btn process"
                  onClick={() => handleProcess(item)}
                >
                  <SettingOutlined /> Xử lý
                </button>
              </div>
            </div>
          ))
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
