import {
  CheckOutlined,
  EditOutlined,
  FilterOutlined,
  PrinterOutlined,
} from "@ant-design/icons";
import {
  Button,
  DatePicker,
  Input,
  Modal,
  Pagination,
  Select,
  Spin,
  Table,
  Tag,
  notification,
} from "antd";
import dayjs from "dayjs";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useReactToPrint } from "react-to-print";
import { multipleTablePutApi } from "../../../api";
import jwt from "../../../utils/jwt";
import showConfirm from "../Modal/ModalConfirm";
import PrintComponent from "./PrintComponent/PrintComponent";
import "./RetailOrderListModal.css";

const isSyncRequested = (value) => {
  if (value === null || value === undefined) return false;
  const normalized =
    typeof value === "string" ? value.trim().toLowerCase() : value;
  if (normalized === "*" || normalized === "0") return false;
  if (normalized === true || normalized === 1) return true;
  if (typeof normalized === "string") {
    return ["synchronize", "sync", "đồng bộ", "dong bo"].includes(normalized);
  }
  return Boolean(normalized);
};

const getSyncResultStatus = (value) => {
  if (value === null || value === undefined || value === "") return "pending";
  if (value === true || value === 1) return "success";
  if (value === false || value === 0) return "failed";
  const normalized =
    typeof value === "string" ? value.trim().toLowerCase() : value;
  if (
    ["1", "true", "success", "thành công", "synchronized"].includes(normalized)
  ) {
    return "success";
  }
  if (
    ["0", "false", "failed", "thất bại", "error", "fail"].includes(normalized)
  ) {
    return "failed";
  }
  return "pending";
};

const EMPTY_FILTERS = {
  so_ct: "",
  dateRange: null,
  status: "",
  s2: "",
  s3: "",
};

