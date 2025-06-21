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
  return d.toISOString().split(".")[0]; // Bỏ milliseconds và Z
};

export const validateDataSource = (dataSource) => {
  if (dataSource.length === 0) {
    message.error("Vui lòng thêm ít nhất một vật tư");
    return false;
  }
  return true;
};

export const buildPayload = (
  values,
  dataSource,
  phieuData = null,
  isUpdate = false
) => {
  const userInfo = getUserInfo();
  const orderDate = formatDate(values.ngay);

  const payload = {
    orderDate: orderDate,
    master: {
      stt_rec: phieuData?.stt_rec || "",
      ma_dvcs: userInfo.unitId,
      ma_ct: "HDA",
      loai_ct: "2",
      so_lo: "",
      ngay_lo: null,
      ma_nk: "",
      ma_gd: values.maGiaoDich || "1",
      ngay_ct: orderDate,
      so_ct: values.soPhieu || "",
      ma_kh: values.maKhach || "",
      dien_giai: values.dienGiai || "",
      ma_nvbh: values.maNVBH || "",
      xe_vc: values.xe || "",
      tai_xe: values.taiXe || "",
      status: values.trangThai || (isUpdate ? "3" : "0"),
    },
    detail: dataSource.map((item, index) => ({
      stt_rec: phieuData?.stt_rec || "",
      stt_rec0: String(index + 1).padStart(3, "0"),
      ma_ct: "HDA",
      ngay_ct: orderDate,
      so_ct: values.soPhieu || "",
      ma_vt: item.maHang?.trim() || "",
      dvt: item.dvt || "cái",
      ma_kho: item.ma_kho || "",
      so_luong: parseFloat(item.so_luong) || 0,
      sl_td3: parseFloat(item.sl_td3) || 0,
      he_so: parseFloat(item.he_so) || 1,
      tk_vt: item.tk_vt || "",
    })),
  };

  return isUpdate ? { Data: payload } : { Data: payload };
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
