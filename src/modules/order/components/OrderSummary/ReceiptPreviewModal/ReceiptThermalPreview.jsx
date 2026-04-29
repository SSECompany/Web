import React from "react";
import { QRCodeSVG } from "qrcode.react";
import { formatNumber } from "../../../../../app/hook/dataFormatHelper";
import jwt from "../../../../../utils/jwt";
import "./ReceiptThermalPreview.css";

const LINE_FULL_WIDTH = "─────────────────";

const formatPaymentMethod = (method) => {
  if (!method) return "Tiền mặt";
  const methods = String(method)
    .split(",")
    .map((m) => m.trim());
  const formatted = methods.map((m) => {
    switch (m) {
      case "chuyen_khoan":
        return "Chuyển khoản";
      case "tien_mat":
        return "Tiền mặt";
      case "tra_sau":
        return "Trả sau";
      case "benhnhan_tratruoc":
        return "Người bệnh trả trước";
      case "sinhvien_tratruoc":
        return "Sinh viên trả trước";
      default:
        return "Tiền mặt";
    }
  });
  return formatted.join(" + ");
};

/**
 * Preview hóa đơn giống mẫu in thermal của IminPrinterService.printReceipt
 */
const ReceiptThermalPreview = ({
  master = {},
  detail = [],
  receiptTitle = "HÓA ĐƠN (IN LẠI)",
}) => {
  const now = new Date();
  const dateStr = `${now.getDate().toString().padStart(2, "0")}/${(now.getMonth() + 1).toString().padStart(2, "0")}/${now.getFullYear()} ${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;

  const headerImagePath =
    (typeof process !== "undefined" && process.env?.REACT_APP_RECEIPT_HEADER_IMAGE) ||
    "/logo.jpeg";
  const headerImageUrl = headerImagePath.startsWith("http")
    ? headerImagePath
    : (typeof window !== "undefined" ? window.location.origin : "") +
      (typeof process !== "undefined" && process.env?.PUBLIC_URL ? process.env.PUBLIC_URL : "") +
      headerImagePath;

  let staffName = (master?.ten_nvbh && master.ten_nvbh.trim()) ? master.ten_nvbh : "";
  try {
    const rawToken =
      typeof window !== "undefined" &&
      window.localStorage &&
      window.localStorage.getItem("access_token");
    const claims =
      rawToken && rawToken.split(".").length === 3 ? (jwt.getClaims && jwt.getClaims()) || {} : {};
    if (claims && claims.FullName) staffName = String(claims.FullName).trim();
  } catch (_) {}

  const countPaymentMethods = [
    Number(master?.benhnhan_tratruoc || 0) > 0,
    Number(master?.sinhvien_tratruoc || 0) > 0,
    Number(master?.chuyen_khoan || 0) > 0,
    Number(master?.tien_mat || 0) > 0,
    Number(master?.tra_sau || 0) > 0,
  ].filter(Boolean).length;
  const isDaPhuongThuc = countPaymentMethods >= 2;

  const mainItems = (detail || []).filter((d) => !d?.ma_vt_root);
  const totalDiscount = (detail || []).reduce((sum, d) => {
    const val = parseFloat(d?.ck_nt || 0);
    return sum + (isNaN(val) ? 0 : val);
  }, 0);
  const soCt = master?.so_ct || "";
  const qrContent = soCt
    ? `https://einvoice.phenikaamec.com/?code=${encodeURIComponent(soCt)}`
    : "https://einvoice.phenikaamec.com/";

  return (
    <div className="receipt-thermal-preview">
      <div className="rtep-logo-wrap">
        <img
          src={headerImageUrl}
          alt="Logo"
          className="rtep-logo"
          onError={(e) => {
            e.target.style.display = "none";
          }}
        />
      </div>

      <div className="rtep-title rtep-center rtep-bold">{receiptTitle}</div>
      <div className="rtep-date rtep-center">{dateStr}</div>

      <div className="rtep-info">
        <div>
          Tên khách:{" "}
          {(master?.ong_ba && master.ong_ba.trim()) ||
            (master?.ten_kh && master.ten_kh.trim()) ||
            "Khách hàng căng tin"}
        </div>
        <div>Bàn: {master?.ma_ban || "POS"}</div>
        <div>Hình thức: {formatPaymentMethod(master?.httt)}</div>
        {isDaPhuongThuc && (
          <>
            {Number(master?.benhnhan_tratruoc || 0) > 0 && (
              <div>• Người bệnh trả trước: {formatNumber(master.benhnhan_tratruoc)}đ</div>
            )}
            {Number(master?.sinhvien_tratruoc || 0) > 0 && (
              <div>• Sinh viên trả trước: {formatNumber(master.sinhvien_tratruoc)}đ</div>
            )}
            {Number(master?.chuyen_khoan || 0) > 0 && (
              <div>• Chuyển khoản: {formatNumber(master.chuyen_khoan)}đ</div>
            )}
            {Number(master?.tien_mat || 0) > 0 && (
              <div>• Tiền mặt: {formatNumber(master.tien_mat)}đ</div>
            )}
            {Number(master?.tra_sau || 0) > 0 && (
              <div>• Trả sau: {formatNumber(master.tra_sau)}đ</div>
            )}
          </>
        )}
        <div>Số CT: {master?.so_ct || "Chưa có"}</div>
        <div>Nhân viên: {staffName}</div>
      </div>

      <div className="rtep-table-header rtep-bold">
        <span className="rtep-col-name">Tên món</span>
        <span className="rtep-col-sl">SL</span>
        <span className="rtep-col-gia">Giá</span>
        <span className="rtep-col-tt">Thành tiền</span>
      </div>

      {mainItems.map((item, idx) => {
        const displayName = item?.selected_meal?.label || item?.ten_vt || "";
        const originalPrice =
          Number(item?.don_gia || 0) * Number(item?.so_luong || 1);
        const discountAmount = parseFloat(item?.ck_nt || 0);
        const thanhTien = originalPrice - discountAmount;
        const subItems = (detail || []).filter(
          (sub) =>
            sub?.ma_vt_root === item?.ma_vt && sub?.uniqueid === item?.uniqueid
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
              const subOriginal =
                Number(sub?.don_gia || 0) * Number(sub?.so_luong || 1);
              const subDiscount = parseFloat(sub?.ck_nt || 0);
              const subThanhTien = subOriginal - subDiscount;
              return (
                <div className="rtep-row rtep-sub" key={`${idx}-${sidx}`}>
                  <span className="rtep-col-name">+ {sub?.ten_vt || ""}</span>
                  <span className="rtep-col-sl">{sub?.so_luong || 1}</span>
                  <span className="rtep-col-gia">
                    {formatNumber(sub?.don_gia || 0)}đ
                  </span>
                  <span className="rtep-col-tt">
                    {formatNumber(subThanhTien)}đ
                  </span>
                </div>
              );
            })}
            {item?.ghi_chu && (
              <div className="rtep-ghichu">Ghi chú: {item.ghi_chu}</div>
            )}
          </React.Fragment>
        );
      })}

      <div className="rtep-line rtep-center">{LINE_FULL_WIDTH}</div>
      {totalDiscount > 0 && (
        <div className="rtep-right">
          Chiết khấu: {formatNumber(totalDiscount)}đ
        </div>
      )}
      <div className="rtep-tongtien rtep-bold rtep-right">
        Tổng tiền: {formatNumber(master?.tong_tien || 0)}đ
      </div>

      <div className="rtep-thanks rtep-center rtep-italic">
        CẢM ƠN QUÝ KHÁCH, HẸN GẶP LẠI!
      </div>

      <div className="rtep-qr-wrap rtep-center">
        <QRCodeSVG value={qrContent} size={80} level="M" />
      </div>
      <div className="rtep-einvoice rtep-center">
        Tra cứu hóa đơn điện tử tại Website: https://einvoice.phenikaamec.com/
      </div>
      <div className="rtep-einvoice rtep-center">Mã số tra cứu: {soCt}</div>
    </div>
  );
};

export default ReceiptThermalPreview;
