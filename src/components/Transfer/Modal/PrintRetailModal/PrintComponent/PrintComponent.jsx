import { forwardRef } from "react";

const PrintComponent = forwardRef(
  ({ master = {}, detail = [] }, ref) => {
    console.log("🚀 ~ detail:", detail)

    var now = new Date()
    return (
      <div className="print-content" style={{ fontFamily: "tahoma", fontSize: 13, padding: "20px" }} ref={ref}>
        <div
          style={{
            padding: "10px",
            borderBottom: "1px dotted black",
          }}
        >
          <label style={{ fontWeight: "bold", fontSize: 14 }}>
            {master?.name_dvcs}
          </label>
          <br></br>
          <label>{master?.address_bp}</label>
          <br></br>
          <label>{master?.tell_bp}</label>
        </div>

        <div style={{ textAlign: "center", marginTop: "10px" }}>
          <span style={{ fontWeight: "bold", fontSize: 13 }}>
            PHIẾU XUẤT ĐIỀU CHUYỂN
          </span>
          <br />
          <span>Ngày bán: {`${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`}</span>
          <br />
          <span>
            Số chứng từ: {master?.so_ct || "Không có số CT"}
          </span>
          <br />
        </div>

        <div
          style={{
            marginTop: 20,
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            padding: "10px",
            marginBottom: 20
          }}
        >
          <div><strong>Người nhận hàng:</strong> {master?.ong_ba || "Trống"}</div>
          <div><strong>Diễn giải:</strong> {master?.dien_giai || "Trống"}</div>
          <div><strong>Kho xuất:</strong> {master?.ten_kho || "Trống"}</div>
          <div><strong>Kho nhập:</strong> {master?.ten_khon || "Trống"}</div>
        </div>

        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginBottom: "20px",
            padding: "10px",
          }}
        >
          <thead>
            <tr style={{ textAlign: "center" }}>
              <th style={{ borderRight: "1px solid black", borderBottom: "1px solid black", padding: "8px" }}>STT</th>
              <th style={{ borderRight: "1px solid black", borderBottom: "1px solid black", padding: "8px" }}>Tên vật tư</th>
              <th style={{ borderRight: "1px solid black", borderBottom: "1px solid black", padding: "8px" }}>Đvt</th>
              <th style={{ borderBottom: "1px solid black", padding: "8px" }}>Số lượng</th>
            </tr>
          </thead>
          <tbody>
            {detail.map((item, index) => (
              <tr key={index}>
                <td style={{ borderRight: "1px solid black", textAlign: "center", padding: "8px" }}>{index + 1}</td>
                <td style={{ borderRight: "1px solid black", textAlign: "center", padding: "8px" }}>{item?.ten_vt || "Trống"}</td>
                <td style={{ borderRight: "1px solid black", textAlign: "center", padding: "8px" }}>{item?.dvt || "Trống"}</td>
                <td style={{ textAlign: "center", padding: "8px" }}>{item?.so_luong || ""}</td>
              </tr>
            ))}
            {detail.length === 0 && (
              <tr>
                <td colSpan={4} style={{ textAlign: "center", padding: "8px", border: "1px solid black" }}>
                  Không có dữ liệu
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div style={{ marginTop: "30px", display: "flex", justifyContent: "space-evenly" }}>
          <div style={{ textAlign: "center" }}>
            <div>Người lập</div>
            <div>(Ký, họ tên)</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div>Người nhận hàng</div>
            <div>(Ký, họ tên)</div>
          </div>
        </div>


        <div
          style={{
            marginTop: "30px",
            borderBottom: "3px solid black",
            padding: "10px 0px",
          }}
        >
          <div style={{ width: "100%", marginTop: "30px" }} >
            <span style={{ fontStyle: "italic", display: "flex", justifyContent: "center" }}>CẢM ƠN QUÝ KHÁCH</span>
          </div>
        </div>
      </div>
    );
  }
);

export default PrintComponent;
