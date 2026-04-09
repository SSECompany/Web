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
import "./TongHopNhapXuatTon.css";

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
  Site: "",
  Unit: [],
  ItemType: "",
  ItemGroup: "",
  Item: "",
  CalculateTransfer: "1",
  nh_theo: "",
  tt_sx1: 0,
  tt_sx2: 0,
  tt_sx3: 0,
  Order: "ma_vt",
  ShowItem: "3",
  DataType: "2",
  Language: "V",
  Admin: 1,
});

const TongHopNhapXuatTon = () => {
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
  const [loading, setLoading] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalRecords, setTotalRecords] = useState(0);

  // Options
  const [khoOptions, setKhoOptions] = useState([]);
  const [nhomVatTuOptions, setNhomVatTuOptions] = useState([]);
  const [loaiVatTuOptions, setLoaiVatTuOptions] = useState([]);
  const [dvcsOptions, setDvcsOptions] = useState(() =>
    defaultUnitCode ? [{ value: defaultUnitCode, label: defaultUnitName }] : []
  );
  const [vatTuOptions, setVatTuOptions] = useState([]);

  // Loading states
  const [loadingKho, setLoadingKho] = useState(false);
  const [loadingNhomVatTu, setLoadingNhomVatTu] = useState(false);
  const [loadingLoaiVatTu, setLoadingLoaiVatTu] = useState(false);
  const [loadingDvcs, setLoadingDvcs] = useState(false);
  const [loadingVatTu, setLoadingVatTu] = useState(false);

  // Search refs
  const khoSearchRef = useRef(null);
  const nhomVatTuSearchRef = useRef({ 1: null, 2: null, 3: null });
  const loaiVatTuSearchRef = useRef(null);
  const dvcsSearchRef = useRef(null);
  const vatTuSearchRef = useRef(null);

  const [filters, setFilters] = useState(getDefaultFilters);

  const [tableFilters, setTableFilters] = useState({
    ma_vt: "",
    ten_vt: "",
    dvt: "",
  });

  // Auto-fill Unit when defaultUnitCode is available
  useEffect(() => {
    if (defaultUnitCode) {
      setFilters((prev) => ({
        ...prev,
        Unit: prev.Unit && prev.Unit.length > 0 ? prev.Unit : [defaultUnitCode],
      }));
    }
  }, [defaultUnitCode]);



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
        const options =
          data.map((item) => ({
            value: (item.ma_kho || item.value || "").trim(),
            label:
              (item.ten_kho || item.label || item.ma_kho || "").trim() ||
              (item.ma_kho || "").trim(),
          })) || [];
        setKhoOptions(options.filter((opt) => opt.value));
      } catch (err) {
        console.error("❌ Lỗi khi lấy danh sách kho:", err);
        setKhoOptions([]);
      } finally {
        setLoadingKho(false);
      }
    },
    [unitId, userId]
  );

  const fetchNhomVatTuOptions = useCallback(
    async (loaiNhom, searchValue = "") => {
      setLoadingNhomVatTu(true);
      try {
        const res = await multipleTablePutApi({
          store: "api_getNhomVatTu",
          param: {
            loaiNhom,
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
        console.error("❌ Lỗi khi lấy nhóm vật tư:", err);
        setNhomVatTuOptions((prev) => ({ ...prev, [loaiNhom]: [] }));
      } finally {
        setLoadingNhomVatTu(false);
      }
    },
    []
  );

  const fetchLoaiVatTuOptions = useCallback(async (searchValue = "") => {
    setLoadingLoaiVatTu(true);
    try {
      const res = await multipleTablePutApi({
        store: "api_getLoaiVatTu",
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
            item.ma_loai_vt ||
            item.ma_loai ||
            item.value ||
            ""
          ).trim();
          const label =
            (
              item.ten_loai_vt ||
              item.ten_loai ||
              item.label ||
              item.ten ||
              ""
            ).trim() || value;
          return { value, label };
        })
        .filter((opt) => opt.value);
      setLoaiVatTuOptions(options);
    } catch (err) {
      console.error("❌ Lỗi khi lấy loại vật tư:", err);
      setLoaiVatTuOptions([]);
    } finally {
      setLoadingLoaiVatTu(false);
    }
  }, []);

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
      const options = data
        .map((item) => ({
          value: (item.ma_dvcs || item.value || "").trim(),
          label:
            (item.ten_dvcs || item.label || item.ten || "").trim() ||
            (item.ma_dvcs || "").trim(),
        }))
        .filter((opt) => opt.value);
      setDvcsOptions(options);
    } catch (err) {
      console.error("❌ Lỗi khi lấy đơn vị cơ sở:", err);
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
        store: "api_rs_rptStockSummary",
        param: {
          DateFrom: filters.DateFrom,
          DateTo: filters.DateTo,
          Site: filters.Site || "",
          Item: filters.Item || "",
          Unit:
            Array.isArray(filters.Unit) && filters.Unit.length
              ? filters.Unit.join(",")
              : "",
          ItemType: filters.ItemType || "",
          ItemGroup1: filters.ItemGroup1 || "",
          ItemGroup2: filters.ItemGroup2 || "",
          ItemGroup3: filters.ItemGroup3 || "",
          CalculateTransfer: filters.CalculateTransfer || "1",
          nh_theo: filters.nh_theo || "",
          tt_sx1: filters.tt_sx1 || 0,
          tt_sx2: filters.tt_sx2 || 0,
          tt_sx3: filters.tt_sx3 || 0,
          Order: filters.Order || "ma_vt",
          ShowItem: filters.ShowItem || "3",
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

      const formattedData = fetchedData
        .map((item, index) => {
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
            ton_dau: Number(item.ton_dau || 0),
            du_dau: Number(item.du_dau || 0),
            sl_nhap: Number(item.sl_nhap || 0),
            tien_nhap: Number(item.tien_nhap || 0),
            sl_xuat: Number(item.sl_xuat || 0),
            tien_xuat: Number(item.tien_xuat || 0),
            ton_cuoi: Number(item.ton_cuoi || 0),
            du_cuoi: Number(item.du_cuoi || 0),
          };
        })
        .filter((item) => item.ma_vt || item.ten_vt);

      setDataSource(formattedData);
    } catch (err) {
      console.error("❌ Lỗi khi lấy dữ liệu tổng hợp nhập xuất tồn:", err);
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

      // Vòng lặp lấy dữ liệu từng trang cho đến khi đủ
      while (currentPageIdx <= totalPages) {
        const res = await multipleTablePutApi({
          store: "api_rs_rptStockSummary",
          param: {
            DateFrom: filters.DateFrom,
            DateTo: filters.DateTo,
            Site: filters.Site || "",
            Item: filters.Item || "",
            Unit:
              Array.isArray(filters.Unit) && filters.Unit.length
                ? filters.Unit.join(",")
                : "",
            ItemType: filters.ItemType || "",
            ItemGroup1: filters.ItemGroup1 || "",
            ItemGroup2: filters.ItemGroup2 || "",
            ItemGroup3: filters.ItemGroup3 || "",
            CalculateTransfer: filters.CalculateTransfer || "1",
            nh_theo: filters.nh_theo || "",
            tt_sx1: filters.tt_sx1 || 0,
            tt_sx2: filters.tt_sx2 || 0,
            tt_sx3: filters.tt_sx3 || 0,
            Order: filters.Order || "ma_vt",
            ShowItem: filters.ShowItem || "3",
            DataType: filters.DataType || "2",
            Language: filters.Language || "V",
            UserID: userId,
            Admin: filters.Admin || 1,
            pageIndex: currentPageIdx,
            pageSize: 1000, // Lấy tối đa cho mỗi trang
          },
          data: {},
        });

        const pageData = res?.listObject?.[0] || [];
        allData = [...allData, ...pageData];

        const paginationInfo = res?.listObject?.[1]?.[0] || {};
        totalPages = paginationInfo.totalPage || 1;
        currentPageIdx++;

        // Nếu có nhiều trang, có thể thông báo tiến trình ở đây nếu cần
      }

      if (allData.length === 0) {
        setExportLoading(false);
        return;
      }

      // Format data - tương tự login trong Table
      const formattedAllData = allData
        .map((item, index) => {
          const ma = (item.ma_vt || "").trim();
          const ten = (item.ten_vt || "").trim();
          const dvt = (item.dvt || "").trim();
          const isSummaryRow =
            item.systotal === 0 && !ma && ten.toLowerCase().includes("tổng");

          return {
            ...item,
            stt: isSummaryRow ? "" : index + 1,
            ma_vt: ma,
            ten_vt: ten,
            dvt: dvt,
            isSummary: isSummaryRow,
            ton_dau: Number(item.ton_dau || 0),
            du_dau: Number(item.du_dau || 0),
            sl_nhap: Number(item.sl_nhap || 0),
            tien_nhap: Number(item.tien_nhap || 0),
            sl_xuat: Number(item.sl_xuat || 0),
            tien_xuat: Number(item.tien_xuat || 0),
            ton_cuoi: Number(item.ton_cuoi || 0),
            du_cuoi: Number(item.du_cuoi || 0),
          };
        })
        .filter((item) => item.ma_vt || item.ten_vt);

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Báo cáo");

      // Định nghĩa các cột
      const columnsConfig = [
        { header: "STT", key: "stt", width: 8 },
        { header: "Mã vật tư", key: "ma_vt", width: 15 },
        { header: "Tên vật tư", key: "ten_vt", width: 50 },
        { header: "Đvt", key: "dvt", width: 10 },
        { header: "Tồn đầu", key: "ton_dau", width: 15 },
        { header: "Dư đầu", key: "du_dau", width: 15 },
        { header: "SL nhập", key: "sl_nhap", width: 15 },
        { header: "Tiền nhập", key: "tien_nhap", width: 15 },
        { header: "SL xuất", key: "sl_xuat", width: 15 },
        { header: "Tiền xuất", key: "tien_xuat", width: 15 },
        { header: "Tồn cuối", key: "ton_cuoi", width: 15 },
        { header: "Dư cuối", key: "du_cuoi", width: 15 },
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
        const rowData = {
          stt: item.stt,
          ma_vt: item.ma_vt,
          ten_vt: item.ten_vt,
          dvt: item.dvt,
          ton_dau: item.ton_dau,
          du_dau: item.du_dau,
          sl_nhap: item.sl_nhap,
          tien_nhap: item.tien_nhap,
          sl_xuat: item.sl_xuat,
          tien_xuat: item.tien_xuat,
          ton_cuoi: item.ton_cuoi,
          du_cuoi: item.du_cuoi,
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
          const numberCols = ["ton_dau", "du_dau", "sl_nhap", "tien_nhap", "sl_xuat", "tien_xuat", "ton_cuoi", "du_cuoi"];

          if (numberCols.includes(colKey)) {
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
      saveAs(blob, `TongHopNhapXuatTon_${dayjs().format("YYYYMMDD_HHmmss")}.xlsx`);
    } catch (error) {
      console.error("❌ Lỗi khi xuất Excel:", error);
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
      createNumberColumn("Tồn đầu", "ton_dau"),
      createNumberColumn("Dư đầu", "du_dau"),
      createNumberColumn("SL nhập", "sl_nhap"),
      createNumberColumn("Tiền nhập", "tien_nhap"),
      createNumberColumn("SL xuất", "sl_xuat"),
      createNumberColumn("Tiền xuất", "tien_xuat"),
      createNumberColumn("Tồn cuối", "ton_cuoi"),
      createNumberColumn("Dư cuối", "du_cuoi"),
    ],
    [tableFilters]
  );

  function createNumberColumn(title, dataIndex) {
    return {
      title,
      dataIndex,
      key: dataIndex,
      width: 140,
      align: "right",
      render: (_, record) => {
        if (record.isSummary) {
          return (
            <div style={BOLD_CELL_STYLE}>
              {formatNumber(record[dataIndex] || 0)}
            </div>
          );
        }
        const value = Number(record[dataIndex]) || 0;
        const isNegative = value < 0;
        if (value === 0) {
          return <div style={CELL_STYLE}></div>;
        }
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
      },
    };
  }

  const optimizedColumns = useMemo(
    () =>
      columns.map((col) => ({
        ...col,
        align: col.align || "center",
        onCell: (record) => ({ record }),
        render:
          col.render ||
          ((text, record) => {
            if (record.isSummary) {
              if (col.dataIndex === "ten_vt") {
                return (
                  <div style={{ ...BOLD_CELL_STYLE, fontStyle: "italic" }}>
                    {text || "Tổng cộng"}
                  </div>
                );
              }
              if (col.dataIndex === "stt") {
                return <div style={CELL_STYLE}></div>;
              }
            }
            if (col.dataIndex === "ten_vt") {
              return (
                <div style={{ textAlign: "left", paddingLeft: 4 }}>{text}</div>
              );
            }
            if (col.dataIndex === "ma_vt" || col.dataIndex === "dvt") {
              return <div style={CELL_STYLE}>{text}</div>;
            }
            if (col.dataIndex === "stt") {
              return <div style={CELL_STYLE}>{text}</div>;
            }
            return text;
          }),
      })),
    [columns]
  );

  const totals = useMemo(() => {
    return dataSource.reduce(
      (acc, item) => {
        if (item.isSummary) {
          acc.summary = {
            ton_dau: item.ton_dau,
            du_dau: item.du_dau,
            sl_nhap: item.sl_nhap,
            tien_nhap: item.tien_nhap,
            sl_xuat: item.sl_xuat,
            tien_xuat: item.tien_xuat,
            ton_cuoi: item.ton_cuoi,
            du_cuoi: item.du_cuoi,
          };
          return acc;
        }
        acc.ton_dau += Number(item.ton_dau) || 0;
        acc.du_dau += Number(item.du_dau) || 0;
        acc.sl_nhap += Number(item.sl_nhap) || 0;
        acc.tien_nhap += Number(item.tien_nhap) || 0;
        acc.sl_xuat += Number(item.sl_xuat) || 0;
        acc.tien_xuat += Number(item.tien_xuat) || 0;
        acc.ton_cuoi += Number(item.ton_cuoi) || 0;
        acc.du_cuoi += Number(item.du_cuoi) || 0;
        return acc;
      },
      {
        ton_dau: 0,
        du_dau: 0,
        sl_nhap: 0,
        tien_nhap: 0,
        sl_xuat: 0,
        tien_xuat: 0,
        ton_cuoi: 0,
        du_cuoi: 0,
        summary: null,
      }
    );
  }, [dataSource]);

  const getTotalValue = (field) => {
    if (totals.summary && totals.summary[field] !== undefined) {
      return totals.summary[field];
    }
    return totals[field] || 0;
  };

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
      Unit: defaultUnitCode ? [defaultUnitCode] : [],
    });
    setTableFilters({
      ma_vt: "",
      ten_vt: "",
      dvt: "",
    });
    setCurrentPage(1);
  }, [setCurrentPage, defaultUnitCode]);
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
        color: "gold",
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
      handleFilterChange("Unit", []);
    } else if (key === "DateRange") {
      handleFilterChange("DateFrom", formatDate(dayjs().startOf("day")));
      handleFilterChange("DateTo", formatDate(dayjs().endOf("day")));
    } else if (["ma_vt", "ten_vt", "dvt"].includes(key)) {
      setTableFilters((prev) => ({
        ...prev,
        [key]: "",
      }));
    } else {
      handleFilterChange(key, "");
    }
  }, [handleFilterChange]);

  // Load danh sách filter ban đầu
  useEffect(() => {
    fetchKhoOptions();
    fetchNhomVatTuOptions(1);
    fetchNhomVatTuOptions(2);
    fetchNhomVatTuOptions(3);
    fetchLoaiVatTuOptions();
    fetchDvcsOptions();
    fetchVatTuOptions();
  }, [
    fetchKhoOptions,
    fetchNhomVatTuOptions,
    fetchLoaiVatTuOptions,
    fetchDvcsOptions,
    fetchVatTuOptions,
  ]);

  // Tự động gọi API khi vào trang hoặc khi pagination thay đổi
  useEffect(() => {
    if (userId) {
      fetchData();
    }
  }, [fetchData, userId, currentPage, pageSize]);

  return (
    <div className="tong-hop-nhap-xuat-container">
      <Card>
        <div className="bao-cao-header">
          <Title level={2} style={{ margin: 0 }}>
            Báo cáo tổng hợp nhập xuất tồn
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
            <div className="filter-item">
              <label>Loại vật tư:</label>
              <Select
                value={filters.ItemType || undefined}
                onChange={(value) => handleFilterChange("ItemType", value)}
                placeholder="Chọn loại vật tư"
                showSearch
                allowClear
                loading={loadingLoaiVatTu}
                filterOption={false}
                onSearch={(value) => {
                  if (loaiVatTuSearchRef.current)
                    clearTimeout(loaiVatTuSearchRef.current);
                  loaiVatTuSearchRef.current = setTimeout(() => {
                    fetchLoaiVatTuOptions(value);
                  }, 300);
                }}
                onOpenChange={(open) => {
                  if (open) fetchLoaiVatTuOptions();
                }}
                options={loaiVatTuOptions}
                notFoundContent={
                  loadingLoaiVatTu ? <Spin size="small" /> : "Không tìm thấy"
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
            <div className="button-item-row" style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "12px" }}>
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
            scroll={{ x: "max-content", y: 450 }}
            sticky={{ offsetHeader: 0 }}
            summary={() => (
              <Table.Summary.Row>
                {columns.map((col, idx) => {
                  const { dataIndex } = col;
                  const cellValueMap = {
                    ten_vt: <strong>Tổng cộng</strong>,
                    ton_dau: (
                      <strong>{formatNumber(getTotalValue("ton_dau"))}</strong>
                    ),
                    du_dau: (
                      <strong>{formatNumber(getTotalValue("du_dau"))}</strong>
                    ),
                    sl_nhap: (
                      <strong>{formatNumber(getTotalValue("sl_nhap"))}</strong>
                    ),
                    tien_nhap: (
                      <strong>
                        {formatNumber(getTotalValue("tien_nhap"))}
                      </strong>
                    ),
                    sl_xuat: (
                      <strong>{formatNumber(getTotalValue("sl_xuat"))}</strong>
                    ),
                    tien_xuat: (
                      <strong>
                        {formatNumber(getTotalValue("tien_xuat"))}
                      </strong>
                    ),
                    ton_cuoi: (
                      <strong>{formatNumber(getTotalValue("ton_cuoi"))}</strong>
                    ),
                    du_cuoi: (
                      <strong>{formatNumber(getTotalValue("du_cuoi"))}</strong>
                    ),
                  };
                  return (
                    <Table.Summary.Cell key={idx}>
                      {cellValueMap[dataIndex] || null}
                    </Table.Summary.Cell>
                  );
                })}
              </Table.Summary.Row>
            )}
          />
        </div>
      </Card>
    </div>
  );
};

export default TongHopNhapXuatTon;
