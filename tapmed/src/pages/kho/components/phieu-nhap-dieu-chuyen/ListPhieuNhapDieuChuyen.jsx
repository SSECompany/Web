import {
  DeleteOutlined,
  EditOutlined,
  FileTextOutlined,
  FilterOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { Button, Checkbox, DatePicker, Input, message, Tag, Typography, Select, Table } from "antd";
import dayjs from "dayjs";
import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import showConfirm from "../../../../components/common/Modal/ModalConfirm";
import https from "../../../../utils/https";
import "../common-phieu.css";
import ListTemplate from "../../../../components/common/PageTemplates/ListTemplate";
import {
  fetchPhieuNhapDieuChuyenList,
  deletePhieuNhapDieuChuyen,
} from "./utils/phieuNhapDieuChuyenApi";


const { RangePicker } = DatePicker;

const { Title } = Typography;

const ListPhieuNhapDieuChuyen = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("access_token");
  const [allData, setAllData] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [screenSize, setScreenSize] = useState("desktop");
  const [filters, setFilters] = useState({
    so_ct: "",
    ma_khox: "",
    ma_kho: "",
    status: [],
  });


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

  const fetchPhieuNhapDieuChuyen = useCallback(async (filterParams = filters) => {
    const params = {
      so_ct: filterParams.so_ct || "",
      ma_kho: filterParams.ma_kho || "",    // Mã kho nhận trong procedure
      ma_khox: filterParams.ma_khox || "",  // Mã kho xuất trong procedure
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
      Status: filterParams.status && filterParams.status.length > 0 ? filterParams.status.join(",") : "",
    };


    const result = await fetchPhieuNhapDieuChuyenList(params);

    if (result.success) {
      setAllData(result.data);
      setTotalRecords(result.pagination.totalRecord || result.data.length);
    } else {
      console.error(
        "Lỗi gọi API danh sách phiếu nhập điều chuyển:",
        result.error
      );
    }
  }, [currentPage, filters, pageSize]);

  useEffect(() => {
    fetchPhieuNhapDieuChuyen();
  }, [fetchPhieuNhapDieuChuyen]);

  const handleRefresh = () => {
    fetchPhieuNhapDieuChuyen(filters);
  };

  const removeFilter = (key) => {
    const newFilters = { ...filters };
    if (key === "dateRange") {
      newFilters.dateRange = null;
    } else {
      newFilters[key] = "";
    }
    setFilters(newFilters);
    fetchPhieuNhapDieuChuyen(newFilters);
  };

  const clearAllFilters = () => {
    const cleared = {
      so_ct: "",
      ma_khox: "",
      ma_kho: "",
      dateRange: null,
      status: [],

    };
    setFilters(cleared);
    fetchPhieuNhapDieuChuyen(cleared);
  };

  const activeChips = useMemo(() => {
    const chips = [];
    if (filters.so_ct)
      chips.push({ key: "so_ct", label: "Số chứng từ", value: filters.so_ct });
    if (filters.ma_khox)
      chips.push({ key: "ma_khox", label: "Mã kho xuất", value: filters.ma_khox });
    if (filters.ma_kho)
      chips.push({ key: "ma_kho", label: "Mã kho nhận", value: filters.ma_kho });

    if (filters.dateRange && filters.dateRange.length === 2) {
      const display = `${filters.dateRange[0].format(
        "DD/MM/YYYY"
      )} - ${filters.dateRange[1].format("DD/MM/YYYY")}`;
      chips.push({ key: "dateRange", label: "Ngày", value: display });
    }
    if (filters.status && filters.status.length > 0) {
      const statusLabels = {
        "0": "Lập chứng từ",
        "1": "Điều chuyển",
        "2": "Chuyển KTTH",
        "3": "Chuyển sổ cái",
        "9": "Tài chính",
      };
      const display = filters.status.map(s => statusLabels[s] || s).join(", ");
      chips.push({ key: "status", label: "Trạng thái", value: display });
    }
    return chips;
  }, [filters]);

  // chipsBar removed, handled by ListTemplate

  const getStatusColor = (status) => {
    switch (String(status)) {
      case "0": return "orange";   // Lập chứng từ
      case "1": return "blue";     // Điều chuyển
      case "2": return "cyan";     // Chuyển KTTH
      case "3": return "green";    // Chuyển sổ cái
      case "9": return "gold";     // Tài chính
      default:  return "default";
    }
  };

  const handleDelete = async (sttRec) => {
    showConfirm({
      title: "Xác nhận xóa phiếu nhập điều chuyển",
      content: "Bạn có chắc chắn muốn xóa phiếu nhập điều chuyển này không?",
      type: "warning",
      onOk: async () => {
        try {
          if (!sttRec) {
            message.error("Không tìm thấy mã phiếu để xóa");
            return;
          }

          const result = await deletePhieuNhapDieuChuyen(sttRec);
          if (result.success) {
            await fetchPhieuNhapDieuChuyen();
          }
        } catch (error) {
          console.error("Lỗi khi xóa phiếu nhập điều chuyển:", error);
        }
      },
    });
  };


  const getColumns = () => {
    const columns = [
      {
        title: "Chứng từ",
        key: "chung_tu",
        width: 160,
        align: "center",
        render: (_, record) => (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
              <Typography.Text strong>{record.so_ct?.trim()}</Typography.Text>
            </div>
            <div style={{ fontSize: '11px', color: '#8c8c8c' }}>{dayjs(record.ngay_ct).format("DD/MM/YYYY")}</div>
            <div style={{ fontSize: '10px', color: '#6366f1' }}>Lập: {dayjs(record.datetime0).format("DD/MM/YYYY")}</div>
          </div>
        ),
        filterDropdown: ({ confirm }) => (
          <div style={{ padding: 12, width: 280 }}>
            <div style={{ marginBottom: 8, fontWeight: 600, fontSize: '12px', color: '#6366f1' }}>Số chứng từ:</div>
            <Input
              placeholder="Nhập số CT..."
              value={filters.so_ct}
              onChange={e => {
                const val = e.target.value;
                setFilters(prev => ({ ...prev, so_ct: val }));
              }}
              onPressEnter={() => {
                fetchPhieuNhapDieuChuyen(filters);
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
                  const cleared = { ...filters, so_ct: "", dateRange: null };
                  setFilters(cleared);
                  fetchPhieuNhapDieuChuyen(cleared);
                  confirm();
                }}
                style={{ flex: 1, borderRadius: '8px' }}
              >
                Xóa lọc
              </Button>
              <Button 
                type="primary" 
                onClick={() => {
                  fetchPhieuNhapDieuChuyen(filters);
                  confirm();
                }}
                style={{ flex: 1, borderRadius: '8px', background: '#6366f1' }}
              >
                Tìm kiếm
              </Button>
            </div>
          </div>
        ),
        filteredValue: (filters.so_ct || filters.dateRange) ? [1] : null,
      },
      {
        title: "Kho Nhập -> Xuất",
        key: "kho_transfer",
        width: 180,
        align: "center",
        render: (_, record) => (
          <div>
            <Tag color="blue">{record.ma_kho?.trim()}</Tag>
            <div style={{ fontSize: '12px', margin: '2px 0' }}>→</div>
            <Tag color="cyan">{record.ma_khox?.trim()}</Tag>
          </div>
        )
      },
      {
        title: "Thông tin",
        key: "thong_tin",
        width: 250,
        render: (_, record) => (
          <div>
            <div style={{ fontWeight: 600, color: '#1a1a1a' }}>GD: {record.ma_gd?.trim()}</div>
            <div style={{ fontSize: '12px', color: '#475569', lineHeight: '1.4' }}>Diễn giải : {record.dien_giai?.trim()}</div>
          </div>
        )
      },
      {
        title: "Tài chính",
        key: "tai_chinh",
        width: 140,
        align: "center",
        render: (_, record) => {
          const amount = record.t_tt !== null && record.t_tt !== undefined ? record.t_tt : (record.t_tien || 0);
          return (
            <div style={{ fontWeight: 700, color: '#52c41a', fontSize: '14px' }}>
              {Number(amount).toLocaleString("vi-VN")}
            </div>
          );
        }
      },
      {
        title: "Trạng thái",
        dataIndex: "statusname",
        key: "status",
        width: 150,
        align: "center",
        render: (statusname, record) => {
          if (record.status === "*" || record.status === null) return "";
          const displayText = (statusname ? statusname.replace(/^\d+\.\s*/, "") : "");
          return <Tag color={getStatusColor(record.status)} style={{ margin: 0 }}>{displayText}</Tag>;
        },
        filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) => (
          <div style={{ padding: 12, minWidth: 220 }}>
            <div style={{ marginBottom: 8, fontWeight: 600, fontSize: '12px', color: '#6366f1' }}>Trạng thái:</div>
            <Checkbox.Group
              style={{ display: "flex", flexDirection: "column", gap: "8px" }}
              value={selectedKeys}
              onChange={(value) => setSelectedKeys(value)}
              options={[
                { label: "Lập chứng từ", value: "0" },
                { label: "Điều chuyển",   value: "1" },
                { label: "Chuyển KTTH",   value: "2" },
                { label: "Chuyển sổ cái", value: "3" },
                { label: "Tài chính",     value: "9" },
              ]}
            />
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <Button 
                onClick={() => {
                  setSelectedKeys([]);
                  const newFilters = { ...filters, status: [] };
                  setFilters(newFilters);
                  fetchPhieuNhapDieuChuyen(newFilters);
                  confirm();
                }}
                style={{ flex: 1, borderRadius: '8px' }}
              >
                Xóa
              </Button>
              <Button 
                type="primary" 
                onClick={() => {
                  const newFilters = { ...filters, status: selectedKeys };
                  setFilters(newFilters);
                  fetchPhieuNhapDieuChuyen(newFilters);
                  confirm();
                }}
                style={{ flex: 1, borderRadius: '8px', background: '#6366f1' }}
              >
                Lọc
              </Button>
            </div>
          </div>
        ),
        filteredValue: filters.status && filters.status.length > 0 ? filters.status : null,
      },
      {
        title: "Nhân sự",
        key: "nhan_su",
        width: 180,
        render: (_, record) => (
          <div style={{ fontSize: '12px' }}>
            <div style={{ color: '#1a1a1a', fontWeight: 500 }}>{record.nguoi_tao?.trim()}</div>
            <div style={{ color: '#8c8c8c' }}>Giao: {record.ong_ba?.trim()}</div>
          </div>
        )
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
                navigate(`/kho/nhap-dieu-chuyen/chi-tiet/${record.stt_rec}`, {
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
                navigate(`/kho/nhap-dieu-chuyen/edit/${record.stt_rec}`, {
                  state: { sctRec: record.stt_rec },
                })
              }
            >
              <EditOutlined />
            </button>
          </div>
        ),
      },
    ];

    return columns;
  };


  return (
    <ListTemplate
      title="PHIẾU NHẬP ĐIỀU CHUYỂN"
      columns={getColumns()}
      data={allData}
      onBack={() => navigate("/kho")}
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
      }}
      tableProps={{
        summary: (pageData) => {
          let totalTien = 0;
          pageData.forEach((record) => {
            const amount = record.t_tt !== null && record.t_tt !== undefined ? record.t_tt : (record.t_tien || 0);
            totalTien += parseFloat(amount || 0);
          });

          return (
            <Table.Summary fixed>
              <Table.Summary.Row className="table-summary-row">
                <Table.Summary.Cell index={0} colSpan={3} className="text-right">
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

export default ListPhieuNhapDieuChuyen;
