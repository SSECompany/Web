import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  boxlys: {
    masterData: {},
    detailData: [{}],
  },
};

const boxlySlice = createSlice({
  name: "boxlys",
  initialState,
  reducers: {},
});

export const {} = boxlySlice.actions;

export default boxlySlice.reducer;
