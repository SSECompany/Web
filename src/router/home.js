import { lazy } from "react";
import { Navigate } from "react-router-dom";
import App from "../App";
import ErrorPage from "../components/common/ErrorPage/ErrorPage";
import ProtectedRoute from "./ProtectedRoute";

// Pages
const Login = lazy(() => import("../pages/Login/Login"));
const POSPage = lazy(() => import("../pages/pharmacy/POS"));
const KhoPage = lazy(() => import("../pages/kho/Kho"));

// Kho Components
const ListPhieuNhapKho = lazy(() =>
  import("../pages/kho/components/phieu-nhap-kho/ListPhieuNhapKho")
);
const AddPhieuNhapKho = lazy(() =>
  import("../pages/kho/components/phieu-nhap-kho/AddPhieuNhapKho")
);
const DetailPhieuNhapKho = lazy(() =>
  import("../pages/kho/components/phieu-nhap-kho/DetailPhieuNhapKho")
);

const ListPhieuXuatKho = lazy(() =>
  import("../pages/kho/components/phieu-xuat-kho/ListPhieuXuatKho")
);
const AddPhieuXuatKho = lazy(() =>
  import("../pages/kho/components/phieu-xuat-kho/AddPhieuXuatKho")
);
const DetailPhieuXuatKho = lazy(() =>
  import("../pages/kho/components/phieu-xuat-kho/DetailPhieuXuatKho")
);

const ListPhieuXuatKhoBanHang = lazy(() =>
  import(
    "../pages/kho/components/phieu-xuat-kho-ban-hang/ListPhieuXuatKhoBanHang"
  )
);
const AddPhieuXuatKhoBanHang = lazy(() =>
  import(
    "../pages/kho/components/phieu-xuat-kho-ban-hang/AddPhieuXuatKhoBanHang"
  )
);
const DetailPhieuXuatKhoBanHang = lazy(() =>
  import(
    "../pages/kho/components/phieu-xuat-kho-ban-hang/DetailPhieuXuatKhoBanHang"
  )
);

const ListPhieuXuatDieuChuyen = lazy(() =>
  import(
    "../pages/kho/components/phieu-xuat-dieu-chuyen/ListPhieuXuatDieuChuyen"
  )
);
const AddPhieuXuatDieuChuyen = lazy(() =>
  import(
    "../pages/kho/components/phieu-xuat-dieu-chuyen/AddPhieuXuatDieuChuyen"
  )
);
const DetailPhieuXuatDieuChuyen = lazy(() =>
  import(
    "../pages/kho/components/phieu-xuat-dieu-chuyen/DetailPhieuXuatDieuChuyen"
  )
);

const protectedChildrenRoutes = [
  { index: true, element: <Navigate to="pos" replace /> },
  { label: "POS", path: "pos", element: <POSPage /> },

  // Kho routes - đặt trước route kho chính để tránh xung đột
  {
    label: "Danh sách phiếu nhập kho",
    path: "kho/nhap-kho",
    element: <ListPhieuNhapKho />,
  },
  {
    label: "Thêm phiếu nhập kho",
    path: "kho/nhap-kho/them-moi",
    element: <AddPhieuNhapKho />,
  },
  {
    label: "Chi tiết phiếu nhập kho",
    path: "kho/nhap-kho/chi-tiet/:id",
    element: <DetailPhieuNhapKho />,
  },
  {
    label: "Danh sách phiếu xuất kho",
    path: "kho/xuat-kho",
    element: <ListPhieuXuatKho />,
  },
  {
    label: "Thêm phiếu xuất kho",
    path: "kho/xuat-kho/them-moi",
    element: <AddPhieuXuatKho />,
  },
  {
    label: "Chi tiết phiếu xuất kho",
    path: "kho/xuat-kho/chi-tiet/:id",
    element: <DetailPhieuXuatKho />,
  },
  {
    label: "Danh sách phiếu xuất kho bán hàng",
    path: "kho/xuat-ban",
    element: <ListPhieuXuatKhoBanHang />,
  },
  {
    label: "Thêm phiếu xuất kho bán hàng",
    path: "kho/xuat-ban/them-moi",
    element: <AddPhieuXuatKhoBanHang />,
  },
  {
    label: "Chi tiết phiếu xuất kho bán hàng",
    path: "kho/xuat-ban/chi-tiet/:id",
    element: <DetailPhieuXuatKhoBanHang />,
  },
  {
    label: "Danh sách phiếu xuất điều chuyển",
    path: "kho/xuat-dieu-chuyen",
    element: <ListPhieuXuatDieuChuyen />,
  },
  {
    label: "Thêm phiếu xuất điều chuyển",
    path: "kho/xuat-dieu-chuyen/them-moi",
    element: <AddPhieuXuatDieuChuyen />,
  },
  {
    label: "Chi tiết phiếu xuất điều chuyển",
    path: "kho/xuat-dieu-chuyen/chi-tiet/:id",
    element: <DetailPhieuXuatDieuChuyen />,
  },

  // Route kho chính - đặt sau các route con
  { label: "Kho", path: "kho", element: <KhoPage /> },
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
