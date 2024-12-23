import { createSlice } from "@reduxjs/toolkit";

const initial = {
  currentOrder: 1,
  listOrder: [1],
  isScanning: false,
  fetchListParams: {
    so_ct: "",
    ma_kho: "",
    ten_kho_xuat: "",
    pageIndex: 1,
    pageSize: 10,
  },
  isAddNewCustomer:{
    open:false,
    value:''
  },
  valueAddNewCustomer:'',
  isFormLoading: false,
  isOpenPromotion: false,
  isPromotionLoading: false,
  openListTransfer:false
};

const TransferSlice = createSlice({
  name: "Transfer",
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
    setIsAddNewCustomer: (state, action) => {
      state.isAddNewCustomer = action.payload;
    },
    setOpenListTransfer:(state,action)=>{
      state.openListTransfer =action.payload;
    },

    reset: () => initial,
  },
});

export const { actions: TransferActions, reducer: TransferReducer } =
TransferSlice;
