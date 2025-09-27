import { lazy } from "react";

// Project Management Pages
const ProjectList = lazy(() =>
  import("../components/ProjectManagement/Pages/ProjectList/ProjectList")
);
const ProjectDetail = lazy(() =>
  import("../components/ProjectManagement/Pages/ProjectDetail/ProjectDetail")
);
const ProjectDocuments = lazy(() =>
  import(
    "../components/ProjectManagement/Pages/ProjectDocuments/ProjectDocuments"
  )
);
const ProjectCommunications = lazy(() =>
  import(
    "../components/ProjectManagement/Pages/ProjectCommunications/ProjectCommunications"
  )
);
const ProjectResources = lazy(() =>
  import(
    "../components/ProjectManagement/Pages/ProjectResources/ProjectResources"
  )
);
const ProjectProgressReport = lazy(() =>
  import("../components/ProjectManagement/Pages/Reports/ProjectProgressReport")
);
const ProjectVolumeReport = lazy(() =>
  import("../components/ProjectManagement/Pages/Reports/ProjectVolumeReport")
);
const ProjectCostReport = lazy(() =>
  import("../components/ProjectManagement/Pages/Reports/ProjectCostReport")
);
const ProjectKPIReport = lazy(() =>
  import("../components/ProjectManagement/Pages/Reports/ProjectKPIReport")
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
  {
    label: "Tài liệu dự án",
    claims: "Permissions.ProjectManagement.ProjectDocuments",
    path: "project-management/project/:id/documents",
    parent: "project-management",
    element: <ProjectDocuments />,
  },
  {
    label: "Trao đổi dự án",
    claims: "Permissions.ProjectManagement.ProjectCommunications",
    path: "project-management/project/:id/communications",
    parent: "project-management",
    element: <ProjectCommunications />,
  },
  {
    label: "Nguồn lực dự án",
    claims: "Permissions.ProjectManagement.ProjectResources",
    path: "project-management/project/:id/resources",
    parent: "project-management",
    element: <ProjectResources />,
  },
  {
    label: "Báo cáo tiến độ",
    claims: "Permissions.ProjectManagement.Reports.Progress",
    path: "project-management/reports/progress",
    parent: "project-management",
    element: <ProjectProgressReport />,
  },
  {
    label: "Báo cáo khối lượng",
    claims: "Permissions.ProjectManagement.Reports.Volume",
    path: "project-management/reports/volume",
    parent: "project-management",
    element: <ProjectVolumeReport />,
  },
  {
    label: "Báo cáo chi phí",
    claims: "Permissions.ProjectManagement.Reports.Cost",
    path: "project-management/reports/cost",
    parent: "project-management",
    element: <ProjectCostReport />,
  },
  {
    label: "Báo cáo KPI dự án",
    claims: "Permissions.ProjectManagement.Reports.KPI",
    path: "project-management/reports/kpi",
    parent: "project-management",
    element: <ProjectKPIReport />,
  },
];

export default projectRoutes;
