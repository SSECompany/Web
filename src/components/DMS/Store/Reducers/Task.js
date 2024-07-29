import { createSlice } from "@reduxjs/toolkit";

const taskInitial = {
  detailData: [],
};

const taskSlice = createSlice({
  name: "task",
  initialState: { ...taskInitial },
  reducers: {
    setDetailData(state, action) {
      state.detailData = action?.payload;
    },
  },
});

export const { reducer: taskReducer, actions } = taskSlice;
