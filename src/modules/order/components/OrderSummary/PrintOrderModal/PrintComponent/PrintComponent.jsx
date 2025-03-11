import { forwardRef } from "react";

const PrintComponent = forwardRef(
  ({ master = {}, detail = [] }, ref) => {
    var now = new Date();

    const formatNumber = (val) => {
      if (!val) return "0";
      return `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ".").replace(/\.(?=\d{0,2}$)/g, ",");
    };

    return (
      <div className="print-content" style={{ fontFamily: "Arial", fontSize: 13, padding: "12px", maxWidth: "250px" }} ref={ref}>
        <div style={{ textAlign: "center", marginBottom: "8px" }}>
          <label style={{ fontWeight: "bold", fontSize: 16 }}>HÓA ĐƠN</label>
          <br />
          <span>Ngày bán: {`${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`}</span>
        </div>

        <div style={{ paddingBottom: "6px", marginBottom: "6px" }}>
          <div><strong>Bàn:</strong> {master?.ma_ban || "Không xác định"}</div>
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "6px" }}>
          <thead>
            <tr style={{ fontSize: 12 }}>
              <th style={{ borderBottom: "1px solid black", padding: "3px", textAlign: "left", whiteSpace: "nowrap", width: "40%" }}>Tên món</th>
              <th style={{ borderBottom: "1px solid black", padding: "3px", textAlign: "center", whiteSpace: "nowrap", width: "10%" }}>SL</th>
              <th style={{ borderBottom: "1px solid black", padding: "3px", textAlign: "center", whiteSpace: "nowrap", width: "25%" }}>Giá</th>
              <th style={{ borderBottom: "1px solid black", padding: "3px", textAlign: "center", whiteSpace: "nowrap", width: "25%" }}>Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            {detail.map((item, index) => (
              <tr key={index} style={{ fontSize: 11 }}>
                <td style={{ padding: "3px", whiteSpace: "nowrap" }}>{item?.ten_vt || "Trống"}</td>
                <td style={{ padding: "3px", textAlign: "center" }}>{item?.so_luong || 1}</td>
                <td style={{ padding: "3px", textAlign: "center" }}>{formatNumber(item?.don_gia) || "0"}đ</td>
                <td style={{ padding: "3px", textAlign: "center" }}>{formatNumber(item?.thanh_tien) || "0"}đ</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ borderTop: "1px solid black", paddingTop: "6px", fontWeight: "bold", textAlign: "right", fontSize: 15 }}>
          Tổng tiền: {formatNumber(master?.tong_tien) || "0"}đ
        </div>

        <div style={{ textAlign: "center", marginTop: "12px", fontStyle: "italic", fontSize: 14 }}>
          CẢM ƠN QUÝ KHÁCH, HẸN GẶP LẠI!
        </div>
      </div>
    );
  }
);

export default PrintComponent;