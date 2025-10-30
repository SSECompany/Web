import { EyeOutlined } from "@ant-design/icons";
import { Button, DatePicker, Input, Tag, Typography } from "antd";
import dayjs from "dayjs";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import CommonPhieuList from "../CommonPhieuList";
import "../common-phieu.css";
import { fetchPhieuNhatHangList } from "./utils/phieuNhatHangApi";

const { RangePicker } = DatePicker;

const { Title } = Typography;

const ListPhieuNhatHang = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("access_token");

  const [allData, setAllData] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [screenSize, setScreenSize] = useState("desktop");
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState({
    so_ct: "",
    ma_kh: "",
    ten_kh: "",
    dateRange: null,
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

  const fetchPhieuNhatHang = useCallback(
    async (pageIndex = currentPage, customFilters = null) => {
      if (isLoading) return;

      const filtersToUse = customFilters || stableFilters;

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
          ngay_ct: "",
          ma_kh: filtersToUse.ma_kh || "",
          status: "",
          ma_ban: "",
          s2: "",
          s3: "",
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
    fetchPhieuNhatHang(1, newFilters);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "0":
        return "orange";
      case "1":
        return "green";
      case "2":
        return "blue";
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
        dataIndex: "fcode1",
        key: "fcode1",
        width: 140,
        align: "center",
        render: (text) => (text ? text.trim() : ""),
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
        render: (status) => {
          if (status === "*" || status === null) {
            return "";
          }

          const getStatusText = (status) => {
            const statusMap = {
              0: screenSize === "mobile" ? "Lập CT" : "Lập chứng từ",
              1: screenSize === "mobile" ? "Đã nhặt" : "Đã nhặt hàng",
              2: screenSize === "mobile" ? "Nhặt" : "Nhặt hàng",
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

  return (
    <CommonPhieuList
      title={
        screenSize === "mobile"
          ? "PHIẾU NHẶT HÀNG"
          : "DANH SÁCH PHIẾU NHẶT HÀNG"
      }
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
  );
};

export default ListPhieuNhatHang;
