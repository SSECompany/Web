import React, { forwardRef } from "react";
import { formatCurrency } from "app/hooks/dataFormatHelper";
import { getUserInfo,getUerSetting } from "store/selectors/Selectors";
import { useSelector } from "react-redux";

const NullComponent = ({ children }) => children;

const PrintComponent = forwardRef(
  ({ master = {}, detail = [], items }, ref) => {

    const { fullName} = useSelector(getUserInfo);
    return (
      <div className="print-content" style={{ fontFamily: "tahoma" }} ref={ref}>
        <div
          style={{
            padding: "0px 0px 20px 0px",
            borderBottom: "1px dotted black",
          }}
        >
          <label style={{ fontWeight: "bold" }}>
            {master?.ten_dvcs || "SSE"}
          </label>
          <br></br>
          <label>{master?.ten_bp || "Chi nhánh miền bắc"}</label>
        </div>

        <div style={{ textAlign: "center", marginTop: "10px" }}>
          <span style={{ fontWeight: "bold", fontSize: 18 }}>
            HOÁ ĐƠN BÁN HÀNG
          </span>
          <br />
          <span style={{ fontWeight: "bold" }}>
            {master?.so_ct || "Không có số CT"}
          </span>
          <br />
          <span>Ngày bán: {new Date().toLocaleDateString("en-US")}</span>
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
            <tr style={{textAlign: "left",}}>
              <th style={{padding: "6px"}}>
                Sản phẩm
              </th>
              <th style={{padding: "6px"}}>
                Đơn vị
              </th>
              <th style={{padding: "6px"}}>
                Số lượng
              </th>
              <th style={{padding: "6px",textAlign: "right",}}>
                Đơn giá
              </th>
              <th style={{padding: "6px",textAlign: "right",}}>
                Thành tiền
              </th>
            </tr>
          </thead>

          <tbody>
            {detail.map((item, index) => (
              <NullComponent key={index}>
                <tr key={index} style={{ borderTop: `${ index == 0 ? "2px solid black" : "1px dotted black" }`,}}>
                  <td  style={{ padding: "12px 3px 6px 3px", }} >
                    {item?.ten_vt || "Không rõ"}
                  </td>
                  <td style={{ padding: "3px 6px 12px 3px",  textAlign: "left",  }}  >
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
                      textAlign: "left",
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
                    item?.ghi_chu==''
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

          <div
            style={{
              display: "flex",
            }}
          >
            <div style={{ width: "100px", textAlign: "left" }}>Thuế</div>
            <div style={{ width: "100px", textAlign: "right" }}>
              {formatCurrency(master?.tong_thue) || "Trống"}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              color: "red",
            }}
          >
            <div
              style={{ width: "100px", textAlign: "left", fontWeight: "bold" }}
            >
              Thanh toán
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
            textAlign: "center",
            borderBottom: "3px solid black",
            padding: "0px 0px 5px 0px",
          }}
        >
          <span style={{ fontStyle: "italic" }}>Cảm ơn và hẹn gặp lại</span>
        </div>
      </div>
    );
  }
);

export default PrintComponent;
