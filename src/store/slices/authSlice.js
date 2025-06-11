import { createSlice } from "@reduxjs/toolkit";

// 🚀 Helper functions để optimize performance và safety
const safeParseJSON = (item, fallback = {}) => {
  try {
    const stored = localStorage.getItem(item);
    return stored ? JSON.parse(stored) : fallback;
  } catch (error) {
    console.error(`❌ Error parsing ${item} from localStorage:`, error);
    return fallback;
  }
};

const computeUserInfo = (user, unitsResponse) => ({
  userId: user?.userId || 4061,
  userName: user?.userName || "",
  unitId: user?.unitId || unitsResponse?.unitId || "VIKOSAN",
  unitName: user?.unitName || unitsResponse?.unitName || "VIKOSAN",
});

const safeSetLocalStorage = (key, value) => {
  try {
    localStorage.setItem(
      key,
      typeof value === "string" ? value : JSON.stringify(value)
    );
  } catch (error) {
    console.error(`❌ Error setting ${key} to localStorage:`, error);
  }
};

const safeRemoveLocalStorage = (key) => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`❌ Error removing ${key} from localStorage:`, error);
  }
};

// 🔥 Initialize với safe parsing
const initialUser = safeParseJSON("user");
const initialUnitsResponse = safeParseJSON("unitsResponse");
const initialToken = localStorage.getItem("access_token");

const authSlice = createSlice({
  name: "auth",
  initialState: {
    token: initialToken,
    user: initialUser,
    unitsResponse: initialUnitsResponse,
    isAuthenticated: !!initialToken,
    userInfo: computeUserInfo(initialUser, initialUnitsResponse),
    error: null,
    isLoading: false,
    lastLogin: localStorage.getItem("last_login") || null,
  },
  reducers: {
    setLoading: (state, action) => {
      state.isLoading = action.payload;
      state.error = null;
    },

    setError: (state, action) => {
      state.error = action.payload;
      state.isLoading = false;
    },

    clearError: (state) => {
      state.error = null;
    },

    setToken: (state, action) => {
      const token = action.payload;
      state.token = token;
      state.isAuthenticated = !!token;
      state.error = null;

      if (token) {
        safeSetLocalStorage("access_token", token);
        safeSetLocalStorage("last_login", new Date().toISOString());
        state.lastLogin = new Date().toISOString();
      } else {
        safeRemoveLocalStorage("access_token");
        safeRemoveLocalStorage("last_login");
        state.lastLogin = null;
      }
    },

    setUser: (state, action) => {
      const userData = action.payload;
      state.user = userData;
      state.error = null;

      safeSetLocalStorage("user", userData);

      // 🚀 Optimized userInfo computation
      state.userInfo = computeUserInfo(userData, state.unitsResponse);
    },

    setUnitsResponse: (state, action) => {
      const unitsData = action.payload;
      state.unitsResponse = unitsData;
      state.error = null;

      safeSetLocalStorage("unitsResponse", unitsData);

      // 🚀 Optimized userInfo computation
      state.userInfo = computeUserInfo(state.user, unitsData);
    },

    updateUserInfo: (state) => {
      // 🚀 Manual trigger để recompute userInfo
      state.userInfo = computeUserInfo(state.user, state.unitsResponse);
    },

    login: (state, action) => {
      const { token, user, unitsResponse } = action.payload;

      state.token = token;
      state.user = user || {};
      state.unitsResponse = unitsResponse || {};
      state.isAuthenticated = !!token;
      state.error = null;
      state.isLoading = false;
      state.lastLogin = new Date().toISOString();

      // 🚀 Batch localStorage operations
      if (token) safeSetLocalStorage("access_token", token);
      if (user) safeSetLocalStorage("user", user);
      if (unitsResponse) safeSetLocalStorage("unitsResponse", unitsResponse);
      safeSetLocalStorage("last_login", state.lastLogin);

      state.userInfo = computeUserInfo(state.user, state.unitsResponse);
    },

    logout: (state) => {
      // 🚀 Complete cleanup
      state.token = null;
      state.user = {};
      state.unitsResponse = {};
      state.isAuthenticated = false;
      state.error = null;
      state.isLoading = false;
      state.lastLogin = null;
      state.userInfo = {
        userId: null,
        userName: "",
        unitId: "",
        unitName: "",
      };

      // 🚀 Batch localStorage cleanup
      ["access_token", "user", "unitsResponse", "last_login"].forEach(
        safeRemoveLocalStorage
      );
    },

    refreshUserInfo: (state) => {
      // 🚀 Force refresh from localStorage (useful after external changes)
      const freshUser = safeParseJSON("user");
      const freshUnits = safeParseJSON("unitsResponse");
      const freshToken = localStorage.getItem("access_token");

      state.user = freshUser;
      state.unitsResponse = freshUnits;
      state.token = freshToken;
      state.isAuthenticated = !!freshToken;
      state.userInfo = computeUserInfo(freshUser, freshUnits);
    },
  },
});

export const {
  setLoading,
  setError,
  clearError,
  setToken,
  setUser,
  setUnitsResponse,
  updateUserInfo,
  login,
  logout,
  refreshUserInfo,
} = authSlice.actions;

export default authSlice.reducer;

// 🚀 Optimized Selectors với memoization
export const selectToken = (state) => state.auth.token;
export const selectUser = (state) => state.auth.user;
export const selectUserInfo = (state) => state.auth.userInfo;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectAuthError = (state) => state.auth.error;
export const selectAuthLoading = (state) => state.auth.isLoading;
export const selectLastLogin = (state) => state.auth.lastLogin;

// 🚀 Compound selectors
export const selectUserDisplay = (state) => {
  const userInfo = state.auth.userInfo;
  return userInfo.userName || userInfo.unitName || "Unknown User";
};

export const selectIsValidSession = (state) => {
  const { isAuthenticated, lastLogin } = state.auth;
  if (!isAuthenticated || !lastLogin) return false;

  // Check if session is less than 24 hours old
  const sessionAge = Date.now() - new Date(lastLogin).getTime();
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours

  return sessionAge < maxAge;
};
