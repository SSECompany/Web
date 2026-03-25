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
  showThaoTac: false,
};

// Cấu hình cho phiếu nhập hàng theo đơn
export const phieuNhapHangConfig = {
  tenMatHangField: "ten_mat_hang",
  soLuongDeNghiField: "soLuongDeNghi",
  soLuongDeNghiEditable: false,
  showSoLuongDeNghi: false,
  soLuongCheatTitle: "Số lượng",
  soLuongCheatField: "so_luong",
  showSoLuongCheat: true,
  showMaKho: true,
  maKhoRequired: false,
  showMaLo: true,
  showMaViTri: true,
  showHanSuDung: true,
  showDonHang: true,
  maLoField: "ma_lo",
  maViTriField: "ma_vi_tri",
  hanSuDungField: "ngay_hh",
  donHangField: "fcode2",
  showThaoTac: false,
};

// Cấu hình cho phiếu nhặt hàng
export const phieuNhatHangConfig = {
  showStt: false, 
  tenMatHangField: "ten_mat_hang",
  soLuongDeNghiField: "soLuongDeNghi",
  soLuongDeNghiEditable: false,
  showSoLuongDeNghi: true,
  soLuongDeNghiTitle: "Số lượng đơn",
  soLuongCheatField: "nhat",
  soLuongCheatTitle: "Nhặt",
  showSoLuongCheat: false,
  showMaKho: false,
  dvtEditable: false,
  showMaLo: true,
  maLoField: "ma_lo",
  showMaViTri: true,
  maViTriField: "ma_vi_tri",
  showGhiChu: true,
  ghiChuField: "ghi_chu",
  ghiChuTitle: "Ghi chú nhặt", 
  showGhiChuKD: true,
  ghiChuKDField: "ghi_chu_dh",
  showSoLuongTon: false,
  soLuongTonField: "so_luong_ton",
  showTonKh: false,
  tonKhField: "ton_kh",
  integrateStockInfoInMatHang: true,
  showTongNhat: true,
  tongNhatField: "tong_nhat",
  tongNhatEditable: true,
  showNhatCheckbox: true,
  nhatCheckboxField: "nhat_checkbox",
  combineMaLoViTri: true,
  tonDeNghiTongNhatGhiChuOrder: true,
  placeGhiChuAtEnd: true,
  useAddButtonInsteadOfDelete: true,
  showThaoTac: true,
  preventDeleteMainRow: true,

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
  showThaoTac: false,
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
  showThaoTac: false,
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
  showThaoTac: false,
};

/**
 * Lấy config theo loại phiếu
 * @param {string} type - Loại phiếu: 'nhap-kho', 'nhat-hang', 'xuat-kho', 'xuat-dieu-chuyen', 'xuat-kho-ban-hang'
 * @returns {Object} Config tương ứng
 */
export const getTableConfig = (type) => {
  const configs = {
    "nhap-kho": phieuNhapKhoConfig,
    "nhap-hang": phieuNhapHangConfig,
    "nhat-hang": phieuNhatHangConfig,
    "xuat-kho": phieuXuatKhoConfig,
    "xuat-dieu-chuyen": phieuXuatDieuChuyenConfig,
    "xuat-kho-ban-hang": phieuXuatKhoBanHangConfig,
  };

  return configs[type] || phieuXuatKhoConfig; // Default
};
