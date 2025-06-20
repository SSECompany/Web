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

      // Gọi API lấy danh sách đơn vị tính
      const donViTinhList = await fetchDonViTinh(value.trim());

      // Lấy đơn vị tính từ API response (đã được trim spaces)
      const defaultDvt = vatTuInfo.dvt ? vatTuInfo.dvt.trim() : "cái";

      // Nếu đã có vật tư thì tăng số lượng, chưa có thì thêm mới
      setDataSource((prev) => {
        const existing = prev.find((item) => item.maHang === value);
        if (existing) {
          return prev.map((item) => {
            if (item.maHang === value) {
              // Luôn cộng 1 vào số lượng gốc
              const sl_td3_goc_moi = (item.sl_td3_goc || 1) + 1;
              // Tính lại số lượng hiển thị dựa trên hệ số hiện tại
              const sl_td3_moi = sl_td3_goc_moi * (item.he_so || 1);
              const sl_td3_lam_tron = Math.round(sl_td3_moi * 1000) / 1000;

              return {
                ...item,
                sl_td3: sl_td3_lam_tron,
                sl_td3_goc: sl_td3_goc_moi,
              };
            }
            return item;
          });
        } else {
          const newItem = {
            key: prev.length + 1,
            maHang: value,
            so_luong: 0,
            sl_td3: 1,
            sl_td3_goc: 1,
            he_so: 1,
            ten_mat_hang: vatTuInfo.ten_vt || value,
            dvt: defaultDvt,
            dvt_goc: defaultDvt,
            tk_vt: vatTuInfo.tk_vt ? vatTuInfo.tk_vt.trim() : "",
            ma_kho: vatTuInfo.ma_kho ? vatTuInfo.ma_kho.trim() : "",
            donViTinhList: donViTinhList,
          };
          return [...prev, newItem];
        }
      });

      message.success(`Đã thêm vật tư: ${value}`);

      // Clear input và reset danh sách ngay lập tức
      setVatTuInput(undefined);
      setVatTuList([]);

      // Load lại toàn bộ danh sách vật tư ngay lập tức
      fetchVatTuList("");
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
          // Nếu đang ở đơn vị tính gốc, cập nhật luôn sl_td3_goc
          if (item.dvt === item.dvt_goc) {
            return {
              ...item,
              [field]: newValue,
              sl_td3_goc: newValue,
            };
          } else {
            // Nếu không phải đơn vị tính gốc, tính ngược lại sl_td3_goc
            const sl_td3_goc_moi = newValue / (item.he_so || 1);
            return {
              ...item,
              [field]: newValue,
              sl_td3_goc: Math.round(sl_td3_goc_moi * 1000) / 1000,
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
    // Tìm thông tin đơn vị tính được chọn
    const dvtOptions = record.donViTinhList || [];
    const selectedDvt = dvtOptions.find(
      (dvt) => dvt.dvt.trim() === newValue.trim()
    );
    const heSoMoi = selectedDvt ? parseFloat(selectedDvt.he_so) || 1 : 1;

    // Tính số lượng mới dựa trên số lượng gốc
    const sl_td3_goc = record.sl_td3_goc || 1;
    const sl_td3_moi = sl_td3_goc * heSoMoi;

    // Làm tròn đến 3 chữ số thập phân
    const sl_td3_lam_tron = Math.round(sl_td3_moi * 1000) / 1000;

    setDataSource((prev) =>
      prev.map((item) =>
        item.key === record.key
          ? {
              ...item,
              dvt: newValue,
              he_so: heSoMoi,
              sl_td3: sl_td3_lam_tron,
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
    handleDeleteItem,
    handleDvtChange,
  };
};
