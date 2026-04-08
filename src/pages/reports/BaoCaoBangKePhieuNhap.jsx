import {
  Button,
  Card,
  DatePicker,
  Input,
  Select,
  Space,
  Table,
  Typography,
} from "antd";
import { SearchOutlined } from "@ant-design/icons";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import dayjs from "dayjs";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { multipleTablePutApi } from "../../api";
import { formatNumber } from "../../pharmacy-utils/hook/dataFormatHelper";
import FilterChips from "../../components/common/PageTemplates/ListTemplate/FilterChips";
import "../../components/common/PageTemplates/ListTemplate/ListTemplate.css";
import "./BaoCaoTonKho.css";

const { Title } = Typography;
const { RangePicker } = DatePicker;

const CELL_STYLE = { textAlign: "center" };
const BOLD_CELL_STYLE = { fontWeight: "bold", textAlign: "center" };

const formatDateToAPI = (date) => {
  if (!date) return "";
  return dayjs(date).format("YYYYMMDD");
};

const getDefaultFilters = () => ({
  DateFrom: dayjs().startOf("month").format("YYYY-MM-DD"),
  DateTo: dayjs().endOf("month").format("YYYY-MM-DD"),
  Item: "",
  Customer: "",
  Site: "",
  Site_n: "",
  Job: "",
  Reason: "",
  ItemAccount: "",
  ItemType: "",
  ItemGroup1: "",
  ItemGroup2: "",
  ItemGroup3: "",
  TransactionCode: "",
  VoucherCode: "",
  InvoiceFrom: "",
  InvoiceTo: "",
  Contact: "",
  Department: "",
  MONumber: "",
  Product: "",
  Unit: [],
  Size: 12,
  Size_lsx: 16,
  Form: "1", // 1: Nhập, 2: Xuất
  Order: "a.ma_kh",
  DataType: 2,
  Language: "V",
  Admin: 1,
  TransactionList: "",
});

