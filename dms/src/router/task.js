import Test from "../components/DMS/Modals/Test";
import Maps from "../components/DMS/Pages/Maps/Maps";
import TaskList from "../components/DMS/Pages/Task/TaskList";
import TaskSchedule from "../components/DMS/Pages/TaskSchedule/TaskSchedule";
import TaskTypeList from "../components/DMS/Pages/TaskType/TaskTypeList";

const taskRoutes = [
  {
    label: "Công việc",
    claims: "Permissions.task",
    path: "task",
    children: [],
  },
  {
    label: "Danh mục lịch công việc",
    claims: "Permissions.task.taskSchedule",
    path: "task/taskSchedule",
    parent: "task",
    element: <TaskSchedule />,
  },
  {
    label: "Danh mục công việc",
    claims: "Permissions.task.taskList",
    path: "task/tasklist",
    parent: "task",
    element: <TaskList />,
  },
  {
    label: "Danh mục loại công việc",
    claims: "Permissions.task.taskType",
    path: "task/tasktypelist",
    parent: "task",
    element: <TaskTypeList />,
  },
  {
    label: "Danh mục tesst",
    claims: "Permissions.task.dmcongviec",
    path: "task/testt",
    parent: "task",
    element: <Test />,
  },

  {
    label: "Vị trí bất thường",
    claims: "Permissions.task.locations.abnormal",
    path: "task/locations/abnormal",
    parent: "task",
    element: <Maps />,
  },
];

export default taskRoutes;
