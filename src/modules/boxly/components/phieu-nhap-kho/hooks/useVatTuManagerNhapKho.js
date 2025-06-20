import { message } from "antd";
import { useState } from "react";

export const useVatTuManagerNhapKho = () => {
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
              const soLuongGocMoi = (item.soLuong_goc || 1) + 1;
              // Tính lại số lượng hiển thị dựa trên hệ số hiện tại
              const soLuongMoi = soLuongGocMoi * (item.he_so || 1);
              const soLuongLamTron = Math.round(soLuongMoi * 1000) / 1000;

              return {
                ...item,
                soLuong: soLuongLamTron,
                soLuong_goc: soLuongGocMoi,
              };
            }
            return item;
          });
        } else {
          const newItem = {
            key: prev.length + 1,
            maHang: value,
            soLuong: 1,
            soLuong_goc: 1,
            he_so: 1,
            ten_mat_hang: vatTuInfo.ten_vt || value,
            dvt: defaultDvt,
            dvt_goc: defaultDvt,
            tk_vt: vatTuInfo.tk_vt ? vatTuInfo.tk_vt.trim() : "",
            tk_co: "",
            ma_kho: "",
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
          // Nếu đang ở đơn vị tính gốc, cập nhật luôn soLuong_goc
          if (item.dvt === item.dvt_goc) {
            return {
              ...item,
              [field]: newValue,
              soLuong_goc: newValue,
            };
          } else {
            // Nếu không phải đơn vị tính gốc, tính ngược lại soLuong_goc
            const soLuongGocMoi = newValue / (item.he_so || 1);
            return {
              ...item,
              [field]: newValue,
              soLuong_goc: Math.round(soLuongGocMoi * 1000) / 1000,
            };
          }
        }
        return item;
      })
    );
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
    const soLuongGoc = record.soLuong_goc || 1;
    const soLuongMoi = soLuongGoc * heSoMoi;

    // Làm tròn đến 3 chữ số thập phân
    const soLuongLamTron = Math.round(soLuongMoi * 1000) / 1000;

    setDataSource((prev) =>
      prev.map((item) =>
        item.key === record.key
          ? {
              ...item,
              dvt: newValue,
              he_so: heSoMoi,
              soLuong: soLuongLamTron,
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
