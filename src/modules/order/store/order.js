import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  activeTabId: null,
  internalActiveTabId: null,
  orders: [],
  listOrderTable: [],
  listOrderInfo: [],
  listCategory: [],
  selectedCategory: {
    loai_nh: "",
    ma_nh: "",
    ten_nh: "",
  },
  menuItems: [],
  selectedItem: {},
  listItemExtra: [],
};

const orders = createSlice({
  name: "orders",
  initialState,
  reducers: {
    addTab: (state, action) => {
      const {
        tableName,
        tableId,
        isRealtime,
        master = {},
        detail = [],
        roleWeb,
        internalId: providedInternalId, // nhận thêm internalId nếu có
      } = action.payload;

      const defaultMaster = {
        dien_giai: "",
        tong_tien: "0",
        tong_sl: "0",
        tong_tt: "0",
        tien_mat: "0",
        chuyen_khoan: "0",
        httt: "",
        stt_rec: "",
        status: "2",
        ma_ban: "",
        ong_ba: "",
        so_dt: "",
        dia_chi: "",
        cccd: "",
        email: "",
        so_giuong: "",
        so_phong: "",
        ca_an: "",
        thutien_yn: "",
      };

      let tong_tien = 0;
      let tong_sl = 0;

      const normalizedDetail = detail.map((item) => {
        const so_luong = parseInt(item.so_luong || 0);
        const don_gia = parseFloat(item.don_gia || 0);
        const extrasTotal = (item.extras || []).reduce(
          (sum, extra) =>
            sum +
            parseFloat(extra.don_gia || 0) *
              parseInt(extra.so_luong || 0) *
              so_luong,
          0
        );
        
        // Tính giảm giá
        const totalBeforeDiscount = don_gia * so_luong + extrasTotal;
        const tl_ck = parseFloat(item.tl_ck || 0);
        const ck_nt = parseFloat(item.ck_nt || 0);

        let finalDiscount = 0;
        if (tl_ck > 0) {
          finalDiscount = (totalBeforeDiscount * tl_ck) / 100;
        } else {
          finalDiscount = ck_nt;
        }

        const thanh_tien = totalBeforeDiscount - finalDiscount;

        tong_tien += thanh_tien;
        tong_sl += so_luong;

        return {
          ...item,
          thanh_tien: thanh_tien.toFixed(0),
          tl_ck: item.tl_ck || "0",
          ck_nt: item.ck_nt || "0",
        };
      });

      const resolvedTableName =
        tableName || (roleWeb === "isPosMini" ? "POS Mini" : "POS");
      const resolvedTableId =
        tableId || (roleWeb === "isPosMini" ? "POS_Mini" : "POS");
      const internalId =
        providedInternalId || `${resolvedTableId}_${Date.now()}`;

      state.orders.push({
        internalId,
        tableName: resolvedTableName,
        tableId: resolvedTableId,
        master: {
          ...defaultMaster,
          ...master,
          tong_tien: tong_tien.toFixed(0),
          tong_sl: tong_sl.toString(),
        },
        detail: normalizedDetail,
        // Thêm thuộc tính unseen nếu là đơn từ signal
        unseen: !!isRealtime,
        ...Object.fromEntries(
          Object.entries(action.payload).filter(
            ([key]) =>
              ![
                "tableName",
                "tableId",
                "isRealtime",
                "master",
                "detail",
                "roleWeb",
                "internalId",
              ].includes(key)
          )
        ),
      });

      if (!isRealtime || state.orders.length === 0) {
        state.activeTabId = resolvedTableId;
        state.internalActiveTabId = internalId;
      }
    },

    updateTabTableName: (state, action) => {
      const { tableId, tableName, roleWeb } = action.payload;
      const tab = state.orders.find((tab) => tab.tableId === state.activeTabId);
      if (tab) {
        tab.tableName = roleWeb === "isPosMini" ? "POS_Mini" : "POS";
        tab.tableId = roleWeb === "isPosMini" ? "POS_Mini" : "POS";
        state.activeTabId = tab.tableId;
      }
    },
    addProductToTab: (state, action) => {
      const { internalId, product } = action.payload;
      let tab = state.orders.find((tab) => tab.internalId === internalId);
      if (!tab) {
        tab = state.orders.find(
          (tab) => tab.internalId === state.internalActiveTabId
        );
      }

      if (tab) {
        tab.detail.push({
          ma_vt: product.id,
          ten_vt: product.name,
          ma_vt_root: "",
          so_luong: 1,
          don_gia: product.price,
          thanh_tien: product.price,
          ghi_chu: "",
          extras: [],
          ap_voucher: "0",
          tl_ck: "0",
          ck_nt: "0",
        });

        tab.master.tong_tien = tab.detail
          .reduce((sum, item) => sum + parseFloat(item.thanh_tien), 0)
          .toFixed(0);

        tab.master.tong_sl = tab.detail
          .reduce((sum, item) => sum + parseInt(item.so_luong), 0)
          .toString();
      }
    },

    addExtrasToOrder: (state, action) => {
      const { internalId, orderIndex, extras, note } = action.payload;
      let tab = state.orders.find((tab) => tab.internalId === internalId);
      if (!tab) {
        tab = state.orders.find(
          (tab) => tab.internalId === state.internalActiveTabId
        );
      }

      if (tab) {
        const mainProduct = tab.detail[orderIndex];
        if (mainProduct) {
          const updatedExtras = extras
            .filter((extra) => extra.quantity > 0)
            .map((extra) => ({
              ...extra,
              so_luong: extra.quantity,
              don_gia: extra.gia || extra.don_gia || 0,
            }));

          mainProduct.extras = updatedExtras;
          mainProduct.ghi_chu = note;

          const mainTotal =
            parseFloat(mainProduct.don_gia || 0) *
            parseInt(mainProduct.so_luong || 0);
          const extrasTotal =
            updatedExtras.reduce(
              (sum, extra) =>
                sum +
                parseFloat(extra.don_gia || 0) * parseInt(extra.so_luong || 0),
              0
            ) * parseInt(mainProduct.so_luong || 0);

          // Tính giảm giá
          const totalBeforeDiscount = mainTotal + extrasTotal;
          const tl_ck = parseFloat(mainProduct.tl_ck || 0);
          const ck_nt = parseFloat(mainProduct.ck_nt || 0);

          let finalDiscount = 0;
          if (tl_ck > 0) {
            finalDiscount = (totalBeforeDiscount * tl_ck) / 100;
          } else {
            finalDiscount = ck_nt;
          }

          mainProduct.thanh_tien = (
            totalBeforeDiscount - finalDiscount
          ).toFixed(0);

          tab.master.tong_tien = tab.detail
            .reduce((sum, item) => sum + parseFloat(item.thanh_tien), 0)
            .toFixed(0);

          tab.master.tong_sl = tab.detail
            .reduce((sum, item) => sum + parseInt(item.so_luong), 0)
            .toString();

          localStorage.setItem("pos_orders", JSON.stringify(state.orders));
        }
      }
    },

    updateProductQuantity: (state, action) => {
      const { internalId, productIndex, increment } = action.payload;
      const tab = state.orders.find((tab) => tab.internalId === internalId);

      if (tab && tab.detail[productIndex]) {
        const product = tab.detail[productIndex];
        const newQuantity = Math.max(1, parseInt(product.so_luong) + increment);

        product.so_luong = newQuantity.toString();

        const mainTotal = parseFloat(product.don_gia) * newQuantity;

        const extrasTotal =
          (product.extras || []).reduce(
            (sum, extra) =>
              sum + (extra.gia || 0) * extra.quantity * newQuantity,
            0
          ) || 0;

        // Tính giảm giá
        const totalBeforeDiscount = mainTotal + extrasTotal;
        const tl_ck = parseFloat(product.tl_ck || 0);
        const ck_nt = parseFloat(product.ck_nt || 0);

        let finalDiscount = 0;
        if (tl_ck > 0) {
          finalDiscount = (totalBeforeDiscount * tl_ck) / 100;
        } else {
          finalDiscount = ck_nt;
        }

        product.thanh_tien = (totalBeforeDiscount - finalDiscount).toFixed(0);

        tab.master.tong_tien = tab.detail
          .reduce((sum, item) => sum + parseFloat(item.thanh_tien), 0)
          .toFixed(0);
        tab.master.tong_sl = tab.detail
          .reduce((sum, item) => sum + parseInt(item.so_luong), 0)
          .toString();
      }
    },

    removeProductFromTab: (state, action) => {
      const { internalId, productIndex } = action.payload;
      const tab = state.orders.find((tab) => tab.internalId === internalId);

      if (tab && tab.detail[productIndex]) {
        tab.detail.splice(productIndex, 1);

        tab.master.tong_tien = tab.detail
          .reduce((sum, item) => sum + parseFloat(item.thanh_tien), 0)
          .toFixed(0);

        tab.master.tong_sl = tab.detail
          .reduce((sum, item) => sum + parseInt(item.so_luong), 0)
          .toString();
      }
    },

    removeTab: (state, action) => {
      const { internalId } = action.payload;
      state.orders = state.orders.filter(
        (tab) => tab.internalId !== internalId
      );
      if (state.internalActiveTabId === internalId) {
        state.activeTabId = state.orders.length
          ? state.orders[0].tableId
          : null;
        state.internalActiveTabId = state.orders.length
          ? state.orders[0].internalId
          : null;
      }
    },

    clearTabData: (state, action) => {
      const tableId = action.payload;
      const tab = state.orders.find((tab) => tab.internalId === tableId);
      if (tab) {
        tab.master = {
          dien_giai: "",
          tong_tien: "0",
          tong_sl: "0",
          tong_tt: "0",
          tien_mat: "0",
          chuyen_khoan: "0",
          httt: "",
          stt_rec: "",
          status: "2",
          ma_ban: tab.tableId === "POS" ? "" : tab.master.ma_ban,
          ong_ba: "",
          so_dt: "",
          dia_chi: "",
          cccd: "",
          email: "",
        };
        tab.detail = [];
      }
    },

    setListOrderTable: (state, action) => {
      state.listOrderTable = action.payload;
    },
    setListCategory: (state, action) => {
      state.listCategory = action.payload;
    },
    setCurrentCategory: (state, action) => {
      state.selectedCategory = action.payload;
    },
    setMenuItems: (state, action) => {
      state.menuItems = action.payload;
    },
    setSelectedItem: (state, action) => {
      state.selectedItem = action.payload;
    },
    setListItemExtra: (state, action) => {
      state.listItemExtra = action.payload;
    },
    setListOrderInfo: (state, action) => {
      state.listOrderInfo = action.payload;
    },
    switchTab: (state, action) => {
      const newActiveTabId = action.payload;
      const tab = state.orders.find((tab) => tab.internalId === newActiveTabId);
      if (tab) {
        state.activeTabId = tab.tableId;
        state.internalActiveTabId = newActiveTabId;
        // Khi chuyển tab, bỏ trạng thái unseen
        tab.unseen = false;
      }
    },
    addOrderFromSignal: (state, action) => {
      const { tableId, detailData } = action.payload;
      const tab = state.orders.find((tab) => tab.tableId === tableId);

      if (tab) {
        // Kiểm tra trùng lặp trước khi thêm
        const existingIds = tab.detail.map((item) => item.unique_id);
        const newItems = detailData.filter(
          (item) => !existingIds.includes(item.unique_id)
        );

        tab.detail.push(...newItems);

        // Cập nhật lại tổng tiền và tổng số lượng sau khi thêm chi tiết
        let newTongTien = 0;
        let newTongSl = 0;

        tab.detail.forEach((item) => {
          const so_luong = parseInt(item.so_luong || 0);
          const don_gia = parseFloat(item.don_gia || 0);
          const extrasTotal = (item.extras || []).reduce(
            (sum, extra) =>
              sum +
              parseFloat(extra.don_gia || extra.gia || 0) *
                parseInt(extra.so_luong || extra.quantity || 0) *
                so_luong,
            0
          );

          // Tính giảm giá
          const totalBeforeDiscount = don_gia * so_luong + extrasTotal;
          const tl_ck = parseFloat(item.tl_ck || 0);
          const ck_nt = parseFloat(item.ck_nt || 0);

          let finalDiscount = 0;
          if (tl_ck > 0) {
            finalDiscount = (totalBeforeDiscount * tl_ck) / 100;
          } else {
            finalDiscount = ck_nt;
          }

          const thanh_tien = totalBeforeDiscount - finalDiscount;
          item.thanh_tien = thanh_tien.toFixed(0);

          newTongTien += thanh_tien;
          newTongSl += so_luong;
        });

        tab.master.tong_tien = newTongTien.toFixed(0);
        tab.master.tong_sl = newTongSl.toString();
      }
    },
    updateProductPrice: (state, action) => {
      const { index, newPrice } = action.payload;
      const tab = state.orders.find(
        (tab) => tab.internalId === state.internalActiveTabId
      );
      if (tab && tab.detail[index]) {
        const item = tab.detail[index];
        item.don_gia = newPrice;

        const mainTotal = newPrice * parseInt(item.so_luong || 0);
        const extrasTotal = (item.extras || []).reduce(
          (sum, extra) =>
            sum +
            parseFloat(extra.don_gia || extra.gia || 0) *
              parseInt(extra.so_luong || extra.quantity || 0) *
              parseInt(item.so_luong || 0),
          0
        );

        // Tính giảm giá
        const totalBeforeDiscount = mainTotal + extrasTotal;
        const tl_ck = parseFloat(item.tl_ck || 0);
        const ck_nt = parseFloat(item.ck_nt || 0);

        let finalDiscount = 0;
        if (tl_ck > 0) {
          finalDiscount = (totalBeforeDiscount * tl_ck) / 100;
        } else {
          finalDiscount = ck_nt;
        }

        item.thanh_tien = (totalBeforeDiscount - finalDiscount).toFixed(0);

        let tongTien = 0;
        let tongSl = 0;

        tab.detail.forEach((d) => {
          tongTien += parseFloat(d.thanh_tien) || 0;
          tongSl += parseInt(d.so_luong) || 0;
        });

        tab.master.tong_tien = tongTien.toFixed(0);
        tab.master.tong_sl = tongSl.toString();
      }
    },
    applyVoucherToProduct: (state, action) => {
      const { index } = action.payload;
      const tab = state.orders.find(
        (tab) => tab.internalId === state.internalActiveTabId
      );
      if (tab && tab.detail[index]) {
        tab.detail[index].ap_voucher = "1";
      }
    },
    updateProductMeal: (state, action) => {
      const {
        index,
        mealValue,
        mealLabel,
        mealDescription,
        mealShift,
        mealShiftLabel,
      } = action.payload;
      const tab = state.orders.find(
        (tab) => tab.internalId === state.internalActiveTabId
      );
      if (tab && tab.detail[index]) {
        const item = tab.detail[index];
        item.selected_meal = {
          value: mealValue,
          label: mealLabel,
          description: mealDescription,
          shift: mealShift,
          shiftLabel: mealShiftLabel,
        };

        // Lưu mã vật tư ban đầu vào gc_td1 (nếu chưa có)
        if (!item.gc_td1) {
          item.gc_td1 = item.ma_vt;
        }

        // Cập nhật ma_vt thành mã món suất đã chọn
        item.ma_vt = mealValue;

        // Lưu tên sản phẩm gốc vào ghi_chú (nối với ghi chú hiện có nếu có)
        const currentNote = item.ghi_chu || "";
        const originalProductName = item.ten_vt; // Tên sản phẩm gốc (ví dụ: "Cơm suất tối")

        if (currentNote && !currentNote.includes(originalProductName)) {
          // Nếu đã có ghi chú và chưa có tên sản phẩm gốc, nối thêm
          item.ghi_chu = `${currentNote}, ${originalProductName}`;
        } else if (!currentNote) {
          // Nếu chưa có ghi chú, tạo mới với tên sản phẩm gốc
          item.ghi_chu = originalProductName;
        }
        // Nếu đã có tên sản phẩm gốc trong ghi chú, không thêm nữa

        // Không thay đổi giá tiền gốc của món, chỉ lưu thông tin món suất đã chọn
        // item.don_gia giữ nguyên giá gốc
        // item.thanh_tien giữ nguyên tính toán dựa trên giá gốc

        // Cập nhật tổng tiền của tab (giữ nguyên logic tính toán dựa trên giá gốc)
        let tongTien = 0;
        let tongSl = 0;

        tab.detail.forEach((d) => {
          tongTien += parseFloat(d.thanh_tien) || 0;
          tongSl += parseInt(d.so_luong) || 0;
        });

        tab.master.tong_tien = tongTien.toFixed(0);
        tab.master.tong_sl = tongSl.toString();
      }
    },
    updateProductDiscount: (state, action) => {
      const { index, tl_ck, ck_nt } = action.payload;
      const tab = state.orders.find(
        (tab) => tab.internalId === state.internalActiveTabId
      );
      if (tab && tab.detail[index]) {
        const item = tab.detail[index];

        // Cập nhật giá trị giảm giá
        item.tl_ck = tl_ck.toString();
        item.ck_nt = ck_nt.toString();

        // Tính lại thanh_tien với giảm giá
        const mainTotal =
          parseFloat(item.don_gia || 0) * parseInt(item.so_luong || 0);
        const extrasTotal = (item.extras || []).reduce(
          (sum, extra) =>
            sum +
            parseFloat(extra.don_gia || extra.gia || 0) *
              parseInt(extra.so_luong || extra.quantity || 0) *
              parseInt(item.so_luong || 0),
          0
        );

        const totalBeforeDiscount = mainTotal + extrasTotal;
        const tl_ckValue = parseFloat(tl_ck || 0);
        const ck_ntValue = parseFloat(ck_nt || 0);

        let finalDiscount = 0;
        if (tl_ckValue > 0) {
          finalDiscount = (totalBeforeDiscount * tl_ckValue) / 100;
          // Tự động cập nhật ck_nt khi tl_ck > 0
          item.ck_nt = finalDiscount.toFixed(0);
        } else {
          finalDiscount = ck_ntValue;
        }

        item.thanh_tien = (totalBeforeDiscount - finalDiscount).toFixed(0);

        // Cập nhật tổng tiền của tab
        tab.master.tong_tien = tab.detail
          .reduce((sum, item) => sum + parseFloat(item.thanh_tien), 0)
          .toFixed(0);
      }
    },
    resetOrders: (state) => {
      Object.assign(state, {
        ...initialState,
        activeTabId: null,
        internalActiveTabId: null,
        orders: [],
      });
    },
    setCustomerInfo: (state, action) => {
      const {
        ong_ba = "",
        cccd = "",
        dia_chi = "",
        so_dt = "",
        email = "",
      } = action.payload || {};
      const tab = state.orders.find(
        (tab) => tab.internalId === state.internalActiveTabId
      );
      if (tab) {
        tab.master.ong_ba = ong_ba?.trim() || "";
        tab.master.cccd = cccd;
        tab.master.dia_chi = dia_chi;
        tab.master.so_dt = so_dt;
        tab.master.email = email;
      }
    },
    updateTabExtraProps: (state, action) => {
      const { internalId, ...rest } = action.payload;
      const tab = state.orders.find((tab) => tab.internalId === internalId);
      if (tab) {
        Object.assign(tab, rest);
      }
    },
  },
});

export const {
  addTab,
  removeTab,
  switchTab,
  addProductToTab,
  updateProductQuantity,
  removeProductFromTab,
  setListOrderTable,
  setListCategory,
  setCurrentCategory,
  setMenuItems,
  setSelectedItem,
  setListItemExtra,
  addExtrasToOrder,
  updateProductPrice,
  updateTabTableName,
  clearTabData,
  setListOrderInfo,
  addOrderFromSignal,
  applyVoucherToProduct,
  updateProductMeal,
  resetOrders,
  setCustomerInfo,
  updateTabExtraProps,
  updateProductDiscount,
} = orders.actions;

export default orders.reducer;
