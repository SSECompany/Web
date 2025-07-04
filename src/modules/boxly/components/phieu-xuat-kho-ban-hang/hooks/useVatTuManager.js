import { message } from "antd";
import { useState } from "react";

export const useVatTuManager = () => {
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
        so_luong: parseFloat(item.so_luong) || 0,
        soLuong: parseFloat(item.so_luong) || 0,
        so_luong_goc: parseFloat(item.so_luong) || 0,
        soLuong_goc: parseFloat(item.so_luong) || 0,

        sl_td3: parseFloat(item.sl_td3) || 0,
        sl_td3_goc: parseFloat(item.sl_td3) || 0,

        // Hệ số: ưu tiên dùng từ data2 (đã được xác định và lưu)
        he_so: parseFloat(item.he_so) || 1,
        he_so_goc: parseFloat(item.he_so) || 1,

        // Đơn vị tính
        dvt: item.dvt ? item.dvt.trim() : "cái",
        dvt_goc: item.dvt ? item.dvt.trim() : "cái",

        // Thông tin kho và tài khoản
        ma_kho: item.ma_kho ? item.ma_kho.trim() : "",
        tk_vt: item.tk_vt ? item.tk_vt.trim() : "",
        tk_gv: item.tk_gv ? item.tk_gv.trim() : "",
        tk_dt: item.tk_dt ? item.tk_dt.trim() : "",
        tk_thue: item.tk_thue ? item.tk_thue.trim() : "",

        // Thông tin giá và thuế
        gia_nt2: parseFloat(item.gia_nt2) || 0,
        gia2: parseFloat(item.gia2) || 0,
        thue: parseFloat(item.thue) || 0,
        thue_nt: parseFloat(item.thue_nt) || 0,
        tien2: parseFloat(item.tien2) || 0,
        tien_nt2: parseFloat(item.tien_nt2) || 0,

        // Thông tin chiết khấu
        tl_ck: parseFloat(item.tl_ck) || 0,
        ck: parseFloat(item.ck) || 0,
        ck_nt: parseFloat(item.ck_nt) || 0,
        tl_ck_khac: parseFloat(item.tl_ck_khac) || 0,
        gia_ck: parseFloat(item.gia_ck) || 0,
        tien_ck_khac: parseFloat(item.tien_ck_khac) || 0,

        // Thông tin thuế
        ma_thue: item.ma_thue ? item.ma_thue.trim() : "",
        thue_suat: parseFloat(item.thue_suat) || 0,

        // Số lượng theo đơn vị khác
        sl_td1: parseFloat(item.sl_td1) || 0,
        sl_td2: parseFloat(item.sl_td2) || 0,
        sl_dh: parseFloat(item.sl_dh) || 0,

        // Thông tin liên kết đơn hàng và phiếu xuất
        stt_rec_dh: item.stt_rec_dh ? item.stt_rec_dh.trim() : "",
        stt_rec0dh: item.stt_rec0dh ? item.stt_rec0dh.trim() : "",
        stt_rec_px: item.stt_rec_px ? item.stt_rec_px.trim() : "",
        stt_rec0px: item.stt_rec0px ? item.stt_rec0px.trim() : "",

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

      if (!vatTuInfo) {
        message.error("Thông tin vật tư không hợp lệ");
        return;
      }

      const donViTinhList = await fetchDonViTinh(value.trim());

      if (!Array.isArray(donViTinhList)) {
        message.error("Không thể lấy danh sách đơn vị tính");
        return;
      }

      const defaultDvt =
        vatTuInfo && vatTuInfo.dvt ? vatTuInfo.dvt.trim() : "cái";

      setDataSource((prev) => {
        const existingIndex = prev.findIndex(
          (item) => (item.maHang?.trim() || "") === value.trim()
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
                  console.log("🚀 ~ updatedData ~ heSoHienTai:", heSoHienTai);
                  console.log(
                    "🚀 ~ updatedData ~ heSoGocFromAPI:",
                    heSoGocFromAPI
                  );
                  console.log("🚀 ~ updatedData ~ soLuongGoc:", soLuongGoc);

                  soLuongThemVao = soLuongGoc;
                }
              }

              const sl_td3_hienTai =
                item.sl_td3 !== undefined ? item.sl_td3 : item.soLuong || 0;
              const sl_td3_moi = sl_td3_hienTai + soLuongThemVao;
              const sl_td3_lam_tron = Math.round(sl_td3_moi * 1000) / 1000;

              const sl_td3_goc =
                item.sl_td3_goc !== undefined
                  ? item.sl_td3_goc
                  : item.soLuong_goc || 0;
              const sl_td3_goc_moi = sl_td3_goc + 1;

              const so_luong =
                item.so_luong !== undefined ? item.so_luong : item.soLuong || 0;
              const so_luong_goc =
                item.so_luong_goc !== undefined
                  ? item.so_luong_goc
                  : item.soLuong_goc || 0;

              const updatedItem = {
                ...item,
                so_luong: so_luong,
                soLuong: so_luong,
                so_luong_goc: so_luong_goc,
                soLuong_goc: so_luong_goc,

                sl_td3: sl_td3_lam_tron,
                sl_td3_goc: sl_td3_goc_moi,

                he_so: heSoHienTai,
                he_so_goc: heSoGocFromAPI,

                dvt: dvtHienTai || defaultDvt,
                dvt_goc: dvtGoc || defaultDvt,

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
              index === existingIndex ||
              (item.maHang?.trim() || "") !== value.trim()
          );

          const result = filteredData.map((item, index) => ({
            ...item,
            key: index + 1,
          }));

          return result;
        } else {
          // Khi thêm vật tư mới: dùng hệ số từ API chi tiết vật tư
          const heSoGocFromAPI = isNaN(parseFloat(vatTuInfo.he_so))
            ? 1
            : parseFloat(vatTuInfo.he_so);
          const dvtGocFromAPI = vatTuInfo.dvt ? vatTuInfo.dvt.trim() : "cái";

          const dvtHienTai = dvtGocFromAPI;

          let so_luong_goc = 0;
          let so_luong_hienThi = 0;
          let sl_td3_goc = 1;
          let sl_td3_hienThi;
          let heSoHienTai;

          if (dvtHienTai.trim() === dvtGocFromAPI.trim()) {
            sl_td3_hienThi = sl_td3_goc * heSoGocFromAPI;
            so_luong_hienThi = so_luong_goc * heSoGocFromAPI;

            heSoHienTai = heSoGocFromAPI;
          } else {
            sl_td3_hienThi = 1;
            so_luong_hienThi = 0;

            const dvtHienTaiInfo = donViTinhList.find(
              (dvt) => dvt.dvt.trim() === dvtHienTai.trim()
            );
            heSoHienTai = dvtHienTaiInfo
              ? isNaN(parseFloat(dvtHienTaiInfo.he_so))
                ? 1
                : parseFloat(dvtHienTaiInfo.he_so)
              : 1;
          }

          const newItem = {
            key: prev.length + 1,
            maHang: value,
            so_luong: Math.round(so_luong_hienThi * 1000) / 1000,
            soLuong: Math.round(so_luong_hienThi * 1000) / 1000,
            so_luong_goc: Math.round(so_luong_goc * 1000) / 1000,
            soLuong_goc: Math.round(so_luong_goc * 1000) / 1000,
            sl_td3: Math.round(sl_td3_hienThi * 1000) / 1000,
            sl_td3_goc: Math.round(sl_td3_goc * 1000) / 1000,
            he_so: heSoHienTai,
            he_so_goc: heSoGocFromAPI,
            ten_mat_hang: vatTuInfo.ten_vt || value,
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
            sl_dh: 0,
            stt_rec_dh: "",
            stt_rec0dh: "",
            stt_rec_px: "",
            stt_rec0px: "",
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
          if (item.dvt?.trim() === item.dvt_goc?.trim()) {
            const sl_td3_goc_moi = newValue / (item.he_so_goc ?? 1);

            return {
              ...item,
              [field]: newValue,
              sl_td3_goc: Math.round(sl_td3_goc_moi * 1000) / 1000,
              _lastUpdated: Date.now(),
            };
          } else {
            return {
              ...item,
              [field]: newValue,
              sl_td3_goc: newValue,
              _lastUpdated: Date.now(),
            };
          }
        }
        return { ...item };
      })
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

    const dvtOptions = record.donViTinhList || [];
    const selectedDvt = dvtOptions.find(
      (dvt) => dvt && dvt.dvt && dvt.dvt.trim() === newValue.trim()
    );

    // Khi thay đổi đơn vị tính: dùng hệ số từ danh sách đơn vị tính
    const heSoMoi = selectedDvt ? parseFloat(selectedDvt.he_so) || 1 : 1;

    const currentDvtInList = dvtOptions.find(
      (dvt) => dvt && dvt.dvt && dvt.dvt.trim() === record.dvt?.trim()
    );
    const heSoHienTai = currentDvtInList
      ? isNaN(parseFloat(currentDvtInList.he_so))
        ? 1
        : parseFloat(currentDvtInList.he_so)
      : record.he_so || 1;
    const sl_td3_hienTai = record.sl_td3 || 0;
    const so_luong_hien_tai = record.so_luong || 0;

    let sl_td3_moi;
    let so_luong_moi;

    if (sl_td3_hienTai === 0) {
      sl_td3_moi = 0;
    } else {
      sl_td3_moi = (sl_td3_hienTai * heSoHienTai) / heSoMoi;
    }

    so_luong_moi = (so_luong_hien_tai * heSoHienTai) / heSoMoi;

    const sl_td3_lam_tron = Math.round(sl_td3_moi * 10000) / 10000;
    const so_luong_lam_tron = Math.round(so_luong_moi * 10000) / 10000;

    let sl_td3_goc_moi = record.sl_td3_goc;

    if (newValue.trim() === record.dvt_goc?.trim()) {
      const he_so_goc = record.he_so_goc || 1;
      sl_td3_goc_moi = sl_td3_lam_tron / he_so_goc;
    } else {
      if (record.dvt?.trim() === record.dvt_goc?.trim()) {
        sl_td3_goc_moi = sl_td3_hienTai / (record.he_so_goc || 1);
      } else {
        sl_td3_goc_moi = record.sl_td3_goc;
      }
    }

    const finalResult = {
      dvt: newValue,
      he_so: heSoMoi,
      so_luong: so_luong_lam_tron,
      sl_td3: sl_td3_lam_tron,
      sl_td3_goc: Math.round((sl_td3_goc_moi || 0) * 10000) / 10000,
      _lastUpdated: Date.now(),
    };

    setDataSource((prev) => {
      // Tạo array mới hoàn toàn để force re-render
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
    handleDeleteItem,
    handleDvtChange,
  };
};
