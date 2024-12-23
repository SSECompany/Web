import { createSlice } from "@reduxjs/toolkit";

const ItemsInitial = {
  currentItem: {},
  isOpenModal: false,
};

const KPIList = createSlice({
  name: "KPIList",
  initialState: { ...ItemsInitial },
  reducers: {
    setCurrentItem(state, action) {
      state.currentItem = action?.payload;
    },
    setIsOpenModal(state, action) {
      state.isOpenModal = action?.payload;
    },
  },
});

export const { reducer: KPIListReducer, actions: KPIListActions } = KPIList;
