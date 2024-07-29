import { createSlice } from "@reduxjs/toolkit";

const initial = {
  isSideBarLoading: false,
  isSideBarColappsed: false,
  isFooterColappsed: true,
  isFooterLoading: false,
  tourSelected: "",
  tourList: [],

  isMapLoading: false,
  currentPoints: [],

  customerSelected: "",
  positionSelected: { lat: 0, lng: 0 },
};

const reducer = createSlice({
  name: "BusinessMapState",
  initialState: { ...initial },
  reducers: {
    setSideBarLoading(state, action) {
      state.isSideBarLoading = action?.payload;
    },

    setIsSideBarColappsed(state, action) {
      state.isSideBarColappsed = action?.payload;
    },

    setFooterLoading(state, action) {
      state.isFooterLoading = action?.payload;
    },

    setIsFooterColappsed(state, action) {
      state.isFooterColappsed = action?.payload;
    },

    setCustomerSelected(state, action) {
      state.customerSelected = action?.payload;
    },

    setPositionSelected(state, action) {
      state.positionSelected = action?.payload;
    },

    setTourList(state, action) {
      state.tourList = action?.payload;
    },

    setTourSelected(state, action) {
      state.tourSelected = action?.payload;
    },

    setIsMapLoading(state, action) {
      state.isMapLoading = action?.payload;
    },

    setCurentPoints(state, action) {
      state.currentPoints = action?.payload;
    },

    reset: () => initial,
  },
});

export const { reducer: businessMapReducer, actions } = reducer;
