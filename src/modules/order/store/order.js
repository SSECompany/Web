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
        ong_ba: "KH CĂNG TIN",
        so_dt: "",
        dia_chi: "",
        cccd: "",
        email: "",
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
        const thanh_tien = don_gia * so_luong + extrasTotal;

        tong_tien += thanh_tien;
        tong_sl += so_luong;

        return {
          ...item,
          thanh_tien: thanh_tien.toFixed(0),
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
        ...Object.fromEntries(
          Object.entries(action.payload).filter(
            ([key]) => ![
              'tableName',
              'tableId',
              'isRealtime',
              'master',
              'detail',
              'roleWeb',
              'internalId'
            ].includes(key)
          )
        )
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
      let tab = state.orders.find(
        (tab) => tab.internalId === internalId
      );
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
      let tab = state.orders.find(
        (tab) => tab.internalId === internalId
      );
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

          mainProduct.thanh_tien = (mainTotal + extrasTotal).toFixed(0);

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

        product.thanh_tien = (mainTotal + extrasTotal).toFixed(0);

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
      state.orders = state.orders.filter((tab) => tab.internalId !== internalId);
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
          ong_ba: "KH CĂNG TIN",
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

          const thanh_tien = don_gia * so_luong + extrasTotal;
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

        item.thanh_tien = (mainTotal + extrasTotal).toFixed(0);

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
        tab.master.ong_ba = ong_ba?.trim() || "KH CĂNG TIN";
        tab.master.cccd = cccd;
        tab.master.dia_chi = dia_chi;
        tab.master.so_dt = so_dt;
        tab.master.email = email;
      }
    },
    updateTabExtraProps: (state, action) => {
      const { internalId, ...rest } = action.payload;
      const tab = state.orders.find(tab => tab.internalId === internalId);
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
  resetOrders,
  setCustomerInfo,
  updateTabExtraProps
} = orders.actions;

export default orders.reducer;
