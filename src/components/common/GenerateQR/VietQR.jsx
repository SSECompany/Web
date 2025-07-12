import crc from "crc";
import { QRCode } from "qrcode.react";
import React from "react";

function pad2(n) {
  return n.toString().padStart(2, "0");
}

function buildVietQR({ account, bankId, amount, content }) {
  // Các trường cố định
  const payloadFormat = "00" + "02" + "01";
  const pointOfInit = "01" + "02" + "12";
  const accInfo =
    "38" +
    pad2(14 + account.length) +
    "0010A0000007270127" +
    bankId +
    "3011" +
    account;
  const currency = "53" + "03" + "704";
  const amountStr = amount
    ? "54" + pad2(amount.toString().length) + amount
    : "";
  const country = "58" + "02" + "VN";
  const addData = "62" + pad2(7 + content.length) + "0819" + content;
  // Ghép chuỗi (bỏ qua CRC lúc này)
  let qrString =
    payloadFormat +
    pointOfInit +
    accInfo +
    currency +
    amountStr +
    country +
    addData +
    "6304";
  // Tính CRC
  const crcValue = crc
    .crc16ccitt(qrString, 0xffff)
    .toString(16)
    .toUpperCase()
    .padStart(4, "0");
  return qrString + crcValue;
}

export default function VietQR({ amount, soChungTu }) {
  const qrData = buildVietQR({
    account: "0123456789", // Số tài khoản cố định
    bankId: "970422", // Mã ngân hàng cố định (MB Bank)
    amount,
    content: soChungTu,
  });

  return (
    <div>
      <QRCode value={qrData} size={256} />
      <p style={{ wordBreak: "break-all", fontSize: 12 }}>{qrData}</p>
    </div>
  );
}