const BaoCaoBangKePhieuNhap = () => {
  const { id: userId, unitId, MA_DVCS, DVCS } = useSelector(
    (state) => state.claimsReducer.userInfo || {}
  );

  const defaultUnitCode = useMemo(() => (unitId || MA_DVCS || "").trim(), [unitId, MA_DVCS]);
  const defaultUnitName = useMemo(() => (DVCS || defaultUnitCode || "").trim(), [DVCS, defaultUnitCode]);

  const [dataSource, setDataSource] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalRecords, setTotalRecords] = useState(0);

  // Options
  const [khoOptions, setKhoOptions] = useState([]);
  const [dvcsOptions, setDvcsOptions] = useState(() => 
    defaultUnitCode ? [{ value: defaultUnitCode, label: defaultUnitName }] : []
  );
  const [khachHangOptions, setKhachHangOptions] = useState([]);
  const [vatTuOptions, setVatTuOptions] = useState([]);
  const [nhomVatTuOptions, setNhomVatTuOptions] = useState({ 1: [], 2: [], 3: [] });

  // Loading states
  const [loadingKho, setLoadingKho] = useState(false);
  const [loadingDvcs, setLoadingDvcs] = useState(false);
  const [loadingKhachHang, setLoadingKhachHang] = useState(false);
  const [loadingVatTu, setLoadingVatTu] = useState(false);
  const [loadingNhomVatTu, setLoadingNhomVatTu] = useState(false);

  // Search refs
  const khoSearchRef = useRef(null);
  const dvcsSearchRef = useRef(null);
  const khachHangSearchRef = useRef(null);
  const vatTuSearchRef = useRef(null);
  const nhomVatTuSearchRef = useRef({ 1: null, 2: null, 3: null });

  // Filters
  const [filters, setFilters] = useState(getDefaultFilters);
  const [tableFilters, setTableFilters] = useState({
    so_ct: "",
    ma_vt: "",
    ten_kh: "",
    ma_kh: "",
    ngay_ct: "",
  });

  // Auto-fill Unit
  useEffect(() => {
    if (defaultUnitCode) {
      setFilters((prev) => ({
        ...prev,
        Unit: prev.Unit && prev.Unit.length > 0 ? prev.Unit : [defaultUnitCode],
      }));
    }
  }, [defaultUnitCode]);

  const fetchKhoOptions = useCallback(async (searchValue = "") => {
    if (!unitId) return;
    setLoadingKho(true);
    try {
      const res = await multipleTablePutApi({
        store: "api_getKho",
        param: { unitId, userId, searchValue: searchValue || "", pageIndex: 1, pageSize: 100 },
        data: {},
      });
      const data = res?.listObject?.[0] || [];
      const options = data.map((item) => ({
        value: (item.ma_kho || item.value || "").trim(),
        label: (item.ten_kho || item.label || item.ma_kho || "").trim(),
      })).filter(opt => opt.value);
      setKhoOptions(options);
    } catch (err) {
      console.error("❌ Error fetching kho:", err);
    } finally {
      setLoadingKho(false);
    }
  }, [unitId, userId]);

  const fetchDvcsOptions = useCallback(async (searchValue = "") => {
    setLoadingDvcs(true);
    try {
      const res = await multipleTablePutApi({
        store: "api_getDvcs",
        param: { searchValue: searchValue || "", pageIndex: 1, pageSize: 100 },
        data: {},
      });
      const data = res?.listObject?.[0] || [];
      const options = data.map((item) => ({
        value: (item.ma_dvcs || item.value || "").trim(),
        label: (item.ten_dvcs || item.label || item.ma_dvcs || "").trim(),
      })).filter(opt => opt.value);
      setDvcsOptions(options);
    } catch (err) {
      console.error("❌ Error fetching dvcs:", err);
    } finally {
      setLoadingDvcs(false);
    }
  }, []);

  const fetchKhachHangOptions = useCallback(async (searchValue = "") => {
    setLoadingKhachHang(true);
    try {
      const res = await multipleTablePutApi({
        store: "api_getKhachHang",
        param: { searchValue: searchValue || "", pageIndex: 1, pageSize: 100 },
        data: {},
      });
      const data = res?.listObject?.[0] || [];
      const options = data.map((item) => ({
        value: (item.ma_kh || item.ma_khach_hang || item.value || "").trim(),
        label: (item.ten_kh || item.ten_khach_hang || item.label || item.ma_kh || "").trim(),
      })).filter(opt => opt.value);
      setKhachHangOptions(options);
    } catch (err) {
      console.error("❌ Error fetching khach hang:", err);
    } finally {
      setLoadingKhachHang(false);
    }
  }, []);

  const fetchVatTuOptions = useCallback(async (searchValue = "") => {
    setLoadingVatTu(true);
    try {
      const res = await multipleTablePutApi({
        store: "api_getVatTu",
        param: { searchValue: searchValue || "", pageIndex: 1, pageSize: 100 },
        data: {},
      });
      const data = res?.listObject?.[0] || [];
      const options = data.map((item) => ({
        value: (item.ma_vt || item.ma_vat_tu || item.value || "").trim(),
        label: (item.ten_vt || item.ten_vat_tu || item.label || item.ma_vt || "").trim(),
      })).filter(opt => opt.value);
      setVatTuOptions(options);
    } catch (err) {
      console.error("❌ Error fetching vat tu:", err);
    } finally {
      setLoadingVatTu(false);
    }
  }, []);

  const fetchNhomVatTuOptions = useCallback(async (loaiNhom, searchValue = "") => {
    setLoadingNhomVatTu(true);
    try {
      const res = await multipleTablePutApi({
        store: "api_getNhomVatTu",
        param: { loaiNhom, searchValue: searchValue || "", pageIndex: 1, pageSize: 100 },
        data: {},
      });
      const data = res?.listObject?.[0] || [];
      const options = data.map((item) => ({
        value: (item.ma_nh || item.ma_nhom || item.value || "").trim(),
        label: (item.ten_nh || item.ten_nhom || item.label || "").trim(),
      })).filter(opt => opt.value);
      setNhomVatTuOptions(prev => ({ ...prev, [loaiNhom]: options }));
    } catch (err) {
      console.error(`❌ Error fetching nhom vat tu ${loaiNhom}:`, err);
    } finally {
      setLoadingNhomVatTu(false);
    }
  }, []);

  useEffect(() => {
    if (unitId) {
      fetchKhoOptions();
      fetchDvcsOptions();
      fetchKhachHangOptions();
      fetchVatTuOptions();
      fetchNhomVatTuOptions(1);
      fetchNhomVatTuOptions(2);
      fetchNhomVatTuOptions(3);
    }
  }, [unitId, fetchKhoOptions, fetchDvcsOptions, fetchKhachHangOptions, fetchVatTuOptions, fetchNhomVatTuOptions]);

  const fetchData = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await multipleTablePutApi({
        store: "api_bao_cao_bang_ke_phieu_nhap",
        param: {
          DateFrom: formatDateToAPI(filters.DateFrom),
          DateTo: formatDateToAPI(filters.DateTo),
          Item: filters.Item || "",
          Customer: filters.Customer || "",
          Site: filters.Site || "",
          Site_n: filters.Site_n || "",
          Job: filters.Job || "",
          Reason: filters.Reason || "",
          ItemAccount: filters.ItemAccount || "",
          ItemType: filters.ItemType || "",
          ItemGroup1: filters.ItemGroup1 || "",
          ItemGroup2: filters.ItemGroup2 || "",
          ItemGroup3: filters.ItemGroup3 || "",
          TransactionCode: filters.TransactionCode || "",
          VoucherCode: filters.VoucherCode || "",
          InvoiceFrom: filters.InvoiceFrom || "",
          InvoiceTo: filters.InvoiceTo || "",
          Contact: filters.Contact || "",
          Department: filters.Department || "",
          MONumber: filters.MONumber || "",
          Product: filters.Product || "",
          Unit: Array.isArray(filters.Unit) ? filters.Unit.join(",") : filters.Unit,
          Size: filters.Size,
          Size_lsx: filters.Size_lsx,
          Form: filters.Form,
          Order: filters.Order,
          DataType: filters.DataType,
          Language: filters.Language,
          UserID: userId,
          Admin: filters.Admin,
          TransactionList: filters.TransactionList || "",
          pageIndex: currentPage,
          pageSize: pageSize,
        },
        data: {},
      });

      const fetchedData = res?.listObject?.[0] || [];
      const paginationInfo = res?.listObject?.[1]?.[0] || {};
      setTotalRecords(paginationInfo.totalRecord || paginationInfo.total_rows || fetchedData.length);

      const formattedData = fetchedData
        .filter((item) => item.systotal !== 0)
        .map((item, index) => ({
          ...item,
          key: `row-${(currentPage - 1) * pageSize + index}`,
          stt: (currentPage - 1) * pageSize + index + 1,
          ngay_ct: item.ngay_ct ? dayjs(item.ngay_ct).format("DD/MM/YYYY") : "",
          isSummary: false,
        }));
      setDataSource(formattedData);
    } catch (err) {
      console.error("❌ Lỗi khi lấy dữ liệu bảng kê phiếu nhập:", err);
      setDataSource([]);
    } finally {
      setLoading(false);
    }
  }, [filters, userId, currentPage, pageSize]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleExportExcel = useCallback(async () => {
    if (!userId) return;
    setExportLoading(true);
    try {
      let allData = [];
      let pageIdx = 1;
      let totalPages = 1;

      while (pageIdx <= totalPages) {
        const res = await multipleTablePutApi({
          store: "api_bao_cao_bang_ke_phieu_nhap",
          param: {
            ...filters,
            DateFrom: formatDateToAPI(filters.DateFrom),
            DateTo: formatDateToAPI(filters.DateTo),
            Unit: Array.isArray(filters.Unit) ? filters.Unit.join(",") : filters.Unit,
            UserID: userId,
            pageIndex: pageIdx,
            pageSize: 1000,
          },
          data: {},
        });
        const pageData = res?.listObject?.[0] || [];
        allData = [...allData, ...pageData];
        totalPages = res?.listObject?.[1]?.[0]?.totalPage || 1;
        pageIdx++;
      }
      
      allData = allData.filter((item) => item.systotal !== 0);

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Bảng kê phiếu nhập");
      
      const columnsConfig = [
        { header: "STT", key: "stt", width: 8 },
        { header: "Ngày ct", key: "ngay_ct", width: 12 },
        { header: "Mã ct", key: "ma_ct", width: 10 },
        { header: "Số ct", key: "so_ct", width: 15 },
        { header: "Mã khách", key: "ma_kh", width: 15 },
        { header: "Tên khách", key: "ten_kh", width: 35 },
        { header: "Diễn giải", key: "dien_giai", width: 40 },
        { header: "Mã vật tư", key: "ma_vt", width: 15 },
        { header: "Tên vật tư", key: "ten_vt", width: 40 },
        { header: "Đvt", key: "dvt", width: 10 },
        { header: "Số lượng", key: "so_luong", width: 12 },
        { header: "Giá", key: "gia", width: 15 },
        { header: "Tiền", key: "tien", width: 18 },
        { header: "Kho hàng", key: "ma_kho", width: 12 },
      ];

      worksheet.columns = columnsConfig;
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
      headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF217346" } };
      headerRow.alignment = { vertical: "middle", horizontal: "center" };

      allData.forEach((item, idx) => {
        const rowData = {
          ...item,
          stt: idx + 1,
          ngay_ct: item.ngay_ct ? dayjs(item.ngay_ct).format("DD/MM/YYYY") : "",
        };
        const row = worksheet.addRow(rowData);
        row.eachCell((cell, colNumber) => {
          cell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
          const colKey = columnsConfig[colNumber - 1].key;
          if (["so_luong", "gia", "tien"].includes(colKey)) {
            cell.numFmt = "#,##0";
            cell.alignment = { horizontal: "right" };
          }
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(new Blob([buffer]), `BangKePhieuNhap_${dayjs().format("YYYYMMDD_HHmmss")}.xlsx`);
    } catch (err) {
      console.error("❌ Lỗi khi xuất Excel:", err);
    } finally {
      setExportLoading(false);
    }
  }, [filters, userId]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setFilters({ ...getDefaultFilters(), Unit: defaultUnitCode ? [defaultUnitCode] : [] });
    setTableFilters({ so_ct: "", ma_vt: "", ten_kh: "", ma_kh: "", ngay_ct: "" });
    setCurrentPage(1);
  };

  const handleRemoveFilter = (filterKey) => {
    if (filterKey === "Unit") {
      handleFilterChange("Unit", []);
    } else if (filterKey === "DateRange") {
      handleFilterChange("DateFrom", "");
      handleFilterChange("DateTo", "");
    } else if (["so_ct", "ma_kh", "ten_kh", "ma_vt"].includes(filterKey)) {
      setTableFilters(prev => ({ ...prev, [filterKey]: "" }));
    } else {
      handleFilterChange(filterKey, "");
    }
  };

  const activeChips = useMemo(() => {
    const chips = [];
    if (filters.DateFrom && filters.DateTo) {
      chips.push({
        key: "DateRange",
        label: "Thời gian",
        value: `${dayjs(filters.DateFrom).format("DD/MM/YYYY")} - ${dayjs(filters.DateTo).format("DD/MM/YYYY")}`,
        color: "blue"
      });
    }

    if (filters.Unit && filters.Unit.length > 0) {
      const selectedDvcs = dvcsOptions
        .filter((opt) => filters.Unit.includes(opt.value))
        .map((opt) => opt.label)
        .join(", ");
      if (selectedDvcs) chips.push({ key: "Unit", label: "Đơn vị", value: selectedDvcs, color: "volcano" });
    }
    if (filters.Site) {
      const label = khoOptions.find(o => o.value === filters.Site)?.label || filters.Site;
      chips.push({ key: "Site", label: "Kho", value: label, color: "cyan" });
    }
    if (filters.Customer) {
      const label = khachHangOptions.find(o => o.value === filters.Customer)?.label || filters.Customer;
      chips.push({ key: "Customer", label: "Khách hàng", value: label, color: "purple" });
    }
    if (filters.Item) {
      const label = vatTuOptions.find(o => o.value === filters.Item)?.label || filters.Item;
      chips.push({ key: "Item", label: "Vật tư", value: label, color: "green" });
    }

    // Column Filters
    if (tableFilters.so_ct) {
      chips.push({ key: "so_ct", label: "Số ct", value: tableFilters.so_ct, color: "gold" });
    }
    if (tableFilters.ma_kh) {
      chips.push({ key: "ma_kh", label: "Mã khách", value: tableFilters.ma_kh, color: "gold" });
    }
    if (tableFilters.ten_kh) {
      chips.push({ key: "ten_kh", label: "Tên khách", value: tableFilters.ten_kh, color: "gold" });
    }
    if (tableFilters.ma_vt) {
      chips.push({ key: "ma_vt", label: "Mã vật tư", value: tableFilters.ma_vt, color: "gold" });
    }

    return chips;
  }, [filters, dvcsOptions, khoOptions, khachHangOptions, vatTuOptions, tableFilters]);

  const columns = useMemo(() => [
    { title: "STT", dataIndex: "stt", key: "stt", width: 60, align: "center", fixed: "left" },
    { 
      title: "Ngày CT", 
      dataIndex: "ngay_ct", 
      key: "ngay_ct", 
      width: 110, 
      align: "center", 
      fixed: "left",
      filterDropdown: ({ confirm }) => (
        <div style={{ padding: 8, display: "flex", flexDirection: "column", gap: "8px" }}>
          <RangePicker
            value={filters.DateFrom && filters.DateTo ? [dayjs(filters.DateFrom), dayjs(filters.DateTo)] : null}
            onChange={(dates) => {
              if (dates) {
                setFilters(prev => ({ 
                  ...prev, 
                  DateFrom: dates[0].format("YYYY-MM-DD"), 
                  DateTo: dates[1].format("YYYY-MM-DD") 
                }));
              } else {
                setFilters(prev => ({ ...prev, DateFrom: "", DateTo: "" }));
              }
            }}
            format="DD/MM/YYYY"
          />
          <Button 
            type="primary" 
            size="small" 
            onClick={() => { confirm(); fetchData(); }}
          >
            Tìm kiếm
          </Button>
        </div>
      ),
      filteredValue: filters.DateFrom ? [filters.DateFrom, filters.DateTo] : null,
    },
    { title: "Mã CT", dataIndex: "ma_ct", key: "ma_ct", width: 80, align: "center" },
    { 
      title: "Số CT", 
      dataIndex: "so_ct", 
      key: "so_ct", 
      width: 140, 
      align: "center",
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder="Tìm số ct"
            value={selectedKeys[0]}
            onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
            onPressEnter={() => { confirm(); setTableFilters(prev => ({ ...prev, so_ct: selectedKeys[0] || "" })); }}
            style={{ marginBottom: 8, display: "block" }}
          />
          <Button type="primary" size="small" onClick={() => { confirm(); setTableFilters(prev => ({ ...prev, so_ct: selectedKeys[0] || "" })); }}>Tìm</Button>
        </div>
      ),
      filteredValue: tableFilters.so_ct ? [tableFilters.so_ct] : null,
      onFilter: (value, record) => record.so_ct?.toLowerCase().includes(value.toLowerCase()),
    },
    { 
      title: "Mã khách", 
      dataIndex: "ma_kh", 
      key: "ma_kh", 
      width: 130, 
      align: "center",
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder="Tìm mã khách"
            value={selectedKeys[0]}
            onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
            onPressEnter={() => { confirm(); setTableFilters(prev => ({ ...prev, ma_kh: selectedKeys[0] || "" })); }}
            style={{ marginBottom: 8, display: "block" }}
          />
          <Button type="primary" size="small" onClick={() => { confirm(); setTableFilters(prev => ({ ...prev, ma_kh: selectedKeys[0] || "" })); }}>Tìm</Button>
        </div>
      ),
      filteredValue: tableFilters.ma_kh ? [tableFilters.ma_kh] : null,
      onFilter: (value, record) => record.ma_kh?.toLowerCase().includes(value.toLowerCase()),
    },
    { 
      title: "Tên khách", 
      dataIndex: "ten_kh", 
      key: "ten_kh", 
      width: 300, 
      align: "left", 
      ellipsis: true,
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder="Tìm tên khách"
            value={selectedKeys[0]}
            onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
            onPressEnter={() => { confirm(); setTableFilters(prev => ({ ...prev, ten_kh: selectedKeys[0] || "" })); }}
            style={{ marginBottom: 8, display: "block" }}
          />
          <Button type="primary" size="small" onClick={() => { confirm(); setTableFilters(prev => ({ ...prev, ten_kh: selectedKeys[0] || "" })); }}>Tìm</Button>
        </div>
      ),
      filteredValue: tableFilters.ten_kh ? [tableFilters.ten_kh] : null,
      onFilter: (value, record) => record.ten_kh?.toLowerCase().includes(value.toLowerCase()),
    },
    { title: "Diễn giải", dataIndex: "dien_giai", key: "dien_giai", width: 250, align: "left", ellipsis: true },
    { 
      title: "Mã vật tư", 
      dataIndex: "ma_vt", 
      key: "ma_vt", 
      width: 120, 
      align: "center",
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder="Tìm mã vật tư"
            value={selectedKeys[0]}
            onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
            onPressEnter={() => { confirm(); setTableFilters(prev => ({ ...prev, ma_vt: selectedKeys[0] || "" })); }}
            style={{ marginBottom: 8, display: "block" }}
          />
          <Button type="primary" size="small" onClick={() => { confirm(); setTableFilters(prev => ({ ...prev, ma_vt: selectedKeys[0] || "" })); }}>Tìm</Button>
        </div>
      ),
      filteredValue: tableFilters.ma_vt ? [tableFilters.ma_vt] : null,
      onFilter: (value, record) => record.ma_vt?.toLowerCase().includes(value.toLowerCase()),
    },
    { 
      title: "Tên vật tư", 
      dataIndex: "ten_vt", 
      key: "ten_vt", 
      width: 350, 
      align: "left", 
      ellipsis: true,
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder="Tìm tên vật tư"
            value={selectedKeys[0]}
            onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
            onPressEnter={() => { confirm(); setTableFilters(prev => ({ ...prev, ten_vt: selectedKeys[0] || "" })); }}
            style={{ marginBottom: 8, display: "block" }}
          />
          <Button type="primary" size="small" onClick={() => { confirm(); setTableFilters(prev => ({ ...prev, ten_vt: selectedKeys[0] || "" })); }}>Tìm</Button>
        </div>
      ),
      filteredValue: tableFilters.ten_vt ? [tableFilters.ten_vt] : null,
      onFilter: (value, record) => record.ten_vt?.toLowerCase().includes(value.toLowerCase()),
    },
    { title: "ĐVT", dataIndex: "dvt", key: "dvt", width: 80, align: "center" },
    { title: "Số lượng", dataIndex: "so_luong", key: "so_luong", width: 100, align: "right", render: (val) => formatNumber(val) },
    { title: "Giá", dataIndex: "gia", key: "gia", width: 130, align: "right", render: (val) => formatNumber(val) },
    { title: "Tiền", dataIndex: "tien", key: "tien", width: 150, align: "right", render: (val) => formatNumber(val) },
    { title: "Kho hàng", dataIndex: "ma_kho", key: "ma_kho", width: 100, align: "center" },
  ], [tableFilters, filters.DateFrom, filters.DateTo, fetchData]);

  // Totals calculations
  const totals = useMemo(() => {
    return dataSource.reduce((acc, item) => {
      if (!item.isSummary) {
        acc.so_luong += Number(item.so_luong) || 0;
        acc.tien += Number(item.tien) || 0;
      }
      return acc;
    }, { so_luong: 0, tien: 0 });
  }, [dataSource]);

  return (
    <div className="bao-cao-ton-kho-container">
      <div className="bao-cao-header">
        <div className="flex justify-between items-center mb-4">
          <Title level={4} style={{ margin: 0 }}>BẢNG KÊ PHIẾU NHẬP</Title>
        </div>

        <div className="bao-cao-filters">
          <div className="filters-grid">


            <div className="filter-item">
              <label>Đơn vị cơ sở:</label>
              <Select
                mode="multiple"
                placeholder="Chọn đơn vị"
                value={filters.Unit}
                onChange={(val) => handleFilterChange("Unit", val)}
                onSearch={(val) => {
                  if (dvcsSearchRef.current) clearTimeout(dvcsSearchRef.current);
                  dvcsSearchRef.current = setTimeout(() => fetchDvcsOptions(val), 300);
                }}
                onOpenChange={(open) => open && fetchDvcsOptions()}
                options={dvcsOptions}
                maxTagCount="responsive"
                loading={loadingDvcs}
              />
            </div>

            <div className="filter-item">
              <label>Kho:</label>
              <Select
                placeholder="Chọn kho"
                allowClear
                value={filters.Site}
                onChange={(val) => handleFilterChange("Site", val || "")}
                onSearch={(val) => {
                  if (khoSearchRef.current) clearTimeout(khoSearchRef.current);
                  khoSearchRef.current = setTimeout(() => fetchKhoOptions(val), 300);
                }}
                onOpenChange={(open) => open && fetchKhoOptions()}
                options={khoOptions}
                loading={loadingKho}
              />
            </div>

            <div className="filter-item">
              <label>Khách hàng:</label>
              <Select
                showSearch
                placeholder="Chọn khách hàng"
                allowClear
                value={filters.Customer}
                onChange={(val) => handleFilterChange("Customer", val || "")}
                onSearch={(val) => {
                  if (khachHangSearchRef.current) clearTimeout(khachHangSearchRef.current);
                  khachHangSearchRef.current = setTimeout(() => fetchKhachHangOptions(val), 300);
                }}
                onOpenChange={(open) => open && fetchKhachHangOptions()}
                options={khachHangOptions}
                loading={loadingKhachHang}
              />
            </div>

            <div className="filter-item">
              <label>Vật tư:</label>
              <Select
                showSearch
                placeholder="Chọn vật tư"
                allowClear
                value={filters.Item}
                onChange={(val) => handleFilterChange("Item", val || "")}
                onSearch={(val) => {
                  if (vatTuSearchRef.current) clearTimeout(vatTuSearchRef.current);
                  vatTuSearchRef.current = setTimeout(() => fetchVatTuOptions(val), 300);
                }}
                onOpenChange={(open) => open && fetchVatTuOptions()}
                options={vatTuOptions}
                loading={loadingVatTu}
              />
            </div>
            
            <div className="filter-item">
              <label>Loại phiếu:</label>
              <Select
                value={filters.Form}
                onChange={(val) => handleFilterChange("Form", val)}
                options={[
                  { value: "1", label: "Nhập" },
                  { value: "2", label: "Xuất" },
                ]}
              />
            </div>

            <div className="button-item-row" style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "12px" }}>
              <Button
                type="primary"
                style={{ backgroundColor: "#217346", borderColor: "#217346", minWidth: "120px" }}
                onClick={handleExportExcel}
                loading={exportLoading}
                disabled={dataSource.length === 0}
              >
                Xuất Excel
              </Button>
            </div>
          </div>
        </div>

        <FilterChips
          activeChips={activeChips}
          onRemoveFilter={handleRemoveFilter}
          onClearAllFilters={handleClearFilters}
        />
      </div>

      <Card className="report-modal_Container" style={{ marginTop: "16px" }} bodyStyle={{ padding: 0 }}>
        <Table
          className="report-modal-table"
          columns={columns}
          dataSource={dataSource}
          loading={loading}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: totalRecords || dataSource.length,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} bản ghi`,
            pageSizeOptions: ["25", "50", "100", "200", "500"],
            onChange: (page, size) => {
              setCurrentPage(page);
              if (size !== pageSize) {
                setPageSize(size);
                setCurrentPage(1);
              }
            },
          }}
          scroll={{ y: 500, x: "max-content" }}
          size="small"
          bordered
          rowKey="key"
          summary={() => (
            <Table.Summary.Row className="bg-blue-50">
              <Table.Summary.Cell index={0} colSpan={10} align="center"><strong>Tổng cộng</strong></Table.Summary.Cell>
              <Table.Summary.Cell index={1} align="right"><strong>{formatNumber(totals.so_luong)}</strong></Table.Summary.Cell>
              <Table.Summary.Cell index={2} />
              <Table.Summary.Cell index={3} align="right"><strong>{formatNumber(totals.tien)}</strong></Table.Summary.Cell>
              <Table.Summary.Cell index={4} colSpan={2} />
            </Table.Summary.Row>
          )}
        />
      </Card>
    </div>
  );
};

export default BaoCaoBangKePhieuNhap;
