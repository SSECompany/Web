import React, { forwardRef } from "react";
import { formatNumber } from "../../../../pharmacy-utils/hook/dataFormatHelper";
import jwt from "../../../../utils/jwt";
import VietQR from "../../GenerateQR/VietQR";

// const account = process.env.REACT_APP_VIETQR_ACCOUNT;

const PrintComponent = forwardRef(
  ({ master = {}, detail = [], orderNumber = "", bankInfo = null }, ref) => {
    const rawToken = localStorage.getItem("access_token");
    const claims =
      rawToken && rawToken.split(".").length === 3
        ? jwt.getClaims?.() || {}
        : {};
    const fullName = claims?.FullName;

    const formatPaymentMethod = (method) => {
      if (!method) return "Tiền mặt";

      // Xử lý trường hợp có nhiều hình thức thanh toán
      const methods = method.split(",").map((m) => m.trim());
      const formattedMethods = methods.map((m) => {
        switch (m) {
          case "chuyen_khoan":
            return "Chuyển khoản";
          case "tien_mat":
            return "Tiền mặt";
          default:
            return "Tiền mặt";
        }
      });

      return formattedMethods.join(" + ");
    };

    const parseNumber = (value) => {
      const number = Number(value);
      return Number.isFinite(number) ? number : 0;
    };

    const formatPercentLabel = (value) => {
      if (!Number.isFinite(value) || value <= 0) {
        return "";
      }
      const rounded =
        Math.abs(value) >= 1 ? value.toFixed(2) : value.toFixed(2);
      return `${Number(rounded).toString()}%`;
    };

    const totals = detail.reduce(
      (acc, item) => {
        const lineTotal = parseNumber(item?.thanh_tien);
        const discountAmount = parseNumber(item?.ck_nt);
        const vatAmount = parseNumber(item?.thue_nt);

        acc.subtotal += lineTotal;
        acc.discount += discountAmount;
        acc.vat += vatAmount;
        return acc;
      },
      { subtotal: 0, discount: 0, vat: 0 }
    );

    const subtotalAfterDiscount = Math.max(
      0,
      totals.subtotal - totals.discount
    );
    const computedGrandTotal = Math.max(
      0,
      subtotalAfterDiscount + totals.vat
    );
    const grandTotal =
      parseNumber(master?.tong_tien) > 0
        ? parseNumber(master?.tong_tien)
        : computedGrandTotal;

    const discountPercentValue =
      totals.subtotal > 0 ? (totals.discount / totals.subtotal) * 100 : 0;
    const vatPercentValue =
      subtotalAfterDiscount > 0
        ? (totals.vat / subtotalAfterDiscount) * 100
        : 0;

    const discountLabel =
      discountPercentValue > 0
        ? `Chiết khấu (${formatPercentLabel(discountPercentValue)})`
        : "Chiết khấu";
    const vatLabel =
      vatPercentValue > 0
        ? `Thuế VAT (${formatPercentLabel(vatPercentValue)})`
        : "Thuế VAT";

    const now = master?.datetime2 ? new Date(master.datetime2) : new Date();
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
          <label
            style={{ fontWeight: "bold", fontSize: "14px", color: "#000" }}
          >
            HÓA ĐƠN
          </label>
          <br />
          <span>
            {`${now.getDate().toString().padStart(2, "0")}/${(
              now.getMonth() + 1
            )
              .toString()
              .padStart(2, "0")}/${now.getFullYear()} ${now
              .getHours()
              .toString()
              .padStart(2, "0")}:${now
              .getMinutes()
              .toString()
              .padStart(2, "0")}:${now
              .getSeconds()
              .toString()
              .padStart(2, "0")}`}
          </span>
        </div>
        {(master?.ten_kh && master.ten_kh !== "Khách hàng căng tin") || (master?.ong_ba && master.ong_ba.trim()) ? (
          <div style={{ color: "#000", marginBottom: "6px" }}>
            <strong>Tên khách:</strong> {master?.ten_kh || master?.ong_ba || "Khách vãng lai"}
          </div>
        ) : null}
        {master?.ma_so_thue_kh && (master.ma_so_thue_kh || "").trim() && (
          <div style={{ color: "#000", marginBottom: "6px" }}>
            <strong>Mã số thuế:</strong> {master.ma_so_thue_kh}
          </div>
        )}
        {master?.ten_dv_kh && (master.ten_dv_kh || "").trim() && (
          <div style={{ color: "#000", marginBottom: "6px" }}>
            <strong>Tên công ty:</strong> {master.ten_dv_kh}
          </div>
        )}
        {master?.ma_ban && (master.ma_ban || "").trim() && (
          <div style={{ paddingBottom: "6px" }}>
            <div style={{ color: "#000" }}>
              <strong>Bàn:</strong> {master.ma_ban}
            </div>
          </div>
        )}
        {/* Hình thức thanh toán chỉ hiển thị khi master.httt có giá trị */}
        {master?.httt && (
          <div style={{ color: "#000", marginBottom: "6px" }}>
            <strong>Hình thức:</strong> {formatPaymentMethod(master?.httt)}
          </div>
        )}

        <div style={{ color: "#000", marginBottom: "6px" }}>
          <strong>Số CT:</strong> {orderNumber || master?.so_ct || "Chưa có"}
        </div>
        {fullName && (
          <div style={{ color: "#000", marginBottom: "6px" }}>
            <strong>Nhân viên:</strong> {fullName}
          </div>
        )}
        {master?.username && !fullName && (
          <div style={{ color: "#000", marginBottom: "6px" }}>
            <strong>Nhân viên:</strong> {master.username}
          </div>
        )}

        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginBottom: "6px",
          }}
        >
          <thead>
            <tr style={{ fontSize: "10px", borderBottom: "1px solid black" }}>
              <th
                style={{
                  padding: "3px",
                  textAlign: "left",
                  width: "45%",
                  color: "#000",
                }}
              >
                Tên món
              </th>
              <th
                style={{
                  padding: "3px",
                  textAlign: "center",
                  width: "10%",
                  color: "#000",
                }}
              >
                SL
              </th>
              <th
                style={{
                  padding: "3px",
                  textAlign: "center",
                  width: "20%",
                  color: "#000",
                }}
              >
                Giá
              </th>
              <th
                style={{
                  padding: "3px",
                  textAlign: "center",
                  width: "25%",
                  color: "#000",
                }}
              >
                Thành tiền
              </th>
            </tr>
          </thead>
          <tbody>
            {detail
              .filter((item) => !item?.ma_vt_root)
              .map((item, index) => {
                const subItems = item?.extras || [];
                return (
                  <React.Fragment key={index}>
                    <tr style={{ fontSize: "12px", color: "#000" }}>
                      <td
                        style={{
                          padding: "3px",
                          textAlign: "left",
                          wordWrap: "break-word",
                          overflowWrap: "break-word",
                          color: "#000",
                        }}
                      >
                        <span>{item?.ten_vt}</span>
                      </td>
                      <td
                        style={{
                          padding: "3px",
                          textAlign: "center",
                          color: "#000",
                        }}
                      >
                        {item?.so_luong || 1}
                      </td>
                      <td
                        style={{
                          padding: "3px",
                          textAlign: "center",
                          color: "#000",
                        }}
                      >
                        {formatNumber(item?.listPrice || item?.don_gia) || "0"}đ
                      </td>
                      <td
                        style={{
                          padding: "3px",
                          textAlign: "center",
                          whiteSpace: "nowrap",
                          color: "#000",
                        }}
                      >
                        {formatNumber(item?.thanh_tien_list || item?.thanh_tien) || "0"}đ
                      </td>
                    </tr>

                    {subItems.map((sub, subIndex) => (
                      <tr
                        key={`sub-${index}-${subIndex}`}
                        style={{ fontSize: "12px", color: "#000" }}
                      >
                        <td
                          style={{
                            padding: "3px",
                            textAlign: "left",
                            wordWrap: "break-word",
                            overflowWrap: "break-word",
                            color: "#000",
                          }}
                        >
                          <span style={{ fontSize: "10px" }}>
                            + {sub?.ten_vt}
                          </span>
                        </td>
                        <td
                          style={{
                            padding: "3px",
                            textAlign: "center",
                            color: "#000",
                          }}
                        >
                          {sub?.so_luong || 1}
                        </td>
                        <td
                          style={{
                            padding: "3px",
                            textAlign: "center",
                            color: "#000",
                          }}
                        >
                          {formatNumber(sub?.don_gia) || "0"}đ
                        </td>
                        <td
                          style={{
                            padding: "3px",
                            textAlign: "center",
                            whiteSpace: "nowrap",
                            color: "#000",
                          }}
                        >
                          {formatNumber(sub?.thanh_tien) || "0"}đ
                        </td>
                      </tr>
                    ))}

                    {item?.ghi_chu && (
                      <tr
                        key={`note-${index}`}
                        style={{
                          fontSize: "12px",
                          fontStyle: "italic",
                          color: "#000",
                        }}
                      >
                        <td
                          colSpan="4"
                          style={{
                            padding: "3px",
                            textAlign: "left",
                            color: "#000",
                          }}
                        >
                          Ghi chú: {item?.ghi_chu}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
          </tbody>
        </table>

        <div
          style={{
            borderTop: "1px solid black",
            paddingTop: "6px",
            marginTop: "6px",
            fontSize: "12px",
            color: "#000",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "4px",
            }}
          >
            <span>Tổng tiền hàng</span>
            <span>{formatNumber(totals.subtotal) || "0"}đ</span>
          </div>
          {totals.discount > 0 && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "4px",
              }}
            >
              <span>{discountLabel}</span>
              <span>-{formatNumber(Math.abs(totals.discount)) || "0"}đ</span>
            </div>
          )}
          {totals.vat > 0 && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "4px",
              }}
            >
              <span>{vatLabel}</span>
              <span>{formatNumber(totals.vat) || "0"}đ</span>
            </div>
          )}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontWeight: "bold",
              fontSize: "13px",
              marginTop: "4px",
            }}
          >
            <span>Tổng cộng</span>
            <span>{formatNumber(grandTotal) || "0"}đ</span>
          </div>
        </div>

        <div
          style={{
            textAlign: "center",
            marginTop: "10px",
            fontStyle: "italic",
            fontSize: "12px",
            color: "#000",
          }}
        >
          CẢM ƠN QUÝ KHÁCH, HẸN GẶP LẠI!
        </div>

        <div style={{ textAlign: "center", marginTop: "10px" }}>
          <div
            style={{
              display: "inline-block",
              border: "1px solid #ccc",
              borderRadius: 8,
              padding: 6,
              background: "#fff",
            }}
          >
            <VietQR
              amount={
                master?.chuyen_khoan && Number(master.chuyen_khoan) > 0
                  ? master.chuyen_khoan
                  : master?.tong_tien
              }
              soChungTu={`Thanh toan Tapmed so CT ${orderNumber} ${
                master?.chuyen_khoan && Number(master.chuyen_khoan) > 0
                  ? master.chuyen_khoan
                  : master?.tong_tien
              }vnd`}
              size={80}
              BankAccount={bankInfo?.BankAccount}
              BinBank={bankInfo?.BinBank}
            />
          </div>
        </div>
      </div>
    );
  }
);

export default PrintComponent;
