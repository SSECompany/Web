import React from "react";
import { formatNumber } from "../../../../../app/hook/dataFormatHelper";
import VietQR from "../../../../../components/common/GenerateQR/VietQR";
import "./ReceiptThermalPreview.css";

const formatPaymentMethod = (method) => {
  if (!method) return "Tiền mặt";
  const methods = String(method)
    .split(",")
    .map((m) => m.trim());
  const formatted = methods.map((m) => {
    if (m === "chuyen_khoan") return "Chuyển khoản";
    if (m === "tien_mat") return "Tiền mặt";
    return "Tiền mặt";
  });
  return formatted.join(" + ");
};

/**
 * Preview hóa đơn giống mẫu in thermal của IminPrinterService.printReceipt
 * (ĐẠI HỌC PHENIKAA, địa chỉ Nguyễn Văn Trác, Số thẻ, bảng món, chiết khấu, tổng tiền)
 */
// EMVCo/VietQR raw payload – cần đồng bộ với PAYMENT_EMV_PAYLOAD trong PaymentModal & IminPrinterService
const PAYMENT_EMV_PAYLOAD =
  "00020101021138560010A0000007270126000697041201121090034978650208QRIBFTTA53037045802VN6304C4F0";

const ReceiptThermalPreview = ({
  master = {},
  detail = [],
  receiptTitle = "HÓA ĐƠN (IN LẠI)",
}) => {
  const now = new Date();
  const dateStr = `${now.getDate().toString().padStart(2, "0")}/${(now.getMonth() + 1).toString().padStart(2, "0")}/${now.getFullYear()} ${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;

  const soThe = (master?.so_the && master.so_the.trim()) || (master?.ma_ban && master.ma_ban.trim()) || "";
  const soTheHienThi = soThe && soThe.toUpperCase() !== "POS" ? soThe : "";

  const isXuatHoaDonOrKhachTraSau = master?.xuat_hoa_don_yn === "1" || master?.kh_ts_yn === "1";
  const mainItems = (detail || []).filter((d) => !d?.ma_vt_root);
  const totalDiscount = (detail || []).reduce((sum, d) => {
    const val = parseFloat(d?.chiet_khau_print || 0);
    return sum + (isNaN(val) ? 0 : val);
  }, 0);

  return (
    <div className="receipt-thermal-preview">
      {/* Khu vực header + QR + thông tin đơn */}
      <div className="rtep-header-wrapper">
        {/* Header - căn giữa */}
        <div className="rtep-header">
          <div className="rtep-title rtep-center rtep-bold">ĐẠI HỌC PHENIKAA</div>
          <div className="rtep-subtitle rtep-center">
            Địa chỉ: Nguyễn Văn Trác, Dương Nội, Hà Nội
          </div>
          <div className="rtep-title rtep-center rtep-bold">{receiptTitle}</div>
          <div className="rtep-date rtep-center">{dateStr}</div>
          {soTheHienThi ? (
            <div className="rtep-bold rtep-center rtep-card-number">
              Số thẻ: {soTheHienThi}
            </div>
          ) : null}
        </div>

        {/* QR thanh toán ở ô bên trái (giống vị trí trên hóa đơn thật) */}
        <div className="rtep-qr-box">
          {/* Chỉ hiển thị QR nếu có chuyển khoản */}
          {String(master?.httt || "")
            .split(",")
            .map((m) => m.trim())
            .includes("chuyen_khoan") && (
            <VietQR payload={PAYMENT_EMV_PAYLOAD} size={64} />
          )}
        </div>

        {/* Thông tin đơn - căn trái */}
        <div className="rtep-info">
          {(master?.ten_nvbh || "").toString().trim() ? (
            <div>Nhân viên: {master.ten_nvbh}</div>
          ) : null}
          <div>
            Tên khách:{" "}
            {(master?.ong_ba && master.ong_ba.trim()) ||
              (master?.ten_kh && master.ten_kh.trim()) ||
              "Khách hàng căng tin"}
          </div>
          {master?.ma_so_thue_kh && master.ma_so_thue_kh.trim() ? (
            <div>Mã số thuế: {master.ma_so_thue_kh}</div>
          ) : null}
          {!isXuatHoaDonOrKhachTraSau && (
            <>
              {Number(master?.chuyen_khoan || 0) > 0 &&
                Number(master?.tien_mat || 0) > 0 && (
                  <>
                    {Number(master?.chuyen_khoan || 0) > 0 && (
                      <div>• Chuyển khoản: {formatNumber(master.chuyen_khoan)}đ</div>
                    )}
                    {Number(master?.tien_mat || 0) > 0 && (
                      <div>• Tiền mặt: {formatNumber(master.tien_mat)}đ</div>
                    )}
                  </>
                )}
            </>
          )}
          <div>Số CT: {master?.so_ct || "Chưa có"}</div>
          {(master?.ten_dvcs || master?.unitName || master?.DVCS || "")
            .toString()
            .trim() ? (
            <div>Tên DVCS: {master?.ten_dvcs || master?.unitName || master?.DVCS}</div>
          ) : null}
        </div>
      </div>


      {/* Bảng món */}
      <div className="rtep-table-header rtep-bold">
        <span className="rtep-col-name">Tên món</span>
        <span className="rtep-col-sl">SL</span>
        <span className="rtep-col-gia">Giá</span>
        <span className="rtep-col-tt">Thành tiền</span>
      </div>

      {mainItems.map((item, idx) => {
        const displayName = item?.selected_meal?.label || item?.ten_vt || "";
        const thanhTien = item?.thanh_tien_print ?? item?.thanh_tien ?? (Number(item?.don_gia || 0) * Number(item?.so_luong || 1));
        const subItems = (detail || []).filter(
          (sub) => sub?.ma_vt_root === item?.ma_vt && sub?.uniqueid === item?.uniqueid
        );
        return (
          <React.Fragment key={idx}>
            <div className="rtep-row">
              <span className="rtep-col-name">{displayName}</span>
              <span className="rtep-col-sl">{item?.so_luong || 1}</span>
              <span className="rtep-col-gia">{formatNumber(item?.don_gia || 0)}đ</span>
              <span className="rtep-col-tt">{formatNumber(thanhTien)}đ</span>
            </div>
            {subItems.map((sub, sidx) => {
              const subThanhTien = sub?.thanh_tien_print ?? sub?.thanh_tien ?? (Number(sub?.don_gia || 0) * Number(sub?.so_luong || 1));
              return (
                <div className="rtep-row rtep-sub" key={`${idx}-${sidx}`}>
                  <span className="rtep-col-name">+ {sub?.ten_vt || ""}</span>
                  <span className="rtep-col-sl">{sub?.so_luong || 1}</span>
                  <span className="rtep-col-gia">{formatNumber(sub?.don_gia || 0)}đ</span>
                  <span className="rtep-col-tt">{formatNumber(subThanhTien)}đ</span>
                </div>
              );
            })}
            {item?.ghi_chu ? (
              <div className="rtep-ghichu">Ghi chú: {item.ghi_chu}</div>
            ) : null}
          </React.Fragment>
        );
      })}

      <div className="rtep-line" />
      {totalDiscount > 0 ? (
        <div className="rtep-right">Chiết khấu: {formatNumber(totalDiscount)}đ</div>
      ) : null}
      <div className="rtep-tongtien rtep-bold rtep-right">
        Tổng tiền: {formatNumber(master?.tong_tien || 0)}đ
      </div>

      <div className="rtep-thanks rtep-center rtep-italic">
        CẢM ƠN QUÝ KHÁCH, HẸN GẶP LẠI!
      </div>
    </div>
  );
};

export default ReceiptThermalPreview;
