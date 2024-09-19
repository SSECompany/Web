import DashboardOptions from "../components/SystemOptions/Pages/DashboardOptions/DashboardOptions";
import ReportDashboardOptions from "../components/SystemOptions/Pages/ReportDashboardOptions/ReportDashboardOptions";
import PermissionSetting from "../components/SystemOptions/Pages/PermissionSetting/PermissionSetting";
import System from "../pages/System/Pages/System";

const systemRoutes = [
  {
    label: "Hệ thống",
    claims: "Permissions.System",
    path: "System",
    element: <System />,
    children: [
      {
        label: "Quản lý dashboard",
        claims: "Permissions.System.DashboardOptions",
        path: "DashboardOptions",
        element: <DashboardOptions />,
        children: [],
      },

      {
        label: "Quản lý báo cáo tổng hợp",
        claims: "Permissions.System.RpDashboardOptions",
        path: "RpDashboardOptions",
        element: <ReportDashboardOptions />,
        children: [],
      },
      {
        label: "Phân quyền tài khoản",
        claims: "Permissions.System.Permission",
        path: "Permission",
        element: <PermissionSetting />,
        children: [],
      },
    ],
  },
];

export default systemRoutes;
