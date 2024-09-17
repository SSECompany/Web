import RetailOrder from "../components/Retail/Pages/RetailOrder/RetailOrder";
import OnlineOrder from "../components/Retail/Pages/OnlineOrder/OnlineOrder";

const RORoutes = [
  {
    label: "Bán lẻ",
    // claims: "Permissions.Retail",
    claims: "Permissions.HDL",
    path: "/RO",
    element: <span></span>,
    children: [],
  },
  {
    label: "Bán lẻ",
    // claims: "Permissions.RO.RetailOrder",
    claims: "Permissions.HDL",
    parent: "/RO",
    path: "RO/Reatailorder",
    element: <RetailOrder />,
  },
  {
    label: "Hóa đơn Online",
    // claims: "Permissions.Retail",
    claims: "Permissions.HDO",
    path: "/HDO",
    element: <span></span>,
    children: [],
  },
  {
    label: "Hóa đơn Online",
    // claims: "Permissions.RO.RetailOrder",
    claims: "Permissions.HDO",
    parent: "/HDO",
    path: "HDO/OnlineOrder",
    element: <OnlineOrder />,
  },
];

export default RORoutes;
