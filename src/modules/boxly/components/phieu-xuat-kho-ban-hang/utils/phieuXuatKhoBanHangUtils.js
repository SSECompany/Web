import { message } from "antd";
import https from "../../../../../utils/https";

export const getUserInfo = () => {
  try {
    const userStr = localStorage.getItem("user");
    const unitsResponseStr = localStorage.getItem("unitsResponse");

    const user = userStr ? JSON.parse(userStr) : {};
    const unitsResponse = unitsResponseStr ? JSON.parse(unitsResponseStr) : {};

    return {
      userId: user.userId || 4061,
      userName: user.userName || "",
      unitId: user.unitId || unitsResponse.unitId || "VIKOSAN",
      unitName: user.unitName || unitsResponse.unitName || "VIKOSAN",
    };
  } catch (error) {
    console.error("Error parsing localStorage:", error);
    return {
      userId: 4061,
      userName: "",
      unitId: "VIKOSAN",
      unitName: "VIKOSAN",
    };
  }
};

export const formatDate = (date) => {
  const d = date ? new Date(date) : new Date();
  return d.toISOString().split(".")[0];
};

// Helper function để merge dữ liệu response với form values
export const mergeResponseDataWithFormValues = (originalData, formValues) => {
  if (!originalData) return null;
  
  const mergedData = { ...originalData };
  
  // Chỉ cập nhật những field có giá trị từ form
  Object.keys(formValues).forEach(key => {
    if (formValues[key] !== undefined && formValues[key] !== null) {
      // Map form field names to API field names
      switch(key) {
        case 'maGiaoDich':
          mergedData.loai_ct = formValues[key];
          mergedData.ma_gd = formValues[key];
          break;
        case 'soPhieu':
          mergedData.so_ct = formValues[key];
          break;
        case 'maKhach':
          mergedData.ma_kh = formValues[key];
          break;
        case 'dienGiai':
          mergedData.dien_giai = formValues[key];
          break;
        case 'maNVBH':
          mergedData.ma_nvbh = formValues[key];
          break;
        case 'xe':
          mergedData.xe_vc = formValues[key];
          break;
        case 'taiXe':
          mergedData.tai_xe = formValues[key];
          break;
        case 'trangThai':
          mergedData.status = formValues[key];
          break;
        case 'ngay':
          mergedData.ngay_ct = formatDate(formValues[key]);
          break;
        default:
          // Giữ nguyên nếu không có mapping
          break;
      }
    }
  });
  
  return mergedData;
};

