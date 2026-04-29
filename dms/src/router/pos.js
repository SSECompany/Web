import { lazy } from "react";

// Chỉ 1 trang POS duy nhất
const POSPage = lazy(() => import("../components/POS/Pages/Main/POSPage"));
const MealTicketForm = lazy(() =>
  import("../components/POS/Pages/MealTicketForm")
);

const posRoutes = [
  {
    label: "POS",
    claims: "Permissions.HDL.HDL",
    path: "/POS",
    element: <span></span>,
    children: [],
  },
  {
    label: "POS Bán hàng",
    claims: "Permissions.HDL.HDL",
    parent: "/POS",
    path: "POS/POSMain",
    element: <POSPage />,
  },
  {
    label: "Phiếu suất ăn",
    claims: "Permissions.HDL.HDL",
    parent: "/POS",
    path: "POS/MealTicket",
    element: <MealTicketForm />,
  },
];

export default posRoutes;
