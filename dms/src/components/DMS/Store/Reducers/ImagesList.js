import { createSlice } from "@reduxjs/toolkit";

const Initial = {
  currentImageIndex: 0,
  currentImagesList: [],
};

const claims = createSlice({
  name: "imageList",
  initialState: { ...Initial },
  reducers: {
    setCurrentImagesList(state, action) {
      state.currentImagesList = action?.payload;
    },
    setCurrentImageIndex(state, action) {
      state.currentImageIndex = action?.payload;
    },
  },
});

export const { reducer: imagesListReducer, actions } = claims;