// Helper function để merge detail item với form data
export const mergeDetailItemWithFormData = (originalItem, formItem, index, commonData) => {
  if (!originalItem || !originalItem.stt_rec0) {
    // Item mới - tạo structure đầy đủ
    return {
      stt_rec: commonData.stt_rec || "",
      stt_rec0: formItem.stt_rec0 || String(index + 1).padStart(3, "0"),
      ma_ct: "HDA",
      ngay_ct: commonData.ngay_ct,
      so_ct: commonData.so_ct || "",
      ma_vt: formItem.maHang?.trim() || "",
      dvt: formItem.dvt || "cái",
      ma_kho: formItem.ma_kho || "",
      so_luong: parseFloat(formItem.so_luong) || 0,
      sl_td3: parseFloat(formItem.sl_td3) || 0,
      he_so: parseFloat(formItem.he_so) || 1,
      tk_vt: formItem.tk_vt || "",
      gia_nt2: parseFloat(formItem.gia_nt2) || 0,
      gia2: parseFloat(formItem.gia2) || 0,
      thue: parseFloat(formItem.thue) || 0,
      thue_nt: parseFloat(formItem.thue_nt) || 0,
      tien2: parseFloat(formItem.tien2) || 0,
      tien_nt2: parseFloat(formItem.tien_nt2) || 0,
      tl_ck: parseFloat(formItem.tl_ck) || 0,
      ck: parseFloat(formItem.ck) || 0,
      ck_nt: parseFloat(formItem.ck_nt) || 0,
      tk_gv: formItem.tk_gv || "",
      tk_dt: formItem.tk_dt || "",
      ma_thue: formItem.ma_thue || "",
      thue_suat: parseFloat(formItem.thue_suat) || 0,
      tk_thue: formItem.tk_thue || "",
      tl_ck_khac: parseFloat(formItem.tl_ck_khac) || 0,
      gia_ck: parseFloat(formItem.gia_ck) || 0,
      tien_ck_khac: parseFloat(formItem.tien_ck_khac) || 0,
      sl_td1: parseFloat(formItem.sl_td1) || 0,
      sl_td2: parseFloat(formItem.sl_td2) || 0,
      sl_dh: parseFloat(formItem.sl_dh) || 0,
      stt_rec_dh: formItem.stt_rec_dh || "",
      stt_rec0dh: formItem.stt_rec0dh || "",
      stt_rec_px: formItem.stt_rec_px || "",
      stt_rec0px: formItem.stt_rec0px || "",
      taoma_yn: formItem.taoma_yn || 0,
      ma_sp: formItem.ma_sp || "",
      ma_bp: formItem.ma_bp || "",
      so_lsx: formItem.so_lsx || "",
      ma_vi_tri: formItem.ma_vi_tri || "",
      ma_lo: formItem.ma_lo || "",
      ma_vv: formItem.ma_vv || "",
      ma_nx: formItem.ma_nx || "",
      tk_du: formItem.tk_du || "",
      gia_nt: parseFloat(formItem.gia_nt) || 0,
      gia: parseFloat(formItem.gia) || 0,
      tien_nt: parseFloat(formItem.tien_nt) || 0,
      tien: parseFloat(formItem.tien) || 0,
      line_nbr: parseFloat(formItem.line_nbr) || index + 1,
    };
  }
  
  // Item đã tồn tại - giữ nguyên response data, chỉ override các field được sửa
  const mergedItem = { ...originalItem };
  
  // Cập nhật các trường có thể thay đổi
  if (formItem.maHang !== undefined) mergedItem.ma_vt = formItem.maHang?.trim();
  if (formItem.dvt !== undefined) mergedItem.dvt = formItem.dvt;
  if (formItem.so_luong !== undefined) mergedItem.so_luong = parseFloat(formItem.so_luong) || 0;
  if (formItem.sl_td3 !== undefined) mergedItem.sl_td3 = parseFloat(formItem.sl_td3) || 0;
  if (formItem.ma_kho !== undefined) mergedItem.ma_kho = formItem.ma_kho;
  if (formItem.tk_vt !== undefined) mergedItem.tk_vt = formItem.tk_vt;
  
  // Cập nhật thông tin phiếu
  mergedItem.stt_rec = commonData.stt_rec || "";
  mergedItem.ma_ct = "HDA";
  mergedItem.ngay_ct = commonData.ngay_ct;
  mergedItem.so_ct = commonData.so_ct || "";
  
  return mergedItem;
};

// Helper function để format dữ liệu detail từ API response cho việc hiển thị
export const formatDetailDataFromResponse = (apiDetailData) => {
  return apiDetailData.map((item, index) => {
    const sl_td3_hienThi = item.sl_td3 ?? item.so_luong ?? 0;
    const so_luong_hienThi = item.so_luong ?? 0;
    const dvtHienTai = item.dvt?.trim() || "cái";

    return {
      key: index + 1,
      // Mapping để hiển thị trên UI
      maHang: item.ma_vt,
      so_luong: Math.round(so_luong_hienThi * 1000) / 1000,
      sl_td3: sl_td3_hienThi,
      ten_mat_hang: item.ten_vt || item.ma_vt,
      dvt: dvtHienTai,
      tk_vt: item.tk_vt || "",
      ma_kho: item.ma_kho || "",

      // Giữ nguyên TẤT CẢ dữ liệu từ API response để khi gửi lại sẽ y nguyên
      ...item, // Spread toàn bộ dữ liệu gốc

      // Override một số field để tương thích với UI
      line_nbr: item.line_nbr || index + 1,
    };
  });
};

