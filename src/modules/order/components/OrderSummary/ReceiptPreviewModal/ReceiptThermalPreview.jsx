import React from "react";
import { useSelector } from "react-redux";
import { formatNumber } from "../../../../../app/hook/dataFormatHelper";
import VietQR from "../../../../../components/common/GenerateQR/VietQR";
import "./ReceiptThermalPreview.css";

const formatPaymentMethodShort = (method) => {
  if (!method) return "TM";
  const methods = String(method)
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean);
  const hasCash = methods.includes("tien_mat");
  const hasTransfer = methods.includes("chuyen_khoan");
  const hasDebt = methods.includes("cong_no");

  let label;
  if (hasDebt) label = "Công nợ";
  else if (hasCash && hasTransfer) label = "CK + TM";
  else if (hasTransfer) label = "CK";
  else label = "TM";

  return label.toUpperCase();
};

/**
 * Preview hóa đơn giống mẫu in thermal của IminPrinterService.printReceipt
 * (ĐẠI HỌC PHENIKAA, địa chỉ Nguyễn Văn Trác, Số thẻ, bảng món, chiết khấu, tổng tiền)
 */
// Fallback QR payload nếu Redux chưa có data
const FALLBACK_QR_PAYLOAD =
  "";

const PRINT_FOOTER_BRAND =
  process.env.REACT_APP_PRINT_FOOTER_BRAND || "PHX SMART SCHOOL";
const PRINT_FOOTER_WEBSITE =
  process.env.REACT_APP_PRINT_FOOTER_WEBSITE || "https://phx-smartschool.com";
const PRINT_FOOTER_HOTLINE =
  process.env.REACT_APP_PRINT_FOOTER_HOTLINE || "123456789";
const PRINT_FOOTER_EMAIL =
  process.env.REACT_APP_PRINT_FOOTER_EMAIL ||
  "phongdichvu@phx-smartschool.com";

const ReceiptThermalPreview = ({
  master = {},
  detail = [],
  isReprint = true,
  numberOfCopies = 1,
  copyIndex = 1,
}) => {
  // Lấy QR payload + info từ Redux (hoặc fallback)
  const qrPayload = useSelector(
    (state) => state.qrCode?.qrPayload || FALLBACK_QR_PAYLOAD
  );
  const qrCodeData = useSelector((state) => state.qrCode?.qrCodeData);
  const qrInfo = Array.isArray(qrCodeData) ? qrCodeData[0] || {} : qrCodeData || {};

  const now = new Date();
  const dateOnly = `${now.getDate().toString().padStart(2, "0")}/${(
    now.getMonth() + 1
  )
    .toString()
    .padStart(2, "0")}/${now.getFullYear()}`;
  const timeOnly = `${now.getHours().toString().padStart(2, "0")}:${now
    .getMinutes()
    .toString()
    .padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;

  const soThe = (master?.so_the && master.so_the.trim()) || (master?.ma_ban && master.ma_ban.trim()) || "";
  const soTheHienThi = soThe && soThe.toUpperCase() !== "POS" ? soThe : "";

  const isXuatHoaDonOrKhachTraSau =
    master?.xuat_hoa_don_yn === "1" || master?.kh_ts_yn === "1";
  const mainItems = (detail || []).filter((d) => !d?.ma_vt_root);
  const totalDiscount = (detail || []).reduce((sum, d) => {
    const val = parseFloat(d?.chiet_khau_print || 0);
    return sum + (isNaN(val) ? 0 : val);
  }, 0);

  return (
    <div className="receipt-thermal-preview">
      {/* Header + dòng hình thức thanh toán + Liên */}
      <div className="rtep-header-wrapper">
        <div className="rtep-header">
          <div className="rtep-title rtep-center rtep-bold">ĐẠI HỌC PHENIKAA</div>
          <div className="rtep-subtitle rtep-center">
            Địa chỉ: Nguyễn Văn Trác, Dương Nội, Hà Nội
          </div>
        </div>

        {/* Dòng [PHƯƠNG THỨC] + Liên / IN LẠI Liên giống IminPrinterService */}
        <div className="rtep-payment-row">
          <div className="rtep-payment-label rtep-bold">
            {`[${formatPaymentMethodShort(master?.httt || "")}]`}
          </div>
          {soTheHienThi && (
            <div className="rtep-payment-sothe rtep-bold">
              {`[${soTheHienThi}]`}
            </div>
          )}
          <div className="rtep-payment-copy rtep-bold">
            {isReprint
              ? "IN LẠI"
              : numberOfCopies > 1
                ? `Liên: ${copyIndex}/${numberOfCopies}`
                : ""}
          </div>
        </div>

        {/* Thông tin đơn - căn trái, gọn giống mẫu in thật */}
        <div className="rtep-info">
          <div>
            Tên khách:{" "}
            {(master?.ong_ba && master.ong_ba.trim()) ||
              (master?.ten_kh && master.ten_kh.trim()) ||
              "Khách hàng căng tin"}
          </div>
          <div>Số CT: {master?.so_ct || "Chưa có"}</div>
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

      {/* Footer block: Tổng tiền (lệch phải) + Số thẻ + ngày/giờ + nhân viên/DVCS + hotline/email */}
      <div className="rtep-footer">
        <div className="rtep-tongtien rtep-bold rtep-right">
          Tổng tiền: {formatNumber(master?.tong_tien || 0)}đ
        </div>

        <div className="rtep-footer-line">
          {dateOnly}&nbsp;&nbsp;&nbsp;&nbsp;{timeOnly}
        </div>
        {(master?.ten_nvbh || master?.ten_dvcs || master?.unitName || master?.DVCS) && (
          <div className="rtep-footer-line rtep-bold">
            {[
              (master?.ten_nvbh || "").toString().trim(),
              (master?.ten_dvcs || master?.unitName || master?.DVCS || "")
                .toString()
                .trim(),
            ]
              .filter(Boolean)
              .join(" - ")}
          </div>
        )}
        {(master?.HotlineBill || qrInfo?.HotlineBill || PRINT_FOOTER_HOTLINE) && (
          <div className="rtep-footer-line">
            Hotline: {master?.HotlineBill || qrInfo?.HotlineBill || PRINT_FOOTER_HOTLINE}
          </div>
        )}
        {(master?.EmailBill || qrInfo?.EmailBill || PRINT_FOOTER_EMAIL) && (
          <div className="rtep-footer-line">
            Email: {master?.EmailBill || qrInfo?.EmailBill || PRINT_FOOTER_EMAIL}
          </div>
        )}
        {/* Gộp brand/website vào cùng khối footer để giảm khoảng cách dòng, căn phải (tương tự tổng tiền) */}
        {PRINT_FOOTER_BRAND && PRINT_FOOTER_WEBSITE && (
          <div className="rtep-footer-line rtep-bold rtep-center">
            {PRINT_FOOTER_BRAND} - {PRINT_FOOTER_WEBSITE}
          </div>
        )}
      </div>

      {/* QR thanh toán: căn giữa, giống vị trí trên hóa đơn thật */}
      <div className="rtep-qr-bottom">
        <VietQR payload={qrPayload} size={72} />
      </div>

      <div className="rtep-thanks rtep-center rtep-italic">
        CẢM ƠN QUÝ KHÁCH, HẸN GẶP LẠI!
      </div>
    </div>
  );
};

export default ReceiptThermalPreview;
