import { lazy } from "react";
import { Navigate } from "react-router-dom";
import App from "../App";
import ErrorPage from "../components/common/ErrorPage/ErrorPage";
import ProtectedRoute from "./ProtectedRoute";

// Sử dụng lazy loading cho tất cả các component trang
const Login = lazy(() => import("../pages/Login/Login"));
const Boxly = lazy(() => import("../pages/boxly/Boxly"));
const ListPhieuNhapKho = lazy(() =>
  import("../modules/boxly/components/phieu-nhap-kho/ListPhieuNhapKho")
);
const AddPhieuNhapKho = lazy(() =>
  import("../modules/boxly/components/phieu-nhap-kho/AddPhieuNhapKho")
);

const DetailPhieuNhapKho = lazy(() =>
  import("../modules/boxly/components/phieu-nhap-kho/DetailPhieuNhapKho")
);

// Thêm import cho phiếu xuất kho bán hàng
const ListPhieuXuatKhoBanHang = lazy(() =>
  import(
    "../modules/boxly/components/phieu-xuat-kho-ban-hang/ListPhieuXuatKhoBanHang"
  )
);
const AddPhieuXuatKhoBanHang = lazy(() =>
  import(
    "../modules/boxly/components/phieu-xuat-kho-ban-hang/AddPhieuXuatKhoBanHang"
  )
);
const DetailPhieuXuatKhoBanHang = lazy(() =>
  import(
    "../modules/boxly/components/phieu-xuat-kho-ban-hang/DetailPhieuXuatKhoBanHang"
  )
);

const protectedChildrenRoutes = [
  {
    index: true,
    element: <Navigate to="boxly" replace />,
  },
  {
    label: "boxly",
    path: "boxly",
    element: <Boxly />,
    children: [
      {
        label: "Danh sách phiếu nhập kho",
        path: "phieu-nhap-kho",
        element: <ListPhieuNhapKho />,
      },
      {
        label: "Thêm phiếu nhập kho",
        path: "phieu-nhap-kho/add",
        element: <AddPhieuNhapKho />,
      },
      {
        label: "Chi tiết phiếu nhập kho",
        path: "phieu-nhap-kho/:stt_rec",
        element: <DetailPhieuNhapKho />,
      },
      {
        label: "Sửa phiếu nhập kho",
        path: "phieu-nhap-kho/edit/:stt_rec",
        element: <DetailPhieuNhapKho isEditMode={true} />,
      },
      {
        label: "Danh sách phiếu xuất kho bán hàng",
        path: "phieu-xuat-kho-ban-hang",
        element: <ListPhieuXuatKhoBanHang />,
      },
      {
        label: "Thêm phiếu xuất kho bán hàng",
        path: "phieu-xuat-kho-ban-hang/add",
        element: <AddPhieuXuatKhoBanHang />,
      },
      {
        label: "Chi tiết phiếu xuất kho bán hàng",
        path: "phieu-xuat-kho-ban-hang/:stt_rec",
        element: <DetailPhieuXuatKhoBanHang />,
      },
      {
        label: "Sửa phiếu xuất kho bán hàng",
        path: "phieu-xuat-kho-ban-hang/edit/:stt_rec",
        element: <DetailPhieuXuatKhoBanHang isEditMode={true} />,
      },
    ],
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
