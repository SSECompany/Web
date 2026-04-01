import { lazy } from "react";
import { lazyRetry } from "../utils/lazyRetry";
import { Navigate } from "react-router-dom";
import App from "../App";
import ErrorPage from "../components/common/ErrorPage/ErrorPage";
import ProtectedRoute from "./ProtectedRoute";
import DetailPhieuNhatHang from "../pages/kho/components/phieu-nhat-hang/DetailPhieuNhatHang";
import ListPhieuNhatHang from "../pages/kho/components/phieu-nhat-hang/ListPhieuNhatHang";
import DetailPhieuGiaoHang from "../pages/kho/components/phieu-giao-hang/DetailPhieuGiaoHang";
import ListPhieuGiaoHang from "../pages/kho/components/phieu-giao-hang/ListPhieuGiaoHang";
import ProcessPhieuGiaoHang from "../pages/kho/components/phieu-giao-hang/ProcessPhieuGiaoHang";
import ListPhieuNhapKho from "../pages/kho/components/phieu-nhap-kho/ListPhieuNhapKho";
import AddPhieuNhapKho from "../pages/kho/components/phieu-nhap-kho/AddPhieuNhapKho";
import DetailPhieuNhapKho from "../pages/kho/components/phieu-nhap-kho/DetailPhieuNhapKho";
import ListPhieuNhapHang from "../pages/kho/components/phieu-nhap-hang/ListPhieuNhapHang";
import AddPhieuNhapHang from "../pages/kho/components/phieu-nhap-hang/AddPhieuNhapHang";
import DetailPhieuNhapHang from "../pages/kho/components/phieu-nhap-hang/DetailPhieuNhapHang";
// Pages
const Login = lazyRetry(() => import("../pages/Login/Login"));
// ===== BÁN HÀNG & TRẢ HÀNG IMPORTS DISABLED IN BRANCH 08012026_kho =====
// const POSPage = lazy(() => import("../pages/pharmacy/POS"));
// const ReturnPOSPage = lazy(() => import("../pages/pharmacy/ReturnPOS"));
const KhoPage = lazyRetry(() => import("../pages/kho/Kho"));
const KinhDoanhPage = lazyRetry(() => import("../pages/kinh-doanh/KinhDoanh"));
const ListPhieuKinhDoanh = lazyRetry(() => import("../pages/kinh-doanh/components/phieu-kinh-doanh/ListPhieuKinhDoanh"));
const DetailPhieuKinhDoanh = lazyRetry(() => import("../pages/kinh-doanh/components/phieu-kinh-doanh/DetailPhieuKinhDoanh"));
const BaoCaoPhieuBanLe = lazyRetry(() => import("../pages/reports/BaoCaoPhieuBanLe"));
const BaoCaoTonKho = lazyRetry(() => import("../pages/reports/BaoCaoTonKho"));
const TongHopNhapXuatTon = lazyRetry(() => import("../pages/reports/TongHopNhapXuatTon"));

const ListPhieuXuatKho = lazyRetry(() =>
  import("../pages/kho/components/phieu-xuat-kho/ListPhieuXuatKho")
);
const AddPhieuXuatKho = lazyRetry(() =>
  import("../pages/kho/components/phieu-xuat-kho/AddPhieuXuatKho")
);
const DetailPhieuXuatKho = lazyRetry(() =>
  import("../pages/kho/components/phieu-xuat-kho/DetailPhieuXuatKho")
);



const ListPhieuNhapDieuChuyen = lazyRetry(() =>
  import(
    "../pages/kho/components/phieu-nhap-dieu-chuyen/ListPhieuNhapDieuChuyen"
  )
);
const AddPhieuNhapDieuChuyen = lazyRetry(() =>
  import(
    "../pages/kho/components/phieu-nhap-dieu-chuyen/AddPhieuNhapDieuChuyen"
  )
);
const DetailPhieuNhapDieuChuyen = lazyRetry(() =>
  import(
    "../pages/kho/components/phieu-nhap-dieu-chuyen/DetailPhieuNhapDieuChuyen"
  )
);

