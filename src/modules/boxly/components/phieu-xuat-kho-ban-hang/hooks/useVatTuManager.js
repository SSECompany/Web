import { message } from "antd";
import { useState } from "react";

export const useVatTuManager = () => {
  const [dataSource, setDataSource] = useState([]);

  const handleVatTuSelect = async (
    value,
    isEditMode,
    fetchVatTuDetail,
    fetchDonViTinh,
    setVatTuInput,
    setVatTuList,
    fetchVatTuList
  ) => {
    if (!isEditMode) {
      message.warning("Bạn cần bật chế độ chỉnh sửa");
      return;
    }

    try {
      const vatTuDetail = await fetchVatTuDetail(value.trim());

      if (!vatTuDetail) {
        message.error("Không tìm thấy thông tin vật tư");
        return;
      }

      const vatTuInfo = Array.isArray(vatTuDetail)
        ? vatTuDetail[0]
        : vatTuDetail;

      if (!vatTuInfo) {
        message.error("Thông tin vật tư không hợp lệ");
        return;
      }

      // Gọi API lấy danh sách đơn vị tính
      const donViTinhList = await fetchDonViTinh(value.trim());

      // Kiểm tra donViTinhList có hợp lệ không
      if (!Array.isArray(donViTinhList)) {
        message.error("Không thể lấy danh sách đơn vị tính");
        return;
      }

      // Lấy đơn vị tính từ API response (đã được trim spaces)
      const defaultDvt =
        vatTuInfo && vatTuInfo.dvt ? vatTuInfo.dvt.trim() : "cái";

      // Nếu đã có vật tư thì tăng số lượng, chưa có thì thêm mới
      setDataSource((prev) => {
        // Tìm dòng đầu tiên có cùng mã vật tư để merge (trim để tránh lỗi whitespace)
        const existingIndex = prev.findIndex(
          (item) => item.maHang.trim() === value.trim()
        );

        if (existingIndex !== -1) {
          // Merge vào dòng đầu tiên và xóa các dòng trùng lặp khác
          const updatedData = prev.map((item, index) => {
            if (index === existingIndex) {
              // Cộng thêm 1 lần hệ số vào số lượng xuất hiện tại
              const dvtHienTai = (item.dvt || "").trim();
              const dvtGoc = (item.dvt_goc || "").trim();

              // Công thức tổng quát: Thêm 1 đơn vị gốc được quy đổi sang đơn vị hiện tại
              // Số lượng thêm = 1 × (hệ số đơn vị gốc / hệ số đơn vị hiện tại)
              const heSoGoc = item.he_so_goc ?? 1;
              const heSoHienTai = item.he_so ?? 1;
              const soLuongThemVao = (1 * heSoGoc) / heSoHienTai;

              const sl_td3_hienTai = item.sl_td3 || 0;
              const sl_td3_moi = sl_td3_hienTai + soLuongThemVao;
              const sl_td3_lam_tron = Math.round(sl_td3_moi * 1000) / 1000;

              // Cập nhật sl_td3_goc để đồng bộ
              const sl_td3_goc_moi = (item.sl_td3_goc ?? 0) + 1;

              return {
                ...item,
                so_luong: item.so_luong, // Giữ nguyên số lượng đề nghị hiện tại
                so_luong_goc: item.so_luong_goc, // Giữ nguyên số lượng đề nghị gốc
                sl_td3: sl_td3_lam_tron,
                sl_td3_goc: sl_td3_goc_moi,
              };
            }
            return item;
          });

          // Xóa các dòng trùng lặp (giữ chỉ dòng đầu tiên)
          const filteredData = updatedData.filter(
            (item, index) =>
              index === existingIndex || item.maHang.trim() !== value.trim()
          );

          // Cập nhật lại key cho các dòng
          return filteredData.map((item, index) => ({
            ...item,
            key: index + 1,
          }));
        } else {
          // Lấy hệ số từ API response
          const heSo = parseFloat(vatTuInfo.he_so) || 1;
          const sl_td3_goc = 1;
          const sl_td3_hienThi = sl_td3_goc * heSo;
          const sl_td3_lamTron = Math.round(sl_td3_hienThi * 1000) / 1000;

          const newItem = {
            key: prev.length + 1,
            maHang: value,
            so_luong: 0, // Số lượng đề nghị = 0 khi thêm mới
            so_luong_goc: 0, // Số lượng đề nghị gốc = 0
            sl_td3: sl_td3_lamTron,
            sl_td3_goc: sl_td3_goc,
            he_so: heSo,
            he_so_goc: heSo, // Lưu hệ số gốc để dùng khi chuyển đổi đơn vị
            ten_mat_hang: vatTuInfo.ten_vt || value,
            dvt: defaultDvt,
            dvt_goc: defaultDvt,
            tk_vt: vatTuInfo.tk_vt ? vatTuInfo.tk_vt.trim() : "",
            ma_kho: vatTuInfo.ma_kho ? vatTuInfo.ma_kho.trim() : "",
            donViTinhList: donViTinhList,
            isNewlyAdded: true, // Flag để phân biệt dữ liệu mới thêm

            // ✅ Add default values for additional fields when adding new item
            gia_nt2: 0,
            gia2: 0,
            thue: 0,
            thue_nt: 0,
            tien2: 0,
            tien_nt2: 0,
            tl_ck: 0,
            ck: 0,
            ck_nt: 0,
            tk_gv: "",
            tk_dt: "",
            ma_thue: "",
            thue_suat: 0,
            tk_thue: "",
            tl_ck_khac: 0,
            gia_ck: 0,
            tien_ck_khac: 0,
            sl_td1: 0,
            sl_td2: 0,
          };
          return [...prev, newItem];
        }
      });

      message.success(`Đã thêm vật tư: ${value}`);

      // Only clear input, don't reset list or reload
      if (setVatTuInput) setVatTuInput(undefined);
    } catch (error) {
      console.error("Error adding vat tu:", error);
      message.error("Có lỗi xảy ra khi thêm vật tư");
    }
  };

  const handleQuantityChange = (value, record, field) => {
    const newValue = parseFloat(value) || 0;

    setDataSource((prev) =>
      prev.map((item) => {
        if (item.key === record.key) {
          // Nếu đang ở đơn vị tính gốc, tính ngược lại sl_td3_goc từ số lượng nhập
          if (item.dvt === item.dvt_goc) {
            const sl_td3_goc_moi = newValue / (item.he_so_goc ?? 1);
            return {
              ...item,
              [field]: newValue,
              sl_td3_goc: Math.round(sl_td3_goc_moi * 1000) / 1000,
            };
          } else {
            // Nếu đang ở đơn vị khác, số lượng nhập chính là sl_td3_goc
            return {
              ...item,
              [field]: newValue,
              sl_td3_goc: newValue,
            };
          }
        }
        return item;
      })
    );
  };

  const handleDeleteItem = (index, isEditMode) => {
    if (!isEditMode) {
      message.warning("Bạn cần bật chế độ chỉnh sửa");
      return;
    }

    const newDataSource = dataSource.filter((_, i) => i !== index);
    // Cập nhật lại key cho các item
    const reIndexedDataSource = newDataSource.map((item, i) => ({
      ...item,
      key: i + 1,
    }));
    setDataSource(reIndexedDataSource);
    message.success("Đã xóa vật tư");
  };

  const handleDvtChange = (newValue, record) => {
    // Kiểm tra record có hợp lệ không
    if (!record || !record.donViTinhList) {
      message.error("Thông tin vật tư không hợp lệ");
      return;
    }

    // Tìm thông tin đơn vị tính được chọn
    const dvtOptions = record.donViTinhList || [];
    const selectedDvt = dvtOptions.find(
      (dvt) => dvt && dvt.dvt && dvt.dvt.trim() === newValue.trim()
    );
    const heSoMoi = selectedDvt ? parseFloat(selectedDvt.he_so) || 1 : 1;

    // Phân biệt giữa dữ liệu từ API và dữ liệu mới thêm
    // Sử dụng flag isNewlyAdded để phân biệt
    const isDataFromAPI = !record.isNewlyAdded;

    if (isDataFromAPI) {
      // Logic mới cho dữ liệu từ API - chuyển đổi theo tỷ lệ hệ số
      const heSoHienTai = record.he_so || 1;
      const sl_td3_hienTai = record.sl_td3 || 0;
      const so_luong_hien_tai = record.so_luong || 0;

      let sl_td3_moi;
      let so_luong_moi;

      if (sl_td3_hienTai === 0) {
        // Nếu số lượng hiện tại là 0, giữ nguyên
        sl_td3_moi = 0;
        so_luong_moi = 0;
      } else {
        // Áp dụng công thức chuyển đổi: Số lượng mới = Số lượng hiện tại * Hệ số hiện tại / Hệ số mới
        sl_td3_moi = (sl_td3_hienTai * heSoHienTai) / heSoMoi;
        so_luong_moi = (so_luong_hien_tai * heSoHienTai) / heSoMoi;
      }

      // Làm tròn đến 4 chữ số thập phân
      const sl_td3_lam_tron = Math.round(sl_td3_moi * 10000) / 10000;
      const so_luong_lam_tron = Math.round(so_luong_moi * 10000) / 10000;

      // Cập nhật sl_td3_goc để đồng bộ với đơn vị gốc
      let sl_td3_goc_moi = record.sl_td3_goc;
      if (newValue.trim() === record.dvt_goc?.trim()) {
        // Nếu chuyển về đơn vị gốc, sl_td3_goc = sl_td3_moi / he_so_goc
        const he_so_goc = record.he_so_goc || 1;
        sl_td3_goc_moi = sl_td3_lam_tron / he_so_goc;
      } else {
        // Nếu chuyển sang đơn vị khác, tính sl_td3_goc từ đơn vị hiện tại
        if (record.dvt?.trim() === record.dvt_goc?.trim()) {
          // Từ đơn vị gốc sang đơn vị khác
          sl_td3_goc_moi = sl_td3_hienTai / (record.he_so_goc || 1);
        } else {
          // Từ đơn vị khác sang đơn vị khác, giữ nguyên sl_td3_goc
          sl_td3_goc_moi = record.sl_td3_goc;
        }
      }

      setDataSource((prev) =>
        prev.map((item) =>
          item.key === record.key
            ? {
                ...item,
                dvt: newValue,
                he_so: heSoMoi,
                so_luong: so_luong_lam_tron,
                sl_td3: sl_td3_lam_tron,
                sl_td3_goc: Math.round((sl_td3_goc_moi || 0) * 10000) / 10000,
              }
            : item
        )
      );
    } else {
      // Logic cũ cho dữ liệu mới thêm - giữ nguyên
      const sl_td3_goc_thuc_te = record.sl_td3_goc ?? 0;
      const sl_td3_goc_tinh_toan =
        sl_td3_goc_thuc_te === 0 ? 1 : sl_td3_goc_thuc_te;
      let sl_td3_moi;

      // Nếu chuyển về đơn vị tính gốc, áp dụng hệ số gốc
      if (newValue.trim() === record.dvt_goc.trim()) {
        sl_td3_moi =
          sl_td3_goc_thuc_te === 0
            ? 0
            : sl_td3_goc_tinh_toan * record.he_so_goc;
      } else {
        // Nếu chuyển sang đơn vị khác, hiển thị số lượng gốc (số nguyên)
        sl_td3_moi = sl_td3_goc_thuc_te === 0 ? 0 : sl_td3_goc_tinh_toan;
      }

      // Làm tròn đến 3 chữ số thập phân
      const sl_td3_lam_tron = Math.round(sl_td3_moi * 1000) / 1000;
      // Giữ nguyên số lượng đề nghị, không tự động tính lại
      const so_luong_hien_tai = record.so_luong || 0;

      setDataSource((prev) =>
        prev.map((item) =>
          item.key === record.key
            ? {
                ...item,
                dvt: newValue,
                he_so: heSoMoi,
                so_luong: so_luong_hien_tai, // Giữ nguyên số lượng đề nghị
                sl_td3: sl_td3_lam_tron,
              }
            : item
        )
      );
    }
  };

  return {
    dataSource,
    setDataSource,
    handleVatTuSelect,
    handleQuantityChange,
    handleDeleteItem,
    handleDvtChange,
  };
};
