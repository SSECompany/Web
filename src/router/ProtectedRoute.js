import { Navigate, Outlet, useLocation } from "react-router-dom";
import { tableData } from "../components/common/GenerateQR/tableDataQR";
import jwt from "../utils/jwt";

const ProtectedRoute = () => {
  const location = useLocation();

  // Bypass token check for /order/:orderId?ma_qr=xxx path
  if (/^\/order\/[\w-]+(\?ma_qr=[\w-]+)?$/.test(location.pathname)) {
    const orderId = location.pathname.split("/")[2];
    const params = new URLSearchParams(location.search);
    const ma_qr = params.get("ma_qr");

    const isValid = tableData.some(
      (table) => table.value === orderId && table.ma_qr === ma_qr
    );

    if (!isValid) {
      return <Navigate to="/error" replace />;
    }
    return <Outlet />; // Allow access to the order page
  }

  // Kiểm tra nếu không có token, điều hướng đến trang đăng nhập
  const token = localStorage.getItem("access_token");
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  let claims = {};
  try {
    claims = jwt.getClaims?.() || {};
  } catch (error) {
    console.error("Invalid token:", error);
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const roleWeb = claims?.RoleWeb;

  // Điều hướng dựa trên RoleWeb
  if (roleWeb === "isPos" || roleWeb === "isPosMini") {
    if (location.pathname !== "/") {
      return <Navigate to="/" replace />;
    }
  } else if (roleWeb === "isMealTiket") {
    if (location.pathname !== "/meal-ticket") {
      return <Navigate to="/meal-ticket" replace />;
    }
  } else {
    return <Navigate to="/error" replace />;
  }

  // Logic cũ: Điều hướng nếu đã đăng nhập và truy cập /order/:orderId
  if (token && /^\/order\/[\w-]+$/.test(location.pathname)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
