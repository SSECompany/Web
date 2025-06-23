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
        console.log("DEBUG NHẬP KHO: Current dataSource:", prev);
        console.log("DEBUG NHẬP KHO: Adding value:", `"${value}"`);

        // Debug từng dòng trong dataSource
        prev.forEach((item, index) => {
          console.log(
            `DEBUG NHẬP KHO: Row ${index}: maHang = "${
              item.maHang
            }", comparison = ${item.maHang === value}, trimmed comparison = ${
              item.maHang.trim() === value.trim()
            }`
          );
        });

        // Tìm dòng đầu tiên có cùng mã vật tư để merge (trim để tránh lỗi whitespace)
        const existingIndex = prev.findIndex(
          (item) => item.maHang.trim() === value.trim()
        );
        console.log("DEBUG NHẬP KHO: Found existing at index:", existingIndex);

        if (existingIndex !== -1) {
          // Merge vào dòng đầu tiên và xóa các dòng trùng lặp khác
          const updatedData = prev.map((item, index) => {
            if (index === existingIndex) {
              // Cộng thêm 1 lần hệ số vào số lượng hiện tại
              const dvtHienTai = (item.dvt || "").trim();
              const dvtGoc = (item.dvt_goc || "").trim();

              let soLuongThemVao;
              // Nếu đang ở đơn vị tính gốc, thêm theo hệ số gốc
              if (dvtHienTai === dvtGoc) {
                const heSoApDung = item.he_so_goc ?? item.he_so ?? 1;
                soLuongThemVao = 1 * heSoApDung;
              } else {
                // Nếu đang ở đơn vị khác, thêm 1 đơn vị
                soLuongThemVao = 1;
              }

              const soLuongHienTai = item.soLuong || 0;
              const soLuongMoi = soLuongHienTai + soLuongThemVao;
              const soLuongLamTron = Math.round(soLuongMoi * 1000) / 1000;

              // Cập nhật soLuong_goc để đồng bộ
              const soLuongGocMoi = (item.soLuong_goc ?? 0) + 1;

              return {
                ...item,
                soLuong: soLuongLamTron,
                soLuong_goc: soLuongGocMoi,
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

          const newItem = {
            key: prev.length + 1,
            maHang: value,
            soLuong: 0, // Số lượng = 0 khi thêm mới
            soLuong_goc: 0, // Số lượng gốc = 0
            he_so: heSo,
            he_so_goc: heSo, // Lưu hệ số gốc để dùng khi chuyển đổi đơn vị
            ten_mat_hang: vatTuInfo.ten_vt || value,
            dvt: defaultDvt,
            dvt_goc: defaultDvt,
            tk_vt: vatTuInfo.tk_vt ? vatTuInfo.tk_vt.trim() : "",
            ma_kho: "",
            donViTinhList: donViTinhList,
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
          // Nếu đang ở đơn vị tính gốc, tính ngược lại soLuong_goc từ số lượng nhập
          if (item.dvt === item.dvt_goc) {
            const soLuongGocMoi = newValue / (item.he_so_goc ?? 1);
            return {
              ...item,
              [field]: newValue,
              soLuong_goc: Math.round(soLuongGocMoi * 1000) / 1000,
            };
          } else {
            // Nếu đang ở đơn vị khác, số lượng nhập chính là soLuong_goc
            return {
              ...item,
              [field]: newValue,
              soLuong_goc: newValue,
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

    const soLuongGoc = record.soLuong_goc ?? 1;
    let soLuongMoi;

    // Nếu chuyển về đơn vị tính gốc, áp dụng hệ số gốc
    if (newValue.trim() === record.dvt_goc.trim()) {
      soLuongMoi = soLuongGoc * record.he_so_goc;
    } else {
      // Nếu chuyển sang đơn vị khác, hiển thị số lượng gốc (số nguyên)
      soLuongMoi = soLuongGoc;
    }

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
