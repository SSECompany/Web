import { message } from "antd";
import { useRef, useState } from "react";

export const useVatTuManagerNhapHang = () => {
  const [dataSource, setDataSource] = useState([]);
  const isProcessingRef = useRef(false);
  const lastProcessedValueRef = useRef("");

  const loadDataFromPhieu = (data2, fetchDonViTinh) => {
    if (!Array.isArray(data2) || data2.length === 0) {
      setDataSource([]);
      return;
    }

    const processedData = data2.map((item, index) => {
      const qty = parseFloat(item.sl_td3) || 0;
      return {
        key: index + 1,
        maHang: item.ma_vt || "",
        ten_mat_hang: item.ten_vt || item.ma_vt || "",
        so_luong: qty, // Sync lowercase field
        soLuong: qty,
        soLuong_goc: parseFloat(item.so_luong_goc) || 0,
        soLuongDeNghi: parseFloat(item.so_luong) || 0,
        he_so: parseFloat(item.he_so) || 1,
        he_so_goc: parseFloat(item.he_so_goc) || 1,
        dvt: item.dvt ? item.dvt.trim() : "cái",
        dvt_goc: item.dvt_goc ? item.dvt_goc.trim() : "cái",
        stt_rec0: item.stt_rec0 || "",
        ma_sp: item.ma_sp ? item.ma_sp.trim() : "",
        ma_bp: item.ma_bp ? item.ma_bp.trim() : "",
        so_lsx: item.so_lsx ? item.so_lsx.trim() : "",
        ma_vi_tri: item.ma_vi_tri ? item.ma_vi_tri.trim() : "",
        ma_lo: item.ma_lo ? item.ma_lo.trim() : "",
        ma_vv: item.ma_vv ? item.ma_vv.trim() : "",
        ma_nx: item.ma_nx ? item.ma_nx.trim() : "",
        tk_du: item.tk_du ? item.tk_du.trim() : "",
        gia_nt: parseFloat(item.gia_nt) || 0,
        gia: parseFloat(item.gia) || 0,
        tien_nt: parseFloat(item.tien_nt) || 0,
        tien: parseFloat(item.tien) || 0,
        pn_gia_tb: Boolean(item.pn_gia_tb),
        stt_rec_px: item.stt_rec_px ? item.stt_rec_px.trim() : "",
        stt_rec0px: item.stt_rec0px ? item.stt_rec0px.trim() : "",
        line_nbr: parseInt(item.line_nbr) || 0,
        ma_kho: item.ma_kho ? item.ma_kho.trim() : "",
        tk_vt: item.tk_vt ? item.tk_vt.trim() : "",
        isNewlyAdded: false,
        _lastUpdated: Date.now(),
        donViTinhList: [],
      };
    });

    setDataSource(processedData);

    if (fetchDonViTinh) {
      const uniqueMaHangList = [
        ...new Set(processedData.map((item) => item.maHang).filter(Boolean)),
      ];

      if (uniqueMaHangList.length > 0) {
        Promise.all(
          uniqueMaHangList.map(async (maHang) => {
            try {
              const donViTinhList = await fetchDonViTinh(maHang);
              return { maHang, donViTinhList };
            } catch (error) {
              console.error(`Lỗi tải đơn vị tính cho ${maHang}:`, error);
              return { maHang, donViTinhList: [] };
            }
          })
        ).then((results) => {
          const dvtMap = results.reduce((acc, { maHang, donViTinhList }) => {
            acc[maHang] = donViTinhList;
            return acc;
          }, {});

          setDataSource((prev) =>
            prev.map((item) => ({
              ...item,
              donViTinhList: dvtMap[item.maHang] || [],
            }))
          );
        });
      }
    }
  };

  const handleVatTuSelect = async (
    value,
    isEditMode,
    fetchVatTuDetail,
    fetchDonViTinh,
    setVatTuInput,
    setVatTuList,
    fetchVatTuList,
    vatTuSelectRef,
    searchItem // Passed from PNA Select component
  ) => {
    if (!isEditMode) {
      message.warning("Bạn cần bật chế độ chỉnh sửa");
      return;
    }

    if (!value || !value.trim()) {
      return;
    }

    if (isProcessingRef.current) return;

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
        message.error("Không tìm thấy thông tin vật tư");
        if (setVatTuInput) setTimeout(() => setVatTuInput(""), 2000);
        return;
      }

      const vatTuInfo = Array.isArray(vatTuDetail) ? vatTuDetail[0] : vatTuDetail;

      if (!vatTuInfo) {
        message.error("Thông tin vật tư không hợp lệ");
        if (setVatTuInput) setTimeout(() => setVatTuInput(""), 2000);
        return;
      }

      const donViTinhList = vatTuInfo.dvt ? [
        {
          ma_vt: value.trim(),
          dvt: vatTuInfo.dvt.trim(),
          he_so: parseFloat(vatTuInfo.he_so) || 1,
          ten_vt: vatTuInfo.ten_vt || "",
        }
      ] : [];

      if (donViTinhList.length === 0) {
        console.warn("Vật tư không có đơn vị tính hợp lệ");
      }

      setDataSource((prev) => {
        const existingIndex = prev.findIndex(
          (item) => item.maHang && item.maHang.trim() === value.trim()
        );

        if (existingIndex !== -1) {
          const updatedData = prev.map((item, index) => {
            if (index === existingIndex) {
              const dvtHienTai = (item.dvt || "").trim();
              const dvtGoc = (item.dvt_goc || "").trim();
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

              const soLuongDeNghiHienTai = item.soLuongDeNghi || 0;

              const soLuongGocHienTai =
                item.soLuong_goc !== undefined ? item.soLuong_goc : 0;

              const soLuongGocMoi = soLuongGocHienTai + 1;

              const updatedItem = {
                ...item,
                soLuong: soLuongLamTron,
                soLuongDeNghi: soLuongDeNghiHienTai,
                soLuong_goc: soLuongGocMoi,
                he_so: heSoHienTai,
                he_so_goc: heSoGocFromAPI,
                dvt:
                  dvtHienTai || (vatTuInfo.dvt ? vatTuInfo.dvt.trim() : "cái"),
                dvt_goc: dvtAPI,
                ma_kho: (vatTuInfo.ma_kho || item.ma_kho || "").trim(),
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
          const heSoGocFromAPI = isNaN(parseFloat(vatTuInfo.he_so))
            ? 1
            : parseFloat(vatTuInfo.he_so);
          const dvtGocFromAPI = vatTuInfo.dvt ? vatTuInfo.dvt.trim() : "cái";
          const dvtHienTai = dvtGocFromAPI;

          let soLuongGoc = 1;
          let soLuongDeNghiGoc = 0;
          let soLuongHienThi;
          let soLuongDeNghiHienThi;
          let heSoHienTai;

          if (dvtHienTai.trim() === dvtGocFromAPI.trim()) {
            soLuongHienThi = soLuongGoc * heSoGocFromAPI;
            soLuongDeNghiHienThi = soLuongDeNghiGoc * heSoGocFromAPI;
            heSoHienTai = heSoGocFromAPI;
          } else {
            const dvtHienTaiInfo = donViTinhList.find(
              (dvt) => dvt.dvt.trim() === dvtHienTai.trim()
            );
            heSoHienTai = dvtHienTaiInfo
              ? isNaN(parseFloat(dvtHienTaiInfo.he_so))
                ? 1
                : parseFloat(dvtHienTaiInfo.he_so)
              : 1;

            soLuongHienThi = soLuongGoc * heSoHienTai;
            soLuongDeNghiHienThi = soLuongDeNghiGoc * heSoHienTai;
          }
          const priceNt = parseFloat(vatTuInfo.gia_ban_nt || vatTuInfo.gia_nt2 || 0);
          const price = parseFloat(vatTuInfo.gia_ban || vatTuInfo.gia || priceNt);
          const taxCode = (vatTuInfo.ma_thue || "08").trim();
          const taxRate = parseFloat(vatTuInfo.thue_suat || 0);
          
          const amountNt = Math.round(priceNt * soLuongHienThi * 100) / 100;
          const amount = Math.round(price * soLuongHienThi * 100) / 100;
          const taxNt = Math.round((amountNt * taxRate / 100) * 100) / 100;
          const tax = Math.round((amount * taxRate / 100) * 100) / 100;

          const newItem = {
            key: Date.now() + Math.random(),
            maHang: value,
            so_luong: Math.round(soLuongHienThi * 1000) / 1000,
            soLuong: Math.round(soLuongHienThi * 1000) / 1000,
            soLuong_goc: Math.round(soLuongGoc * 1000) / 1000,
            soLuongDeNghi:
              Math.round(soLuongDeNghiHienThi * 1000) / 1000,
            soLuongDeNghi_goc: Math.round(soLuongDeNghiGoc * 1000) / 1000,
            he_so: heSoHienTai,
            he_so_goc: heSoGocFromAPI,
            ten_mat_hang: 
              vatTuInfo.ten_vt || 
              searchItem?.ten_vt || 
              vatTuInfo.ten_ma_vt || 
              vatTuInfo.ten_mat_hang || 
              searchItem?.label?.split(" - ")[1] || 
              value,
            dvt: dvtHienTai,
            dvt_goc: dvtGocFromAPI,
            tk_vt: vatTuInfo.tk_vt ? vatTuInfo.tk_vt.trim() : "156",
            ma_kho: (vatTuInfo.ma_kho || "").trim() || "KOL-T2",
            donViTinhList: donViTinhList,
            isNewlyAdded: true,
            stt_rec: "",
            ma_ct: "PNA",
            ngay_ct: "",
            so_ct: "",
            ma_vt: value,
            stt_rec0: "",
            ma_sp: "",
            ma_bp: "",
            so_lsx: "",
            ma_vi_tri: "",
            ma_lo: "",
            ma_vv: "",
            ma_nx: "",
            tk_du: "",
            ma_hd: "",
            ma_ku: "",
            ma_phi: "",
            ma_td1: vatTuInfo.ma_td1 || "",
            ma_td2: "",
            ma_td3: Math.round(soLuongHienThi * 1000) / 1000,
            so_pn: "",
            gia_nt0: priceNt,
            gia0: price,
            gia_nt: priceNt,
            gia: price,
            tien_nt: amountNt,
            tien: amount,
            tien_nt0: amountNt,
            tien0: amount,
            tien_hang_nt: amountNt,
            tien_hang: amount,
            ma_thue: taxCode,
            tk_thue: vatTuInfo.tk_thue || "1331",
            thue_suat: taxRate,
            thue_nt: taxNt,
            thue: tax,
            tt_nt: amountNt + taxNt,
            tt: amount + tax,
            pn_gia_tb: false,
            stt_rec_px: "",
            stt_rec0px: "",
            stt_rec_pn: "",
            stt_rec0pn: "",
            tl_ck: 0,
            ck: 0,
            ck_nt: 0,
            tl_ck_khac: 0,
            gia_ck: 0,
            tien_ck_khac: 0,
            tk_gv: "",
            tk_dt: "",
            tk_ck: "",
            tk_cpbh: "",
            sl_dh: 0,
            sl_giao: 0,
            dh_ln: 0,
            px_ln: 0,
            stt_rec_dh: "",
            stt_rec0dh: "",
            dh_so: "",
            px_so: "",
            taoma_yn: 0,
            km_yn: 0,
            px_gia_dd: false,
            ma_kh2: "",
            datetime0: "",
            datetime2: "",
            user_id0: "",
            user_id2: "",
            nam: 0,
            ky: 0,
            _lastUpdated: Date.now(),
          };

          return [...prev, newItem];
        }
      });

      message.success(`Đã thêm vật tư: ${value}`);

      if (setVatTuInput) setVatTuInput("");
      lastProcessedValueRef.current = null;

      if (vatTuSelectRef && vatTuSelectRef.current) {
        setTimeout(() => {
          if (vatTuSelectRef.current) {
            vatTuSelectRef.current.focus();
          }
        }, 300);
      }
    } catch (error) {
      console.error("Lỗi khi thêm vật tư:", error);
      message.error("Có lỗi xảy ra khi thêm vật tư");
    } finally {
      setTimeout(() => {
        isProcessingRef.current = false;
      }, 1000);
    }
  };

  const handleQuantityChange = (value, record, field) => {
    let newValue;

    if (value === "") {
      newValue = 0;
    } else if (value === ".") {
      newValue = value;
    } else if (value.endsWith(".")) {
      newValue = value;
    } else {
      newValue = parseFloat(value);
      if (isNaN(newValue)) {
        newValue = 0;
      }
    }

    setDataSource((prev) =>
      prev.map((item) => {
        if (item.key === record.key) {
          if (typeof newValue === "string") {
            return {
              ...item,
              [field]: newValue,
            };
          } else {
            // Cập nhật cả soLuong và so_luong để đồng bộ
            const updatedItem = {
              ...item,
              [field]: newValue,
            };

            // Nếu thay đổi số lượng, giá, hoặc thuế suất -> tính lại tiền
            const isQtyChange = (field === "soLuong" || field === "so_luong");
            const isPriceChange = (field === "gia_nt" || field === "gia");
            const isTaxChange = (field === "thue_suat");

            if (isQtyChange || isPriceChange || isTaxChange) {
              const qty = parseFloat(isQtyChange ? newValue : (item.so_luong || item.soLuong || 0));
              const priceNt = parseFloat(isPriceChange ? (field === "gia_nt" ? newValue : item.gia_nt) : (item.gia_nt || 0));
              const taxRate = parseFloat(isTaxChange ? newValue : (item.thue_suat || 0));

              if (isQtyChange) {
                updatedItem.soLuong = qty;
                updatedItem.so_luong = qty;
                updatedItem.sl_td3 = qty;
                
                // Tính lại số lượng gốc
                if (item.dvt?.trim() === item.dvt_goc?.trim()) {
                  updatedItem.soLuong_goc = Math.round((qty / (item.he_so_goc ?? 1)) * 1000) / 1000;
                } else {
                  updatedItem.soLuong_goc = qty;
                }
              }

              // Tính lại tiền
              const amountNt = Math.round(priceNt * qty * 100) / 100;
              const amount = amountNt; // Simplified for UI display, payload builder handles actual conversion if needed
              const taxNt = Math.round((amountNt * taxRate / 100) * 100) / 100;
              const tax = taxNt;

              updatedItem.tien_nt = amountNt;
              updatedItem.tien = amount;
              updatedItem.tien_nt0 = amountNt;
              updatedItem.tien0 = amount;
              updatedItem.tien_hang_nt = amountNt;
              updatedItem.tien_hang = amount;
              updatedItem.thue_nt = taxNt;
              updatedItem.thue = tax;
              updatedItem.tt_nt = amountNt + taxNt;
              updatedItem.tt = amount + tax;
            } else if (field === "soLuongDeNghi") {
              updatedItem.so_luong = newValue;
            }
            
            return updatedItem;
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

    const soLuongHienTai = record.soLuong || 0;
    const soLuongDeNghiHienTai = record.soLuongDeNghi || 0;

    let soLuongMoi = (soLuongHienTai * heSoHienTai) / heSoMoi;
    let soLuongDeNghiMoi = (soLuongDeNghiHienTai * heSoHienTai) / heSoMoi;

    const soLuongLamTron = Math.round(soLuongMoi * 10000) / 10000;
    const soLuongDeNghiLamTron =
      Math.round(soLuongDeNghiMoi * 10000) / 10000;

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
      soLuong: soLuongLamTron,
      sl_td3: soLuongLamTron,
      soLuongDeNghi: soLuongDeNghiLamTron,
      so_luong: soLuongDeNghiLamTron,
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

