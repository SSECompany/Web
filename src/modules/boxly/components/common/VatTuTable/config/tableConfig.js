/**
 * Cấu hình cho từng loại bảng vật tư
 */

// Cấu hình cho phiếu nhập kho
export const phieuNhapKhoConfig = {
  tenMatHangField: "ten_mat_hang",
  soLuongDeNghiField: "soLuongDeNghi",
  soLuongDeNghiEditable: true,
  showSoLuongDeNghi: true,
  soLuongCheatField: "soLuong",
  soLuongCheatTitle: "Số lượng cheat",
  showSoLuongCheat: true,
  showMaKho: true,
  // Theo dõi mã vạch (theo yêu cầu nghiệp vụ)
  showInYn: true,
  // Mã vạch (ma_vc) - bắt buộc gõ nếu in_yn=true
  showMaVc: true,
  maVcRequired: true,
  // Mã vị trí (lookup từ DM vị trí kho theo ma_vt + ma_kho)
  showMaViTri: true,
  // Mã vụ việc - dùng để sinh barcode
  showMaVuViec: true,
};

// Cấu hình cho phiếu xuất kho
export const phieuXuatKhoConfig = {
  tenMatHangField: "ten_mat_hang",
  soLuongDeNghiField: "so_luong",
  soLuongDeNghiEditable: true,
  showSoLuongDeNghi: true,
  soLuongCheatField: "sl_td3",
  soLuongCheatTitle: "Số lượng cheat",
  showSoLuongCheat: true,
  showMaKho: true,
  // Theo dõi mã vạch
  showInYn: true,
  // Mã vạch
  showMaVc: true,
  maVcRequired: false,
  // Vị trí lưu kho
  showMaViTri: true,
  // Mã vụ việc
  showMaVuViec: true,
};

// Cấu hình cho phiếu xuất điều chuyển
export const phieuXuatDieuChuyenConfig = {
  tenMatHangField: "maHang", // Lưu ý: phiếu này dùng maHang cho tên
  soLuongDeNghiField: "so_luong",
  soLuongDeNghiEditable: true,
  showSoLuongDeNghi: true,
  soLuongCheatField: "sl_td3",
  soLuongCheatTitle: "Số lượng cheat",
  showSoLuongCheat: true,
  showMaKho: false, // Không có cột mã kho
  // Theo dõi mã vạch
  showInYn: true,
  // Mã vạch
  showMaVc: true,
  maVcRequired: false,
  // Vị trí lưu kho
  showMaViTri: true,
  // Mã vụ việc
  showMaVuViec: true,
};

// Cấu hình cho phiếu xuất kho bán hàng
export const phieuXuatKhoBanHangConfig = {
  tenMatHangField: "ten_mat_hang",
  soLuongDeNghiField: "so_luong",
  soLuongDeNghiEditable: false, // Chỉ đọc
  showSoLuongDeNghi: true,
  soLuongCheatField: "sl_td3",
  soLuongCheatTitle: "Số lượng xuất",
  showSoLuongCheat: true,
  showMaKho: false, // Không có cột mã kho
  // Theo dõi mã vạch
  showInYn: true,
  // Mã vạch
  showMaVc: true,
  maVcRequired: false,
  // Vị trí lưu kho
  showMaViTri: true,
  // Mã vụ việc
  showMaVuViec: true,
};

/**
 * Lấy config theo loại phiếu
 * @param {string} type - Loại phiếu: 'nhap-kho', 'xuat-kho', 'xuat-dieu-chuyen', 'xuat-kho-ban-hang'
 * @returns {Object} Config tương ứng
 */
export const getTableConfig = (type) => {
  const configs = {
    'nhap-kho': phieuNhapKhoConfig,
    'xuat-kho': phieuXuatKhoConfig,
    'xuat-dieu-chuyen': phieuXuatDieuChuyenConfig,
    'xuat-kho-ban-hang': phieuXuatKhoBanHangConfig,
  };

  return configs[type] || phieuXuatKhoConfig; // Default
};