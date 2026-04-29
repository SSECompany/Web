import { lazy } from "react";

// Project Management Pages
const ProjectList = lazy(() =>
  import("../components/ProjectManagement/Pages/ProjectList/ProjectList")
);
const ProjectDetail = lazy(() =>
  import("../components/ProjectManagement/Pages/ProjectDetail/ProjectDetail")
);
const projectRoutes = [
  {
    label: "Quản lý dự án",
    claims: "", // Tạm thời bỏ claims để test
    path: "project-management",
    children: [],
  },
  {
    label: "Danh sách dự án",
    claims: "", // Tạm thời bỏ claims để test
    path: "project-management/projects",
    parent: "project-management",
    element: <ProjectList />,
  },
  {
    label: "Chi tiết dự án",
    claims: "Permissions.ProjectManagement.ProjectDetail",
    path: "project-management/project/:id",
    parent: "project-management",
    element: <ProjectDetail />,
  },
];

export default projectRoutes;
