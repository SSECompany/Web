import { Button, DatePicker, Input, Modal, Space, Table } from "antd";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { multipleTablePutApi } from "../../../../api";
import { formatNumber } from "../../../../app/hook/dataFormatHelper";
import "./ReportModal.css";

const DEFAULT_FILTERS = {
  so_ct: "",
  ma_ban: "",
  ten_vt: "",
  nh_vt1: "",
};

const SUMMARY_FIELDS = [
  "ten_nhan_vien",
  "ma_ban",
  "so_ct",
  "ngay_ct",
  "datetime2",
  "nh_vt1",
  "so_luong",
  "gia_ban",
  "thanh_tien",
  "ck_nt",
  "tien_mat",
  "tien_ck",
  "ap_voucher",
  "cong_no",
];

const MONEY_FIELDS = ["gia_ban", "thanh_tien", "ck_nt", "tien_mat", "tien_ck", "cong_no"];

const formatDate = (date) => {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

const formatDateTime = (datetime) => {
  if (!datetime) return datetime;
  return datetime.split("T")[1]?.split(".")[0] || datetime;
};

const isVoucherApplied = (ap_voucher) => {
  return (
    ap_voucher === 1 ||
    ap_voucher === "1" ||
    String(ap_voucher).toLowerCase() === "x"
  );
};

const CELL_STYLE = { textAlign: "center" };
const BOLD_CELL_STYLE = { fontWeight: "bold", textAlign: "center" };

const ReportModal = ({ isOpen, onClose, unitId, id }) => {
  const [dataSource, setDataSource] = useState([]);
  const [filters, setFilters] = useState(() => ({ ...DEFAULT_FILTERS }));
  const [dateRange, setDateRange] = useState([
    formatDate(new Date()),
    formatDate(new Date()),
  ]);
  const filtersRef = useRef(filters);
  const fetchDataRef = useRef(() => {});

  const fetchData = useCallback(
    async (overrideDateRange, overrideFilters) => {
      try {
        const effectiveFilters = overrideFilters || filtersRef.current;
        const effectiveRange =
          overrideDateRange || dateRange || [formatDate(new Date()), formatDate(new Date())];

        const [fromDate, toDate] = effectiveRange;

        const res = await multipleTablePutApi({
          store: "api_get_pos_order_manv",
          param: {
            so_ct: effectiveFilters.so_ct?.trim() || "",
            ma_kh: "",
            ten_kh: "",
            dien_thoai: "",
            DateFrom: fromDate,
            DateTo: toDate,
            ngay_ct: "",
            PageIndex: 1,
            PageSize: 1000,
            StoreId: "",
            UnitId: unitId,
            Status: "",
            Userid: id,
            username: "",
            ma_ban: effectiveFilters.ma_ban?.trim() || "",
            ten_vt: effectiveFilters.ten_vt?.trim() || "",
            nh_vt1: effectiveFilters.nh_vt1?.trim() || "",
          },
          data: {},
        });

        let groupIndex = 1;
        const fetchedData =
          res?.listObject?.[0]?.map((item, index) => {
            const row = { ...item, key: index };
            if (row.systotal === 0) {
              row.indexDisplay = groupIndex++;
            }
            return row;
          }) || [];
        setDataSource(fetchedData);
      } catch (err) {
        console.error("❌ Lỗi khi lấy dữ liệu:", err);
      }
    },
    [unitId, id, dateRange]
  );

  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  useEffect(() => {
    fetchDataRef.current = fetchData;
  }, [fetchData]);

  const applyFilter = useCallback(
    (key, value) => {
      const trimmedValue = value?.trim() || "";
      setFilters((prev) => {
        const next = { ...prev, [key]: trimmedValue };
        filtersRef.current = next;
        fetchData(undefined, next);
        return next;
      });
    },
    [fetchData]
  );

  const renderTextFilterDropdown = useCallback(
    (dataIndex, placeholder) => {
      return ({ setSelectedKeys, selectedKeys, confirm }) => (
        <div className="report-modal_filterDropdown">
          <Space direction="vertical" size={8} style={{ width: "100%" }}>
            <Input
              placeholder={placeholder}
              value={selectedKeys?.[0] || ""}
              onChange={(event) => {
                const { value } = event.target;
                setSelectedKeys(value ? [value] : []);
              }}
              onPressEnter={() => {
                confirm({ closeDropdown: true });
                applyFilter(dataIndex, selectedKeys?.[0] || "");
              }}
              allowClear
            />
            <div className="report-modal_filterActions">
              <Button
                type="primary"
                size="small"
                onClick={() => {
                  confirm({ closeDropdown: true });
                  applyFilter(dataIndex, selectedKeys?.[0] || "");
                }}
              >
                Tìm kiếm
              </Button>
              <Button
                size="small"
                onClick={() => {
                  setSelectedKeys([]);
                  confirm({ closeDropdown: true });
                  applyFilter(dataIndex, "");
                }}
              >
                Làm mới
              </Button>
            </div>
          </Space>
        </div>
      );
    },
    [applyFilter]
  );

  const columns = useMemo(
    () => [
      { title: "STT", dataIndex: "fake_stt", key: "fake_stt", width: 70, ellipsis: false },
      {
        title: "Tên nhân viên",
        dataIndex: "ten_nhan_vien",
        key: "ten_nhan_vien",
        width: 160,
        ellipsis: false,
      },
      {
        title: "Mã bàn",
        dataIndex: "ma_ban",
        key: "ma_ban",
        width: 110,
        ellipsis: false,
        filteredValue: filters.ma_ban ? [filters.ma_ban] : null,
        filterDropdown: renderTextFilterDropdown("ma_ban", "Nhập mã bàn"),
      },
      {
        title: "Số CT",
        dataIndex: "so_ct",
        key: "so_ct",
        width: 110,
        ellipsis: false,
        filteredValue: filters.so_ct ? [filters.so_ct] : null,
        filterDropdown: renderTextFilterDropdown("so_ct", "Nhập số CT"),
      },
      {
        title: "Ngày CT",
        dataIndex: "ngay_ct",
        key: "ngay_ct",
        width: 200,
        ellipsis: false,
        filteredValue: dateRange && dateRange.length === 2 ? [dateRange.join(" - ")] : null,
        filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) => (
          <div className="report-modal_filterDropdown">
            <Space direction="vertical" size={8} style={{ width: "100%" }}>
              <DatePicker.RangePicker
                inputReadOnly
                format="DD/MM/YYYY"
                placeholder={["Từ ngày", "Đến ngày"]}
                style={{ width: "100%" }}
                onChange={(dates) => {
                  if (dates && dates.length === 2) {
                    const from = dates[0].format("DD/MM/YYYY");
                    const to = dates[1].format("DD/MM/YYYY");
                    setSelectedKeys([`${from} - ${to}`]);
                  } else {
                    setSelectedKeys([]);
                  }
                }}
              />
              <div className="report-modal_filterActions">
                <Button
                  type="primary"
                  size="small"
                  onClick={() => {
                    confirm({ closeDropdown: true });
                    const value = selectedKeys?.[0] || "";
                    if (value) {
                      const [from, to] = value.split(" - ");
                      const newRange = [from || formatDate(new Date()), to || from || formatDate(new Date())];
                      setDateRange(newRange);
                      fetchData(newRange);
                    }
                  }}
                >
                  Tìm kiếm
                </Button>
                <Button
                  size="small"
                  onClick={() => {
                    setSelectedKeys([]);
                    confirm({ closeDropdown: true });
                    const today = formatDate(new Date());
                    const newRange = [today, today];
                    setDateRange(newRange);
                    fetchData(newRange);
                  }}
                >
                  Làm mới
                </Button>
              </div>
            </Space>
          </div>
        ),
      },
      {
        title: "Thời gian",
        dataIndex: "datetime2",
        key: "datetime2",
        width: 140,
        ellipsis: false,
      },
      {
        title: "Tên món",
        dataIndex: "ten_mon",
        key: "ten_mon",
        width: 160,
        ellipsis: false,
        filteredValue: filters.ten_vt ? [filters.ten_vt] : null,
        filterDropdown: renderTextFilterDropdown("ten_vt", "Nhập tên món"),
      },
      {
        title: "Nhóm món",
        dataIndex: "nh_vt1",
        key: "nh_vt1",
        width: 150,
        ellipsis: false,
        filteredValue: filters.nh_vt1 ? [filters.nh_vt1] : null,
        filterDropdown: renderTextFilterDropdown("nh_vt1", "Nhập nhóm món"),
      },
      {
        title: "Số lượng",
        dataIndex: "so_luong",
        key: "so_luong",
        width: 110,
        ellipsis: false,
      },
      { title: "Giá bán", dataIndex: "gia_ban", key: "gia_ban", width: 110, ellipsis: false },
      {
        title: "Thành tiền",
        dataIndex: "thanh_tien",
        key: "thanh_tien",
        width: 130,
        ellipsis: false,
      },
      {
        title: "Tiền chiết khấu",
        dataIndex: "ck_nt",
        key: "ck_nt",
        width: 160,
        ellipsis: false,
      },
      {
        title: "Tiền mặt",
        dataIndex: "tien_mat",
        key: "tien_mat",
        width: 130,
        ellipsis: false,
      },
      { title: "Tiền CK", dataIndex: "tien_ck", key: "tien_ck", width: 110, ellipsis: false },
      {
        title: "Công nợ",
        dataIndex: "cong_no",
        key: "cong_no",
        width: 130,
        ellipsis: false,
      },
      {
        title: "Áp voucher",
        dataIndex: "ap_voucher",
        key: "ap_voucher",
        width: 130,
        ellipsis: false,
      },
      {
        title: "SysTotal",
        dataIndex: "systotal",
        key: "systotal",
        hidden: true,
      },
    ],
    [filters, renderTextFilterDropdown, dateRange, fetchData]
  );

  const formatCellText = useCallback((col, text, record) => {
    if (col.dataIndex === "ap_voucher") {
      return isVoucherApplied(text) ? "x" : "";
    }
    if (col.dataIndex === "datetime2" && text) {
      return formatDateTime(text);
    }
    if (MONEY_FIELDS.includes(col.dataIndex) && !isNaN(text)) {
      return formatNumber(text);
    }
    return text;
  }, []);

  const renderCellContent = useCallback(
    (text, record, col) => {
      if (col.dataIndex === "systotal") return null;

      if (record.systotal === 0) {
        if (col.dataIndex === "fake_stt") {
          return (
            <div style={CELL_STYLE}>
              <strong>
                <i>{record.indexDisplay}</i>
              </strong>
            </div>
          );
        }

        if (SUMMARY_FIELDS.includes(col.dataIndex)) {
          const formattedText = formatCellText(col, text, record);
          return (
            <div style={BOLD_CELL_STYLE}>
              <strong>
                <i>{formattedText}</i>
              </strong>
            </div>
          );
        }
      }

      if (col.dataIndex === "ap_voucher") {
        const display = isVoucherApplied(text) ? "x" : "";
        const cellStyle = record.systotal === 0 ? BOLD_CELL_STYLE : CELL_STYLE;
        return <div style={cellStyle}>{display}</div>;
      }

      if (MONEY_FIELDS.includes(col.dataIndex) && !isNaN(text)) {
        return <div style={CELL_STYLE}>{formatNumber(text)}</div>;
      }

      if (col.dataIndex === "datetime2" && text) {
        return <div style={CELL_STYLE}>{formatDateTime(text)}</div>;
      }

      return <div style={CELL_STYLE}>{text}</div>;
    },
    [formatCellText]
  );

  const optimizedColumns = useMemo(
    () =>
      columns
        .filter((col) => !col.hidden)
        .map((col) => ({
          ...col,
          align: "center",
          onCell: (record) => ({ record }),
          render: (text, record) => renderCellContent(text, record, col),
        })),
    [columns, renderCellContent]
  );

  useEffect(() => {
    if (isOpen) {
      fetchDataRef.current();
    }
  }, [isOpen]);

  return (
    <Modal
      open={isOpen}
      width={"95%"}
      title="Bảng kê hóa đơn"
      destroyOnClose
      onCancel={onClose}
      centered
      footer={null}
    >
      <div className="report-modal_Container">
        <Table
          className="report-modal-table"
          columns={optimizedColumns}
          dataSource={dataSource}
          pagination={false}
          width="100%"
          rowKey="key"
          rowClassName={(record) =>
            record.systotal === 0 ? "summary-row group-row" : ""
          }
          scroll={{ x: "max-content", y: 450 }}
          summary={(pageData) => {
            const totals = pageData.reduce(
              (acc, item) => {
                const {
                  systotal,
                  so_luong,
                  thanh_tien,
                  ck_nt,
                  tien_mat,
                  tien_ck,
                  cong_no,
                  ap_voucher,
                } = item;

                if (systotal === 0) {
                  acc.totalSoLuong += Number(so_luong) || 0;
                  acc.totalThanhTien += Number(thanh_tien) || 0;
                  acc.totalTienChietKhau += Number(ck_nt) || 0;
                  acc.totalTienMat += Number(tien_mat) || 0;
                  acc.totalTienCK += Number(tien_ck) || 0;
                  acc.totalCongNo += Number(cong_no) || 0;
                } else {
                  if (isVoucherApplied(ap_voucher)) {
                    acc.totalApVoucher += 1;
                  }
                }

                return acc;
              },
              {
                totalSoLuong: 0,
                totalThanhTien: 0,
                totalTienChietKhau: 0,
                totalTienMat: 0,
                totalTienCK: 0,
                totalCongNo: 0,
                totalApVoucher: 0,
              }
            );

            return (
              <Table.Summary.Row>
                {columns
                  .filter((col) => !col.hidden)
                  .map((col, idx) => {
                    const { dataIndex } = col;

                    const cellValueMap = {
                      fake_stt: <strong>Tổng</strong>,
                      so_luong: (
                        <strong>{formatNumber(totals.totalSoLuong)}</strong>
                      ),
                      thanh_tien: (
                        <strong>{formatNumber(totals.totalThanhTien)}</strong>
                      ),
                      ck_nt: (
                        <strong>
                          {formatNumber(totals.totalTienChietKhau)}
                        </strong>
                      ),
                      tien_mat: (
                        <strong>{formatNumber(totals.totalTienMat)}</strong>
                      ),
                      tien_ck: (
                        <strong>{formatNumber(totals.totalTienCK)}</strong>
                      ),
                      cong_no: (
                        <strong>{formatNumber(totals.totalCongNo)}</strong>
                      ),
                      ap_voucher: <strong>{totals.totalApVoucher}</strong>,
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
    </Modal>
  );
};

export default ReportModal;
