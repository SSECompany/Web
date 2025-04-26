import React, { forwardRef } from "react";
import { formatNumber } from "../../../../../app/hook/dataFormatHelper";

const account = process.env.REACT_APP_VIETQR_ACCOUNT;

const PrintComponent = forwardRef(({ master = {}, detail = [] }, ref) => {
  var now = new Date();
  return (
    <div className="print-content" style={{ fontFamily: "Arial", fontSize: "12px", padding: "10px", maxWidth: "260px", color: "#000" }} ref={ref}>
      <div style={{ textAlign: "center", marginBottom: "10px" }}>
        <img
          src="/logo.png"
          alt="Phenikaa MEC Logo"
          style={{ width: "150px", height: "auto" }}
        />
      </div>
      <div style={{ textAlign: "center", marginBottom: "8px" }}>
        <label style={{ fontWeight: "bold", fontSize: "14px", color: "#000" }}>HÓA ĐƠN</label>
        <br />
        <span>
          Ngày bán: {`${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`}
        </span>
      </div>

      <div style={{ paddingBottom: "6px", marginBottom: "6px" }}>
        <div style={{ color: "#000" }}><strong>Bàn:</strong> {master?.ma_ban || "Không xác định"}</div>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "6px" }}>
        <thead>
          <tr style={{ fontSize: "10px", borderBottom: "1px solid black", color: "#000" }}>
            <th style={{ padding: "3px", textAlign: "left", width: "45%", color: "#000" }}>Tên món</th>
            <th style={{ padding: "3px", textAlign: "center", width: "10%", color: "#000" }}>SL</th>
            <th style={{ padding: "3px", textAlign: "center", width: "20%", color: "#000" }}>Giá</th>
            <th style={{ padding: "3px", textAlign: "center", width: "25%", color: "#000" }}>Thành tiền</th>
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
                    <td style={{ padding: "3px", textAlign: "left", wordWrap: "break-word", overflowWrap: "break-word", color: "#000" }}>
                      <span>{item?.ten_vt}</span>
                    </td>
                    <td style={{ padding: "3px", textAlign: "center", color: "#000" }}>{item?.so_luong || 1}</td>
                    <td style={{ padding: "3px", textAlign: "center", color: "#000" }}>{formatNumber(item?.don_gia) || "0"}đ</td>
                    <td style={{ padding: "3px", textAlign: "center", whiteSpace: "nowrap", color: "#000" }}>{formatNumber(item?.thanh_tien) || "0"}đ</td>
                  </tr>

                  {subItems.map((sub, subIndex) => (
                    <tr key={`sub-${index}-${subIndex}`} style={{ fontSize: "12px", color: "#000" }}>
                      <td style={{ padding: "3px", textAlign: "left", wordWrap: "break-word", overflowWrap: "break-word", color: "#000" }}>
                        <span style={{ fontSize: "10px" }}>+ {sub?.ten_vt}</span>
                      </td>
                      <td style={{ padding: "3px", textAlign: "center", color: "#000" }}>{sub?.so_luong || 1}</td>
                      <td style={{ padding: "3px", textAlign: "center", color: "#000" }}>{formatNumber(sub?.don_gia) || "0"}đ</td>
                      <td style={{ padding: "3px", textAlign: "center", whiteSpace: "nowrap", color: "#000" }}>{formatNumber(sub?.thanh_tien) || "0"}đ</td>
                    </tr>
                  ))}

                  {item?.ghi_chu && (
                    <tr key={`note-${index}`} style={{ fontSize: "12px", fontStyle: "italic", color: "#000" }}>
                      <td colSpan="4" style={{ padding: "3px", textAlign: "left", color: "#000" }}>
                        Ghi chú: {item?.ghi_chu}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
        </tbody>
      </table>

      <div style={{ borderTop: "1px solid black", paddingTop: "6px", fontWeight: "bold", textAlign: "right", fontSize: "13px", marginRight: 10, color: "#000" }}>
        Tổng tiền: {formatNumber(master?.tong_tien) || "0"}đ
      </div>

      <div style={{ textAlign: "center", marginTop: "10px", fontStyle: "italic", fontSize: "12px", color: "#000" }}>
        CẢM ƠN QUÝ KHÁCH, HẸN GẶP LẠI!
      </div>
      <div style={{ textAlign: "center", marginTop: "10px" }}>
        <img
          src={`https://img.vietqr.io/image/${account}-qr_only.png?amount=${master?.tong_tien}`}
          alt="QR Code"
          style={{ width: "100px", height: "100px" }}
        />
      </div>
    </div>
  );
});

export default PrintComponent;