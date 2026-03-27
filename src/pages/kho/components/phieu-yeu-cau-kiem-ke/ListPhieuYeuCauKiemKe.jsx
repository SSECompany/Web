import { AuditOutlined, ReloadOutlined, FilterOutlined } from "@ant-design/icons";
import { Button, Checkbox, DatePicker, Input, message, Tag, Typography } from "antd";
import dayjs from "dayjs";
import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import https from "../../../../utils/https";
import "../common-phieu.css";
import CommonPhieuList from "../CommonPhieuList";
import { useSelector } from "react-redux";

const { RangePicker } = DatePicker;

const { Title } = Typography;

const ListPhieuYeuCauKiemKe = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("access_token");

  // Lấy thông tin user từ Redux (tương tự ListPhieuNhatHang)
  const userInfo = useSelector((state) => state?.claimsReducer?.userInfo || {});

  // Get unitsResponse from localStorage as fallback cho unitId, giống ở ListPhieuNhatHang
  const unitsResponseStr = localStorage.getItem("unitsResponse");
  const unitsResponse = unitsResponseStr ? JSON.parse(unitsResponseStr) : {};

  const currentStoreId = userInfo?.storeId || unitsResponse?.id || "";
  const currentUnitId = userInfo?.unitId || userInfo?.unitCode || unitsResponse?.unitCode || "";
  const currentUserId = userInfo?.id || userInfo?.userId || 1;

  const [allData, setAllData] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [screenSize, setScreenSize] = useState("desktop");
  const [filters, setFilters] = useState({
    so_ct: "",
    status: [],
    dateRange: null,
  });

  const pageSize = 20;

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

  const fetchPhieuYeuCauKiemKe = useCallback(async (filterParams = filters) => {
    const body = {
      store: "api_list_phieu_yeu_cau_kiem_ke",
      param: {
        so_ct: filterParams.so_ct || "",
        ngay_ct: "",
        DateFrom:
          filterParams.dateRange && filterParams.dateRange[0]
            ? filterParams.dateRange[0].format("YYYY-MM-DD")
            : dayjs().startOf("month").format("YYYY-MM-DD"),
        DateTo:
          filterParams.dateRange && filterParams.dateRange[1]
            ? filterParams.dateRange[1].format("YYYY-MM-DD")
            : dayjs().endOf("month").format("YYYY-MM-DD"),
        PageIndex: currentPage,
        PageSize: pageSize,
        StoreId: currentStoreId,
        UnitId: currentUnitId,
        Status: filterParams.status && filterParams.status.length > 0 ? filterParams.status.join(",") : "",
        Userid: currentUserId,
      },
      data: {},
      resultSetNames: ["data", "pagination"],
    };
    try {
      const res = await https.post("User/AddData", body, {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      });

      // Xử lý response - API trả về listObject là mảng lồng mảng
      const listObj = res.data?.listObject;
      let responseData = [];
      let paginationData = {};

      if (listObj?.dataLists) {
        // Cấu trúc cũ: listObject.dataLists.data
        responseData = listObj.dataLists.data || [];
        paginationData = listObj.dataLists.pagination?.[0] || {};
      } else if (Array.isArray(listObj)) {
        // Cấu trúc mới: listObject[0] = data, listObject[1] = pagination
        responseData = Array.isArray(listObj[0]) ? listObj[0] : [];
        paginationData = Array.isArray(listObj[1]) ? listObj[1]?.[0] || {} : {};
      }

      setAllData(responseData);
      setTotalRecords(paginationData.totalRecord || responseData.length);
    } catch (err) {
      console.error("Lỗi gọi API danh sách phiếu yêu cầu kiểm kê:", err);
    }
  }, [currentPage, filters, pageSize, currentStoreId, currentUnitId, currentUserId, token]);

  useEffect(() => {
    fetchPhieuYeuCauKiemKe();
  }, [fetchPhieuYeuCauKiemKe]);

  const removeFilter = (key) => {
    const newFilters = { ...filters };
    if (key === "dateRange") {
      newFilters.dateRange = null;
    } else if (key === "status") {
      newFilters.status = [];
    } else {
      newFilters[key] = "";
    }
    setFilters(newFilters);
    fetchPhieuYeuCauKiemKe(newFilters);
  };

  const clearAllFilters = () => {
    const cleared = {
      so_ct: "",
      status: [],
      dateRange: null,
    };
    setFilters(cleared);
    fetchPhieuYeuCauKiemKe(cleared);
  };

  const activeChips = useMemo(() => {
    const chips = [];
    if (filters.so_ct)
      chips.push({ key: "so_ct", label: "Số chứng từ", value: filters.so_ct });
    if (filters.status && filters.status.length > 0) {
      const statusLabels = {
        "0": "Lập chứng từ",
        "1": "Đã tạo số liệu",
        "5": "Hoàn thành",
      };
      const display = filters.status.map(s => statusLabels[s] || s).join(", ");
      chips.push({ key: "status", label: "Trạng thái", value: display });
    }
    if (filters.dateRange && filters.dateRange.length === 2) {
      const display = `${filters.dateRange[0].format(
        "DD/MM/YYYY"
      )} - ${filters.dateRange[1].format("DD/MM/YYYY")}`;
      chips.push({ key: "dateRange", label: "Ngày", value: display });
    }
    return chips;
  }, [filters]);

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
                  removeFilter(chip.key);
                }}
                className={`filter-chip ${
                   chip.key === "dateRange"
                    ? "filter-chip--green"
                    : chip.key === "so_ct"
                    ? "filter-chip--orange"
                    : chip.key === "status"
                    ? "filter-chip--blue"
                    : "filter-chip--cyan"
                }`}
              >
                {chip.label}: {chip.value}
              </Tag>
            ))}
          </div>
        </div>
        <div className="filter-chips-right">
          <Button size="small" onClick={clearAllFilters}>
            Xóa lọc
          </Button>
        </div>
      </div>
    ) : null;

  // Làm tươi mềm: gọi lại API lấy data mới nhất (không reload trang)
  useEffect(() => {
    const handler = () => {
      fetchPhieuYeuCauKiemKe(filters);
    };
    window.addEventListener("appRefreshRequested", handler);
    return () => window.removeEventListener("appRefreshRequested", handler);
  }, [currentPage, filters, fetchPhieuYeuCauKiemKe]);

  const handleRefreshClick = () => {
    fetchPhieuYeuCauKiemKe(filters);
  };

  const getStatusColor = (status) => {
    switch (String(status).trim()) {
      case "0":
        return "orange";
      case "1":
        return "default";
      case "5":
        return "processing";
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
        title: "Mã phiếu",
        dataIndex: "stt_rec",
        key: "stt_rec",
        width: 150,
        align: "center",
      },
      {
        title: "Ngày CT",
        dataIndex: "ngay_ct",
        key: "ngay_ct",
        width: 150,
        filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) => (
          <div style={{ padding: 12, width: 280 }}>
            <div style={{ marginBottom: 8, fontWeight: 600, fontSize: '12px', color: '#6366f1' }}>Khoảng ngày:</div>
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
              style={{ width: '100%', marginBottom: 16 }}
              format="DD/MM/YYYY"
              placeholder={["Từ ngày", "Đến ngày"]}
            />
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <Button
                onClick={() => {
                  setSelectedKeys([]);
                  const newFilters = { ...filters, dateRange: null };
                  setFilters(newFilters);
                  fetchPhieuYeuCauKiemKe(newFilters);
                  confirm();
                }}
                style={{ flex: 1, borderRadius: '8px', fontSize: '13px' }}
              >
                Xóa lọc
              </Button>
              <Button
                type="primary"
                onClick={() => {
                  confirm();
                  const newFilters = {
                    ...filters,
                    dateRange:
                      selectedKeys.length === 2
                        ? [
                          dayjs(selectedKeys[0], "DD/MM/YYYY"),
                          dayjs(selectedKeys[1], "DD/MM/YYYY"),
                        ]
                        : null,
                  };
                  setFilters(newFilters);
                  fetchPhieuYeuCauKiemKe(newFilters);
                }}
                style={{ flex: 1, borderRadius: '8px', fontSize: '13px', fontWeight: 600, background: '#6366f1' }}
              >
                Tìm kiếm
              </Button>
            </div>
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
          text ? dayjs(text).format(screenSize === "mobile" ? "DD/MM" : "DD/MM/YYYY") : "",
      },

      {
        title: "Diễn giải",
        dataIndex: "dien_giai",
        key: "dien_giai",
        width: 200,
        align: "center",
        ellipsis: true,
        render: (text) => (text ? text.trim() : ""),
      },
    ];

    if (screenSize !== "mobile") {
      baseColumns.push({
        title: "Số chứng từ",
        dataIndex: "so_ct",
        key: "so_ct",
        width: 150,
        align: "center",
        render: (text) => (text ? text.trim() : ""),
        filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) => (
          <div style={{ padding: 12, width: 250 }}>
            <div style={{ marginBottom: 8, fontWeight: 600, fontSize: '12px', color: '#6366f1' }}>Số chứng từ:</div>
            <Input
              placeholder="Nhập số chứng từ..."
              value={selectedKeys[0]}
              onChange={(e) =>
                setSelectedKeys(e.target.value ? [e.target.value] : [])
              }
              onPressEnter={() => {
                confirm();
                const newFilters = { ...filters, so_ct: selectedKeys[0] || "" };
                setFilters(newFilters);
                fetchPhieuYeuCauKiemKe(newFilters);
              }}
              style={{ marginBottom: 12, display: "block" }}
            />
            <Button
              type="primary"
              onClick={() => {
                confirm();
                const newFilters = { ...filters, so_ct: selectedKeys[0] || "" };
                setFilters(newFilters);
                fetchPhieuYeuCauKiemKe(newFilters);
              }}
              style={{ width: '100%', borderRadius: '8px', background: '#6366f1' }}
            >
              Tìm kiếm
            </Button>
          </div>
        ),
        filteredValue: filters.so_ct ? [filters.so_ct] : null,
      });
    }

    baseColumns.push({
      title: "Trạng thái",
      dataIndex: "statusname",
      key: "status",
      width: screenSize === "mobile" ? 80 : 120,
      align: "center",
      render: (statusname, record) => {
        if (!statusname && (!record.status || record.status === "*" || record.status === "null")) {
          return "";
        }

        const getStatusText = (status) => {
          const statusMap = {
            "0": "Lập chứng từ",
            "1": "Đã tạo số liệu",
            "5": "Hoàn thành",
          };
          return statusMap[status] || (statusname ? statusname.replace(/^\d+\.\s*/, "") : "Không xác định");
        };

        // Trích xuất mã trạng thái hoặc tên trạng thái để map màu
        const rawStatus = (record.status && record.status !== "*" && record.status !== "null")
          ? String(record.status).trim()
          : (statusname ? statusname.replace(/^\d+\.\s*/, "").trim() : "");

        const displayText = (statusname ? statusname.replace(/^\d+\.\s*/, "") : "") || getStatusText(rawStatus);
        
        const getStatusColorV2 = (input) => {
          const val = String(input).toLowerCase();
          if (val === "0" || val.includes("lập chứng từ") || val.includes("lập ct")) return "orange";
          if (val === "5" || val.includes("hoàn thành") || val.includes("đã hoàn thành")) return "blue";
          if (val === "1" || val.includes("tạo số liệu")) return "default";
          if (val === "2" || val.includes("đã duyệt")) return "blue";
          if (val === "3" || val.includes("đã kiểm kê")) return "green";
          return "default";
        };

        return <Tag color={getStatusColorV2(rawStatus)}>{displayText}</Tag>;
      },
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) => (
        <div style={{ padding: 12, minWidth: 200 }}>
          <div style={{ marginBottom: 8, fontWeight: 600, fontSize: '12px', color: '#6366f1' }}>Trạng thái:</div>
          <Checkbox.Group
            style={{ display: "flex", flexDirection: "column", gap: "8px" }}
            value={selectedKeys}
            onChange={(value) => setSelectedKeys(value)}
          >
            <Checkbox value="0">Lập chứng từ</Checkbox>
            <Checkbox value="1">Đã tạo số liệu</Checkbox>
            <Checkbox value="5">Hoàn thành</Checkbox>
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
                fetchPhieuYeuCauKiemKe(newFilters);
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
                fetchPhieuYeuCauKiemKe(newFilters);
              }}
              style={{ flex: 1, borderRadius: '8px', background: '#6366f1' }}
            >
              Tìm kiếm
            </Button>
          </div>
        </div>
      ),
      filteredValue: filters.status && filters.status.length > 0 ? filters.status : null,
    });

    baseColumns.push({
      title: "Hành động",
      key: "action",
      width: 80,
      align: "center",
      fixed: "right",
      render: (_, record) => (
        <div className="phieu-action-group">
          <button
            className="phieu-action-btn phieu-action-btn--edit"
            title="Kiểm kê"
            onClick={() =>
              navigate(`/kho/yeu-cau-kiem-ke/chi-tiet/${record.stt_rec}`, {
                state: {
                  sctRec: record.stt_rec,
                  ngay_ct: record.ngay_ct,
                  so_ct: record.so_ct,
                  ma_kho: record.ma_kho,
                },
              })
            }
          >
            <AuditOutlined />
          </button>
        </div>
      ),
    });

    return baseColumns;
  };

  return (
    <CommonPhieuList
      title={
        screenSize === "mobile" ? "YÊU CẦU KIỂM KÊ" : "DANH SÁCH YÊU CẦU KIỂM KÊ"
      }
      columns={getColumns()}
      data={allData}
      onBack={() => navigate("/kho")}
      extraHeader={chipsBar}
      extraButtons={
        <button
          type="button"
          className="navbar_fullscreen_btn"
          onClick={handleRefreshClick}
          title="Làm tươi"
          aria-label="Làm tươi"
        >
          <ReloadOutlined />
        </button>
      }
      rowKey="stt_rec"
      pagination={{
        current: currentPage,
        pageSize: pageSize,
        total: totalRecords,
        onChange: (page) => setCurrentPage(page),
        showSizeChanger: false,
        showQuickJumper: false,
      }}
    />
  );
};

export default ListPhieuYeuCauKiemKe;
