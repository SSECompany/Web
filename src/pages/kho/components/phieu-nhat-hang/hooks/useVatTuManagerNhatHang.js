import { message } from "antd";
import { computeGroupState } from "../utils/phieuNhatHangUtils";
import { useRef, useState } from "react";
import notificationManager from "../../../../../utils/notificationManager";

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
      const maVt = (item.ma_vt || "").toString().trim();
      return {
        key: index + 1,
        maHang: maVt || "",
        ma_vt: maVt || "",
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
        stt_rec_pn: item.stt_rec_pn ? item.stt_rec_pn.trim() : "",
        line_nbr: parseInt(item.line_nbr) || 0,

        // Thông tin kho và tài khoản
        ma_kho: item.ma_kho ? item.ma_kho.trim() : "",
        tk_vt: item.tk_vt ? item.tk_vt.trim() : "",

        // Thông tin phiếu nhặt hàng
        so_luong_don: parseFloat(item.so_luong_don) || 0,
        nhat: parseFloat(item.nhat) || parseFloat(item.soLuong) || 0,
        ghi_chu: item.ghi_chu ? item.ghi_chu.trim() : "",
        ghi_chu_dh: item.ghi_chu_dh ? item.ghi_chu_dh.trim() : "", // map cho cột Ghi chú KD
        so_luong_ton: parseFloat(item.so_luong_ton) || 0,
        // Ban đầu tong_nhat = 0 (không tự động điền bằng số lượng đơn nữa)
        tong_nhat: parseFloat(item.tong_nhat) || 0,

        // Theo dõi lô: true = bắt buộc mã lô khi có tổng nhặt, false = mã lô tùy chọn
        lo_yn: item.lo_yn === true || item.lo_yn === "1" || item.lo_yn === 1,

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
    vatTuSelectRef,
    maLo = ""
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

    // Allow reprocessing the same value after a delay (tăng lên 3 giây để khớp với QR scan)
    const timeSinceLastProcess =
      Date.now() - (lastProcessedValueRef.current?.timestamp || 0);
    if (
      lastProcessedValueRef.current?.value === value.trim() &&
      timeSinceLastProcess < 3000
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
        // Đảm bảo maLo là string hợp lệ (không phải object)
        let maLoStr = "";
        if (maLo) {
          if (typeof maLo === "string") {
            maLoStr = maLo.trim();
          } else if (typeof maLo === "number") {
            maLoStr = String(maLo).trim();
          } else {
            // Nếu là object hoặc kiểu khác, bỏ qua
            maLoStr = "";
          }
        }
        
        // Logic tìm dòng: ưu tiên dòng chưa có mã lô để cập nhật mã lô
        let existingIndex = -1;
        let shouldUpdateLot = false; // Flag để biết có cần cập nhật mã lô không
        
        if (maLoStr) {
          // Nếu có mã lô từ QR scan:
          // 1. Ưu tiên tìm dòng có cùng mã hàng nhưng chưa có mã lô (để cập nhật mã lô)
          existingIndex = prev.findIndex((item) => {
            const maHangMatch = item.maHang && item.maHang.trim() === value.trim();
            if (!maHangMatch) return false;
            const itemMaLo = (item.ma_lo || "").trim();
            return !itemMaLo; // Tìm dòng chưa có mã lô
          });
          
          if (existingIndex !== -1) {
            shouldUpdateLot = true; // Đánh dấu cần cập nhật mã lô
          } else {
            // 2. Nếu không tìm thấy dòng chưa có mã lô, tìm dòng có cùng mã hàng VÀ cùng mã lô
            existingIndex = prev.findIndex((item) => {
              const maHangMatch = item.maHang && item.maHang.trim() === value.trim();
              if (!maHangMatch) return false;
              const itemMaLo = (item.ma_lo || "").trim();
              return itemMaLo === maLoStr; // Tìm dòng có cùng mã lô
            });
          }
        } else {
          // Nếu không có mã lô từ QR, chỉ tìm dòng có cùng mã hàng và không có mã lô
          existingIndex = prev.findIndex((item) => {
            const maHangMatch = item.maHang && item.maHang.trim() === value.trim();
            if (!maHangMatch) return false;
            const itemMaLo = (item.ma_lo || "").trim();
            return !itemMaLo;
          });
        }

        console.log("🔍 Tìm dòng đã tồn tại:", {
          value,
          maLoStr,
          existingIndex,
          shouldUpdateLot,
          totalItems: prev.length,
          existingItem: existingIndex !== -1 ? prev[existingIndex] : null,
          allItems: prev.map(item => ({
            maHang: item.maHang,
            ma_lo: item.ma_lo,
            soLuong: item.soLuong,
            tong_nhat: item.tong_nhat
          }))
        });

        if (existingIndex !== -1) {
          const updatedData = prev.map((item, index) => {
            if (index === existingIndex) {
              const dvtHienTai = (item.dvt || "").trim();
              const dvtGoc = (item.dvt_goc || "").trim();

              // Luôn lấy hệ số gốc từ API tìm kiếm vật tư (fetchVatTuDetail)
              const heSoGocFromAPI = parseFloat(vatTuInfo.he_so) || 1;
              const heSoHienTai = item.he_so || 1;
              const heSoAPI = heSoGocFromAPI;
              const dvtAPI = vatTuInfo.dvt ? vatTuInfo.dvt.trim() : "cái";
              let soLuongThemVao = 1; // Default value

              if (dvtHienTai.trim() === dvtGoc.trim()) {
                if (dvtAPI.trim() === dvtGoc.trim()) {
                  soLuongThemVao = heSoAPI;
                } else {
                  const dvtAPIInfo = donViTinhList.find(
                    (dvt) => dvt.dvt.trim() === dvtAPI.trim()
                  );
                  if (dvtAPIInfo) {
                    const heSoDVTAPI = isNaN(parseFloat(dvtAPIInfo.he_so))
                      ? 1
                      : parseFloat(dvtAPIInfo.he_so);
                    soLuongThemVao = heSoDVTAPI;
                  } else {
                    // Nếu không tìm thấy trong donViTinhList, dùng heSoAPI
                    soLuongThemVao = heSoAPI;
                  }
                }
              } else {
                if (dvtAPI.trim() === dvtHienTai.trim()) {
                  soLuongThemVao = heSoAPI;
                } else {
                  const soLuongGoc = heSoGocFromAPI / heSoHienTai;
                  soLuongThemVao = isNaN(soLuongGoc) ? 1 : soLuongGoc;
                }
              }

              // Đảm bảo soLuongThemVao luôn là số hợp lệ
              if (isNaN(soLuongThemVao) || soLuongThemVao <= 0) {
                soLuongThemVao = 1;
              }

              const soLuongHienTai =
                item.soLuong !== undefined ? item.soLuong : 0;

              const soLuongMoi = soLuongHienTai + soLuongThemVao;
              const soLuongLamTron = Math.round(soLuongMoi * 1000) / 1000;

              console.log("📊 Cập nhật số lượng:", {
                soLuongHienTai,
                soLuongThemVao,
                soLuongMoi,
                soLuongLamTron,
                heSoAPI,
                dvtAPI,
                dvtHienTai,
                dvtGoc,
                shouldUpdateLot,
                maLoStr
              });

              // Số lượng đề nghị giữ nguyên giá trị hiện tại
              const soLuongDeNghiHienTai = item.soLuongDeNghi || 0;

              const soLuongGocHienTai =
                item.soLuong_goc !== undefined ? item.soLuong_goc : 0;

              const soLuongGocMoi = soLuongGocHienTai + 1; // Tăng thêm 1 cho soLuong_goc

              // Cập nhật tổng nhặt bằng số lượng mới
              const tongNhatMoi = soLuongLamTron;

              const updatedItem = {
                ...item,
                soLuong: soLuongLamTron, // Cập nhật số lượng thực tế (sl_td3) - tăng thêm
                soLuongDeNghi: soLuongDeNghiHienTai, // Giữ nguyên số lượng đề nghị (so_luong)
                soLuong_goc: soLuongGocMoi, // Tăng thêm 1
                tong_nhat: tongNhatMoi, // Cập nhật tổng nhặt bằng số lượng mới
                nhat: tongNhatMoi, // Cập nhật nhặt bằng tổng nhặt

                he_so: heSoHienTai,
                he_so_goc: heSoGocFromAPI,

                dvt:
                  dvtHienTai || (vatTuInfo.dvt ? vatTuInfo.dvt.trim() : "cái"),
                dvt_goc: dvtAPI,

                // Giữ nguyên ma_kho từ item hiện tại (đã lấy từ dòng cha khi thêm)
                ma_kho: item.ma_kho || (vatTuInfo.ma_kho || "").trim(),

                // Cập nhật mã lô nếu cần (khi tìm thấy dòng chưa có mã lô)
                // Nếu không cần cập nhật, giữ nguyên mã lô hiện tại
                ma_lo: shouldUpdateLot ? maLoStr : (item.ma_lo || "").trim(),

                donViTinhList: donViTinhList,
                isNewlyAdded: item.isNewlyAdded,
                _lastUpdated: Date.now(),
                // Cập nhật ảnh vật tư nếu có
                image: vatTuInfo.image || item.image || "",
              };

              return updatedItem;
            }
            return item;
          });

          // Không cần filter nữa vì đã tìm đúng dòng cần cập nhật dựa trên cả mã hàng và mã lô
          // Chỉ cần re-index keys
          const result = updatedData.map((item, index) => ({
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
            // Lưu ảnh vật tư từ API
            image: vatTuInfo.image || "",

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
            // Tự động set mã lô từ QR scan nếu có
            ma_lo: maLoStr,
            // Theo dõi lô: từ API vật tư; true = bắt buộc mã lô, false = tùy chọn
            lo_yn: vatTuInfo.lo_yn === true || vatTuInfo.lo_yn === "1" || vatTuInfo.lo_yn === 1,
            ma_vv: "",
            ma_nx: "",
            tk_du: "",
            
            // Thông tin phiếu nhặt hàng
            so_luong_don: Math.round(soLuongDeNghiHienThi * 1000) / 1000, // Số lượng đơn
            nhat: Math.round(soLuongHienThi * 1000) / 1000, // Nhặt
            ghi_chu: "", // Ghi chú
            ghi_chu_dh: "", // Ghi chú KD (chỉ hiển thị)
            so_luong_ton: 0, // Số lượng tồn
            tong_nhat: 0, // Tổng nhặt - ban đầu = 0, chỉ cập nhật khi tích checkbox Nhặt

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

      // Sử dụng notificationManager để hiển thị message chỉ 1 lần
      notificationManager.showMessageOnce(value, `Đã thêm vật tư: ${value}`);

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
      // Reset processing flag after a delay (tăng lên 3 giây để khớp với QR scan)
      setTimeout(() => {
        isProcessingRef.current = false;
      }, 3000);
    }
  };

  const handleQuantityChange = (value, record, field) => {
    // Xử lý giá trị đầu vào để hỗ trợ số thập phân
    let newValue;

    // Nếu value đã là số (từ checkbox), sử dụng trực tiếp
    if (typeof value === "number") {
      newValue = value;
    }
    // Nếu value là chuỗi rỗng, đặt thành 0
    else if (value === "") {
      newValue = 0;
    } else if (value === ".") {
      // Nếu chỉ có dấu chấm, giữ nguyên để người dùng tiếp tục nhập
      newValue = value;
    } else if (typeof value === "string" && value.endsWith(".")) {
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

    setDataSource((prev) => {
      const next = prev.map((item) => {
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
            } else if (field === "soLuongDeNghi" || field === "so_luong") {
              // Xử lý thay đổi SL đơn: dòng con được sửa; SL đơn dòng con không được vượt SL đơn dòng mẹ
              let finalValue = newValue;
              if (item.isChild && typeof newValue === "number") {
                const parent = prev.find((r) => !r.isChild && r.key === item.parentKey);
                const parentTotal =
                  parent
                    ? parseFloat(
                        parent.soLuongDeNghi_tong ??
                          parent.soLuongDeNghi ??
                          parent.so_luong ??
                          0
                      ) || 0
                    : 0;
                const otherChildren = prev.filter(
                  (r) => r.isChild && r.parentKey === item.parentKey && r.key !== item.key
                );
                const sumOtherChildren = otherChildren.reduce(
                  (s, c) => s + parseFloat(c.soLuongDeNghi ?? c.so_luong ?? 0),
                  0
                );
                const maxAllowed = Math.max(0, parentTotal - 1 - sumOtherChildren);
                if (parentTotal > 0 && newValue > maxAllowed) {
                  finalValue = Math.round(maxAllowed * 1000) / 1000;
                  message.warning(
                    `SL đơn dòng con phải nhỏ hơn SL đơn dòng mẹ ít nhất 1 (tối đa ${maxAllowed}). Đã giới hạn về ${finalValue}.`
                  );
                }
              }
              const updated = {
                ...item,
                [field]: finalValue,
                ...(field === "soLuongDeNghi" ? { so_luong: finalValue } : { soLuongDeNghi: finalValue }),
              };
              return updated;
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
              // SL nhặt không vượt SL đơn (mẹ vs mẹ, con vs con) và SL đơn nhóm — không check tồn khả dụng
              const rowOrderQty =
                parseFloat(item.soLuongDeNghi ?? item.so_luong ?? 0) || 0;
              const groupKey = item.isChild ? item.parentKey : item.key;
              const parent = prev.find((r) => !r.isChild && r.key === groupKey);
              const groupOrderQty =
                parent
                  ? parseFloat(
                      parent.soLuongDeNghi_tong ??
                        parent.soLuongDeNghi ??
                        parent.so_luong ??
                        0
                    ) || 0
                  : 0;
              const otherMembers = prev.filter(
                (r) =>
                  (r.isChild ? r.parentKey : r.key) === groupKey && r.key !== item.key
              );
              const sumOthers = otherMembers.reduce(
                (s, m) => s + parseFloat(m.tong_nhat || 0),
                0
              );
              const limits = [];
              if (rowOrderQty > 0)
                limits.push(rowOrderQty); // SL nhặt ≤ SL đơn của chính dòng đó
              if (groupOrderQty > 0)
                limits.push(Math.max(0, groupOrderQty - sumOthers));
              const maxAllowed =
                limits.length > 0 ? Math.min(...limits) : newValue;
              const cappedValue =
                typeof newValue === "number" &&
                limits.length > 0 &&
                newValue > maxAllowed
                  ? Math.round(maxAllowed * 1000) / 1000
                  : newValue;
              if (
                typeof newValue === "number" &&
                limits.length > 0 &&
                newValue > maxAllowed
              ) {
                const reasons = [];
                if (rowOrderQty > 0 && newValue > rowOrderQty)
                  reasons.push(`SL đơn (${rowOrderQty})`);
                if (
                  groupOrderQty > 0 &&
                  newValue > Math.max(0, groupOrderQty - sumOthers)
                )
                  reasons.push(`SL đơn nhóm (${groupOrderQty})`);
                message.warning(
                  `SL nhặt không được vượt quá ${reasons.join(" và ")}. Đã giới hạn về ${cappedValue}.`
                );
              }
              return {
                ...item,
                [field]: cappedValue,
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
      });

      // Khi sửa SL đơn dòng con: SL đơn dòng mẹ = tổng nhóm - sum(con); reset số lượng nhặt mẹ + tất cả con về 0
      if (
        (field === "soLuongDeNghi" || field === "so_luong") &&
        record.isChild &&
        typeof newValue === "number"
      ) {
        const parentKey = record.parentKey;
        const parentIndex = next.findIndex((r) => r.key === parentKey);
        if (parentIndex >= 0) {
          const parent = next[parentIndex];
          const children = next.filter(
            (r) => r.isChild && r.parentKey === parentKey
          );
          const sumChildren = children.reduce(
            (s, c) => s + parseFloat(c.soLuongDeNghi ?? c.so_luong ?? 0),
            0
          );
          const total =
            parseFloat(
              parent.soLuongDeNghi_tong ??
                parent.soLuongDeNghi ??
                parent.so_luong ??
                0
            ) || 0;
          const parentSoLuongDeNghi =
            Math.round((total - sumChildren) * 1000) / 1000;
          next[parentIndex] = {
            ...parent,
            soLuongDeNghi: parentSoLuongDeNghi,
            so_luong: parentSoLuongDeNghi,
            tong_nhat: 0,
            nhat: 0,
          };
          children.forEach((c) => {
            const idx = next.findIndex((r) => r.key === c.key);
            if (idx >= 0) {
              next[idx] = { ...next[idx], tong_nhat: 0, nhat: 0 };
            }
          });
        }
      }

      // Recompute group validation flags for next data
      const groups = computeGroupState(next);
      const nextWithFlags = next.map((row) => {
        const groupKey = row.isChild ? row.parentKey : row.key;
        const g = groups.get(groupKey);
        const picked = parseFloat(row.tong_nhat || 0) || 0;
        const rowOrderQty =
          parseFloat(row.soLuongDeNghi ?? row.so_luong ?? 0) || 0;
        const rowExceededSlDon =
          rowOrderQty > 0 && picked > rowOrderQty; // SL nhặt > SL đơn của chính dòng
        return {
          ...row,
          groupExceeded: !!g?.exceeded,
          rowExceededSlDon,
        };
      });
      
      return nextWithFlags;
    });
  };

  const handleSelectChange = (value, record, field) => {
    setDataSource((prev) => {
      // Đảm bảo value là string cho các trường ma_lo và ma_vi_tri
      let processedValue = value;
      if (field === "ma_lo" || field === "ma_vi_tri") {
        processedValue = value ? String(value).trim() : "";
      }

      const next = prev.map((item) =>
        item.key === record.key
          ? {
              ...item,
              [field]: processedValue,
              loOptions: item.loOptions || record.loOptions,
              viTriOptions: item.viTriOptions || record.viTriOptions,
            }
          : item
      );
      const groups = computeGroupState(next);
      return next.map((row) => {
        const groupKey = row.isChild ? row.parentKey : row.key;
        const g = groups.get(groupKey);
        return { ...row, groupExceeded: !!g?.exceeded };
      });
    });
  };

  const handleDeleteItem = (index, isEditMode) => {
    if (!isEditMode) {
      message.warning("Bạn cần bật chế độ chỉnh sửa");
      return;
    }

    const itemToDelete = dataSource[index];
    if (!itemToDelete) {
      return;
    }

    // Không cho phép xóa dòng chính (dòng cha)
    if (!itemToDelete.isChild) {
      message.warning("Không thể xóa dòng chính");
      return;
    }

    // Nếu là dòng cha, xóa cả dòng cha và tất cả các dòng con
    // Nếu là dòng con, chỉ xóa dòng con đó
    let newDataSource;
    if (itemToDelete.isChild) {
      // Xóa dòng con
      newDataSource = dataSource.filter((_, i) => i !== index);
    } else {
      // Xóa dòng cha và tất cả các dòng con liên quan
      const parentKey = itemToDelete.key;
      newDataSource = dataSource.filter((item, i) => {
        // Giữ lại nếu không phải dòng cha và không phải dòng con của dòng cha này
        return i !== index && !(item.isChild && item.parentKey === parentKey);
      });
    }

    let reIndexedDataSource = newDataSource.map((item, i) => ({
      ...item,
      key: i + 1,
    }));

    // Sau khi xóa dòng con: cập nhật SL đơn dòng mẹ = soLuongDeNghi_tong - sum(SL đơn các con còn lại)
    reIndexedDataSource = reIndexedDataSource.map((row) => {
      if (row.isChild || row.soLuongDeNghi_tong == null) return row;
      const children = reIndexedDataSource.filter(
        (r) => r.isChild && r.parentKey === row.key
      );
      const sumChildren = children.reduce(
        (s, c) => s + parseFloat(c.soLuongDeNghi ?? c.so_luong ?? 0),
        0
      );
      const total = parseFloat(row.soLuongDeNghi_tong ?? 0) || 0;
      const parentSoLuongDeNghi =
        Math.round((total - sumChildren) * 1000) / 1000;
      return {
        ...row,
        soLuongDeNghi: parentSoLuongDeNghi,
        so_luong: parentSoLuongDeNghi,
      };
    });

    const groups = computeGroupState(reIndexedDataSource);
    const withFlags = reIndexedDataSource.map((row) => {
      const groupKey = row.isChild ? row.parentKey : row.key;
      const g = groups.get(groupKey);
      return { ...row, groupExceeded: !!g?.exceeded };
    });
    setDataSource(withFlags);
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

      // Khi thêm dòng con lần đầu: lưu tổng SL đơn của nhóm vào dòng cha (soLuongDeNghi_tong)
      // và reset số lượng nhặt (tong_nhat, nhat) của dòng mẹ về 0
      const hasOtherChildren = prev.some(
        (r) => r.isChild && r.parentKey === parent.key
      );
      const parentUpdated =
        !hasOtherChildren
          ? {
              ...parent,
              soLuongDeNghi_tong:
                parseFloat(
                  parent.soLuongDeNghi ?? parent.soLuongDeNghi_tong ?? 0
                ) || 0,
              tong_nhat: 0,
              nhat: 0,
            }
          : { ...parent, tong_nhat: 0, nhat: 0 };

      // Dòng con: luôn có ma_vt từ dòng cha để validate trùng (ma_vt + ma_lo)
      const parentMaVt = (parent.maHang || parent.ma_vt || "").toString().trim();

      // Copy tất cả các trường từ dòng cha
      const newChild = {
        ...parent,
        key: 0, // sẽ re-index sau
        
        // Override: dòng con để trống mã hàng và tên (ẩn trên UI)
        maHang: "",
        ten_mat_hang: "",
        // Dòng con luôn có ma_vt = dòng cha (để validate trùng mã lô)
        ma_vt: parentMaVt,
        
        // Override: Chỉ các trường số lượng nhặt hàng về 0
        soLuong: 0,
        soLuong_goc: 0,
        soLuongDeNghi: 0,
        nhat: 0,
        tong_nhat: 0, // Tổng nhặt - về 0 cho dòng con mới
        sl_td3: 0,
        
        // Override: Ghi chú để trống
        ghi_chu: "",
        ghi_chu_dh: "", // Ghi chú KD (chỉ hiển thị)
        
        // Mã lô dòng con để trống, user chọn sau (validate trùng dùng ma_vt + ma_lo)
        ma_lo: "",
        
        // Liên kết cha
        parentKey: parent.key,
        isChild: true,
        _lastUpdated: Date.now(),
      };

      const newData = [
        ...prev.slice(0, parentIndex),
        parentUpdated,
        newChild,
        ...prev.slice(parentIndex + 1),
      ];

      // Re-index keys và line_nbr; cập nhật parentKey của dòng con theo key mới của cha
      const reindexed = newData.map((item, i) => ({
        ...item,
        key: i + 1,
        line_nbr: i + 1,
        ...(item.isChild && item.parentKey === parent.key
          ? { parentKey: parentIndex + 1 }
          : {}),
      }));
      const groups = computeGroupState(reindexed);
      return reindexed.map((row) => {
        const groupKey = row.isChild ? row.parentKey : row.key;
        const g = groups.get(groupKey);
        const picked = parseFloat(row.tong_nhat || 0) || 0;
        const rowOrderQty =
          parseFloat(row.soLuongDeNghi ?? row.so_luong ?? 0) || 0;
        const rowExceededSlDon =
          rowOrderQty > 0 && picked > rowOrderQty;
        return {
          ...row,
          groupExceeded: !!g?.exceeded,
          rowExceededSlDon,
        };
      });
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
