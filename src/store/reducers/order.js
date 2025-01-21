import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    activeTabId: null,
    orders: [],
    listOrderTable: [],
    listCategory: [],
    selectedCategory: {
        loai_nh: 1,
        ma_nh: "DOAN",
        ten_nh: "DOAN",
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
            const { tableName, tableId } = action.payload;
            const existingTab = state.orders.find((tab) => tab.tableId === tableId);
            if (!existingTab) {
                state.orders.push({
                    tableName,
                    tableId,
                    master: {
                        dien_giai: "",
                        tong_tien: "0",
                        tong_sl: "0",
                        tien_mat: "0",
                        qr: "0",
                        httt: "",
                    },
                    detail: [],
                });
            }
            state.activeTabId = tableId;
        },
        addProductToTab: (state, action) => {
            const { tableId, product } = action.payload;
            const tab = state.orders.find((tab) => tab.tableId === tableId);

            if (tab) {
                const existingProduct = tab.detail.find(
                    (item) => item.ma_vt === product.id
                );
                if (existingProduct) {
                    existingProduct.so_luong = (
                        parseInt(existingProduct.so_luong) + 1
                    ).toString();

                    existingProduct.thanh_tien = (
                        parseFloat(existingProduct.don_gia) * parseInt(existingProduct.so_luong)
                    );
                } else {
                    tab.detail.push({
                        ma_vt: product.id,
                        ten_vt: product.name,
                        ma_vt_root: "",
                        so_luong: 1,
                        don_gia: product.price,
                        thanh_tien: product.price,
                        ghi_chu: "",
                        extras: [],
                    });
                }

                tab.master.tong_tien = tab.detail
                    .reduce((sum, item) => sum + parseFloat(item.thanh_tien), 0)
                    .toFixed(0);

                tab.master.tong_sl = tab.detail
                    .reduce((sum, item) => sum + parseInt(item.so_luong), 0)
                    .toString();
            }
        },
        addExtrasToOrder: (state, action) => {
            const { tableId, orderIndex, extras, note } = action.payload;
            const tab = state.orders.find((tab) => tab.tableId === tableId);

            if (tab) {
                const mainProduct = tab.detail[orderIndex];
                if (mainProduct) {
                    mainProduct.extras = extras.map((extra) => {
                        const existingExtra = mainProduct.extras?.find(
                            (e) => e.ma_vt === extra.ma_vt
                        );
                        return {
                            ...extra,
                            quantity: existingExtra
                                ? Math.max(1, extra.quantity)
                                : extra.quantity,
                        };
                    });
                    mainProduct.ghi_chu = note;

                    const extrasTotal = mainProduct.extras.reduce(
                        (sum, extra) => sum + (extra.gia || 0) * extra.quantity,
                        0
                    );

                    mainProduct.thanh_tien = (
                        parseFloat(mainProduct.don_gia) * mainProduct.so_luong +
                        extrasTotal
                    ).toFixed(0);

                    tab.master.tong_tien = tab.detail
                        .reduce((sum, item) => sum + parseFloat(item.thanh_tien), 0)
                        .toFixed(0);

                    tab.master.tong_sl = tab.detail
                        .reduce((sum, item) => sum + parseInt(item.so_luong), 0)
                        .toString();
                }
            }
        },
        updateProductQuantity: (state, action) => {
            const { tableId, productIndex, increment } = action.payload;
            const tab = state.orders.find((tab) => tab.tableId === tableId);

            if (tab && tab.detail[productIndex]) {
                const product = tab.detail[productIndex];
                const newQuantity = Math.max(1, parseInt(product.so_luong) + increment);

                product.so_luong = newQuantity.toString();

                const extrasTotal = product.extras?.reduce(
                    (sum, extra) => sum + (extra.gia || 0) * extra.quantity,
                    0
                ) || 0;

                product.thanh_tien = (
                    parseFloat(product.don_gia) * newQuantity +
                    extrasTotal
                ).toFixed(0);

                tab.master.tong_tien = tab.detail
                    .reduce((sum, item) => sum + parseFloat(item.thanh_tien), 0)
                    .toFixed(0);
                tab.master.tong_sl = tab.detail
                    .reduce((sum, item) => sum + parseInt(item.so_luong), 0)
                    .toString();
            }
        },

        removeProductFromTab: (state, action) => {
            const { tableId, productIndex } = action.payload;
            const tab = state.orders.find((tab) => tab.tableId === tableId);

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
            const { tableId } = action.payload;
            state.orders = state.orders.filter((tab) => tab.tableId !== tableId);
            if (state.activeTabId === tableId) {
                state.activeTabId = state.orders.length ? state.orders[0].tableId : null;
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
        switchTab: (state, action) => {
            const newActiveTabId = action.payload;
            const tabExists = state.orders.find((tab) => tab.tableId === newActiveTabId);
            if (tabExists) {
                state.activeTabId = newActiveTabId;
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
    updateMasterData,
} = orders.actions;

export default orders.reducer;