import SaleOrder from "../components/SaleOrder/Pages/SaleOrder/SaleOrder";
import SaleOut from "../components/SaleOrder/Pages/SaleOut/SaleOut";

const SORoutes = [
  {
    label: "Đơn hàng",
    claims: "Permissions.SO",
    path: "SO",
    element: <span></span>,
    children: [],
  },
  {
    label: "Đơn hàng Sale Out",
    claims: "Permissions.SO.SaleOut",
    parent: "SO",
    path: "SO/SaleOut",
    element: <SaleOut />,
  },
  {
    label: "Đơn bán lẻ",
    claims: "Permissions.SO.SaleOrder",
    parent: "SO",
    path: "SO/SaleOrder",
    element: <SaleOrder />,
  },
];

export default SORoutes;
