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
    vatTuSelectRef,
    selectedOption = null
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
      // Luôn fetch detail để lấy đủ thông tin theo kho, giá và hệ số quy đổi
      let vatTuDetail = await fetchVatTuDetail(value.trim());

      if (!vatTuDetail) {
        message.error("Không tìm thấy thông tin chi tiết vật tư!");
        if (setVatTuInput) setTimeout(() => setVatTuInput(""), 2000);
        return false;
      }

      const vatTuInfo = Array.isArray(vatTuDetail)
        ? vatTuDetail[0]
        : vatTuDetail;

      if (!vatTuInfo) {
        message.error("Thông tin vật tư rỗng!");
        if (setVatTuInput) setTimeout(() => setVatTuInput(""), 2000);
        return false;
      }

      const donViTinhList = await fetchDonViTinh(value.trim());

      if (!Array.isArray(donViTinhList)) {
        message.error("Lỗi khi tải danh sách đơn vị tính!");
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

              // Luôn lấy hệ số gốc từ API tìm kiếm vật tư (fetchVatTuDetail)
              const heSoGocFromAPI = parseFloat(vatTuInfo.he_so);
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
                  const heSoDVTAPI = isNaN(parseFloat(dvtAPIInfo?.he_so))
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

              const sl_td3_hienTai = item.sl_td3 || 0;
              const sl_td3_moi = sl_td3_hienTai + soLuongThemVao;
              const sl_td3_lam_tron = Math.round(sl_td3_moi * 1000) / 1000;

              const sl_td3_goc_moi = (item.sl_td3_goc ?? 0) + 1;

              // Số lượng đề nghị không thay đổi khi merge vật tư đã có
              const so_luong_hienTai = item.so_luong || 0;
              const so_luong_lam_tron = so_luong_hienTai;

              const updatedItem = {
                ...item,
                so_luong: so_luong_lam_tron, // Giữ nguyên số lượng đề nghị
                so_luong_goc: item.so_luong_goc || 0, // Giữ nguyên số lượng đề nghị gốc
                sl_td3: sl_td3_lam_tron, // Tăng số lượng cheat
                sl_td3_goc: sl_td3_goc_moi, // Tăng số lượng cheat gốc
                he_so: heSoHienTai,
                he_so_goc: heSoGocFromAPI,
                dvt: dvtHienTai || dvtAPI,
                dvt_goc: dvtAPI,
                ma_kho: (vatTuInfo.ma_kho || item.ma_kho || "").trim(), // Cập nhật ma_kho từ API, fallback về giá trị cũ
                image: vatTuInfo.image || item.image || null,
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

          const result = filteredData.map((item, index) => ({
            ...item,
            key: index + 1,
          }));

          return result;
        } else {
          const heSoGocFromAPI = parseFloat(vatTuInfo.he_so) || 1;
          const dvtGocFromAPI = vatTuInfo.dvt ? vatTuInfo.dvt.trim() : "cái";

          const dvtHienTai = dvtGocFromAPI;

          // Khi thêm vật tư mới, số lượng gốc cho sl_td3 = 1, so_luong = 0
          let sl_td3_goc = 1; // Cho sl_td3 (số lượng cheat)
          let so_luong_goc = 0; // Cho so_luong (số lượng đề nghị)
          let sl_td3_hienThi;
          let so_luong_hienThi;
          let heSoHienTai = heSoGocFromAPI;

          if (dvtHienTai.trim() === dvtGocFromAPI.trim()) {
            sl_td3_hienThi = sl_td3_goc * heSoGocFromAPI;
            so_luong_hienThi = so_luong_goc * heSoGocFromAPI;
            heSoHienTai = heSoGocFromAPI;
          } else {
            // Đơn vị hiện tại khác đơn vị gốc -> tìm hệ số từ donViTinhList
            const dvtHienTaiInfo = donViTinhList.find(
              (dvt) => dvt.dvt.trim() === dvtHienTai.trim()
            );
            heSoHienTai = dvtHienTaiInfo
              ? parseFloat(dvtHienTaiInfo.he_so) || 1
              : 1;

            // Quy đổi từ số lượng gốc sang đơn vị hiện tại
            sl_td3_hienThi = sl_td3_goc * heSoHienTai;
            so_luong_hienThi = so_luong_goc * heSoHienTai;
          }

          const productName = vatTuInfo.ten_vt || vatTuInfo.label || value;
          const newItem = {
            key: prev.length + 1,
            maHang: value,
            so_luong: Math.round(so_luong_hienThi * 1000) / 1000, // Số lượng đề nghị = 0
            so_luong_goc: Math.round(so_luong_goc * 1000) / 1000, // Số lượng đề nghị gốc = 0
            sl_td3: Math.round(sl_td3_hienThi * 1000) / 1000, // Số lượng cheat = 1
            sl_td3_goc: Math.round(sl_td3_goc * 1000) / 1000, // Số lượng cheat gốc = 1
            he_so: heSoHienTai,
            he_so_goc: heSoGocFromAPI,
            ten_mat_hang: productName,
            image: vatTuInfo.image || null,
            dvt: dvtHienTai,
            dvt_goc: dvtGocFromAPI,
            tk_vt: vatTuInfo.tk_vt ? vatTuInfo.tk_vt.trim() : "",
            ma_kho: (vatTuInfo.ma_kho || "").trim(),
            donViTinhList: donViTinhList,
            isNewlyAdded: true,

            // === DYNAMIC: THÊM TẤT CẢ TRƯỜNG API ĐỂ ĐỒNG NHẤT ===
            // Core fields - sẽ được fill từ phieuData khi submit
            stt_rec: "",
            stt_rec0: "",
            ma_ct: "",
            ngay_ct: "",
            so_ct: "",
            ma_vt: value, // Mapping từ maHang

            // Thông tin giá và thuế
            gia_nt2: 0,
            gia2: 0,
            thue: 0,
            thue_nt: 0,
            tien2: 0,
            tien_nt2: 0,

            // Thông tin chiết khấu
            tl_ck: 0,
            ck: 0,
            ck_nt: 0,
            tl_ck_khac: 0,
            gia_ck: 0,
            tien_ck_khac: 0,

            // Tài khoản
            tk_gv: "",
            tk_dt: "",
            ma_thue: "",
            thue_suat: 0,
            tk_thue: "",
            tk_ck: "",
            tk_cpbh: "",

            // Số lượng
            sl_td1: 0,
            sl_td2: 0,
            sl_dh: 0,
            sl_giao: 0,
            dh_ln: 0,
            px_ln: 0,

            // Reference fields
            stt_rec_dh: "",
            stt_rec0dh: "",
            stt_rec_px: "",
            stt_rec0px: "",
            dh_so: "",
            px_so: "",

            // Boolean flags
            taoma_yn: 0,
            km_yn: 0,
            px_gia_dd: false,

            // Product info
            ma_sp: "",
            ma_bp: "",
            so_lsx: "",
            ma_vi_tri: "",
            ma_lo: "",
            ma_vv: "",
            ma_nx: "",
            tk_du: "",
            
            // Product name từ API response
            ten_vt: productName,

            // Other financial fields
            gia_nt: 0,
            gia: 0,
            tien_nt: 0,
            tien: 0,
            line_nbr: prev.length + 1,

            // Customer/trade info
            ma_kh2: "",
            ma_td1: "",

            // Datetime fields
            datetime0: "",
            datetime2: "",
            user_id0: "",
            user_id2: "",

            // Năm/kỳ
            nam: 0,
            ky: 0,

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
      message.error("Lỗi khi thêm vật tư: " + error.message);
      return false;
    } finally {
      // Reset processing flag after a delay
      setTimeout(() => {
        isProcessingRef.current = false;
      }, 1000);
    }
  };

  const handleQuantityChange = (value, record, field) => {
    // Xử lý giá trị đầu vào để hỗ trợ số thập phân
    let newValue;

    // Nếu value là chuỗi rỗng, đặt thành 0
    if (value === "") {
      newValue = 0;
    } else if (value === ".") {
      // Nếu chỉ có dấu chấm, giữ nguyên để người dùng tiếp tục xuất
      newValue = value;
    } else if (value.endsWith(".")) {
      // Nếu kết thúc bằng dấu chấm, giữ nguyên chuỗi
      newValue = value;
    } else {
      // Chuyển đổi thành số thập phân
      newValue = parseFloat(value);
      // Nếu parseFloat trả về NaN, đặt thành 0
      if (isNaN(newValue)) {
        newValue = 0;
      }
    }

    setDataSource((prev) =>
      prev.map((item) => {
        if (item.key === record.key) {
          // Nếu newValue là chuỗi (có dấu chấm ở cuối), chỉ cập nhật field
          if (typeof newValue === "string") {
            return {
              ...item,
              [field]: newValue,
            };
          } else {
            // Nếu field là sl_td3, chỉ cập nhật sl_td3 mà không cập nhật sl_td3_goc
            if (field === "sl_td3") {
              return {
                ...item,
                [field]: newValue,
              };
            } else {
              // Xử lý các field khác như cũ
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
    const soLuongDeNghiHienTai = record.soLuongDeNghi || 0;

    let sl_td3_moi;
    let so_luong_moi;
    let soLuongDeNghiMoi;

    if (sl_td3_hienTai === 0) {
      sl_td3_moi = 0;
    } else {
      sl_td3_moi = (sl_td3_hienTai * heSoHienTai) / heSoMoi;
    }

    // Số lượng đề nghị: chuyển đổi theo hệ số từ soLuongDeNghi hiện tại
    soLuongDeNghiMoi = (soLuongDeNghiHienTai * heSoHienTai) / heSoMoi;

    // Số lượng cheat: chuyển đổi theo hệ số từ so_luong hiện tại
    so_luong_moi = (so_luong_hien_tai * heSoHienTai) / heSoMoi;

    const sl_td3_lam_tron = Math.round(sl_td3_moi * 10000) / 10000;
    const so_luong_lam_tron = Math.round(so_luong_moi * 10000) / 10000;
    const soLuongDeNghiLamTron = Math.round(soLuongDeNghiMoi * 10000) / 10000;

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
              soLuongDeNghi: soLuongDeNghiLamTron, // Cập nhật soLuongDeNghi theo logic riêng
              _lastUpdated: Date.now(),
            }
          : { ...item }
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
              _lastUpdated: Date.now(),
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
    handleSelectChange,
  };
};
