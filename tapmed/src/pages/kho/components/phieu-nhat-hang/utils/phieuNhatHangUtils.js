import { message } from "antd";
import https from "../../../../../utils/https";

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

export const validateDataSource = (dataSource, formType = "default") => {
  if (dataSource.length === 0) {
    message.error("Vui lòng thêm ít nhất một vật tư");
    return { isValid: false };
  }

  const missingData = [];

  // Phiếu nhặt hàng không bắt buộc mã kho
  if (formType !== "nhat-hang") {
    dataSource.forEach((item, index) => {
      if (!item.ma_kho) {
        missingData.push(`Dòng ${index + 1}: Chưa chọn mã kho`);
      }
    });
  }

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

/**
 * Validate tổng nhặt không được vượt quá số lượng (so_luong) cho từng dòng (cả cha và con)
 * @param {Array} dataSource - Dữ liệu bảng
 * @returns {Object} { isValid: boolean, errors: Array }
 */
export const validateTongNhat = (dataSource) => {
  const { anyExceeded, errors, groups } = validateTongNhatByGroup(dataSource);

  if (anyExceeded) {
    return { isValid: false, errors, groups };
  }

  return { isValid: true, errors: [], groups };
};

/**
 * Validate điều kiện hoàn thành:
 * - Dòng nào có tổng nhặt (> 0) thì bắt buộc phải có mã lô
 * - Tổng nhặt nhóm phải BẰNG số lượng đơn (không thiếu, không dư)
 */
export const validateCompletionRules = (dataSource = []) => {
  const errors = [];

  // 1) Kiểm tra mã lô cho mọi dòng có picked > 0
  const missingLotRows = [];
  dataSource.forEach((row, idx) => {
    const picked = parseFloat(row.tong_nhat || 0) || 0;
    const lot = (row.ma_lo || "").toString().trim();
    if (picked > 0 && !lot) {
      const maHang = row.maHang || row.ma_vt || "";
      const ten = row.ten_mat_hang || row.ten_vt || "";
      const itemInfo =
        maHang && ten
          ? `${maHang} - ${ten}`
          : maHang || ten || `Dòng ${idx + 1}`;
      missingLotRows.push({ index: idx + 1, itemInfo });
    }
  });

  if (missingLotRows.length > 0) {
    return { isValid: false, type: "missingLot", details: missingLotRows };
  }

  // 2) Tổng nhặt nhóm phải bằng số lượng đơn
  const groups = computeGroupState(dataSource);
  const notEqualGroups = [];
  for (const [, g] of groups) {
    // Chỉ kiểm tra nhóm có parent (dòng cha)
    if (g && g.parentItem) {
      const equal =
        (parseFloat(g.pickedSum) || 0) === (parseFloat(g.orderQty) || 0);
      if (!equal) {
        const parent = g.parentItem;
        const maHang = parent.maHang || parent.ma_vt || "";
        const ten = parent.ten_mat_hang || parent.ten_vt || "";
        const itemInfo =
          maHang && ten
            ? `${maHang} - ${ten}`
            : maHang || ten || `Dòng ${g.parentIndex}`;
        notEqualGroups.push({
          parentIndex: g.parentIndex || 0,
          itemInfo,
          pickedSum: g.pickedSum || 0,
          orderQty: g.orderQty || 0,
        });
      }
    }
  }

  if (notEqualGroups.length > 0) {
    return { isValid: false, type: "sumNotEqual", details: notEqualGroups };
  }

  return { isValid: true };
};

/**
 * Tính trạng thái nhóm: tổng nhặt của nhóm (cha + các dòng con) không vượt quá số lượng đơn của dòng cha
 * GroupKey: dòng cha dùng key của chính nó; dòng con dùng parentKey
 */
export const computeGroupState = (dataSource = []) => {
  const groups = new Map();
  dataSource.forEach((row, index) => {
    const groupKey = row.isChild ? row.parentKey : row.key;
    const state = groups.get(groupKey) || {
      parentIndex: null,
      orderQty: 0,
      pickedSum: 0,
      members: [],
      parentItem: null,
    };
    const picked = parseFloat(row.tong_nhat || 0) || 0;
    state.pickedSum += picked;
    state.members.push(row);
    if (!row.isChild) {
      state.parentIndex = index + 1; // 1-based for display
      // Ưu tiên so_luong_don, fallback so_luong/soLuongDeNghi
      const orderQty =
        parseFloat(
          row.so_luong_don ?? row.so_luong ?? row.soLuongDeNghi ?? 0
        ) || 0;
      state.orderQty = orderQty;
      state.parentItem = row;
    }
    groups.set(groupKey, state);
  });
  // Mark exceeded
  for (const [key, g] of groups) {
    g.exceeded = g.pickedSum > g.orderQty;
  }
  return groups;
};

/**
 * Validate theo nhóm dựa trên computeGroupState
 */
export const validateTongNhatByGroup = (dataSource = []) => {
  const groups = computeGroupState(dataSource);
  const errors = [];
  for (const [, g] of groups) {
    if (g.exceeded) {
      const parent = g.parentItem || {};
      const maHang = parent.maHang || parent.ma_vt || "";
      const ten = parent.ten_mat_hang || parent.ten_vt || "";
      const itemInfo =
        maHang && ten
          ? `${maHang} - ${ten}`
          : maHang || ten || `Dòng ${g.parentIndex}`;
      errors.push({
        parentIndex: g.parentIndex || 0,
        itemInfo,
        orderQty: g.orderQty || 0,
        pickedSum: g.pickedSum || 0,
      });
    }
  }
  return { anyExceeded: errors.length > 0, errors, groups };
};

export const buildPhieuNhatHangPayload = (
  values,
  dataSource,
  phieuData = null,
  isUpdate = false,
  userInfo = null
) => {
  // Use passed userInfo or fallback to localStorage if not provided
  const finalUserInfo = userInfo || getUserInfo();
  const orderDate = formatDate(values.ngay);
  // Chỉ giữ lại những trường thực sự có trong data từ API response
  // Không gắn mặc định bất kỳ trường nào
  const totalQuantity = dataSource.reduce(
    (sum, item) => sum + parseFloat(item.soLuong || 0),
    0
  );

  // Tính tổng tiền từ detail
  const totalAmount = dataSource.reduce(
    (sum, item) => sum + parseFloat(item.tien || 0),
    0
  );
  const totalAmountNt = dataSource.reduce(
    (sum, item) => sum + parseFloat(item.tien_nt || 0),
    0
  );

  // MASTER - Chỉ override vài trường theo UI, giữ nguyên tất cả trường từ API
  const masterData = {
    // Giữ nguyên tất cả trường từ API response (khi update)
    ...(phieuData || {}),

    // Chỉ override các trường cần thiết từ form
    ma_gd: values.maGiaoDich || "",
    // Khi update, giữ nguyên ngay_ct từ API; khi tạo mới mới dùng orderDate
    ngay_ct: isUpdate && phieuData?.ngay_ct ? phieuData.ngay_ct : orderDate,
    so_ct: values.soPhieu || "",
    ong_ba: values.maKhach || "",
    ma_kh: values.maKhach || "",
    dien_giai: values.dienGiai || "",
    status: values.trangThai || "0",
    t_so_luong: totalQuantity,
    t_tien_nt: totalAmountNt,
    t_tien: totalAmount,
    // Khi update, giữ nguyên datetime2 từ API; khi tạo mới mới dùng orderDate
    datetime2:
      isUpdate && phieuData?.datetime2 ? phieuData.datetime2 : orderDate,
    user_id2:
      finalUserInfo?.userId?.toString() || finalUserInfo?.id?.toString() || "",
    // Trim khoảng trắng đầu cuối cho số đơn hàng
    so_don_hang: phieuData?.so_don_hang ? phieuData.so_don_hang.toString().trim() : "",
  };

  // Đảm bảo các trường bắt buộc có mặt khi thêm mới
  if (!isUpdate) {
    // Các trường bắt buộc cho phiếu nhặt hàng
    if (!masterData.stt_rec) {
      masterData.stt_rec = ""; // Sẽ được tạo tự động bởi server
    }
    if (!masterData.ma_dvcs) {
      masterData.ma_dvcs = finalUserInfo.ma_dvcs || finalUserInfo.unitId || "";
    }
    if (!masterData.ma_ct) {
      masterData.ma_ct = "PND";
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
    if (!masterData.ngay_lct) {
      // Khi update, giữ nguyên ngay_lct từ API; khi tạo mới mới dùng orderDate
      masterData.ngay_lct =
        isUpdate && phieuData?.ngay_lct ? phieuData.ngay_lct : orderDate;
    }
    if (!masterData.ma_nt) {
      masterData.ma_nt = "VND";
    }
    if (!masterData.ty_gia) {
      masterData.ty_gia = 1;
    }
    if (!masterData.nam) {
      masterData.nam = new Date().getFullYear();
    }
    if (!masterData.ky) {
      masterData.ky = new Date().getMonth() + 1;
    }
    if (!masterData.datetime0) {
      // Khi update, giữ nguyên datetime0 từ API; khi tạo mới mới dùng orderDate
      masterData.datetime0 =
        isUpdate && phieuData?.datetime0 ? phieuData.datetime0 : orderDate;
    }
    if (!masterData.user_id0) {
      masterData.user_id0 = finalUserInfo?.userId || finalUserInfo?.id || "";
    }
  }

  // Không gắn mặc định bất kỳ trường nào - chỉ giữ trường thực sự có trong data

  // Clean up UI-only fields từ masterData trước khi gửi API
  const uiOnlyMasterFields = [
    "sttRec",
    "ngay",
    "soPhieu",
    "maKhach",
    "dienGiai",
    "maGiaoDich",
    "trangThai",
    "donViTienTe",
    "tyGia",
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

  // DETAIL - DYNAMIC: Tự động lấy TẤT CẢ trường từ API response
  const detailData = dataSource.map((item, index) => {
    // Bắt đầu với tất cả trường từ item (chứa data từ API response)
    const dynamicItem = { ...item };

    // Chỉ override các trường cần thiết từ form
    // Khi update, giữ nguyên ngay_ct từ item (API); khi tạo mới mới dùng orderDate
    dynamicItem.ngay_ct = isUpdate && item.ngay_ct ? item.ngay_ct : orderDate;
    dynamicItem.so_ct = values.soPhieu || "";

    // Mapping từ UI fields sang API fields
    // Với dòng cha: set ma_vt từ maHang
    if (item.maHang) {
      dynamicItem.ma_vt = item.maHang.trim();
    }
    // Với dòng con (isChild): ma_vt đã được copy từ parent qua {...parent}
    // Chỉ đảm bảo ma_vt có giá trị từ parent

    // Mapping số lượng
    // Với dòng cha: set so_luong từ soLuongDeNghi
    // Với dòng con: so_luong đã được copy từ parent qua {...parent}, giữ nguyên
    if (!item.isChild && item.soLuongDeNghi !== undefined) {
      dynamicItem.so_luong = parseFloat(item.soLuongDeNghi || 0);
    }
    // Với dòng con, so_luong đã được copy từ parent, không cần override
    if (item.soLuong !== undefined)
      dynamicItem.sl_td3 = parseFloat(item.soLuong || 0);

    // Mapping các trường mới cho phiếu nhặt hàng
    // so_luong_don sẽ bị xóa khỏi payload (thêm vào uiOnlyFields)
    // Dòng con sẽ gửi so_luong (đã được set về 0)
    if (item.nhat !== undefined) dynamicItem.nhat = parseFloat(item.nhat || 0);
    if (item.ghi_chu !== undefined)
      dynamicItem.ghi_chu = item.ghi_chu ? item.ghi_chu.trim() : "";
    // so_luong_ton đã được copy từ parent, chỉ parse lại nếu có giá trị
    if (item.so_luong_ton !== undefined && item.so_luong_ton !== null) {
      dynamicItem.so_luong_ton = parseFloat(item.so_luong_ton);
    }
    if (item.tong_nhat !== undefined)
      dynamicItem.tong_nhat = parseFloat(item.tong_nhat || 0);
    if (item.ma_lo !== undefined)
      dynamicItem.ma_lo = item.ma_lo ? item.ma_lo.trim() : "";
    if (item.ma_vi_tri !== undefined)
      dynamicItem.ma_vi_tri = item.ma_vi_tri ? item.ma_vi_tri.trim() : "";

    // Đảm bảo các trường bắt buộc có mặt (chỉ nếu không có trong API response)
    if (!dynamicItem.stt_rec && phieuData?.stt_rec) {
      dynamicItem.stt_rec = phieuData.stt_rec;
    }
    // Với dòng con (isChild), stt_rec0 đã được copy từ parent qua {...parent}
    // Chỉ set stt_rec0 theo index nếu không phải dòng con và chưa có giá trị
    if (!dynamicItem.stt_rec0 && !item.isChild) {
      dynamicItem.stt_rec0 = String(index + 1).padStart(3, "0");
    } else if (item.isChild && !dynamicItem.stt_rec0) {
      // Nếu dòng con không có stt_rec0 (trường hợp hiếm), tìm parent để copy
      // Nhưng thường thì đã được copy qua {...parent}
      const parentIndex = dataSource.findIndex(
        (row) => row.key === item.parentKey || row.line_nbr === item.parentKey
      );
      if (parentIndex >= 0 && dataSource[parentIndex]?.stt_rec0) {
        dynamicItem.stt_rec0 = dataSource[parentIndex].stt_rec0;
      } else {
        // Fallback: set theo index của parent gần nhất
        dynamicItem.stt_rec0 = String(index + 1).padStart(3, "0");
      }
    }
    if (!dynamicItem.ma_ct) {
      dynamicItem.ma_ct = "PND";
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
        dynamicItem.ma_dvcs =
          finalUserInfo.ma_dvcs || finalUserInfo.unitId || "";
      }
      if (!dynamicItem.loai_ct) {
        dynamicItem.loai_ct = "2";
      }
    }

    // Chỉ xử lý line_nbr nếu có trong data
    if (item.line_nbr !== undefined) {
      dynamicItem.line_nbr = parseFloat(item.line_nbr);
    }

    // Không gắn mặc định bất kỳ trường nào - chỉ giữ trường thực sự có trong data

    // Xử lý tự động các loại trường - chỉ xử lý những trường thực sự có
    // Các trường đã được parse ở trên (so_luong_ton) không parse lại
    // so_luong_don sẽ bị xóa khỏi payload, không cần parse
    const alreadyParsedFields = ["so_luong_ton"];

    Object.keys(dynamicItem).forEach((key) => {
      const value = dynamicItem[key];

      // Bỏ qua các trường đã được parse ở trên
      if (alreadyParsedFields.includes(key)) {
        return;
      }

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
            "stt_rec_pn",
            "ma_kh2",
            "ma_td1",
            "dh_so",
            "px_so",
            "stt_rec_dh",
            "stt_rec0dh",
            "stt_rec0",
            "ghi_chu",
          ].includes(key)
        ) {
          dynamicItem[key] = "";
        }
      }
    });

    // Clean up UI-only fields trước khi gửi API
    // Chỉ loại bỏ những trường chỉ dùng cho UI, giữ lại tất cả trường API
    // Với dòng con (isChild), giữ lại tất cả trường API từ parent, chỉ xóa UI fields
    const uiOnlyFields = [
      "key",
      "maHang",
      "soLuong",
      "ten_mat_hang",
      "soLuongDeNghi",
      "soLuong_goc",
      "soLuongDeNghi_goc",
      "he_so_goc",
      "dvt_goc",
      "donViTinhList",
      "loOptions",
      "viTriOptions", // Xóa viTriOptions khỏi payload (chỉ dùng cho UI dropdown)
      "so_luong_don", // Xóa so_luong_don khỏi payload, dòng con sẽ gửi so_luong
      "isNewlyAdded",
      "_lastUpdated",
    ];

    // Xóa các trường chỉ dùng cho UI (giữ lại tất cả trường API)
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

  return payload;
};

export const submitPhieuNhatHang = async (
  endpoint,
  payload,
  successMessage
) => {
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

    // Nếu có responseModel, chỉ dựa vào responseModel để xác định thành công/thất bại
    const hasResponseModel =
      response?.data && typeof response.data.responseModel !== "undefined";
    if (hasResponseModel) {
      if (response.data.responseModel?.isSucceded === true) {
        message.success(response.data.responseModel.message || successMessage);
        return { success: true };
      }
      message.error(
        response.data.responseModel?.message ||
          response.data?.message ||
          "Có lỗi xảy ra"
      );
      return { success: false };
    }

    // Fallback cho cấu trúc cũ khi không có responseModel
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
    }

    message.error(response.data?.message || "Có lỗi xảy ra");
    return { success: false };
  } catch (error) {
    console.error("Error submitting phieu nhat hang:", error);

    if (error.response?.data?.message) {
      message.error(error.response.data.message);
    } else {
      message.error("Vui lòng kiểm tra lại thông tin");
    }
    return { success: false };
  }
};

