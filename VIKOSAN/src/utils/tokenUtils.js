// 🚀 Centralized Token Utilities - Single source of truth
export const clearAllTokenData = () => {
  const keysToRemove = [
    "access_token",
    "refresh_token",
    "token_expiry",
    "user",
    "unitsResponse",
    "last_login",
    "statistic_dashboard_settings",
    "simplechart_dashboard_settings",
    "dashboard_Report",
  ];

  keysToRemove.forEach((key) => {
    localStorage.removeItem(key);
  });
};

export const isTokenExpired = (tokenExpiry) => {
  if (!tokenExpiry) return true;
  return Date.now() > parseInt(tokenExpiry);
};

export const getTimeLeft = (tokenExpiry) => {
  if (!tokenExpiry) return 0;
  return Math.max(0, parseInt(tokenExpiry) - Date.now());
};

export const getTokenExpiry = () => {
  const expiry = localStorage.getItem("token_expiry");
  return expiry ? parseInt(expiry) : null;
};

export const setTokenExpiry = (expiryTime) => {
  if (expiryTime) {
    localStorage.setItem("token_expiry", expiryTime.toString());
  } else {
    localStorage.removeItem("token_expiry");
  }
};

export const calculateTokenExpiry = () => {
  const expiryDate = new Date();
  expiryDate.setHours(expiryDate.getHours() + 8); // 8 giờ
  return expiryDate.getTime();
};

export const checkExistToken = () => {
  const token = localStorage.getItem("access_token");
  if (!token) return false;

  const expiry = getTokenExpiry();
  return !isTokenExpired(expiry);
};
