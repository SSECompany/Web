import jwtDecode from "jwt-decode";
import Cookies from "universal-cookie";
const cookies = new Cookies();
const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";
const STATISTIC_DARDBOARD_SETTINGS = "statistic_dashboard_settings";
const SIMPLECHART_DARDBOARD_SETTINGS = "simplechart_dashboard_settings";
const DARDBOARD_REPORT_SETTINGS = "dashboard_Report";

const getAccessToken = () => {
  return `${window.localStorage.getItem(ACCESS_TOKEN_KEY)}`;
};

const getRefreshToken = () => {
  return window.localStorage.getItem(REFRESH_TOKEN_KEY);
};

const setAccessToken = (token) => {
  return window.localStorage.setItem(ACCESS_TOKEN_KEY || "", token);
};

const resetAccessToken = (token) => {
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  return;
};

const setRefreshToken = (refreshToken) => {
  return window.localStorage.setItem(REFRESH_TOKEN_KEY || "", refreshToken);
};

const claimNewToken = async () => {
  const payload = {
    token: getAccessToken(),
    refreshToken: getRefreshToken(),
  };
};

const checkExistToken = () => {
  const token = window.localStorage.getItem(ACCESS_TOKEN_KEY);
  if (token && token != "" && token != "undefined") return true;
  return false;
};

const saveClaims = (token) => {
  const claims = jwtDecode(token ? token : "");
  return claims;
};

const getClaims = () => {
  const claims = jwtDecode(getAccessToken());
  return claims;
};

const getStatistictboardSetting = () => {
  return (
    window.localStorage.getItem(STATISTIC_DARDBOARD_SETTINGS)?.split(",") || []
  );
};

const setStatisticboardSetting = (settings) => {
  return window.localStorage.setItem(STATISTIC_DARDBOARD_SETTINGS, settings);
};

const getSimpleChartboardSetting = () => {
  return (
    window.localStorage.getItem(SIMPLECHART_DARDBOARD_SETTINGS)?.split(",") || [
      "SO",
      "FS",
      "NB",
    ]
  );
};

const setSimpleChartboardSetting = (settings) => {
  return window.localStorage.setItem(SIMPLECHART_DARDBOARD_SETTINGS, settings);
};

const getDashboardReport = () => {
  return window.localStorage.getItem(DARDBOARD_REPORT_SETTINGS) || undefined;
};

const setDashboardReport = (settings) => {
  return window.localStorage.setItem(DARDBOARD_REPORT_SETTINGS, settings);
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
};
export default jwt;
