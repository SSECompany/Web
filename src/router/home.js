import { lazy } from "react";
import { Navigate } from "react-router-dom";
import App from "../App";
import GenerateQR from "../components/common/GenerateQR/GenerateQR";
import POSPage from "../pages/order/POSPage";
import TransferHub from "../pages/transferHub/TransferHub";
import ProtectedRoute from "./ProtectedRoute";

const Login = lazy(() => import("../pages/login/Login"));


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
        ],
      },
      {
        label: "Transferring",
        path: "transfer",
        element: <TransferHub />,
        index: true,
      },
      {
        label: "Generate QR",
        path: "generate-qr",
        element: <GenerateQR />,
        index: true,
      },
      {
        path: "*",
        element: <Navigate to="/" replace />,
      },
    ],
  },
];

export default homeRoutes;