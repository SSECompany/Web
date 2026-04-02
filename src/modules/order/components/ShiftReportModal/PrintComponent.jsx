import React, { forwardRef } from "react";
import { formatNumber } from "../../../../app/hook/dataFormatHelper";

const ShiftReportPrintComponent = forwardRef(
  (
    {
      summaryData = null,
      categoryData = [],
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

    // Tổng cộng doanh thu theo nhóm món
    // Chỉ tính tổng các dòng detail (systotal === 1), bỏ qua dòng tổng (systotal === 0)
    const totalCategoryRevenue = Array.isArray(categoryData)
      ? categoryData.reduce(
          (sum, item) => {
            // Chỉ cộng các dòng detail (systotal === 1), bỏ qua dòng tổng (systotal === 0)
            if (item.systotal === 0) {
              return sum; // Bỏ qua dòng tổng (như QUẦY BAR)
            }
            return sum + (Number(item.t_tt) || 0);
          },
          0
        )
      : 0;

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

        <div
          style={{
            color: "#000",
            marginTop: "8px",
            marginBottom: "4px",
            fontWeight: "bold",
            textTransform: "uppercase",
          }}
        >
          Nhóm món
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
                Tên
              </th>
              <th
                style={{
                  border: "1px solid #000",
                  padding: "2px",
                  textAlign: "center",
                  fontWeight: "bold",
                }}
              >
                Số món
              </th>
              <th
                style={{
                  border: "1px solid #000",
                  padding: "2px",
                  textAlign: "right",
                  fontWeight: "bold",
                }}
              >
                Doanh thu
              </th>
            </tr>
          </thead>
          <tbody>
            {categoryData.length === 0 ? (
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
              categoryData.map((item, index) => {
                // Dòng có systotal === 0 là dòng tổng (như QUẦY BAR) - cần in đậm
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
                      {item.ten_nh?.trim() || item.nh_vt1?.trim() || "Khác"}
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

        {/* Tổng cộng doanh thu (theo bảng nhóm món) */}
        <div
          style={{
            marginTop: "4px",
            textAlign: "right",
            fontWeight: "bold",
            color: "#000",
          }}
        >
          Tổng cộng doanh thu: {formatNumber(totalCategoryRevenue)}
        </div>
      </div>
    );
  }
);

ShiftReportPrintComponent.displayName = "ShiftReportPrintComponent";

export default ShiftReportPrintComponent;
