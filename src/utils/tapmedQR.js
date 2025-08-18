/**
 * Tapmed-style QR Code generation for bank transfer
 * Similar to Phenika's QR code logic but customized for pharmacy
 */

const buildTapmedQR = ({
  bankBin = "970436", // Vietcombank default
  accountNumber,
  accountName,
  amount,
  content,
  template = "compact2",
}) => {
  // Tapmed-style QR format
  // Format: https://api.vietqr.net/image/<bank_bin>/<account_number>/<account_name>/<amount>/<content>.jpg?template=<template>

  const qrValue = `https://api.vietqr.net/image/${bankBin}/${accountNumber}/${encodeURIComponent(
    accountName
  )}/${amount}/${encodeURIComponent(content)}.jpg?template=${template}`;

  return qrValue;
};

/**
 * Generate QR content for Tapmed-style payment
 */
const generateTapmedContent = (params) => {
  const { orderId, amount, pharmacyName, pharmacyAccount, pharmacyBank } =
    params;

  // Tapmed format: TAPMED-YYYYMMDD-HHMMSS-ORDERID
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
  const timeStr = date.toTimeString().slice(0, 8).replace(/:/g, "");

  return `TAPMED-${dateStr}-${timeStr}-${orderId || generateOrderId()}`;
};

/**
 * Generate order ID for Tapmed-style
 */
const generateOrderId = () => {
  // Tapmed format: 6-digit random number
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export { buildTapmedQR, generateOrderId, generateTapmedContent };
export default buildTapmedQR;




