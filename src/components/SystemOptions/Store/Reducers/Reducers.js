import { createSlice } from "@reduxjs/toolkit";

const initStruct = {
  account: {
    currentSteps: 0,
    totalSteps: 2,
    currentAccount: {},
    currentAvatar: "",
    currentPermissions: [],
    currentGroupsPermission: [],
    currentUnitsPermission: [],
    changedPermissions: false,
  },
  allClaims: [],
};

const AccountsInfo = createSlice({
  name: "AccountsInfo",
  initialState: { ...initStruct },
  reducers: {
    setCurrentStep(state, action) {
      state.account.currentSteps = action?.payload;
    },
    setCurrentAccount(state, action) {
      state.account.currentAccount = action?.payload;
    },
    setCurrentAvatar(state, action) {
      state.account.currentAvatar = action?.payload;
    },
    setCurrentPermissions(state, action) {
      state.account.currentPermissions = action?.payload;
    },
    setAllClaims(state, action) {
      state.allClaims = action?.payload;
    },
    setChangedPermissions(state, action) {
      state.account.changedPermissions = action?.payload;
    },

    setCurrentGroupPermission(state, action) {
      state.account.currentGroupsPermission = action?.payload;
    },
    setCurrentUnitsPermission(state, action) {
      state.account.currentUnitsPermission = action?.payload;
    },
  },
});

export const { reducer: AccountsReducer, actions } = AccountsInfo;
