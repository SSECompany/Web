import DashboardOptions from "../components/SystemOptions/Pages/DashboardOptions/DashboardOptions";
import ReportDashboardOptions from "../components/SystemOptions/Pages/ReportDashboardOptions/ReportDashboardOptions";
import PermissionSetting from "../components/SystemOptions/Pages/PermissionSetting/PermissionSetting";
import System from "../pages/System/Pages/System";

const systemRoutes = [
  {
    label: "Hệ thống",
    claims: "Permissions.system",
    path: "System",
    element: <System />,
    children: [
      {
        label: "Quản lý dashboard",
        claims: "Permissions.system.dashboards",
        path: "DashboardOptions",
        element: <DashboardOptions />,
        children: [],
      },

      {
        label: "Quản lý báo cáo tổng hợp",
        claims: "Permissions.system.dashboards",
        path: "RpDashboardOptions",
        element: <ReportDashboardOptions />,
        children: [],
      },
      {
        label: "Phân quyền tài khoản",
        claims: "Permissions.system.Permission",
        path: "Permission",
        element: <PermissionSetting />,
        children: [],
      },
    ],
  },
];

export default systemRoutes;
