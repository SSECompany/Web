import CheckinReport from "../components/Report/Pages/CheckinReport/CheckinReport";
import ReportLayout from "../components/Report/Pages/ReportLayout/ReportLayout";

const reportsRoute = [
  {
    label: "Báo cáo",
    claims: "Permissions.reports",
    path: "reports",
    element: <ReportLayout />,
    children: [
      {
        label: "Bảng kê hoá đơn bán hàng",
        claims: "Permissions.reports.orderList",
        path: "rptOrderList",
        children: [],
        element: <CheckinReport />,
      },
    ],
  },
];

export default reportsRoute;
