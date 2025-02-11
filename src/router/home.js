import { lazy } from "react";
import { Navigate, Outlet, useLocation, useParams } from "react-router-dom";
import App from "../App";
import POSPage from "../modules/order/view/order/POSPage";
import TransferHub from "../pages/TransferHub/TransferHub";

const Login = lazy(() => import("../pages/Login/Login"));

const ProtectedRoute = () => {
  const token = localStorage.getItem("access_token");
  const location = useLocation();
  const { orderId } = useParams();

  if (token) {
    return <Outlet />;
  }

  if (location.pathname === "/" && !token) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={`/order/${orderId}`} replace />;
};

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
        ],
      },
      {
        label: "Order",
        path: "order/:orderId",
        element: <POSPage />,
        index: true,
      },
      {
        label: "Transferring",
        path: "transfer",
        element: <TransferHub />,
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