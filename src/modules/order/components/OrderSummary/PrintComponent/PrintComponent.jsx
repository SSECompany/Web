import React, { forwardRef, useMemo } from "react";
import { formatNumber } from "../../../../../app/hook/dataFormatHelper";
import jwt from "../../../../../utils/jwt";

const PrintComponent = forwardRef(
  ({ master = {}, detail = [], orderNumber = "" }, ref) => {
    const rawToken = localStorage.getItem("access_token");
    const claims =
      rawToken && rawToken.split(".").length === 3
        ? jwt.getClaims?.() || {}
        : {};
    const fullName = claims?.FullName;

    // Memoize account để tránh lặp lại
    const account = useMemo(() => process.env.REACT_APP_VIETQR_ACCOUNT, []);

    // Tối ưu QR URL cho hóa đơn
    const billQRUrl = useMemo(() => {
      if (!account || !master?.tong_tien) return "";

      const amount =
        master?.chuyen_khoan && Number(master.chuyen_khoan) > 0
          ? master.chuyen_khoan
          : master?.tong_tien;

      const content = `thanh toan Phenikaa so CT ${orderNumber}: ${formatNumber(
        amount
      )}vnd`;

      return `https://img.vietqr.io/image/${account}-qr_only.png?amount=${amount}&addInfo=${encodeURIComponent(
        content
      )}`;
    }, [account, master?.tong_tien, master?.chuyen_khoan, orderNumber]);

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

    var now = new Date();
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
        <div style={{ textAlign: "center" }}>
          <img
            src="/logo.jpeg"
            alt="Phenikaa MEC Logo"
            style={{ width: "120px", height: "auto", marginBottom: "8px" }}
          />
        </div>
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
        <div style={{ color: "#000", marginBottom: "6px" }}>
          <strong>Tên khách:</strong>{" "}
          {master?.ong_ba && master.ong_ba.trim()
            ? master.ong_ba
            : "Khách hàng căng tin"}
        </div>
        {master?.ma_so_thue_kh && master.ma_so_thue_kh.trim() && (
          <div style={{ color: "#000", marginBottom: "6px" }}>
            <strong>Mã số thuế:</strong> {master.ma_so_thue_kh}
          </div>
        )}
        {master?.ten_dv_kh && master.ten_dv_kh.trim() && (
          <div style={{ color: "#000", marginBottom: "6px" }}>
            <strong>Tên công ty:</strong> {master.ten_dv_kh}
          </div>
        )}
        <div style={{ paddingBottom: "6px" }}>
          <div style={{ color: "#000" }}>
            <strong>Bàn:</strong> {master?.ma_ban || "Không xác định"}
          </div>
        </div>
        <div style={{ color: "#000", marginBottom: "6px" }}>
          <strong>Hình thức:</strong> {formatPaymentMethod(master?.httt)}
        </div>
        <div style={{ color: "#000", marginBottom: "6px" }}>
          <strong>Số CT:</strong> {orderNumber || "Chưa có"}
        </div>
        <div style={{ color: "#000", marginBottom: "6px" }}>
          <strong>Nhân viên:</strong> {fullName}
        </div>

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
                const subItems = detail.filter(
                  (sub) =>
                    sub?.ma_vt_root === item?.ma_vt &&
                    sub?.uniqueid === item?.uniqueid
                );
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
                        {formatNumber(item?.don_gia) || "0"}đ
                      </td>
                      <td
                        style={{
                          padding: "3px",
                          textAlign: "center",
                          whiteSpace: "nowrap",
                          color: "#000",
                        }}
                      >
                        {formatNumber(item?.thanh_tien) || "0"}đ
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
            fontWeight: "bold",
            textAlign: "right",
            fontSize: "13px",
            marginRight: 10,
            color: "#000",
          }}
        >
          Tổng tiền: {formatNumber(master?.tong_tien) || "0"}đ
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
          {billQRUrl ? (
            <img
              src={billQRUrl}
              alt="QR Code thanh toán"
              style={{
                width: "100px",
                height: "100px",
                border: "1px solid #ddd",
              }}
              onError={(e) => {
                // Fallback nếu QR không load được
                e.target.style.display = "none";
                e.target.nextSibling.style.display = "block";
              }}
            />
          ) : null}
          <div
            style={{
              width: "100px",
              height: "100px",
              border: "1px solid #ddd",
              display: "none",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "10px",
              color: "#666",
              margin: "0 auto",
            }}
          >
            QR không khả dụng
          </div>
        </div>

        <div
          style={{
            marginTop: "20px",
            borderTop: "1px dashed #ccc",
            paddingTop: "10px",
          }}
        >
          <div
            style={{
              textAlign: "center",
              fontStyle: "italic",
              fontSize: "12px",
              color: "#000",
            }}
          >
            Tra cứu hóa đơn điện tử tại Website:{" "}
            <a
              href="https://einvoice.phenikaamec.com/"
              style={{ color: "#0066cc" }}
            >
              https://einvoice.phenikaamec.com/
            </a>
          </div>
          <div
            style={{
              textAlign: "center",
              marginTop: "5px",
              fontSize: "10px",
              color: "#000",
            }}
          >
            Mã số tra cứu: {orderNumber || ""}
          </div>
        </div>
      </div>
    );
  }
);

export default PrintComponent;
