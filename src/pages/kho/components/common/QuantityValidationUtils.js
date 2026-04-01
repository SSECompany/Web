import { message } from "antd";
import React from "react";
import showConfirm from "../../../../components/common/Modal/ModalConfirm";

// Định nghĩa các status cần kiểm tra cho từng loại phiếu
const STATUS_CONFIG = {
  phieu_nhap_dieu_chuyen: {
    statuses: ["2", "3"], // Chuyển KTTH, Chuyển vào SC
    name: "phiếu nhập điều chuyển",
  },
  phieu_xuat_kho: {
    statuses: ["1", "3"], // Xuất kho, Chuyển vào SC
    name: "phiếu xuất kho",
  },
  phieu_nhap_kho: {
    statuses: ["2", "3"], // Nhập kho, Chuyển vào SC
    name: "phiếu nhặt hàng",
  },
  phieu_xuat_kho_ban_hang: {
    statuses: ["5", "6"], // Xuất kho, Hoàn thành
    name: "phiếu xuất kho bán hàng",
  },
};

/**
 * Kiểm tra số lượng lệch nhau và hiển thị thông báo xác nhận
 * @param {Array} dataSource - Dữ liệu vật tư
 * @param {string} phieuType - Loại phiếu
 * @param {string} currentStatus - Status hiện tại của phiếu
 * @param {Function} onConfirm - Callback khi user xác nhận
 * @param {Function} onCancel - Callback khi user hủy
 * @returns {Object} - Kết quả kiểm tra
 */
export const validateQuantityDifference = (
  dataSource,
  phieuType,
  currentStatus,
  onConfirm,
  onCancel
) => {
  // Bỏ check số lượng lệch nhau theo yêu cầu của USER
  return { hasDifference: false };
};

/**
 * Kiểm tra và validate số lượng cho từng loại phiếu
 * @param {Array} dataSource - Dữ liệu vật tư
 * @param {string} phieuType - Loại phiếu
 * @param {string} currentStatus - Status hiện tại của phiếu
 * @param {Function} onConfirm - Callback khi user xác nhận
 * @param {Function} onCancel - Callback khi user hủy
 * @returns {Object} - Kết quả validation
 */
export const validateQuantityForPhieu = (
  dataSource,
  phieuType,
  currentStatus,
  onConfirm,
  onCancel
) => {
  // Kiểm tra số lượng lệch nhau trước
  const differenceCheck = validateQuantityDifference(
    dataSource,
    phieuType,
    currentStatus,
    onConfirm,
    onCancel
  );

  if (differenceCheck.hasDifference) {
    return differenceCheck;
  }

  // Nếu không có lệch nhau, tiếp tục bình thường
  if (onConfirm) {
    onConfirm();
  }

  return { hasDifference: false };
};

const QuantityValidationUtils = {
  validateQuantityDifference,
  validateQuantityForPhieu,
  STATUS_CONFIG,
};

export default QuantityValidationUtils;
