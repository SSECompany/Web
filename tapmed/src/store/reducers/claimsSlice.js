import { createSlice } from "@reduxjs/toolkit";

const claims = createSlice({
  name: "claims",
  initialState: {
    claims: [],
    textTest: "",
    refreshToken: "",
    tokenExpiry: null,
    userInfo: {
      fullName: "",
      storeId: "",
      storeName: "",
      userName: "",
      role: "",
      roleName: "",
      unitId: "",
      unitName: "",
      isPremium: false,
      id: 0,
    },
    userSetting: {},
    isBackgound: false,
    isHideNav: false,
  },
  reducers: {
    setClaims(state, action) {
      state.claims = action?.payload;
      state.userInfo = {
        userName: action?.payload?.Name,
        role: action?.payload?.RoleId,
        roleName: action?.payload?.Role,
        unitId: action?.payload?.MA_DVCS,
        unitName: action?.payload?.DVCS,
        storeId: action?.payload?.Store || "",
        storeName: action?.payload?.StoreName || "",
        fullName: action?.payload?.FullName || "",
        isPremium: false,
        id: parseInt(action?.payload?.Id),
      };
    },
    setRefreshToken(state, action) {
      state.refreshToken = action?.payload;
    },
    setTokenExpiry(state, action) {
      state.tokenExpiry = action?.payload;
    },
    setUserSetting(state, action) {
      state.userSetting = action?.payload;
    },
    setIsBackgrouds(state, action) {
      state.isBackgound = action?.payload;
    },
    setText(state, action) {
      state.textTest = action?.payload;
    },

    setIsHideNav(state, action) {
      state.isHideNav = action?.payload;
    },
  },
});

const claimsReducer = claims.reducer;
export default claimsReducer;
export const {
  setClaims,
  setRefreshToken,
  setTokenExpiry,
  setText,
  setIsBackgrouds,
  setIsHideNav,
  setUserSetting,
} = claims.actions;
