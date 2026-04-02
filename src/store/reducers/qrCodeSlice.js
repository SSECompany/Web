import { createSlice } from "@reduxjs/toolkit";

const qrCodeSlice = createSlice({
  name: "qrCode",
  initialState: {
    qrCodeData: null, // Lưu toàn bộ response từ API api_GetQRCodeData
    qrPayload: null, // Chuỗi mã QR (EMV payload) để hiển thị
    unitId: null, // unitId đã fetch
    loading: false,
    error: null,
  },
  reducers: {
    setQRCodeData(state, action) {
      const { qrCodeData, qrPayload, unitId } = action.payload;
      state.qrCodeData = qrCodeData;
      state.qrPayload = qrPayload || null;
      state.unitId = unitId || null;
      state.loading = false;
      state.error = null;
    },
    setQRPayload(state, action) {
      // Cho phép set QR payload trực tiếp từ query param hoặc nguồn khác
      state.qrPayload = action.payload;
    },
    setQRCodeLoading(state, action) {
      state.loading = action.payload;
    },
    setQRCodeError(state, action) {
      state.error = action.payload;
      state.loading = false;
    },
    clearQRCodeData(state) {
      state.qrCodeData = null;
      state.qrPayload = null;
      state.unitId = null;
      state.loading = false;
      state.error = null;
    },
  },
});

const qrCodeReducer = qrCodeSlice.reducer;
export default qrCodeReducer;
export const {
  setQRCodeData,
  setQRPayload,
  setQRCodeLoading,
  setQRCodeError,
  clearQRCodeData,
} = qrCodeSlice.actions;
