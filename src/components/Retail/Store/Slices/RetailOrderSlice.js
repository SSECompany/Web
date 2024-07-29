import { createSlice } from "@reduxjs/toolkit";

const initial = {
  currentOrder: 1,
  listOrder: [1],
  isScanning: false,
  fetchListParams: {
    so_ct: "",
    ngay_ct: "",
    ma_kh: "",
    ten_kh: "",
    dien_thoai: "",
    pageIndex: 1,
    pageSize: 10,
  },
  isFormLoading: false,
  isOpenPromotion: false,
  isPromotionLoading: false,
};

const retailOrderSlice = createSlice({
  name: "retailOrder",
  initialState: initial,
  reducers: {
    setCurrentOrder: (state, action) => {
      state.currentOrder = action?.payload;
    },

    setIsOpenPromotion: (state, action) => {
      state.isOpenPromotion = action?.payload;
    },

    setIsPromotionLoading: (state, action) => {
      state.isPromotionLoading = action?.payload;
    },

    setIsFormLoading: (state, action) => {
      state.isFormLoading = action?.payload;
    },

    setIsScanning: (state, action) => {
      state.isScanning = action?.payload;
    },

    setListOrder: (state, action) => {
      state.listOrder = action?.payload;
    },

    setFetchListParams: (state, action) => {
      state.fetchListParams = action?.payload;
    },

    resetFetchListParams: (state, action) => {
      state.fetchListParams = initial.fetchListParams;
    },

    reset: () => initial,
  },
});

export const { actions: retailOrderActions, reducer: retailOrderReducer } =
  retailOrderSlice;
