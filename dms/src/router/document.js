// import { lazy } from "react";

// const CustomerArea = lazy(() =>
//   import("../components/DMS/Pages/CustomerArea/CustomerArea")
// );

// const CustomerForm = lazy(() =>
//   import("../components/DMS/Pages/CustomerForm/CustomerForm")
// );

// const CustomerClassify = lazy(() =>
//   import("../components/DMS/Pages/CustomerClassify/CustomerClassify")
// );

// const CustomerResource = lazy(() =>
//   import("../components/DMS/Pages/CustomerResource/CustomerResource")
// );
import CustomerArea from "../components/DMS/Pages/CustomerArea/CustomerArea";
import CustomerClassify from "../components/DMS/Pages/CustomerClassify/CustomerClassify";
import CustomerForm from "../components/DMS/Pages/CustomerForm/CustomerForm";
import CustomerResource from "../components/DMS/Pages/CustomerResource/CustomerResource";
import SaleEmployee from "../components/SaleOrder/Pages/SaleEmployee/SaleEmployee";

const documentsRoutes = [
  {
    label: "Danh mục từ điển",
    claims: "Permissions.documents",
    path: "documents",
    children: [],
  },

  {
    label: "Danh mục nguồn khách hàng",
    claims: "Permissions.documents.customerresource",
    path: "documents/customerresource",
    parent: "documents",
    element: <CustomerResource />,
  },
  {
    label: "Danh mục phân loại",
    claims: "Permissions.documents.classifylist",
    path: "documents/classifylist",
    parent: "documents",
    element: <CustomerClassify />,
  },
  {
    label: "Danh mục hình thức",
    claims: "Permissions.documents.customerform",
    path: "documents/customerform",
    parent: "documents",
    element: <CustomerForm />,
  },
  {
    label: "Danh mục khu vực",
    claims: "Permissions.documents.customerarea",
    path: "documents/customerarea",
    parent: "documents",
    element: <CustomerArea />,
  },
  {
    label: "Danh mục nhân viên",
    claims: "Permissions.documents.customerlist",
    path: "documents/customerlist",
    parent: "documents",
    element: <SaleEmployee />,
  },
];

export default documentsRoutes;
