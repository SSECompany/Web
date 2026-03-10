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
      unitId: user.unitId || unitsResponse.unitId || "VIKOSAN",
      unitName: user.unitName || unitsResponse.unitName || "VIKOSAN",
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
  // Validate mã kho cho từng vật tư, gom lỗi dạng danh sách
  const missingData = [];
  dataSource.forEach((item, index) => {
    if (!item.ma_kho || !item.ma_kho.trim()) {
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
  // Chỉ giữ lại những trường thực sự có trong data từ API response
  // Không gắn mặc định bất kỳ trường nào

  // MASTER - Chỉ override vài trường theo UI, giữ nguyên tất cả trường từ API
  const master = {
    // Giữ nguyên tất cả trường từ API response (khi update)
    ...(phieuData || {}),

    // Chỉ override các trường cần thiết từ form
    ma_gd: values.ma_gd || values.maGiaoDich || "2",
    ngay_ct: orderDate,
    so_ct: values.so_ct || values.soPhieu || "",
    ma_kh: values.ma_kh || values.maKhach || "",
    status: values.status || values.trangThai || "1",
  };

  // Đảm bảo các trường bắt buộc có mặt khi thêm mới
  if (!isUpdate) {
    // Các trường bắt buộc cho phiếu xuất kho
    if (!master.stt_rec) {
      master.stt_rec = ""; // Sẽ được tạo tự động bởi server
    }
    if (!master.ma_dvcs) {
      master.ma_dvcs = userInfo.ma_dvcs || "";
    }
    if (!master.ma_ct) {
      master.ma_ct = "PXA";
    }
    if (!master.loai_ct) {
      master.loai_ct = "2";
    }
    if (!master.so_lo) {
      master.so_lo = "";
    }
    if (!master.ngay_lo) {
      master.ngay_lo = null;
    }
    if (!master.ma_nk) {
      master.ma_nk = "";
    }
  }

  // Clean up UI-only fields từ master trước khi gửi API
  const uiOnlyMasterFields = [
    "ngay",
    "soPhieu",
    "maKhach",
    "trangThai",
    "maGiaoDich",
  ];

  uiOnlyMasterFields.forEach((field) => {
    if (field in master) {
      delete master[field];
    }
  });

  // Xử lý tự động các loại trường master - chỉ xử lý những trường thực sự có
  Object.keys(master).forEach((key) => {
    const value = master[key];

    // Các trường số - parse float (chỉ nếu có giá trị và là số)
    if (
      typeof value === "number" ||
      (!isNaN(parseFloat(value)) && value !== null && value !== undefined)
    ) {
      master[key] = parseFloat(value || 0);
    }

    // Các trường string - đảm bảo không null/undefined (chỉ nếu có giá trị)
    if (typeof value === "string") {
      master[key] = value.trim();
    } else if (value === null || value === undefined) {
      // Chỉ set empty string cho những trường string đã được định nghĩa
      if (
        [
          "stt_rec",
          "ma_dvcs",
          "ma_ct",
          "loai_ct",
          "so_lo",
          "ngay_lo",
          "ma_nk",
          "ma_gd",
          "ngay_lct",
          "ngay_ct",
          "so_ct",
          "ma_nt",
          "ong_ba",
          "ma_kh",
          "dien_giai",
          "status",
          "datetime0",
          "datetime2",
          "user_id0",
          "user_id2",
        ].includes(key)
      ) {
        master[key] = "";
      }
    }
  });

  // DETAIL - DYNAMIC: Tự động lấy TẤT CẢ trường từ API response
  const detail = dataSource.map((item, index) => {
    const dynamicItem = { ...item }; // Giữ nguyên tất cả trường từ API

    // Chỉ override các trường cần thiết từ form
    dynamicItem.ngay_ct = orderDate;
    dynamicItem.so_ct = values.so_ct || values.soPhieu || "";

    // Mapping từ UI fields sang API fields
    if (item.maHang) dynamicItem.ma_vt = item.maHang.trim();
    if (item.soLuongDeNghi !== undefined)
      dynamicItem.so_luong = parseFloat(item.soLuongDeNghi || 0);
    if (item.sl_td3 !== undefined)
      dynamicItem.sl_td3 = parseFloat(item.sl_td3 || 0);

    // Đảm bảo các trường bắt buộc có mặt (chỉ nếu không có trong API response)
    if (!dynamicItem.stt_rec && phieuData?.stt_rec) {
      dynamicItem.stt_rec = phieuData.stt_rec;
    }
    if (!dynamicItem.stt_rec0) {
      dynamicItem.stt_rec0 = String(index + 1).padStart(3, "0");
    }
    if (!dynamicItem.ma_ct) {
      dynamicItem.ma_ct = "PXA";
    }
    if (!dynamicItem.gia_nt) {
      dynamicItem.gia_nt = 0;
    }
    if (!dynamicItem.gia) {
      dynamicItem.gia = 0;
    }
    if (!dynamicItem.tien_nt) {
      dynamicItem.tien_nt = 0;
    }
    if (!dynamicItem.tien) {
      dynamicItem.tien = 0;
    }

    // Đảm bảo các trường bắt buộc khác khi thêm mới
    if (!isUpdate) {
      if (!dynamicItem.ngay_ct) {
        dynamicItem.ngay_ct = orderDate;
      }
      if (!dynamicItem.so_ct) {
        dynamicItem.so_ct = values.so_ct || values.soPhieu || "";
      }
      if (!dynamicItem.ma_dvcs) {
        dynamicItem.ma_dvcs = userInfo.ma_dvcs || "";
      }
      if (!dynamicItem.loai_ct) {
        dynamicItem.loai_ct = "2";
      }
    }

    // Không gắn mặc định bất kỳ trường nào - chỉ giữ trường thực sự có trong data

    // Chỉ xử lý line_nbr nếu có trong data
    if (item.line_nbr !== undefined) {
      dynamicItem.line_nbr = parseFloat(item.line_nbr);
    }

    // Xử lý tự động các loại trường - chỉ xử lý những trường thực sự có
    Object.keys(dynamicItem).forEach((key) => {
      const value = dynamicItem[key];

      // Các trường số - parse float (chỉ nếu có giá trị và là số)
      if (
        typeof value === "number" ||
        (!isNaN(parseFloat(value)) && value !== null && value !== undefined)
      ) {
        dynamicItem[key] = parseFloat(value || 0);
      }

      // Các trường boolean - handle boolean và number (chỉ nếu có giá trị)
      if (typeof value === "boolean" && value !== undefined) {
        dynamicItem[key] = value ? 1 : 0;
      }

      // Các trường string - đảm bảo không null/undefined (chỉ nếu có giá trị)
      if (typeof value === "string") {
        dynamicItem[key] = value.trim();
      } else if (value === null || value === undefined) {
        // Chỉ set empty string cho những trường string đã được định nghĩa
        if (
          [
            "ma_vt",
            "ma_sp",
            "ma_bp",
            "so_lsx",
            "dvt",
            "ma_kho",
            "ma_vi_tri",
            "ma_lo",
            "ma_vv",
            "ma_nx",
            "tk_du",
            "tk_vt",
            "tk_gv",
            "tk_dt",
            "ma_thue",
            "tk_thue",
            "tk_ck",
            "tk_cpbh",
            "stt_rec_px",
            "stt_rec0px",
            "ma_kh2",
            "ma_td1",
            "dh_so",
            "px_so",
            "stt_rec_dh",
            "stt_rec0dh",
            "stt_rec0",
          ].includes(key)
        ) {
          dynamicItem[key] = "";
        }
      }
    });

    // Clean up UI-only fields trước khi gửi API
    const uiOnlyFields = [
      "key",
      "maHang",
      "ten_mat_hang",
      "soLuongDeNghi",
      "soLuong_goc",
      "soLuongDeNghi_goc",
      "he_so_goc",
      "dvt_goc",
      "donViTinhList",
      "isNewlyAdded",
      "_lastUpdated",
    ];

    uiOnlyFields.forEach((field) => {
      if (field in dynamicItem) {
        delete dynamicItem[field];
      }
    });

    return dynamicItem;
  });

  // FINAL PAYLOAD
  return {
    store: isUpdate
      ? "Api_update_phieu_xuat_kho_voucher"
      : "Api_create_phieu_xuat_kho_voucher",
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
      "v1/web/xoa-ct-xuat-kho",
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

export const updatePhieuXuatKho = async (master, detail, token) => {
  const body = {
    store: "Api_update_phieu_xuat_kho_voucher",
    param: {},
    data: {
      master: [master],
      detail: detail,
    },
  };
  return https.post("User/AddData", body, {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  });
};

export const deletePhieuXuatKho = async (stt_rec, token) => {
  const body = {
    store: "Api_delete_phieu_xuat_kho_voucher",
    param: { stt_rec },
    data: {},
  };
  return https.post("User/AddData", body, {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  });
};
