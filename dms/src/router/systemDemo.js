import Accounts from "../components/SystemOptions/Pages/Accounts/Accounts";
import DashboardOptions from "../components/SystemOptions/Pages/DashboardOptions/DashboardOptions";
import GroupPermissions from "../components/SystemOptions/Pages/GroupPermissions/GroupPermissions";
import ReportDashboardOptions from "../components/SystemOptions/Pages/ReportDashboardOptions/ReportDashboardOptions";
import UnitPermissions from "../components/SystemOptions/Pages/UnitPermissions/UnitPermissions";
import UserPermissions from "../components/SystemOptions/Pages/UserPermissions/UserPermissions";
import System from "../pages/System/Pages/System";

const systemRoutes = [
  {
    label: "Hệ thống",
    claims: "Permissions.system",
    path: "System",
    element: <System />,
    children: [
      {
        label: "Phân quyền tài khoản",
        claims: "Permissions.system.permissions",
        path: "UsersPermissions",
        element: <UserPermissions />,
        children: [],
      },
      {
        label: "Phân quyền nhóm",
        claims: "Permissions.system.permissions",
        path: "GroupPermissions",
        element: <GroupPermissions />,
        children: [],
      },
      {
        label: "Phân quyền đơn vị",
        claims: "Permissions.system.permissions",
        path: "UnitPermissions",
        element: <UnitPermissions />,
        children: [],
      },

      {
        label: "Tài khoản",
        claims: "Permissions.system.accounts",
        path: "Accounts",
        element: <Accounts />,
        children: [],
      },
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
    ],
  },
];

export default systemRoutes;
