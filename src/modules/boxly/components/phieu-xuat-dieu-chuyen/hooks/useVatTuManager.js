import { message } from "antd";
import { useRef, useState } from "react";

export const useVatTuManager = () => {
  const [dataSource, setDataSource] = useState([]);
  const isProcessingRef = useRef(false);
  const lastProcessedValueRef = useRef("");

  const handleVatTuSelect = async (
    value,
    isEditMode,
    fetchVatTuDetail,
    fetchDonViTinh,
    setVatTuInput,
    setVatTuList,
    fetchVatTuList,
    vatTuSelectRef
  ) => {
    if (!isEditMode) {
      message.warning("Bạn cần bật chế độ chỉnh sửa");
      return;
    }

    // Validate input
    if (!value || !value.trim()) {
      return;
    }

    // Prevent double processing
    if (isProcessingRef.current) {
      return;
    }

    // Allow reprocessing the same value after a delay
    const timeSinceLastProcess =
      Date.now() - (lastProcessedValueRef.current?.timestamp || 0);
    if (
      lastProcessedValueRef.current?.value === value.trim() &&
      timeSinceLastProcess < 2000
    ) {
      return;
    }
    isProcessingRef.current = true;
    lastProcessedValueRef.current = {
      value: value.trim(),
      timestamp: Date.now(),
    };

    try {
      const vatTuDetail = await fetchVatTuDetail(value.trim());

      if (!vatTuDetail) {
        message.error("Thông tin vật tư không hợp lệ!");
        if (setVatTuInput) setTimeout(() => setVatTuInput(""), 2000);
        return false;
      }

      const vatTuInfo = Array.isArray(vatTuDetail)
        ? vatTuDetail[0]
        : vatTuDetail;

      if (!vatTuInfo) {
        message.error("Thông tin vật tư không hợp lệ!");
        if (setVatTuInput) setTimeout(() => setVatTuInput(""), 2000);
        return false;
      }

      const donViTinhList = await fetchDonViTinh(value.trim());

      if (!Array.isArray(donViTinhList)) {
        message.error("Thông tin vật tư không hợp lệ!");
        if (setVatTuInput) setTimeout(() => setVatTuInput(""), 2000);
        return false;
      }

      const defaultDvt =
        vatTuInfo && vatTuInfo.dvt ? vatTuInfo.dvt.trim() : "cái";

      setDataSource((prev) => {
        const existingIndex = prev.findIndex(
          (item) => item.maHang.trim() === value.trim()
        );

        if (existingIndex !== -1) {
          const updatedData = prev.map((item, index) => {
            if (index === existingIndex) {
              const dvtHienTai = (item.dvt || "").trim();
              const dvtGoc = (item.dvt_goc || "").trim();
              const heSoGoc = item.he_so_goc ?? 1;
              const heSoHienTai = item.he_so ?? 1;

              let soLuongThemVao;

              if (dvtHienTai.trim() === dvtGoc.trim()) {
                soLuongThemVao = heSoGoc;
              } else {
                soLuongThemVao = 1;
              }

              const sl_td3_hienTai = item.sl_td3 || 0;
              const sl_td3_moi = sl_td3_hienTai + soLuongThemVao;
              const sl_td3_lam_tron = Math.round(sl_td3_moi * 1000) / 1000;

              const sl_td3_goc_moi = (item.sl_td3_goc ?? 0) + 1;

              const updatedItem = {
                ...item,
                so_luong: item.so_luong,
                so_luong_goc: item.so_luong_goc,
                sl_td3: sl_td3_lam_tron,
                sl_td3_goc: sl_td3_goc_moi,
                ma_kho: (vatTuInfo.ma_kho || item.ma_kho || "").trim(), // Cập nhật ma_kho từ API, fallback về giá trị cũ
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

          const result = filteredData.map((item, index) => ({
            ...item,
            key: index + 1,
          }));

          return result;
        } else {
          const heSoGocFromAPI = parseFloat(vatTuInfo.he_so) || 1;
          const dvtGocFromAPI = vatTuInfo.dvt ? vatTuInfo.dvt.trim() : "cái";

          const dvtHienTai = dvtGocFromAPI;

          let sl_td3_goc, sl_td3_hienThi;
          let so_luong_goc, so_luong_hienThi;
          let heSoHienTai = heSoGocFromAPI;

          if (dvtHienTai.trim() === dvtGocFromAPI.trim()) {
            sl_td3_goc = 1;
            sl_td3_hienThi = sl_td3_goc * heSoGocFromAPI;

            so_luong_goc = 0;
            so_luong_hienThi = so_luong_goc * heSoGocFromAPI;

            heSoHienTai = heSoGocFromAPI;
          } else {
            sl_td3_goc = 1;
            sl_td3_hienThi = sl_td3_goc;

            so_luong_goc = 0;
            so_luong_hienThi = so_luong_goc;

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
            he_so_goc: heSoGocFromAPI,
            ten_mat_hang: vatTuInfo.ten_vt || value,
            dvt: dvtHienTai,
            dvt_goc: dvtGocFromAPI,
            tk_vt: vatTuInfo.tk_vt ? vatTuInfo.tk_vt.trim() : "",
            ma_kho: (vatTuInfo.ma_kho || "").trim(),
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
            _lastUpdated: Date.now(),
          };

          const result = [...prev, newItem];
          return result;
        }
      });

      message.success(`Đã thêm vật tư: ${value}`);

      // Clear input và focus lại để tiếp tục scan
      if (setVatTuInput) setVatTuInput("");

      // Reset lastProcessedValueRef when input is cleared
      lastProcessedValueRef.current = null;

      // Focus lại vào input sau khi xử lý xong với delay dài hơn cho tablet
      if (vatTuSelectRef && vatTuSelectRef.current) {
        // Clear any existing focus attempts
        setTimeout(() => {
          if (vatTuSelectRef.current) {
            vatTuSelectRef.current.focus();
            // Force focus again to ensure it works on tablet
            setTimeout(() => {
              if (vatTuSelectRef.current) {
                vatTuSelectRef.current.focus();
                // One more attempt to ensure focus on tablet
                setTimeout(() => {
                  if (vatTuSelectRef.current) {
                    vatTuSelectRef.current.focus();
                  }
                }, 100);
              }
            }, 50);
          }
        }, 300);
      }
      return true;
    } catch (error) {
      console.error("Error adding vat tu:", error);
      message.error("Thông tin vật tư không hợp lệ!");
      return false;
    } finally {
      // Reset processing flag after a delay
      setTimeout(() => {
        isProcessingRef.current = false;
      }, 1000);
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
            };
          } else {
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
    const heSoMoi = selectedDvt ? parseFloat(selectedDvt.he_so) || 1 : 1;

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

    setDataSource((prev) => {
      const newDataSource = prev.map((item) =>
        item.key === record.key
          ? {
              ...item,
              dvt: newValue,
              he_so: heSoMoi,
              so_luong: so_luong_lam_tron,
              sl_td3: sl_td3_lam_tron,
              sl_td3_goc: Math.round((sl_td3_goc_moi || 0) * 10000) / 10000,
              _lastUpdated: Date.now(),
            }
          : { ...item }
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
