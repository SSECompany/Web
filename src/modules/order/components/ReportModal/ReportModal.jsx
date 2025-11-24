import { Button, DatePicker, Input, Modal, Table } from "antd";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { multipleTablePutApi } from "../../../../api";
import { formatNumber } from "../../../../app/hook/dataFormatHelper";
import "./ReportModal.css";

const SUMMARY_FIELDS = [
  "ten_nhan_vien",
  "ten_gd",
  "so_ct",
  "ngay_ct",
  "datetime2",
  "so_luong",
  "gia_ban",
  "thanh_tien",
  "ck_nt",
  "tien_mat",
  "tien_ck",
  "ap_voucher",
  "tt_pos_nt",
  "tt_qrcode_nt",
];

const MONEY_FIELDS = [
  "gia_ban",
  "thanh_tien",
  "ck_nt",
  "tien_mat",
  "tien_ck",
  "tt_pos_nt",
  "tt_qrcode_nt",
];

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

const CELL_STYLE = {
  textAlign: "center",
  whiteSpace: "normal",
  wordWrap: "break-word",
};
const BOLD_CELL_STYLE = {
  fontWeight: "bold",
  textAlign: "center",
  whiteSpace: "normal",
  wordWrap: "break-word",
};

const ReportModal = ({ isOpen, onClose, unitId, id }) => {
  const [dataSource, setDataSource] = useState([]);

  const fetchData = useCallback(
    async (filterNgayCT) => {
      try {
        const ngayCT = filterNgayCT || formatDate(new Date());

        const res = await multipleTablePutApi({
          store: "api_get_pos_order_manv",
          param: {
            so_ct: "",
            ma_kh: "",
            ten_kh: "",
            dien_thoai: "",
            ngay_ct: ngayCT,
            PageIndex: 1,
            PageSize: 1000,
            StoreId: "",
            UnitId: unitId,
            Status: "",
            Userid: id,
            username: "",
            ma_ban: "",
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
    [unitId, id]
  );

  const columns = useMemo(
    () => [
      { title: "STT", dataIndex: "fake_stt", key: "fake_stt", minWidth: 70 },
      {
        title: "Tên nhân viên",
        dataIndex: "ten_nhan_vien",
        key: "ten_nhan_vien",
        minWidth: 140,
      },
      { title: "Tên GD", dataIndex: "ten_gd", key: "ten_gd", minWidth: 200 },
      {
        title: "Số CT",
        dataIndex: "so_ct",
        key: "so_ct",
        minWidth: 110,
        filterDropdown: ({
          setSelectedKeys,
          selectedKeys,
          confirm,
          clearFilters,
        }) => (
          <div style={{ padding: 8 }}>
            <Input
              placeholder="Tìm kiếm Số CT"
              value={selectedKeys[0]}
              onChange={(e) => {
                setSelectedKeys(e.target.value ? [e.target.value] : []);
              }}
              onPressEnter={() => {
                confirm();
              }}
              style={{ marginBottom: 8, display: "block" }}
            />
            <Button
              className="search_button"
              type="primary"
              onClick={() => {
                confirm();
              }}
              size="small"
              style={{ width: 90, marginRight: 8 }}
            >
              Tìm kiếm
            </Button>
            <Button
              onClick={() => {
                clearFilters();
              }}
              size="small"
              style={{ width: 90 }}
            >
              Đặt lại
            </Button>
          </div>
        ),
        onFilter: (value, record) => {
          if (!value) return true;
          return String(record.so_ct || "")
            .toLowerCase()
            .includes(String(value).toLowerCase());
        },
      },
      {
        title: "Ngày CT",
        dataIndex: "ngay_ct",
        key: "ngay_ct",
        minWidth: 130,
        filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) => (
          <div style={{ padding: 8 }}>
            <DatePicker
              inputReadOnly
              onChange={(date) => {
                if (date) {
                  setSelectedKeys([date.format("DD/MM/YYYY")]);
                } else {
                  setSelectedKeys([]);
                }
              }}
              style={{ marginBottom: 8, display: "block" }}
              format="DD/MM/YYYY"
              placeholder="Chọn ngày CT"
            />
            <Button
              className="search_button"
              type="primary"
              onClick={() => {
                confirm();
                if (selectedKeys[0]) {
                  fetchData(selectedKeys[0]);
                }
              }}
              size="small"
            >
              Tìm kiếm
            </Button>
          </div>
        ),
      },
      {
        title: "Thời gian",
        dataIndex: "datetime2",
        key: "datetime2",
        minWidth: 120,
      },
      { title: "Tên món", dataIndex: "ten_mon", key: "ten_mon", minWidth: 150 },
      {
        title: "Số lượng",
        dataIndex: "so_luong",
        key: "so_luong",
        minWidth: 110,
      },
      { title: "Giá bán", dataIndex: "gia_ban", key: "gia_ban", minWidth: 110 },
      {
        title: "Thành tiền",
        dataIndex: "thanh_tien",
        key: "thanh_tien",
        minWidth: 130,
      },
      {
        title: "Chiết khấu",
        dataIndex: "ck_nt",
        key: "ck_nt",
        minWidth: 130,
      },
      {
        title: "Tiền mặt",
        dataIndex: "tien_mat",
        key: "tien_mat",
        minWidth: 130,
      },
      { title: "Tiền CK", dataIndex: "tien_ck", key: "tien_ck", minWidth: 120 },
      {
        title: "Sinh viên trả trước",
        dataIndex: "tt_pos_nt",
        key: "tt_pos_nt",
        minWidth: 180,
      },
      {
        title: "Bệnh nhân trả trước",
        dataIndex: "tt_qrcode_nt",
        key: "tt_qrcode_nt",
        minWidth: 180,
      },
      {
        title: "Áp voucher",
        dataIndex: "ap_voucher",
        key: "ap_voucher",
        minWidth: 130,
      },
      {
        title: "SysTotal",
        dataIndex: "systotal",
        key: "systotal",
        hidden: true,
      },
    ],
    [fetchData]
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
      fetchData();
    }
  }, [isOpen, fetchData]);

  return (
    <Modal
      open={isOpen}
      width={"95%"}
      title="Báo cáo kết ca"
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
          rowKey="key"
          rowClassName={(record) =>
            record.systotal === 0 ? "summary-row group-row" : ""
          }
          scroll={{ y: 450, x: true }}
          tableLayout="auto"
          size="small"
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
                  ap_voucher,
                  tt_pos_nt,
                  tt_qrcode_nt,
                } = item;

                if (systotal === 0) {
                  acc.totalSoLuong += Number(so_luong) || 0;
                  acc.totalThanhTien += Number(thanh_tien) || 0;
                  acc.totalChietKhau += Number(ck_nt) || 0;
                  acc.totalTienMat += Number(tien_mat) || 0;
                  acc.totalTienCK += Number(tien_ck) || 0;
                  acc.totalTtPosNt += Number(tt_pos_nt) || 0;
                  acc.totalTtQrcodeNt += Number(tt_qrcode_nt) || 0;
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
                totalChietKhau: 0,
                totalTienMat: 0,
                totalTienCK: 0,
                totalApVoucher: 0,
                totalTtPosNt: 0,
                totalTtQrcodeNt: 0,
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
                        <strong>{formatNumber(totals.totalChietKhau)}</strong>
                      ),
                      tien_mat: (
                        <strong>{formatNumber(totals.totalTienMat)}</strong>
                      ),
                      tien_ck: (
                        <strong>{formatNumber(totals.totalTienCK)}</strong>
                      ),
                      ap_voucher: <strong>{totals.totalApVoucher}</strong>,
                      tt_pos_nt: (
                        <strong>{formatNumber(totals.totalTtPosNt)}</strong>
                      ),
                      tt_qrcode_nt: (
                        <strong>{formatNumber(totals.totalTtQrcodeNt)}</strong>
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
    </Modal>
  );
};

export default ReportModal;
