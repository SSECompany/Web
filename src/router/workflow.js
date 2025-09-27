import { lazy } from "react";

// Workflow App Layout
const WorkflowApp = lazy(() => import("../components/WorkflowApp/WorkflowApp"));

// Workflow Dashboard
const WorkflowDashboard = lazy(() =>
  import("../pages/Workflow/Dashboard/WorkflowDashboard")
);

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

// Task Management Pages
const TaskList = lazy(() =>
  import("../components/TaskManagement/Pages/TaskList/TaskList")
);
const TaskDetail = lazy(() =>
  import("../components/TaskManagement/Pages/TaskDetail/TaskDetail")
);
const TaskAssignment = lazy(() =>
  import("../components/TaskManagement/Pages/TaskAssignment/TaskAssignment")
);
const TaskReminders = lazy(() =>
  import("../components/TaskManagement/Pages/TaskReminders/TaskReminders")
);
const TaskProgressReport = lazy(() =>
  import("../components/TaskManagement/Pages/Reports/TaskProgressReport")
);
const TaskKPIReport = lazy(() =>
  import("../components/TaskManagement/Pages/Reports/TaskKPIReport")
);

const workflowRoutes = [
  {
    label: "Workflow System",
    claims: "",
    path: "workflow",
    element: <WorkflowApp />,
    children: [
      {
        label: "Dashboard",
        claims: "",
        path: "dashboard",
        element: <WorkflowDashboard />,
        index: true,
      },

      // Project Management Routes
      {
        label: "Quản lý dự án",
        claims: "",
        path: "project-management",
        children: [],
      },
      {
        label: "Danh sách dự án",
        claims: "",
        path: "project-management/projects",
        parent: "project-management",
        element: <ProjectList />,
      },
      {
        label: "Chi tiết dự án",
        claims: "",
        path: "project-management/project/:id",
        parent: "project-management",
        element: <ProjectDetail />,
      },
      {
        label: "Tài liệu dự án",
        claims: "",
        path: "project-management/project/:id/documents",
        parent: "project-management",
        element: <ProjectDocuments />,
      },
      {
        label: "Trao đổi dự án",
        claims: "",
        path: "project-management/project/:id/communications",
        parent: "project-management",
        element: <ProjectCommunications />,
      },
      {
        label: "Nguồn lực dự án",
        claims: "",
        path: "project-management/project/:id/resources",
        parent: "project-management",
        element: <ProjectResources />,
      },
      {
        label: "Báo cáo tiến độ dự án",
        claims: "",
        path: "project-management/reports/progress",
        parent: "project-management",
        element: <ProjectProgressReport />,
      },
      {
        label: "Báo cáo khối lượng dự án",
        claims: "",
        path: "project-management/reports/volume",
        parent: "project-management",
        element: <ProjectVolumeReport />,
      },
      {
        label: "Báo cáo chi phí dự án",
        claims: "",
        path: "project-management/reports/cost",
        parent: "project-management",
        element: <ProjectCostReport />,
      },
      {
        label: "Báo cáo KPI dự án",
        claims: "",
        path: "project-management/reports/kpi",
        parent: "project-management",
        element: <ProjectKPIReport />,
      },

      // Task Management Routes
      {
        label: "Quản lý công việc",
        claims: "",
        path: "task-management",
        children: [],
      },
      {
        label: "Danh sách công việc",
        claims: "",
        path: "task-management/tasks",
        parent: "task-management",
        element: <TaskList />,
      },
      {
        label: "Chi tiết công việc",
        claims: "",
        path: "task-management/task/:id",
        parent: "task-management",
        element: <TaskDetail />,
      },
      {
        label: "Giao việc",
        claims: "",
        path: "task-management/assignment",
        parent: "task-management",
        element: <TaskAssignment />,
      },
      {
        label: "Nhắc việc",
        claims: "",
        path: "task-management/reminders",
        parent: "task-management",
        element: <TaskReminders />,
      },
      {
        label: "Báo cáo tiến độ công việc",
        claims: "",
        path: "task-management/reports/progress",
        parent: "task-management",
        element: <TaskProgressReport />,
      },
      {
        label: "Báo cáo KPI công việc",
        claims: "",
        path: "task-management/reports/kpi",
        parent: "task-management",
        element: <TaskKPIReport />,
      },
    ],
  },
];

export default workflowRoutes;





