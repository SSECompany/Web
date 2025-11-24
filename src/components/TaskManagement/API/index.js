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

// Task Watchers APIs
export const apiGetTaskWatchers = (data) => {
  return TaskManagementGetApi({
    store: "Api_Get_Task_Watchers",
    data: data,
  });
};

export const apiAddTaskWatcher = (data) => {
  return TaskManagementApi({
    store: "Api_Add_Task_Watcher",
    data: data,
  });
};

export const apiRemoveTaskWatcher = (data) => {
  return TaskManagementApi({
    store: "Api_Remove_Task_Watcher",
    data: data,
  });
};

// Task Relations APIs
export const apiGetTaskRelations = (data) => {
  return TaskManagementGetApi({
    store: "Api_Get_Task_Relations",
    data: data,
  });
};

export const apiAddTaskRelation = (data) => {
  return TaskManagementApi({
    store: "Api_Add_Task_Relation",
    data: data,
  });
};

export const apiRemoveTaskRelation = (data) => {
  return TaskManagementApi({
    store: "Api_Remove_Task_Relation",
    data: data,
  });
};

// Task Subtasks APIs
export const apiGetTaskSubtasks = (data) => {
  return TaskManagementGetApi({
    store: "Api_Get_Task_Subtasks",
    data: data,
  });
};

export const apiAddTaskSubtask = (data) => {
  return TaskManagementApi({
    store: "Api_Add_Task_Subtask",
    data: data,
  });
};

export const apiUpdateTaskSubtask = (data) => {
  return TaskManagementApi({
    store: "Api_Update_Task_Subtask",
    data: data,
  });
};

export const apiDeleteTaskSubtask = (data) => {
  return TaskManagementApi({
    store: "Api_Delete_Task_Subtask",
    data: data,
  });
};

// Task Dependencies APIs
export const apiGetTaskDependencies = (data) => {
  return TaskManagementGetApi({
    store: "Api_Get_Task_Dependencies",
    data: data,
  });
};

export const apiAddTaskDependency = (data) => {
  return TaskManagementApi({
    store: "Api_Add_Task_Dependency",
    data: data,
  });
};

export const apiRemoveTaskDependency = (data) => {
  return TaskManagementApi({
    store: "Api_Remove_Task_Dependency",
    data: data,
  });
};

// Task Time Entries APIs
export const apiGetTaskTimeEntries = (data) => {
  return TaskManagementGetApi({
    store: "Api_Get_Task_Time_Entries",
    data: data,
  });
};

export const apiAddTaskTimeEntry = (data) => {
  return TaskManagementApi({
    store: "Api_Add_Task_Time_Entry",
    data: data,
  });
};

export const apiUpdateTaskTimeEntry = (data) => {
  return TaskManagementApi({
    store: "Api_Update_Task_Time_Entry",
    data: data,
  });
};

export const apiDeleteTaskTimeEntry = (data) => {
  return TaskManagementApi({
    store: "Api_Delete_Task_Time_Entry",
    data: data,
  });
};

// Task Comments APIs
export const apiGetTaskComments = (data) => {
  return TaskManagementGetApi({
    store: "Api_Get_Task_Comments",
    data: data,
  });
};

export const apiAddTaskComment = (data) => {
  return TaskManagementApi({
    store: "Api_Add_Task_Comment",
    data: data,
  });
};

export const apiUpdateTaskComment = (data) => {
  return TaskManagementApi({
    store: "Api_Update_Task_Comment",
    data: data,
  });
};

export const apiDeleteTaskComment = (data) => {
  return TaskManagementApi({
    store: "Api_Delete_Task_Comment",
    data: data,
  });
};

// Task History APIs
export const apiGetTaskHistory = (data) => {
  return TaskManagementGetApi({
    store: "Api_Get_Task_History",
    data: data,
  });
};

// Task Attachments APIs
export const apiGetTaskAttachments = (data) => {
  return TaskManagementGetApi({
    store: "Api_Get_Task_Attachments",
    data: data,
  });
};

