import React, { forwardRef } from "react";
import { formatNumber } from "../../../../app/hook/dataFormatHelper";

const ShiftReportPrintComponent = forwardRef(
  (
    {
      summaryData = null,
      itemData = [],
      openingBalance = 0,
      selectedDate = "",
      printTimestamp = "",
      cashierName = "",
    },
    ref
  ) => {
    const cashInTill =
      Number(openingBalance) + (Number(summaryData?.t_tien_mat) || 0);
    const gross =
      (Number(summaryData?.t_tt) || 0) + (Number(summaryData?.t_ck_nt) || 0);
    const net = Number(summaryData?.t_tt) || 0;
    const discount = Number(summaryData?.t_ck_nt) || 0;
    const cash = Number(summaryData?.t_tien_mat) || 0;
    const transfer = Number(summaryData?.tien_ck) || 0;
    const voucherCount = Number(summaryData?.t_ap_voucher) || 0;
    const congNoKhTs = Number(summaryData?.cong_no_kh_ts) || 0;
    const congNoXuatHd = Number(summaryData?.cong_no_xuat_hd) || 0;

    return (
      <div
        className="print-content"
        style={{
          fontFamily: "Arial",
          fontSize: "12px",
          padding: "10px",
          maxWidth: "260px",
          color: "#000",
        }}
        ref={ref}
      >
        <div style={{ textAlign: "center", marginBottom: "8px" }}>
          <div
            style={{
              fontWeight: "bold",
              fontSize: "13px",
              color: "#000",
              marginBottom: "4px",
            }}
          >
            BÁO CÁO CHỐT CA
          </div>
          <div
            style={{
              fontSize: "11px",
              color: "#000",
              marginBottom: "6px",
            }}
          >
            Trường đại học Phenikaa
          </div>
        </div>

        <div style={{ color: "#000", marginBottom: "4px" }}>
          <strong>Ngày:</strong> {summaryData?.ngay_ct || selectedDate}
        </div>
        <div style={{ color: "#000", marginBottom: "4px" }}>
          <strong>Giờ in:</strong> {printTimestamp}
        </div>
        <div style={{ color: "#000", marginBottom: "4px" }}>
          <strong>Thu ngân:</strong>{" "}
          {summaryData?.user_thu_ngan?.trim() || cashierName || "--"}
        </div>
        <div style={{ color: "#000", marginBottom: "4px" }}>
          <strong>Số dư đầu:</strong> {formatNumber(openingBalance)}
        </div>
        <div style={{ color: "#000", marginBottom: "4px" }}>
          <strong>Doanh thu Gross:</strong> {formatNumber(gross)}
        </div>
        <div style={{ color: "#000", marginBottom: "4px" }}>
          <strong>Tổng chiết khấu:</strong> {formatNumber(discount)}
        </div>
        <div style={{ color: "#000", marginBottom: "4px" }}>
          <strong>Doanh thu NET:</strong> {formatNumber(net)}
        </div>
        <div style={{ color: "#000", marginBottom: "4px" }}>
          <strong>Áp dụng voucher:</strong> {voucherCount}
        </div>

        <div
          style={{
            color: "#000",
            marginTop: "8px",
            marginBottom: "4px",
            fontWeight: "bold",
            textTransform: "uppercase",
          }}
        >
          Công nợ
        </div>
        <div style={{ color: "#000", marginLeft: "12px", marginBottom: "4px" }}>
          <strong>- Công nợ KH trả sau:</strong>{" "}
          {formatNumber(congNoKhTs)}
        </div>
        <div style={{ color: "#000", marginLeft: "12px", marginBottom: "4px" }}>
          <strong>- Công nợ xuất hóa đơn:</strong>{" "}
          {formatNumber(congNoXuatHd)}
        </div>

        <div
          style={{
            color: "#000",
            marginTop: "8px",
            marginBottom: "4px",
            fontWeight: "bold",
            textTransform: "uppercase",
          }}
        >
          Phương thức thanh toán
        </div>
        <div style={{ color: "#000", marginLeft: "12px", marginBottom: "4px" }}>
          <strong>- Tiền mặt:</strong> {formatNumber(cash)}
        </div>
        <div style={{ color: "#000", marginLeft: "12px", marginBottom: "4px" }}>
          <strong>- Chuyển khoản:</strong> {formatNumber(transfer)}
        </div>
        <div style={{ color: "#000", marginBottom: "4px" }}>
          <strong>Tiền trong két:</strong> {formatNumber(cashInTill)}
        </div>

        {/* Chi tiết món */}
        <div
          style={{
            color: "#000",
            marginTop: "8px",
            marginBottom: "4px",
            fontWeight: "bold",
            textTransform: "uppercase",
          }}
        >
          Chi tiết món
        </div>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginTop: "4px",
            fontSize: "11px",
          }}
        >
          <thead style={{ display: "table-row-group" }}>
            <tr>
              <th
                style={{
                  border: "1px solid #000",
                  padding: "2px",
                  textAlign: "left",
                  fontWeight: "bold",
                }}
              >
                Tên món
              </th>
              <th
                style={{
                  border: "1px solid #000",
                  padding: "2px",
                  textAlign: "center",
                  fontWeight: "bold",
                }}
              >
                Số lượng
              </th>
              <th
                style={{
                  border: "1px solid #000",
                  padding: "2px",
                  textAlign: "right",
                  fontWeight: "bold",
                }}
              >
                Thành tiền
              </th>
            </tr>
          </thead>
          <tbody>
            {itemData.length === 0 ? (
              <tr>
                <td
                  colSpan={3}
                  style={{
                    border: "1px solid #000",
                    padding: "2px",
                    textAlign: "center",
                  }}
                >
                  Không có dữ liệu
                </td>
              </tr>
            ) : (
              itemData.map((item, index) => {
                const isTotalRow = item.systotal === 0;
                return (
                  <tr key={index}>
                    <td
                      style={{
                        border: "1px solid #000",
                        padding: "2px",
                        textAlign: "left",
                        fontWeight: isTotalRow ? "bold" : "normal",
                      }}
                    >
                      {item.ten_nh?.trim() || item.nh_vt1?.trim() || "N/A"}
                    </td>
                    <td
                      style={{
                        border: "1px solid #000",
                        padding: "2px",
                        textAlign: "center",
                        fontWeight: isTotalRow ? "bold" : "normal",
                      }}
                    >
                      {formatNumber(item.t_so_luong || 0)}
                    </td>
                    <td
                      style={{
                        border: "1px solid #000",
                        padding: "2px",
                        textAlign: "right",
                        fontWeight: isTotalRow ? "bold" : "normal",
                      }}
                    >
                      {formatNumber(item.t_tt || 0)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Tổng cộng từ Chi tiết món */}
        <div
          style={{
            marginTop: "8px",
            textAlign: "right",
            fontWeight: "bold",
            color: "#000",
          }}
        >
          Tổng cộng: {formatNumber(net)}
        </div>
      </div>
    );
  }
);

ShiftReportPrintComponent.displayName = "ShiftReportPrintComponent";

export default ShiftReportPrintComponent;
