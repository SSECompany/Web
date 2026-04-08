import { lazy } from "react";
import { Navigate } from "react-router-dom";
import App from "../App";
import ErrorPage from "../components/common/ErrorPage/ErrorPage";
import ProtectedRoute from "./ProtectedRoute";

// Pages
const Login = lazy(() => import("../pages/Login/Login"));
const POSPage = lazy(() => import("../pages/pharmacy/POS"));
const ReturnPOSPage = lazy(() => import("../pages/pharmacy/ReturnPOS"));
const BaoCaoPhieuBanLe = lazy(() => import("../pages/reports/BaoCaoPhieuBanLe"));
const BaoCaoTonKho = lazy(() => import("../pages/reports/BaoCaoTonKho"));
const TongHopNhapXuatTon = lazy(() => import("../pages/reports/TongHopNhapXuatTon"));

const protectedChildrenRoutes = [
  { label: "Bán hàng", path: "ban-hang", element: <POSPage /> },
  { label: "Trả hàng", path: "tra-hang", element: <ReturnPOSPage /> },

  // Default route - chỉ redirect khi path là "/"
  { path: "", element: <Navigate to="ban-hang" replace /> },

  // Báo cáo routes
  {
    label: "Báo cáo phiếu bán lẻ",
    path: "bao-cao/phieu-ban-le",
    element: <BaoCaoPhieuBanLe />,
  },
  {
    label: "Báo cáo tồn kho",
    path: "bao-cao/ton-kho",
    element: <BaoCaoTonKho />,
  },
  {
    label: "Tổng hợp nhập xuất tồn",
    path: "bao-cao/tong-hop-nhap-xuat-ton",
    element: <TongHopNhapXuatTon />,
  },
];

const mainRoutes = [
  {
    label: "Login",
    claims: "Permissions.login",
    path: "login",
    element: <Login />,
    index: true,
  },
  {
    label: "Protected",
    path: "/",
    element: <ProtectedRoute />,
    children: protectedChildrenRoutes,
  },
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
  {
    label: "Error",
    path: "error",
    element: <ErrorPage />,
  },
];

const homeRoutes = [
  {
    path: "/",
    element: <App />,
    children: mainRoutes,
  },
];

export default homeRoutes;
