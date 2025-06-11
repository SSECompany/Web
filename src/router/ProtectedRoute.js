import { Navigate, Outlet, useLocation } from "react-router-dom";
import Navbar from "../components/layout/Navbar/Navbar";
import jwt from "../utils/jwt";

const ProtectedRoute = () => {
  const location = useLocation();

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

  return (
    <>
      <Navbar />
      <Outlet />
    </>
  );
};

export default ProtectedRoute;
