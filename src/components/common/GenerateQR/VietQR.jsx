import crc from "crc";
import { QRCodeCanvas } from "qrcode.react";
import React from "react";

const GUID_VALUE = "A000000727";
const SERVICE_VALUE = "QRIBFTTA";

function pad2(value) {
  return value.toString().padStart(2, "0");
}

function sanitizeDigits(value = "") {
  return String(value).replace(/\D+/g, "");
}

function buildField(tag, rawValue) {
  const value = rawValue ?? "";
  const length = pad2(value.length);
  return `${tag}${length}${value}`;
}

function buildAmountField(amount) {
  if (amount === null || amount === undefined) {
    return "";
  }

  let numericValue = amount;
  if (typeof numericValue !== "number") {
    const digitsOnly = String(numericValue).replace(/\D+/g, "");
    numericValue = digitsOnly ? Number(digitsOnly) : 0;
  }

  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return "";
  }

  const amountValue = Math.round(numericValue).toString();
  return buildField("54", amountValue);
}

function buildContentField(content = "") {
  const safeContent = content ? String(content).trim() : "";
  const contentField = buildField("08", safeContent);
  return buildField("62", contentField);
}

function buildMerchantAccountInfo({ bankId, account }) {
  const bankValue = sanitizeDigits(bankId);
  const accountValue = sanitizeDigits(account);

  if (!bankValue) {
    throw new Error("VietQR missing bank BIN");
  }
  if (!accountValue) {
    throw new Error("VietQR missing account number");
  }

  const guidField = buildField("00", GUID_VALUE);
  const bankFieldInsideTemplate = buildField("00", bankValue);
  const accountFieldInsideTemplate = buildField("01", accountValue);
  const templateValue = `${bankFieldInsideTemplate}${accountFieldInsideTemplate}`;
  const templateField = buildField("01", templateValue);

  const serviceField = buildField("02", SERVICE_VALUE);

  const accInfoValue = `${guidField}${templateField}${serviceField}`;

  return accInfoValue;
}

export function buildVietQR({ account, bankId, amount, content }) {
  // Static QR: Point of Initiation = "11" (not "12" for dynamic)
  const payloadFormat = "00" + "02" + "01";
  const pointOfInit = "01" + "02" + "11"; // "11" = Static QR Code

  const accInfoValue = buildMerchantAccountInfo({ bankId, account });
  const accInfo = buildField("38", accInfoValue);
  const currency = "53" + "03" + "704";
  const amountField = buildAmountField(amount);
  const country = "58" + "02" + "VN";
  // Only include Add Data (62) if content is provided (Conditional field)
  const addData =
    content && content.trim() ? buildContentField(content.trim()) : "";

  // Static QR string (no amount field, no addData if empty)
  const qrString =
    payloadFormat +
    pointOfInit +
    accInfo +
    currency +
    amountField +
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

export default function VietQR({ amount, soChungTu, size = 100, payload, account: accountProp }) {
  const account = accountProp || process.env.REACT_APP_VIETQR_ACCOUNT;
  const bankId = process.env.REACT_APP_VIETQR_BANK_ID;

  // Allow overriding QR payload (EMVCo/VietQR raw string) from caller.
  // If `payload` is provided, we render it as-is.
  let qrData = "";
  try {
    qrData = payload && String(payload).trim()
      ? String(payload).trim()
      : buildVietQR({
          account,
          bankId,
          amount,
          content: soChungTu || "",
        });
  } catch (e) {
    console.error("Failed to build VietQR payload:", e);
    qrData = "";
  }

  return (
    <div>
      <QRCodeCanvas value={qrData || " "} size={size} />
    </div>
  );
}
