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

const CELL_STYLE = { textAlign: "center" };
const BOLD_CELL_STYLE = { fontWeight: "bold", textAlign: "center" };

const formatDate = (date) => {
  if (!date) return "";
  const d = dayjs(date);
  return d.format("YYYY-MM-DD HH:mm:ss.SSS");
};

const getDefaultFilters = () => ({
  DateTo: dayjs().format("YYYY-MM-DD HH:mm:ss.SSS"),
  Site: "",
  ItemGroup1: "",
  ItemGroup2: "",
  ItemGroup3: "",
  Unit: [],
  BalanceType: 2,
  nh_theo: 0,
  tt_sx1: 0,
  tt_sx2: 0,
  tt_sx3: 0,
  Order: "ma_vt",
  DataType: 2,
  Language: "V",
  Admin: 1,
});

const BaoCaoTonKho = () => {
  const {
    id: userId,
    unitId,
    MA_DVCS,
    DVCS,
  } = useSelector((state) => state.claimsReducer.userInfo || {});

  // Default unit from login (trimmed)
  const defaultUnitCode = useMemo(() => {
    return (unitId || MA_DVCS || "").trim();
  }, [unitId, MA_DVCS]);

  const defaultUnitName = useMemo(() => {
    return (DVCS || defaultUnitCode || "").trim();
  }, [DVCS, defaultUnitCode]);

  const [dataSource, setDataSource] = useState([]);
  const [summaryData, setSummaryData] = useState(null);
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
  const [dvcsOptions, setDvcsOptions] = useState(() =>
    defaultUnitCode
      ? [{ value: defaultUnitCode, label: defaultUnitName }]
      : []
  );
  const [vatTuOptions, setVatTuOptions] = useState([]);

  // Loading states for selectboxes
  const [loadingKho, setLoadingKho] = useState(false);
  const [loadingNhomVatTu, setLoadingNhomVatTu] = useState(false);
  const [loadingDvcs, setLoadingDvcs] = useState(false);
  const [loadingVatTu, setLoadingVatTu] = useState(false);

  // Search refs for debounce
  const khoSearchRef = useRef(null);
  const nhomVatTuSearchRef = useRef(null);
  const dvcsSearchRef = useRef(null);
  const vatTuSearchRef = useRef(null);

  // Loại nhóm vật tư mặc định là 1
  const loaiNhomVatTu = 1;

  const [filters, setFilters] = useState(getDefaultFilters);
  const [tableFilters, setTableFilters] = useState({
    ma_vt: "",
    ten_vt: "",
    dvt: "",
  });

  // Auto-fill Unit when defaultUnitCode is available
  // useEffect(() => {
  //   if (defaultUnitCode) {
  //     setFilters((prev) => ({
  //       ...prev,
  //       Unit:
  //         prev.Unit && prev.Unit.length > 0 ? prev.Unit : [defaultUnitCode],
  //     }));
  //   }
  // }, [defaultUnitCode]);

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
      const options = data.map((item) => {
        const val = (item.ma_dvcs || item.value || "").trim();
        const lab = (item.ten_dvcs || item.label || item.ma_dvcs || "").trim() || val;
        return { value: val, label: lab };
      });
      setDvcsOptions(options);
    } catch (err) {
      console.error("❌ Lỗi khi lấy danh sách đơn vị cơ sở:", err);
      setDvcsOptions([]);
    } finally {
      setLoadingDvcs(false);
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
      const options = data
        .map((item) => {
          const value = (
            item.ma_vt ||
            item.ma_vat_tu ||
            item.value ||
            ""
          ).trim();
          const label =
            (
              item.ten_vt ||
              item.ten_vat_tu ||
              item.label ||
              item.ma_vt ||
              ""
            ).trim() || value;
          return {
            value: value,
            label: label,
          };
        })
        .filter((opt) => opt.value);
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
        store: "api_rs_rptStockReport",
        param: {
          DateTo: filters.DateTo,
          Site: filters.Site || "",
          Item: filters.Item || "",
          ItemGroup1: filters.ItemGroup1 || "",
          ItemGroup2: filters.ItemGroup2 || "",
          ItemGroup3: filters.ItemGroup3 || "",
          nh_theo: filters.nh_theo || 0,
          tt_sx1: filters.tt_sx1 || 0,
          tt_sx2: filters.tt_sx2 || 0,
          tt_sx3: filters.tt_sx3 || 0,
          Unit: "",
          BalanceType: filters.BalanceType || 2,
          Order: filters.Order || "ma_vt",
          DataType: filters.DataType || 2,
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

      // Lấy total từ pagination info (field có thể là totalRecord hoặc total_rows tùy API)
      const total = paginationInfo.totalRecord || paginationInfo.total_rows || fetchedData.length;
      setTotalRecords(total);


      // Loại bỏ các dòng hoàn toàn trống (không có mã và tên)
      const cleanedData = fetchedData.filter((item) => {
        const ma = (item.ma_vt || "").trim();
        const ten = (item.ten_vt || "").trim();
        return ma || ten;
      });

      const summaryRow = cleanedData.find((item) => {
        const ma = (item.ma_vt || "").trim();
        const ten = (item.ten_vt || "").trim();
        return item.systotal === 0 && !ma && ten.toLowerCase().includes("tổng");
      });

      if (summaryRow) {
        setSummaryData({
          so_luong: Number(summaryRow.so_luong) || 0,
          gia_tri:
            summaryRow.tien !== undefined && summaryRow.tien !== null
              ? Number(summaryRow.tien)
              : summaryRow.gia_tri !== undefined && summaryRow.gia_tri !== null
              ? Number(summaryRow.gia_tri)
              : (Number(summaryRow.so_luong) || 0) * (Number(summaryRow.don_gia) || 0),
        });
      } else if (currentPage === 1) {
        setSummaryData(null);
      }

      // Format data với key và tính toán giá trị
      // API có thể trả về các field: ma_vt, ten_vt, dvt, so_luong, don_gia, gia_tri, etc.
      const formattedData = cleanedData.map((item, index) => {
        const ma = (item.ma_vt || "").trim();
        const ten = (item.ten_vt || "").trim();
        const dvt = (item.dvt || "").trim();
        const isSummaryRow =
          item.systotal === 0 && !ma && ten.toLowerCase().includes("tổng");

        // Tính STT dựa trên trang hiện tại
        const sttValue = isSummaryRow
          ? ""
          : item.stt || (currentPage - 1) * pageSize + index + 1;

        return {
          ...item,
          key: `row-${(currentPage - 1) * pageSize + index}`,
          stt: sttValue,
          ma_vt: ma,
          ten_vt: ten,
          dvt: dvt,
          isSummary: isSummaryRow,
          // Nếu API không trả về gia_tri, ưu tiên dùng cột tiền (tien)
          gia_tri:
            item.tien !== undefined && item.tien !== null
              ? Number(item.tien)
              : item.gia_tri !== undefined && item.gia_tri !== null
              ? Number(item.gia_tri)
              : (Number(item.so_luong) || 0) * (Number(item.don_gia) || 0),
          so_luong: Number(item.so_luong) || 0,
        };
      }).filter((item) => !item.isSummary);

      setDataSource(formattedData);
    } catch (err) {
      console.error("❌ Lỗi khi lấy dữ liệu tồn kho:", err);
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
          store: "api_rs_rptStockReport",
          param: {
            DateTo: filters.DateTo,
            Site: filters.Site || "",
            Item: filters.Item || "",
            ItemGroup1: filters.ItemGroup1 || "",
            ItemGroup2: filters.ItemGroup2 || "",
            ItemGroup3: filters.ItemGroup3 || "",
            nh_theo: filters.nh_theo || 0,
            tt_sx1: filters.tt_sx1 || 0,
            tt_sx2: filters.tt_sx2 || 0,
            tt_sx3: filters.tt_sx3 || 0,
            Unit: "",
            BalanceType: filters.BalanceType || 2,
            Order: filters.Order || "ma_vt",
            DataType: filters.DataType || 2,
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

      // Lọc và format dữ liệu tương tự như trong Table
      const cleanedData = allData.filter((item) => {
        const ma = (item.ma_vt || "").trim();
        const ten = (item.ten_vt || "").trim();
        return (ma || ten) && item.sysorder !== 1; // Bỏ dòng trống sysorder: 1
      });

      const formattedAllData = cleanedData.map((item, index) => {
        const ma = (item.ma_vt || "").trim();
        const ten = (item.ten_vt || "").trim();
        const isSummaryRow =
          item.systotal === 0 && !ma && ten.toLowerCase().includes("tổng");

        return {
          ...item,
          stt: isSummaryRow ? "" : index + 1,
          ma_vt: ma,
          ten_vt: ten,
          dvt: (item.dvt || "").trim(),
          gia_tri: Number(item.tien || item.gia_tri || (Number(item.so_luong) || 0) * (Number(item.don_gia) || 0)),
          so_luong: Number(item.so_luong) || 0,
        };
      });

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Báo cáo");

      // Định nghĩa các cột
      const columnsConfig = [
        { header: "STT", key: "stt", width: 8 },
        { header: "Mã vật tư", key: "ma_vt", width: 15 },
        { header: "Tên vật tư", key: "ten_vt", width: 50 },
        { header: "Đvt", key: "dvt", width: 10 },
        { header: "Số lượng", key: "so_luong", width: 15 },
        { header: "Giá trị", key: "gia_tri", width: 15 },
      ];

      worksheet.columns = columnsConfig;

      // Định dạng tiêu đề
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
      headerRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF217346" },
      };
      headerRow.alignment = {
        vertical: "middle",
        horizontal: "center",
        wrapText: true,
      };

      // Thêm toàn bộ dữ liệu vào worksheet
      formattedAllData.forEach((item) => {
        const rowData = {
          stt: item.stt,
          ma_vt: item.ma_vt,
          ten_vt: item.ten_vt,
          dvt: item.dvt,
          so_luong: item.so_luong,
          gia_tri: item.gia_tri,
        };
        const row = worksheet.addRow(rowData);

        row.alignment = { vertical: "middle", wrapText: true };
        row.eachCell((cell, colNumber) => {
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };

          const colKey = columnsConfig[colNumber - 1].key;
          if (["so_luong", "gia_tri"].includes(colKey)) {
            cell.alignment = { horizontal: "right", vertical: "middle" };
            cell.numFmt = "#,##0";
          } else if (["stt", "ma_vt", "dvt"].includes(colKey)) {
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
      saveAs(blob, `BaoCaoTonKho_${dayjs().format("YYYYMMDD_HHmmss")}.xlsx`);
    } catch (err) {
      console.error("❌ Lỗi khi xuất Excel:", err);
    } finally {
      setExportLoading(false);
    }
  }, [filters, userId]);

  const columns = useMemo(
    () => [
      {
        title: "STT",
        dataIndex: "stt",
        key: "stt",
        width: 70,
      },
      {
        title: "Mã vật tư",
        dataIndex: "ma_vt",
        key: "ma_vt",
        width: 120,
        filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) => (
          <div style={{ padding: 8 }}>
            <Input
              placeholder="Tìm mã vật tư"
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
        title: "Tên vật tư",
        dataIndex: "ten_vt",
        key: "ten_vt",
        width: 300,
        filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) => (
          <div style={{ padding: 8 }}>
            <Input
              placeholder="Tìm tên vật tư"
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
      },
      {
        title: "Số lượng",
        dataIndex: "so_luong",
        key: "so_luong",
        width: 120,
      },
      {
        title: "Giá trị",
        dataIndex: "gia_tri",
        key: "gia_tri",
        width: 150,
      },
    ],
    [tableFilters]
  );

  const renderCellContent = useCallback((text, record, col) => {
    if (record.isSummary) {
      if (col.dataIndex === "ten_vt") {
        return (
          <div style={{ ...BOLD_CELL_STYLE, fontStyle: "italic" }}>
            {text || "Tổng cộng"}
          </div>
        );
      }

      if (col.dataIndex === "so_luong" || col.dataIndex === "gia_tri") {
        return (
          <div style={{ ...BOLD_CELL_STYLE }}>
            {formatNumber(Number(text) || 0)}
          </div>
        );
      }

      if (col.dataIndex === "stt") {
        return <div style={CELL_STYLE}></div>;
      }
    }

    if (col.dataIndex === "stt") {
      return <div style={CELL_STYLE}>{text}</div>;
    }

    if (col.dataIndex === "ma_vt" || col.dataIndex === "dvt") {
      return <div style={CELL_STYLE}>{text}</div>;
    }

    if (col.dataIndex === "ten_vt") {
      return (
        <div style={{ textAlign: "left", paddingLeft: "4px" }}>{text}</div>
      );
    }

    if (col.dataIndex === "so_luong") {
      const value = Number(text) || 0;
      const isNegative = value < 0;
      return (
        <div
          style={{
            ...CELL_STYLE,
            color: isNegative ? "#ff4d4f" : "#000",
            fontWeight: isNegative ? "bold" : "normal",
          }}
        >
          {formatNumber(value)}
        </div>
      );
    }

    if (col.dataIndex === "gia_tri") {
      // Chỉ hiển thị giá trị nếu số lượng > 0
      if (Number(record.so_luong) <= 0) {
        return <div style={CELL_STYLE}>-</div>;
      }
      const value = Number(text) || 0;
      return <div style={CELL_STYLE}>{formatNumber(value)}</div>;
    }

    return <div style={CELL_STYLE}>{text}</div>;
  }, []);

  const optimizedColumns = useMemo(
    () =>
      columns.map((col) => ({
        ...col,
        align: "center",
        onCell: (record) => ({ record }),
        render: (text, record) => renderCellContent(text, record, col),
      })),
    [columns, renderCellContent]
  );

  // Load options on mount
  useEffect(() => {
    fetchKhoOptions();
    fetchNhomVatTuOptions(1);
    fetchNhomVatTuOptions(2);
    fetchNhomVatTuOptions(3);
    fetchDvcsOptions();
    fetchVatTuOptions();
  }, [
    fetchKhoOptions,
    fetchNhomVatTuOptions,
    fetchDvcsOptions,
    fetchVatTuOptions,
  ]);

  useEffect(() => {
    if (userId) {
      fetchData();
    }
  }, [fetchData, userId, currentPage, pageSize]);

  // Tính tổng cộng
  const totals = useMemo(() => {
    return dataSource.reduce(
      (acc, item) => {
        if (item.isSummary) {
          // Lưu lại giá trị tổng API trả về để hiển thị nếu cần
          acc.apiTotalSoLuong =
            item.so_luong !== undefined && item.so_luong !== null
              ? Number(item.so_luong)
              : acc.apiTotalSoLuong;
          acc.apiTotalGiaTri =
            item.gia_tri !== undefined && item.gia_tri !== null
              ? Number(item.gia_tri)
              : acc.apiTotalGiaTri;
          return acc;
        }
        const soLuong = Number(item.so_luong) || 0;
        const giaTri = Number(item.gia_tri) || 0;
        acc.totalSoLuong += soLuong;
        if (soLuong > 0 && giaTri > 0) {
          acc.totalGiaTri += giaTri;
        }
        return acc;
      },
      { totalSoLuong: 0, totalGiaTri: 0, apiTotalSoLuong: 0, apiTotalGiaTri: 0 }
    );
  }, [dataSource]);

  const handleFilterChange = useCallback((key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
    setCurrentPage(1); // Reset về trang 1 khi filter thay đổi
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({
      ...getDefaultFilters(),
      // Unit: defaultUnitCode ? [defaultUnitCode] : [],
    });
    setTableFilters({
      ma_vt: "",
      ten_vt: "",
      dvt: "",
    });
    setCurrentPage(1);
  }, [setCurrentPage, defaultUnitCode]);

  const handleDateChange = (date) => {
    if (date) {
      handleFilterChange("DateTo", formatDate(date));
    } else {
      handleFilterChange("DateTo", formatDate(dayjs()));
    }
  };

  const activeChips = useMemo(() => {
    const chips = [];
    // if (filters.Unit && filters.Unit.length > 0) {
    //   const selectedDvcs = dvcsOptions
    //     .filter((opt) => filters.Unit.includes(opt.value))
    //     .map((opt) => opt.label)
    //     .join(", ");
    //   chips.push({
    //     key: "Unit",
    //     label: "ĐVCS",
    //     value: selectedDvcs || filters.Unit.join(", "),
    //     color: "volcano",
    //   });
    // }
    if (filters.DateTo) {
      chips.push({
        key: "DateTo",
        label: "Ngày",
        value: dayjs(filters.DateTo).format("DD/MM/YYYY"),
        color: "blue",
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
    if (filters.ItemGroup1) {
      const option = nhomVatTuOptions[1]?.find((opt) => opt.value === filters.ItemGroup1);
      chips.push({
        key: "ItemGroup1",
        label: "Nhóm vật tư 1",
        value: option ? option.label : filters.ItemGroup1,
        color: "orange",
      });
    }
    if (filters.ItemGroup2) {
      const option = nhomVatTuOptions[2]?.find((opt) => opt.value === filters.ItemGroup2);
      chips.push({
        key: "ItemGroup2",
        label: "Nhóm vật tư 2",
        value: option ? option.label : filters.ItemGroup2,
        color: "orange",
      });
    }
    if (filters.ItemGroup3) {
      const option = nhomVatTuOptions[3]?.find((opt) => opt.value === filters.ItemGroup3);
      chips.push({
        key: "ItemGroup3",
        label: "Nhóm vật tư 3",
        value: option ? option.label : filters.ItemGroup3,
        color: "orange",
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
    if (tableFilters.ma_vt) {
      chips.push({
        key: "ma_vt",
        label: "Mã vật tư",
        value: tableFilters.ma_vt,
        color: "gold",
      });
    }
    if (tableFilters.ten_vt) {
      chips.push({
        key: "ten_vt",
        label: "Tên vật tư",
        value: tableFilters.ten_vt,
      });
    }
    if (tableFilters.dvt) {
      chips.push({
        key: "dvt",
        label: "ĐVT",
        value: tableFilters.dvt,
      });
    }

    return chips;
  }, [
    filters,
    tableFilters,
    khoOptions,
    nhomVatTuOptions,
    vatTuOptions,
    dvcsOptions,
  ]);

  const handleRemoveFilter = useCallback((key) => {
    if (key === "Unit") {
      // handleFilterChange("Unit", []);
    } else if (["ma_vt", "ten_vt", "dvt"].includes(key)) {
      setTableFilters((prev) => ({
        ...prev,
        [key]: "",
      }));
    } else {
      handleFilterChange(key, "");
    }
  }, [handleFilterChange]);

  return (
    <div className="bao-cao-ton-kho-container">
      <Card>
        <div className="bao-cao-header">
          <Title level={2} style={{ margin: 0 }}>
            Báo cáo tồn kho
          </Title>
        </div>

        <div className="bao-cao-filters">
          <div className="filters-grid">
            <div className="filter-item">
              <label>Ngày:</label>
              <DatePicker
                value={dayjs(filters.DateTo)}
                onChange={handleDateChange}
                format="DD/MM/YYYY"
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
              <label>Nhóm vật tư 1:</label>
              <Select
                value={filters.ItemGroup1 || undefined}
                onChange={(value) => handleFilterChange("ItemGroup1", value)}
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
                value={filters.ItemGroup2 || undefined}
                onChange={(value) => handleFilterChange("ItemGroup2", value)}
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
                value={filters.ItemGroup3 || undefined}
                onChange={(value) => handleFilterChange("ItemGroup3", value)}
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
            </div> */}
            <div className="button-item-row" style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end", marginTop: "12px" }}>
              <div style={{ display: "flex", gap: "12px" }}>
                <Button
                  type="primary"
                  onClick={handleExportExcel}
                  loading={exportLoading}
                  className="btn-export-excel"
                  disabled={dataSource.length === 0}
                >
                  Xuất Excel
                </Button>
              </div>
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
            columns={optimizedColumns}
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
            scroll={{ y: 450 }}
            summary={() => {
              const summarySoLuong =
                summaryData?.so_luong ?? totals.apiTotalSoLuong ?? totals.totalSoLuong;
              const summaryGiaTri = summaryData?.gia_tri ?? totals.apiTotalGiaTri ?? totals.totalGiaTri;
              return (
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={4} align="center">
                    <strong style={{ whiteSpace: "nowrap" }}>Tổng cộng</strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={4} align="center">
                    <strong>{formatNumber(summarySoLuong)}</strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={5} align="center">
                    <strong>{formatNumber(summaryGiaTri)}</strong>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              );
            }}
          />
        </div>
      </Card>
    </div>
  );
};

export default BaoCaoTonKho;
