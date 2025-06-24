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
   

        prev.forEach((item, index) => {
    
        });

        const existingIndex = prev.findIndex(
          (item) => item.maHang.trim() === value.trim()
        );

        if (existingIndex !== -1) {
  
          const updatedData = prev.map((item, index) => {
            if (index === existingIndex) {
              const dvtHienTai = (item.dvt || "").trim();
              const dvtGoc = (item.dvt_goc || "").trim();
              const heSoGoc = item.he_so_goc ?? 1;
              
          
              let soLuongThemVao;

              if (dvtHienTai.trim() === dvtGoc.trim()) {
                soLuongThemVao = heSoGoc; 
              } else {
                soLuongThemVao = 1; 
              }

              const soLuongHienTai = item.soLuong || 0;
              const soLuongMoi = soLuongHienTai + soLuongThemVao;
              const soLuongLamTron = Math.round(soLuongMoi * 1000) / 1000;

              const soLuongGocMoi = (item.soLuong_goc ?? 0) + 1;
              
              const updatedItem = {
                ...item,
                soLuong: soLuongLamTron,
                soLuong_goc: soLuongGocMoi,
                isNewlyAdded: item.isNewlyAdded,
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
   
          
   
          const heSoGocFromAPI = parseFloat(vatTuInfo.he_so) || 1;
          const dvtGocFromAPI = vatTuInfo.dvt ? vatTuInfo.dvt.trim() : "cái";
          
      
          
          const dvtHienTai = dvtGocFromAPI;
          
          let soLuongGoc, soLuongHienThi;
          let heSoHienTai = heSoGocFromAPI;

      
          if (dvtHienTai.trim() === dvtGocFromAPI.trim()) {
            soLuongGoc = 1;
            soLuongHienThi = soLuongGoc * heSoGocFromAPI; 
            heSoHienTai = heSoGocFromAPI;
            
         
          } else {
            soLuongGoc = 1;
            soLuongHienThi = soLuongGoc; 
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
            soLuong: Math.round(soLuongHienThi * 1000) / 1000,
            soLuong_goc: Math.round(soLuongGoc * 1000) / 1000,
            he_so: heSoHienTai,
            he_so_goc: heSoGocFromAPI, 
            ten_mat_hang: vatTuInfo.ten_vt || value,
            dvt: dvtHienTai,
            dvt_goc: dvtGocFromAPI,
            tk_vt: vatTuInfo.tk_vt ? vatTuInfo.tk_vt.trim() : "",
            ma_kho: "",
            donViTinhList: donViTinhList,
            isNewlyAdded: true, 
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
    const heSoHienTai = currentDvtInList ? parseFloat(currentDvtInList.he_so) || 1 : (record.he_so || 1);
    const soLuongHienTai = record.soLuong || 0;
    
    

    let soLuongMoi;

    soLuongMoi = (soLuongHienTai * heSoHienTai) / heSoMoi;
    
 

    const soLuongLamTron = Math.round(soLuongMoi * 10000) / 10000;

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
    handleVatTuSelect,
    handleQuantityChange,
    handleSelectChange,
    handleDeleteItem,
    handleDvtChange,
  };
};
