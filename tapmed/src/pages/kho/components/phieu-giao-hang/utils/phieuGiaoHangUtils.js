import { message } from "antd";

export const getUserInfo = () => {
  try {
    const userStr = localStorage.getItem("user");
    const unitsResponseStr = localStorage.getItem("unitsResponse");

    const user = userStr ? JSON.parse(userStr) : {};
    const unitsResponse = unitsResponseStr ? JSON.parse(unitsResponseStr) : {};

    return {
      userId: user.userId || user.id || null,
      userName: user.userName || "",
      unitId: user.unitId || unitsResponse.unitId || "",
      unitName: user.unitName || unitsResponse.unitName || "",
    };
  } catch (error) {
    console.error("Error parsing localStorage:", error);
    return {
      userId: null,
      userName: "",
      unitId: "",
      unitName: "",
    };
  }
};

export const formatDate = (date) => {
  const d = date ? new Date(date) : new Date();
  return d.toISOString().split(".")[0];
};

export const validateDataSource = (dataSource) => {
  if (dataSource.length === 0) {
    message.error("Vui lòng thêm ít nhất một vật tư");
    return { isValid: false };
  }

  const missingData = [];

  dataSource.forEach((item, index) => {
    if (!item.ma_kho) {
      missingData.push(`Dòng ${index + 1}: Chưa chọn mã kho`);
    }
  });

  if (missingData.length > 0) {
    message.error({
      content: (
        <div>
          <div>Vui lòng bổ sung thông tin bắt buộc:</div>
          {missingData.map((msg, idx) => (
            <div key={idx}>• {msg}</div>
          ))}
        </div>
      ),
      duration: 6,
    });
    return { isValid: false };
  }

  return { isValid: true };
};

export const buildPhieuGiaoHangPayload = (formValues, dataSource, mode = "create") => {
  const master = {
    stt_rec: formValues.stt_rec || 0,
    so_ct: formValues.so_ct || "",
    ngay_ct: formValues.ngay_ct || "",
    ma_gd: formValues.ma_gd || "",
    ma_kho: formValues.ma_kho || "",
    ma_kh: formValues.ma_kh || "",
    ten_kh: formValues.ten_kh || "",
    dia_chi: formValues.dia_chi || "",
    so_dien_thoai: formValues.so_dien_thoai || "",
    so_don_hang: formValues.so_don_hang || "",
    ngay_don_hang: formValues.ngay_don_hang || "",
    ten_nha_xe: formValues.ten_nha_xe || "",
    sdt_nha_xe: formValues.sdt_nha_xe || "",
    gio_chay: formValues.gio_chay || "",
    tong_so_kien: formValues.tong_so_kien || 0,
    dien_giai: formValues.dien_giai || "",
    ghi_chu: formValues.ghi_chu || "",
    status: formValues.status || "0",
  };

  const detail = dataSource.map((item, index) => ({
    stt_rec0: item.stt_rec0 || 0,
    stt_rec: item.stt_rec || 0,
    ma_vt: item.ma_vt || "",
    ten_vt: item.ten_vt || "",
    dvt: item.dvt || "",
    so_luong: item.so_luong || 0,
    ma_kho: item.ma_kho || "",
    ma_lo: item.ma_lo || "",
    han_dung: item.han_dung || "",
    ghi_chu: item.ghi_chu || "",
  }));

  return {
    Data: {
      master,
      detail,
    },
  };
};

export const deletePhieuGiaoHangDynamic = async (stt_rec, userInfo) => {
  // API delete đã bị xóa - chỉ giữ lại 4 API mới
  console.warn("API deletePhieuGiaoHang đã bị xóa");
  return { success: false, message: "API đã bị vô hiệu hóa" };
  
  // Code cũ đã bị comment
  /*
  try {
    const { deletePhieuGiaoHang } = await import("./phieuGiaoHangApi");
    return await deletePhieuGiaoHang(stt_rec, userInfo);
  } catch (error) {
    console.error("Error deleting phieu giao hang:", error);
    return { success: false, error: error.message };
  }
  */
};
