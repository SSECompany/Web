import React, { forwardRef } from "react";
import { formatNumber } from "../../../../../app/hook/dataFormatHelper";
import VietQR from "../../../../../components/common/GenerateQR/VietQR";

const account = process.env.REACT_APP_VIETQR_ACCOUNT;

const PrintComponent = forwardRef(({ master = {}, detail = [] }, ref) => {
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
        case "benhnhan_tratruoc":
          return "Người bệnh trả trước";
        case "sinhvien_tratruoc":
          return "Sinh viên trả trước";
        default:
          return "Tiền mặt";
      }
    });

    return formattedMethods.join(" + ");
  };

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
      <div style={{ textAlign: "center" }}>
        <img
          src="/logo.jpeg"
          alt="Phenikaa MEC Logo"
          style={{ width: "120px", height: "auto", marginBottom: "8px" }}
        />
      </div>
      <div style={{ textAlign: "center", marginBottom: "8px" }}>
        <label style={{ fontWeight: "bold", fontSize: "14px", color: "#000" }}>
          HÓA ĐƠN
        </label>
        <br />
        <span>
          {`${now.getDate().toString().padStart(2, "0")}/${(now.getMonth() + 1)
            .toString()
            .padStart(2, "0")}/${now.getFullYear()} ${now
            .getHours()
            .toString()
            .padStart(2, "0")}:${now
            .getMinutes()
            .toString()
            .padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`}
        </span>
      </div>

      {master?.ten_kh && master.ten_kh !== "Khách hàng căng tin" && (
        <div style={{ color: "#000", marginBottom: "6px" }}>
          <strong>Tên khách:</strong> {master.ten_kh}
        </div>
      )}
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
      <div style={{ paddingBottom: "6px" }}>
        <div style={{ color: "#000" }}>
          <strong>Giường:</strong> {master?.ma_ban || "Không xác định"}
        </div>
      </div>
      {/* Removed payment method and breakdown per request */}

      {/* Removed top Số CT block per request */}
      <div style={{ color: "#000", marginBottom: "6px" }}>
        <strong>Nhân viên:</strong> {master?.username || "Không xác định"}
      </div>

      <div
        style={{ borderTop: "1px solid #000", opacity: 0.2, margin: "8px 0" }}
      />

      <div style={{ width: "100%", marginBottom: "6px" }}>
        {master?.noFamilyMeals ? (
          <div
            style={{
              textAlign: "center",
              padding: "20px 0",
              color: "#000",
              fontSize: "12px",
              fontStyle: "italic",
            }}
          >
            Không có suất người nhà người bệnh
          </div>
        ) : (
          (() => {
            const groups = { "Ca sáng": [], "Ca trưa": [], "Ca chiều": [] };
            detail.forEach((d) => {
              const label = (d?.caLabel || "").trim();
              if (label === "Ca sáng") groups["Ca sáng"].push(d);
              else if (label === "Ca trưa") groups["Ca trưa"].push(d);
              else if (label === "Ca chiều") groups["Ca chiều"].push(d);
              else groups["Ca sáng"].push(d); // fallback
            });
            return Object.entries(groups).map(([label, items], idx) => {
              if (!items || items.length === 0) return null;
              const entries = (
                <div key={label + idx} style={{ marginBottom: 8 }}>
                  <div style={{ fontWeight: 700, color: "#000" }}>{label}</div>
                  {items.map((item, index) => (
                    <div key={index} style={{ color: "#000", marginBottom: 6 }}>
                      <div style={{ fontSize: "12px", fontWeight: 600 }}>
                        {item?.selected_meal?.label || item?.ten_vt}
                      </div>
                      <div style={{ paddingLeft: 10, fontSize: "12px" }}>
                        <div>+ Số lượng: {item?.so_luong || 1}</div>
                        <div>+ Giá: {formatNumber(item?.don_gia) || "0"}đ</div>
                        <div>
                          + Thành tiền: {formatNumber(item?.thanh_tien) || "0"}đ
                        </div>
                        {item?.modeName && <div>+ Chế độ: {item.modeName}</div>}
                        {typeof item?.isPaid === "boolean" && (
                          <div>
                            + Thu tiền:{" "}
                            {item.isPaid ? "Đã thu tiền" : "Chưa thu tiền"}
                          </div>
                        )}
                        {item?.so_ct && <div>+ Số chứng từ: {item.so_ct}</div>}
                        {item?.ghi_chu && <div>+ Ghi chú: {item.ghi_chu}</div>}
                      </div>
                    </div>
                  ))}
                  {/* separator per group - will conditionally render below */}
                </div>
              );
              return (
                <React.Fragment key={label + idx}>
                  {entries}
                  {idx < Object.keys(groups).length - 1 && (
                    <div
                      style={{
                        borderBottom: "1px solid #000",
                        opacity: 0.2,
                        marginTop: 6,
                      }}
                    />
                  )}
                </React.Fragment>
              );
            });
          })()
        )}
      </div>

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
        <div
          style={{
            display: "inline-block",
            border: "1px solid #ccc",
            borderRadius: 8,
            padding: 6,
            background: "#fff",
          }}
        >
          {(() => {
            const totalAmount = Number(master?.tong_tien || 0);
            const prepaidAmount =
              Number(master?.benhnhan_tratruoc || 0) +
              Number(master?.sinhvien_tratruoc || 0);
            const remainingAmount = totalAmount - prepaidAmount;
            const qrAmount =
              master?.chuyen_khoan && Number(master.chuyen_khoan) > 0
                ? master.chuyen_khoan
                : remainingAmount > 0
                ? remainingAmount
                : totalAmount;

            return (
              <VietQR
                amount={qrAmount}
                soChungTu={`Thanh toan Phenikaa so CT ${(
                  master?.so_ct || ""
                ).trim()} ${qrAmount}vnd`}
                size={80}
              />
            );
          })()}
        </div>
      </div>

      {/* Removed footer website block per request */}
    </div>
  );
});

export default PrintComponent;
