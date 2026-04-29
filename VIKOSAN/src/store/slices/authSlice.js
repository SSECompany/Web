import { createSlice } from "@reduxjs/toolkit";
import {
    calculateTokenExpiry,
    isTokenExpired as checkTokenExpired,
} from "../../utils/tokenUtils";

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

// Utilities imported at top

// Local wrapper để maintain API consistency
const isTokenExpired = (expiryTime) => {
  return checkTokenExpired(expiryTime);
};

// 🔥 Initialize với safe parsing
const initialUser = safeParseJSON("user");
const initialUnitsResponse = safeParseJSON("unitsResponse");
const initialToken = localStorage.getItem("access_token");
const initialRefreshToken = localStorage.getItem("refresh_token");
const initialTokenExpiry = parseInt(
  localStorage.getItem("token_expiry") || "0"
);

const authSlice = createSlice({
  name: "auth",
  initialState: {
    token: initialToken,
    refreshToken: initialRefreshToken,
    tokenExpiry: initialTokenExpiry,
    user: initialUser,
    unitsResponse: initialUnitsResponse,
    isAuthenticated: !!initialToken && !isTokenExpired(initialTokenExpiry),
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
        // Không tự động set expiry mới, giữ nguyên expiry từ localStorage
        safeSetLocalStorage("access_token", token);
        safeSetLocalStorage("last_login", new Date().toISOString());
        state.lastLogin = new Date().toISOString();
      } else {
        safeRemoveLocalStorage("access_token");
        safeRemoveLocalStorage("token_expiry");
        safeRemoveLocalStorage("last_login");
        state.lastLogin = null;
        state.tokenExpiry = null;
      }
    },

    setRefreshToken: (state, action) => {
      const refreshToken = action.payload;
      state.refreshToken = refreshToken;

      if (refreshToken) {
        safeSetLocalStorage("refresh_token", refreshToken);
      } else {
        safeRemoveLocalStorage("refresh_token");
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
      const { token, refreshToken, user, unitsResponse } = action.payload;

      state.token = token;
      state.refreshToken = refreshToken;
      state.user = user || {};
      state.unitsResponse = unitsResponse || {};
      state.isAuthenticated = !!token;
      state.error = null;
      state.isLoading = false;
      state.lastLogin = new Date().toISOString();

      // Thiết lập thời gian hết hạn token (8 giờ) - CHỈ KHI LOGIN LẦN ĐẦU
      const tokenExpiry = calculateTokenExpiry();
      state.tokenExpiry = tokenExpiry;

      // 🚀 Batch localStorage operations
      if (token) safeSetLocalStorage("access_token", token);
      if (refreshToken) safeSetLocalStorage("refresh_token", refreshToken);
      if (user) safeSetLocalStorage("user", user);
      if (unitsResponse) safeSetLocalStorage("unitsResponse", unitsResponse);
      safeSetLocalStorage("last_login", state.lastLogin);
      safeSetLocalStorage("token_expiry", tokenExpiry.toString());

      state.userInfo = computeUserInfo(state.user, state.unitsResponse);
    },

    logout: (state) => {
      // 🚀 Complete cleanup
      state.token = null;
      state.refreshToken = null;
      state.tokenExpiry = null;
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
      [
        "access_token",
        "refresh_token",
        "token_expiry",
        "user",
        "unitsResponse",
        "last_login",
      ].forEach(safeRemoveLocalStorage);
    },

    refreshUserInfo: (state) => {
      // 🚀 Force refresh from localStorage (useful after external changes)
      const freshUser = safeParseJSON("user");
      const freshUnits = safeParseJSON("unitsResponse");
      const freshToken = localStorage.getItem("access_token");
      const freshRefreshToken = localStorage.getItem("refresh_token");
      const freshTokenExpiry = parseInt(
        localStorage.getItem("token_expiry") || "0"
      );

      state.user = freshUser;
      state.unitsResponse = freshUnits;
      state.token = freshToken;
      state.refreshToken = freshRefreshToken;
      state.tokenExpiry = freshTokenExpiry;
      state.isAuthenticated = !!freshToken && !isTokenExpired(freshTokenExpiry);
      state.userInfo = computeUserInfo(freshUser, freshUnits);
    },

    refreshToken: (state, action) => {
      const { token, refreshToken } = action.payload;

      if (token) {
        state.token = token;
        safeSetLocalStorage("access_token", token);
        // KHÔNG cập nhật expiry time khi refresh token, giữ nguyên thời gian gốc
      }

      if (refreshToken) {
        state.refreshToken = refreshToken;
        safeSetLocalStorage("refresh_token", refreshToken);
      }

      state.isAuthenticated = !!token;
    },
  },
});

export const {
  setLoading,
  setError,
  clearError,
  setToken,
  setRefreshToken,
  setUser,
  setUnitsResponse,
  updateUserInfo,
  login,
  logout,
  refreshUserInfo,
  refreshToken,
} = authSlice.actions;

export default authSlice.reducer;

// 🚀 Optimized Selectors với memoization
export const selectToken = (state) => state.auth.token;
export const selectRefreshToken = (state) => state.auth.refreshToken;
export const selectUser = (state) => state.auth.user;
export const selectUserInfo = (state) => state.auth.userInfo;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectAuthError = (state) => state.auth.error;
export const selectAuthLoading = (state) => state.auth.isLoading;
export const selectLastLogin = (state) => state.auth.lastLogin;
export const selectTokenExpiry = (state) => state.auth.tokenExpiry;

// 🚀 Compound selectors
export const selectUserDisplay = (state) => {
  const userInfo = state.auth.userInfo;
  return userInfo.userName || userInfo.unitName || "Unknown User";
};

export const selectIsValidSession = (state) => {
  const { isAuthenticated, tokenExpiry } = state.auth;
  if (!isAuthenticated) return false;

  return !isTokenExpired(tokenExpiry);
};

export const selectNeedsTokenRefresh = (state) => {
  const { tokenExpiry } = state.auth;
  if (!tokenExpiry) return true;

  // Kiểm tra nếu token sắp hết hạn (còn dưới 30 phút)
  const thirtyMinutes = 30 * 60 * 1000;
  return tokenExpiry - Date.now() < thirtyMinutes;
};
