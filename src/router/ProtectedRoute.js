import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { multipleTablePutApi } from "../api";
import jwt from "../utils/jwt";

const ProtectedRoute = () => {
  const location = useLocation();
  const { unitId, id } = useSelector((state) => state.claimsReducer.userInfo || {});
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTableData = async () => {
      try {
        const res = await multipleTablePutApi({
          store: "api_getListRestaurantTables",
          param: {
            searchValue: "",
            unitId: unitId,
            userId: id,
            pageindex: 1,
            pagesize: 100,
          },
          data: {},
        });
        setTableData(res?.listObject?.[0] || []);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTableData();
  }, [unitId, id]);

  // Bypass token check for /order/:orderId?ma_qr=xxx path
  if (/^\/order\/[\w-]+(\?ma_qr=[\w-]+)?$/.test(location.pathname)) {
    if (loading) return null; // or a loading spinner
    if (error) return <Navigate to="/error" replace />;
    const orderId = location.pathname.split("/")[2];
    const params = new URLSearchParams(location.search);
    const ma_qr = params.get("ma_qr");

    const found = tableData.find(
      (table) => table.value === orderId && table.ma_qr === ma_qr
    );
    // Lưu label vào localStorage để POSPage.jsx lấy ra hiển thị
    if (found) {
      localStorage.setItem("pos_table_label", found.label);
    } else {
      localStorage.removeItem("pos_table_label");
    }

    if (!found) {
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
