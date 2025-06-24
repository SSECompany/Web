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
          // ===== TRƯỜNG HỢP MERGE VÀO VẬT TƯ ĐÃ CÓ =====
          // Merge vào dòng đầu tiên và xóa các dòng trùng lặp khác
          const updatedData = prev.map((item, index) => {
            if (index === existingIndex) {
              // Logic sửa: Thêm đúng theo đơn vị hiện tại (giống phiếu nhập kho)
              const dvtHienTai = (item.dvt || "").trim();
              const dvtGoc = (item.dvt_goc || "").trim();
              const heSoGoc = item.he_so_goc ?? 1;
              const heSoHienTai = item.he_so ?? 1;

              let soLuongThemVao;

              // Nếu đang ở đơn vị gốc (kg): thêm 1 đơn vị gốc (tức là +hệ số gốc)
              if (dvtHienTai.trim() === dvtGoc.trim()) {
                soLuongThemVao = heSoGoc; // VD: +11kg nếu hệ số gốc = 11
              } else {
                // Nếu đang ở đơn vị khác (Bộ): thêm 1 đơn vị hiện tại
                soLuongThemVao = 1; // VD: +1 Bộ
              }

              const sl_td3_hienTai = item.sl_td3 || 0;
              const sl_td3_moi = sl_td3_hienTai + soLuongThemVao;
              const sl_td3_lam_tron = Math.round(sl_td3_moi * 1000) / 1000;

              // Cập nhật sl_td3_goc để đồng bộ - luôn +1 đơn vị gốc
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
          // ===== TRƯỜNG HỢP THÊM VẬT TƯ MỚI =====
          // Áp dụng logic tính toán giống như load từ API

          // ✅ LOGIC ĐÚNG: Lấy đơn vị gốc và hệ số gốc từ API vật tư detail
          const heSoGocFromAPI = parseFloat(vatTuInfo.he_so) || 1;
          const dvtGocFromAPI = vatTuInfo.dvt ? vatTuInfo.dvt.trim() : "cái";
          
          // DVT hiện tại ban đầu = DVT gốc từ API
          const dvtHienTai = dvtGocFromAPI;
          
          // Tính toán số lượng giống logic load từ API
          let sl_td3_goc, sl_td3_hienThi;
          let so_luong_goc, so_luong_hienThi;
          let heSoHienTai = heSoGocFromAPI;

          // So sánh DVT hiện tại với DVT gốc (giống logic load từ API)
          if (dvtHienTai.trim() === dvtGocFromAPI.trim()) {
            // Đang ở đơn vị gốc: sl_td3_goc = 1, sl_td3_hienThi = sl_td3_goc * he_so_goc
            sl_td3_goc = 1;
            sl_td3_hienThi = sl_td3_goc * heSoGocFromAPI;
            
            // Số lượng đề nghị = 0 khi thêm mới
            so_luong_goc = 0;
            so_luong_hienThi = so_luong_goc * heSoGocFromAPI;
            
            heSoHienTai = heSoGocFromAPI;
          } else {
            // Đang ở đơn vị khác (trường hợp hiếm khi thêm mới)
            sl_td3_goc = 1;
            sl_td3_hienThi = sl_td3_goc;
            
            so_luong_goc = 0;  
            so_luong_hienThi = so_luong_goc;
            
            // Tìm hệ số của đơn vị hiện tại từ danh sách đơn vị tính
            const dvtHienTaiInfo = donViTinhList.find(
              (dvt) => dvt.dvt.trim() === dvtHienTai.trim()
            );
            heSoHienTai = dvtHienTaiInfo
              ? parseFloat(dvtHienTaiInfo.he_so) || 1
              : 1;
          }

          const newItem = {
            key: prev.length + 1,
            maHang: value,
            so_luong: Math.round(so_luong_hienThi * 1000) / 1000,
            so_luong_goc: Math.round(so_luong_goc * 1000) / 1000,
            sl_td3: Math.round(sl_td3_hienThi * 1000) / 1000,
            sl_td3_goc: Math.round(sl_td3_goc * 1000) / 1000,
            he_so: heSoHienTai,
            he_so_goc: heSoGocFromAPI, // Lưu hệ số gốc từ API
            ten_mat_hang: vatTuInfo.ten_vt || value,
            dvt: dvtHienTai,
            dvt_goc: dvtGocFromAPI,
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
    const heSoHienTai = currentDvtInList ? parseFloat(currentDvtInList.he_so) || 1 : (record.he_so || 1);
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
      const newDataSource = prev.map((item) =>
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

  return {
    dataSource,
    setDataSource,
    handleVatTuSelect,
    handleQuantityChange,
    handleDeleteItem,
    handleDvtChange,
  };
};
