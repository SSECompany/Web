import { forwardRef } from "react";
import { useSelector } from "react-redux";
import { formatCurrency } from "../../../../../app/hooks/dataFormatHelper";
import { getUerSetting, getUserInfo } from "../../../../../store/selectors/Selectors";

const NullComponent = ({ children }) => children;

const PrintComponent = forwardRef(
  ({ master = {}, detail = [], items }, ref) => {

    const { fullName } = useSelector(getUserInfo);
    const { address_bp, tell_bp, name_dvcs } = useSelector(getUerSetting);
    var now = new Date()
    return (
      <div className="print-content" style={{ fontFamily: "tahoma", fontSize: 13 }} ref={ref}>
        <div
          style={{
            padding: "0px 0px 20px 0px",
            borderBottom: "1px dotted black",
          }}
        >
          <label style={{ fontWeight: "bold", fontSize: 18 }}>
            {name_dvcs}
          </label>
          <br></br>
          <label>{address_bp}</label>
          <br></br>
          <label>{tell_bp}</label>
        </div>

        <div style={{ textAlign: "center", marginTop: "10px" }}>
          <span style={{ fontWeight: "bold", fontSize: 13 }}>
            HOÁ ĐƠN BÁN HÀNG
          </span>
          <br />
          <span>Ngày bán: {`${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`}</span>
          <br />
          <span>NV: {fullName}</span>
          <br />
          <span style={{ fontWeight: "bold" }}>
            {master?.so_ct || "Không có số CT"}
          </span>
          <br />
        </div>

        <div
          style={{
            marginTop: "30px",
            display: "flex",
            flexDirection: "column",
            gap: "1px",
          }}
        >
          <div>
            <span style={{ fontWeight: "bold" }}>Khách hàng:</span>{" "}
            <span>
              {master?.ma_kh || "Trống"} - {master?.ten_kh || "Trống"}
            </span>
          </div>

          <span>Điện thoại: {master?.dien_thoai || "Trống"}</span>

          <span>Địa chỉ: {master?.dia_chi || "Trống"}</span>

          <div>
            <span style={{ fontWeight: "bold" }}>Nhân viên bán hàng:</span>{" "}
            <span>{fullName || "Trống"}</span>
          </div>
          <div>
            <span style={{ fontWeight: "bold" }}>Ghi chú:</span>{" "}
            <span>{master?.dien_giai || "Trống"}</span>
          </div>
        </div>

        <table
          style={{
            borderCollapse: "collapse",
            width: "100%",
            marginTop: "20px",
          }}
        >
          <thead>
            <tr style={{ textAlign: "left", }}>
              <th style={{ padding: "6px" }} >
                Sản phẩm
              </th>
              <th style={{ padding: "6px" }}>
                Đơn vị
              </th>
              <th style={{ padding: "6px" }}>
                SL
              </th>
              <th style={{ padding: "6px", textAlign: "right", }}>
                Đơn giá
              </th>
              <th style={{ padding: "6px", textAlign: "right", }}>
                Thành tiền
              </th>
            </tr>
          </thead>

          <tbody>
            {detail.map((item, index) => (
              <NullComponent key={index}>
                <tr key={index} style={{ borderTop: `${index == 0 ? "2px solid black" : "1px dotted black"}`, }}>
                  <td style={{ padding: "12px 3px 6px 3px", }} >
                    {item?.ten_vt || "Không rõ"}
                  </td>
                  <td style={{ padding: "3px 6px 12px 3px", textAlign: "left", }}  >
                    {item?.dvt || ""}
                  </td>
                  <td
                    style={{
                      padding: "3px 6px 12px 3px",
                      textAlign: "left",
                    }}
                  >
                    {formatCurrency(item?.so_luong || 0)}
                  </td>
                  <td
                    style={{
                      padding: "3px 6px 12px 3px",
                      textAlign: "right",
                    }}
                  >
                    {formatCurrency(item?.don_gia || 0)}
                  </td>
                  <td
                    style={{
                      padding: "3px 6px 12px 3px",
                      textAlign: "right",
                    }}
                  >
                    {formatCurrency(item?.thanh_tien || 0)}
                  </td>
                </tr>
                <tr
                  style={
                    item?.ghi_chu == ''
                      ? {
                        display: "none",
                      }
                      : {}
                  }
                >
                  <td
                    style={{
                      padding: "3px 6px 12px 3px",
                      textAlign: "left",
                    }}
                  >
                    Ghi chú :{(item?.ghi_chu || '')}
                  </td>
                </tr>
              </NullComponent>
            ))}
          </tbody>
        </table>

        <div
          style={{
            marginTop: "20px",
            textAlign: "right",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: "5px",
            padding: "0px 6px 0px 0px",
          }}
        >
          <div
            style={{
              display: "flex",
            }}
          >
            <div style={{ width: "100px", textAlign: "left" }}>Tổng tiền</div>
            <div style={{ width: "100px", textAlign: "right" }}>
              {formatCurrency(master?.tong_tien) || "Trống"}
            </div>
          </div>

          <div
            style={{
              display: "flex",
            }}
          >
            <div style={{ width: "100px", textAlign: "left" }}>Chiết khấu</div>
            <div style={{ width: "100px", textAlign: "right" }}>
              {formatCurrency(master?.tong_ck) || "Trống"}
            </div>
          </div>

          <div style={{ display: "flex", }} >
            <div style={{ width: "100px", textAlign: "left" }}>Thuế</div>
            <div style={{ width: "100px", textAlign: "right" }}>
              {formatCurrency(master?.tong_thue) || "Trống"}
            </div>
          </div>
          <div style={{ display: "flex", }} >
            <div style={{ width: "100px", textAlign: "left" }}>Điểm</div>
            <div style={{ width: "100px", textAlign: "right" }}>
              {formatCurrency(master?.tien_diem) || "Trống"}
            </div>
          </div>
          <div
            style={{
              display: "flex",
            }}
          >
            <div style={{ width: "100px", textAlign: "left" }}>Voucher:</div>
            <div style={{ width: "100px", textAlign: "left" }}>  {(master?.voucherId) || "Trống"}  </div>
            <div style={{ width: "100px", textAlign: "right" }}>  {formatCurrency(master?.tien_voucher) || "Trống"}  </div>
          </div>

          <div
            style={{
              display: "flex",
            }}
          >
            <div
              style={{ width: "100px", textAlign: "left", fontWeight: "bold" }}
            >
              Thanh toán
            </div>
            <div
              style={{ width: "30px", textAlign: "left", fontWeight: "bold" }}
            >
              <span>{master.httt == 'qr' ? 'qr' : master.httt == 'chuyen_khoan' ? 'ck' : 'tm'}</span>
            </div>
            <div
              style={{ width: "100px", textAlign: "right", fontWeight: "bold" }}
            >
              {formatCurrency(master?.tong_tt) || "Trống"}
            </div>
          </div>
        </div>

        <div
          style={{
            marginTop: "40px",
            borderBottom: "3px solid black",
            padding: "0px 0px 5px 0px",
          }}
        >
          <div style={{ width: "100%" }} >
            <span>Lưu ý</span>
          </div>
          <div style={{ width: "100%", marginTop: "10px" }} >
            <span style={{ fontStyle: "italic" }}>1.Quý khách vui lòng kiểm tra lại hàng và hóa đơn trước khi ra về</span>
            <br />
            <span style={{ fontStyle: "italic" }}>2.Quý khách vui lòng đem theo hóa đơn này khi đổi trả hàng lỗi,hỏng</span>
          </div>
          <div style={{ width: "100%", marginTop: "40px" }} >
            <span style={{ fontStyle: "italic", textAlign: "center", fontWeight: "bold" }}>CẢM ƠN QUÝ KHÁCH VÀ HẸN GẶP LẠI</span>
          </div>
        </div>
      </div>
    );
  }
);

export default PrintComponent;
