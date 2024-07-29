import { createSlice } from "@reduxjs/toolkit";
import { formStatus } from "../../../../utils/constants";

const ItemsInitial = {
  currentItem: {},
  isOpenModal: false,
  action: formStatus.VIEW,
};

const KPIPlans = createSlice({
  name: "KPIPlans",
  initialState: { ...ItemsInitial },
  reducers: {
    setCurrentAction(state, action) {
      state.action = action?.payload;
    },
    setCurrentItem(state, action) {
      state.currentItem = action?.payload;
    },
    setIsOpenModal(state, action) {
      state.isOpenModal = action?.payload;
    },
  },
});

export const { reducer: KPIPlansReducer, actions } = KPIPlans;
