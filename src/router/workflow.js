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

// Task Management Pages
const TaskList = lazy(() =>
  import("../components/TaskManagement/Pages/TaskList/TaskList")
);
const TaskDetail = lazy(() =>
  import("../components/TaskManagement/Pages/TaskDetail/TaskDetail")
);
const TaskReports = lazy(() =>
  import("../components/TaskManagement/Pages/TaskReports/TaskReports")
);

// Calendar Pages
const CalendarView = lazy(() =>
  import("../components/Calendar/Pages/CalendarView/CalendarView")
);

// Roadmap Pages
const RoadmapView = lazy(() =>
  import("../components/Roadmap/Pages/RoadmapView/RoadmapView")
);

// Finance & Proposal Pages
const ProposalCenter = lazy(() =>
  import("../components/WorkflowFinance/Pages/ProposalCenter/ProposalCenter")
);
const FinanceLedger = lazy(() =>
  import("../components/WorkflowFinance/Pages/FinanceLedger/FinanceLedger")
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
        label: "Báo cáo công việc",
        claims: "",
        path: "task-management/reports",
        parent: "task-management",
        element: <TaskReports />,
      },

      // Calendar Routes
      {
        label: "Lịch",
        claims: "",
        path: "calendar",
        element: <CalendarView />,
      },

      // Roadmap Routes
      {
        label: "Roadmap",
        claims: "",
        path: "roadmap",
        element: <RoadmapView />,
      },

      // Proposal & Finance Routes
      {
        label: "Đề xuất & thu chi",
        claims: "",
        path: "finance",
        children: [],
      },
      {
        label: "Trung tâm đề xuất",
        claims: "",
        path: "finance/proposals",
        parent: "finance",
        element: <ProposalCenter />,
      },
      {
        label: "Sổ thu chi",
        claims: "",
        path: "finance/ledger",
        parent: "finance",
        element: <FinanceLedger />,
      },
    ],
  },
];

export default workflowRoutes;





