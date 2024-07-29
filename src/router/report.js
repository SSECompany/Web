import ReportLayout from "../components/Report/Pages/ReportLayout/ReportLayout";
import SaleInvoiceReport from "../components/Report/Pages/SaleInvoiceReport/SaleInvoiceReport";
import SaleSummaryReport from "../components/Report/Pages/SaleSummaryReport/SaleSummaryReport";

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
        element: <SaleInvoiceReport />,
      },

      {
        label: "Tổng hợp bán hàng",
        claims: "Permissions.reports.saleSummary",
        path: "rptSalesSummary",
        children: [],
        element: <SaleSummaryReport />,
      },
    ],
  },
];

export default reportsRoute;