export const validateDataSource = (dataSource) => {
  if (dataSource.length === 0) {
    message.error("Vui lòng thêm ít nhất một vật tư");
    return false;
  }
  return true;
};

export const validateQuantityAndShowConfirm = (dataSource, onConfirm) => {
  // Tìm các dòng có số lượng xuất = 0
  const zeroQuantityItems = [];
  dataSource.forEach((item, index) => {
    const sl_td3 = parseFloat(item.sl_td3 || 0);
    if (sl_td3 === 0) {
      zeroQuantityItems.push({
        index: index + 1,
        name: item.ten_mat_hang || item.maHang,
      });
    }
  });

  return {
    hasZeroQuantity: zeroQuantityItems.length > 0,
    zeroQuantityItems,
    getContentJSX: () => {
      return (
        <div
          style={{ textAlign: "left", lineHeight: "1.5", minWidth: "400px" }}
        >
          <div
            style={{
              marginBottom: "3px",
              fontWeight: "500",
              fontSize: "14px",
            }}
          >
            Có {zeroQuantityItems.length} dòng có số lượng xuất bằng 0:
          </div>
          <div
            style={{
              background: "#f8f9fa",
              padding: "10px",
              borderRadius: "8px",
              border: "1px solid #e9ecef",
              maxHeight: "200px",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "6px",
            }}
          >
            {zeroQuantityItems.map((item, index) => (
              <div
                key={index}
                style={{
                  padding: "8px 12px",
                  background: "#ffffff",
                  borderRadius: "6px",
                  border: "1px solid #dee2e6",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span
                  style={{
                    fontWeight: "600",
                    color: "#dc3545",
                    fontSize: "13px",
                    minWidth: "fit-content",
                  }}
                >
                  Dòng {item.index}:
                </span>
                <span
                  style={{
                    color: "#495057",
                    fontSize: "13px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {item.name}
                </span>
              </div>
            ))}
          </div>
          <div
            style={{
              marginTop: "16px",
              color: "#6c757d",
              fontSize: "13px",
              textAlign: "center",
            }}
          >
            Bạn có chắc chắn muốn tiếp tục không?
          </div>
        </div>
      );
    },
    proceed: () => {
      if (zeroQuantityItems.length > 0) {
        // Import showConfirm ở đầu component và gọi onConfirm khi cần
        onConfirm();
      } else {
        // Không có vấn đề gì, tiếp tục submit
        return true;
      }
    },
  };
};

export const buildPayload = (
  values,
  dataSource,
  phieuData = null,
  isUpdate = false
) => {
  const userInfo = getUserInfo();
  const orderDate = formatDate(values.ngay);

  let masterData = {};
  
  if (isUpdate && phieuData) {
    // Khi update: sử dụng helper function để merge data
    masterData = mergeResponseDataWithFormValues(phieuData, values);
  } else {
    // Khi tạo mới: tạo master data với giá trị mặc định
    masterData = {
      stt_rec: "",
      ma_dvcs: userInfo.unitId || "VIKOSAN",
      ma_ct: "HDA",
      loai_ct: values.maGiaoDich || "1",
      ma_gd: values.maGiaoDich || "1",
      ngay_ct: orderDate,
      so_ct: values.soPhieu || "",
      ma_kh: values.maKhach || "",
      dien_giai: values.dienGiai || "",
      ma_nvbh: values.maNVBH || "",
      xe_vc: values.xe || "",
      tai_xe: values.taiXe || "",
      status: values.trangThai || "0",
    };
  }

  // Xử lý detail data sử dụng helper function
  const commonDetailData = {
    stt_rec: phieuData?.stt_rec || "",
    ngay_ct: orderDate,
    so_ct: values.soPhieu || "",
  };

  const detailData = dataSource.map((item, index) => {
    return mergeDetailItemWithFormData(
      isUpdate ? item : null, // Chỉ pass original data khi update
      item,
      index,
      commonDetailData
    );
  });

  const payload = {
    orderDate: orderDate,
    master: masterData,
    detail: detailData,
  };

  return { Data: payload };
};

export const submitPhieu = async (endpoint, payload, successMessage) => {
  const token = localStorage.getItem("access_token");

  try {
    const response = await https.post(endpoint, payload, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.data && response.data.statusCode === 200) {
      message.success(successMessage);
      return { success: true };
    } else {
      message.error(response.data?.message || "Có lỗi xảy ra");
      return { success: false };
    }
  } catch (error) {
    console.error("Error submitting phieu:", error);
    if (error.response?.data?.message) {
      message.error(error.response.data.message);
    } else {
      message.error("Vui lòng kiểm tra lại thông tin");
    }
    return { success: false };
  }
};

// Dynamic API functions for phieu xuat kho ban hang
export const submitPhieuDynamic = async (payload, successMessage, isUpdate = false) => {
  const token = localStorage.getItem("access_token");
  
  const storeName = isUpdate ? "Api_update_phieu_xuat_kho_ban_hang_voucher" : "Api_create_phieu_xuat_kho_ban_hang_voucher";
  
  const body = {
    store: storeName,
    param: {},
    data: {
      master: [payload.Data.master],
      detail: payload.Data.detail,
    },
  };

  try {
    const response = await https.post("v1/dynamicApi/call-dynamic-api", body, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    // Check new response structure with responseModel
    if (response.data?.responseModel?.isSucceded === true) {
      message.success(response.data.responseModel.message || successMessage);
      return { success: true };
    } else if (response.data && response.data.statusCode === 200) {
      // Fallback for old response structure
      message.success(successMessage);
      return { success: true };
    } else {
      message.error(response.data?.responseModel?.message || response.data?.message || "Có lỗi xảy ra");
      return { success: false };
    }
  } catch (error) {
    console.error("Error submitting phieu:", error);

    if (error.response?.data?.responseModel?.message) {
      message.error(error.response.data.responseModel.message);
    } else if (error.response?.data?.message) {
      message.error(error.response.data.message);
    } else {
      message.error("Vui lòng kiểm tra lại thông tin");
    }
    return { success: false };
  }
};

export const deletePhieuDynamic = async (stt_rec) => {
  const token = localStorage.getItem("access_token");

  const body = {
    store: "api_delete_phieu_xuat_kho_ban_hang_voucher",
    param: {
      stt_rec: stt_rec,
    },
    data: {},
  };

  try {
    const response = await https.post("v1/dynamicApi/call-dynamic-api", body, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    // Check new response structure with responseModel
    if (response.data?.responseModel?.isSucceded === true) {
      message.success(response.data.responseModel.message || "Xóa phiếu xuất kho bán hàng thành công");
      return { success: true };
    } else {
      message.error(response.data?.responseModel?.message || "Xóa phiếu xuất kho bán hàng thất bại");
      return { success: false };
    }
  } catch (error) {
    console.error("Lỗi khi xóa phiếu xuất kho bán hàng:", error);
    if (error.response?.data?.responseModel?.message) {
      message.error(error.response.data.responseModel.message);
    } else if (error.response?.data?.message) {
      message.error(error.response.data.message);
    } else {
      message.error("Có lỗi xảy ra khi xóa phiếu xuất kho bán hàng");
    }
    return { success: false };
  }
};

export const deletePhieu = async (stt_rec) => {
  const token = localStorage.getItem("access_token");

  try {
    const response = await https.post(
      "v1/web/xoa-ct-kho-hang-ban",
      {},
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        params: {
          sctRec: stt_rec,
        },
      }
    );

    if (response.data && response.data.statusCode === 200) {
      message.success("Xóa phiếu thành công");
      return { success: true };
    } else {
      message.error(response.data?.message || "Có lỗi xảy ra khi xóa phiếu");
      return { success: false };
    }
  } catch (error) {
    console.error("Lỗi khi xóa phiếu:", error);
    message.error("Không thể xóa phiếu. Vui lòng thử lại sau.");
    return { success: false };
  }
};
