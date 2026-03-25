import {
  Button,
  Checkbox,
  DatePicker,
  Input,
  message,
  Select,
  Table,
  Tag,
  Typography,
} from "antd";
import {
  FilterOutlined,
  ReloadOutlined,
  DeleteOutlined,
  EditOutlined,
  FileTextOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import showConfirm from "../../../../components/common/Modal/ModalConfirm";
import "../common-phieu.css";
import CommonPhieuList from "../CommonPhieuList";
import {
  deletePhieuNhapHang,
  fetchPhieuNhapHangList,
} from "./utils/phieuNhapHangApi";

const { RangePicker } = DatePicker;
const { Title } = Typography;

const ListPhieuNhapHang = () => {
  const navigate = useNavigate();
  const [allData, setAllData] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [screenSize, setScreenSize] = useState("desktop");

  const FILTER_STORAGE_KEY = "phieu_nhap_hang_filters";

  const getSavedFilters = () => {
    try {
      const saved = localStorage.getItem(FILTER_STORAGE_KEY);
      if (saved) {
        const parsedFilters = JSON.parse(saved);
        if (parsedFilters.dateRange && Array.isArray(parsedFilters.dateRange)) {
          parsedFilters.dateRange = parsedFilters.dateRange.map((date) =>
            date ? dayjs(date) : null
          );
        }
        return parsedFilters;
      }
    } catch (error) {
      console.error("Error loading saved filters:", error);
    }
    return {
      so_ct: "",
      ma_kh: "",
      ten_kh: "",
      dateRange: null,
      status: "",
      so_po: "",
    };
  };

  const [filters, setFilters] = useState(getSavedFilters());

  const getStatusText = (status) => {
    if (!status) return "";
    const statusMap = {
      2: "Nhập kho",
      3: "Chuyển vào SC",
    };

    return status
      .split(",")
      .map((s) => statusMap[s.trim()] || s)
      .join(", ");
  };

  const saveFilters = (filtersToSave) => {
    try {
      const filtersForStorage = { ...filtersToSave };
      if (
        filtersForStorage.dateRange &&
        Array.isArray(filtersForStorage.dateRange)
      ) {
        filtersForStorage.dateRange = filtersForStorage.dateRange.map((date) =>
          date ? date.format("YYYY-MM-DD") : null
        );
      }
      localStorage.setItem(
        FILTER_STORAGE_KEY,
        JSON.stringify(filtersForStorage)
      );
    } catch (error) {
      console.error("Error saving filters:", error);
    }
  };

  const pageSize = 20;

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

  useEffect(() => {
    saveFilters(filters);
  }, [filters]);

  const handleRefresh = () => {
    fetchPhieuNhapHang(filters);
  };

  const removeFilter = (key) => {
    const newFilters = { ...filters };
    if (key === "dateRange") {
      newFilters.dateRange = null;
    } else {
      newFilters[key] = "";
    }
    setFilters(newFilters);
    fetchPhieuNhapHang(newFilters);
  };

  const clearAllFilters = () => {
    const cleared = {
      so_ct: "",
      ma_kh: "",
      ten_kh: "",
      dateRange: null,
      status: "",
      so_po: "",
    };
    try { localStorage.removeItem(FILTER_STORAGE_KEY); } catch (e) { console.error(e); }
    setFilters(cleared);
    fetchPhieuNhapHang(cleared);
  };

  const activeChips = useMemo(() => {
    const chips = [];
    if (filters.so_ct)
      chips.push({ key: "so_ct", label: "Số đơn", value: filters.so_ct });
    if (filters.so_po)
      chips.push({ key: "so_po", label: "Số PO", value: filters.so_po });
    if (filters.ma_kh)
      chips.push({ key: "ma_kh", label: "Mã khách", value: filters.ma_kh });
    if (filters.ten_kh)
      chips.push({ key: "ten_kh", label: "Tên khách", value: filters.ten_kh });
    if (filters.dateRange && filters.dateRange.length === 2) {
      const display = `${filters.dateRange[0].format(
        "DD/MM/YYYY"
      )} - ${filters.dateRange[1].format("DD/MM/YYYY")}`;
      chips.push({ key: "dateRange", label: "Ngày", value: display });
    }
    if (filters.status) {
      chips.push({
        key: "status",
        label: "Trạng thái",
        value: getStatusText(filters.status),
      });
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
                  chip.key === "status"
                    ? "filter-chip--blue"
                    : chip.key === "dateRange"
                    ? "filter-chip--green"
                    : chip.key === "so_ct" || chip.key === "so_po"
                    ? "filter-chip--orange"
                    : chip.key === "ma_kh" || chip.key === "ten_kh"
                    ? "filter-chip--magenta"
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

  const fetchPhieuNhapHang = useCallback(async (filterParams = filters) => {
    const params = {
      so_ct: filterParams.so_ct || "",
      so_po: filterParams.so_po || "",
      ma_kh: filterParams.ma_kh || "",
      ten_kh: filterParams.ten_kh || "",
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
      Status: filterParams.status || "",
    };

    try {
      const result = await fetchPhieuNhapHangList(params);
      if (result.success) {
        setAllData(result.data);
        setTotalRecords(result.pagination.totalRecord || result.data.length);
      } else {
        console.error("Lỗi gọi API danh sách phiếu nhập hàng:", result.error);
      }
    } catch (err) {
      console.error("Lỗi gọi API danh sách phiếu nhập hàng:", err);
    }
  }, [currentPage, filters, pageSize]);

  useEffect(() => {
    fetchPhieuNhapHang();
  }, [fetchPhieuNhapHang]);

  const getStatusColor = (status) => {
    switch (String(status).trim()) {
      case "0":
        return "orange";
      case "1":
        return "magenta";
      case "2":
        return "blue";
      case "3":
        return "purple";
      case "4":
        return "green";
      case "5":
        return "cyan";
      case "6":
        return "red";
      case "9":
        return "green";
      default:
        return "default";
    }
  };

  const handleDelete = async (sctRec) => {
    showConfirm({
      title: "Xác nhận xóa phiếu nhập hàng",
      content: "Bạn có chắc chắn muốn xóa phiếu nhập hàng này không?",
      type: "warning",
      onOk: async () => {
        try {
          if (!sctRec) {
            message.error("Không tìm thấy mã phiếu để xóa");
            return;
          }

          const result = await deletePhieuNhapHang(sctRec);

          if (result.success) {
            await fetchPhieuNhapHang();
          }
        } catch (error) {
          console.error("Lỗi khi xóa phiếu nhập hàng:", error);
          message.error("Có lỗi xảy ra khi xóa phiếu nhập hàng");
        }
      },
    });
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
        title: "Ngày",
        dataIndex: "ngay_ct",
        key: "ngay_ct",
        width: 120,
        align: "center",
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
                fetchPhieuNhapHang(newFilters);
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
        width: 100,
        align: "center",
        render: (text) => (text ? text.trim() : ""),
        filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) => (
          <div style={{ padding: 8 }}>
            <Input
              placeholder="Tìm Số CT"
              value={selectedKeys[0]}
              onChange={(e) =>
                setSelectedKeys(e.target.value ? [e.target.value] : [])
              }
              onPressEnter={() => {
                confirm();
                const newFilters = { ...filters, so_ct: selectedKeys[0] || "" };
                setFilters(newFilters);
                fetchPhieuNhapHang(newFilters);
              }}
              style={{ marginBottom: 8, display: "block" }}
            />
            <Button
              className="search_button"
              type="primary"
              onClick={() => {
                confirm();
                const newFilters = { ...filters, so_ct: selectedKeys[0] || "" };
                setFilters(newFilters);
                fetchPhieuNhapHang(newFilters);
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
        title: "Mã khách",
        dataIndex: "ma_kh",
        key: "ma_kh",
        width: 120,
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
                confirm();
                const newFilters = { ...filters, ma_kh: selectedKeys[0] || "" };
                setFilters(newFilters);
                fetchPhieuNhapHang(newFilters);
              }}
              style={{ marginBottom: 8, display: "block" }}
            />
            <Button
              className="search_button"
              type="primary"
              onClick={() => {
                confirm();
                const newFilters = { ...filters, ma_kh: selectedKeys[0] || "" };
                setFilters(newFilters);
                fetchPhieuNhapHang(newFilters);
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
        title: "Tên khách",
        dataIndex: "ten_kh",
        key: "ten_kh",
        width: 250,
        align: "left",
        render: (text) => (text ? text.trim() : ""),
        filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) => (
          <div style={{ padding: 8 }}>
            <Input
              placeholder="Tìm Tên khách"
              value={selectedKeys[0]}
              onChange={(e) =>
                setSelectedKeys(e.target.value ? [e.target.value] : [])
              }
              onPressEnter={() => {
                confirm();
                const newFilters = {
                  ...filters,
                  ten_kh: selectedKeys[0] || "",
                };
                setFilters(newFilters);
                fetchPhieuNhapHang(newFilters);
              }}
              style={{ marginBottom: 8, display: "block" }}
            />
            <Button
              className="search_button"
              type="primary"
              onClick={() => {
                confirm();
                const newFilters = {
                  ...filters,
                  ten_kh: selectedKeys[0] || "",
                };
                setFilters(newFilters);
                fetchPhieuNhapHang(newFilters);
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
        title: "Tiền",
        dataIndex: "t_tt_nt",
        key: "t_tt_nt",
        width: 150,
        align: "center",
        render: (value) =>
          new Intl.NumberFormat("vi-VN").format(parseFloat(value || 0)),
      },
      {
        title: "Trạng thái",
        dataIndex: "statusname",
        key: "status",
        width: 150,
        align: "center",
        filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) => (
          <div style={{ padding: 12, minWidth: 200 }}>
            <div style={{ marginBottom: 8, fontWeight: 600 }}>Của hàng:</div>
            <Checkbox.Group
              style={{ display: "flex", flexDirection: "column", gap: "8px" }}
              value={selectedKeys}
              onChange={(value) => setSelectedKeys(value)}
            >
              <Checkbox value="2">Nhập kho</Checkbox>
              <Checkbox value="3">Chuyển vào SC</Checkbox>
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
                  const newFilters = { ...filters, status: "" };
                  setFilters(newFilters);
                  fetchPhieuNhapHang(newFilters);
                  confirm();
                }}
                style={{ flex: 1 }}
              >
                Xóa
              </Button>
              <Button
                type="primary"
                size="small"
                onClick={() => {
                  confirm();
                  const newFilters = {
                    ...filters,
                    status: selectedKeys.join(",") || "",
                  };
                  setFilters(newFilters);
                  fetchPhieuNhapHang(newFilters);
                }}
                style={{ flex: 1 }}
              >
                Tìm kiếm
              </Button>
            </div>
          </div>
        ),
        filteredValue: filters.status ? filters.status.split(",") : null,
        render: (statusname, record) => {
          const status = String(record.status).trim();
          if (status === "*" || status === "null") {
            return "";
          }
          const displayStatus = statusname || "";
          const statusColor = getStatusColor(status);
          return (
            <Tag color={statusColor} style={{ margin: 0, fontSize: "11px" }}>
              {displayStatus}
            </Tag>
          );
        },
      },
      {
        title: "Người lập",
        dataIndex: "nguoi_tao",
        key: "nguoi_tao",
        width: 150,
        align: "center",
        render: (text) => (text ? text.trim() : ""),
      },
      {
        title: "Hành động",
        key: "action",
        width: 120,
        align: "center",
        fixed: "right",
        render: (_, record) => (
          <div className="phieu-action-group">
            <button
              className="phieu-action-btn phieu-action-btn--view"
              title="Xem chi tiết"
              onClick={() =>
                navigate(`/kho/nhap-hang/chi-tiet/${record.stt_rec}`, {
                  state: { sctRec: record.stt_rec },
                })
              }
            >
              <FileTextOutlined />
            </button>
            <button
              className="phieu-action-btn phieu-action-btn--edit"
              title="Chỉnh sửa"
              onClick={() =>
                navigate(`/kho/nhap-hang/chi-tiet/edit/${record.stt_rec}`, {
                  state: { sctRec: record.stt_rec },
                })
              }
            >
              <EditOutlined />
            </button>
            <button
              className="phieu-action-btn phieu-action-btn--delete"
              title="Xóa"
              onClick={() => handleDelete(record.stt_rec)}
            >
              <DeleteOutlined />
            </button>
          </div>
        ),
      },
    ];

    return baseColumns;
  };

  return (
    <CommonPhieuList
      title="DANH SÁCH PHIẾU NHẬP HÀNG THEO ĐƠN"
      columns={getColumns()}
      data={allData}
      onBack={() => navigate("/kho")}
      extraHeader={chipsBar}
      extraButtons={
        <button
          className="navbar_fullscreen_btn"
          onClick={handleRefresh}
          title="Làm tươi"
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
      tableProps={{
        toolbar: (
          <Button
            type="primary"
            onClick={() => navigate("them-moi")}
            style={{ 
              borderRadius: "8px", 
              boxShadow: "0 4px 12px rgba(79, 70, 229, 0.3)",
              height: "38px",
              background: "#4f46e5",
              borderColor: "#4338ca",
              fontWeight: 600,
              padding: "0 20px"
            }}
          >
            <span style={{ color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <PlusOutlined style={{ color: '#ffffff' }} />
              Thêm mới
            </span>
          </Button>
        ),
        summary: (pageData) => {
          let totalTien = 0;
          pageData.forEach(({ t_tt_nt }) => {
            totalTien += parseFloat(t_tt_nt || 0);
          });

          return (
            <Table.Summary fixed>
              <Table.Summary.Row className="table-summary-row">
                <Table.Summary.Cell index={0} colSpan={5} className="text-right">
                  <span style={{ fontWeight: "bold", fontSize: "15px" }}>
                    Tổng cộng:
                  </span>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={1} align="right">
                  <span
                    style={{
                      fontWeight: "bold",
                      color: "#1890ff",
                      fontSize: "15px",
                    }}
                  >
                    {new Intl.NumberFormat("vi-VN").format(totalTien)}
                  </span>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={2} colSpan={3} />
              </Table.Summary.Row>
            </Table.Summary>
          );
        },
      }}
    />
  );
};

export default ListPhieuNhapHang;

