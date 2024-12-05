import { createSlice } from "@reduxjs/toolkit";

const refundSlice = createSlice({
  name: "refunds",
  initialState: {
    refunds: {
      data: [],
    },
    total: 0,
  },
  reducers: {
    setRefundData(state, action) {
      if (state.refunds.data && state.refunds.data.length > 0) {
        state.refunds.data = [...state.refunds.data, ...action.payload.data];
      } else {
        state.refunds = action.payload;
      }
      state.total = state.refunds.data.reduce(
        (sum, item) => sum + (item.thanh_tien || 0),
        0
      );
    },
    addRefundData(state, action) {
      state.refunds.data.push(action.payload);
      state.total += action.payload.thanh_tien || 0;
    },
    setTotal(state, action) {
      if (Array.isArray(action.payload)) {
        const updatedTotal = action.payload.reduce(
          (sum, item) => sum + (item.thanh_tien || 0),
          0
        );
        state.total = updatedTotal;
      } else {
        state.total = action.payload || 0;
      }
    }
  },
});

export const { setRefundData, addRefundData, setTotal } = refundSlice.actions;

export default refundSlice.reducer;
