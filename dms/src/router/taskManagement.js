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
];

export default taskManagementRoutes;
