import { createSlice } from "@reduxjs/toolkit";

const customerInitial = {};

const claims = createSlice({
  name: "DMSCustomers",
  initialState: { Customers: [], CurrentCustomer: {}, activeTab: "" },
  reducers: {
    setDMSCustomers(state, action) {
      state.Customers = action?.payload;
    },
    setCurrentDMSCustomer(state, action) {
      state.CurrentCustomer = action?.payload;
    },
    setActiveTab(state, action) {
      state.activeTab = action?.payload;
    },
  },
});

export const { reducer: DMSCustomersReducer, actions } = claims;
