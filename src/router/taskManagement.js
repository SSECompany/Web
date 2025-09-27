import { lazy } from "react";

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

const taskManagementRoutes = [
  {
    label: "Quản lý công việc",
    claims: "", // Tạm thời bỏ claims để test
    path: "task-management",
    children: [],
  },
  {
    label: "Danh sách công việc",
    claims: "", // Tạm thời bỏ claims để test
    path: "task-management/tasks",
    parent: "task-management",
    element: <TaskList />,
  },
  {
    label: "Chi tiết công việc",
    claims: "Permissions.TaskManagement.TaskDetail",
    path: "task-management/task/:id",
    parent: "task-management",
    element: <TaskDetail />,
  },
  {
    label: "Giao việc",
    claims: "Permissions.TaskManagement.TaskAssignment",
    path: "task-management/assignment",
    parent: "task-management",
    element: <TaskAssignment />,
  },
  {
    label: "Nhắc việc",
    claims: "Permissions.TaskManagement.TaskReminders",
    path: "task-management/reminders",
    parent: "task-management",
    element: <TaskReminders />,
  },
  {
    label: "Báo cáo tiến độ công việc",
    claims: "Permissions.TaskManagement.Reports.Progress",
    path: "task-management/reports/progress",
    parent: "task-management",
    element: <TaskProgressReport />,
  },
  {
    label: "Báo cáo KPI công việc",
    claims: "Permissions.TaskManagement.Reports.KPI",
    path: "task-management/reports/kpi",
    parent: "task-management",
    element: <TaskKPIReport />,
  },
];

export default taskManagementRoutes;