export const deletePhieuNhatHang = async (sctRec) => {
  const token = localStorage.getItem("access_token");

  try {
    const response = await https.post(
      `v1/web/xoa-ct-nhat-hang?sctRec=${sctRec}`,
      {},
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.data && response.data.statusCode === 200) {
      message.success("Xóa phiếu nhặt hàng thành công");
      return { success: true };
    } else {
      message.error(response.data?.message || "Xóa phiếu nhặt hàng thất bại");
      return { success: false };
    }
  } catch (error) {
    console.error("Lỗi khi xóa phiếu nhặt hàng:", error);
    if (error.response?.data?.message) {
      message.error(error.response.data.message);
    } else {
      message.error("Có lỗi xảy ra khi xóa phiếu nhặt hàng");
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

// API để lấy danh sách vật tư qua callDynamicApi (sp_GetVatTuList)
export const fetchVatTuListDynamicApi = async (params) => {
  const token = localStorage.getItem("access_token");

  const body = {
    store: "sp_GetVatTuList",
    param: {
      Keyword: params.keyword || "",
      UnitCode: params.unitCode || "",
      PageIndex: 1,
      PageSize: 100,
    },
    data: {},
    resultSetNames: ["data", "pagination"],
  };

  try {
    const response = await https.post("v1/dynamicApi/call-dynamic-api", body, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const responseData = response.data?.listObject?.dataLists?.data || [];
    const paginationData =
      response.data?.listObject?.dataLists?.pagination?.[0] || {};

    return {
      data: responseData,
      pagination: paginationData,
      success: true,
    };
  } catch (error) {
    console.error("Lỗi gọi API danh sách vật tư (dynamic):", error);
    return {
      data: [],
      pagination: {},
      success: false,
      error: error.message,
    };
  }
};

/**
 * Xử lý trường ma_kho từ API response
 * @param {string} apiMaKho - ma_kho từ API
 * @param {string} fallbackMaKho - ma_kho fallback (cho trường hợp update item)
 * @returns {string} ma_kho đã được trim
 */
export const processMaKho = (apiMaKho, fallbackMaKho = "") => {
  return (apiMaKho || fallbackMaKho || "").trim();
};

/**
 * Đảm bảo các trường bắt buộc có mặt trong object
 * @param {Object} targetObject - Object cần kiểm tra
 * @param {Object} requiredFields - Object chứa các trường bắt buộc và giá trị mặc định
 */
export const ensureRequiredFields = (targetObject, requiredFields) => {
  Object.keys(requiredFields).forEach((field) => {
    if (!(field in targetObject)) {
      targetObject[field] = requiredFields[field];
    }
  });
  return targetObject;
};

// Dynamic API functions for phieu nhat hang
export const submitPhieuNhatHangDynamic = async (
  payload,
  successMessage,
  isUpdate = false,
  userInfo = null
) => {
  const token = localStorage.getItem("access_token");

  // Kiểm tra payload có hợp lệ không
  if (!payload || !payload.master || !payload.detail) {
    message.error("Dữ liệu payload không hợp lệ");
    return { success: false };
  }

  // Lấy thông tin user từ Redux thay vì localStorage
  const userId = userInfo?.id || userInfo?.userId || "";
  const unitId = userInfo?.unitId || "";
  const storeId = userInfo?.storeId || "";

  const storeName = isUpdate
    ? "Api_update_phieu_nhat_hang"
    : "Api_create_phieu_nhat_hang";

  const body = {
    store: storeName,
    param: {
      UnitId: unitId,
      StoreID: storeId,
      userId: userId,
    },
    data: {
      m28: [payload.master],
      d28: payload.detail,
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

    // Nếu có responseModel, chỉ dùng isSucceded để xác định thành công/thất bại
    const hasResponseModel =
      response?.data && typeof response.data.responseModel !== "undefined";
    if (hasResponseModel) {
      if (response.data.responseModel?.isSucceded === true) {
        message.success(response.data.responseModel.message || successMessage);
        return { success: true };
      }
      message.error(
        response.data.responseModel?.message ||
          response.data?.message ||
          "Có lỗi xảy ra"
      );
      return { success: false };
    }

    // Fallback cho cấu trúc cũ chỉ khi KHÔNG có responseModel
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
    }

    message.error(response.data?.message || "Có lỗi xảy ra");
    return { success: false };
  } catch (error) {
    console.error("Error submitting phieu nhat hang:", error);

    // Kiểm tra error.response có tồn tại không
    if (error.response?.data?.responseModel?.message) {
      message.error(error.response.data.responseModel.message);
    } else if (error.response?.data?.message) {
      message.error(error.response.data.message);
    } else if (error.message) {
      message.error(`Lỗi: ${error.message}`);
    } else {
      message.error("Vui lòng kiểm tra lại thông tin");
    }
    return { success: false };
  }
};

export const deletePhieuNhatHangDynamic = async (sctRec, userInfo) => {
  const token = localStorage.getItem("access_token");

  // Lấy thông tin user từ Redux thay vì localStorage
  const userId = userInfo?.id || userInfo?.userId || "";
  const unitId = userInfo?.unitId || "";
  const storeId = userInfo?.storeId || "";

  const body = {
    store: "api_delete_phieu_nhat_hang",
    param: {
      UnitId: unitId,
      StoreID: storeId,
      userId: userId,
      stt_rec: sctRec,
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
        response.data.responseModel.message || "Xóa phiếu nhặt hàng thành công"
      );
      return { success: true };
    } else {
      message.error(
        response.data?.responseModel?.message || "Xóa phiếu nhặt hàng thất bại"
      );
      return { success: false };
    }
  } catch (error) {
    console.error("Lỗi khi xóa phiếu nhặt hàng:", error);
    if (error.response?.data?.responseModel?.message) {
      message.error(error.response.data.responseModel.message);
    } else if (error.response?.data?.message) {
      message.error(error.response.data.message);
    } else if (error.message) {
      message.error(`Lỗi: ${error.message}`);
    } else {
      message.error("Có lỗi xảy ra khi xóa phiếu nhặt hàng");
    }
    return { success: false };
  }
};
