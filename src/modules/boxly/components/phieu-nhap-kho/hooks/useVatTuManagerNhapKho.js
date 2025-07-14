import { message } from "antd";
import { useState } from "react";

export const useVatTuManagerNhapKho = () => {
  const [dataSource, setDataSource] = useState([]);

  // Function để load dữ liệu từ phiếu đã có (data2)
  const loadDataFromPhieu = (data2, fetchDonViTinh) => {
    if (!Array.isArray(data2) || data2.length === 0) {
      setDataSource([]);
      return;
    }

    const processedData = data2.map((item, index) => {
      return {
        key: index + 1,
        maHang: item.ma_vt || "",
        ten_mat_hang: item.ten_vt || item.ma_vt || "",

        // Sử dụng dữ liệu đã lưu trong phiếu
        soLuong: parseFloat(item.sl_td3) || 0,
        soLuong_goc: parseFloat(item.so_luong_goc) || 0,
        soLuongDeNghi: parseFloat(item.so_luong) || 0,

        // Hệ số: ưu tiên dùng từ data2 (đã được xác định và lưu)
        he_so: parseFloat(item.he_so) || 1,
        he_so_goc: parseFloat(item.he_so_goc) || 1,

        // Đơn vị tính
        dvt: item.dvt ? item.dvt.trim() : "cái",
        dvt_goc: item.dvt_goc ? item.dvt_goc.trim() : "cái",

        // Thông tin nhập kho đặc thù
        stt_rec0: item.stt_rec0 || "",
        ma_sp: item.ma_sp ? item.ma_sp.trim() : "",
        ma_bp: item.ma_bp ? item.ma_bp.trim() : "",
        so_lsx: item.so_lsx ? item.so_lsx.trim() : "",
        ma_vi_tri: item.ma_vi_tri ? item.ma_vi_tri.trim() : "",
        ma_lo: item.ma_lo ? item.ma_lo.trim() : "",
        ma_vv: item.ma_vv ? item.ma_vv.trim() : "",
        ma_nx: item.ma_nx ? item.ma_nx.trim() : "",
        tk_du: item.tk_du ? item.tk_du.trim() : "",

        // Thông tin giá
        gia_nt: parseFloat(item.gia_nt) || 0,
        gia: parseFloat(item.gia) || 0,
        tien_nt: parseFloat(item.tien_nt) || 0,
        tien: parseFloat(item.tien) || 0,
        pn_gia_tb: Boolean(item.pn_gia_tb),

        // Thông tin liên kết
        stt_rec_px: item.stt_rec_px ? item.stt_rec_px.trim() : "",
        stt_rec0px: item.stt_rec0px ? item.stt_rec0px.trim() : "",
        line_nbr: parseInt(item.line_nbr) || 0,

        // Thông tin kho và tài khoản
        ma_kho: item.ma_kho ? item.ma_kho.trim() : "",
        tk_vt: item.tk_vt ? item.tk_vt.trim() : "",

        // Đánh dấu không phải là item mới thêm
        isNewlyAdded: false,
        _lastUpdated: Date.now(),

        // Sẽ được load async
        donViTinhList: [],
      };
    });

    setDataSource(processedData);

    // Load async đơn vị tính cho từng item
    if (fetchDonViTinh) {
      processedData.forEach(async (item, index) => {
        try {
          const donViTinhList = await fetchDonViTinh(item.maHang);
          if (Array.isArray(donViTinhList)) {
            setDataSource((prev) =>
              prev.map((prevItem, prevIndex) =>
                prevIndex === index ? { ...prevItem, donViTinhList } : prevItem
              )
            );
          }
        } catch (error) {
          console.error(`Error loading don vi tinh for ${item.maHang}:`, error);
        }
      });
    }
  };

  const handleVatTuSelect = async (
    value,
    isEditMode,
    fetchVatTuDetail,
    fetchDonViTinh,
    setVatTuInput
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

      const donViTinhList = await fetchDonViTinh(value.trim());

      setDataSource((prev) => {
        prev.forEach((item, index) => {});

        const existingIndex = prev.findIndex(
          (item) => item.maHang.trim() === value.trim()
        );

        if (existingIndex !== -1) {
          const updatedData = prev.map((item, index) => {
            if (index === existingIndex) {
              const dvtHienTai = (item.dvt || "").trim();
              const dvtGoc = (item.dvt_goc || "").trim();

              // Luôn lấy hệ số gốc từ API tìm kiếm vật tư (fetchVatTuDetail)
              const heSoGocFromAPI = parseFloat(vatTuInfo.he_so);
              const heSoHienTai = item.he_so;
              const heSoAPI = heSoGocFromAPI;
              const dvtAPI = vatTuInfo.dvt ? vatTuInfo.dvt.trim() : "cái";
              let soLuongThemVao;

              if (dvtHienTai.trim() === dvtGoc.trim()) {
                if (dvtAPI.trim() === dvtGoc.trim()) {
                  soLuongThemVao = heSoAPI;
                } else {
                  const dvtAPIInfo = donViTinhList.find(
                    (dvt) => dvt.dvt.trim() === dvtAPI.trim()
                  );
                  const heSoDVTAPI = isNaN(parseFloat(dvtAPIInfo.he_so))
                    ? 1
                    : parseFloat(dvtAPIInfo.he_so);

                  soLuongThemVao = heSoDVTAPI;
                }
              } else {
                if (dvtAPI.trim() === dvtHienTai.trim()) {
                  soLuongThemVao = heSoAPI;
                } else {
                  const soLuongGoc = heSoGocFromAPI / heSoHienTai;
                  soLuongThemVao = soLuongGoc;
                }
              }

              const soLuongHienTai =
                item.soLuong !== undefined ? item.soLuong : 0;

              const soLuongMoi = soLuongHienTai + soLuongThemVao;
              const soLuongLamTron = Math.round(soLuongMoi * 1000) / 1000;

              // Số lượng đề nghị giữ nguyên giá trị hiện tại
              const soLuongDeNghiHienTai = item.soLuongDeNghi || 0;

              const soLuongGocHienTai =
                item.soLuong_goc !== undefined ? item.soLuong_goc : 0;

              const soLuongGocMoi = soLuongGocHienTai + 1; // Tăng thêm 1 cho soLuong_goc

              const updatedItem = {
                ...item,
                soLuong: soLuongLamTron, // Cập nhật số lượng thực tế (sl_td3) - tăng thêm
                soLuongDeNghi: soLuongDeNghiHienTai, // Giữ nguyên số lượng đề nghị (so_luong)
                soLuong_goc: soLuongGocMoi, // Tăng thêm 1

                he_so: heSoHienTai,
                he_so_goc: heSoGocFromAPI,

                dvt:
                  dvtHienTai || (vatTuInfo.dvt ? vatTuInfo.dvt.trim() : "cái"),
                dvt_goc: dvtAPI,

                donViTinhList: donViTinhList,
                isNewlyAdded: item.isNewlyAdded,
                _lastUpdated: Date.now(),
              };

              return updatedItem;
            }
            return item;
          });

          const filteredData = updatedData.filter(
            (item, index) =>
              index === existingIndex || item.maHang.trim() !== value.trim()
          );

          return filteredData.map((item, index) => ({
            ...item,
            key: index + 1,
          }));
        } else {
          // Khi thêm vật tư mới: dùng hệ số từ API chi tiết vật tư
          const heSoGocFromAPI = isNaN(parseFloat(vatTuInfo.he_so))
            ? 1
            : parseFloat(vatTuInfo.he_so);
          const dvtGocFromAPI = vatTuInfo.dvt ? vatTuInfo.dvt.trim() : "cái";

          const dvtHienTai = dvtGocFromAPI;

          // Khi thêm vật tư mới, số lượng gốc cho soLuong = 1, soLuongDeNghi = 0
          let soLuongGoc = 1; // Cho soLuong
          let soLuongDeNghiGoc = 0; // Cho soLuongDeNghi
          let soLuongHienThi;
          let soLuongDeNghiHienThi;
          let heSoHienTai;

          if (dvtHienTai.trim() === dvtGocFromAPI.trim()) {
            // Đơn vị hiện tại = đơn vị gốc -> soLuong = soLuongGoc * heSoGoc
            soLuongHienThi = soLuongGoc * heSoGocFromAPI;
            soLuongDeNghiHienThi = soLuongDeNghiGoc * heSoGocFromAPI;
            heSoHienTai = heSoGocFromAPI;
          } else {
            // Đơn vị hiện tại khác đơn vị gốc -> tìm hệ số từ donViTinhList
            const dvtHienTaiInfo = donViTinhList.find(
              (dvt) => dvt.dvt.trim() === dvtHienTai.trim()
            );
            heSoHienTai = dvtHienTaiInfo
              ? isNaN(parseFloat(dvtHienTaiInfo.he_so))
                ? 1
                : parseFloat(dvtHienTaiInfo.he_so)
              : 1;

            // Quy đổi từ số lượng gốc sang đơn vị hiện tại
            soLuongHienThi = soLuongGoc * heSoHienTai;
            soLuongDeNghiHienThi = soLuongDeNghiGoc * heSoHienTai;
          }

          const newItem = {
            key: prev.length + 1,
            maHang: value,
            soLuong: Math.round(soLuongHienThi * 1000) / 1000, // sl_td3 - số lượng thực tế
            soLuong_goc: Math.round(soLuongGoc * 1000) / 1000, // soLuong_goc = 1
            soLuongDeNghi: Math.round(soLuongDeNghiHienThi * 1000) / 1000, // so_luong - số lượng đề nghị
            soLuongDeNghi_goc: Math.round(soLuongDeNghiGoc * 1000) / 1000, // soLuongDeNghi_goc = 0
            he_so: heSoHienTai,
            he_so_goc: heSoGocFromAPI,
            ten_mat_hang: vatTuInfo.ten_vt || value,
            dvt: dvtHienTai,
            dvt_goc: dvtGocFromAPI,
            tk_vt: vatTuInfo.tk_vt ? vatTuInfo.tk_vt.trim() : "",
            ma_kho: vatTuInfo.ma_kho ? vatTuInfo.ma_kho.trim() : "",
            donViTinhList: donViTinhList,
            isNewlyAdded: true,

            // Thông tin nhập kho đặc thù
            stt_rec0: "",
            ma_sp: "",
            ma_bp: "",
            so_lsx: "",
            ma_vi_tri: "",
            ma_lo: "",
            ma_vv: "",
            ma_nx: "",
            tk_du: "",

            // Thông tin giá
            gia_nt: 0,
            gia: 0,
            tien_nt: 0,
            tien: 0,
            pn_gia_tb: false,

            // Thông tin liên kết
            stt_rec_px: "",
            stt_rec0px: "",
            line_nbr: 0,

            _lastUpdated: Date.now(),
          };

          return [...prev, newItem];
        }
      });

      message.success(`Đã thêm vật tư: ${value}`);

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
          if (field === "soLuong") {
            // Xử lý thay đổi số lượng thực tế (sl_td3)
            if (item.dvt?.trim() === item.dvt_goc?.trim()) {
              const soLuongGocMoi = newValue / (item.he_so_goc ?? 1);
              return {
                ...item,
                [field]: newValue,
                soLuong_goc: Math.round(soLuongGocMoi * 1000) / 1000,
              };
            } else {
              return {
                ...item,
                [field]: newValue,
                soLuong_goc: newValue,
              };
            }
          } else if (field === "soLuongDeNghi") {
            // Xử lý thay đổi số lượng đề nghị (so_luong) - không ảnh hưởng đến soLuong_goc
            return {
              ...item,
              [field]: newValue,
            };
          } else {
            // Xử lý các trường khác
            return {
              ...item,
              [field]: newValue,
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
    const reIndexedDataSource = newDataSource.map((item, i) => ({
      ...item,
      key: i + 1,
    }));
    setDataSource(reIndexedDataSource);
    message.success("Đã xóa vật tư");
  };

  const handleDvtChange = (newValue, record) => {
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

    const currentDvtInList = dvtOptions.find(
      (dvt) => dvt && dvt.dvt && dvt.dvt.trim() === record.dvt?.trim()
    );
    const heSoHienTai = currentDvtInList
      ? parseFloat(currentDvtInList.he_so) || 1
      : record.he_so || 1;

    // Lấy số lượng hiện tại từ cả 2 trường
    const soLuongHienTai = record.soLuong || 0;
    const soLuongDeNghiHienTai = record.soLuongDeNghi || 0;

    // Tính toán số lượng mới cho cả 2 trường
    let soLuongMoi = (soLuongHienTai * heSoHienTai) / heSoMoi;
    let soLuongDeNghiMoi = (soLuongDeNghiHienTai * heSoHienTai) / heSoMoi;

    const soLuongLamTron = Math.round(soLuongMoi * 10000) / 10000;
    const soLuongDeNghiLamTron = Math.round(soLuongDeNghiMoi * 10000) / 10000;

    let soLuongGocMoi = record.soLuong_goc;

    if (newValue.trim() === record.dvt_goc?.trim()) {
      const he_so_goc = record.he_so_goc || 1;
      soLuongGocMoi = soLuongLamTron / he_so_goc;
    } else {
      if (record.dvt?.trim() === record.dvt_goc?.trim()) {
        soLuongGocMoi = soLuongHienTai / (record.he_so_goc || 1);
      } else {
        soLuongGocMoi = record.soLuong_goc;
      }
    }

    const finalResult = {
      dvt: newValue,
      he_so: heSoMoi,
      soLuong: soLuongLamTron, // Cập nhật số lượng thực tế (sl_td3)
      soLuongDeNghi: soLuongDeNghiLamTron, // Cập nhật số lượng đề nghị (so_luong)
      soLuong_goc: Math.round((soLuongGocMoi || 0) * 10000) / 10000,
      _lastUpdated: Date.now(),
    };

    setDataSource((prev) => {
      const newDataSource = prev.map((item) =>
        item.key === record.key
          ? {
              ...item,
              ...finalResult,
            }
          : { ...item }
      );

      return newDataSource;
    });
  };

  return {
    dataSource,
    setDataSource,
    loadDataFromPhieu,
    handleVatTuSelect,
    handleQuantityChange,
    handleSelectChange,
    handleDeleteItem,
    handleDvtChange,
  };
};
