import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  Data: {
    orderDate: "",
    master: {
      stt_rec: "",
      ma_dvcs: "",
      ma_ct: "",
      loai_ct: "",
      so_lo: "",
      ngay_lo: null,
      ma_nk: "",
      ma_gd: "",
      ngay_lct: "",
      ngay_ct: "",
      so_ct: "",
      ma_nt: "",
      ty_gia: 0,
      ong_ba: "",
      ma_kh: "",
      dien_giai: "",
      t_so_luong: 0,
      t_tien_nt: 0,
      t_tien: 0,
      nam: 0,
      ky: 0,
      status: "",
      datetime0: "",
      datetime2: "",
      user_id0: 0,
      user_id2: 0,
    },
    detail: [
      {
        stt_rec: "",
        stt_rec0: "",
        ma_ct: "",
        ngay_ct: "",
        so_ct: "",
        ma_vt: "",
        ma_sp: "",
        ma_bp: "",
        so_lsx: "",
        dvt: "",
        he_so: 0,
        ma_kho: "",
        ma_vi_tri: "",
        ma_lo: "",
        ma_vv: "",
        ma_nx: "",
        tk_du: "",
        tk_vt: "",
        so_luong: 0,
        gia_nt: 0,
        gia: 0,
        tien_nt: 0,
        tien: 0,
        pn_gia_tb: false,
        stt_rec_px: "",
        stt_rec0px: "",
        line_nbr: 0,
      },
    ],
  },
  // Các state cho danh sách dùng chung
  vatTuList: [],
  loadingVatTu: false,
  maGiaoDichList: [],
  tkCoList: [],
  loadingTkCo: false,
  maKhoList: [],
  loadingMaKho: false,
  maKhachList: [],
  loadingMaKhach: false,
  formData: {
    soPhieu: "",
    ngay: "",
    maGiaoDich: "",
    maCt: "",
    donViTienTe: "VND",
    tyGia: 1,
    trangThai: "3",
    maKhach: "",
    dienGiai: "",
  },
  dataSource: [],
  // Trạng thái khởi tạo
  initialized: false,
  globalLoading: false,
};

const boxlySlice = createSlice({
  name: "boxly",
  initialState,
  reducers: {
    setBoxlyData: (state, action) => {
      state.Data = action.payload;
    },
    resetBoxlyData: (state) => {
      return initialState;
    },

    // Reducers cho vật tư
    setVatTuList: (state, action) => {
      state.vatTuList = action.payload;
    },
    setLoadingVatTu: (state, action) => {
      state.loadingVatTu = action.payload;
    },

    // Reducers cho mã giao dịch
    setMaGiaoDichList: (state, action) => {
      state.maGiaoDichList = action.payload;
    },

    // Reducers cho tài khoản có
    setTkCoList: (state, action) => {
      state.tkCoList = action.payload;
    },
    setLoadingTkCo: (state, action) => {
      state.loadingTkCo = action.payload;
    },

    // Reducers cho mã kho
    setMaKhoList: (state, action) => {
      state.maKhoList = action.payload;
    },
    setLoadingMaKho: (state, action) => {
      state.loadingMaKho = action.payload;
    },

    // Reducers cho mã khách
    setMaKhachList: (state, action) => {
      state.maKhachList = action.payload;
    },
    setLoadingMaKhach: (state, action) => {
      state.loadingMaKhach = action.payload;
    },

    // Reducers cho form data
    setFormData: (state, action) => {
      state.formData = action.payload;
    },
    updateFormField: (state, action) => {
      state.formData = {
        ...state.formData,
        [action.payload.field]: action.payload.value,
      };
    },

    // Reducers cho data source (bảng vật tư)
    setDataSource: (state, action) => {
      state.dataSource = action.payload;
    },
    addVatTuToDataSource: (state, action) => {
      const { vatTu, soLuong = 1 } = action.payload;
      const existingIndex = state.dataSource.findIndex(
        (item) => item.maHang === vatTu.ma_vt.trim()
      );

      if (existingIndex >= 0) {
        state.dataSource[existingIndex].soLuong += soLuong;
      } else {
        state.dataSource.push({
          key: state.dataSource.length + 1,
          maHang: vatTu.ma_vt.trim(),
          soLuong: soLuong,
          noiDung: vatTu.ten_vt,
          dvt: vatTu.dvt,
          tk_vt: vatTu.tk_vt || "",
          vatTuInfo: vatTu,
        });
      }
    },
    updateDataSourceItem: (state, action) => {
      const { index, field, value } = action.payload;
      if (state.dataSource[index]) {
        state.dataSource[index][field] = value;
      }
    },

    // Trạng thái khởi tạo và loading
    setInitialized: (state, action) => {
      state.initialized = action.payload;
    },
    setGlobalLoading: (state, action) => {
      state.globalLoading = action.payload;
    },

    // Xóa toàn bộ store để làm mới
    clearStore: () => initialState,
  },
});

export const {
  setBoxlyData,
  resetBoxlyData,
  setVatTuList,
  setLoadingVatTu,
  setMaGiaoDichList,
  setTkCoList,
  setLoadingTkCo,
  setMaKhoList,
  setLoadingMaKho,
  setMaKhachList,
  setLoadingMaKhach,
  setFormData,
  updateFormField,
  setDataSource,
  addVatTuToDataSource,
  updateDataSourceItem,
  setInitialized,
  setGlobalLoading,
  clearStore,
} = boxlySlice.actions;

export default boxlySlice.reducer;
