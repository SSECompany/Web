import RetailOrder from "../components/Retail/Pages/RetailOrder2/RetailOrder";
import OnlineOrder from "../components/Retail/Pages/OnlineOrder/OnlineOrder";
import StockTransfer from "../components/Transfer/Pages/Transfer/Transfer";

const RORoutes = [
  {
    label: "Bán lẻ",
    // claims: "Permissions.Retail",
    claims: "Permissions.HDL.HDL",
    path: "/RO",
    element: <span></span>,
    children: [],
  },
  {
    label: "Bán lẻ",
    // claims: "Permissions.RO.RetailOrder",
    claims: "Permissions.HDL.HDL",
    parent: "/RO",
    path: "RO/Reatailorder",
    element: <RetailOrder />,
  },
  {
    label: "Hóa đơn Online",
    // claims: "Permissions.Retail",
    claims: "Permissions.HDO.HDO",
    path: "/HDO",
    element: <span></span>,
    children: [],
  },
  {
    label: "Hóa đơn Online",
    // claims: "Permissions.RO.RetailOrder",
    claims: "Permissions.HDO.HDO",
    parent: "/HDO",
    path: "HDO/OnlineOrder",
    element: <OnlineOrder />,
  },
  {
    label: "Đề nghị điều chuyển",
    // claims: "Permissions.RO.RetailOrder",
    claims: "Permissions.ST.ST",
    path: "/SAT",
    element: <StockTransfer />,
  },
];

export default RORoutes;
