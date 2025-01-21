import POSPage from "../modules/order/view/order/POSPage";



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
    path: "*",
  },
];

export default homeRoutes;
