import { Button, DatePicker, Modal, Table } from "antd";
import React, { useEffect, useState } from "react";
import { multipleTablePutApi } from "../../../../api";
import { formatNumber } from "../../../../app/hook/dataFormatHelper";
import "./ReportModal.css";

const ReportModal = ({ isOpen, onClose, unitId, id, filterDate }) => {
  const [dataSource, setDataSource] = useState([]);
  const [columns, setColumns] = useState([]);
  const [filters, setFilters] = useState({});

  const fetchData = async (filterNgayCT) => {
    try {
      const formatDate = (date) => {
        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, "0");
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
      };
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
          ma_ban: ""
        },
        data: {},
      });

      const hardcodedColumns = [
        { title: "STT", dataIndex: "fake_stt", key: "fake_stt", width: 70 },
        { title: "Tên nhân viên", dataIndex: "ten_nhan_vien", key: "ten_nhan_vien", width: 150 },
        { title: "Mã bàn", dataIndex: "ma_ban", key: "ma_ban", width: 100 },
        { title: "Số CT", dataIndex: "so_ct", key: "so_ct", width: 100 },
        {
          title: "Ngày CT", dataIndex: "ngay_ct", key: "ngay_ct", width: 120,
          filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) => (
            <div style={{ padding: 8 }}>
              <DatePicker
                inputReadOnly
                onChange={(date) => {
                  if (date) {
                    setSelectedKeys([date.format('DD/MM/YYYY')]);
                  } else {
                    setSelectedKeys([]);
                  }
                }}
                style={{ marginBottom: 8, display: 'block' }}
                format="DD/MM/YYYY"
                placeholder="Chọn ngày CT"
              />
              <Button
                className="search_button"
                type="primary"
                onClick={() => {
                  confirm();
                  const newFilters = { ...filters, ngay_ct: selectedKeys[0] };
                  setFilters(newFilters);
                  fetchData(selectedKeys[0]);
                }}
                size="small"
              >
                Tìm kiếm
              </Button>
            </div>
          ),
          onFilter: (value, record) => record.ngay_ct.includes(value),
        },
        { title: "Tên món", dataIndex: "ten_mon", key: "ten_mon", width: 150 },
        { title: "Số lượng", dataIndex: "so_luong", key: "so_luong", width: 100 },
        { title: "Giá bán", dataIndex: "gia_ban", key: "gia_ban", width: 100 },
        { title: "Thành tiền", dataIndex: "thanh_tien", key: "thanh_tien", width: 120 },
        { title: "Tiền mặt", dataIndex: "tien_mat", key: "tien_mat", width: 120 },
        { title: "Tiền CK", dataIndex: "tien_ck", key: "tien_ck", width: 100 },
        { title: "Áp voucher", dataIndex: "ap_voucher", key: "ap_voucher", width: 120 },
        { title: "SysTotal", dataIndex: "systotal", key: "systotal", hidden: true },
      ];
      setColumns(hardcodedColumns);

      let groupIndex = 1;
      const fetchedData = res?.listObject?.[0]?.map((item, index) => {
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
  };

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  return (
    <Modal
      open={isOpen}
      width={"95%"}
      title="Báo cáo kết ca"
      destroyOnClose={true}
      onCancel={onClose}
      cancelText="Đóng"
      centered
      okButtonProps={{ style: { display: "none" } }}
      cancelButtonProps={{ style: { display: "none" } }}
    >
      <div className="report-modal_Container">
        <Table
          className="report-modal-table"
          columns={columns.filter(col => !col.hidden).map(col => ({
            ...col,
            align: 'center',
            onCell: (record) => {
              return { record };
            },
            render: (text, record) => {
              if (col.dataIndex === "systotal") {
                return null;
              }
              if (record.systotal === 0) {
                if (col.dataIndex === "fake_stt") {
                  return <div style={{ textAlign: 'center' }}><strong><i>{record.indexDisplay}</i></strong></div>;
                }
                if (
                  [
                    "ten_nhan_vien",
                    "ma_ban",
                    "so_ct",
                    "ngay_ct",
                    "so_luong",
                    "gia_ban",
                    "thanh_tien",
                    "tien_mat",
                    "tien_ck",
                    "ap_voucher"
                  ].includes(col.dataIndex)
                ) {
                  const formattedText =
                    col.dataIndex === "ap_voucher"
                      ? (text === 1 ? "x" : "")
                      : ["gia_ban", "thanh_tien", "tien_mat", "tien_ck"].includes(col.dataIndex) && !isNaN(text)
                        ? formatNumber(text)
                        : text;
                  return <div style={{ fontWeight: 'bold', textAlign: 'center' }}><strong><i>{formattedText}</i></strong></div>;
                }
              }
              if (col.dataIndex === "ap_voucher") {
                const display = text === "1" ? "x" : "";
                return <div style={{ fontWeight: record.systotal === 0 ? 'bold' : undefined, textAlign: 'center' }}>{display}</div>;
              }
              if (["gia_ban", "thanh_tien", "tien_mat", "tien_ck"].includes(col.dataIndex) && !isNaN(text)) {
                return <div style={{ textAlign: 'center' }}>{formatNumber(text)}</div>;
              }
              return <div style={{ textAlign: 'center' }}>{text}</div>;
            }
          }))}
          dataSource={dataSource}
          pagination={false}
          width="95%"
          rowKey="key"
          rowClassName={(record) => (record.systotal === 0 ? 'summary-row group-row' : '')}
          scroll={{ y: 450 }}
          summary={(pageData) => {
            let totalSoLuong = 0;
            let totalGiaBan = 0;
            let totalThanhTien = 0;
            let totalTienMat = 0;
            let totalTienCK = 0;
            let totalApVoucher = 0;

            pageData.forEach(({ systotal, so_luong, gia_ban, thanh_tien, tien_mat, tien_ck, ap_voucher }) => {
              if (systotal === 0) {
                totalSoLuong += Number(so_luong) || 0;
                totalGiaBan += Number(gia_ban) || 0;
                totalThanhTien += Number(thanh_tien) || 0;
                totalTienMat += Number(tien_mat) || 0;
                totalTienCK += Number(tien_ck) || 0;
                if (Number(ap_voucher) === 1) {
                  totalApVoucher += 1;
                }
              }
            });

            return (
              <Table.Summary.Row>
                {columns.filter(col => !col.hidden).map((col, idx) => {
                  if (col.dataIndex === "fake_stt") {
                    return <Table.Summary.Cell key={idx}><strong>Tổng</strong></Table.Summary.Cell>;
                  }
                  if (col.dataIndex === "so_luong") {
                    return <Table.Summary.Cell key={idx}><strong>{formatNumber(totalSoLuong)}</strong></Table.Summary.Cell>;
                  }
                  if (col.dataIndex === "gia_ban") {
                    return <Table.Summary.Cell key={idx} />;
                  }
                  if (col.dataIndex === "thanh_tien") {
                    return <Table.Summary.Cell key={idx}><strong>{formatNumber(totalThanhTien)}</strong></Table.Summary.Cell>;
                  }
                  if (col.dataIndex === "tien_mat") {
                    return <Table.Summary.Cell key={idx}><strong>{formatNumber(totalTienMat)}</strong></Table.Summary.Cell>;
                  }
                  if (col.dataIndex === "tien_ck") {
                    return <Table.Summary.Cell key={idx}><strong>{formatNumber(totalTienCK)}</strong></Table.Summary.Cell>;
                  }
                  if (col.dataIndex === "ap_voucher") {
                    return <Table.Summary.Cell key={idx}><strong>{totalApVoucher}</strong></Table.Summary.Cell>;
                  }
                  return <Table.Summary.Cell key={idx} />;
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
