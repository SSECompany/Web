import { message } from "antd";
import dayjs from "dayjs";
import https from "../../../../../utils/https";

export const getUserInfo = () => {
  try {
    const userStr = localStorage.getItem("user");
    const unitsResponseStr = localStorage.getItem("unitsResponse");

    const user = userStr ? JSON.parse(userStr) : {};
    const unitsResponse = unitsResponseStr ? JSON.parse(unitsResponseStr) : {};

    return {
      userId: user.userId,
      userName: user.userName,
      unitId: user.unitId,
      unitName: user.unitName || unitsResponse.unitName,
    };
  } catch (error) {
    console.error("Error parsing localStorage:", error);
    return null;
  }
};

export const formatDate = (date) => {
  const d = date ? new Date(date) : new Date();
  return d.toISOString().split(".")[0];
};

export const validateDataSource = (dataSource) => {
  if (!dataSource || !Array.isArray(dataSource) || dataSource.length === 0) {
    message.error("Vui lòng thêm ít nhất một vật tư");
    return false;
  }
  // Validate số lượng cho từng vật tư, gom lỗi dạng danh sách
  const missingData = [];
  dataSource.forEach((item, index) => {
    const soLuongDeNghi = parseFloat(
      item.soLuongDeNghi ?? item.so_luong ?? item.sl_td3 ?? 0
    );
    const soLuongCheat = parseFloat(item.sl_td3 ?? 0);
    if (soLuongDeNghi <= 0) {
      missingData.push(`Dòng ${index + 1}: Số lượng đề nghị phải lớn hơn 0`);
    }
    if (soLuongCheat <= 0) {
      missingData.push(`Dòng ${index + 1}: Số lượng cheat phải lớn hơn 0`);
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

  if (!userInfo) {
    message.error("Không thể lấy thông tin người dùng");
    return null;
  }

  // Format ngày theo yyyy-MM-dd
  const formatDate = (date) => {
    if (!date) return "";
    if (typeof date === "string" && date.length === 10 && date.includes("-"))
      return date;
    return dayjs(date).format("YYYY-MM-DD");
  };

  const orderDate = formatDate(values.ngay_ct || values.ngay);

  // MASTER
  const master = {
    stt_rec: phieuData?.stt_rec || "",
    ma_dvcs: userInfo.unitId?.toLowerCase() || "vikosan",
    ma_ct: "PXB",
    loai_ct: values.ma_gd || values.maGiaoDich || "2",
    so_lo: "",
    ngay_lo: "",
    ma_nk: "",
    ma_gd: values.ma_gd || values.maGiaoDich || "2",
    ngay_ct: orderDate,
    so_ct: values.so_ct || values.soPhieu || "",
    ma_kho: values.ma_kho || values.maKhoXuat || "",
    ma_khon: values.ma_khon || values.maKhoNhap || "",
    status: values.status || values.trangThai || "1",
  };

  // DETAIL
  const detail = dataSource.map((item, index) => ({
    stt_rec: phieuData?.stt_rec || "",
    stt_rec0: "",
    ma_ct: "PXB",
    ngay_ct: orderDate,
    so_ct: values.so_ct || values.soPhieu || "",
    ma_vt: item.maHang?.trim() || "",
    dvt: item.dvt || "Cái",
    so_luong:
      parseFloat(item.soLuongDeNghi ?? item.so_luong ?? item.sl_td3) || 0,
    sl_td3: parseFloat(item.sl_td3) || 0,
    gia_nt: 0,
    gia: 0,
    tien_nt: 0,
    tien: 0,
    ma_nx: "",
    tk_du: "",
    tk_vt: "",
  }));

  // FINAL PAYLOAD
  return {
    store: isUpdate
      ? "Api_update_phieu_xuat_dieu_chuyen_voucher"
      : "Api_create_phieu_xuat_dieu_chuyen_voucher",
    param: {},
    data: {
      master: [master],
      detail: detail,
    },
  };
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
      "v1/web/xoa-ct-xuat-dieu-chuyen",
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
