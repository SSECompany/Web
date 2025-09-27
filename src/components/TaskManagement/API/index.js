import { multipleTablePutApi } from "../../../api";

// Task Management APIs
export const TaskManagementApi = (data) => {
  return multipleTablePutApi({
    store: data.store,
    data: data.data,
  });
};

export const TaskManagementGetApi = (data) => {
  return multipleTablePutApi({
    store: data.store,
    data: data.data,
  });
};

// API endpoints for Task Management
export const apiGetTasks = (data) => {
  return TaskManagementGetApi({
    store: "Api_Get_Tasks",
    data: data,
  });
};

export const apiCreateTask = (data) => {
  return TaskManagementApi({
    store: "Api_Create_Task",
    data: data,
  });
};

export const apiUpdateTask = (data) => {
  return TaskManagementApi({
    store: "Api_Update_Task",
    data: data,
  });
};

export const apiDeleteTask = (data) => {
  return TaskManagementApi({
    store: "Api_Delete_Task",
    data: data,
  });
};

// Task Assignment APIs
export const apiAssignTask = (data) => {
  return TaskManagementApi({
    store: "Api_Assign_Task",
    data: data,
  });
};

export const apiGetAssignedTasks = (data) => {
  return TaskManagementGetApi({
    store: "Api_Get_Assigned_Tasks",
    data: data,
  });
};

// Task Reminder APIs
export const apiCreateTaskReminder = (data) => {
  return TaskManagementApi({
    store: "Api_Create_Task_Reminder",
    data: data,
  });
};

export const apiGetTaskReminders = (data) => {
  return TaskManagementGetApi({
    store: "Api_Get_Task_Reminders",
    data: data,
  });
};

// Task Reports APIs
export const apiGetTaskProgressReport = (data) => {
  return TaskManagementGetApi({
    store: "Api_Get_Task_Progress_Report",
    data: data,
  });
};

export const apiGetTaskKPIReport = (data) => {
  return TaskManagementGetApi({
    store: "Api_Get_Task_KPI_Report",
    data: data,
  });
};

// Task Status APIs
export const apiUpdateTaskStatus = (data) => {
  return TaskManagementApi({
    store: "Api_Update_Task_Status",
    data: data,
  });
};

export const apiGetTaskStatuses = (data) => {
  return TaskManagementGetApi({
    store: "Api_Get_Task_Statuses",
    data: data,
  });
};









