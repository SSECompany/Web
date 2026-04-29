import { createSlice } from "@reduxjs/toolkit";

const tourDetailsInitial = {
  detailData: [],
};

const tourDetails = createSlice({
  name: "tourDetails",
  initialState: { ...tourDetailsInitial },
  reducers: {
    setDetailData(state, action) {
      state.detailData = action?.payload;
    },
  },
});

export const { reducer: tourDetailsReducer, actions } = tourDetails;
