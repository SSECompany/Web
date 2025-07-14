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
    const soLuong = parseFloat(item.soLuong || 0);
    if (soLuong <= 0) {
      missingData.push(`Dòng ${index + 1}: Số lượng phải lớn hơn 0`);
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

export const buildPhieuNhapKhoPayload = (
  values,
  dataSource,
  phieuData = null,
  isUpdate = false
) => {
  const userInfo = getUserInfo();
  const orderDate = formatDate(values.ngay);
  const totalQuantity = dataSource.reduce(
    (sum, item) => sum + parseFloat(item.soLuong || 0),
    0
  );

  const payload = {
    orderDate: orderDate,
    master: {
      stt_rec: phieuData?.stt_rec || "",
      ma_dvcs: userInfo.unitId,
      ma_ct: "PND",
      loai_ct: "2",
      so_lo: "",
      ngay_lo: null,
      ma_nk: "",
      ma_gd: values.maGiaoDich || "",
      ngay_lct: orderDate,
      ngay_ct: orderDate,
      so_ct: values.soPhieu || "",
      ma_nt: values.donViTienTe || "VND",
      ty_gia: parseFloat(values.tyGia || 1),
      ong_ba: values.maKhach || "",
      ma_kh: values.maKhach || "",
      dien_giai: values.dienGiai || "",
      t_so_luong: totalQuantity,
      t_tien_nt: 0.0,
      t_tien: 0.0,
      nam: new Date(orderDate).getFullYear(),
      ky: new Date(orderDate).getMonth() + 1,
      status: values.trangThai || "3",
      datetime0: orderDate,
      datetime2: orderDate,
      user_id0: userInfo.userId,
      user_id2: userInfo.userId,
    },
    detail: dataSource.map((item, index) => ({
      stt_rec: phieuData?.stt_rec || "",
      stt_rec0:
        isUpdate && item.stt_rec0
          ? item.stt_rec0
          : String(index + 1).padStart(3, "0"),
      ma_ct: "PND",
      ngay_ct: orderDate,
      so_ct: values.soPhieu || "",
      ma_vt: item.maHang.trim(),
      ma_sp: item.ma_sp || "",
      ma_bp: item.ma_bp || "",
      so_lsx: item.so_lsx || "",
      dvt: item.dvt,
      he_so: parseFloat(item.he_so || 1),
      ma_kho: item.ma_kho || "",
      ma_vi_tri: item.ma_vi_tri || "",
      ma_lo: item.ma_lo || "",
      ma_vv: item.ma_vv || "",
      ma_nx: item.ma_nx || "",
      tk_du: item.tk_du || "",
      tk_vt: item.tk_vt || "",
      so_luong: parseFloat(item.soLuongDeNghi || 0), // so_luong từ soLuongDeNghi
      sl_td3: parseFloat(item.soLuong || 0), // sl_td3 từ soLuong
      gia_nt: parseFloat(item.gia_nt || 0),
      gia: parseFloat(item.gia || 0),
      tien_nt: parseFloat(item.tien_nt || 0),
      tien: parseFloat(item.tien || 0),
      pn_gia_tb: item.pn_gia_tb !== undefined ? item.pn_gia_tb : false,
      stt_rec_px: item.stt_rec_px || "",
      stt_rec0px: item.stt_rec0px || "",
      line_nbr: parseFloat(item.line_nbr || index + 1),
    })),
  };

  return payload;
};

export const submitPhieuNhapKho = async (endpoint, payload, successMessage) => {
  const token = localStorage.getItem("access_token");

  try {
    const response = await https.post(
      endpoint,
      { Data: payload },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (
      response.data &&
      (response.data.statusCode === 200 ||
        response.data.statusCode === "200" ||
        response.status === 200 ||
        response.data.success === true ||
        (response.data.message && response.data.message.includes("thành công")))
    ) {
      message.success(successMessage);
      return { success: true };
    } else {
      message.error(response.data?.message || "Có lỗi xảy ra");
      return { success: false };
    }
  } catch (error) {
    console.error("Error submitting phieu nhap kho:", error);

    if (error.response?.data?.message) {
      message.error(error.response.data.message);
    } else {
      message.error("Vui lòng kiểm tra lại thông tin");
    }
    return { success: false };
  }
};

export const deletePhieuNhapKho = async (sctRec) => {
  const token = localStorage.getItem("access_token");

  try {
    const response = await https.post(
      `v1/web/xoa-ct-nhap-kho?sctRec=${sctRec}`,
      {},
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.data && response.data.statusCode === 200) {
      message.success("Xóa phiếu nhập kho thành công");
      return { success: true };
    } else {
      message.error(response.data?.message || "Xóa phiếu nhập kho thất bại");
      return { success: false };
    }
  } catch (error) {
    console.error("Lỗi khi xóa phiếu nhập kho:", error);
    if (error.response?.data?.message) {
      message.error(error.response.data.message);
    } else {
      message.error("Có lỗi xảy ra khi xóa phiếu nhập kho");
    }
    return { success: false };
  }
};

export const fetchVoucherInfo = async () => {
  const token = localStorage.getItem("access_token");

  try {
    const response = await https.get(
      "v1/web/thong-tin-phieu-nhap",
      { voucherCode: "PND" },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.data && response.data.data && response.data.data.length > 0) {
      return response.data.data[0];
    }
    return null;
  } catch (error) {
    console.error("Error fetching voucher info:", error);
    message.error("Không thể tải thông tin phiếu nhập");
    return null;
  }
};
