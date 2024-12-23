import EditOrder from "components/Retail/Pages/EditOrder/EditOrder";
import OnlineOrder from "../components/Retail/Pages/OnlineOrder2/RetailOrder";
import RetailOrder from "../components/Retail/Pages/RetailOrder2/RetailOrder";
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
  // {
  //   claims: "Permissions.HDL.HDL",
  //   parent: "/RO",
  //   path: "RO/DetailRetailViewer",
  //   element: <DetailRetailViewer />,
  // },

  {
    label: "Hóa đơn Online",
    // claims: "Permissions.Retail",
    claims: "Permissions.HDO.HDO",
    path: "/HDO",
    element: <span></span>,
    children: [],
  },
  {
    label: "Sửa đơn",
    path: "/EditOrder/:id",
    element: <EditOrder />,
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
