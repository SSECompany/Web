import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  tasksList: [],
  currentTask: null,
  assignedTasks: [],
  taskReminders: [],
  taskReports: {
    progress: [],
    kpi: [],
  },
  taskStatuses: [],
  loading: false,
  error: null,
  pagination: {
    pageindex: 1,
    pageSize: 10,
    total: 0,
  },
  filters: {
    searchKey: "",
    status: "",
    priority: "",
    assignedTo: "",
    dueDate: null,
    projectId: "",
    departmentId: "",
    showAllDepartments: false,
  },
};

const taskSlice = createSlice({
  name: "tasks",
  initialState,
  reducers: {
    // Tasks List
    setTasksList: (state, action) => {
      state.tasksList = action.payload;
    },
    setCurrentTask: (state, action) => {
      state.currentTask = action.payload;
    },
    addTask: (state, action) => {
      state.tasksList.push(action.payload);
    },
    updateTask: (state, action) => {
      const index = state.tasksList.findIndex(
        (task) => task.id === action.payload.id
      );
      if (index !== -1) {
        state.tasksList[index] = action.payload;
      }
    },
    removeTask: (state, action) => {
      state.tasksList = state.tasksList.filter(
        (task) => task.id !== action.payload
      );
    },

    // Task Assignment
    setAssignedTasks: (state, action) => {
      state.assignedTasks = action.payload;
    },
    assignTask: (state, action) => {
      const task = state.tasksList.find((t) => t.id === action.payload.taskId);
      if (task) {
        task.assignedTo = action.payload.assignedTo;
        task.assignedDate = action.payload.assignedDate;
      }
    },

    // Task Reminders
    setTaskReminders: (state, action) => {
      state.taskReminders = action.payload;
    },
    addTaskReminder: (state, action) => {
      state.taskReminders.push(action.payload);
    },
    removeTaskReminder: (state, action) => {
      state.taskReminders = state.taskReminders.filter(
        (reminder) => reminder.id !== action.payload
      );
    },

    // Task Status
    setTaskStatuses: (state, action) => {
      state.taskStatuses = action.payload;
    },
    updateTaskStatus: (state, action) => {
      const task = state.tasksList.find((t) => t.id === action.payload.taskId);
      if (task) {
        task.status = action.payload.status;
        task.completedDate = action.payload.completedDate;
        task.progress = action.payload.progress;
      }
    },

    // Task Reports
    setTaskProgressReport: (state, action) => {
      state.taskReports.progress = action.payload;
    },
    setTaskKPIReport: (state, action) => {
      state.taskReports.kpi = action.payload;
    },

    // Loading and Error
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },

    // Pagination
    setPagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },

    // Filters
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    setDepartmentFilter: (state, action) => {
      state.filters.departmentId = action.payload.departmentId;
      state.filters.showAllDepartments =
        action.payload.showAllDepartments || false;
    },
    resetFilters: (state) => {
      state.filters = initialState.filters;
    },

    // Reset state
    resetTaskState: (state) => {
      return initialState;
    },
  },
});

export const {
  setTasksList,
  setCurrentTask,
  addTask,
  updateTask,
  removeTask,
  setAssignedTasks,
  assignTask,
  setTaskReminders,
  addTaskReminder,
  removeTaskReminder,
  setTaskStatuses,
  updateTaskStatus,
  setTaskProgressReport,
  setTaskKPIReport,
  setLoading,
  setError,
  setPagination,
  setFilters,
  setDepartmentFilter,
  resetFilters,
  resetTaskState,
} = taskSlice.actions;

export const taskManagementReducer = taskSlice.reducer;
