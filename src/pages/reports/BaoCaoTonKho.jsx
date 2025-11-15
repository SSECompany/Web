import { Button, Card, DatePicker, Input, Select, Spin, Table, Typography } from "antd";
import dayjs from "dayjs";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { multipleTablePutApi } from "../../api";
import { formatNumber } from "../../pharmacy-utils/hook/dataFormatHelper";
import "./BaoCaoTonKho.css";

const { Title } = Typography;

const CELL_STYLE = { textAlign: "center" };
const BOLD_CELL_STYLE = { fontWeight: "bold", textAlign: "center" };

const formatDate = (date) => {
  if (!date) return "";
  const d = dayjs(date);
  return d.format("YYYY-MM-DD HH:mm:ss.SSS");
};

const BaoCaoTonKho = () => {
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
  
  // Loading states for selectboxes
  const [loadingKho, setLoadingKho] = useState(false);
  const [loadingNhomVatTu, setLoadingNhomVatTu] = useState(false);
  const [loadingDvcs, setLoadingDvcs] = useState(false);
  
  // Search refs for debounce
  const khoSearchRef = useRef(null);
  const nhomVatTuSearchRef = useRef(null);
  const dvcsSearchRef = useRef(null);
  
  // Loại nhóm vật tư mặc định là 1
  const loaiNhomVatTu = 1;
  
  const [filters, setFilters] = useState({
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

  // Fetch danh sách kho
  const fetchKhoOptions = useCallback(async (searchValue = "") => {
    if (!unitId) return;
    setLoadingKho(true);
    try {
      const res = await multipleTablePutApi({
        store: "api_getKho",
        param: {
          unitId: unitId,
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
  }, [unitId]);

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

  const fetchData = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const res = await multipleTablePutApi({
        store: "api_rs_rptStockReport",
        param: {
          DateTo: filters.DateTo,
          Site: filters.Site || "",
          Item: "",
          ItemGroup1: filters.ItemGroup1 || "",
          ItemGroup2: filters.ItemGroup2 || "",
          ItemGroup3: filters.ItemGroup3 || "",
          nh_theo: filters.nh_theo || 0,
          tt_sx1: filters.tt_sx1 || 0,
          tt_sx2: filters.tt_sx2 || 0,
          tt_sx3: filters.tt_sx3 || 0,
          Unit:
            Array.isArray(filters.Unit) && filters.Unit.length
              ? filters.Unit.join(",")
              : "",
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
      
      // Lấy total từ response nếu có
      const total = res?.total || res?.totalRecords || fetchedData.length;
      setTotalRecords(total);

      // Loại bỏ các dòng hoàn toàn trống (không có mã và tên)
      const cleanedData = fetchedData.filter((item) => {
        const ma = (item.ma_vt || "").trim();
        const ten = (item.ten_vt || "").trim();
        return ma || ten;
      });

      // Format data với key và tính toán giá trị
      // API có thể trả về các field: ma_vt, ten_vt, dvt, so_luong, don_gia, gia_tri, etc.
      const formattedData = cleanedData.map((item, index) => {
        const ma = (item.ma_vt || "").trim();
        const ten = (item.ten_vt || "").trim();
        const dvt = (item.dvt || "").trim();
        const isSummaryRow =
          item.systotal === 0 &&
          !ma &&
          ten.toLowerCase().includes("tổng");

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
      });

      setDataSource(formattedData);
    } catch (err) {
      console.error("❌ Lỗi khi lấy dữ liệu tồn kho:", err);
      setDataSource([]);
    } finally {
      setLoading(false);
    }
  }, [filters, userId, unitId, currentPage, pageSize]);

  const [tableFilters, setTableFilters] = useState({
    ma_vt: "",
    ten_vt: "",
    dvt: "",
  });

  const columns = useMemo(
    () => [
      {
        title: "Stt",
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
        title: "Đvt",
        dataIndex: "dvt",
        key: "dvt",
        width: 100,
        filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) => (
          <div style={{ padding: 8 }}>
            <Input
              placeholder="Tìm đơn vị"
              value={selectedKeys[0]}
              onChange={(e) =>
                setSelectedKeys(e.target.value ? [e.target.value] : [])
              }
              onPressEnter={() => {
                confirm();
                setTableFilters((prev) => ({
                  ...prev,
                  dvt: selectedKeys[0] || "",
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
                  dvt: selectedKeys[0] || "",
                }));
              }}
              size="small"
              style={{ width: "100%" }}
            >
              Tìm kiếm
            </Button>
          </div>
        ),
        filteredValue: tableFilters.dvt ? [tableFilters.dvt] : null,
        onFilter: (value, record) =>
          record.dvt?.toString().toLowerCase().includes(value.toLowerCase()),
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
      return <div style={{ textAlign: "left", paddingLeft: "8px" }}>{text}</div>;
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
  }, [fetchKhoOptions, fetchNhomVatTuOptions]);

  // Load dvcs options on mount - tách riêng để đảm bảo được gọi
  useEffect(() => {
    fetchDvcsOptions();
  }, [fetchDvcsOptions]);

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

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
    setCurrentPage(1); // Reset về trang 1 khi filter thay đổi
  };

  const handleDateChange = (date) => {
    if (date) {
      handleFilterChange("DateTo", formatDate(date));
    } else {
      handleFilterChange("DateTo", formatDate(dayjs()));
    }
  };

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
                onDropdownVisibleChange={(open) => {
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
                onDropdownVisibleChange={(open) => {
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
                onDropdownVisibleChange={(open) => {
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
                onDropdownVisibleChange={(open) => {
                  if (open) fetchNhomVatTuOptions(3);
                }}
                options={nhomVatTuOptions[3] || []}
                notFoundContent={
                  loadingNhomVatTu ? <Spin size="small" /> : "Không tìm thấy"
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
                  if (dvcsSearchRef.current) clearTimeout(dvcsSearchRef.current);
                  dvcsSearchRef.current = setTimeout(() => {
                    fetchDvcsOptions(value);
                  }, 300);
                }}
                onDropdownVisibleChange={(open) => {
                  if (open) fetchDvcsOptions();
                }}
                options={dvcsOptions}
                notFoundContent={
                  loadingDvcs ? <Spin size="small" /> : "Không tìm thấy"
                }
              />
            </div>
            <div className="filter-item">
              <label>Mã vật tư:</label>
              <Input
                value={filters.Item}
                onChange={(e) => handleFilterChange("Item", e.target.value)}
                placeholder="Nhập mã vật tư"
                allowClear
              />
            </div>
            <div className="filter-item button-item">
              <Button type="primary" onClick={fetchData} loading={loading}>
                Tải dữ liệu
              </Button>
            </div>
          </div>
        </div>

        <div className="report-modal_Container">
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
            summary={(pageData) => {
              const summarySoLuong =
                totals.apiTotalSoLuong || totals.totalSoLuong;
              const summaryGiaTri =
                totals.apiTotalGiaTri || totals.totalGiaTri;
              return (
                <Table.Summary.Row>
                  {columns.map((col, idx) => {
                    const { dataIndex } = col;

                    const cellValueMap = {
                      stt: <strong>Tổng cộng</strong>,
                      so_luong: (
                        <strong>{formatNumber(summarySoLuong)}</strong>
                      ),
                      gia_tri: (
                        <strong>{formatNumber(summaryGiaTri)}</strong>
                      ),
                    };

                    const cellValue = cellValueMap[dataIndex];

                    return (
                      <Table.Summary.Cell key={idx}>
                        {cellValue || null}
                      </Table.Summary.Cell>
                    );
                  })}
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
