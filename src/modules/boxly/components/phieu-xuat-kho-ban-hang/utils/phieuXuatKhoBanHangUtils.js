import { message } from "antd";
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

  const payload = {
    orderDate: orderDate,
    master: {
      stt_rec: phieuData?.stt_rec || "",
      ma_dvcs: userInfo.unitId,
      ma_ct: "HDA",
      loai_ct: values.maGiaoDich || "1",
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
      gia_nt2: parseFloat(item.gia_nt2) || 0,
      gia2: parseFloat(item.gia2) || 0,
      thue: parseFloat(item.thue) || 0,
      thue_nt: parseFloat(item.thue_nt) || 0,
      tien2: parseFloat(item.tien2) || 0,
      tien_nt2: parseFloat(item.tien_nt2) || 0,
      tl_ck: parseFloat(item.tl_ck) || 0,
      ck: parseFloat(item.ck) || 0,
      ck_nt: parseFloat(item.ck_nt) || 0,
      tk_gv: item.tk_gv || "",
      tk_dt: item.tk_dt || "",
      ma_thue: item.ma_thue || "",
      thue_suat: parseFloat(item.thue_suat) || 0,
      tk_thue: item.tk_thue || "",
      tl_ck_khac: parseFloat(item.tl_ck_khac) || 0,
      gia_ck: parseFloat(item.gia_ck) || 0,
      tien_ck_khac: parseFloat(item.tien_ck_khac) || 0,
      sl_td1: parseFloat(item.sl_td1) || 0,
      sl_td2: parseFloat(item.sl_td2) || 0,
      sl_dh: parseFloat(item.sl_dh) || 0,
      stt_rec_dh: item.stt_rec_dh || "",
      stt_rec0dh: item.stt_rec0dh || "",
      stt_rec_px: item.stt_rec_px || "",
      stt_rec0px: item.stt_rec0px || "",
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
