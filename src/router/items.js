import ApproveItems from "../components/Items/Pages/ApproveItems/ApproveItems";
import Items from "../components/Items/Pages/Items/Items";

const itemsRoute = [
  {
    label: "Vật tư",
    claims: "Permissions.items",
    path: "items",
    children: [],
  },
  {
    label: "Danh mục vật tư",
    claims: "Permissions.items.list",
    path: "items/itemslist",
    parent: "items",
    element: <Items />,
  },
  {
    label: "Phân quyền vật tư",
    claims: "Permissions.items.itemsapprove",
    path: "items/approve",
    parent: "items",
    element: <ApproveItems />,
  },
];

export default itemsRoute;
