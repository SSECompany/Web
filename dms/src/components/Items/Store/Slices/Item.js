import { createSlice } from "@reduxjs/toolkit";
import { formStatus } from "../../../../utils/constants";

const ItemsInitial = {
  currentItem: {},
  isOpenModal: false,
  openType: formStatus.VIEW,
};

const itemsList = createSlice({
  name: "itemsList",
  initialState: { ...ItemsInitial },
  reducers: {
    setCurrentItem(state, action) {
      state.currentItem = action?.payload;
    },
    setIsOpenModal(state, action) {
      state.isOpenModal = action?.payload;
    },
    setIsOpenType(state, action) {
      state.openType = action?.payload;
    },
  },
});

export const { reducer: itemsListReducer, actions } = itemsList;