export const apiUploadTaskAttachment = (data) => {
  return TaskManagementApi({
    store: "Api_Upload_Task_Attachment",
    data: data,
  });
};

export const apiDeleteTaskAttachment = (data) => {
  return TaskManagementApi({
    store: "Api_Delete_Task_Attachment",
    data: data,
  });
};

// Task Approval APIs
export const apiGetTaskApproval = (data) => {
  return TaskManagementGetApi({
    store: "Api_Get_Task_Approval",
    data: data,
  });
};

export const apiApproveTask = (data) => {
  return TaskManagementApi({
    store: "Api_Approve_Task",
    data: data,
  });
};

export const apiRejectTask = (data) => {
  return TaskManagementApi({
    store: "Api_Reject_Task",
    data: data,
  });
};

export const apiRequestTaskRevision = (data) => {
  return TaskManagementApi({
    store: "Api_Request_Task_Revision",
    data: data,
  });
};

export const apiSubmitTaskForApproval = (data) => {
  return TaskManagementApi({
    store: "Api_Submit_Task_For_Approval",
    data: data,
  });
};

// Task Templates APIs
export const apiGetTaskTemplates = (data) => {
  return TaskManagementGetApi({
    store: "Api_Get_Task_Templates",
    data: data,
  });
};

export const apiCreateTaskTemplate = (data) => {
  return TaskManagementApi({
    store: "Api_Create_Task_Template",
    data: data,
  });
};

export const apiUpdateTaskTemplate = (data) => {
  return TaskManagementApi({
    store: "Api_Update_Task_Template",
    data: data,
  });
};

export const apiDeleteTaskTemplate = (data) => {
  return TaskManagementApi({
    store: "Api_Delete_Task_Template",
    data: data,
  });
};

export const apiUseTaskTemplate = (data) => {
  return TaskManagementGetApi({
    store: "Api_Use_Task_Template",
    data: data,
  });
};

// Bulk Operations APIs
export const apiBulkUpdateTasks = (data) => {
  return TaskManagementApi({
    store: "Api_Bulk_Update_Tasks",
    data: data,
  });
};

export const apiBulkDeleteTasks = (data) => {
  return TaskManagementApi({
    store: "Api_Bulk_Delete_Tasks",
    data: data,
  });
};

export const apiBulkAssignTasks = (data) => {
  return TaskManagementApi({
    store: "Api_Bulk_Assign_Tasks",
    data: data,
  });
};

export const apiBulkUpdateTaskStatus = (data) => {
  return TaskManagementApi({
    store: "Api_Bulk_Update_Task_Status",
    data: data,
  });
};

// Saved Filters APIs
export const apiGetSavedFilters = (data) => {
  return TaskManagementGetApi({
    store: "Api_Get_Saved_Filters",
    data: data,
  });
};

export const apiSaveFilter = (data) => {
  return TaskManagementApi({
    store: "Api_Save_Filter",
    data: data,
  });
};

export const apiDeleteSavedFilter = (data) => {
  return TaskManagementApi({
    store: "Api_Delete_Saved_Filter",
    data: data,
  });
};

// Export APIs
export const apiExportTasks = (data) => {
  return TaskManagementGetApi({
    store: "Api_Export_Tasks",
    data: data,
  });
};

// Notifications APIs
export const apiGetTaskNotifications = (data) => {
  return TaskManagementGetApi({
    store: "Api_Get_Task_Notifications",
    data: data,
  });
};

export const apiMarkNotificationRead = (data) => {
  return TaskManagementApi({
    store: "Api_Mark_Notification_Read",
    data: data,
  });
};

export const apiDeleteNotification = (data) => {
  return TaskManagementApi({
    store: "Api_Delete_Notification",
    data: data,
  });
};

export const apiMarkAllNotificationsRead = (data) => {
  return TaskManagementApi({
    store: "Api_Mark_All_Notifications_Read",
    data: data,
  });
};









