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
const TaskReminders = lazy(() =>
  import("../components/TaskManagement/Pages/TaskReminders/TaskReminders")
);
const ResourceBoard = lazy(() =>
  import("../components/TaskManagement/Pages/ResourceBoard/ResourceBoard")
);
const TaskTemplates = lazy(() =>
  import("../components/TaskManagement/Pages/TaskTemplates/TaskTemplates")
);
const TaskForms = lazy(() =>
  import("../components/TaskManagement/Pages/TaskForms/TaskForms")
);
const TaskCategories = lazy(() =>
  import("../components/TaskManagement/Pages/TaskCategories/TaskCategories")
);

// Calendar Pages
const CalendarView = lazy(() =>
  import("../components/Calendar/Pages/CalendarView/CalendarView")
);

// Roadmap Pages
const RoadmapView = lazy(() =>
  import("../components/Roadmap/Pages/RoadmapView/RoadmapView")
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
      {
        label: "Quản lý nhắc việc",
        claims: "",
        path: "task-management/reminders",
        parent: "task-management",
        element: <TaskReminders />,
      },
      {
        label: "Bảng nguồn lực",
        claims: "",
        path: "task-management/resources",
        parent: "task-management",
        element: <ResourceBoard />,
      },
      {
        label: "Công việc mẫu",
        claims: "",
        path: "task-management/templates",
        parent: "task-management",
        element: <TaskTemplates />,
      },
      {
        label: "Biểu mẫu",
        claims: "",
        path: "task-management/forms",
        parent: "task-management",
        element: <TaskForms />,
      },
      {
        label: "Hạng mục",
        claims: "",
        path: "task-management/categories",
        parent: "task-management",
        element: <TaskCategories />,
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

    ],
  },
];

export default workflowRoutes;





