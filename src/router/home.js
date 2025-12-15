import { lazy } from "react";
import { Navigate } from "react-router-dom";
import App from "../App";
import ErrorPage from "../components/common/ErrorPage/ErrorPage";
import ProtectedRoute from "./ProtectedRoute";

// Pages
const Login = lazy(() => import("../pages/Login/Login"));
const POSPage = lazy(() => import("../pages/pharmacy/POS"));
const ReturnPOSPage = lazy(() => import("../pages/pharmacy/ReturnPOS"));
const KhoPage = lazy(() => import("../pages/kho/Kho"));
const BaoCaoPhieuBanLe = lazy(() => import("../pages/reports/BaoCaoPhieuBanLe"));
const BaoCaoTonKho = lazy(() => import("../pages/reports/BaoCaoTonKho"));
const TongHopNhapXuatTon = lazy(() => import("../pages/reports/TongHopNhapXuatTon"));

import DetailPhieuNhatHang from "../pages/kho/components/phieu-nhat-hang/DetailPhieuNhatHang";
import ListPhieuNhatHang from "../pages/kho/components/phieu-nhat-hang/ListPhieuNhatHang";

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
  { label: "Bán hàng", path: "ban-hang", element: <POSPage /> },
  { label: "Trả hàng", path: "tra-hang", element: <ReturnPOSPage /> },

  // Kho routes - ĐẶT TRƯỚC route kho chính để tránh conflict
  {
    label: "Danh sách phiếu nhặt hàng",
    path: "kho/nhat-hang",
    element: <ListPhieuNhatHang />,
  },

  // Route kho chính - đặt SAU các route con
  { label: "Kho", path: "kho", element: <KhoPage /> },

  // Default route - chỉ redirect khi path là "/"
  { path: "", element: <Navigate to="ban-hang" replace /> },

  {
    label: "Chi tiết phiếu nhặt hàng",
    path: "kho/nhat-hang/chi-tiet/:id",
    element: <DetailPhieuNhatHang />,
  },
  {
    label: "Chỉnh sửa phiếu nhặt hàng",
    path: "kho/nhat-hang/edit/:id",
    element: <DetailPhieuNhatHang isEditMode={true} />,
  },
  {
    label: "Chỉnh sửa phiếu nhặt hàng",
    path: "kho/nhat-hang/chi-tiet/edit/:id",
    element: <DetailPhieuNhatHang isEditMode={true} />,
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
