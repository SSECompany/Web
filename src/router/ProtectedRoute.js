import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Spin } from "antd";
import Navbar from "../components/layout/Navbar/Navbar";
import VersionIndicator from "../components/common/VersionIndicator/VersionIndicator";
import useProactiveRefresh from "../hooks/useProactiveRefresh";
import useTokenExpiryChecker from "../hooks/useTokenExpiryChecker";
import jwt from "../utils/jwt";
import { clearAllTokenData, isTokenExpired } from "../utils/tokenUtils";

const ProtectedRoute = () => {
  const location = useLocation();

  const token = localStorage.getItem("access_token");
  const tokenExpiry = localStorage.getItem("token_expiry");
  const unitsResponse = localStorage.getItem("unitsResponse");
  const isSessionToken = token && token.startsWith("session.");
  const hasRefreshToken = !!localStorage.getItem("refresh_token");
  const accessExpired = isTokenExpired(tokenExpiry);
  const needProactiveRefresh =
    !isSessionToken && accessExpired && hasRefreshToken;

  useTokenExpiryChecker();
  const { isRefreshing } = useProactiveRefresh(needProactiveRefresh);

  // Không có token -> redirect login
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Đang gọi API refresh chủ động (access hết hạn + còn refresh_token)
  if (needProactiveRefresh && isRefreshing) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <Spin size="large" />
        <span>Đang gia hạn phiên đăng nhập...</span>
      </div>
    );
  }

  // Access token hết hạn (token_expiry qua):
  // - Session token: clear và redirect (không có refresh).
  // - JWT + còn refresh_token: cho vào app, request đầu tiên 401 sẽ trigger refresh; chỉ redirect khi refresh thất bại (refresh_token hết hạn).
  if (isTokenExpired(tokenExpiry)) {
    if (isSessionToken) {
      clearAllTokenData();
      return <Navigate to="/login" state={{ from: location }} replace />;
    }
    if (!hasRefreshToken) {
      clearAllTokenData();
      return <Navigate to="/login" state={{ from: location }} replace />;
    }
    // JWT + có refresh_token: không redirect, để interceptor thử refresh khi có 401
  }

  if (isSessionToken) {
    // Session token - check if we have basic user data
    const user = localStorage.getItem("user");
    if (!user || !unitsResponse) {
      clearAllTokenData();
      return <Navigate to="/login" state={{ from: location }} replace />;
    }
  } else {
    // Real JWT - try to decode claims
    try {
      const claims = jwt.getClaims?.() || {};
      if (!claims || Object.keys(claims).length === 0) {
        clearAllTokenData();
        return <Navigate to="/login" state={{ from: location }} replace />;
      }
      if (claims.Permision === "") {
        clearAllTokenData();
        return <Navigate to="/login" state={{ from: location, error: "Tài khoản không được cấp quyền." }} replace />;
      }
    } catch (error) {
      clearAllTokenData();
      return <Navigate to="/login" state={{ from: location }} replace />;
    }
  }

  const hideNavbar = 
    location.pathname.startsWith("/kho/giao-hang") || 
    (location.pathname.startsWith("/kinh-doanh") && location.pathname !== "/kinh-doanh");

  return (
    <>
      {!hideNavbar && <Navbar />}
      {/* Khi ẩn Navbar: vẫn cần VersionIndicator để check + hiện badge có bản mới */}
      {hideNavbar && <VersionIndicator showDetails={false} />}
      <Outlet />
    </>
  );
};

export default ProtectedRoute;