const RetailOrderListModal = ({ isOpen, onClose, onLoadOrder }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;
  const [totalRecords, setTotalRecords] = useState(0);
  const [allData, setAllData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState(EMPTY_FILTERS);

  const filtersStr = JSON.stringify(filters);
  const stableFilters = useMemo(() => JSON.parse(filtersStr), [filtersStr]);
  const dispatch = useDispatch();

  const { id, storeId, unitId } = useSelector(
    (state) => state.claimsReducer.userInfo || {}
  );
  // const tabs = useSelector((state) => state.orders.orders); // Commented out for Tapmed
  const [printMaster, setPrintMaster] = useState({});
  const [printDetail, setPrintDetail] = useState([]);
  const [bankInfo, setBankInfo] = useState(null);
  const printContent = useRef();
  const lastApiCall = useRef({ pageIndex: 0, filters: {} });

  const rawToken = localStorage.getItem("access_token");
  const claims =
    rawToken && rawToken.split(".").length === 3 ? jwt.getClaims?.() || {} : {};
  const fullName = claims?.FullName;

  const getSyncRequestLabel = useCallback(
    (value) => (isSyncRequested(value) ? "Phát hành HĐĐT" : "Không phát hành"),
    []
  );

  const getSyncResultLabel = useCallback((value) => {
    const status = getSyncResultStatus(value);
    if (status === "success") return "Thành công";
    if (status === "failed") return "Thất bại";
    return "Chưa phát hành";
  }, []);

  const [isEditingOrder, setIsEditingOrder] = useState(false);

  // Persist and show active filters like picking list
  const FILTERS_STORAGE_KEY = "retailOrder_filters";

  const saveFiltersToStorage = (f) => {
    try {
      sessionStorage.setItem(
        FILTERS_STORAGE_KEY,
        JSON.stringify({
          so_ct: f.so_ct || "",
          dateRange: f.dateRange || null,
          status: f.status || "",
          s2: f.s2 || "",
          s3: f.s3 || "",
        })
      );
    } catch {}
  };

  const loadFiltersFromStorage = () => {
    try {
      const raw = sessionStorage.getItem(FILTERS_STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return {
        so_ct: parsed.so_ct || "",
        dateRange: parsed.dateRange || null,
        status: parsed.status || "",
        s2: parsed.s2 || "",
        s3: parsed.s3 || "",
      };
    } catch {
      return null;
    }
  };

  const fetchListOrderData = useCallback(
    async (pageIndex = currentPage, customFilters = null) => {
      if (!isOpen || isLoading) return;

      const filtersToUse = customFilters || stableFilters;

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
        const res = await multipleTablePutApi({
          store: "api_get_retail_order",
          param: {
            so_ct: filtersToUse.so_ct || "",
            DateFrom: filtersToUse?.dateRange?.from || "",
            DateTo: filtersToUse?.dateRange?.to || "",
            ma_kh: filtersToUse.ma_kh || "",
            status: filtersToUse.status || "",
            ma_ban: filtersToUse.ma_ban || "",
            s2: filtersToUse.s2 || "",
            s3: filtersToUse.s3 || "",
            pageIndex: pageIndex,
            pageSize: pageSize,
            userId: id,
            unitId: unitId,
            storeId: storeId,
          },
          data: {},
        });

        const updatedData = Array.isArray(res?.listObject[0])
          ? res.listObject[0]
          : [];
        const paginationInfo = res?.listObject[2]?.[0] || {};
        const totalRecords = paginationInfo.totalRecord || updatedData.length;

        setAllData(updatedData);
        setTotalRecords(totalRecords);
        // dispatch(setListOrderInfo(updatedData)); // Commented out for Tapmed
      } catch (err) {
        console.error("Lỗi khi lấy danh sách đơn hàng:", err);
        notification.error({
          message: "Lỗi khi tải danh sách đơn hàng",
          duration: 4,
        });
      } finally {
        setIsLoading(false);
      }
    },
    [
      stableFilters,
      id,
      unitId,
      storeId,
      isOpen,
      isLoading,
      currentPage,
    ]
  );

  // Fetch bank info for printing
  useEffect(() => {
    if (isOpen && unitId) {
      const fetchBankInfo = async () => {
        try {
          const { api_get_thong_tin_ngan_hang } = await import("../../../api");
          const res = await api_get_thong_tin_ngan_hang(unitId);
          if (res?.responseModel?.isSucceded && res?.listObject?.[0]?.[0]) {
            setBankInfo(res.listObject[0][0]);
          }
        } catch (error) {
          console.error(
            "Failed to fetch bank info in RetailOrderListModal:",
            error
          );
        }
      };
      fetchBankInfo();
    }
  }, [isOpen, unitId]);

  useEffect(() => {
    if (isOpen) {
      const loaded = loadFiltersFromStorage();
      if (loaded) {
        setFilters(loaded);
        fetchListOrderData(1, loaded);
      } else {
        fetchListOrderData(1, stableFilters);
      }
    } else {
      setCurrentPage(1);
      setFilters(EMPTY_FILTERS);
      setAllData([]);
      setTotalRecords(0);
      lastApiCall.current = { pageIndex: 0, filters: {} };
    }
  }, [isOpen, fetchListOrderData, stableFilters]);

  const currentData = allData;

  const handleFilter = (key, value, confirm) => {
    confirm();
    let filterValue = value;

    if (filterValue === undefined || filterValue === null) {
      filterValue = "";
    }

    if (key === "s2") {
      if (value === "Synchronize     ") {
        filterValue = "Synchronize     ";
      } else if (value === "*") {
        filterValue = "*";
      } else {
        filterValue = "";
      }
    }
    if (key === "s3") {
      filterValue =
        filterValue === "" || filterValue === null ? "" : String(filterValue);
    }
    let newFilters = { ...filters, [key]: filterValue };
    if (key === "dateRange") {
      if (Array.isArray(value) && value.length === 2) {
        const [from, to] = value;
        newFilters.dateRange = {
          from: dayjs(from, ["MM/DD/YYYY", "DD/MM/YYYY"]).format("MM/DD/YYYY"),
          to: dayjs(to, ["MM/DD/YYYY", "DD/MM/YYYY"]).format("MM/DD/YYYY"),
        };
      } else {
        newFilters.dateRange = null;
      }
    }
    setFilters(newFilters);
    setCurrentPage(1);
    saveFiltersToStorage(newFilters);
    fetchListOrderData(1, newFilters);
  };

  const activeChips = useMemo(() => {
    const chips = [];
    if (stableFilters.so_ct)
      chips.push({ key: "so_ct", label: "Số CT", value: stableFilters.so_ct });
    if (stableFilters.dateRange && stableFilters.dateRange.from && stableFilters.dateRange.to) {
      const [mm1, dd1, y1] = String(stableFilters.dateRange.from).split("/");
      const [mm2, dd2, y2] = String(stableFilters.dateRange.to).split("/");
      const display = `${String(dd1).padStart(2, "0")}/${String(mm1).padStart(
        2,
        "0"
      )}/${y1} - ${String(dd2).padStart(2, "0")}/${String(mm2).padStart(
        2,
        "0"
      )}/${y2}`;
      chips.push({ key: "dateRange", label: "Ngày CT", value: display });
    }
    if (
      stableFilters.status !== "" &&
      stableFilters.status !== null &&
      stableFilters.status !== undefined
    ) {
      const statusMap = { 2: "Hoàn thành", 0: "Chưa hoàn thành" };
      chips.push({
        key: "status",
        label: "Trạng thái",
        value: statusMap[String(stableFilters.status)] || String(stableFilters.status),
      });
    }
    if (stableFilters.s2) {
      chips.push({
        key: "s2",
        label: "Yêu cầu đồng bộ",
        value: getSyncRequestLabel(stableFilters.s2),
      });
    }
    if (stableFilters.s3 !== "" && stableFilters.s3 !== null && stableFilters.s3 !== undefined) {
      chips.push({
        key: "s3",
        label: "Phát hành HĐĐT",
        value: getSyncResultLabel(stableFilters.s3),
      });
    }
    return chips;
  }, [stableFilters, getSyncRequestLabel, getSyncResultLabel]);

  const removeChip = (key) => {
    const newFilters = { ...filters };
    if (key === "dateRange") newFilters.dateRange = null;
    else newFilters[key] = "";
    setFilters(newFilters);
    setCurrentPage(1);
    saveFiltersToStorage(newFilters);
    fetchListOrderData(1, newFilters);
  };

  const clearAllChips = () => {
    const cleared = { so_ct: "", dateRange: null, status: "", s2: "", s3: "" };
    setFilters(cleared);
    setCurrentPage(1);
    try {
      sessionStorage.removeItem(FILTERS_STORAGE_KEY);
    } catch {}
    fetchListOrderData(1, cleared);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchListOrderData(page, filters);
  };

  const groupDetailData = (flatDetailData, useUniqueId = true) => {
    const groupedDetailData = [];

    flatDetailData.forEach((item) => {
      const { ma_vt_root } = item;
      if (!ma_vt_root) {
        groupedDetailData.push({ ...item, extras: [] });
      }
    });

    flatDetailData.forEach((item) => {
      const { ma_vt_root, uniqueid, ma_vt } = item;
      if (ma_vt_root) {
        const parent = groupedDetailData.find((p) =>
          useUniqueId ? p.uniqueid === uniqueid : p.ma_vt === ma_vt_root
        );
        if (parent) {
          parent.extras = parent.extras || [];
          parent.extras.push(item);
        }
      }
    });

    return groupedDetailData;
  };

  const fetchOrderDetail = async (stt_rec) => {
    const res = await multipleTablePutApi({
      store: "api_get_data_detail_retail_order",
      param: { stt_rec },
      data: {},
    });

    if (res?.responseModel?.isSucceded) {
      const masterData = res?.listObject[0]?.[0] || {};
      const flatDetailData = res?.listObject[1] || [];
      return { masterData, flatDetailData };
    }
    throw new Error(
      res?.responseModel?.message || "Lỗi khi tải chi tiết đơn hàng"
    );
  };

  // Helper function to format date as dd/mm/yyyy
  const formatDateToDDMMYYYY = (dateValue) => {
    if (!dateValue) return "";

    const dateStr = String(dateValue).trim();

    // Priority: Try DD/MM/YYYY format first (most common for Vietnamese dates)
    let date = dayjs(dateStr, "DD/MM/YYYY", true);
    if (date.isValid()) {
      return date.format("DD/MM/YYYY");
    }

    // Try other explicit formats
    const formats = [
      "MM/DD/YYYY",
      "YYYY-MM-DD",
      "DD-MM-YYYY",
      "MM-DD-YYYY",
      "YYYY/MM/DD",
      "DD.MM.YYYY",
      "MM.DD.YYYY",
    ];

    for (const format of formats) {
      date = dayjs(dateStr, format, true);
      if (date.isValid()) {
        return date.format("DD/MM/YYYY");
      }
    }

    // Try dayjs parse without format (for ISO strings, etc.)
    date = dayjs(dateStr);
    if (date.isValid()) {
      return date.format("DD/MM/YYYY");
    }

    // Try native Date object
    const nativeDate = new Date(dateStr);
    if (!isNaN(nativeDate.getTime())) {
      return dayjs(nativeDate).format("DD/MM/YYYY");
    }

    const parts = dateStr.match(/(\d{1,2})[-./](\d{1,2})[-./](\d{4})/);
    if (parts && parts.length === 4) {
      const [, p1, p2, year] = parts;
      const num1 = parseInt(p1);
      const num2 = parseInt(p2);

      // If first part > 12, it's definitely day (DD/MM format)
      if (num1 > 12 && num1 <= 31) {
        return `${String(num1).padStart(2, "0")}/${String(num2).padStart(
          2,
          "0"
        )}/${year}`;
      }
      // If second part > 12, it's MM/DD format, swap to DD/MM
      if (num2 > 12 && num2 <= 31) {
        return `${String(num2).padStart(2, "0")}/${String(num1).padStart(
          2,
          "0"
        )}/${year}`;
      }
      // Ambiguous case: both <= 12, assume it's already DD/MM/YYYY
      return `${String(num1).padStart(2, "0")}/${String(num2).padStart(
        2,
        "0"
      )}/${year}`;
    }

    return dateStr;
  };

  const renderSyncRequestTag = (value) => {
    const requested = isSyncRequested(value);
    return (
      <Tag color={requested ? "green" : "red"}>
        {requested ? "Phát hành HĐĐT" : "Không phát hành"}
      </Tag>
    );
  };

  const renderSyncResultTag = (value) => {
    const status = getSyncResultStatus(value);
    if (status === "success") {
      return <Tag color="green">Thành công</Tag>;
    }
    if (status === "failed") {
      return <Tag color="red">Thất bại</Tag>;
    }
    return <Tag>Chưa đồng bộ</Tag>;
  };

  const columns = [
    {
      title: "STT",
      dataIndex: "stt",
      key: "stt",
      render: (_, __, index) => (currentPage - 1) * pageSize + index + 1,
      width: 80,
      align: "center",
    },
    {
      title: "Đơn vị",
      dataIndex: "ma_dvcs",
      key: "ma_dvcs",
      align: "center",
      render: (text, record) =>
        (typeof text === "string" && text.trim()) ||
        (typeof record?.ma_dvcs === "string"
          ? record.ma_dvcs.trim()
          : record?.ma_dvcs) ||
        "",
    },
    {
      title: "Số chứng từ",
      dataIndex: "so_ct",
      key: "so_ct",
      align: "center",
      render: (text) => (typeof text === "string" ? text.trim() : text),
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) => (
        <div className="filter-dropdown">
          <Input
            placeholder="Tìm kiếm Số CT"
            value={selectedKeys[0]}
            onChange={(e) =>
              setSelectedKeys(e.target.value ? [e.target.value] : [])
            }
            onPressEnter={() => handleFilter("so_ct", selectedKeys[0], confirm)}
          />
          <Button
            className="search_button"
            type="primary"
            onClick={() => handleFilter("so_ct", selectedKeys[0], confirm)}
            size="small"
          >
            Tìm kiếm
          </Button>
        </div>
      ),
    },
    {
      title: "Ngày chứng từ",
      dataIndex: "ngay_ct",
      key: "ngay_ct",
      align: "center",
      render: (text) => formatDateToDDMMYYYY(text),
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) => (
        <div className="filter-dropdown">
          <DatePicker.RangePicker
            inputReadOnly
            value={
              selectedKeys.length === 2
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
        filters.dateRange && filters.dateRange.from && filters.dateRange.to
          ? [
              dayjs(filters.dateRange.from, "MM/DD/YYYY").format("DD/MM/YYYY"),
              dayjs(filters.dateRange.to, "MM/DD/YYYY").format("DD/MM/YYYY"),
            ]
          : null,
    },
    {
      title: "Tổng thanh toán",
      dataIndex: "t_tt",
      key: "t_tt",
      align: "center",
      render: (value) => `${value?.toLocaleString() || 0} VND`,
    },
    {
      title: "Nhân viên",
      dataIndex: "username",
      key: "username",
      align: "center",
      render: (text) => (typeof text === "string" ? text.trim() : text),
    },
    {
      title: "Yêu cầu đồng bộ",
      dataIndex: "s2",
      key: "syncRequest",
      align: "center",
      render: (value) => renderSyncRequestTag(value),
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) => (
        <div className="filter-dropdown">
          <Select
            placeholder="Chọn trạng thái"
            value={selectedKeys[0]}
            onChange={(val) => setSelectedKeys(val !== undefined ? [val] : [])}
            allowClear
          >
            <Select.Option value="Synchronize     ">Phát hành HĐĐT</Select.Option>
            <Select.Option value="*">Không phát hành</Select.Option>
          </Select>
          <Button
            className="search_button"
            type="primary"
            onClick={() => handleFilter("s2", selectedKeys[0], confirm)}
            size="small"
          >
            Tìm kiếm
          </Button>
        </div>
      ),
      filteredValue: filters.s2 ? [filters.s2] : null,
    },
    {
      title: "Phát hành HĐĐT",
      dataIndex: "s3",
      key: "syncStatus",
      align: "center",
      render: (value) => renderSyncResultTag(value),
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) => (
        <div className="filter-dropdown">
          <Select
            placeholder="Chọn kết quả"
            value={selectedKeys[0]}
            onChange={(val) => setSelectedKeys(val !== undefined ? [val] : [])}
            allowClear
          >
            <Select.Option value="1">Thành công</Select.Option>
            <Select.Option value="0">Thất bại</Select.Option>
          </Select>
          <Button
            className="search_button"
            type="primary"
            onClick={() => handleFilter("s3", selectedKeys[0], confirm)}
            size="small"
          >
            Tìm kiếm
          </Button>
        </div>
      ),
      filteredValue:
        filters.s3 !== "" && filters.s3 !== null && filters.s3 !== undefined
          ? [filters.s3]
          : null,
    },
    {
      title: "Trạng thái",
      dataIndex: "statusName",
      key: "statusName",
      align: "center",
      render: (text) => (
        <Tag color={text === "Hoàn thành" ? "green" : "yellow"}>{text}</Tag>
      ),
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) => (
        <div className="filter-dropdown">
          <Select
            placeholder="Chọn trạng thái"
            value={selectedKeys[0]}
            onChange={(value) => setSelectedKeys(value ? [value] : [])}
          >
            <Select.Option value="2">Hoàn thành</Select.Option>
            <Select.Option value="0">Chưa hoàn thành</Select.Option>
          </Select>
          <Button
            className="search_button"
            type="primary"
            onClick={() => handleFilter("status", selectedKeys[0], confirm)}
            size="small"
          >
            Tìm kiếm
          </Button>
        </div>
      ),
      filteredValue: filters.status ? [filters.status] : null,
    },
    {
      title: "Chức năng",
      key: "action",
      width: 120,
      className: "action-col",
      align: "center",
      render: (_, record) => (
        <div className="action-buttons">
          <Button
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            type="danger"
            size="small"
            className="edit_button"
            disabled={
              isEditingOrder || (record.status === "2" && record.s3 === true)
            }
          />
          <Button
            icon={<PrinterOutlined />}
            onClick={() => handleReprint(record)}
            size="small"
            type="primary"
            className="print_button"
          />
          <Button
            icon={<CheckOutlined />}
            onClick={() => handleApprove(record)}
            size="small"
            type="primary"
            className="approve_button"
            disabled={record.status !== "0"}
          />
        </div>
      ),
    },
  ];

  const handleEdit = async (record) => {
    if (isEditingOrder) return;
    setIsEditingOrder(true);
    try {
      const { masterData, flatDetailData } = await fetchOrderDetail(
        record.stt_rec
      );
      const detailData = groupDetailData(flatDetailData, true);

      // Merge masterData với record để đảm bảo có đủ thông tin khách hàng
      const mergedMasterData = {
        ...masterData,
        // Fallback từ record nếu masterData không có
        ten_kh: masterData.ten_kh || record.ten_kh,
        ong_ba: masterData.ong_ba || record.ong_ba,
        ma_kh: masterData.ma_kh || record.ma_kh,
        cccd: masterData.cccd || record.cccd,
        so_dt: masterData.so_dt || record.so_dt,
        dia_chi: masterData.dia_chi || record.dia_chi,
        email: masterData.email || record.email,
        ma_so_thue_kh: masterData.ma_so_thue_kh || record.ma_so_thue_kh,
        ten_dv_kh: masterData.ten_dv_kh || record.ten_dv_kh,
      };

      const tableData = {
        name: mergedMasterData.ma_ban,
        id: mergedMasterData.ma_ban,
      };

      // Commented out tab management for Tapmed
      // const internalId = `${tableData.id}_${Date.now()}`;
      // dispatch(
      //   addTab({
      //     tableName: tableData.name,
      //     tableId: tableData.id,
      //     isRealtime: false,
      //     internalId,
      //     master: mergedMasterData,
      //     detail: detailData,
      //   })
      // );
      // dispatch(switchTab(internalId));

      // Gọi callback để load dữ liệu vào POS nếu có
      if (typeof onLoadOrder === "function") {
        onLoadOrder({ master: mergedMasterData, detail: detailData });
      } else {
        notification.success({
          message: "Đã mở đơn hàng",
          description: `Đơn hàng ${record.so_ct} đã được mở`,
        });
      }
      onClose();
    } catch (err) {
      console.error("Lỗi khi gọi API chi tiết đơn hàng:", err);
      notification.error({
        message: "Lỗi khi tải chi tiết đơn hàng",
        duration: 4,
      });
    } finally {
      setIsEditingOrder(false);
    }
  };

  const handleReprint = async (record) => {
    try {
      const { masterData, flatDetailData } = await fetchOrderDetail(
        record.stt_rec
      );
      const groupedDetailData = groupDetailData(flatDetailData, true);

      // Merge masterData với record để đảm bảo có đủ thông tin khách hàng
      const mergedMasterData = {
        ...masterData,
        // Fallback từ record nếu masterData không có
        ten_kh: masterData.ten_kh || record.ten_kh,
        ong_ba: masterData.ong_ba || record.ong_ba,
        ma_kh: masterData.ma_kh || record.ma_kh,
        cccd: masterData.cccd || record.cccd,
        so_dt: masterData.so_dt || record.so_dt,
        dia_chi: masterData.dia_chi || record.dia_chi,
        email: masterData.email || record.email,
        ma_so_thue_kh: masterData.ma_so_thue_kh || record.ma_so_thue_kh,
        ten_dv_kh: masterData.ten_dv_kh || record.ten_dv_kh,
      };

      setPrintMaster(mergedMasterData);
      setPrintDetail(groupedDetailData);

      setTimeout(() => {
        handlePrint();
      }, 300);
    } catch (error) {
      console.error("Lỗi khi in lại hóa đơn:", error);
      notification.error({
        message: "Lỗi khi in lại hóa đơn",
        duration: 4,
      });
    }
  };

  const handleApprove = async (record) => {
    showConfirm({
      title: `Bạn có chắc chắn muốn thanh toán đơn hàng có số chứng từ: ${record.so_ct}?`,
      type: "success",
      onOk: async () => {
        if (isEditingOrder) return;
        setIsEditingOrder(true);
        try {
          // Commented out tab check for Tapmed
          // const existingTab = tabs.some(
          //   (tab) => tab.master.stt_rec === record.stt_rec
          // );
          // if (existingTab) {
          //   notification.error({
          //     message: "Tab đã tồn tại!",
          //     duration: 3,
          //   });
          //   setIsEditingOrder(false);
          //   return;
          // }
          const { masterData, flatDetailData } = await fetchOrderDetail(
            record.stt_rec
          );
          const detailData = groupDetailData(flatDetailData, true);

          // Merge masterData với record để đảm bảo có đủ thông tin khách hàng
          const mergedMasterData = {
            ...masterData,
            // Fallback từ record nếu masterData không có
            ten_kh: masterData.ten_kh || record.ten_kh,
            ong_ba: masterData.ong_ba || record.ong_ba,
            ma_kh: masterData.ma_kh || record.ma_kh,
            cccd: masterData.cccd || record.cccd,
            so_dt: masterData.so_dt || record.so_dt,
            dia_chi: masterData.dia_chi || record.dia_chi,
            email: masterData.email || record.email,
            ma_so_thue_kh: masterData.ma_so_thue_kh || record.ma_so_thue_kh,
            ten_dv_kh: masterData.ten_dv_kh || record.ten_dv_kh,
          };

          const tableData = {
            name: mergedMasterData.ma_ban,
            id: mergedMasterData.ma_ban,
          };
          // Commented out tab management for Tapmed
          // const internalId = `${tableData.id}_${Date.now()}`;
          // dispatch(
          //   addTab({
          //     tableName: tableData.name,
          //     tableId: tableData.id,
          //     isRealtime: false,
          //     internalId,
          //     master: mergedMasterData,
          //     detail: detailData,
          //     autoOpenPayment: true,
          //   })
          // );
          // dispatch(switchTab(internalId));

          // Push data to POS and open payment modal directly
          if (typeof onLoadOrder === "function") {
            onLoadOrder({ master: mergedMasterData, detail: detailData });
          }
          try {
            const { default: emitter } = await import("../../../utils/emitter");
            emitter.emit("OPEN_PAYMENT_MODAL");
          } catch (e) {}
          onClose();
        } catch (err) {
          notification.error({
            message: "Lỗi khi tải chi tiết đơn hàng hoặc mở tab mới",
            duration: 4,
          });
        } finally {
          setIsEditingOrder(false);
        }
      },
    });
  };

  const handlePrint = useReactToPrint({
    content: () => printContent.current,
    documentTitle: "Print This Document",
    copyStyles: false,
  });

  return (
    <>
      <Modal
        open={isOpen}
        width="95%"
        title="Danh sách đơn hàng"
        destroyOnHidden
        onCancel={onClose}
        footer={null}
        centered
      >
        <div className="retail__modal__Container">
          {activeChips.length > 0 && (
            <div className="filter-chips-container">
              <div className="filter-chips-left">
                <div className="filter-chips-header">
                  <FilterOutlined className="filter-chips-icon" />
                  <span className="filter-chips-title">
                    Đang áp dụng <strong>{activeChips.length}</strong> bộ lọc
                  </span>
                </div>
                <div className="filter-chips-list">
                  {activeChips.map((chip) => (
                    <Tag
                      key={chip.key}
                      closable
                      onClose={(e) => {
                        e.preventDefault();
                        removeChip(chip.key);
                      }}
                      className="filter-chip"
                    >
                      {chip.label}: {chip.value}
                    </Tag>
                  ))}
                </div>
              </div>
              <div className="filter-chips-right">
                <Button size="small" onClick={clearAllChips}>
                  Xóa lọc
                </Button>
              </div>
            </div>
          )}
          {isLoading ? (
            <Spin size="large" />
          ) : (
            <div className="retail-order-table-wrapper">
              <Table
                dataSource={currentData}
                columns={columns}
                rowKey="stt_rec"
                className="retail-order-table"
                size="small"
                tableLayout="auto"
                pagination={false}
              />
              <div className="retail-pagination-bar">
                <Pagination
                  current={currentPage}
                  pageSize={pageSize}
                  total={totalRecords}
                  showSizeChanger={false}
                  showQuickJumper={false}
                  showTotal={(total, range) =>
                    `${range[0]}-${range[1]} của ${total} đơn hàng`
                  }
                  onChange={handlePageChange}
                />
              </div>
            </div>
          )}
        </div>
      </Modal>
      <div style={{ display: "none" }}>
        <PrintComponent
          ref={printContent}
          master={printMaster}
          detail={printDetail}
          bankInfo={bankInfo}
          fullName={fullName}
        />
      </div>
    </>
  );
};

export default RetailOrderListModal;
