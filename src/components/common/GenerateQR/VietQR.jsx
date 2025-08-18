import crc from "crc";
import { QRCodeCanvas } from "qrcode.react";
import React from "react";

function pad2(n) {
  return n.toString().padStart(2, "0");
}

function buildVietQR({ account, bankId, amount, content }) {
  const payloadFormat = "00" + "02" + "01";
  const pointOfInit = "01" + "02" + "12";
  const accInfoValue =
    "0010A00000072701240006" + bankId + "0110" + account + "0208QRIBFTTA";
  const accInfo = "38" + pad2(accInfoValue.length) + accInfoValue;
  const currency = "53" + "03" + "704";
  const amountStr = amount
    ? "54" + pad2(amount.toString().length) + amount
    : "";
  const country = "58" + "02" + "VN";
  const contentField = "08" + pad2(content.length) + content;
  const addData = "62" + pad2(contentField.length) + contentField;
  let qrString =
    payloadFormat +
    pointOfInit +
    accInfo +
    currency +
    amountStr +
    country +
    addData +
    "6304";
  const crcValue = crc
    .crc16ccitt(qrString, 0xffff)
    .toString(16)
    .toUpperCase()
    .padStart(4, "0");
  return qrString + crcValue;
}

export default function VietQR({ amount, soChungTu, size = 100 }) {
  const qrData = buildVietQR({
    account: process.env.REACT_APP_VIETQR_ACCOUNT,
    bankId: process.env.REACT_APP_VIETQR_BANK_ID,
    amount,
    content: soChungTu || "",
  });

  return (
    <div>
      <QRCodeCanvas value={qrData} size={size} />
    </div>
  );
}
