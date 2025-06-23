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

              // Công thức tổng quát: Thêm 1 đơn vị gốc được quy đổi sang đơn vị hiện tại
              // Số lượng thêm = 1 × (hệ số đơn vị gốc / hệ số đơn vị hiện tại)
              const heSoGoc = item.he_so_goc ?? 1;
              const heSoHienTai = item.he_so ?? 1;
              const soLuongThemVao = (1 * heSoGoc) / heSoHienTai;

              const soLuongHienTai = item.soLuong || 0;
              const soLuongMoi = soLuongHienTai + soLuongThemVao;
              const soLuongLamTron = Math.round(soLuongMoi * 1000) / 1000;

              // Cập nhật soLuong_goc để đồng bộ
              const soLuongGocMoi = (item.soLuong_goc ?? 0) + 1;

              return {
                ...item,
                soLuong: soLuongLamTron,
                soLuong_goc: soLuongGocMoi,
                // Giữ nguyên flag isNewlyAdded nếu có
                isNewlyAdded: item.isNewlyAdded,
                // Giữ nguyên tất cả các trường từ API
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

          // Khi thêm mới, số lượng mặc định là 1 đơn vị gốc
          const soLuongGoc = 1;
          const soLuongHienThi = soLuongGoc * heSo; // Số lượng hiển thị = số lượng gốc × hệ số
          const soLuongLamTron = Math.round(soLuongHienThi * 1000) / 1000;

          const newItem = {
            key: prev.length + 1,
            maHang: value,
            soLuong: soLuongLamTron, // Số lượng = 1 × hệ số khi thêm mới
            soLuong_goc: soLuongGoc, // Số lượng gốc = 1
            he_so: heSo,
            he_so_goc: heSo, // Lưu hệ số gốc để dùng khi chuyển đổi đơn vị
            ten_mat_hang: vatTuInfo.ten_vt || value,
            dvt: defaultDvt,
            dvt_goc: defaultDvt,
            tk_vt: vatTuInfo.tk_vt ? vatTuInfo.tk_vt.trim() : "",
            ma_kho: "",
            donViTinhList: donViTinhList,
            isNewlyAdded: true, // Flag để phân biệt dữ liệu mới thêm

            // Khởi tạo các trường mặc định cho vật tư mới
            stt_rec0: "",
            ma_sp: "",
            ma_bp: "",
            so_lsx: "",
            ma_vi_tri: "",
            ma_lo: "",
            ma_vv: "",
            ma_nx: "",
            tk_du: "",
            gia_nt: 0,
            gia: 0,
            tien_nt: 0,
            tien: 0,
            pn_gia_tb: false,
            stt_rec_px: "",
            stt_rec0px: "",
            line_nbr: 0,
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

    // Áp dụng công thức chuyển đổi: Số lượng mới = Số lượng hiện tại * Hệ số hiện tại / Hệ số mới
    const heSoHienTai = record.he_so || 1;
    const soLuongHienTai = record.soLuong || 0;

    let soLuongMoi;

    if (soLuongHienTai === 0) {
      // Nếu số lượng hiện tại là 0, giữ nguyên
      soLuongMoi = 0;
    } else {
      // Áp dụng công thức chuyển đổi
      soLuongMoi = (soLuongHienTai * heSoHienTai) / heSoMoi;
    }

    // Làm tròn đến 4 chữ số thập phân
    const soLuongLamTron = Math.round(soLuongMoi * 10000) / 10000;

    // Cập nhật soLuong_goc để đồng bộ với đơn vị gốc
    let soLuongGocMoi = record.soLuong_goc;
    if (newValue.trim() === record.dvt_goc?.trim()) {
      // Nếu chuyển về đơn vị gốc, soLuong_goc = soLuongMoi / he_so_goc
      const he_so_goc = record.he_so_goc || 1;
      soLuongGocMoi = soLuongLamTron / he_so_goc;
    } else {
      // Nếu chuyển sang đơn vị khác, tính soLuong_goc từ đơn vị hiện tại
      if (record.dvt?.trim() === record.dvt_goc?.trim()) {
        // Từ đơn vị gốc sang đơn vị khác
        soLuongGocMoi = soLuongHienTai / (record.he_so_goc || 1);
      } else {
        // Từ đơn vị khác sang đơn vị khác, giữ nguyên soLuong_goc
        soLuongGocMoi = record.soLuong_goc;
      }
    }

    setDataSource((prev) =>
      prev.map((item) =>
        item.key === record.key
          ? {
              ...item, // Giữ nguyên tất cả các trường hiện có
              dvt: newValue,
              he_so: heSoMoi,
              soLuong: soLuongLamTron,
              soLuong_goc: Math.round((soLuongGocMoi || 0) * 10000) / 10000,
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
