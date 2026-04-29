import { EyeOutlined, FilterOutlined } from "@ant-design/icons";
import { Button, DatePicker, Input, Select, Tag, Typography } from "antd";
import dayjs from "dayjs";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import CommonPhieuList from "../CommonPhieuList";
import "../common-phieu.css";
import { fetchPhieuNhatHangList } from "./utils/phieuNhatHangApi";

const { RangePicker } = DatePicker;

const { Title } = Typography;

const ListPhieuNhatHang = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem("access_token");

  // Get user info from Redux instead of localStorage
  const userInfo = useSelector((state) => state?.claimsReducer?.userInfo || {});

  const [allData, setAllData] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [screenSize, setScreenSize] = useState("desktop");
  const [isLoading, setIsLoading] = useState(false);

  // Initialize filters from sessionStorage immediately (synchronous)
  const getInitialFilters = () => {
    try {
      const saved = sessionStorage.getItem("phieuNhatHang_filters");
      if (saved) {
        const parsed = JSON.parse(saved);
        const dateRange =
          parsed.dateRange && parsed.dateRange.from && parsed.dateRange.to
            ? [dayjs(parsed.dateRange.from), dayjs(parsed.dateRange.to)]
            : null;
        return {
          so_ct: parsed.so_ct || "",
          so_don_hang: parsed.so_don_hang || "",
          ma_kh: parsed.ma_kh || "",
          ten_kh: parsed.ten_kh || "",
          ma_nhomvitri: parsed.ma_nhomvitri || "",
          status: parsed.status || "",
          dateRange,
        };
      }
    } catch (error) {
      console.error("Error loading initial filters:", error);
    }
    return {
      so_ct: "",
      so_don_hang: "",
      ma_kh: "",
      ten_kh: "",
      ma_nhomvitri: "",
      status: "",
      dateRange: null,
    };
  };

  const initialFilters = getInitialFilters();
  const [filters, setFilters] = useState(initialFilters);

  // Check if user has applied filters based on initial filters
  const checkHasAppliedFilters = (f) => {
    return !!(
      f.so_ct ||
      f.so_don_hang ||
      f.ma_kh ||
      f.ma_nhomvitri ||
      f.status ||
      (f.dateRange &&
        f.dateRange.length === 2 &&
        !f.dateRange[0].isSame(dayjs(), "day"))
    );
  };

  const [hasUserAppliedFilters, setHasUserAppliedFilters] = useState(
    checkHasAppliedFilters(initialFilters)
  );

  const pageSize = 20;
  const lastApiCall = useRef({
    pageIndex: 0,
    filters: {},
    userId: null,
    unitId: null,
    storeId: null,
  });
  const hasInitialLoad = useRef(false); // Track đã load lần đầu chưa
  const userInfoRef = useRef(userInfo); // Track userInfo để tránh re-render
  const filtersLoadedFromStorage = useRef(true); // Track đã load filters từ sessionStorage (true vì đã load trong getInitialFilters)
  const filtersInitialized = useRef(false); // Track filters đã được khởi tạo chưa
  const EMPTY_FILTERS = {};
  const stableFilters = useMemo(() => filters, [filters]);

  // Update userInfoRef khi userInfo thay đổi
  useEffect(() => {
    userInfoRef.current = userInfo;
  }, [userInfo]);

  // Detect screen size
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      if (width < 480) {
        setScreenSize("mobile");
      } else if (width < 768) {
        setScreenSize("mobileLandscape");
      } else if (width < 1024) {
        setScreenSize("tablet");
      } else {
        setScreenSize("desktop");
      }
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  // SessionStorage key for filters
  const FILTERS_STORAGE_KEY = "phieuNhatHang_filters";

  // Save filters to sessionStorage
  const saveFiltersToStorage = useCallback((f) => {
    try {
      const filtersToSave = {
        so_ct: f.so_ct || "",
        so_don_hang: f.so_don_hang || "",
        ma_kh: f.ma_kh || "",
        ten_kh: f.ten_kh || "",
        ma_nhomvitri: f.ma_nhomvitri || "",
        status: f.status || "",
        dateRange:
          f.dateRange && f.dateRange.length === 2
            ? {
                from: f.dateRange[0].format("YYYY-MM-DD"),
                to: f.dateRange[1].format("YYYY-MM-DD"),
              }
            : null,
      };
      sessionStorage.setItem(
        FILTERS_STORAGE_KEY,
        JSON.stringify(filtersToSave)
      );
    } catch (error) {
      console.error("Error saving filters to sessionStorage:", error);
    }
  }, []);

  // Load filters from sessionStorage
  const loadFiltersFromStorage = useCallback(() => {
    try {
      const saved = sessionStorage.getItem(FILTERS_STORAGE_KEY);
      if (!saved) {
        return null;
      }
      const parsed = JSON.parse(saved);
      const dateRange =
        parsed.dateRange && parsed.dateRange.from && parsed.dateRange.to
          ? [dayjs(parsed.dateRange.from), dayjs(parsed.dateRange.to)]
          : null;
      return {
        so_ct: parsed.so_ct || "",
        so_don_hang: parsed.so_don_hang || "",
        ma_kh: parsed.ma_kh || "",
        ten_kh: parsed.ten_kh || "",
        ma_nhomvitri: parsed.ma_nhomvitri || "",
        status: parsed.status || "",
        dateRange,
      };
    } catch (error) {
      console.error("Error loading filters from sessionStorage:", error);
      return null;
    }
  }, []);

  // Auto-save filters to sessionStorage when they change (except initial load)
  useEffect(() => {
    // Only save if filters have actually changed from initial load
    // This prevents saving on initial mount since filters are already loaded from storage
    if (filtersLoadedFromStorage.current) {
      // Reset flag after first render to allow future saves
      filtersLoadedFromStorage.current = false;
    } else {
      saveFiltersToStorage(filters);
    }
  }, [filters, saveFiltersToStorage]);

  const fetchPhieuNhatHang = useCallback(
    async (pageIndex = currentPage, customFilters = null) => {
      if (isLoading) return;

      // Chỉ gọi API khi userInfo đã có dữ liệu (tránh gọi lần đầu với empty userInfo)
      const currentUserInfo = userInfoRef.current;
      if (
        !currentUserInfo ||
        (!currentUserInfo.id && !currentUserInfo.userId)
      ) {
        return;
      }

      const filtersToUse = customFilters || stableFilters;
      const normalizeStatus = (val) => {
        if (val === undefined || val === null) return "";
        const str = String(val).trim();
        if (["0", "1", "2"].includes(str)) return str;
        const map = {
          "Mới chia đơn": "0",
          "Đang nhặt hàng": "1",
          "Nhặt xong": "2",
        };
        return map[str] || "";
      };

      // Get unitsResponse from localStorage as fallback for unitId
      const unitsResponse = JSON.parse(
        localStorage.getItem("unitsResponse") || "{}"
      );

      const userId = currentUserInfo?.id || currentUserInfo?.userId || "";
      const unitId = currentUserInfo?.unitId || unitsResponse?.unitId || "";
      const storeId = currentUserInfo?.storeId || "";

      // Duplicate prevention logic - bao gồm cả userInfo để tránh gọi lại khi userInfo thay đổi nhưng params giống nhau
      const currentCall = {
        pageIndex,
        filters: filtersToUse,
        userId,
        unitId,
        storeId,
      };
      if (
        lastApiCall.current.pageIndex === pageIndex &&
        JSON.stringify(lastApiCall.current.filters) ===
          JSON.stringify(filtersToUse) &&
        lastApiCall.current.userId === userId &&
        lastApiCall.current.unitId === unitId &&
        lastApiCall.current.storeId === storeId
      ) {
        return;
      }
      lastApiCall.current = currentCall;

      setIsLoading(true);
      try {
        const params = {
          so_ct: filtersToUse.so_ct || "",
          DateFrom:
            filtersToUse.dateRange && filtersToUse.dateRange.length === 2
              ? filtersToUse.dateRange[0].format("MM/DD/YYYY")
              : "",
          DateTo:
            filtersToUse.dateRange && filtersToUse.dateRange.length === 2
              ? filtersToUse.dateRange[1].format("MM/DD/YYYY")
              : "",
          ngay_ct: "",
          ma_kh: filtersToUse.ma_kh || "",
          Status: normalizeStatus(filtersToUse.status),
          ma_ban: "",
          s2: "",
          s3: "",
          so_don_hang: filtersToUse.so_don_hang || "",
          ma_nhomvitri: filtersToUse.ma_nhomvitri || "",
          pageIndex: pageIndex,
          pageSize: pageSize,
          userId: userId,
          unitId: unitId,
          storeId: storeId,
        };

        const result = await fetchPhieuNhatHangList(params);

        if (result.success) {
          setAllData(result.data);
          setTotalRecords(result.pagination.totalRecord || result.data.length);
        } else {
          console.error("Lỗi gọi API danh sách phiếu nhặt hàng:", result.error);
        }
      } catch (err) {
        console.error("Lỗi gọi API danh sách phiếu nhặt hàng:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [stableFilters, currentPage, pageSize, isLoading]
  );

  // Effect duy nhất để load data - chỉ gọi khi userInfo sẵn sàng và filters đã được khởi tạo
  useEffect(() => {
    const currentUserInfo = userInfoRef.current;

    // Chỉ gọi khi userInfo đã có dữ liệu
    if (!currentUserInfo || (!currentUserInfo.id && !currentUserInfo.userId)) {
      return;
    }

    // Chỉ gọi một lần khi userInfo sẵn sàng lần đầu
    // Filters đã được khởi tạo từ sessionStorage ngay từ đầu, nên không cần đợi
    if (!hasInitialLoad.current) {
      hasInitialLoad.current = true;
      fetchPhieuNhatHang(1, filters);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userInfo?.id, userInfo?.userId]);

  // Effect riêng cho filters - chỉ gọi khi filters thay đổi và đã load lần đầu
  // Bỏ qua lần đầu tiên vì filters đã được set từ sessionStorage và đã được gọi trong effect trên
  useEffect(() => {
    const currentUserInfo = userInfoRef.current;
    if (!currentUserInfo || (!currentUserInfo.id && !currentUserInfo.userId)) {
      return;
    }

    // Đánh dấu filters đã được khởi tạo sau lần render đầu tiên
    if (!filtersInitialized.current) {
      filtersInitialized.current = true;
      return; // Bỏ qua lần đầu tiên vì filters đã được load từ sessionStorage
    }

    // Chỉ gọi nếu đã load lần đầu để tránh double call với effect trên
    if (hasInitialLoad.current) {
      fetchPhieuNhatHang(1, filters);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchPhieuNhatHang(page, filters);
  };

  const handleFilter = (key, value, confirm) => {
    confirm();
    let filterValue = value;

    const newFilters = { ...filters, [key]: filterValue };
    setFilters(newFilters);
    setHasUserAppliedFilters(true); // User đã apply filter
    setCurrentPage(1);
    // Save to sessionStorage
    saveFiltersToStorage(newFilters);
    fetchPhieuNhatHang(1, newFilters);
  };

  // Active filter chips
  const activeChips = useMemo(() => {
    const chips = [];
    if (filters.so_ct)
      chips.push({ key: "so_ct", label: "Số", value: filters.so_ct });
    if (filters.so_don_hang)
      chips.push({
        key: "so_don_hang",
        label: "Số đơn hàng",
        value: filters.so_don_hang,
      });
    if (filters.ma_kh)
      chips.push({
        key: "ma_kh",
        label: "Mã khách hàng",
        value: filters.ma_kh,
      });
    if (filters.ma_nhomvitri)
      chips.push({
        key: "ma_nhomvitri",
        label: "Vùng",
        value: filters.ma_nhomvitri,
      });
    if (
      filters.status !== "" &&
      filters.status !== null &&
      filters.status !== undefined
    ) {
      const statusMap = {
        0: "Mới chia đơn",
        1: "Đang nhặt hàng",
        2: "Nhặt xong",
      };
      chips.push({
        key: "status",
        label: "Trạng thái",
        value: statusMap[String(filters.status)] || String(filters.status),
      });
    }
    // Chỉ hiển thị dateRange chip khi user đã thực sự apply filter (không phải mặc định)
    if (
      hasUserAppliedFilters &&
      filters.dateRange &&
      filters.dateRange.length === 2
    ) {
      chips.push({
        key: "dateRange",
        label: "Ngày",
        value: `${filters.dateRange[0].format(
          "DD/MM/YYYY"
        )} - ${filters.dateRange[1].format("DD/MM/YYYY")}`,
      });
    }
    return chips;
  }, [filters, hasUserAppliedFilters]);

  const removeChip = (chipKey) => {
    const newFilters = { ...filters };
    if (chipKey === "dateRange") {
      newFilters.dateRange = null;
    } else {
      newFilters[chipKey] = "";
    }
    setFilters(newFilters);
    setCurrentPage(1);
    // Save to sessionStorage
    saveFiltersToStorage(newFilters);
    fetchPhieuNhatHang(1, newFilters);
  };

  const clearAllChips = () => {
    const cleared = {
      so_ct: "",
      so_don_hang: "",
      ma_kh: "",
      ten_kh: "",
      ma_nhomvitri: "",
      status: "",
      dateRange: null,
    };
    setFilters(cleared);
    setHasUserAppliedFilters(false); // Reset về trạng thái chưa filter
    setCurrentPage(1);
    // Clear sessionStorage
    try {
      sessionStorage.removeItem(FILTERS_STORAGE_KEY);
    } catch (error) {
      console.error("Error clearing filters from sessionStorage:", error);
    }
    fetchPhieuNhatHang(1, cleared);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "0":
        return "blue"; // Mới chia đơn
      case "1":
        return "orange"; // Đang nhặt hàng
      case "2":
        return "green"; // Đã nhặt hàng
      case "3":
        return "green";
      case "5":
        return "purple";
      default:
        return "default";
    }
  };

  const getColumns = () => {
    const baseColumns = [
      {
        title: "STT",
        key: "stt",
        render: (_, __, index) => index + 1,
        width: 60,
        align: "center",
      },
      {
        title: "Đơn vị",
        key: "don_vi",
        dataIndex: "ma_dvcs",
        width: 120,
        align: "center",
        render: (text) => (text || "").toString(),
      },
      {
        title: "Ngày",
        dataIndex: "ngay_ct",
        key: "ngay_ct",
        width: 140,
        filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) => (
          <div style={{ padding: 8 }}>
            <RangePicker
              inputReadOnly
              value={
                selectedKeys[0] && selectedKeys[1]
                  ? [
                      dayjs(selectedKeys[0], "DD/MM/YYYY"),
                      dayjs(selectedKeys[1], "DD/MM/YYYY"),
                    ]
                  : null
              }
              onChange={(dates) => {
                if (dates && dates.length === 2) {
                  setSelectedKeys([
                    dates[0].format("DD/MM/YYYY"),
                    dates[1].format("DD/MM/YYYY"),
                  ]);
                } else {
                  setSelectedKeys([]);
                }
              }}
              style={{ marginBottom: 8 }}
              format="DD/MM/YYYY"
              placeholder={["Từ ngày", "Đến ngày"]}
            />
            <Button
              className="search_button"
              type="primary"
              onClick={() => {
                const filterValue =
                  selectedKeys.length === 2
                    ? [
                        dayjs(selectedKeys[0], "DD/MM/YYYY"),
                        dayjs(selectedKeys[1], "DD/MM/YYYY"),
                      ]
                    : null;
                handleFilter("dateRange", filterValue, confirm);
              }}
              size="small"
            >
              Tìm kiếm
            </Button>
          </div>
        ),
        filteredValue:
          filters.dateRange && filters.dateRange.length === 2
            ? [
                filters.dateRange[0].format("DD/MM/YYYY"),
                filters.dateRange[1].format("DD/MM/YYYY"),
              ]
            : null,
        render: (text) =>
          dayjs(text).format(screenSize === "mobile" ? "DD/MM" : "DD/MM/YYYY"),
      },
      {
        title: "Bắt đầu nhặt hàng",
        dataIndex: "bat_dau_nhat_hang",
        key: "bat_dau_nhat_hang",
        width: 160,
        align: "center",
        render: (text, record) => {
          if (!text || text === null || text === "null" || text === "*")
            return "";
          try {
            return dayjs(text).format("DD/MM/YYYY HH:mm");
          } catch {
            return "";
          }
        },
      },
      {
        title: "Kết thúc nhặt hàng",
        dataIndex: "nhat_hang_xong",
        key: "nhat_hang_xong",
        width: 160,
        align: "center",
        render: (text, record) => {
          if (!text || text === null || text === "null" || text === "*")
            return "";
          try {
            return dayjs(text).format("DD/MM/YYYY HH:mm");
          } catch {
            return "";
          }
        },
      },
      {
        title: "Số",
        dataIndex: "so_ct",
        key: "so_ct",
        width: 120,
        align: "center",
        render: (text) => (text ? text.trim() : ""),
        filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) => (
          <div style={{ padding: 8 }}>
            <Input
              placeholder="Tìm Số"
              value={selectedKeys[0]}
              onChange={(e) =>
                setSelectedKeys(e.target.value ? [e.target.value] : [])
              }
              onPressEnter={() => {
                handleFilter("so_ct", selectedKeys[0] || "", confirm);
              }}
              style={{ marginBottom: 8, display: "block" }}
            />
            <Button
              className="search_button"
              type="primary"
              onClick={() => {
                handleFilter("so_ct", selectedKeys[0] || "", confirm);
              }}
              size="small"
            >
              Tìm kiếm
            </Button>
          </div>
        ),
        filteredValue: filters.so_ct ? [filters.so_ct] : null,
      },
      {
        title: "Số đơn hàng",
        dataIndex: "so_don_hang",
        key: "so_don_hang",
        width: 140,
        align: "center",
        render: (text) => (text ? text.trim() : ""),
        filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) => (
          <div style={{ padding: 8 }}>
            <Input
              placeholder="Tìm Số đơn hàng"
              value={selectedKeys[0]}
              onChange={(e) =>
                setSelectedKeys(e.target.value ? [e.target.value] : [])
              }
              onPressEnter={() => {
                handleFilter("so_don_hang", selectedKeys[0] || "", confirm);
              }}
              style={{ marginBottom: 8, display: "block" }}
            />
            <Button
              className="search_button"
              type="primary"
              onClick={() => {
                handleFilter("so_don_hang", selectedKeys[0] || "", confirm);
              }}
              size="small"
            >
              Tìm kiếm
            </Button>
          </div>
        ),
        filteredValue: filters.so_don_hang ? [filters.so_don_hang] : null,
      },
      {
        title: "Vùng",
        dataIndex: "ma_nhomvitri",
        key: "ma_nhomvitri",
        width: 120,
        align: "center",
        render: (text) => (text || "").toString(),
        filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) => (
          <div style={{ padding: 8 }}>
            <Input
              placeholder="Tìm Vùng"
              value={selectedKeys[0]}
              onChange={(e) =>
                setSelectedKeys(e.target.value ? [e.target.value] : [])
              }
              onPressEnter={() => {
                handleFilter("ma_nhomvitri", selectedKeys[0] || "", confirm);
              }}
              style={{ marginBottom: 8, display: "block" }}
            />
            <Button
              className="search_button"
              type="primary"
              onClick={() => {
                handleFilter("ma_nhomvitri", selectedKeys[0] || "", confirm);
              }}
              size="small"
            >
              Tìm kiếm
            </Button>
          </div>
        ),
        filteredValue: filters.ma_nhomvitri ? [filters.ma_nhomvitri] : null,
      },
      {
        title: "Bàn",
        dataIndex: "ban_dong_goi",
        key: "ban_dong_goi",
        width: 120,
        align: "center",
        render: (text) => (text || "").toString(),
      },
      {
        title: "Ghi chú",
        dataIndex: "ghi_chu",
        key: "ghi_chu",
        width: 220,
        align: "center",
        render: (text) => (text || "").toString(),
      },
      {
        title: "Tỉ lệ hoàn thành",
        key: "ti_le_hoan_thanh",
        width: 120,
        align: "center",
        render: (_, record) => {
          const a = record?.sl_phieu_xuat1 ?? 0;
          const b = record?.sl_phieu_xuat2 ?? 0;
          return `${a} / ${b}`;
        },
      },
      {
        title: "Nhân viên",
        dataIndex: "ma_nvbh",
        key: "ma_nvbh",
        width: 140,
        align: "center",
        render: (text) => (text || "").toString(),
      },
      {
        title: "Trạng thái",
        dataIndex: "statusname",
        key: "statusname",
        width: screenSize === "mobile" ? 80 : 120,
        align: "center",
        filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) => (
          <div style={{ padding: 8 }}>
            <Select
              placeholder="Chọn trạng thái"
              value={selectedKeys[0]}
              onChange={(val) => setSelectedKeys(val ? [val] : [])}
              style={{ width: 180, marginBottom: 8, display: "block" }}
              size="small"
            >
              <Select.Option value="0">Mới chia đơn</Select.Option>
              <Select.Option value="1">Đang nhặt hàng</Select.Option>
              <Select.Option value="2">Nhặt xong</Select.Option>
            </Select>
            <Button
              className="search_button"
              type="primary"
              onClick={() =>
                handleFilter("status", selectedKeys[0] || "", confirm)
              }
              size="small"
            >
              Tìm kiếm
            </Button>
          </div>
        ),
        filteredValue: filters.status ? [filters.status] : null,
        render: (_, record) => {
          const status = record?.status;
          if (status === "*" || status === null) {
            return "";
          }

          const getStatusText = (status) => {
            const statusMap = {
              0: screenSize === "mobile" ? "Mới chia" : "Mới chia đơn",
              1: screenSize === "mobile" ? "Đang nhặt" : "Đang nhặt hàng",
              2: screenSize === "mobile" ? "Nhặt xong" : "Nhặt xong",
              3: screenSize === "mobile" ? "Chuyển" : "Chuyển số cài",
              5: screenSize === "mobile" ? "Đề nghị" : "Đề nghị nhặt hàng",
            };
            return statusMap[status] || "Không xác định";
          };

          const displayText = record?.statusname || getStatusText(status);
          const statusColor = getStatusColor(status);

          return <Tag color={statusColor}>{displayText}</Tag>;
        },
      },
      {
        title: "Hành động",
        key: "action",
        width: 80,
        align: "center",
        fixed: "right",
        render: (_, record) => (
          <div className="phieu-action-group">
            <button
              className="phieu-action-btn phieu-action-btn--view"
              title="Xem chi tiết"
              onClick={() =>
                navigate(`/kho/nhat-hang/chi-tiet/${record.stt_rec}`, {
                  state: {
                    sctRec: record.stt_rec,
                    returnUrl: location.pathname,
                  },
                })
              }
            >
              <EyeOutlined />
            </button>
          </div>
        ),
      },
    ];

    return baseColumns;
  };

  const getTableProps = () => {
    const baseProps = {
      columns: getColumns(),
      dataSource: allData,
      pagination: {
        current: currentPage,
        pageSize: pageSize,
        total: totalRecords,
        onChange: handlePageChange,
        showSizeChanger: false,
        showQuickJumper: false,
      },
      bordered: true,
      rowKey: "stt_rec",
      className: "phieu-data-table hidden_scroll_bar",
      scroll: { x: 1480 },
    };

    if (screenSize === "mobile") {
      baseProps.scroll = { x: 600 };
      baseProps.size = "small";
    } else if (screenSize === "mobileLandscape") {
      baseProps.scroll = { x: 800, y: 400 };
      baseProps.size = "small";
    } else if (screenSize === "tablet") {
      baseProps.scroll = { x: 1200, y: 500 };
    } else {
      baseProps.scroll = { x: 1480, y: 600 };
    }

    return baseProps;
  };

  const chipsBar =
    activeChips.length > 0 ? (
      <div className="filter-chips-container">
        <div className="filter-chips-left">
          <FilterOutlined className="filter-chips-icon" />
          <span className="filter-chips-title">
            Đang áp dụng {activeChips.length} bộ lọc
          </span>
          <div className="filter-chips-list">
            {activeChips.map((chip) => (
              <Tag
                key={chip.key}
                closable
                onClose={(e) => {
                  e.preventDefault();
                  removeChip(chip.key);
                }}
                className={`filter-chip ${
                  chip.key === "status"
                    ? "filter-chip--blue"
                    : chip.key === "dateRange"
                    ? "filter-chip--green"
                    : "filter-chip--gray"
                }`}
              >
                {chip.label}: {chip.value}
              </Tag>
            ))}
          </div>
        </div>
        <div className="filter-chips-right">
          <Button size="small" onClick={clearAllChips}>
            Xóa tất cả
          </Button>
        </div>
      </div>
    ) : null;

  return (
    <div>
      <CommonPhieuList
        title={
          screenSize === "mobile"
            ? "PHIẾU NHẬT HÀNG"
            : "DANH SÁCH PHIẾU NHẶT HÀNG"
        }
        extraHeader={chipsBar}
        columns={getColumns()}
        data={allData}
        onBack={() => navigate("/kho")}
        rowKey="stt_rec"
        pagination={{
          current: currentPage,
          pageSize: pageSize,
          total: totalRecords,
          onChange: handlePageChange,
          showSizeChanger: false,
          showQuickJumper: false,
        }}
        loading={isLoading}
      />
    </div>
  );
};

export default ListPhieuNhatHang;
