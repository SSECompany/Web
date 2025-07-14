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
          (item) => (item.maHang || "").trim() === (value || "").trim()
        );

        if (existingIndex !== -1) {
          // ===== MERGE VẬT TƯ ĐÃ CÓ (giống nhập kho) =====
          const updatedData = prev.map((item, index) => {
            if (index === existingIndex) {
              const dvtHienTai = (item.dvt || "").trim();
              const dvtGoc = (item.dvt_goc || "").trim();
              const heSoGocFromAPI = parseFloat(vatTuInfo.he_so) || 1;
              const heSoHienTai = item.he_so;
              const dvtAPI = vatTuInfo.dvt ? vatTuInfo.dvt.trim() : "cái";
              let soLuongThemVao;

              if (dvtHienTai === dvtGoc) {
                if (dvtAPI === dvtGoc) {
                  soLuongThemVao = heSoGocFromAPI;
                } else {
                  const dvtAPIInfo = donViTinhList.find(
                    (dvt) => dvt.dvt.trim() === dvtAPI
                  );
                  const heSoDVTAPI = isNaN(parseFloat(dvtAPIInfo?.he_so))
                    ? 1
                    : parseFloat(dvtAPIInfo.he_so);
                  soLuongThemVao = heSoDVTAPI;
                }
              } else {
                if (dvtAPI === dvtHienTai) {
                  soLuongThemVao = heSoGocFromAPI;
                } else {
                  const soLuongGoc = heSoGocFromAPI / heSoHienTai;
                  soLuongThemVao = soLuongGoc;
                }
              }

              const soLuongHienTai =
                item.so_luong !== undefined ? item.so_luong : 0;
              const soLuongMoi = soLuongHienTai + soLuongThemVao;
              const soLuongLamTron = Math.round(soLuongMoi * 1000) / 1000;

              const soLuongGocHienTai =
                item.so_luong_goc !== undefined ? item.so_luong_goc : 0;
              const soLuongGocMoi = soLuongGocHienTai + 1;

              return {
                ...item,
                so_luong: soLuongLamTron,
                so_luong_goc: soLuongGocMoi,
                sl_td3: soLuongLamTron,
                sl_td3_goc: soLuongGocMoi,
                he_so: heSoHienTai,
                he_so_goc: heSoGocFromAPI,
                dvt: dvtHienTai || dvtAPI,
                dvt_goc: dvtAPI,
                donViTinhList: donViTinhList,
                isNewlyAdded: item.isNewlyAdded,
              };
            }
            return item;
          });

          const filteredData = updatedData.filter(
            (item, index) =>
              index === existingIndex ||
              (item.maHang || "").trim() !== (value || "").trim()
          );

          return filteredData.map((item, index) => ({
            ...item,
            key: index + 1,
          }));
        } else {
          // ===== TRƯỜNG HỢP THÊM VẬT TƯ MỚI =====
          // Áp dụng logic tính toán giống như load từ API

          // ✅ LOGIC ĐÚNG: Lấy đơn vị gốc và hệ số gốc từ API vật tư detail
          const heSoGocFromAPI = parseFloat(vatTuInfo.he_so) || 1;
          const dvtGocFromAPI = vatTuInfo.dvt ? vatTuInfo.dvt.trim() : "cái";

          // DVT hiện tại ban đầu = DVT gốc từ API
          const dvtHienTai = dvtGocFromAPI;

          // Khi thêm vật tư mới, số lượng gốc luôn là 1
          let so_luong_goc = 1;
          let so_luong_hienThi;
          let heSoHienTai = heSoGocFromAPI;

          if (dvtHienTai.trim() === dvtGocFromAPI.trim()) {
            // Đơn vị hiện tại là đơn vị gốc
            so_luong_hienThi = so_luong_goc * heSoGocFromAPI;
            heSoHienTai = heSoGocFromAPI;
          } else {
            // Đơn vị hiện tại khác đơn vị gốc
            const dvtHienTaiInfo = donViTinhList.find(
              (dvt) => dvt.dvt.trim() === dvtHienTai.trim()
            );
            heSoHienTai = dvtHienTaiInfo
              ? parseFloat(dvtHienTaiInfo.he_so) || 1
              : 1;
            so_luong_hienThi = so_luong_goc * heSoHienTai;
          }

          const newItem = {
            key: prev.length + 1,
            maHang: value,
            ten_mat_hang: value, // Dùng luôn ma_vt cho tên mặt hàng
            so_luong: Math.round(so_luong_hienThi * 1000) / 1000,
            so_luong_goc: Math.round(so_luong_goc * 1000) / 1000,
            sl_td3: Math.round(so_luong_hienThi * 1000) / 1000,
            sl_td3_goc: Math.round(so_luong_goc * 1000) / 1000,
            he_so: heSoHienTai,
            he_so_goc: heSoGocFromAPI, // Lưu hệ số gốc từ API
            dvt: dvtHienTai,
            dvt_goc: dvtGocFromAPI,
            tk_vt: vatTuInfo.tk_vt ? vatTuInfo.tk_vt.trim() : "",
            ma_kho: vatTuInfo.ma_kho ? vatTuInfo.ma_kho.trim() : "",
            donViTinhList: donViTinhList,
            isNewlyAdded: true,
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
          if (item.dvt?.trim() === item.dvt_goc?.trim()) {
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

    // ✅ SỬA: Tìm hệ số hiện tại từ donViTinhList thay vì dùng record.he_so
    const currentDvtInList = dvtOptions.find(
      (dvt) => dvt && dvt.dvt && dvt.dvt.trim() === record.dvt?.trim()
    );
    const heSoHienTai = currentDvtInList
      ? parseFloat(currentDvtInList.he_so) || 1
      : record.he_so || 1;
    const sl_td3_hienTai = record.sl_td3 || 0;
    const so_luong_hien_tai = record.so_luong || 0;

    let sl_td3_moi;
    let so_luong_moi;

    // ✅ Sửa logic: Xử lý riêng biệt số lượng xuất và số lượng đề nghị
    // Số lượng xuất: nếu = 0 thì giữ nguyên 0, ngược lại thì chuyển đổi
    if (sl_td3_hienTai === 0) {
      sl_td3_moi = 0;
    } else {
      sl_td3_moi = (sl_td3_hienTai * heSoHienTai) / heSoMoi;
    }

    // Số lượng đề nghị: luôn chuyển đổi theo hệ số, không phụ thuộc vào số lượng xuất
    so_luong_moi = (so_luong_hien_tai * heSoHienTai) / heSoMoi;

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

    setDataSource((prev) => {
      // ✅ Tạo array mới hoàn toàn để force re-render
      const newDataSource = prev.map(
        (item) =>
          item.key === record.key
            ? {
                ...item, // Giữ nguyên tất cả các trường hiện có
                dvt: newValue,
                he_so: heSoMoi,
                so_luong: so_luong_lam_tron,
                sl_td3: sl_td3_lam_tron,
                sl_td3_goc: Math.round((sl_td3_goc_moi || 0) * 10000) / 10000,
                _lastUpdated: Date.now(), // Force re-render
              }
            : { ...item } // Clone để đảm bảo reference mới
      );

      return newDataSource;
    });
  };

  const handleSelectChange = (value, record, field) => {
    setDataSource((prev) =>
      prev.map((item) =>
        item.key === record.key
          ? {
              ...item,
              [field]: value,
            }
          : item
      )
    );
  };

  return {
    dataSource,
    setDataSource,
    handleVatTuSelect,
    handleQuantityChange,
    handleSelectChange,
    handleDeleteItem,
    handleDvtChange,
  };
};
