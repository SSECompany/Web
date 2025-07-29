import { message } from "antd";
import React from "react";
import showConfirm from "../../../../components/common/Modal/ModalConfirm";

// Định nghĩa các status cần kiểm tra cho từng loại phiếu
const STATUS_CONFIG = {
  phieu_xuat_dieu_chuyen: {
    statuses: ["2", "3"], // Chuyển KTTH, Chuyển vào SC
    name: "phiếu xuất điều chuyển",
  },
  phieu_xuat_kho: {
    statuses: ["1", "3"], // Xuất kho, Chuyển vào SC
    name: "phiếu xuất kho",
  },
  phieu_nhap_kho: {
    statuses: ["2", "3"], // Nhập kho, Chuyển vào SC
    name: "phiếu nhập kho",
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
  console.log("validateQuantityDifference called with:", {
    phieuType,
    currentStatus,
    dataSourceLength: dataSource?.length,
  });

  const config = STATUS_CONFIG[phieuType];
  if (!config) {
    console.error(`Không tìm thấy config cho loại phiếu: ${phieuType}`);
    return { hasDifference: false };
  }

  // Kiểm tra xem status hiện tại có cần kiểm tra không
  if (!config.statuses.includes(currentStatus)) {
    console.log(`Status ${currentStatus} không cần kiểm tra cho ${phieuType}`);
    return { hasDifference: false };
  }

  console.log(`Status ${currentStatus} cần kiểm tra cho ${phieuType}`);

  // Tìm các dòng có số lượng lệch nhau
  const differentQuantityItems = [];

  dataSource.forEach((item, index) => {
    const soLuongDeNghi = parseFloat(item.soLuongDeNghi ?? item.so_luong ?? 0);
    const soLuongThucTe = parseFloat(item.sl_td3 ?? item.soLuong ?? 0);

    // Kiểm tra nếu 2 số lượng khác nhau
    if (Math.abs(soLuongDeNghi - soLuongThucTe) > 0.001) {
      differentQuantityItems.push({
        index: index + 1,
        name: item.ten_mat_hang || item.maHang,
        soLuongDeNghi: soLuongDeNghi,
        soLuongThucTe: soLuongThucTe,
        difference: Math.abs(soLuongDeNghi - soLuongThucTe),
      });
    }
  });

  if (differentQuantityItems.length === 0) {
    return { hasDifference: false };
  }

  // Hiển thị thông báo xác nhận
  showConfirm({
    title: "Cảnh báo số lượng lệch nhau",
    content: (
      <div style={{ textAlign: "left", lineHeight: "1.5", minWidth: "400px" }}>
        <div
          style={{ marginBottom: "10px", fontWeight: "500", fontSize: "14px" }}
        >
          Có {differentQuantityItems.length} dòng có số lượng lệch nhau:
        </div>
        <div style={{ maxHeight: "300px", overflowY: "auto" }}>
          {differentQuantityItems.map((item, idx) => (
            <div
              key={idx}
              style={{
                marginBottom: "8px",
                padding: "8px",
                backgroundColor: "#f5f5f5",
                borderRadius: "4px",
              }}
            >
              <div style={{ fontWeight: "500", marginBottom: "4px" }}>
                Dòng {item.index}: {item.name}
              </div>
            </div>
          ))}
        </div>
        <div
          style={{
            marginTop: "10px",
            fontSize: "13px",
            color: "#666",
            fontStyle: "italic",
          }}
        >
          Bạn có muốn tiếp tục tạo/sửa {config.name} với số lượng lệch nhau này
          không?
        </div>
      </div>
    ),
    type: "warning",
    className: "centered-buttons fixed-height wide-modal",
    onOk: () => {
      message.success("Đã xác nhận tiếp tục với số lượng lệch nhau");
      if (onConfirm) {
        onConfirm();
      }
    },
    onCancel: () => {
      message.info("Đã hủy thao tác");
      if (onCancel) {
        onCancel();
      }
    },
  });

  return {
    hasDifference: true,
    differentQuantityItems,
    proceed: () => {
      if (onConfirm) {
        onConfirm();
      }
    },
  };
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

export default {
  validateQuantityDifference,
  validateQuantityForPhieu,
  STATUS_CONFIG,
};
