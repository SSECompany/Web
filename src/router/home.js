import POSPage from "../modules/order/view/order/POSPage";
import TransferHub from "../pages/TransferHub/TransferHub";



const homeRoutes = [
  // {
  //   label: "Login",
  //   claims: "Permissions.login",
  //   path: "/login",
  //   element: <Login />,
  //   index: true,
  // },
  {
    label: "Home",
    path: "/",
    element: <POSPage />,
    children: [
      {
        label: "POSPage",
        path: "POSPage",
        element: <POSPage />,
        children: [],
      },



    ],
  },
  {
    label: "Tranfering",
    path: "transfer",
    element: <TransferHub />,
    index: true,
  },
  {
    path: "*",
  },
];

export default homeRoutes;
