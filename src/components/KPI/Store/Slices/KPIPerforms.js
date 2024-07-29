import { createSlice } from "@reduxjs/toolkit";

const ItemsInitial = {
  currentItem: {},
  isOpenModal: false,
  isOpenFilterModal: false,
};

const KPIPerform = createSlice({
  name: "KPIPlans",
  initialState: { ...ItemsInitial },
  reducers: {
    setCurrentItem(state, action) {
      state.currentItem = action?.payload;
    },
    setIsOpenModal(state, action) {
      state.isOpenModal = action?.payload;
    },
    setIsOpenFilterModal(state, action) {
      state.isOpenFilterModal = action?.payload;
    },
  },
});

export const { reducer: KPIPerformReducer, actions } = KPIPerform;
