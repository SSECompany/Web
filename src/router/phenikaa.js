import { lazy } from "react";

// Lazy load các components của Phenikaa POS
const PhenikaaMain = lazy(() =>
  import("../components/Phenikaa/Pages/Main/POSPage")
);
const PhenikkaDashboard = lazy(() =>
  import("../components/Phenikaa/Pages/Main/PhenikaaMain")
);
const PhenikaaOrders = lazy(() =>
  import("../components/Phenikaa/Pages/Orders/PhenikaaOrders")
);
const PhenikaaProducts = lazy(() =>
  import("../components/Phenikaa/Pages/Products/PhenikaaProducts")
);
const PhenikaaCustomers = lazy(() =>
  import("../components/Phenikaa/Pages/Customers/PhenikaaCustomers")
);
const PhenikaaReports = lazy(() =>
  import("../components/Phenikaa/Pages/Reports/PhenikaaReports")
);
const PhenikaaSettings = lazy(() =>
  import("../components/Phenikaa/Pages/Settings/PhenikaaSettings")
);
const MealTicketForm = lazy(() =>
  import("../components/Phenikaa/Pages/MealTicketForm")
);

const phenikaaRoutes = [
  {
    label: "POS",
    claims: "Permissions.Phenikaa",
    path: "pos",
    children: [],
  },
  {
    label: "POS Chính",
    claims: "Permissions.Phenikaa.Main",
    path: "pos-main",
    parent: "pos",
    element: <PhenikaaMain />,
  },
  {
    label: "POS Dashboard",
    claims: "Permissions.Phenikaa.Dashboard",
    path: "pos-dashboard",
    parent: "pos",
    element: <PhenikkaDashboard />,
  },
  {
    label: "Đơn hàng POS",
    claims: "Permissions.Phenikaa.Orders",
    path: "pos-orders",
    parent: "pos",
    element: <PhenikaaOrders />,
  },
  {
    label: "Sản phẩm POS",
    claims: "Permissions.Phenikaa.Products",
    path: "pos-products",
    parent: "pos",
    element: <PhenikaaProducts />,
  },
  {
    label: "Khách hàng POS",
    claims: "Permissions.Phenikaa.Customers",
    path: "pos-customers",
    parent: "pos",
    element: <PhenikaaCustomers />,
  },
  {
    label: "Báo cáo POS",
    claims: "Permissions.Phenikaa.Reports",
    path: "pos-reports",
    parent: "pos",
    element: <PhenikaaReports />,
  },
  {
    label: "Cài đặt POS",
    claims: "Permissions.Phenikaa.Settings",
    path: "pos-settings",
    parent: "pos",
    element: <PhenikaaSettings />,
  },
  {
    label: "Phiếu suất ăn",
    claims: "Permissions.Phenikaa.MealTicket",
    path: "meal-ticket",
    parent: "pos",
    element: <MealTicketForm />,
  },
];

export default phenikaaRoutes;
