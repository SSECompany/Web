import { Navigate, Outlet, useLocation } from "react-router-dom";
import Navbar from "../components/layout/Navbar/Navbar";
import useTokenExpiryChecker from "../hooks/useTokenExpiryChecker";
import jwt from "../utils/jwt";
import { clearAllTokenData, isTokenExpired } from "../utils/tokenUtils";

const ProtectedRoute = () => {
  const location = useLocation();

  const token = localStorage.getItem("access_token");
  const tokenExpiry = localStorage.getItem("token_expiry");

  // Không có token -> redirect login
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Token hết hạn -> clear và redirect
  if (isTokenExpired(tokenExpiry)) {
    clearAllTokenData();
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Token không hợp lệ -> redirect
  try {
    jwt.getClaims?.() || {};
  } catch (error) {
    clearAllTokenData();
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Khởi tạo token expiry checker
  useTokenExpiryChecker();

  return (
    <>
      <Navbar />
      <Outlet />
    </>
  );
};

export default ProtectedRoute;
