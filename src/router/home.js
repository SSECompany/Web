import { lazy } from "react";
import App from "../App";
import Errorpage from "../components/Error/Errorpage";
import Contact from "../pages/Contact/Contact";
import Dashboard from "../pages/Dashboard/Pages/Dashboard";

import TransferHub from "../pages/TransferHub/TransferHub";
import reportsRoute from "./report";
import RORoutes from "./retail";
import systemRoutes from "./system";

const LoginHub = lazy(() => import("../pages/LoginHub/LoginHub"));
const Login = lazy(() => import("../pages/Login/Login"));

const homeRoutes = [
  {
    label: "Login nè",
    claims: "Permissions.login",
    path: "/login",
    element: <Login />,
    index: true,
  },
  {
    label: "Home nè",
    claims: "Permissions.home",
    path: "/",
    element: <App />,
    errorElement: <Errorpage />,
    children: [
      {
        label: "Dashboard",
        claims: "Permissions.dashboard",
        path: "Dashboard",
        element: <Dashboard />,
        children: [],
      },
      ...RORoutes,
      ...reportsRoute,
      ...systemRoutes,
      {
        label: "Liên hệ",
        claims: "",
        path: "contact",
        element: <Contact />,
      },
    ],
  },
  {
    label: "Login hub",
    claims: "Permissions.login",
    path: "/loginSSO",
    element: <LoginHub />,
    index: true,
  },
  {
    label: "Tranfering",
    claims: "Permissions.Transfer",
    path: "/transfer",
    element: <TransferHub />,
    index: true,
  },

  {
    path: "*",
    element: <Errorpage />,
  },
];

export default homeRoutes;
