import { Navigate, Outlet, useLocation } from "react-router-dom";
import Navbar from "../components/layout/Navbar/Navbar";
import useTokenExpiryChecker from "../hooks/useTokenExpiryChecker";
import jwt from "../utils/jwt";
import { clearAllTokenData, isTokenExpired } from "../utils/tokenUtils";

const ProtectedRoute = () => {
  const location = useLocation();

  // Khởi tạo token expiry checker - phải ở top level
  useTokenExpiryChecker();

  const token = localStorage.getItem("access_token");
  const tokenExpiry = localStorage.getItem("token_expiry");
  const unitsResponse = localStorage.getItem("unitsResponse");

  // Không có token -> redirect login
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Token hết hạn -> clear và redirect
  if (isTokenExpired(tokenExpiry)) {
    clearAllTokenData();
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Phenika-style: Check if it's a session token (not real JWT)
  const isSessionToken = token && token.startsWith("session.");

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
    } catch (error) {
      clearAllTokenData();
      return <Navigate to="/login" state={{ from: location }} replace />;
    }
  }

  const isGiaoHangRoute = location.pathname.startsWith("/kho/giao-hang");

  return (
    <>
      {!isGiaoHangRoute && <Navbar />}
      <Outlet />
    </>
  );
};

export default ProtectedRoute;
