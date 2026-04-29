import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  projectsList: [],
  currentProject: null,
  projectDocuments: [],
  projectCommunications: [],
  projectResources: [],
  projectReports: {
    progress: [],
    volume: [],
    cost: [],
    kpi: [],
  },
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
    startDate: null,
    endDate: null,
    projectManager: "",
    departmentId: "",
    showAllDepartments: false,
  },
};

const projectSlice = createSlice({
  name: "projects",
  initialState,
  reducers: {
    // Projects List
    setProjectsList: (state, action) => {
      state.projectsList = action.payload;
    },
    setCurrentProject: (state, action) => {
      state.currentProject = action.payload;
    },
    addProject: (state, action) => {
      state.projectsList.push(action.payload);
    },
    updateProject: (state, action) => {
      const index = state.projectsList.findIndex(
        (project) => project.id === action.payload.id
      );
      if (index !== -1) {
        state.projectsList[index] = action.payload;
      }
    },
    removeProject: (state, action) => {
      state.projectsList = state.projectsList.filter(
        (project) => project.id !== action.payload
      );
    },

    // Project Documents
    setProjectDocuments: (state, action) => {
      state.projectDocuments = action.payload;
    },
    addProjectDocument: (state, action) => {
      state.projectDocuments.push(action.payload);
    },
    removeProjectDocument: (state, action) => {
      state.projectDocuments = state.projectDocuments.filter(
        (doc) => doc.id !== action.payload
      );
    },

    // Project Communications
    setProjectCommunications: (state, action) => {
      state.projectCommunications = action.payload;
    },
    addProjectCommunication: (state, action) => {
      state.projectCommunications.push(action.payload);
    },

    // Project Resources
    setProjectResources: (state, action) => {
      state.projectResources = action.payload;
    },
    addProjectResource: (state, action) => {
      state.projectResources.push(action.payload);
    },
    removeProjectResource: (state, action) => {
      state.projectResources = state.projectResources.filter(
        (resource) => resource.id !== action.payload
      );
    },

    // Project Reports
    setProjectProgressReport: (state, action) => {
      state.projectReports.progress = action.payload;
    },
    setProjectVolumeReport: (state, action) => {
      state.projectReports.volume = action.payload;
    },
    setProjectCostReport: (state, action) => {
      state.projectReports.cost = action.payload;
    },
    setProjectKPIReport: (state, action) => {
      state.projectReports.kpi = action.payload;
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
    resetProjectState: (state) => {
      return initialState;
    },
  },
});

export const {
  setProjectsList,
  setCurrentProject,
  addProject,
  updateProject,
  removeProject,
  setProjectDocuments,
  addProjectDocument,
  removeProjectDocument,
  setProjectCommunications,
  addProjectCommunication,
  setProjectResources,
  addProjectResource,
  removeProjectResource,
  setProjectProgressReport,
  setProjectVolumeReport,
  setProjectCostReport,
  setProjectKPIReport,
  setLoading,
  setError,
  setPagination,
  setFilters,
  setDepartmentFilter,
  resetFilters,
  resetProjectState,
} = projectSlice.actions;

export const projectReducer = projectSlice.reducer;