const ListPhieuXuatDieuChuyen = lazyRetry(() =>
  import(
    "../pages/kho/components/phieu-xuat-dieu-chuyen/ListPhieuXuatDieuChuyen"
  )
);
const AddPhieuXuatDieuChuyen = lazyRetry(() =>
  import(
    "../pages/kho/components/phieu-xuat-dieu-chuyen/AddPhieuXuatDieuChuyen"
  )
);
const DetailPhieuXuatDieuChuyen = lazyRetry(() =>
  import(
    "../pages/kho/components/phieu-xuat-dieu-chuyen/DetailPhieuXuatDieuChuyen"
  )
);

const ListPhieuYeuCauKiemKe = lazyRetry(() =>
  import(
    "../pages/kho/components/phieu-yeu-cau-kiem-ke/ListPhieuYeuCauKiemKe"
  )
);

const DetailPhieuYeuCauKiemKe = lazyRetry(() =>
  import(
    "../pages/kho/components/phieu-yeu-cau-kiem-ke/DetailPhieuYeuCauKiemKe"
  )
);

const protectedChildrenRoutes = [
  // ===== BÁN HÀNG & TRẢ HÀNG ROUTES DISABLED IN BRANCH 08012026_kho =====
  // { label: "Bán hàng", path: "ban-hang", element: <POSPage /> },
  // { label: "Trả hàng", path: "tra-hang", element: <ReturnPOSPage /> },

  {
    label: "Kinh doanh",
    path: "kinh-doanh",
    element: <KinhDoanhPage />,
  },
  {
    label: "Phiếu kinh doanh",
    path: "kinh-doanh/danh-sach",
    element: <ListPhieuKinhDoanh />,
  },
  {
    label: "Thêm mới phiếu kinh doanh",
    path: "kinh-doanh/them-moi",
    element: <DetailPhieuKinhDoanh />,
  },
  {
    label: "Chi tiết phiếu kinh doanh",
    path: "kinh-doanh/chi-tiet/:stt_rec",
    element: <DetailPhieuKinhDoanh />,
  },
  {
    label: "Chỉnh sửa phiếu kinh doanh",
    path: "kinh-doanh/edit/:stt_rec",
    element: <DetailPhieuKinhDoanh isEditMode={true} />,
  },

  // Kho routes - ĐẶT TRƯỚC route kho chính để tránh conflict
  {
    label: "Phiếu nhặt hàng",
    path: "kho/nhat-hang",
    element: <ListPhieuNhatHang />,
  },
  {
    label: "Phiếu nhập hàng theo đơn",
    path: "kho/nhap-hang",
    element: <ListPhieuNhapHang />,
  },
  {
    label: "Thêm mới phiếu nhập hàng",
    path: "kho/nhap-hang/them-moi",
    element: <AddPhieuNhapHang />,
  },
  {
    label: "Chi tiết phiếu nhập hàng",
    path: "kho/nhap-hang/chi-tiet/:stt_rec",
    element: <DetailPhieuNhapHang />,
  },
  {
    label: "Chỉnh sửa phiếu nhập hàng",
    path: "kho/nhap-hang/chi-tiet/edit/:stt_rec",
    element: <DetailPhieuNhapHang isEditMode={true} />,
  },
  {
    label: "Chỉnh sửa phiếu nhập hàng",
    path: "kho/nhap-hang/edit/:stt_rec",
    element: <DetailPhieuNhapHang isEditMode={true} />,
  },
  {
    label: "Phiếu giao hàng",
    path: "kho/giao-hang",
    element: <ListPhieuGiaoHang />,
  },
  // {
  //   label: "Phiếu nhập kho",
  //   path: "kho/nhap-kho",
  //   element: <ListPhieuNhapKho />,
  // },
  // {
  //   label: "Thêm phiếu nhập kho",
  //   path: "kho/nhap-kho/them-moi",
  //   element: <AddPhieuNhapKho />,
  // },
  // {
  //   label: "Chi tiết phiếu nhập kho",
  //   path: "kho/nhap-kho/chi-tiet/:stt_rec",
  //   element: <DetailPhieuNhapKho />,
  // },

  // Default route - chỉ redirect khi path là "/" (redirect to Kho instead of ban-hang)
  { path: "", element: <Navigate to="kho" replace /> },

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
    label: "Chi tiết phiếu giao hàng",
    path: "kho/giao-hang/chi-tiet/:id",
    element: <DetailPhieuGiaoHang />,
  },
  {
    label: "Xử lý phiếu giao hàng",
    path: "kho/giao-hang/xu-ly/:id",
    element: <ProcessPhieuGiaoHang />,
  },
  {
    label: "Thêm phiếu giao hàng",
    path: "kho/giao-hang/them-moi",
    element: <DetailPhieuGiaoHang />,
  },
  {
    label: "Chỉnh sửa phiếu giao hàng",
    path: "kho/giao-hang/edit/:id",
    element: <DetailPhieuGiaoHang isEditMode={true} />,
  },
  // {
  //   label: "Phiếu xuất kho",
  //   path: "kho/xuat-kho",
  //   element: <ListPhieuXuatKho />,
  // },
  // {
  //   label: "Thêm phiếu xuất kho",
  //   path: "kho/xuat-kho/them-moi",
  //   element: <AddPhieuXuatKho />,
  // },
  // {
  //   label: "Chi tiết phiếu xuất kho",
  //   path: "kho/xuat-kho/chi-tiet/:id",
  //   element: <DetailPhieuXuatKho />,
  // },
  {
    label: "Phiếu nhập điều chuyển",
    path: "kho/nhap-dieu-chuyen",
    element: <ListPhieuNhapDieuChuyen />,
  },
  {
    label: "Thêm phiếu nhập điều chuyển",
    path: "kho/nhap-dieu-chuyen/them-moi",
    element: <AddPhieuNhapDieuChuyen />,
  },
  {
    label: "Chi tiết phiếu nhập điều chuyển",
    path: "kho/nhap-dieu-chuyen/chi-tiet/:stt_rec",
    element: <DetailPhieuNhapDieuChuyen />,
  },
  {
    label: "Chỉnh sửa phiếu nhập điều chuyển",
    path: "kho/nhap-dieu-chuyen/edit/:stt_rec",
    element: <DetailPhieuNhapDieuChuyen isEditMode={true} />,
  },

  {
    label: "Phiếu xuất điều chuyển",
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
    path: "kho/xuat-dieu-chuyen/chi-tiet/:stt_rec",
    element: <DetailPhieuXuatDieuChuyen />,
  },
  {
    label: "Chỉnh sửa phiếu xuất điều chuyển",
    path: "kho/xuat-dieu-chuyen/edit/:stt_rec",
    element: <DetailPhieuXuatDieuChuyen isEditMode={true} />,
  },


  {
    label: "Phiếu yêu cầu kiểm kê",
    path: "kho/yeu-cau-kiem-ke",
    element: <ListPhieuYeuCauKiemKe />,
  },

  {
    label: "Chi tiết phiếu yêu cầu kiểm kê",
    path: "kho/yeu-cau-kiem-ke/chi-tiet/:id",
    element: <DetailPhieuYeuCauKiemKe />,
  },
  {
    label: "Chỉnh sửa phiếu yêu cầu kiểm kê",
    path: "kho/yeu-cau-kiem-ke/chi-tiet/edit/:id",
    element: <DetailPhieuYeuCauKiemKe isEditMode={true} />,
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
  // Route kho chính - đặt CUỐI CÙNG sau tất cả các route con để tránh conflict
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
    errorElement: <ErrorPage />,
    children: mainRoutes,
  },
];

export default homeRoutes;
