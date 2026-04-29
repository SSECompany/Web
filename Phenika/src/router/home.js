import { lazy } from "react";
import { Navigate } from "react-router-dom";
import App from "../App";
import ErrorPage from "../components/common/ErrorPage/ErrorPage";
import GenerateQR from "../components/common/GenerateQR/GenerateQR";
import MealTicketForm from "../pages/mealTicket/MealTicketForm";
import POSPage from "../pages/order/POSPage";
import ProtectedRoute from "./ProtectedRoute";

const Login = lazy(() => import("../pages/Login/Login"));

const homeRoutes = [
  {
    path: "/",
    element: <App />,
    children: [
      {
        label: "Login",
        claims: "Permissions.login",
        path: "login",
        element: <Login />,
        index: true,
      },
      {
        label: "Protected",
        path: "/",
        element: <ProtectedRoute />,
        children: [
          {
            label: "POSPage",
            path: "",
            element: <POSPage />,
          },
          {
            label: "Order",
            path: "order/:orderId",
            element: <POSPage />,
            index: true,
          },
          {
            label: "Meal Ticket Form",
            path: "meal-ticket",
            element: <MealTicketForm />,
          },
        ],
      },
      {
        label: "Generate QR",
        path: "generate-qr",
        element: <GenerateQR />,
        index: true,
      },
      {
        path: "*",
        element: <Navigate to="/error" replace />,
      },
      {
        label: "Error",
        path: "error",
        element: <ErrorPage />,
      },
    ],
  },
];

export default homeRoutes;
