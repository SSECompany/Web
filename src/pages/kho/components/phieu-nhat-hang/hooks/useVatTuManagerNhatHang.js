import { message } from "antd";
import { useRef, useState } from "react";

export const useVatTuManagerNhatHang = () => {
  const [dataSource, setDataSource] = useState([]);
  const isProcessingRef = useRef(false);
  const lastProcessedValueRef = useRef("");

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

        // Thông tin phiếu nhặt hàng
        so_luong_don: parseFloat(item.so_luong_don) || 0,
        nhat: parseFloat(item.nhat) || parseFloat(item.soLuong) || 0,
        ghi_chu: item.ghi_chu ? item.ghi_chu.trim() : "",
        so_luong_ton: parseFloat(item.so_luong_ton) || 0,
        tong_nhat: parseFloat(item.tong_nhat) || parseFloat(item.soLuong) || 0,

        // Đánh dấu không phải là item mới thêm
        isNewlyAdded: false,
        _lastUpdated: Date.now(),

        // Sẽ được load async
        donViTinhList: [],
      };
    });

    setDataSource(processedData);

    // Smart batch prefetch ĐVT - chỉ fetch unique maHang
    if (fetchDonViTinh) {
      const uniqueMaHangList = [
        ...new Set(processedData.map((item) => item.maHang).filter(Boolean)),
      ];

      if (uniqueMaHangList.length > 0) {
        // Batch parallel fetch cho tất cả unique maHang
        Promise.all(
          uniqueMaHangList.map(async (maHang) => {
            try {
              const donViTinhList = await fetchDonViTinh(maHang);
              return { maHang, donViTinhList };
            } catch (error) {
              console.error(`Error loading don vi tinh for ${maHang}:`, error);
              return { maHang, donViTinhList: [] };
            }
          })
        ).then((results) => {
          // Single setState - populate tất cả records cùng lúc
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
        message.error("Không tìm thấy thông tin vật tư");
        if (setVatTuInput) setTimeout(() => setVatTuInput(""), 2000);
        return;
      }

      const vatTuInfo = Array.isArray(vatTuDetail)
        ? vatTuDetail[0]
        : vatTuDetail;

      if (!vatTuInfo) {
        message.error("Thông tin vật tư không hợp lệ");
        if (setVatTuInput) setTimeout(() => setVatTuInput(""), 2000);
        return;
      }

      // Bỏ API danh-sach-dv, sử dụng đơn vị tính từ vatTuInfo
      const donViTinhList = vatTuInfo.dvt 
        ? [{ dvt: vatTuInfo.dvt.trim(), he_so: parseFloat(vatTuInfo.he_so) || 1 }]
        : [];

      setDataSource((prev) => {
        const existingIndex = prev.findIndex(
          (item) => item.maHang && item.maHang.trim() === value.trim()
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

                // Giữ nguyên ma_kho từ item hiện tại (đã lấy từ dòng cha khi thêm)
                ma_kho: item.ma_kho || (vatTuInfo.ma_kho || "").trim(),

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

          // Lấy ma_vi_tri và ma_kho từ dòng cha (item đầu tiên) nếu có
          const parentRow = prev.length > 0 ? prev[0] : null;
          const parentMaViTri = parentRow?.ma_vi_tri || "";
          const parentMaKho = parentRow?.ma_kho || (vatTuInfo.ma_kho || "").trim();

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
            // Lấy ma_kho từ dòng cha, không hiển thị trong UI
            ma_kho: parentMaKho,
            donViTinhList: donViTinhList,
            isNewlyAdded: true,

            // === DYNAMIC: THÊM TẤT CẢ TRƯỜNG API ĐỂ ĐỒNG NHẤT ===
            // Core fields - sẽ được fill từ phieuData khi submit
            stt_rec: "",
            ma_ct: "",
            ngay_ct: "",
            so_ct: "",
            ma_vt: value, // Mapping từ maHang

            // Thông tin nhập kho đặc thù
            stt_rec0: "",
            ma_sp: "",
            ma_bp: "",
            so_lsx: "",
            // Lấy ma_vi_tri từ dòng cha
            ma_vi_tri: parentMaViTri,
            ma_lo: "",
            ma_vv: "",
            ma_nx: "",
            tk_du: "",
            
            // Thông tin phiếu nhặt hàng
            so_luong_don: Math.round(soLuongDeNghiHienThi * 1000) / 1000, // Số lượng đơn
            nhat: Math.round(soLuongHienThi * 1000) / 1000, // Nhặt
            ghi_chu: "", // Ghi chú
            so_luong_ton: 0, // Số lượng tồn
            tong_nhat: Math.round(soLuongHienThi * 1000) / 1000, // Tổng nhặt

            // Additional fields từ payload thực tế
            ma_hd: "",
            ma_ku: "",
            ma_phi: "",
            ma_td2: "",
            ma_td3: "",
            so_pn: "",

            // Thông tin giá
            gia_nt: 0,
            gia: 0,
            tien_nt: 0,
            tien: 0,
            pn_gia_tb: false,

            // Thông tin liên kết phiếu xuất
            stt_rec_px: "",
            stt_rec0px: "",

            // Thông tin liên kết phiếu nhập (từ payload thực tế)
            stt_rec_pn: "",
            stt_rec0pn: "",

            // Các trường số lượng API
            sl_td1: 0,
            sl_td2: 0,
            sl_td3: Math.round(soLuongHienThi * 1000) / 1000,
            so_luong: Math.round(soLuongDeNghiHienThi * 1000) / 1000,

            // Trường line number và các trường khác
            line_nbr: prev.length + 1,

            // Các trường thuế và chiết khấu (cho consistency)
            thue_suat: 0,
            ma_thue: "",
            tk_thue: "",
            tl_ck: 0,
            ck: 0,
            ck_nt: 0,
            tl_ck_khac: 0,
            gia_ck: 0,
            tien_ck_khac: 0,

            // Các trường tài khoản bổ sung
            tk_gv: "",
            tk_dt: "",
            tk_ck: "",
            tk_cpbh: "",

            // Đơn hàng liên quan
            sl_dh: 0,
            sl_giao: 0,
            dh_ln: 0,
            px_ln: 0,
            stt_rec_dh: "",
            stt_rec0dh: "",
            dh_so: "",
            px_so: "",

            // Boolean flags
            taoma_yn: 0,
            km_yn: 0,
            px_gia_dd: false,

            // Customer/partner info
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
    } catch (error) {
      console.error("Error adding vat tu:", error);
      message.error("Có lỗi xảy ra khi thêm vật tư");
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
      // Nếu chỉ có dấu chấm, giữ nguyên để người dùng tiếp tục nhập
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
            // Nếu newValue là số, tính toán bình thường
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
            } else if (field === "so_luong_don") {
              // Xử lý thay đổi số lượng đơn
              return {
                ...item,
                [field]: newValue,
              };
            } else if (field === "nhat") {
              // Xử lý thay đổi nhặt - cập nhật cả tổng nhặt
              return {
                ...item,
                [field]: newValue,
                tong_nhat: newValue, // Cập nhật tổng nhặt bằng số lượng nhặt
              };
            } else if (field === "tong_nhat") {
              // Xử lý thay đổi tổng nhặt
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
              // Preserve loOptions and viTriOptions when updating other fields
              loOptions: item.loOptions || record.loOptions,
              viTriOptions: item.viTriOptions || record.viTriOptions,
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

  const handleAddItem = (parentIndex, parentRecord) => {
    setDataSource((prev) => {
      if (
        parentIndex === undefined ||
        parentIndex < 0 ||
        parentIndex >= prev.length
      ) {
        return prev;
      }

      const parent = parentRecord || prev[parentIndex];

      // Copy tất cả các trường từ dòng cha
      const newChild = {
        ...parent,
        key: 0, // sẽ re-index sau
        
        // Override: dòng con để trống mã hàng và tên (ẩn trên UI)
        // Nhưng giữ nguyên ma_vt, ten_vt từ parent để có trong payload
        maHang: "",
        ten_mat_hang: "",
        // ma_vt giữ nguyên từ parent (đã được copy từ {...parent})
        
        // Override: Chỉ các trường số lượng nhặt hàng về 0
        soLuong: 0,
        soLuong_goc: 0,
        soLuongDeNghi: 0,
        nhat: 0,
        tong_nhat: 0, // Tổng nhặt - về 0 cho dòng con mới
        // so_luong và so_luong_ton giữ nguyên từ parent (đã được copy từ {...parent})
        // so_luong: giữ nguyên từ parent
        // so_luong_ton: giữ nguyên từ parent
        sl_td3: 0,
        // so_luong_don: sẽ bị xóa khỏi payload (thêm vào uiOnlyFields)
        
        // Override: Ghi chú để trống
        ghi_chu: "",
        
        // Override: Mã lô để trống (dòng con không cần theo dòng cha)
        ma_lo: "",
        
        // Liên kết cha
        parentKey: parent.key,
        isChild: true,
        _lastUpdated: Date.now(),
      };

      const newData = [
        ...prev.slice(0, parentIndex + 1),
        newChild,
        ...prev.slice(parentIndex + 1),
      ];

      // Re-index keys và line_nbr nếu có
      return newData.map((item, i) => ({
        ...item,
        key: i + 1,
        line_nbr: i + 1,
      }));
    });
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
    handleAddItem,
    handleDvtChange,
  };
};
