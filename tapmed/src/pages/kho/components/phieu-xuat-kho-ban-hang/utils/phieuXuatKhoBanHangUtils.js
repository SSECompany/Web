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

// Traditional payload builder - Sử dụng cho Add mới và fallback
export const buildPayload = (
  values,
  dataSource,
  phieuData = null,
  isUpdate = false
) => {
  const userInfo = getUserInfo();
  const orderDate = formatDate(values.ngay);
  const totalQuantity = dataSource.reduce(
    (sum, item) => sum + parseFloat(item.sl_td3 || 0),
    0
  );

  // MASTER - Chỉ override vài trường theo UI, giữ nguyên tất cả trường từ API
  const masterData = {
    // Giữ nguyên tất cả trường từ API response (khi update)
    ...(phieuData || {}),

    // Chỉ override các trường cần thiết từ form
    ma_gd: values.maGiaoDich || "1",
    ngay_ct: orderDate,
    so_ct: values.soPhieu || "",
    ma_kh: values.maKhach || "",
    dien_giai: values.dienGiai || "",
    ma_nvbh: values.maNVBH || "",
    xe_vc: values.xe || "",
    tai_xe: values.taiXe || "",
    status: values.trangThai || "0",
    t_so_luong: totalQuantity,
    t_tien_nt: dataSource.reduce(
      (sum, item) => sum + parseFloat(item.tien_nt2 || 0),
      0
    ),
    t_tien: dataSource.reduce(
      (sum, item) => sum + parseFloat(item.tien2 || 0),
      0
    ),
    datetime2: orderDate,
    user_id2: userInfo.userId.toString(),
  };

  // Đảm bảo các trường bắt buộc có mặt khi thêm mới
  if (!isUpdate) {
    // Các trường bắt buộc cho phiếu xuất kho bán hàng
    if (!masterData.stt_rec) {
      masterData.stt_rec = ""; // Sẽ được tạo tự động bởi server
    }
    if (!masterData.ma_dvcs) {
      masterData.ma_dvcs = userInfo.ma_dvcs || "";
    }
    if (!masterData.ma_ct) {
      masterData.ma_ct = "PXB";
    }
    if (!masterData.loai_ct) {
      masterData.loai_ct = "2";
    }
    if (!masterData.so_lo) {
      masterData.so_lo = "";
    }
    if (!masterData.ngay_lo) {
      masterData.ngay_lo = null;
    }
    if (!masterData.ma_nk) {
      masterData.ma_nk = "";
    }
  }

  // Clean up UI-only fields từ masterData trước khi gửi API
  const uiOnlyMasterFields = [
    "ngay",
    "soPhieu",
    "maKhach",
    "dienGiai",
    "maNVBH",
    "xe",
    "taiXe",
    "trangThai",
    "maGiaoDich",
  ];

  uiOnlyMasterFields.forEach((field) => {
    if (field in masterData) {
      delete masterData[field];
    }
  });

  // Xử lý tự động các loại trường master - chỉ xử lý những trường thực sự có
  Object.keys(masterData).forEach((key) => {
    const value = masterData[key];

    // Các trường số - parse float (chỉ nếu có giá trị và là số)
    if (
      typeof value === "number" ||
      (!isNaN(parseFloat(value)) && value !== null && value !== undefined)
    ) {
      masterData[key] = parseFloat(value || 0);
    }

    // Các trường string - đảm bảo không null/undefined (chỉ nếu có giá trị)
    if (typeof value === "string") {
      masterData[key] = value.trim();
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
        masterData[key] = "";
      }
    }
  });

  // DETAIL - Chỉ override vài trường theo UI, giữ nguyên tất cả trường từ API
  const detailData = dataSource.map((item, index) => {
    const dynamicItem = { ...item }; // Giữ nguyên tất cả trường từ API

    // Chỉ override các trường cần thiết từ form
    dynamicItem.ngay_ct = orderDate;
    dynamicItem.so_ct = values.soPhieu || "";

    // Mapping từ UI fields sang API fields
    if (item.maHang) dynamicItem.ma_vt = item.maHang.trim();
    if (item.so_luong !== undefined)
      dynamicItem.so_luong = parseFloat(item.so_luong || 0);
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
      dynamicItem.ma_ct = "PXB";
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
        dynamicItem.so_ct = values.soPhieu || "";
      }
      if (!dynamicItem.ma_dvcs) {
        dynamicItem.ma_dvcs = userInfo.ma_dvcs || "";
      }
      if (!dynamicItem.loai_ct) {
        dynamicItem.loai_ct = "2";
      }
    }

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
      "soLuong_goc",
      "sl_td3_goc",
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
export const submitPhieuDynamic = async (
  payload,
  successMessage,
  isUpdate = false
) => {
  const token = localStorage.getItem("access_token");

  // Validate payload structure
  if (
    !payload ||
    !payload.Data ||
    !payload.Data.master ||
    !payload.Data.detail
  ) {
    console.error("Invalid payload structure:", payload);
    message.error("Dữ liệu payload không hợp lệ");
    return { success: false };
  }

  const storeName = isUpdate
    ? "Api_update_phieu_xuat_kho_ban_hang_voucher"
    : "Api_create_phieu_xuat_kho_ban_hang_voucher";

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

    // Kiểm tra response có tồn tại không
    if (!response) {
      message.error("Không nhận được phản hồi từ server");
      return { success: false };
    }

    // Check new response structure with responseModel
    if (response.data?.responseModel?.isSucceded === true) {
      message.success(response.data.responseModel.message || successMessage);
      return { success: true };
    } else if (
      response.data &&
      typeof response.data.responseModel === "undefined" &&
      response.data.statusCode === 200
    ) {
      // Fallback for old response structure ONLY when responseModel is absent
      message.success(successMessage);
      return { success: true };
    } else {
      message.error(
        response.data?.responseModel?.message ||
          response.data?.message ||
          "Có lỗi xảy ra"
      );
      return { success: false };
    }
  } catch (error) {
    console.error("Error submitting phieu:", error);
    console.error("Error details:", error.message);

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

    // Kiểm tra response có tồn tại không
    if (!response) {
      message.error("Không nhận được phản hồi từ server");
      return { success: false };
    }

    // Check new response structure with responseModel
    if (response.data?.responseModel?.isSucceded === true) {
      message.success(
        response.data.responseModel.message ||
          "Xóa phiếu xuất kho bán hàng thành công"
      );
      return { success: true };
    } else {
      message.error(
        response.data?.responseModel?.message ||
          "Xóa phiếu xuất kho bán hàng thất bại"
      );
      return { success: false };
    }
  } catch (error) {
    console.error("Lỗi khi xóa phiếu xuất kho bán hàng:", error);
    console.error("Error details:", error.message);
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

// ===== DYNAMIC PAYLOAD HELPERS =====
// Tạo snapshot của dữ liệu để theo dõi thay đổi
export const createDataSnapshot = (masterData, detailData) => {
  return {
    master: JSON.parse(JSON.stringify(masterData || {})),
    detail: JSON.parse(JSON.stringify(detailData || [])),
  };
};

// Chuyển đổi API data thành form data cho phiếu xuất kho bán hàng
export const convertApiDataToFormData = (apiMasterData, apiDetailData) => {
  const formData = {
    sttRec: apiMasterData.stt_rec || "",
    ngay: apiMasterData.ngay_ct ? dayjs(apiMasterData.ngay_ct) : dayjs(),
    soPhieu: apiMasterData.so_ct || "",
    maKhach: apiMasterData.ma_kh || "",
    dienGiai: apiMasterData.dien_giai || "",
    maNVBH: apiMasterData.ma_nvbh || "",
    xe: apiMasterData.xe_vc || "",
    taiXe: apiMasterData.tai_xe || "",
    maGiaoDich: apiMasterData.ma_gd || "",
    trangThai: apiMasterData.status || "0",
  };

  const dataSource = formatDetailDataFromResponse(apiDetailData);

  return { formData, dataSource };
};

// So sánh và tìm thay đổi trong dữ liệu
const normalizeValue = (value) => {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" && isNaN(value)) return 0;
  return value;
};

export const getChangedFields = (original, current, excludeFields = []) => {
  const changes = {};
  const allKeys = new Set([...Object.keys(original), ...Object.keys(current)]);

  allKeys.forEach((key) => {
    if (excludeFields.includes(key)) return;

    const originalValue = normalizeValue(original[key]);
    const currentValue = normalizeValue(current[key]);

    if (originalValue !== currentValue) {
      changes[key] = currentValue;
    }
  });

  return changes;
};

export const getDetailChanges = (
  originalDetail,
  currentDetail,
  keyField = "key"
) => {
  const changes = [];

  currentDetail.forEach((currentItem, index) => {
    const originalItem =
      originalDetail.find((item) => item[keyField] === currentItem[keyField]) ||
      {};
    const itemChanges = getChangedFields(originalItem, currentItem, [
      "_lastUpdated",
    ]);

    if (Object.keys(itemChanges).length > 0) {
      changes.push({
        index,
        key: currentItem[keyField],
        changes: itemChanges,
        fullItem: currentItem,
      });
    }
  });

  return changes;
};

// Build dynamic payload chỉ với các trường thay đổi
export const buildDynamicPayload = (
  formValues,
  currentDataSource,
  originalSnapshot,
  apiMasterData,
  isUpdate = false
) => {
  const userInfo = getUserInfo();
  const orderDate = formatDate(formValues.ngay);

  // Build master data - kết hợp original API data + changes
  const masterData = {
    ...apiMasterData, // Giữ nguyên TẤT CẢ trường từ API
    // Override với business logic
    stt_rec: apiMasterData?.stt_rec || "",
    ma_dvcs: userInfo.unitId || "VIKOSAN",
    ma_ct: "HDA",
    loai_ct: formValues.maGiaoDich || "1",
    ma_gd: formValues.maGiaoDich || "1",
    ngay_ct: orderDate,
    so_ct: formValues.soPhieu || "",
    ma_kh: formValues.maKhach || "",
    dien_giai: formValues.dienGiai || "",
    ma_nvbh: formValues.maNVBH || "",
    xe_vc: formValues.xe || "",
    tai_xe: formValues.taiXe || "",
    status: formValues.trangThai || "0",
    user_id2: userInfo.userId.toString(),
    datetime2: orderDate,
  };

  // Build detail data - TẤT CẢ dòng với dynamic fields
  const detailData = currentDataSource.map((item, index) => {
    // Bắt đầu với TẤT CẢ data từ item (đã có API response data)
    const dynamicItem = { ...item };

    // Override business logic fields
    dynamicItem.stt_rec = apiMasterData?.stt_rec || "";
    dynamicItem.stt_rec0 = String(index + 1).padStart(3, "0");
    dynamicItem.ma_ct = "HDA";
    dynamicItem.ngay_ct = orderDate;
    dynamicItem.so_ct = formValues.soPhieu || "";

    // Apply field mapping
    if (item.maHang) dynamicItem.ma_vt = item.maHang.trim();
    if (item.so_luong !== undefined)
      dynamicItem.so_luong = parseFloat(item.so_luong || 0);
    if (item.sl_td3 !== undefined)
      dynamicItem.sl_td3 = parseFloat(item.sl_td3 || 0);

    // Remove UI-only fields
    const uiOnlyFields = [
      "key",
      "maHang",
      "ten_mat_hang",
      "soLuong_goc",
      "sl_td3_goc",
    ];
    uiOnlyFields.forEach((field) => delete dynamicItem[field]);

    return dynamicItem;
  });

  const payload = {
    orderDate: orderDate,
    master: masterData,
    detail: detailData,
  };

  return { Data: payload };
};
