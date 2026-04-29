import { createSlice } from "@reduxjs/toolkit";

const saleOrderInitial = {
  isOpenFilter: false,
  loading: false,
  currentStep: 0,
  action: "VIEW",
  saleOrderList: { columns: [], dataSource: [], totalRecords: 0 },
  currentItemId: "",
  masterInfo: { ma_kh: null, ten_kh: null, ghi_chu: null },
  detailInfo: { columns: [], data: [] },
  insertDetails: [],
  promotionItemsInfo: [],
  paymentInfo: {
    t_so_luong: 0,
    t_tt: 0,
    t_tien: 0,
    t_thue: 0,
    t_ck: 0,
    httt: "",
    stk: "",
    voucher: "",
    MST: "",
    ma_nt: "",
    han_tt: "",
    nguoi_nhan: "",
    dien_thoai: "",
    dia_chi: "",
    ht_vc: "",
    dv_vc: "",
    phi_vc: "",
    ngay_nhan: undefined,
  },
  filterInfo: {
    ma_kh: "",
    ten_kh: "",
    dia_chi: "",
    dien_thoai: "",
    so_tu: "",
    so_den: "",
    searchKey: "",
  },
};

const saleOrderSlice = createSlice({
  name: "saleOrderSlice",
  initialState: { ...saleOrderInitial },
  reducers: {
    setLoading(state, action) {
      state.loading = action?.payload;
    },
    setIsOpenFilter(state, action) {
      state.isOpenFilter = action?.payload;
    },
    setCurrentStep(state, action) {
      state.currentStep = action?.payload;
    },
    setAction(state, action) {
      state.action = action?.payload;
    },

    setSaleOrderList(state, action) {
      state.saleOrderList = action?.payload;
    },

    setCurrentItemId(state, action) {
      state.currentItemId = action?.payload;
    },

    setMasterSaleOrderInfo(state, action) {
      state.masterInfo = action?.payload;
    },

    setDetailSaleOrderInfo(state, action) {
      state.detailInfo = action?.payload;
    },

    setPromotionItemsInfo(state, action) {
      state.promotionItemsInfo = action?.payload;
    },

    setPaymentSaleOrderInfo(state, action) {
      state.paymentInfo = action?.payload;
    },

    setSaleOrderInsertDetails(state, action) {
      state.insertDetails = action?.payload;
    },

    resetForm(state, action) {
      state.currentItemId = saleOrderInitial.currentItemId;
      state.paymentInfo = saleOrderInitial.paymentInfo;
      state.masterInfo = saleOrderInitial.masterInfo;
    },

    resetSaleOrder: () => saleOrderInitial,
  },
});

export const { reducer: saleOrderReducer, actions: saleOrderAction } =
  saleOrderSlice;
