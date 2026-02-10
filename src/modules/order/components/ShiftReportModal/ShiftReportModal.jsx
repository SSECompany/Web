import { PrinterOutlined } from "@ant-design/icons";
import {
  Button,
  DatePicker,
  InputNumber,
  Modal,
  Space,
  Spin,
  Table,
} from "antd";
import dayjs from "dayjs";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useReactToPrint } from "react-to-print";
import { multipleTablePutApi } from "../../../../api";
import { formatNumber } from "../../../../app/hook/dataFormatHelper";
import PrintComponent from "./PrintComponent";
import "./ShiftReportModal.css";

const DEFAULT_DATE_FORMAT = "DD/MM/YYYY";

const formatDate = (date) => dayjs(date).format(DEFAULT_DATE_FORMAT);

const formatDateTime = (value) => {
  if (!value) return "--";
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format("DD/MM/YYYY HH:mm:ss") : value;
};

const isVoucherApplied = (ap_voucher) => {
  if (ap_voucher === undefined || ap_voucher === null) return false;
  const normalized = String(ap_voucher).trim().toLowerCase();
  return normalized === "1" || normalized === "x" || normalized === "true";
};

const ShiftReportModal = ({ isOpen, onClose, unitId, userId, cashierName }) => {
  const [selectedDate, setSelectedDate] = useState(() =>
    formatDate(new Date())
  );
  const [openingBalance, setOpeningBalance] = useState(500000);
  const [summaryData, setSummaryData] = useState(null);
  const [categoryData, setCategoryData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [printTimestamp, setPrintTimestamp] = useState(
    dayjs().format("DD/MM/YYYY HH:mm:ss")
  );
  const printContent = useRef(null);

  const fetchReportData = useCallback(
    async (customDate) => {
      if (!unitId || !userId) return;
      const effectiveDate =
        customDate || selectedDate || formatDate(new Date());
      setIsLoading(true);
      try {
        const res = await multipleTablePutApi({
          store: "api_get_pos_print_order_manv",
          param: {
            so_ct: "",
            ma_kh: "",
            ten_kh: "",
            dien_thoai: "",
            ngay_ct: effectiveDate,
            PageIndex: 1,
            PageSize: 1000,
            StoreId: "",
            UnitId: unitId,
            Status: "",
            Userid: userId,
            username: "",
            ma_ban: "",
            ten_vt: "",
            nh_vt1: "",
          },
          data: {},
        });

        // listObject[0] chứa thông tin tổng hợp (summary)
        const summary =
          Array.isArray(res?.listObject?.[0]) && res.listObject[0].length > 0
            ? res.listObject[0][0]
            : null;

        // listObject[1] chứa danh sách nhóm món
        const categories = Array.isArray(res?.listObject?.[1])
          ? res.listObject[1]
          : [];

        setSummaryData(summary);
        setCategoryData(categories);
        setPrintTimestamp(dayjs().format("DD/MM/YYYY HH:mm:ss"));
      } catch (error) {
        console.error("❌ Lỗi khi lấy báo cáo chốt ca:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [selectedDate, unitId, userId]
  );

  useEffect(() => {
    if (isOpen) {
      fetchReportData(selectedDate);
    }
  }, [isOpen, fetchReportData, selectedDate]);

  const handleDateChange = (date) => {
    const formatted = date
      ? date.format(DEFAULT_DATE_FORMAT)
      : formatDate(new Date());
    setSelectedDate(formatted);
    fetchReportData(formatted);
  };

  const totals = useMemo(() => {
    if (!summaryData) {
      return {
        gross: 0,
        net: 0,
        discount: 0,
        cash: 0,
        transfer: 0,
        voucherCount: 0,
        congNoKhTs: 0,
        congNoXuatHd: 0,
        startTime: "--",
        endTime: "--",
      };
    }

    // Lấy dữ liệu từ summaryData
    const net = Number(summaryData.t_tt) || 0;
    const discount = Number(summaryData.t_ck_nt) || 0;
    const cash = Number(summaryData.t_tien_mat) || 0;
    const transfer = Number(summaryData.tien_ck) || 0;
    const voucherCount = Number(summaryData.t_ap_voucher) || 0;
    const gross = net + discount;
    const congNoKhTs = Number(summaryData.cong_no_kh_ts) || 0;
    const congNoXuatHd = Number(summaryData.cong_no_xuat_hd) || 0;

    return {
      gross,
      net,
      discount,
      cash,
      transfer,
      voucherCount,
      congNoKhTs,
      congNoXuatHd,
      startTime: "--",
      endTime: "--",
    };
  }, [summaryData]);

  // Nhóm món (từ listObject[1])
  const groupedCategories = useMemo(() => {
    return categoryData
      .map((item) => ({
        name: item.ten_nh?.trim() || item.nh_vt1?.trim() || "Khác",
        quantity: Number(item.t_so_luong) || 0,
        revenue: Number(item.t_tt) || 0,
      }))
      .sort((a, b) => b.revenue - a.revenue || b.quantity - a.quantity);
  }, [categoryData]);

  // API mới không có detail items, chỉ có nhóm món
  const groupedItems = useMemo(() => {
    return new Map();
  }, []);

  const cashInTill = useMemo(
    () => Number(openingBalance) + (totals.cash || 0),
    [openingBalance, totals.cash]
  );

  const handlePrint = useReactToPrint({
    content: () => printContent.current,
    documentTitle: `bao-cao-chot-ca-${selectedDate}`,
    copyStyles: false,
  });

  // Tạo dữ liệu cho bảng hiển thị - chỉ phần detail (nhóm món)
  const tableData = useMemo(() => {
    const data = [];
    let stt = 1;

    // Sắp xếp nhóm món theo thứ tự
    const sortedGroups = [...groupedCategories].sort(
      (a, b) => b.revenue - a.revenue || b.quantity - a.quantity
    );

    sortedGroups.forEach((group, groupIndex) => {
      // Thêm nhóm món (group row)
      const items = groupedItems.get(group.name) || [];

      // Nếu không có items, thêm STT cho group row
      const groupStt = items.length === 0 ? stt++ : null;

      data.push({
        key: `group-${groupIndex}`,
        stt: groupStt,
        type: "group",
        ten_truong: group.name,
        so_luong: formatNumber(group.quantity),
        doanh_thu: formatNumber(group.revenue),
      });

      // Thêm các món ăn chi tiết trong nhóm (detail rows)
      items.forEach((item, itemIndex) => {
        data.push({
          key: `item-${groupIndex}-${itemIndex}`,
          stt: stt++,
          type: "item",
          ten_truong: item.name,
          so_luong: formatNumber(item.quantity),
          doanh_thu: formatNumber(item.revenue),
        });
      });
    });

    return data;
  }, [groupedCategories, groupedItems, categoryData.length]);

  const CELL_STYLE = { textAlign: "center" };
  const BOLD_CELL_STYLE = { fontWeight: "bold", textAlign: "center" };

  const renderCellContent = useCallback((text, record, col) => {
    const { dataIndex } = col;

    if (record.type === "group") {
      // Nhóm món (group row) - hiển thị như header row, in đậm
      if (dataIndex === "stt") {
        return record.stt ? (
          <div style={{ ...CELL_STYLE, backgroundColor: "#f2f2f2" }}>
            <strong>{record.stt}</strong>
          </div>
        ) : null;
      }
      if (dataIndex === "ten_truong") {
        return (
          <div style={{ ...BOLD_CELL_STYLE, backgroundColor: "#f2f2f2" }}>
            <strong>{text}</strong>
          </div>
        );
      }
      if (dataIndex === "so_luong") {
        return (
          <div style={{ ...BOLD_CELL_STYLE, backgroundColor: "#f2f2f2" }}>
            <strong>{record.so_luong}</strong>
          </div>
        );
      }
      if (dataIndex === "doanh_thu") {
        return (
          <div style={{ ...BOLD_CELL_STYLE, backgroundColor: "#f2f2f2" }}>
            <strong>{record.doanh_thu}</strong>
          </div>
        );
      }
      return null;
    }

    // Món ăn (item detail) - indent để phân biệt với group
    if (dataIndex === "stt") {
      return <div style={CELL_STYLE}>{record.stt}</div>;
    }
    if (dataIndex === "ten_truong") {
      return <div style={{ paddingLeft: 20, textAlign: "center" }}>{text}</div>;
    }
    if (dataIndex === "so_luong") {
      return (
        <div style={CELL_STYLE}>
          <strong>{record.so_luong}</strong>
        </div>
      );
    }
    if (dataIndex === "doanh_thu") {
      return (
        <div style={CELL_STYLE}>
          <strong>{record.doanh_thu}</strong>
        </div>
      );
    }
    return null;
  }, []);

  const columns = useMemo(
    () => [
      {
        title: "STT",
        dataIndex: "stt",
        key: "stt",
        align: "center",
        width: 80,
      },
      {
        title: "Tên",
        dataIndex: "ten_truong",
        key: "ten_truong",
        align: "center",
      },
      {
        title: "Số món",
        dataIndex: "so_luong",
        key: "so_luong",
        align: "center",
      },
      {
        title: "Doanh thu",
        dataIndex: "doanh_thu",
        key: "doanh_thu",
        align: "center",
      },
    ],
    []
  );

  const optimizedColumns = useMemo(
    () =>
      columns.map((col) => ({
        ...col,
        onCell: (record) => ({ record }),
        render: (text, record) => renderCellContent(text, record, col),
      })),
    [columns, renderCellContent]
  );

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width="95%"
      centered
      title="Báo cáo chốt ca"
      destroyOnClose
    >
      <div className="shift-report-modal__container">
        {/* Phần Filter */}
        <div className="shift-report-modal__filter-section">
          <Space wrap size="middle">
            <DatePicker
              inputReadOnly
              format={DEFAULT_DATE_FORMAT}
              value={dayjs(selectedDate, DEFAULT_DATE_FORMAT)}
              onChange={handleDateChange}
              placeholder="Chọn ngày"
            />
            <InputNumber
              min={0}
              addonBefore="Số dư đầu"
              value={openingBalance}
              formatter={(value) => formatNumber(value || 0)}
              parser={(value) =>
                Number(
                  String(value || "0")
                    .replace(/\./g, "")
                    .replace(/,/g, "")
                )
              }
              onChange={(value) => setOpeningBalance(value || 0)}
            />
            <Button
              type="primary"
              icon={<PrinterOutlined />}
              onClick={handlePrint}
              disabled={!summaryData && categoryData.length === 0}
            >
              In báo cáo chốt ca
            </Button>
          </Space>
        </div>

        {/* Phần Master - Thông tin tổng hợp */}
        <Spin spinning={isLoading}>
          <div className="shift-report-modal__master-section">
            <div className="shift-report-modal__master-grid">
              {/* Thông tin chung */}
              <div className="shift-report-modal__master-item">
                <div className="shift-report-modal__master-label">Ngày</div>
                <div className="shift-report-modal__master-value">
                  {summaryData?.ngay_ct || selectedDate}
                </div>
              </div>
              <div className="shift-report-modal__master-item">
                <div className="shift-report-modal__master-label">Thu ngân</div>
                <div className="shift-report-modal__master-value">
                  {summaryData?.user_thu_ngan?.trim() || cashierName || "--"}
                </div>
              </div>
              <div className="shift-report-modal__master-item">
                <div className="shift-report-modal__master-label">
                  Số dư đầu
                </div>
                <div className="shift-report-modal__master-value">
                  {formatNumber(openingBalance)}
                </div>
              </div>
              <div className="shift-report-modal__master-item">
                <div className="shift-report-modal__master-label">
                  Tiền trong két
                </div>
                <div className="shift-report-modal__master-value">
                  {formatNumber(cashInTill)}
                </div>
              </div>

              {/* Tổng hợp (highlighted) */}
              <div className="shift-report-modal__master-item shift-report-modal__master-item--summary">
                <div className="shift-report-modal__master-label">
                  Doanh thu Gross
                </div>
                <div className="shift-report-modal__master-value">
                  {formatNumber(totals.gross)}
                </div>
              </div>
              <div className="shift-report-modal__master-item shift-report-modal__master-item--summary">
                <div className="shift-report-modal__master-label">
                  Tổng chiết khấu
                </div>
                <div className="shift-report-modal__master-value">
                  {formatNumber(totals.discount)}
                </div>
              </div>
              <div className="shift-report-modal__master-item shift-report-modal__master-item--summary">
                <div className="shift-report-modal__master-label">
                  Doanh thu NET
                </div>
                <div className="shift-report-modal__master-value">
                  {formatNumber(totals.net)}
                </div>
              </div>
              <div className="shift-report-modal__master-item shift-report-modal__master-item--summary">
                <div className="shift-report-modal__master-label">
                  Áp dụng voucher
                </div>
                <div className="shift-report-modal__master-value">
                  {totals.voucherCount}
                </div>
              </div>

              {/* Phương thức thanh toán */}
              <div className="shift-report-modal__master-item shift-report-modal__master-item--section">
                <div className="shift-report-modal__master-label">
                  Phương thức thanh toán
                </div>
              </div>
              <div className="shift-report-modal__master-item">
                <div className="shift-report-modal__master-label">Tiền mặt</div>
                <div className="shift-report-modal__master-value">
                  {formatNumber(totals.cash)}
                </div>
              </div>
              <div className="shift-report-modal__master-item">
                <div className="shift-report-modal__master-label">
                  Chuyển khoản
                </div>
                <div className="shift-report-modal__master-value">
                  {formatNumber(totals.transfer)}
                </div>
              </div>

              {/* Công nợ */}
              <div className="shift-report-modal__master-item shift-report-modal__master-item--section">
                <div className="shift-report-modal__master-label">Công nợ</div>
              </div>
              <div className="shift-report-modal__master-item">
                <div className="shift-report-modal__master-label">
                  Công nợ KH trả sau
                </div>
                <div className="shift-report-modal__master-value">
                  {formatNumber(totals.congNoKhTs)}
                </div>
              </div>
              <div className="shift-report-modal__master-item">
                <div className="shift-report-modal__master-label">
                  Công nợ xuất hóa đơn
                </div>
                <div className="shift-report-modal__master-value">
                  {formatNumber(totals.congNoXuatHd)}
                </div>
              </div>
            </div>
          </div>

          {/* Phần Detail - Bảng nhóm món */}
          <div className="shift-report-modal__table-section">
            <div className="shift-report-modal__detail-header">
              <strong>Nhóm món</strong>
            </div>
            <Table
              className="shift-report-modal-table"
              columns={optimizedColumns}
              dataSource={tableData}
              pagination={false}
              rowKey="key"
              rowClassName={(record, index) => {
                if (record.type === "group") return "group-row";
                // Zebra striping: dòng lẻ đậm, dòng chẵn nhạt
                return index % 2 === 0 ? "table-row-odd" : "table-row-even";
              }}
              scroll={{ y: 450 }}
            />
          </div>
          <div style={{ display: "none" }}>
            <PrintComponent
              ref={printContent}
              summaryData={summaryData}
              categoryData={categoryData}
              openingBalance={openingBalance}
              selectedDate={selectedDate}
              printTimestamp={printTimestamp}
              cashierName={cashierName}
            />
          </div>
        </Spin>
      </div>
    </Modal>
  );
};

export default ShiftReportModal;
