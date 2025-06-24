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
          // ===== TRƯỜNG HỢP MERGE VÀO VẬT TƯ ĐÃ CÓ =====
          // Merge vào dòng đầu tiên và xóa các dòng trùng lặp khác
          console.log("🔄 DEBUG MERGE VÀO VẬT TƯ ĐÃ CÓ - START");
          console.log("📦 Existing item:", prev[existingIndex]);
          
          const updatedData = prev.map((item, index) => {
            if (index === existingIndex) {
              // Logic sửa: Thêm đúng theo đơn vị hiện tại
              const dvtHienTai = (item.dvt || "").trim();
              const dvtGoc = (item.dvt_goc || "").trim();
              const heSoGoc = item.he_so_goc ?? 1;
              const heSoHienTai = item.he_so ?? 1;
              
              console.log("🔍 So sánh DVT trong merge:", {
                dvtHienTai,
                dvtGoc,
                heSoGoc,
                heSoHienTai,
                isEqual: dvtHienTai === dvtGoc
              });

              let soLuongThemVao;

              // Nếu đang ở đơn vị gốc (kg): thêm 1 đơn vị gốc (tức là +hệ số gốc)
              if (dvtHienTai.trim() === dvtGoc.trim()) {
                soLuongThemVao = heSoGoc; // VD: +11kg nếu hệ số gốc = 11
                console.log("✅ Đang ở đơn vị gốc, thêm hệ số gốc:", soLuongThemVao);
              } else {
                // Nếu đang ở đơn vị khác (Bộ): thêm 1 đơn vị hiện tại
                soLuongThemVao = 1; // VD: +1 Bộ
                console.log("⚠️ Đang ở đơn vị khác, thêm 1 đơn vị:", soLuongThemVao);
              }

              const soLuongHienTai = item.soLuong || 0;
              const soLuongMoi = soLuongHienTai + soLuongThemVao;
              const soLuongLamTron = Math.round(soLuongMoi * 1000) / 1000;

              // Cập nhật soLuong_goc để đồng bộ - luôn +1 đơn vị gốc
              const soLuongGocMoi = (item.soLuong_goc ?? 0) + 1;
              
              console.log("🧮 Tính toán merge:", {
                soLuongHienTai,
                soLuongThemVao,
                soLuongMoi,
                soLuongLamTron,
                soLuongGocMoi
              });

              const updatedItem = {
                ...item,
                soLuong: soLuongLamTron,
                soLuong_goc: soLuongGocMoi,
                // Giữ nguyên flag isNewlyAdded nếu có
                isNewlyAdded: item.isNewlyAdded,
                // Giữ nguyên tất cả các trường từ API
              };
              
              console.log("🎯 Item sau khi merge:", updatedItem);
              console.log("🔄 DEBUG MERGE VÀO VẬT TƯ ĐÃ CÓ - END\n");
              
              return updatedItem;
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
          // ===== TRƯỜNG HỢP THÊM VẬT TƯ MỚI =====
          // Áp dụng logic tính toán giống như load từ API
          
          console.log("🆕 DEBUG THÊM VẬT TƯ MỚI - START");
          console.log("📦 Thông tin vật tư từ API:", vatTuInfo);
          console.log("📋 Danh sách đơn vị tính:", donViTinhList);

          // ✅ LOGIC ĐÚNG: Lấy đơn vị gốc và hệ số gốc từ API vật tư detail
          const heSoGocFromAPI = parseFloat(vatTuInfo.he_so) || 1;
          const dvtGocFromAPI = vatTuInfo.dvt ? vatTuInfo.dvt.trim() : "cái";
          const defaultDvt = vatTuInfo.dvt ? vatTuInfo.dvt.trim() : "cái";
          
          console.log("🔍 Thông tin từ API vật tư detail:", {
            vatTuInfo_dvt: vatTuInfo.dvt,
            vatTuInfo_he_so: vatTuInfo.he_so,
            dvtGocFromAPI,
            heSoGocFromAPI,
            defaultDvt,
            donViTinhList,
            isEqual: dvtGocFromAPI === defaultDvt
          });
          
          // DVT hiện tại ban đầu = DVT gốc từ API
          const dvtHienTai = dvtGocFromAPI;
          
          // Tính toán số lượng giống logic load từ API
          let soLuongGoc, soLuongHienThi;
          let heSoHienTai = heSoGocFromAPI;

          // So sánh DVT hiện tại với DVT gốc (giống logic load từ API)
          console.log("🔄 So sánh DVT để tính toán số lượng:", {
            dvtHienTai_trim: dvtHienTai.trim(),
            dvtGocFromAPI_trim: dvtGocFromAPI.trim(),
            isEqual: dvtHienTai.trim() === dvtGocFromAPI.trim()
          });
          
          if (dvtHienTai.trim() === dvtGocFromAPI.trim()) {
            // Đang ở đơn vị gốc: Khi thêm mới, số lượng mặc định là 1 đơn vị gốc
            soLuongGoc = 1;
            soLuongHienThi = soLuongGoc * heSoGocFromAPI; // soLuong = soLuong_goc * he_so_goc
            heSoHienTai = heSoGocFromAPI;
            
            console.log("✅ Đang ở đơn vị gốc:", {
              soLuongGoc,
              formula: `${soLuongGoc} * ${heSoGocFromAPI}`,
              soLuongHienThi,
              heSoHienTai
            });
          } else {
            // Đang ở đơn vị khác (trường hợp hiếm khi thêm mới)
            soLuongGoc = 1;
            soLuongHienThi = soLuongGoc; // soLuong = soLuong_goc
            
            // Tìm hệ số của đơn vị hiện tại từ danh sách đơn vị tính
            const dvtHienTaiInfo = donViTinhList.find(
              (dvt) => dvt.dvt.trim() === dvtHienTai.trim()
            );
            heSoHienTai = dvtHienTaiInfo
              ? parseFloat(dvtHienTaiInfo.he_so) || 1
              : 1;
              
            console.log("⚠️ Đang ở đơn vị khác:", {
              soLuongGoc,
              soLuongHienThi,
              dvtHienTaiInfo,
              heSoHienTai
            });
          }

          const newItem = {
            key: prev.length + 1,
            maHang: value,
            soLuong: Math.round(soLuongHienThi * 1000) / 1000,
            soLuong_goc: Math.round(soLuongGoc * 1000) / 1000,
            he_so: heSoHienTai,
            he_so_goc: heSoGocFromAPI, // Lưu hệ số gốc từ API
            ten_mat_hang: vatTuInfo.ten_vt || value,
            dvt: dvtHienTai,
            dvt_goc: dvtGocFromAPI,
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
          
          console.log("🎯 Item mới được tạo:", newItem);
          console.log("🆕 DEBUG THÊM VẬT TƯ MỚI - END\n");
          
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
          if (item.dvt?.trim() === item.dvt_goc?.trim()) {
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
    console.log("🔧 DEBUG handleDvtChange - START");
    console.log("📥 Input:", { newValue, record });
    
    // Kiểm tra record có hợp lệ không
    if (!record || !record.donViTinhList) {
      console.log("❌ Record không hợp lệ:", record);
      message.error("Thông tin vật tư không hợp lệ");
      return;
    }

    // Tìm thông tin đơn vị tính được chọn
    const dvtOptions = record.donViTinhList || [];
    console.log("📋 DVT Options:", dvtOptions);
    
    const selectedDvt = dvtOptions.find(
      (dvt) => dvt && dvt.dvt && dvt.dvt.trim() === newValue.trim()
    );
    console.log("🎯 Selected DVT:", selectedDvt);
    
    const heSoMoi = selectedDvt ? parseFloat(selectedDvt.he_so) || 1 : 1;
    console.log("📊 Hệ số mới:", heSoMoi);

    // ✅ SỬA: Tìm hệ số hiện tại từ donViTinhList thay vì dùng record.he_so
    const currentDvtInList = dvtOptions.find(
      (dvt) => dvt && dvt.dvt && dvt.dvt.trim() === record.dvt?.trim()
    );
    const heSoHienTai = currentDvtInList ? parseFloat(currentDvtInList.he_so) || 1 : (record.he_so || 1);
    const soLuongHienTai = record.soLuong || 0;
    
    console.log("🔢 Dữ liệu hiện tại:", {
      record_he_so_old: record.he_so,
      currentDvtInList,
      heSoHienTai_new: heSoHienTai,
      soLuongHienTai,
      dvt_current: record.dvt,
      dvt_goc: record.dvt_goc,
      soLuong_goc: record.soLuong_goc
    });

    let soLuongMoi;

    // ✅ Sửa logic: Luôn áp dụng công thức chuyển đổi
    // Số lượng có thể bằng 0 nhưng vẫn cần chuyển đổi theo tỷ lệ đơn vị
    soLuongMoi = (soLuongHienTai * heSoHienTai) / heSoMoi;
    
    console.log("🧮 Công thức chuyển đổi:", {
      formula: `(${soLuongHienTai} * ${heSoHienTai}) / ${heSoMoi}`,
      result: soLuongMoi
    });

    // Làm tròn đến 4 chữ số thập phân
    const soLuongLamTron = Math.round(soLuongMoi * 10000) / 10000;
    console.log("🎯 Số lượng sau làm tròn:", soLuongLamTron);

    // Cập nhật soLuong_goc để đồng bộ với đơn vị gốc
    let soLuongGocMoi = record.soLuong_goc;
    
    console.log("🔄 Logic cập nhật soLuong_goc:");
    console.log("So sánh DVT:", {
      newValue_trim: newValue.trim(),
      dvt_goc_trim: record.dvt_goc?.trim(),
      isEqual: newValue.trim() === record.dvt_goc?.trim()
    });
    
    if (newValue.trim() === record.dvt_goc?.trim()) {
      // Nếu chuyển về đơn vị gốc, soLuong_goc = soLuongMoi / he_so_goc
      const he_so_goc = record.he_so_goc || 1;
      soLuongGocMoi = soLuongLamTron / he_so_goc;
      console.log("✅ Chuyển về đơn vị gốc:", {
        formula: `${soLuongLamTron} / ${he_so_goc}`,
        result: soLuongGocMoi
      });
    } else {
      // Nếu chuyển sang đơn vị khác, tính soLuong_goc từ đơn vị hiện tại
      console.log("🔄 So sánh DVT hiện tại với gốc:", {
        dvt_current_trim: record.dvt?.trim(),
        dvt_goc_trim: record.dvt_goc?.trim(),
        isCurrentEqualsRoot: record.dvt?.trim() === record.dvt_goc?.trim()
      });
      
      if (record.dvt?.trim() === record.dvt_goc?.trim()) {
        // Từ đơn vị gốc sang đơn vị khác
        soLuongGocMoi = soLuongHienTai / (record.he_so_goc || 1);
        console.log("⬆️ Từ đơn vị gốc sang đơn vị khác:", {
          formula: `${soLuongHienTai} / ${record.he_so_goc || 1}`,
          result: soLuongGocMoi
        });
      } else {
        // Từ đơn vị khác sang đơn vị khác, giữ nguyên soLuong_goc
        soLuongGocMoi = record.soLuong_goc;
        console.log("↔️ Từ đơn vị khác sang đơn vị khác, giữ nguyên:", soLuongGocMoi);
      }
    }

    const finalResult = {
      dvt: newValue,
      he_so: heSoMoi,
      soLuong: soLuongLamTron,
      soLuong_goc: Math.round((soLuongGocMoi || 0) * 10000) / 10000,
      // ✅ Force re-render bằng cách thêm timestamp
      _lastUpdated: Date.now(),
    };
    
    console.log("🎯 Kết quả cuối cùng:", finalResult);
    console.log("🔧 DEBUG handleDvtChange - END\n");

    setDataSource((prev) => {
      // ✅ Tạo array mới hoàn toàn để force re-render
      const newDataSource = prev.map((item) =>
        item.key === record.key
          ? {
              ...item, // Giữ nguyên tất cả các trường hiện có
              ...finalResult,
            }
          : { ...item } // Clone cả các item khác để đảm bao reference mới
      );
      
      console.log("🔄 DataSource updated:", newDataSource);
      return newDataSource;
    });
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
