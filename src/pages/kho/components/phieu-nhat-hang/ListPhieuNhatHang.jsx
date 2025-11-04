import { EyeOutlined, FilterOutlined } from "@ant-design/icons";
import { Button, DatePicker, Input, Select, Tag, Typography } from "antd";
import dayjs from "dayjs";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

  const [allData, setAllData] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [screenSize, setScreenSize] = useState("desktop");
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState({
    so_ct: "",
    so_don_hang: "",
    ma_kh: "",
    ten_kh: "",
    ma_nhomvitri: "",
    status: "",
    dateRange: [dayjs(), dayjs()],
  });

  const pageSize = 20;
  const lastApiCall = useRef({ pageIndex: 0, filters: {} });
  const EMPTY_FILTERS = {};
  const stableFilters = useMemo(() => filters, [filters]);

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

  // URL <-> filters sync helpers
  const buildQueryFromFilters = useCallback((f) => {
    const params = new URLSearchParams();
    if (f.so_ct) params.set("so_ct", f.so_ct);
    if (f.so_don_hang) params.set("so_don_hang", f.so_don_hang);
    if (f.ma_kh) params.set("ma_kh", f.ma_kh);
    if (f.ma_nhomvitri) params.set("ma_nhomvitri", f.ma_nhomvitri);
    if (f.status !== "" && f.status !== undefined && f.status !== null)
      params.set("status", f.status);
    if (f.dateRange && f.dateRange.length === 2) {
      params.set("from", f.dateRange[0].format("MM/DD/YYYY"));
      params.set("to", f.dateRange[1].format("MM/DD/YYYY"));
    }
    return params.toString();
  }, []);

  const parseFiltersFromQuery = useCallback(() => {
    const sp = new URLSearchParams(location.search);
    const so_ct = sp.get("so_ct") || "";
    const so_don_hang = sp.get("so_don_hang") || "";
    const ma_kh = sp.get("ma_kh") || "";
    const ma_nhomvitri = sp.get("ma_nhomvitri") || "";
    const status = sp.get("status") || "";
    const from = sp.get("from");
    const to = sp.get("to");
    const dateRange =
      from && to ? [dayjs(from), dayjs(to)] : [dayjs(), dayjs()];
    return {
      so_ct,
      so_don_hang,
      ma_kh,
      ten_kh: "",
      ma_nhomvitri,
      status,
      dateRange,
    };
  }, [location.search]);

  // Load initial filters from URL
  useEffect(() => {
    const parsed = parseFiltersFromQuery();
    setFilters((prev) => ({ ...prev, ...parsed }));
  }, [parseFiltersFromQuery]);

  const fetchPhieuNhatHang = useCallback(
    async (pageIndex = currentPage, customFilters = null) => {
      if (isLoading) return;

      const filtersToUse = customFilters || stableFilters;
      const normalizeStatus = (val) => {
        if (val === undefined || val === null) return "";
        const str = String(val).trim();
        if (["0", "1", "2"].includes(str)) return str;
        const map = {
          "Mới chia đơn": "0",
          "Đang nhặt hàng": "1",
          "Đã nhặt hàng": "2",
        };
        return map[str] || "";
      };

      // Duplicate prevention logic như POS
      const currentCall = { pageIndex, filters: filtersToUse };
      if (
        lastApiCall.current.pageIndex === pageIndex &&
        JSON.stringify(lastApiCall.current.filters) ===
          JSON.stringify(filtersToUse)
      ) {
        return;
      }
      lastApiCall.current = currentCall;

      setIsLoading(true);
      try {
        const userInfo = JSON.parse(localStorage.getItem("user") || "{}");
        const unitsResponse = JSON.parse(
          localStorage.getItem("unitsResponse") || "{}"
        );

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
          userId: userInfo.userId || "3",
          unitId: userInfo.unitId || unitsResponse.unitId || "TAPMED",
          storeId: "",
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

  // Initial load - sử dụng fetchPhieuNhatHang như POS
  useEffect(() => {
    fetchPhieuNhatHang(1, filters);
  }, [fetchPhieuNhatHang, filters]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchPhieuNhatHang(page, filters);
  };

  const handleFilter = (key, value, confirm) => {
    confirm();
    let filterValue = value;

    const newFilters = { ...filters, [key]: filterValue };
    setFilters(newFilters);
    setCurrentPage(1);
    // persist to URL
    const query = buildQueryFromFilters(newFilters);
    navigate(
      { pathname: location.pathname, search: query ? `?${query}` : "" },
      { replace: true }
    );
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
        2: "Đã nhặt hàng",
      };
      chips.push({
        key: "status",
        label: "Trạng thái",
        value: statusMap[String(filters.status)] || String(filters.status),
      });
    }
    if (filters.dateRange && filters.dateRange.length === 2) {
      chips.push({
        key: "dateRange",
        label: "Ngày",
        value: `${filters.dateRange[0].format(
          "DD/MM/YYYY"
        )} - ${filters.dateRange[1].format("DD/MM/YYYY")}`,
      });
    }
    return chips;
  }, [filters]);

  const removeChip = (chipKey) => {
    const newFilters = { ...filters };
    if (chipKey === "dateRange") newFilters.dateRange = [dayjs(), dayjs()];
    else newFilters[chipKey] = "";
    setFilters(newFilters);
    setCurrentPage(1);
    const query = buildQueryFromFilters(newFilters);
    navigate(
      { pathname: location.pathname, search: query ? `?${query}` : "" },
      { replace: true }
    );
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
      dateRange: [dayjs(), dayjs()],
    };
    setFilters(cleared);
    setCurrentPage(1);
    navigate({ pathname: location.pathname }, { replace: true });
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
        title: "Mã khách hàng",
        dataIndex: "ma_kh",
        key: "ma_kh",
        width: 140,
        align: "center",
        render: (text) => (text ? text.trim() : ""),
        filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) => (
          <div style={{ padding: 8 }}>
            <Input
              placeholder="Tìm Mã khách"
              value={selectedKeys[0]}
              onChange={(e) =>
                setSelectedKeys(e.target.value ? [e.target.value] : [])
              }
              onPressEnter={() => {
                handleFilter("ma_kh", selectedKeys[0] || "", confirm);
              }}
              style={{ marginBottom: 8, display: "block" }}
            />
            <Button
              className="search_button"
              type="primary"
              onClick={() => {
                handleFilter("ma_kh", selectedKeys[0] || "", confirm);
              }}
              size="small"
            >
              Tìm kiếm
            </Button>
          </div>
        ),
        filteredValue: filters.ma_kh ? [filters.ma_kh] : null,
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
        dataIndex: "status",
        key: "status",
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
              <Select.Option value="2">Đã nhặt hàng</Select.Option>
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
        render: (status) => {
          if (status === "*" || status === null) {
            return "";
          }

          const getStatusText = (status) => {
            const statusMap = {
              0: screenSize === "mobile" ? "Mới chia" : "Mới chia đơn",
              1: screenSize === "mobile" ? "Đang nhặt" : "Đang nhặt hàng",
              2: screenSize === "mobile" ? "Đã nhặt" : "Đã nhặt hàng",
              3: screenSize === "mobile" ? "Chuyển" : "Chuyển số cài",
              5: screenSize === "mobile" ? "Đề nghị" : "Đề nghị nhặt hàng",
            };
            return statusMap[status] || "Không xác định";
          };

          const displayText = getStatusText(status);
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
                  state: { sctRec: record.stt_rec },
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
