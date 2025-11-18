import React, { useCallback } from "react";
import { Button, message } from "antd";
import * as XLSX from "xlsx";
import { formatNumber } from "../../../../app/hook/dataFormatHelper";

const isVoucherApplied = (ap_voucher) => {
  return (
    ap_voucher === 1 ||
    ap_voucher === "1" ||
    String(ap_voucher).toLowerCase() === "x"
  );
};

const formatDateTime = (datetime) => {
  if (!datetime) return datetime;
  return datetime.split("T")[1]?.split(".")[0] || datetime;
};

const getTodayString = () => {
  const d = new Date();
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

const ReportExportExcelButton = ({ dataSource = [], selectedDate }) => {
  const handleExportExcel = useCallback(() => {
    if (!dataSource?.length) {
      message.warning("Không có dữ liệu để xuất.");
      return;
    }

    const totals = dataSource.reduce(
      (acc, item) => {
        const {
          systotal,
          so_luong,
          thanh_tien,
          tien_mat,
          tien_ck,
          ap_voucher,
        } = item;

        if (systotal === 0) {
          acc.totalSoLuong += Number(so_luong) || 0;
          acc.totalThanhTien += Number(thanh_tien) || 0;
          acc.totalTienMat += Number(tien_mat) || 0;
          acc.totalTienCK += Number(tien_ck) || 0;
        } else if (isVoucherApplied(ap_voucher)) {
          acc.totalApVoucher += 1;
        }

        return acc;
      },
      {
        totalSoLuong: 0,
        totalThanhTien: 0,
        totalTienMat: 0,
        totalTienCK: 0,
        totalApVoucher: 0,
      }
    );

    const exportRows = dataSource.map((row, index) => {
      const isSummaryRow = row.systotal === 0;
      const parseNumber = (value) => {
        if (value === undefined || value === null || value === "") return null;
        const num = Number(value);
        return Number.isNaN(num) ? null : num;
      };

      return {
        STT: isSummaryRow ? row.indexDisplay : index + 1,
        "Tên nhân viên": row.ten_nhan_vien || "",
        "Mã bàn": row.ma_ban || "",
        "Số CT": row.so_ct || "",
        "Ngày CT": row.ngay_ct || "",
        "Thời gian": row.datetime2 ? formatDateTime(row.datetime2) : "",
        "Tên món": row.ten_mon || "",
        "Nhóm món": row.nh_vt1 || "",
        "Số lượng": parseNumber(row.so_luong),
        "Giá bán": parseNumber(row.gia_ban),
        "Thành tiền": parseNumber(row.thanh_tien),
        "Tiền mặt": parseNumber(row.tien_mat),
        "Tiền CK": parseNumber(row.tien_ck),
        "Áp voucher": isVoucherApplied(row.ap_voucher) ? "x" : "",
      };
    });

    exportRows.push({
      STT: "Tổng",
      "Tên nhân viên": "",
      "Mã bàn": "",
      "Số CT": "",
      "Ngày CT": "",
      "Thời gian": "",
      "Tên món": "",
      "Nhóm món": "",
      "Số lượng": totals.totalSoLuong,
      "Giá bán": null,
      "Thành tiền": totals.totalThanhTien,
      "Tiền mặt": totals.totalTienMat,
      "Tiền CK": totals.totalTienCK,
      "Áp voucher": totals.totalApVoucher,
    });

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const columnKeys = Object.keys(exportRows[0] || {});
    const columnWidths = columnKeys.map((key) => {
      const headerLength = key.length;
      const maxCellLength = exportRows.reduce((max, row) => {
        const cellValue = row[key];
        if (cellValue === null || cellValue === undefined) return max;
        const stringValue =
          typeof cellValue === "number"
            ? cellValue.toString()
            : `${cellValue}`.trim();
        return Math.max(max, stringValue.length);
      }, headerLength);
      return { wch: Math.min(Math.max(maxCellLength + 2, 8), 40) };
    });
    worksheet["!cols"] = columnWidths;

    const moneyColumns = ["Giá bán", "Thành tiền", "Tiền mặt", "Tiền CK"];
    moneyColumns.forEach((header) => {
      const colIndex = columnKeys.indexOf(header);
      if (colIndex === -1) return;
      for (let rowIndex = 1; rowIndex < exportRows.length + 1; rowIndex++) {
        const cellRef = XLSX.utils.encode_cell({
          c: colIndex,
          r: rowIndex,
        });
        const cell = worksheet[cellRef];
        if (cell && typeof cell.v === "number") {
          cell.t = "n";
          cell.z = "#,##0";
        }
      }
    });

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "BaoCaoKetCa");

    const sanitizedDate = (selectedDate || getTodayString()).replace(
      /\//g,
      "-"
    );
    const fileName = `bao_cao_ket_ca_${sanitizedDate}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  }, [dataSource, selectedDate]);

  return (
    <Button type="primary" onClick={handleExportExcel}>
      Xuất Excel
    </Button>
  );
};

export default ReportExportExcelButton;


