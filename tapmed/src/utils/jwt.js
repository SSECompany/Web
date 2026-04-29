import { jwtDecode } from "jwt-decode";
import Cookies from "universal-cookie";
import {
  checkExistToken as checkToken,
  getTokenExpiry,
  isTokenExpired as isExpired,
  setTokenExpiry,
} from "./tokenUtils";
const cookies = new Cookies();
const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";
const TOKEN_EXPIRY_KEY = "token_expiry";
const STATISTIC_DARDBOARD_SETTINGS = "statistic_dashboard_settings";
const SIMPLECHART_DARDBOARD_SETTINGS = "simplechart_dashboard_settings";
const DARDBOARD_REPORT_SETTINGS = "dashboard_Report";

const getAccessToken = () => {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
};

const getRefreshToken = () => {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
};

const setAccessToken = (token, skipExpiryUpdate = false) => {
  if (token) {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
    // Khi không skip: set token_expiry từ JWT exp (login), khớp với access token thực tế
    if (!skipExpiryUpdate) {
      setTokenExpiryFromJwt(token);
    }
  } else {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    setTokenExpiry(null);
  }
};

const resetAccessToken = (token) => {
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(TOKEN_EXPIRY_KEY);
  return;
};

const setRefreshToken = (token) => {
  if (token) {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }
};

/**
 * Cập nhật toàn bộ token sau khi gọi API Refresh thành công.
 * Ghi đè access_token, refresh_token, token_expiry trong localStorage.
 * Ghi từng key khi có giá trị (không bỏ qua nếu thiếu một bên).
 */
const applyRefreshResponse = (newAccessToken, newRefreshToken) => {
  const access = newAccessToken != null && String(newAccessToken).trim() !== "";
  const refresh = newRefreshToken != null && String(newRefreshToken).trim() !== "";
  if (!access && !refresh) return;
  if (refresh) {
    localStorage.setItem(REFRESH_TOKEN_KEY, String(newRefreshToken));
  }
  if (access) {
    localStorage.setItem(ACCESS_TOKEN_KEY, String(newAccessToken));
    setTokenExpiryFromJwt(newAccessToken);
  }
};

// Fallback expiry khi JWT không có exp (khớp với thời hạn refresh token backend: 160 phút)
const TOKEN_EXPIRY_FALLBACK_MS = 160 * 60 * 1000;

// Cập nhật token_expiry từ JWT exp (login + refresh), fallback 160 phút
const setTokenExpiryFromJwt = (token) => {
  if (!token) return;
  try {
    const decoded = jwtDecode(token);
    if (decoded?.exp != null) {
      setTokenExpiry(decoded.exp * 1000);
    } else {
      setTokenExpiry(Date.now() + TOKEN_EXPIRY_FALLBACK_MS);
    }
  } catch (_) {
    setTokenExpiry(Date.now() + TOKEN_EXPIRY_FALLBACK_MS);
  }
};

const claimNewToken = async () => {
  const payload = {
    token: getAccessToken(),
    refreshToken: getRefreshToken(),
  };
};

// Utilities from tokenUtils (imported at top)

const isTokenExpired = () => {
  const expiry = getTokenExpiry();
  return isExpired(expiry);
};

const checkExistToken = () => {
  return checkToken();
};

const saveClaims = (token) => {
  try {
    const decoded = jwtDecode(token);
    return decoded;
  } catch (error) {
    console.error("Error decoding token:", error);
    return {};
  }
};

const getClaims = () => {
  const claims = jwtDecode(getAccessToken());
  return claims;
};

const getStatistictboardSetting = () => {
  return localStorage.getItem(STATISTIC_DARDBOARD_SETTINGS)?.split(",") || [];
};

const setStatisticboardSetting = (settings) => {
  return localStorage.setItem(STATISTIC_DARDBOARD_SETTINGS, settings);
};

const getSimpleChartboardSetting = () => {
  return (
    localStorage.getItem(SIMPLECHART_DARDBOARD_SETTINGS)?.split(",") || [
      "SO",
      "FS",
      "NB",
    ]
  );
};

const setSimpleChartboardSetting = (settings) => {
  return localStorage.setItem(SIMPLECHART_DARDBOARD_SETTINGS, settings);
};

const getDashboardReport = () => {
  return localStorage.getItem(DARDBOARD_REPORT_SETTINGS) || undefined;
};

const setDashboardReport = (settings) => {
  return localStorage.setItem(DARDBOARD_REPORT_SETTINGS, settings);
};

const clearTokens = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(TOKEN_EXPIRY_KEY);
};

// Set token_expiry khi không có token (fallback 160 phút, khớp với refresh token backend)
const setInitialTokenExpiry = () => {
  const expiryTime = Date.now() + TOKEN_EXPIRY_FALLBACK_MS;
  setTokenExpiry(expiryTime);
  return expiryTime;
};

const jwt = {
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
  applyRefreshResponse,
  claimNewToken,
  checkExistToken,
  resetAccessToken,
  saveClaims,
  getClaims,
  getSimpleChartboardSetting,
  setSimpleChartboardSetting,
  getStatistictboardSetting,
  setStatisticboardSetting,
  getDashboardReport,
  setDashboardReport,
  getTokenExpiry,
  setTokenExpiry,
  isTokenExpired,
  clearTokens,
  setInitialTokenExpiry,
  setTokenExpiryFromJwt,
};
export default jwt;
