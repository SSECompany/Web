import { EyeOutlined, FilterOutlined, ReloadOutlined } from "@ant-design/icons";
import { Button, Checkbox, DatePicker, Input, Select, Tag, Typography } from "antd";
import dayjs from "dayjs";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import ListTemplate from "../../../../components/common/PageTemplates/ListTemplate";
import "../common-phieu.css";
import { fetchPhieuNhatHangList } from "./utils/phieuNhatHangApi";
import { formatDate, formatDateTime, formatDateForApi, formatDateForStorage } from "../../../../utils/dateUtils";

const { RangePicker } = DatePicker;

const { Title } = Typography;

// Vùng: fix cứng V1, V2, V3, V4 (multi-select)
const VUNG_OPTIONS = ["V1", "V2", "V3", "V4"];

// Trạng thái: multi-select, mặc định Mới chia đơn + Đang nhặt hàng
const STATUS_OPTIONS = [
  { value: "0", label: "Mới chia đơn" },
  { value: "1", label: "Đang nhặt hàng" },
  { value: "2", label: "Nhặt xong" },
];
const STATUS_DEFAULT = ["0", "1"]; // Mới chia đơn, Đang nhặt hàng

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
        const maNhomVitri = parsed.ma_nhomvitri;
        const maNhomVitriArr = Array.isArray(maNhomVitri)
          ? maNhomVitri.filter((v) => VUNG_OPTIONS.includes(v))
          : typeof maNhomVitri === "string" && maNhomVitri
            ? maNhomVitri.split(",").map((s) => s.trim()).filter((v) => VUNG_OPTIONS.includes(v))
            : [];
        return {
          so_ct: parsed.so_ct || "",
          so_don_hang: parsed.so_don_hang || "",
          ma_kh: parsed.ma_kh || "",
          ten_kh: parsed.ten_kh || "",
          ma_nhomvitri: maNhomVitriArr,
          status: (() => {
            const s = parsed.status;
            if (Array.isArray(s)) return s.filter((v) => ["0", "1", "2"].includes(String(v)));
            if (s && typeof s === "string") return s.split(",").map((x) => x.trim()).filter((v) => ["0", "1", "2"].includes(v));
            return [...STATUS_DEFAULT];
          })(),
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
      ma_nhomvitri: [],
      status: [...STATUS_DEFAULT],
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
      f.ten_kh ||
      (Array.isArray(f.ma_nhomvitri) && f.ma_nhomvitri.length > 0) ||
      (Array.isArray(f.status) && f.status.length > 0) ||
      (f.dateRange &&
        f.dateRange.length === 2 &&
        !f.dateRange[0].isSame(dayjs(), "day"))
    );
  };

  const [hasUserAppliedFilters, setHasUserAppliedFilters] = useState(
    checkHasAppliedFilters(initialFilters)
  );

  const pageSize = 50;
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
  const filterChangeFromSearchRef = useRef(false); // Khi ấn Tìm kiếm: handleFilter đã gọi API → effect [filters] bỏ qua 1 lần
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
        ma_nhomvitri: Array.isArray(f.ma_nhomvitri) ? f.ma_nhomvitri : [],
        status: Array.isArray(f.status) ? f.status : [],
        dateRange:
          f.dateRange && f.dateRange.length === 2
            ? {
                from: formatDateForStorage(f.dateRange[0]),
                to: formatDateForStorage(f.dateRange[1]),
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
      const maNhomVitri = parsed.ma_nhomvitri;
      const maNhomVitriArr = Array.isArray(maNhomVitri)
        ? maNhomVitri.filter((v) => VUNG_OPTIONS.includes(v))
        : typeof maNhomVitri === "string" && maNhomVitri
          ? maNhomVitri.split(",").map((s) => s.trim()).filter((v) => VUNG_OPTIONS.includes(v))
          : [];
      const statusArr = Array.isArray(parsed.status)
        ? parsed.status.filter((v) => ["0", "1", "2"].includes(String(v)))
        : parsed.status && typeof parsed.status === "string"
          ? parsed.status.split(",").map((x) => x.trim()).filter((v) => ["0", "1", "2"].includes(v))
          : [...STATUS_DEFAULT];
      return {
        so_ct: parsed.so_ct || "",
        so_don_hang: parsed.so_don_hang || "",
        ma_kh: parsed.ma_kh || "",
        ten_kh: parsed.ten_kh || "",
        ma_nhomvitri: maNhomVitriArr,
        status: statusArr.length > 0 ? statusArr : [...STATUS_DEFAULT],
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
    async (pageIndex = currentPage, customFilters = null, forceRefresh = false) => {
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

      // Get unitsResponse from localStorage as fallback for unitId
      const unitsResponse = JSON.parse(
        localStorage.getItem("unitsResponse") || "{}"
      );

      const userId = currentUserInfo?.id || currentUserInfo?.userId || "";
      const unitId = currentUserInfo?.unitId || unitsResponse?.unitId || "";
      const storeId = currentUserInfo?.storeId || "";

      // Duplicate prevention logic - bỏ qua khi forceRefresh (vd. bấm logo làm tươi)
      const currentCall = {
        pageIndex,
        filters: filtersToUse,
        userId,
        unitId,
        storeId,
      };
      if (
        !forceRefresh &&
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
              ? formatDateForApi(filtersToUse.dateRange[0])
              : "",
          DateTo:
            filtersToUse.dateRange && filtersToUse.dateRange.length === 2
              ? formatDateForApi(filtersToUse.dateRange[1])
              : "",
          ngay_ct: "",
          ma_kh: filtersToUse.ma_kh || "",
          ten_kh: filtersToUse.ten_kh || "",
          Status: Array.isArray(filtersToUse.status) && filtersToUse.status.length
            ? filtersToUse.status.join(",")
            : "",
          ma_ban: "",
          s2: "",
          s3: "",
          so_don_hang: filtersToUse.so_don_hang || "",
          ma_nhomvitri: Array.isArray(filtersToUse.ma_nhomvitri) && filtersToUse.ma_nhomvitri.length
            ? filtersToUse.ma_nhomvitri.join(",")
            : "",
          pageIndex: pageIndex,
          pageSize: pageSize,
          userId: userId,
          unitId: unitId,
          storeId: storeId,
        };

        const result = await fetchPhieuNhatHangList(params);

        // Chỉ cập nhật state nếu response này vẫn là request mới nhất (tránh race: đổi filter khi đang ở trang 5 → request cũ trả về sau ghi đè totalRecords)
        const stillCurrent =
          lastApiCall.current.pageIndex === pageIndex &&
          JSON.stringify(lastApiCall.current.filters) === JSON.stringify(filtersToUse);

        if (result.success && stillCurrent) {
          setAllData(result.data);
          setTotalRecords(result.pagination.totalRecord ?? result.data.length);
        } else if (!result.success) {
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
  // Bỏ qua khi vừa ấn Tìm kiếm (handleFilter đã gọi API) để tránh double call
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

    // Khi ấn Tìm kiếm (đang ở trang 5 rồi bỏ trạng thái): handleFilter đã gọi API với newFilters → không gọi lại ở đây
    if (filterChangeFromSearchRef.current) {
      filterChangeFromSearchRef.current = false;
      return;
    }

    // Chỉ gọi nếu đã load lần đầu để tránh double call với effect trên
    if (hasInitialLoad.current) {
      fetchPhieuNhatHang(1, filters);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  // Làm tươi mềm: bấm logo TAPMED → gọi lại API lấy data mới nhất (không reload trang)
  useEffect(() => {
    const handler = () => {
      if (hasInitialLoad.current) {
        fetchPhieuNhatHang(currentPage, filters, true);
      }
    };
    window.addEventListener("appRefreshRequested", handler);
    return () => window.removeEventListener("appRefreshRequested", handler);
  }, [currentPage, filters, fetchPhieuNhatHang]);

  const handleRefreshClick = useCallback(() => {
    if (hasInitialLoad.current) {
      fetchPhieuNhatHang(currentPage, filters, true);
    }
  }, [currentPage, filters, fetchPhieuNhatHang]);

  const handlePageChange = (page) => {
    // Khi đang ở trang 5 rồi ấn Tìm kiếm: handleFilter set currentPage=1 → Table có thể gọi onChange(1) với filters cũ → bỏ qua
    if (filterChangeFromSearchRef.current && page === 1) {
      setCurrentPage(page);
      return;
    }
    setCurrentPage(page);
    fetchPhieuNhatHang(page, filters);
  };

  const handleFilter = (key, value, confirm) => {
    // Đặt ref ngay đầu, trước confirm() và setState — nếu confirm() gây re-render/effect thì effect [filters] sẽ bỏ qua
    filterChangeFromSearchRef.current = true;
    confirm();

    // Chuẩn hóa multi-select: luôn dùng array cho ma_nhomvitri và status
    let filterValue = value;
    if (key === "ma_nhomvitri" || key === "status") {
      filterValue = Array.isArray(value) ? value : value ? [value] : [];
    }

    const newFilters = { ...filters, [key]: filterValue };
    setFilters(newFilters);
    setHasUserAppliedFilters(true); // User đã apply filter
    setCurrentPage(1);
    saveFiltersToStorage(newFilters);
    fetchPhieuNhatHang(1, newFilters);
  };

  // Dropdown multi-select: đồng bộ selectedKeys với filters khi mở, ấn Tìm kiếm thì lọc theo đúng value đang chọn
  const MultiSelectFilterDropdown = ({
    setSelectedKeys,
    selectedKeys,
    confirm,
    filterKey,
    initialValue,
    placeholder,
    options,
    onFilter,
  }) => {
    useEffect(() => {
      setSelectedKeys(Array.isArray(initialValue) ? [...initialValue] : []);
      // Chỉ đồng bộ khi dropdown mở (mount), không re-sync khi initialValue thay đổi
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    const currentValues = Array.isArray(selectedKeys) ? selectedKeys : [];
    return (
      <div style={{ padding: 8, minWidth: 200, display: "flex", flexDirection: "column" }}>
        <Select
          mode="multiple"
          placeholder={placeholder}
          value={currentValues}
          onChange={(val) => setSelectedKeys(val || [])}
          style={{ width: "100%", minWidth: 180 }}
          size="small"
          options={options}
          listHeight={200}
          placement="topLeft"
          showSearch={false}
        />
        <Button
          className="search_button"
          type="primary"
          onClick={() => onFilter(filterKey, currentValues, confirm)}
          size="small"
        >
          Tìm kiếm
        </Button>
      </div>
    );
  };

  // Active filter chips
  const activeChips = useMemo(() => {
    const chips = [];
    if (filters.so_ct)
      chips.push({ key: "so_ct", label: "Số", value: filters.so_ct });
    if (filters.so_don_hang)
      chips.push({
        key: "so_don_hang",
        label: "Số ĐH",
        value: filters.so_don_hang,
      });
    if (filters.ma_kh)
      chips.push({
        key: "ma_kh",
        label: "Mã khách hàng",
        value: filters.ma_kh,
      });
    if (filters.ten_kh)
      chips.push({
        key: "ten_kh",
        label: "Tên KH",
        value: filters.ten_kh,
      });
    if (Array.isArray(filters.ma_nhomvitri) && filters.ma_nhomvitri.length > 0)
      chips.push({
        key: "ma_nhomvitri",
        label: "Vùng",
        value: filters.ma_nhomvitri.join(", "),
      });
    if (Array.isArray(filters.status) && filters.status.length > 0) {
      const statusMap = { "0": "Mới chia đơn", "1": "Đang nhặt hàng", "2": "Nhặt xong" };
      chips.push({
        key: "status",
        label: "Trạng thái",
        value: filters.status.map((s) => statusMap[String(s)] || s).join(", "),
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
        value: `${formatDate(filters.dateRange[0])} - ${formatDate(filters.dateRange[1])}`,
      });
    }
    return chips;
  }, [filters, hasUserAppliedFilters]);

  const removeChip = (chipKey) => {
    const newFilters = { ...filters };
    if (chipKey === "dateRange") {
      newFilters.dateRange = null;
    } else if (chipKey === "ma_nhomvitri") {
      newFilters.ma_nhomvitri = [];
    } else if (chipKey === "status") {
      newFilters.status = [];
    } else {
      newFilters[chipKey] = "";
    }
    setFilters(newFilters);
    setCurrentPage(1);
    saveFiltersToStorage(newFilters);
    // useEffect([filters]) gọi API 1 lần
  };

  const clearAllChips = () => {
    const cleared = {
      so_ct: "",
      so_don_hang: "",
      ma_kh: "",
      ten_kh: "",
      ma_nhomvitri: [],
      status: [...STATUS_DEFAULT],
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
    // useEffect([filters]) gọi API 1 lần
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
        title: "Số",
        dataIndex: "so_ct",
        key: "so_ct",
        width: 100,
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
        title: "Ngày",
        dataIndex: "ngay_ct",
        key: "ngay_ct",
        width: 100,
        align: "center",
        ellipsis: false,
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
                    formatDate(dates[0]),
                    formatDate(dates[1]),
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
                formatDate(filters.dateRange[0]),
                formatDate(filters.dateRange[1]),
              ]
            : null,
        render: (text, record) => {
          const dateStr = text
            ? formatDate(text, screenSize === "mobile" ? "DD/MM" : "DD/MM/YYYY")
            : "";
          const raw = record?.datetime0;
          let display = dateStr;
          if (raw) {
            const d = dayjs(raw);
            if (d.isValid()) display = `${dateStr} ${d.format("HH:mm")}`;
            else if (typeof raw === "string" && raw.includes(":")) {
              const part = raw.trim().split(" ").pop() || raw;
              const timeMatch = part.match(/^(\d{1,2}):(\d{2})/);
              if (timeMatch) display = `${dateStr} ${timeMatch[0]}`;
            }
          }
          return display ? (
            <span style={{ wordBreak: "break-word", whiteSpace: "normal" }}>
              {display}
            </span>
          ) : (
            ""
          );
        },
      },
      {
        title: "Tên KH",
        dataIndex: "ten_kh",
        key: "ten_kh",
        width: 120,
        align: "center",
        ellipsis: false,
        render: (text) => {
          const s = (text || "").toString();
          return s ? <span style={{ wordBreak: "break-word", whiteSpace: "normal" }}>{s}</span> : "";
        },
        filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) => (
          <div style={{ padding: 8 }}>
            <Input
              placeholder="Tìm Tên KH"
              value={selectedKeys[0]}
              onChange={(e) =>
                setSelectedKeys(e.target.value ? [e.target.value] : [])
              }
              onPressEnter={() => {
                handleFilter("ten_kh", selectedKeys[0] || "", confirm);
              }}
              style={{ marginBottom: 8, display: "block" }}
            />
            <Button
              className="search_button"
              type="primary"
              onClick={() => {
                handleFilter("ten_kh", selectedKeys[0] || "", confirm);
              }}
              size="small"
            >
              Tìm kiếm
            </Button>
          </div>
        ),
        filteredValue: filters.ten_kh ? [filters.ten_kh] : null,
      },
      {
        title: "Số ĐH",
        dataIndex: "so_don_hang",
        key: "so_don_hang",
        width: 72,
        align: "center",
        render: (text) => (text ? text.trim() : ""),
        filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) => (
          <div style={{ padding: 8 }}>
            <Input
              placeholder="Tìm Số ĐH"
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
        width: 65,
        align: "center",
        render: (text) => (text || "").toString(),
        filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) => (
          <MultiSelectFilterDropdown
            setSelectedKeys={setSelectedKeys}
            selectedKeys={selectedKeys}
            confirm={confirm}
            filterKey="ma_nhomvitri"
            initialValue={filters.ma_nhomvitri || []}
            placeholder="Chọn Vùng"
            options={VUNG_OPTIONS.map((v) => ({ label: v, value: v }))}
            onFilter={handleFilter}
          />
        ),
        filteredValue: Array.isArray(filters.ma_nhomvitri) && filters.ma_nhomvitri.length > 0 ? filters.ma_nhomvitri : null,
      },
      {
        title: "Bàn",
        dataIndex: "ban_dong_goi",
        key: "ban_dong_goi",
        width: 35,
        align: "center",
        render: (text) => (text || "").toString(),
      },
      {
        title: "% HT",
        key: "ti_le_hoan_thanh",
        width: 45,
        align: "center",
        render: (_, record) => {
          const a = record?.sl_phieu_xuat1 ?? 0;
          const b = record?.sl_phieu_xuat2 ?? 0;
          return `${a} / ${b}`;
        },
      },
      {
        title: "Nhân viên",
        dataIndex: "ten_nvbh",
        key: "ma_nvbh",
        width: 100,
        align: "center",
        ellipsis: false,
        render: (text, record) => {
          const s = (text || record?.ma_nvbh || "").toString();
          return s ? <span style={{ wordBreak: "break-word", whiteSpace: "normal" }}>{s}</span> : "";
        },
      },
      {
        title: "Trạng thái",
        dataIndex: "statusname",
        key: "statusname",
        width: screenSize === "mobile" ? 90 : 120,
        align: "center",
        filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) => (
          <div style={{ padding: 12, minWidth: 200 }}>
            <div style={{ marginBottom: 8, fontWeight: 600, fontSize: '12px', color: '#6366f1' }}>Trạng thái:</div>
            <Checkbox.Group
              style={{ display: "flex", flexDirection: "column", gap: "8px" }}
              value={selectedKeys}
              onChange={(value) => setSelectedKeys(value)}
            >
              {STATUS_OPTIONS.map(opt => (
                <Checkbox key={opt.value} value={opt.value}>{opt.label}</Checkbox>
              ))}
            </Checkbox.Group>
            <div
              style={{
                marginTop: 12,
                display: "flex",
                justifyContent: "space-between",
                gap: "8px",
              }}
            >
              <Button
                size="small"
                onClick={() => {
                  setSelectedKeys([]);
                  const newFilters = { ...filters, status: [] };
                  setFilters(newFilters);
                  setCurrentPage(1);
                  saveFiltersToStorage(newFilters);
                  fetchPhieuNhatHang(1, newFilters);
                  confirm();
                }}
                style={{ flex: 1, borderRadius: '8px' }}
              >
                Xóa
              </Button>
              <Button
                type="primary"
                size="small"
                onClick={() => {
                  confirm();
                  const newFilters = { ...filters, status: selectedKeys };
                  setFilters(newFilters);
                  setCurrentPage(1);
                  saveFiltersToStorage(newFilters);
                  fetchPhieuNhatHang(1, newFilters);
                }}
                style={{ flex: 1, borderRadius: '8px', background: '#6366f1' }}
              >
                Tìm kiếm
              </Button>
            </div>
          </div>
        ),
        filteredValue: Array.isArray(filters.status) && filters.status.length > 0 ? filters.status : null,
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
        title: "Thời gian xử lý",
        key: "thoi_gian_xu_ly",
        width: 110,
        align: "center",
        ellipsis: false,
        render: (_, record) => {
          const formatTime = (text) => {
            if (!text || text === null || text === "null" || text === "*")
              return null;
            try {
              return formatDateTime(text);
            } catch {
              return null;
            }
          };

          const batDau = formatTime(record.bat_dau_nhat_hang);
          const ketThuc = formatTime(record.nhat_hang_xong);

          if (!batDau && !ketThuc) {
            return "";
          }

          // Tạo dot lớn bằng CSS với khoảng trắng ở giữa
          const dotStyle = {
            display: "inline-block",
            width: "10px",
            height: "10px",
            borderRadius: "50%",
            border: "2px solid #000",
            backgroundColor: "transparent",
            marginRight: "8px",
            verticalAlign: "middle",
          };

          // Nếu có cả bắt đầu và kết thúc: hiển thị với dot
          if (batDau && ketThuc) {
            return (
              <div style={{ lineHeight: "1.5" }}>
                <div>
                  <span style={dotStyle}></span> {batDau}
                </div>
                <div>
                  <span style={dotStyle}></span> {ketThuc}
                </div>
              </div>
            );
          }

          // Chỉ có bắt đầu
          if (batDau) {
            return (
              <div>
                <span style={dotStyle}></span> {batDau}
              </div>
            );
          }

          // Chỉ có kết thúc
          if (ketThuc) {
            return (
              <div>
                <span style={dotStyle}></span> {ketThuc}
              </div>
            );
          }

          return "";
        },
      },
      {
        title: "Ghi chú",
        dataIndex: "ghi_chu",
        key: "ghi_chu",
        width: 150,
        align: "center",
        ellipsis: false,
        render: (text) => {
          const s = (text || "").toString().trim();
          return s ? (
            <span style={{ wordBreak: "break-word", whiteSpace: "normal", lineHeight: 1.4 }}>
              {s}
            </span>
          ) : (
            ""
          );
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
      scroll: { x: 1460 },
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
      baseProps.scroll = { x: 1460, y: 600 };
    }

    return baseProps;
  };

  // chipsBar removed, handled by ListTemplate

  return (
    <div>
      <ListTemplate
        title={
          screenSize === "mobile"
            ? "PHIẾU NHẬT HÀNG"
            : "PHIẾU NHẶT HÀNG"
        }
        columns={getColumns()}
        data={allData}
        onBack={() => navigate("/kho")}
        onRefresh={handleRefreshClick}
        rowKey="stt_rec"
        pagination={{
          current: currentPage,
          pageSize: pageSize,
          total: totalRecords,
          onChange: handlePageChange,
        }}
        loading={isLoading}
        activeChips={activeChips}
        onRemoveFilter={removeChip}
        onClearAllFilters={clearAllChips}
        tableProps={{
          scroll: {
            x: screenSize === "mobile" ? 600 : screenSize === "mobileLandscape" ? 800 : screenSize === "tablet" ? 1200 : 1460,
            y: 1040, /* ~20 dòng visible, còn lại scroll (tối đa 50/trang) */
          },
          ...(screenSize === "mobile" || screenSize === "mobileLandscape" ? { size: "small" } : {}),
        }}
      />
    </div>
  );
};

export default ListPhieuNhatHang;
