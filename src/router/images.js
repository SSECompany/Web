import AlbumsList from "../components/DMS/Pages/Albums/AlbumsList";
import ImagesList from "../components/DMS/Pages/Images/ImagesList";

const imageRoutes = [
  {
    label: "Hình ảnh",
    claims: "Permissions.images",
    path: "images",
    children: [],
  },
  {
    label: "Danh mục album",
    claims: "Permissions.images.albums",
    path: "images/albums",
    parent: "images",
    element: <AlbumsList />,
  },
  {
    label: "Hình ảnh",
    claims: "Permissions.images.imagelist",
    path: "images/gallary",
    parent: "images",
    element: <ImagesList />,
  },
];

export default imageRoutes;
