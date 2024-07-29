import RetailOrder from "../components/Retail/Pages/RetailOrder/RetailOrder";

const RORoutes = [
  {
    label: "Bán lẻ",
    // claims: "Permissions.Retail",
    claims: "Permissions.documents.customerform",
    path: "/RO",
    element: <span></span>,
    children: [],
  },
  {
    label: "Bán lẻ",
    // claims: "Permissions.RO.RetailOrder",
    claims: "Permissions.documents.customerform",
    parent: "/RO",
    path: "RO/Reatailorder",
    element: <RetailOrder />,
  },
];

export default RORoutes;
