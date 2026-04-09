import {
  Button,
  Card,
  DatePicker,
  Input,
  Select,
  Space,
  Spin,
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

const formatDate = (date) => {
  if (!date) return "";
  const d = dayjs(date);
  return d.format("YYYY-MM-DD HH:mm:ss.SSS");
};

const getDefaultFilters = () => ({
  DateFrom: dayjs().startOf("day").format("YYYY-MM-DD HH:mm:ss.SSS"),
  DateTo: dayjs().endOf("day").format("YYYY-MM-DD HH:mm:ss.SSS"),
  InvoiceFrom: "",
  InvoiceTo: "",
  Salesman: "",
  Customer: "",
  Site: "",
  Item: "",
  Group1: "",
  Group2: "",
  Group3: "",
  Unit: [],
  DataType: "2",
  Language: "V",
  Admin: 1,
});

const BaoCaoPhieuBanLe = () => {
  const { id: userId, unitId } = useSelector(
    (state) => state.claimsReducer.userInfo || {}
  );

  const [dataSource, setDataSource] = useState([]);
  const [loading, setLoading] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalRecords, setTotalRecords] = useState(0);

  // Options for selectboxes
  const [khoOptions, setKhoOptions] = useState([]);
  const [nhomVatTuOptions, setNhomVatTuOptions] = useState({
    1: [],
    2: [],
    3: [],
  });
  const [dvcsOptions, setDvcsOptions] = useState([]);
  const [nhanVienOptions, setNhanVienOptions] = useState([]);
  const [khachHangOptions, setKhachHangOptions] = useState([]);
  const [vatTuOptions, setVatTuOptions] = useState([]);
  const [nhanVienLoaded, setNhanVienLoaded] = useState(false);

  // Loading states for selectboxes
  const [loadingKho, setLoadingKho] = useState(false);
  const [loadingNhomVatTu, setLoadingNhomVatTu] = useState(false);
  const [loadingDvcs, setLoadingDvcs] = useState(false);
  const [loadingNhanVien, setLoadingNhanVien] = useState(false);
  const [loadingKhachHang, setLoadingKhachHang] = useState(false);
  const [loadingVatTu, setLoadingVatTu] = useState(false);

  // Search refs for debounce
  const khoSearchRef = useRef(null);
  const nhomVatTuSearchRef = useRef({ 1: null, 2: null, 3: null });
  const dvcsSearchRef = useRef(null);
  const nhanVienSearchRef = useRef(null);
  const khachHangSearchRef = useRef(null);
  const vatTuSearchRef = useRef(null);

  const [filters, setFilters] = useState(getDefaultFilters);
  const [tableFilters, setTableFilters] = useState({
    so_ct: "",
    dien_giai: "",
    ma_vt: "",
    ten_vt: "",
  });

  // Fetch danh sách kho
  const fetchKhoOptions = useCallback(
    async (searchValue = "") => {
      if (!unitId) return;
      setLoadingKho(true);
      try {
        const res = await multipleTablePutApi({
          store: "api_getKho",
          param: {
            unitId: unitId,
            userId: userId,
            searchValue: searchValue || "",
            pageIndex: 1,
            pageSize: 100,
          },
          data: {},
        });
        const data = res?.listObject?.[0] || [];
        const options = data.map((item) => ({
          value: item.ma_kho || item.value || "",
          label: item.ten_kho || item.label || item.ma_kho || "",
        }));
        setKhoOptions(options);
      } catch (err) {
        console.error("❌ Lỗi khi lấy danh sách kho:", err);
        setKhoOptions([]);
      } finally {
        setLoadingKho(false);
      }
    },
    [unitId, userId]
  );

  // Fetch nhóm vật tư
  const fetchNhomVatTuOptions = useCallback(
    async (loaiNhom, searchValue = "") => {
      setLoadingNhomVatTu(true);
      try {
        const res = await multipleTablePutApi({
          store: "api_getNhomVatTu",
          param: {
            loaiNhom: loaiNhom,
            searchValue: searchValue || "",
            pageIndex: 1,
            pageSize: 100,
          },
          data: {},
        });
        const data = res?.listObject?.[0] || [];
        const options = data
          .map((item) => {
            const maNhom =
              item.ma_nh ||
              item.ma_nhom ||
              item.maNhom ||
              item.MA_NHOM ||
              item.value ||
              "";
            const tenNhom =
              item.ten_nh ||
              item.ten_nhom ||
              item.tenNhom ||
              item.TEN_NHOM ||
              item.label ||
              item.ten ||
              maNhom;
            return {
              value: maNhom.trim(),
              label: tenNhom.trim() || maNhom.trim(),
            };
          })
          .filter((opt) => opt.value);
        setNhomVatTuOptions((prev) => ({ ...prev, [loaiNhom]: options }));
      } catch (err) {
        console.error(`❌ Lỗi khi lấy nhóm vật tư ${loaiNhom}:`, err);
        setNhomVatTuOptions((prev) => ({ ...prev, [loaiNhom]: [] }));
      } finally {
        setLoadingNhomVatTu(false);
      }
    },
    []
  );

  // Fetch danh sách đơn vị cơ sở
  const fetchDvcsOptions = useCallback(async (searchValue = "") => {
    setLoadingDvcs(true);
    try {
      const res = await multipleTablePutApi({
        store: "api_getDvcs",
        param: {
          searchValue: searchValue || "",
          pageIndex: 1,
          pageSize: 100,
        },
        data: {},
      });
      const data = res?.listObject?.[0] || [];
      const options = data.map((item) => ({
        value: item.ma_dvcs || item.value || "",
        label: item.ten_dvcs || item.label || item.ma_dvcs || "",
      }));
      setDvcsOptions(options);
    } catch (err) {
      console.error("❌ Lỗi khi lấy danh sách đơn vị cơ sở:", err);
      setDvcsOptions([]);
    } finally {
      setLoadingDvcs(false);
    }
  }, []);

  // Fetch nhân viên bán hàng
  const fetchNhanVienOptions = useCallback(async (searchValue = "") => {
    setLoadingNhanVien(true);
    try {
      const res = await multipleTablePutApi({
        store: "api_getNhanVienBanHang",
        param: {
          searchValue: searchValue || "",
          pageIndex: 1,
          pageSize: 100,
        },
        data: {},
      });

      const data = res?.listObject?.[0] || [];

      const options = data
        .map((item) => {
          const value =
            item.ma_nvbh ||
            item.ma_nv ||
            item.ma_nhan_vien ||
            item.value ||
            item.maNV ||
            item.MA_NV ||
            "";
          const label =
            item.ten_nvbh ||
            item.ten_nv ||
            item.ten_nhan_vien ||
            item.label ||
            item.tenNV ||
            item.TEN_NV ||
            "";

          return {
            value: String(value).trim(),
            label: String(label).trim(),
          };
        })
        .filter((opt) => opt.value && opt.label);

      setNhanVienOptions(options);
    } catch (err) {
      console.error("❌ Lỗi khi lấy danh sách nhân viên:", err);
      console.error("❌ Chi tiết lỗi:", err.response?.data || err.message);
      setNhanVienOptions([]);
    } finally {
      setLoadingNhanVien(false);
    }
  }, []);

  // Fetch khách hàng
  const fetchKhachHangOptions = useCallback(async (searchValue = "") => {
    setLoadingKhachHang(true);
    try {
      const res = await multipleTablePutApi({
        store: "api_getKhachHang",
        param: {
          searchValue: searchValue || "",
          pageIndex: 1,
          pageSize: 100,
        },
        data: {},
      });
      const data = res?.listObject?.[0] || [];
      const options = data.map((item) => ({
        value: item.ma_kh || item.ma_khach_hang || item.value || "",
        label:
          item.ten_kh || item.ten_khach_hang || item.label || item.ma_kh || "",
      }));
      setKhachHangOptions(options);
    } catch (err) {
      console.error("❌ Lỗi khi lấy danh sách khách hàng:", err);
      setKhachHangOptions([]);
    } finally {
      setLoadingKhachHang(false);
    }
  }, []);

  // Fetch vật tư
  const fetchVatTuOptions = useCallback(async (searchValue = "") => {
    setLoadingVatTu(true);
    try {
      const res = await multipleTablePutApi({
        store: "api_getVatTu",
        param: {
          searchValue: searchValue || "",
          pageIndex: 1,
          pageSize: 100,
        },
        data: {},
      });
      const data = res?.listObject?.[0] || [];
      const options = data.map((item) => ({
        value: item.ma_vt || item.ma_vat_tu || item.value || "",
        label: item.ten_vt || item.ten_vat_tu || item.label || item.ma_vt || "",
      }));
      setVatTuOptions(options);
    } catch (err) {
      console.error("❌ Lỗi khi lấy danh sách vật tư:", err);
      setVatTuOptions([]);
    } finally {
      setLoadingVatTu(false);
    }
  }, []);

  const fetchData = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const res = await multipleTablePutApi({
        store: "api_scrs_rptSalesInvoiceList",
        param: {
          DateFrom: filters.DateFrom,
          DateTo: filters.DateTo,
          InvoiceFrom: filters.InvoiceFrom || "",
          InvoiceTo: filters.InvoiceTo || "",
          Salesman: filters.Salesman || "",
          Customer: filters.Customer || "",
          Site: filters.Site || "",
          Item: filters.Item || "",
          Group1: filters.Group1 || "",
          Group2: filters.Group2 || "",
          Group3: filters.Group3 || "",
          Unit:
            Array.isArray(filters.Unit) && filters.Unit.length
              ? filters.Unit.join(",")
              : "",
          DataType: filters.DataType || "2",
          Language: filters.Language || "V",
          UserID: userId,
          Admin: filters.Admin || 1,
          pageIndex: currentPage,
          pageSize: pageSize,
        },
        data: {},
      });

      const fetchedData = res?.listObject?.[0] || [];
      const paginationInfo = res?.listObject?.[1]?.[0] || {};

      // Lấy total từ pagination info
      const total = paginationInfo.totalRecord || paginationInfo.total_rows || fetchedData.length;
      setTotalRecords(total);

      // Format data - chỉ lấy các trường cần thiết
      const formattedData = fetchedData.map((item, index) => {
        const isSummaryRow = item.systotal === 0 && !item.ma_vt?.trim();

        return {
          key: `row-${(currentPage - 1) * pageSize + index}`,
          stt: (currentPage - 1) * pageSize + index + 1,
          ngay_ct: item.ngay_ct ? dayjs(item.ngay_ct).format("DD/MM/YYYY") : "",
          so_ct: (item.so_ct || "").trim(),
          dien_giai: (item.dien_giai || "").trim(),
          ma_vt: (item.ma_vt || "").trim(),
          ten_vt: (item.ten_vt || "").trim(),
          dvt: (item.dvt || "").trim(),
          ma_kho: (item.ma_kho || "").trim(),
          so_luong_tl: item.so_luong_tl || 0,
          dt_tra_lai:
            item.so_luong_tl > 0 && item.ngay_ct
              ? dayjs(item.ngay_ct).format("DD/MM/YYYY")
              : "",
          so_luong: item.so_luong || 0,
          gia2: item.gia2 || 0,
          tien2: item.tien2 || 0,
          thue: item.thue || 0,
          ck: item.ck || 0,
          pt: item.pt || 0,
          tt_tien_mat: item.tt_tien_mat || 0,
          tt_chyen_khoan: item.tt_chyen_khoan || 0,
          tt_cn: item.tt_cn || 0,
          isSummary: isSummaryRow,
        };
      });

      setDataSource(formattedData);
    } catch (err) {
      console.error("❌ Lỗi khi lấy dữ liệu báo cáo phiếu bán lẻ:", err);
      setDataSource([]);
    } finally {
      setLoading(false);
    }
  }, [filters, userId, currentPage, pageSize]);

  const [exportLoading, setExportLoading] = useState(false);

  const handleExportExcel = useCallback(async () => {
    if (!userId) return;

    setExportLoading(true);
    try {
      let allData = [];
      let currentPageIdx = 1;
      let totalPages = 1;

      while (currentPageIdx <= totalPages) {
        const res = await multipleTablePutApi({
          store: "api_scrs_rptSalesInvoiceList",
          param: {
            DateFrom: filters.DateFrom,
            DateTo: filters.DateTo,
            InvoiceFrom: filters.InvoiceFrom || "",
            InvoiceTo: filters.InvoiceTo || "",
            Salesman: filters.Salesman || "",
            Customer: filters.Customer || "",
            Site: filters.Site || "",
            Item: filters.Item || "",
            Group1: filters.Group1 || "",
            Group2: filters.Group2 || "",
            Group3: filters.Group3 || "",
            Unit:
              Array.isArray(filters.Unit) && filters.Unit.length
                ? filters.Unit.join(",")
                : "",
            DataType: filters.DataType || "2",
            Language: filters.Language || "V",
            UserID: userId,
            Admin: filters.Admin || 1,
            pageIndex: currentPageIdx,
            pageSize: 1000,
          },
          data: {},
        });

        const pageData = res?.listObject?.[0] || [];
        allData = [...allData, ...pageData];

        const paginationInfo = res?.listObject?.[1]?.[0] || {};
        totalPages = paginationInfo.totalPage || 1;
        currentPageIdx++;
      }

      if (allData.length === 0) {
        setExportLoading(false);
        return;
      }

      // Format data - tương tự logic trong Table
      const formattedAllData = allData.map((item, index) => {
        return {
          stt: index + 1,
          ngay_ct: item.ngay_ct ? dayjs(item.ngay_ct).format("DD/MM/YYYY") : "",
          so_ct: (item.so_ct || "").trim(),
          dien_giai: (item.dien_giai || "").trim(),
          ma_vt: (item.ma_vt || "").trim(),
          ten_vt: (item.ten_vt || "").trim(),
          dvt: (item.dvt || "").trim(),
          ma_kho: (item.ma_kho || "").trim(),
          so_luong_tl: item.so_luong_tl || 0,
          dt_tra_lai:
            item.so_luong_tl > 0 && item.ngay_ct
              ? dayjs(item.ngay_ct).format("DD/MM/YYYY")
              : "",
          so_luong: item.so_luong || 0,
          gia2: item.gia2 || 0,
          tien2: item.tien2 || 0,
          thue: item.thue || 0,
          ck: item.ck || 0,
          pt: item.pt || 0,
          tt_tien_mat: item.tt_tien_mat || 0,
          tt_chyen_khoan: item.tt_chyen_khoan || 0,
          tt_cn: item.tt_cn || 0,
        };
      });

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Báo cáo");

      // Định nghĩa các cột
      const columnsConfig = [
        { header: "STT", key: "stt", width: 8 },
        { header: "Ngày ct", key: "ngay_ct", width: 12 },
        { header: "Số ct", key: "so_ct", width: 15 },
        { header: "Diễn giải", key: "dien_giai", width: 40 },
        { header: "Mã hàng", key: "ma_vt", width: 15 },
        { header: "Tên mặt hàng", key: "ten_vt", width: 50 },
        { header: "Dvt", key: "dvt", width: 10 },
        { header: "Mã kho", key: "ma_kho", width: 10 },
        { header: "SL. trả lại", key: "so_luong_tl", width: 12 },
        { header: "Dt trả lại", key: "dt_tra_lai", width: 12 },
        { header: "Số lượng", key: "so_luong", width: 12 },
        { header: "Giá bán", key: "gia2", width: 15 },
        { header: "Doanh thu", key: "tien2", width: 15 },
        { header: "Thuế", key: "thue", width: 15 },
        { header: "Chiết khấu", key: "ck", width: 15 },
        { header: "Phải thu", key: "pt", width: 15 },
        { header: "Tiền mặt", key: "tt_tien_mat", width: 15 },
        { header: "Chuyển khoản", key: "tt_chyen_khoan", width: 15 },
        { header: "Công nợ", key: "tt_cn", width: 15 },
      ];

      worksheet.columns = columnsConfig;

      // Header style
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
      headerRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF217346" },
      };
      headerRow.alignment = { vertical: "middle", horizontal: "center", wrapText: true };

      // Add data
      formattedAllData.forEach((item) => {
        const row = worksheet.addRow(item);
        row.alignment = { vertical: "middle", wrapText: true };

        row.eachCell((cell, colNumber) => {
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };

          const colKey = columnsConfig[colNumber - 1].key;
          const numberCols = ["so_luong_tl", "so_luong", "gia2", "tien2", "thue", "ck", "pt", "tt_tien_mat", "tt_chyen_khoan", "tt_cn"];

          if (numberCols.includes(colKey)) {
            cell.alignment = { horizontal: "right", vertical: "middle" };
            cell.numFmt = "#,##0";
          } else if (["stt", "ngay_ct", "so_ct", "ma_vt", "dvt", "ma_kho", "dt_tra_lai"].includes(colKey)) {
            cell.alignment = { horizontal: "center", vertical: "middle" };
          } else {
            cell.alignment = { horizontal: "left", vertical: "middle", wrapText: true };
          }
          cell.font = { size: 10 };
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      saveAs(blob, `BaoCaoPhieuBanLe_${dayjs().format("YYYYMMDD_HHmmss")}.xlsx`);
    } catch (err) {
      console.error("❌ Lỗi khi xuất Excel:", err);
    } finally {
      setExportLoading(false);
    }
  }, [filters, userId]);


  // Render cell content với xử lý summary row
  const renderCellContent = useCallback((text, record, col) => {
    if (record.isSummary) {
      if (col.dataIndex === "dien_giai" || col.dataIndex === "so_ct") {
        return (
          <div style={{ ...BOLD_CELL_STYLE, fontStyle: "italic" }}>
            {text || ""}
          </div>
        );
      }
      if (col.align === "right") {
        return (
          <div style={BOLD_CELL_STYLE}>{formatNumber(Number(text) || 0)}</div>
        );
      }
      if (col.dataIndex === "stt") {
        return <div style={CELL_STYLE}>{text}</div>;
      }
    }

    if (col.align === "right") {
      const value = Number(text) || 0;
      if (value === 0) {
        return <div style={CELL_STYLE}></div>;
      }
      return <div style={CELL_STYLE}>{formatNumber(value)}</div>;
    }

    if (col.align === "left") {
      return (
        <div style={{ textAlign: "left", paddingLeft: "4px" }}>
          {text || ""}
        </div>
      );
    }

    return <div style={CELL_STYLE}>{text || ""}</div>;
  }, []);

  // Định nghĩa columns cố định
  const columns = useMemo(
    () =>
      [
        {
          title: "STT",
          dataIndex: "stt",
          key: "stt",
          width: 70,
          align: "center",
        },
        {
          title: "Ngày CT",
          dataIndex: "ngay_ct",
          key: "ngay_ct",
          width: 100,
          align: "center",
        },
        {
          title: "Số CT",
          dataIndex: "so_ct",
          key: "so_ct",
          width: 140,
          align: "center",
          filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) => (
            <div style={{ padding: 8 }}>
              <Input
                placeholder="Tìm số chứng từ"
                value={selectedKeys[0]}
                onChange={(e) =>
                  setSelectedKeys(e.target.value ? [e.target.value] : [])
                }
                onPressEnter={() => {
                  confirm();
                  setTableFilters((prev) => ({
                    ...prev,
                    so_ct: selectedKeys[0] || "",
                  }));
                }}
                style={{ marginBottom: 8, display: "block" }}
              />
              <Button
                type="primary"
                onClick={() => {
                  confirm();
                  setTableFilters((prev) => ({
                    ...prev,
                    so_ct: selectedKeys[0] || "",
                  }));
                }}
                size="small"
                style={{ width: "100%" }}
              >
                Tìm kiếm
              </Button>
            </div>
          ),
          filteredValue: tableFilters.so_ct ? [tableFilters.so_ct] : null,
          onFilter: (value, record) =>
            record.so_ct?.toString().toLowerCase().includes(value.toLowerCase()),
        },
        {
          title: "Diễn giải",
          dataIndex: "dien_giai",
          key: "dien_giai",
          width: 200,
          align: "left",
          filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) => (
            <div style={{ padding: 8 }}>
              <Input
                placeholder="Tìm diễn giải"
                value={selectedKeys[0]}
                onChange={(e) =>
                  setSelectedKeys(e.target.value ? [e.target.value] : [])
                }
                onPressEnter={() => {
                  confirm();
                  setTableFilters((prev) => ({
                    ...prev,
                    dien_giai: selectedKeys[0] || "",
                  }));
                }}
                style={{ marginBottom: 8, display: "block" }}
              />
              <Button
                type="primary"
                onClick={() => {
                  confirm();
                  setTableFilters((prev) => ({
                    ...prev,
                    dien_giai: selectedKeys[0] || "",
                  }));
                }}
                size="small"
                style={{ width: "100%" }}
              >
                Tìm kiếm
              </Button>
            </div>
          ),
          filteredValue: tableFilters.dien_giai ? [tableFilters.dien_giai] : null,
          onFilter: (value, record) =>
            record.dien_giai?.toString().toLowerCase().includes(value.toLowerCase()),
        },
        {
          title: "Mã hàng",
          dataIndex: "ma_vt",
          key: "ma_vt",
          width: 120,
          align: "center",
          filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) => (
            <div style={{ padding: 8 }}>
              <Input
                placeholder="Tìm mã hàng"
                value={selectedKeys[0]}
                onChange={(e) =>
                  setSelectedKeys(e.target.value ? [e.target.value] : [])
                }
                onPressEnter={() => {
                  confirm();
                  setTableFilters((prev) => ({
                    ...prev,
                    ma_vt: selectedKeys[0] || "",
                  }));
                }}
                style={{ marginBottom: 8, display: "block" }}
              />
              <Button
                type="primary"
                onClick={() => {
                  confirm();
                  setTableFilters((prev) => ({
                    ...prev,
                    ma_vt: selectedKeys[0] || "",
                  }));
                }}
                size="small"
                style={{ width: "100%" }}
              >
                Tìm kiếm
              </Button>
            </div>
          ),
          filteredValue: tableFilters.ma_vt ? [tableFilters.ma_vt] : null,
          onFilter: (value, record) =>
            record.ma_vt?.toString().toLowerCase().includes(value.toLowerCase()),
        },
        {
          title: "Tên mặt hàng",
          dataIndex: "ten_vt",
          key: "ten_vt",
          width: 300,
          align: "left",
          filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) => (
            <div style={{ padding: 8 }}>
              <Input
                placeholder="Tìm tên mặt hàng"
                value={selectedKeys[0]}
                onChange={(e) =>
                  setSelectedKeys(e.target.value ? [e.target.value] : [])
                }
                onPressEnter={() => {
                  confirm();
                  setTableFilters((prev) => ({
                    ...prev,
                    ten_vt: selectedKeys[0] || "",
                  }));
                }}
                style={{ marginBottom: 8, display: "block" }}
              />
              <Button
                type="primary"
                onClick={() => {
                  confirm();
                  setTableFilters((prev) => ({
                    ...prev,
                    ten_vt: selectedKeys[0] || "",
                  }));
                }}
                size="small"
                style={{ width: "100%" }}
              >
                Tìm kiếm
              </Button>
            </div>
          ),
          filteredValue: tableFilters.ten_vt ? [tableFilters.ten_vt] : null,
          onFilter: (value, record) =>
            record.ten_vt?.toString().toLowerCase().includes(value.toLowerCase()),
        },
        {
          title: "ĐVT",
          dataIndex: "dvt",
          key: "dvt",
          width: 100,
          align: "center",
        },
        {
          title: "Mã kho",
          dataIndex: "ma_kho",
          key: "ma_kho",
          width: 100,
          align: "center",
        },
        {
          title: "SL. trả lại",
          dataIndex: "so_luong_tl",
          key: "so_luong_tl",
          width: 100,
          align: "right",
        },
        {
          title: "Dt trả lại",
          dataIndex: "dt_tra_lai",
          key: "dt_tra_lai",
          width: 100,
          align: "center",
        },
        {
          title: "Số lượng",
          dataIndex: "so_luong",
          key: "so_luong",
          width: 100,
          align: "right",
        },
        {
          title: "Giá bán",
          dataIndex: "gia2",
          key: "gia2",
          width: 120,
          align: "right",
        },
        {
          title: "Doanh thu",
          dataIndex: "tien2",
          key: "tien2",
          width: 120,
          align: "right",
        },
        {
          title: "Thuế",
          dataIndex: "thue",
          key: "thue",
          width: 120,
          align: "right",
        },
        {
          title: "Chiết khấu",
          dataIndex: "ck",
          key: "ck",
          width: 120,
          align: "right",
        },
        {
          title: "Phải thu",
          dataIndex: "pt",
          key: "pt",
          width: 120,
          align: "right",
        },
        {
          title: "Tiền mặt",
          dataIndex: "tt_tien_mat",
          key: "tt_tien_mat",
          width: 120,
          align: "right",
        },
        {
          title: "Chuyển khoản",
          dataIndex: "tt_chyen_khoan",
          key: "tt_chyen_khoan",
          width: 120,
          align: "right",
        },
        {
          title: "Công nợ",
          dataIndex: "tt_cn",
          key: "tt_cn",
          width: 120,
          align: "right",
        },
      ].map((col) => ({
        ...col,
        onCell: (record) => ({ record }),
        render: (text, record) => renderCellContent(text, record, col),
      })),
    [renderCellContent, tableFilters]
  );

  // Load options on mount
  useEffect(() => {
    const loadInitialOptions = async () => {
      try {
        await Promise.all([
          fetchKhoOptions(),
          fetchNhomVatTuOptions(1),
          fetchNhomVatTuOptions(2),
          fetchNhomVatTuOptions(3),
          fetchDvcsOptions(),
          fetchKhachHangOptions(),
          fetchKhoOptions(),
          fetchNhanVienOptions(),
          fetchVatTuOptions(),
        ]);
        setNhanVienLoaded(true);
      } catch (err) {
        console.error("❌ Lỗi khi tải options ban đầu:", err);
      }
    };

    loadInitialOptions();
  }, [
    fetchDvcsOptions,
    fetchKhachHangOptions,
    fetchKhoOptions,
    fetchNhanVienOptions,
    fetchNhomVatTuOptions,
    fetchVatTuOptions,
  ]);

  useEffect(() => {
    if (userId) {
      fetchData();
    }
  }, [fetchData, userId, currentPage, pageSize]);

  const handleFilterChange = useCallback((key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
    setCurrentPage(1);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters(getDefaultFilters());
    setTableFilters({
      so_ct: "",
      dien_giai: "",
      ma_vt: "",
      ten_vt: "",
    });
    setCurrentPage(1);
  }, [setCurrentPage]);

  const activeChips = useMemo(() => {
    const chips = [];
    if (filters.Unit && filters.Unit.length > 0) {
      const selectedDvcs = dvcsOptions
        .filter((opt) => filters.Unit.includes(opt.value))
        .map((opt) => opt.label)
        .join(", ");
      chips.push({
        key: "Unit",
        label: "ĐVCS",
        value: selectedDvcs || filters.Unit.join(", "),
        color: "volcano",
      });
    }

    if (filters.DateFrom && filters.DateTo) {
      chips.push({
        key: "DateRange",
        label: "Thời gian",
        value: `${dayjs(filters.DateFrom).format("DD/MM/YYYY")} - ${dayjs(
          filters.DateTo
        ).format("DD/MM/YYYY")}`,
        color: "blue",
      });
    }

    if (filters.InvoiceFrom) {
      chips.push({
        key: "InvoiceFrom",
        label: "Từ số CT",
        value: filters.InvoiceFrom,
        color: "orange",
      });
    }
    if (filters.InvoiceTo) {
      chips.push({
        key: "InvoiceTo",
        label: "Đến số CT",
        value: filters.InvoiceTo,
        color: "orange",
      });
    }
    if (filters.Salesman) {
      const option = nhanVienOptions.find((opt) => opt.value === filters.Salesman);
      chips.push({
        key: "Salesman",
        label: "Nhân viên",
        value: option ? option.label : filters.Salesman,
        color: "geekblue",
      });
    }
    if (filters.Customer) {
      const option = khachHangOptions.find((opt) => opt.value === filters.Customer);
      chips.push({
        key: "Customer",
        label: "Khách hàng",
        value: option ? option.label : filters.Customer,
        color: "purple",
      });
    }
    if (filters.Site) {
      const option = khoOptions.find((opt) => opt.value === filters.Site);
      chips.push({
        key: "Site",
        label: "Kho",
        value: option ? option.label : filters.Site,
        color: "cyan",
      });
    }
    if (filters.Item) {
      const option = vatTuOptions.find((opt) => opt.value === filters.Item);
      chips.push({
        key: "Item",
        label: "Vật tư",
        value: option ? option.label : filters.Item,
        color: "green",
      });
    }

    // Add table filters to chips
    if (tableFilters.so_ct) {
      chips.push({
        key: "so_ct",
        label: "Số CT",
        value: tableFilters.so_ct,
        color: "gold",
      });
    }
    if (tableFilters.dien_giai) {
      chips.push({
        key: "dien_giai",
        label: "Diễn giải",
        value: tableFilters.dien_giai,
        color: "gold",
      });
    }
    if (tableFilters.ma_vt) {
      chips.push({
        key: "ma_vt",
        label: "Mã hàng",
        value: tableFilters.ma_vt,
        color: "gold",
      });
    }
    if (tableFilters.ten_vt) {
      chips.push({
        key: "ten_vt",
        label: "Tên hàng",
        value: tableFilters.ten_vt,
        color: "gold",
      });
    }

    return chips;
  }, [
    filters,
    tableFilters,
    khoOptions,
    nhanVienOptions,
    khachHangOptions,
    vatTuOptions,
    dvcsOptions,
  ]);

  const handleRemoveFilter = useCallback((key) => {
    if (key === "Unit") {
      handleFilterChange("Unit", []);
    } else if (key === "DateRange") {
      handleFilterChange("DateFrom", formatDate(dayjs().startOf("day")));
      handleFilterChange("DateTo", formatDate(dayjs().endOf("day")));
    } else if (["so_ct", "dien_giai", "ma_vt", "ten_vt"].includes(key)) {
      setTableFilters((prev) => ({
        ...prev,
        [key]: "",
      }));
    } else {
      handleFilterChange(key, "");
    }
  }, [handleFilterChange]);

  const handleDateChange = (key, date) => {
    if (date) {
      handleFilterChange(key, formatDate(date));
    } else {
      const defaultDate =
        key === "DateFrom" ? dayjs().startOf("day") : dayjs().endOf("day");
      handleFilterChange(key, formatDate(defaultDate));
    }
  };

  return (
    <div className="bao-cao-ton-kho-container">
      <Card>
        <div className="bao-cao-header">
          <Title level={2} style={{ margin: 0 }}>
            Báo cáo phiếu bán lẻ
          </Title>
        </div>

        <div className="bao-cao-filters">
          <div className="filters-grid">
            <div className="filter-item">
              <label>Từ ngày - Đến ngày:</label>
              <RangePicker
                value={[dayjs(filters.DateFrom), dayjs(filters.DateTo)]}
                onChange={(dates) => {
                  if (dates) {
                    handleFilterChange("DateFrom", formatDate(dates[0]));
                    handleFilterChange("DateTo", formatDate(dates[1]));
                  }
                }}
                format="DD/MM/YYYY"
                style={{ width: "100%" }}
              />
            </div>
            <div className="filter-item">
              <label>Từ số chứng từ:</label>
              <Input
                value={filters.InvoiceFrom}
                onChange={(e) =>
                  handleFilterChange("InvoiceFrom", e.target.value)
                }
                placeholder="Nhập từ số chứng từ"
                allowClear
              />
            </div>
            <div className="filter-item">
              <label>Đến số chứng từ:</label>
              <Input
                value={filters.InvoiceTo}
                onChange={(e) =>
                  handleFilterChange("InvoiceTo", e.target.value)
                }
                placeholder="Nhập đến số chứng từ"
                allowClear
              />
            </div>
            <div className="filter-item">
              <label>Nhân viên:</label>
              <Select
                value={filters.Salesman || undefined}
                onChange={(value) => handleFilterChange("Salesman", value)}
                placeholder="Chọn nhân viên"
                showSearch
                allowClear
                loading={loadingNhanVien}
                filterOption={false}
                onSearch={(value) => {
                  if (nhanVienSearchRef.current)
                    clearTimeout(nhanVienSearchRef.current);
                  nhanVienSearchRef.current = setTimeout(() => {
                    fetchNhanVienOptions(value);
                  }, 300);
                }}
                onOpenChange={(open) => {
                  if (open && !nhanVienLoaded) {
                    fetchNhanVienOptions();
                    setNhanVienLoaded(true);
                  }
                }}
                options={nhanVienOptions}
                notFoundContent={
                  loadingNhanVien ? <Spin size="small" /> : "Không tìm thấy"
                }
              />
            </div>
            <div className="filter-item">
              <label>Khách hàng:</label>
              <Select
                value={filters.Customer || undefined}
                onChange={(value) => handleFilterChange("Customer", value)}
                placeholder="Chọn khách hàng"
                showSearch
                allowClear
                loading={loadingKhachHang}
                filterOption={false}
                onSearch={(value) => {
                  if (khachHangSearchRef.current)
                    clearTimeout(khachHangSearchRef.current);
                  khachHangSearchRef.current = setTimeout(() => {
                    fetchKhachHangOptions(value);
                  }, 300);
                }}
                onOpenChange={(open) => {
                  if (open) fetchKhachHangOptions();
                }}
                options={khachHangOptions}
                notFoundContent={
                  loadingKhachHang ? <Spin size="small" /> : "Không tìm thấy"
                }
              />
            </div>
            <div className="filter-item">
              <label>Mã kho:</label>
              <Select
                value={filters.Site || undefined}
                onChange={(value) => handleFilterChange("Site", value)}
                placeholder="Chọn kho"
                showSearch
                allowClear
                loading={loadingKho}
                filterOption={false}
                onSearch={(value) => {
                  if (khoSearchRef.current) clearTimeout(khoSearchRef.current);
                  khoSearchRef.current = setTimeout(() => {
                    fetchKhoOptions(value);
                  }, 300);
                }}
                onOpenChange={(open) => {
                  if (open) fetchKhoOptions();
                }}
                options={khoOptions}
                notFoundContent={
                  loadingKho ? <Spin size="small" /> : "Không tìm thấy"
                }
              />
            </div>

            <div className="filter-item">
              <label>Đơn vị cơ sở:</label>
              <Select
                mode="multiple"
                value={filters.Unit}
                onChange={(value) => handleFilterChange("Unit", value)}
                placeholder="Chọn đơn vị"
                showSearch
                loading={loadingDvcs}
                filterOption={false}
                onSearch={(value) => {
                  if (dvcsSearchRef.current)
                    clearTimeout(dvcsSearchRef.current);
                  dvcsSearchRef.current = setTimeout(() => {
                    fetchDvcsOptions(value);
                  }, 300);
                }}
                onOpenChange={(open) => {
                  if (open) fetchDvcsOptions();
                }}
                options={dvcsOptions}
                notFoundContent={
                  loadingDvcs ? <Spin size="small" /> : "Không tìm thấy"
                }
              />
            </div>
            <div className="filter-item">
              <label>Nhóm vật tư 1:</label>
              <Select
                value={filters.Group1 || undefined}
                onChange={(value) => handleFilterChange("Group1", value)}
                placeholder="Chọn nhóm vật tư 1"
                showSearch
                allowClear
                loading={loadingNhomVatTu}
                filterOption={false}
                onSearch={(value) => {
                  if (nhomVatTuSearchRef.current[1])
                    clearTimeout(nhomVatTuSearchRef.current[1]);
                  nhomVatTuSearchRef.current[1] = setTimeout(() => {
                    fetchNhomVatTuOptions(1, value);
                  }, 300);
                }}
                onOpenChange={(open) => {
                  if (open) fetchNhomVatTuOptions(1);
                }}
                options={nhomVatTuOptions[1] || []}
                notFoundContent={
                  loadingNhomVatTu ? <Spin size="small" /> : "Không tìm thấy"
                }
              />
            </div>
            <div className="filter-item">
              <label>Nhóm vật tư 2:</label>
              <Select
                value={filters.Group2 || undefined}
                onChange={(value) => handleFilterChange("Group2", value)}
                placeholder="Chọn nhóm vật tư 2"
                showSearch
                allowClear
                loading={loadingNhomVatTu}
                filterOption={false}
                onSearch={(value) => {
                  if (nhomVatTuSearchRef.current[2])
                    clearTimeout(nhomVatTuSearchRef.current[2]);
                  nhomVatTuSearchRef.current[2] = setTimeout(() => {
                    fetchNhomVatTuOptions(2, value);
                  }, 300);
                }}
                onOpenChange={(open) => {
                  if (open) fetchNhomVatTuOptions(2);
                }}
                options={nhomVatTuOptions[2] || []}
                notFoundContent={
                  loadingNhomVatTu ? <Spin size="small" /> : "Không tìm thấy"
                }
              />
            </div>
            <div className="filter-item">
              <label>Nhóm vật tư 3:</label>
              <Select
                value={filters.Group3 || undefined}
                onChange={(value) => handleFilterChange("Group3", value)}
                placeholder="Chọn nhóm vật tư 3"
                showSearch
                allowClear
                loading={loadingNhomVatTu}
                filterOption={false}
                onSearch={(value) => {
                  if (nhomVatTuSearchRef.current[3])
                    clearTimeout(nhomVatTuSearchRef.current[3]);
                  nhomVatTuSearchRef.current[3] = setTimeout(() => {
                    fetchNhomVatTuOptions(3, value);
                  }, 300);
                }}
                onOpenChange={(open) => {
                  if (open) fetchNhomVatTuOptions(3);
                }}
                options={nhomVatTuOptions[3] || []}
                notFoundContent={
                  loadingNhomVatTu ? <Spin size="small" /> : "Không tìm thấy"
                }
              />
            </div>

            {/* <div className="filter-item">
              <label>Loại dữ liệu:</label>
              <Select
                value={filters.DataType}
                onChange={(value) => handleFilterChange("DataType", value)}
                options={[
                  { value: "1", label: "Thực tế" },
                  { value: "2", label: "Hóa đơn" },
                ]}
              />
            </div> */}
            <div className="button-item-row" style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "12px" }}>
              <Button
                type="primary"
                style={{ backgroundColor: "#217346", borderColor: "#217346", minWidth: "120px" }}
                onClick={handleExportExcel}
                loading={exportLoading}
                disabled={dataSource.length === 0}
                className="btn-export-excel"
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

        <div className="report-modal_Container" style={{ marginTop: "16px" }}>
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
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} của ${total} bản ghi`,
              pageSizeOptions: ["25", "50", "100", "200", "500"],
              onChange: (page, size) => {
                setCurrentPage(page);
                if (size !== pageSize) {
                  setPageSize(size);
                  setCurrentPage(1);
                }
              },
            }}
            rowKey="key"
            scroll={{ y: 450, x: "max-content" }}
          />
        </div>
      </Card>
    </div>
  );
};

export default BaoCaoPhieuBanLe;
