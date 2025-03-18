import { forwardRef } from "react";

const PrintComponent = forwardRef(({ master = {}, detail = [] }, ref) => {
  var now = new Date();

  const formatNumber = (val) => {
    if (!val) return "0";
    return `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ".").replace(/\.(?=\d{0,2}$)/g, ",");
  };

  return (
    <div className="print-content" style={{ fontFamily: "Arial", fontSize: "12px", padding: "10px", maxWidth: "260px" }} ref={ref}>
      <div style={{ textAlign: "center", marginBottom: "8px" }}>
        <label style={{ fontWeight: "bold", fontSize: "14px" }}>HÓA ĐƠN</label>
        <br />
        <span>
          Ngày bán: {`${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`}
        </span>
      </div>

      <div style={{ paddingBottom: "6px", marginBottom: "6px" }}>
        <div><strong>Bàn:</strong> {master?.ma_ban || "Không xác định"}</div>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "6px" }}>
        <thead>
          <tr style={{ fontSize: "12px", borderBottom: "1px solid black" }}>
            <th style={{ padding: "3px", textAlign: "left", width: "45%", }}>Tên món</th>
            <th style={{ padding: "3px", textAlign: "center", width: "10%" }}>SL</th>
            <th style={{ padding: "3px", textAlign: "center", width: "20%" }}>Giá</th>
            <th style={{ padding: "3px", textAlign: "center", width: "25%" }}>Thành tiền</th>
          </tr>
        </thead>
        <tbody>
          {detail.map((item, index) => (
            <tr key={index} style={{ fontSize: "12px" }}>
              <td style={{ padding: "3px", textAlign: "left", wordWrap: "break-word", overflowWrap: "break-word" }}>{item?.ten_vt || "Trống"}</td>
              <td style={{ padding: "3px", textAlign: "center" }}>{item?.so_luong || 1}</td>
              <td style={{ padding: "3px", textAlign: "center" }}>{formatNumber(item?.don_gia) || "0"}đ</td>
              <td style={{ padding: "3px", textAlign: "center", whiteSpace: "nowrap" }}>{formatNumber(item?.thanh_tien) || "0"}đ</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ borderTop: "1px solid black", paddingTop: "6px", fontWeight: "bold", textAlign: "right", fontSize: "13px", marginRight: 10 }}>
        Tổng tiền: {formatNumber(master?.tong_tien) || "0"}đ
      </div>

      <div style={{ textAlign: "center", marginTop: "10px", fontStyle: "italic", fontSize: "12px" }}>
        CẢM ƠN QUÝ KHÁCH, HẸN GẶP LẠI!
      </div>
    </div>
  );
});

export default PrintComponent;