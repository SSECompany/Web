import { jwtDecode } from "jwt-decode";
import Cookies from "universal-cookie";
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

const setAccessToken = (token) => {
  if (token) {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);

    // Thiết lập thời gian hết hạn (1 ngày)
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 1);
    localStorage.setItem(TOKEN_EXPIRY_KEY, expiryDate.getTime().toString());
  } else {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
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

const claimNewToken = async () => {
  const payload = {
    token: getAccessToken(),
    refreshToken: getRefreshToken(),
  };
};

const getTokenExpiry = () => {
  const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
  return expiry ? parseInt(expiry) : null;
};

const setTokenExpiry = (expiryTime) => {
  if (expiryTime) {
    localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
  } else {
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
  }
};

const isTokenExpired = () => {
  const expiry = getTokenExpiry();
  if (!expiry) return true;

  return Date.now() > expiry;
};

const checkExistToken = () => {
  const token = getAccessToken();
  if (!token) return false;

  // Kiểm tra token còn hạn không
  return !isTokenExpired();
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

const jwt = {
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
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
};
export default jwt;
