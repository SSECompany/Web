import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setClaims } from "../store/reducers/claimsSlice";

// 🚀 Custom hook cho Auth
export const useAuth = () => {
  const dispatch = useDispatch();

  // Lấy data từ claimsReducer và localStorage
  const userInfo = useSelector((state) => state?.claimsReducer?.userInfo || {});
  const token = useSelector((state) => localStorage.getItem("access_token"));
  const isAuthenticated = useSelector((state) => {
    const token = localStorage.getItem("access_token");
    const tokenExpiry = localStorage.getItem("token_expiry");
    return !!token && tokenExpiry && Date.now() < parseInt(tokenExpiry);
  });
  const error = useSelector((state) => null); // No error state in claimsReducer
  const loading = useSelector((state) => false); // No loading state in claimsReducer
  const userDisplay = useSelector((state) => {
    const userInfo = state?.claimsReducer?.userInfo || {};
    return userInfo.userName || userInfo.unitName || "Unknown User";
  });
  const isValidSession = useSelector((state) => {
    const token = localStorage.getItem("access_token");
    const tokenExpiry = localStorage.getItem("token_expiry");
    return !!token && tokenExpiry && Date.now() < parseInt(tokenExpiry);
  });

  const loginUser = useCallback(
    (authData) => {
      // Set claims data
      if (authData.claims) {
        dispatch(setClaims(authData.claims));
      }

      // Set localStorage data
      if (authData.token) {
        localStorage.setItem("access_token", authData.token);
      }
      if (authData.refreshToken) {
        localStorage.setItem("refresh_token", authData.refreshToken);
      }
      if (authData.tokenExpiry) {
        localStorage.setItem("token_expiry", authData.tokenExpiry.toString());
      }
    },
    [dispatch]
  );

  const logoutUser = useCallback(() => {
    // Clear claims data
    dispatch(setClaims([]));

    // Clear localStorage
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("token_expiry");
    localStorage.removeItem("claims");
  }, [dispatch]);

  const updateUser = useCallback(
    (userData) => {
      // Update claims data
      dispatch(setClaims(userData));
    },
    [dispatch]
  );

  const clearError = useCallback(() => {
    // No error state to clear
  }, []);

  return {
    // State
    userInfo,
    token,
    isAuthenticated,
    error,
    loading,
    userDisplay,
    isValidSession,
    // Actions
    login: loginUser,
    logout: logoutUser,
    updateUser,
    clearError,
  };
};

// Export default chỉ có useAuth hook
const reduxHooks = {
  useAuth,
};

export default reduxHooks;

