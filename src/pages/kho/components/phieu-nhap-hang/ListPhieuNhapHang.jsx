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
import ListTemplate from "../../../../components/common/PageTemplates/ListTemplate";
import {
  deletePhieuNhapHang,
  fetchPhieuNhapHangList,
} from "./utils/phieuNhapHangApi";
import { useAuth } from "../../../../hooks/useRedux";

const { RangePicker } = DatePicker;
const { Title } = Typography;

const ListPhieuNhapHang = () => {
  const navigate = useNavigate();
  const { userInfo } = useAuth();
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
    if (filters.ten_kh)
      chips.push({ key: "ten_kh", label: "Khách hàng", value: filters.ten_kh });
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

  // Filter chips are handled by ListTemplate

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

          const result = await deletePhieuNhapHang(sctRec, userInfo);

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
        title: "Chứng từ",
        key: "don_hang",
        width: 160,
        align: "center",
        render: (_, record) => (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
              <Typography.Text strong>{record.so_ct}</Typography.Text>
            </div>
            <div style={{ fontSize: '11px', color: '#8c8c8c' }}>{dayjs(record.ngay_ct).format("DD/MM/YYYY")}</div>
            {record.so_po && record.so_po.trim() !== "" && (
              <div style={{ fontSize: '10px', color: '#6366f1', fontWeight: 600 }}>PO: {record.so_po.trim()}</div>
            )}
          </div>
        ),
        filterDropdown: ({ confirm }) => (
          <div style={{ padding: 12, width: 280 }}>
            <div style={{ marginBottom: 8, fontWeight: 600, fontSize: '12px', color: '#6366f1' }}>Số phiếu nhập:</div>
            <Input
              placeholder="Nhập số phiếu nhập..."
              value={filters.so_ct}
              onChange={e => {
                const val = e.target.value;
                setFilters(prev => ({ ...prev, so_ct: val }));
              }}
              onPressEnter={() => {
                fetchPhieuNhapHang(filters);
                confirm();
              }}
              style={{ marginBottom: 16, display: 'block' }}
            />

            <div style={{ marginBottom: 8, fontWeight: 600, fontSize: '12px', color: '#6366f1' }}>Số PO:</div>
            <Input
              placeholder="Nhập số PO..."
              value={filters.so_po}
              onChange={e => {
                const val = e.target.value;
                setFilters(prev => ({ ...prev, so_po: val }));
              }}
              onPressEnter={() => {
                fetchPhieuNhapHang(filters);
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
              format="DD/MM/YYYY"
              style={{ width: '100%', marginBottom: 16 }}
              placeholder={['Từ ngày', 'Đến ngày']}
            />

            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <Button 
                onClick={() => {
                  const cleared = { ...filters, so_ct: "", so_po: "", dateRange: null };
                  setFilters(cleared);
                  fetchPhieuNhapHang(cleared);
                  confirm();
                }}
                style={{ flex: 1, borderRadius: '8px', fontSize: '13px' }}
              >
                Xóa lọc
              </Button>
              <Button 
                type="primary" 
                onClick={() => {
                  fetchPhieuNhapHang(filters);
                  confirm();
                }}
                style={{ flex: 1, borderRadius: '8px', fontSize: '13px', fontWeight: 600, background: '#6366f1' }}
              >
                Tìm kiếm
              </Button>
            </div>
          </div>
        ),
        filteredValue: (filters.so_ct || filters.so_po || filters.dateRange) ? [1] : null,
      },
      {
        title: "Khách hàng",
        key: "khach_hang",
        width: 200,
        align: "left",
        render: (_, record) => (
          <div>
            <div style={{ fontWeight: 600, color: '#1a1a1a' }}>{record.ten_kh}</div>
            <div style={{ fontSize: '11px', color: '#8c8c8c' }}>{record.ma_kh}</div>
            {record.ten_kh2 && <div style={{ fontSize: '10px', color: '#475569', fontStyle: 'italic' }}>{record.ten_kh2}</div>}
            {record.dien_thoai && <div style={{ fontSize: '11px', color: '#6366f1', fontWeight: 500 }}>{record.dien_thoai}</div>}
          </div>
        ),
        filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) => (
          <div style={{ padding: 12, width: 250 }}>
            <div style={{ marginBottom: 8, fontWeight: 600, fontSize: '12px', color: '#6366f1' }}>Mã hoặc Tên khách:</div>
            <Input
              placeholder="Nhập mã hoặc tên khách..."
              value={selectedKeys[0]}
              onChange={e => setSelectedKeys(e.target.value ? [e.target.value] : [])}
              onPressEnter={() => {
                confirm();
                const newFilters = { ...filters, ten_kh: selectedKeys[0] || "" };
                setFilters(newFilters);
                fetchPhieuNhapHang(newFilters);
              }}
              style={{ marginBottom: 12, display: "block" }}
            />
            <Button
              type="primary"
              onClick={() => {
                confirm();
                const newFilters = { ...filters, ten_kh: selectedKeys[0] || "" };
                setFilters(newFilters);
                fetchPhieuNhapHang(newFilters);
              }}
              style={{ width: '100%', borderRadius: '8px', background: '#6366f1' }}
            >
              Tìm kiếm
            </Button>
          </div>
        ),
        filteredValue: filters.ten_kh ? [filters.ten_kh] : null,
      },
      {
        title: "Tổng tiền",
        dataIndex: "t_tt_nt",
        key: "t_tt_nt",
        width: 140,
        align: "center",
        render: (val) => <Typography.Text strong style={{ color: '#52c41a', fontSize: '15px' }}>{new Intl.NumberFormat("vi-VN").format(val || 0)}</Typography.Text>,
      },
      {
        title: "Trạng thái",
        dataIndex: "statusname",
        key: "status",
        width: 150,
        align: "center",
        filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) => (
          <div style={{ padding: 12, minWidth: 200 }}>
            <div style={{ marginBottom: 8, fontWeight: 600, fontSize: '12px', color: '#6366f1' }}>Trạng thái:</div>
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
                style={{ flex: 1, borderRadius: '8px' }}
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
                style={{ flex: 1, borderRadius: '8px', background: '#6366f1' }}
              >
                Tìm kiếm
              </Button>
            </div>
          </div>
        ),
        filteredValue: filters.status ? filters.status.split(",") : null,
        render: (statusname, record) => {
          const statusCode = String(record.status).trim();
          if (statusCode === "*" || statusCode === "null") return "";
          
          const displayStatus = statusname ? statusname.replace(/^\d+\.\s*/, '') : "";
            
          return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
              <Tag color={getStatusColor(statusCode)} style={{ margin: 0, textAlign: 'center', fontSize: '11px' }}>
                {displayStatus}
              </Tag>
            </div>
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
              className="phieu-action-btn phieu-action-btn--delete"
              title="Xóa phiếu"
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
    <ListTemplate
      title="PHIẾU NHẬP HÀNG THEO ĐƠN"
      columns={getColumns()}
      data={allData}
      onBack={() => navigate("/kho")}
      onAdd={() => navigate("them-moi")}
      onRefresh={handleRefresh}
      activeChips={activeChips}
      onRemoveFilter={removeFilter}
      onClearAllFilters={clearAllFilters}
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
        summary: (pageData) => {
          let totalTien = 0;
          pageData.forEach(({ t_tt_nt }) => {
            totalTien += parseFloat(t_tt_nt || 0);
          });

          return (
            <Table.Summary fixed>
              <Table.Summary.Row className="table-summary-row">
                <Table.Summary.Cell index={0} colSpan={2} className="text-right">
                  <span style={{ fontWeight: "bold", fontSize: "15px" }}>
                    Tổng cộng:
                  </span>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={1} align="center">
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

