/**
 * Cấu hình cho từng loại bảng vật tư
 */

// Cấu hình cho phiếu nhập kho (legacy)
export const phieuNhapKhoConfig = {
  tenMatHangField: "ten_mat_hang",
  soLuongDeNghiField: "soLuongDeNghi",
  soLuongDeNghiEditable: true,
  showSoLuongDeNghi: true,
  soLuongCheatField: "soLuong",
  soLuongCheatTitle: "Số lượng cheat",
  showSoLuongCheat: true,
  showMaKho: true,
};

// Cấu hình cho phiếu nhặt hàng
export const phieuNhatHangConfig = {
  tenMatHangField: "ten_mat_hang",
  soLuongDeNghiField: "soLuongDeNghi",
  soLuongDeNghiEditable: false,
  showSoLuongDeNghi: true,
  soLuongDeNghiTitle: "Số lượng đơn",
  soLuongCheatField: "nhat",
  soLuongCheatTitle: "Nhặt",
  showSoLuongCheat: false,
  showMaKho: false,
  // Lock ĐVT editing for nhặt hàng (read-only display)
  dvtEditable: false,
  // Các trường mới cho phiếu nhặt hàng
  showMaLo: true,
  maLoField: "ma_lo",
  showMaViTri: true,
  maViTriField: "ma_vi_tri",
  showGhiChu: true,
  ghiChuField: "ghi_chu",
  showSoLuongTon: true,
  soLuongTonField: "so_luong_ton",
  showTonKh: true,
  tonKhField: "ton_kh",
  showTongNhat: true,
  tongNhatField: "tong_nhat",
  tongNhatEditable: true,
  // Thêm checkbox Nhặt
  showNhatCheckbox: true,
  nhatCheckboxField: "nhat_checkbox",
  combineMaLoViTri: true,
  // Sắp xếp lại thứ tự: tồn -> đơn -> tổng nhặt -> ghi chú
  tonDeNghiTongNhatGhiChuOrder: true,
  // Hiển thị cột ghi chú ở cuối bảng
  placeGhiChuAtEnd: true,
  // Thay đổi nút xóa thành nút thêm dòng mới
  useAddButtonInsteadOfDelete: true,
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
};

/**
 * Lấy config theo loại phiếu
 * @param {string} type - Loại phiếu: 'nhap-kho', 'nhat-hang', 'xuat-kho', 'xuat-dieu-chuyen', 'xuat-kho-ban-hang'
 * @returns {Object} Config tương ứng
 */
export const getTableConfig = (type) => {
  const configs = {
    "nhap-kho": phieuNhapKhoConfig,
    "nhat-hang": phieuNhatHangConfig,
    "xuat-kho": phieuXuatKhoConfig,
    "xuat-dieu-chuyen": phieuXuatDieuChuyenConfig,
    "xuat-kho-ban-hang": phieuXuatKhoBanHangConfig,
  };

  return configs[type] || phieuXuatKhoConfig; // Default
};
