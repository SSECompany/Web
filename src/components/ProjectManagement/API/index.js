import { multipleTablePutApi } from "../../../api";

// Project Management APIs
export const ProjectManagementApi = (data) => {
  return multipleTablePutApi({
    store: data.store,
    data: data.data,
  });
};

export const ProjectManagementGetApi = (data) => {
  return multipleTablePutApi({
    store: data.store,
    data: data.data,
  });
};

// API endpoints for Project Management
export const apiGetProjects = (data) => {
  return ProjectManagementGetApi({
    store: "Api_Get_Projects",
    data: data,
  });
};

export const apiCreateProject = (data) => {
  return ProjectManagementApi({
    store: "Api_Create_Project",
    data: data,
  });
};

export const apiUpdateProject = (data) => {
  return ProjectManagementApi({
    store: "Api_Update_Project",
    data: data,
  });
};

export const apiDeleteProject = (data) => {
  return ProjectManagementApi({
    store: "Api_Delete_Project",
    data: data,
  });
};

// Project Documents APIs
export const apiGetProjectDocuments = (data) => {
  return ProjectManagementGetApi({
    store: "Api_Get_Project_Documents",
    data: data,
  });
};

export const apiCreateProjectDocument = (data) => {
  return ProjectManagementApi({
    store: "Api_Create_Project_Document",
    data: data,
  });
};

// Project Communications APIs
export const apiGetProjectCommunications = (data) => {
  return ProjectManagementGetApi({
    store: "Api_Get_Project_Communications",
    data: data,
  });
};

export const apiCreateProjectCommunication = (data) => {
  return ProjectManagementApi({
    store: "Api_Create_Project_Communication",
    data: data,
  });
};

// Project Resources APIs
export const apiGetProjectResources = (data) => {
  return ProjectManagementGetApi({
    store: "Api_Get_Project_Resources",
    data: data,
  });
};

export const apiAssignProjectResource = (data) => {
  return ProjectManagementApi({
    store: "Api_Assign_Project_Resource",
    data: data,
  });
};

// Project Reports APIs
export const apiGetProjectProgressReport = (data) => {
  return ProjectManagementGetApi({
    store: "Api_Get_Project_Progress_Report",
    data: data,
  });
};

export const apiGetProjectVolumeReport = (data) => {
  return ProjectManagementGetApi({
    store: "Api_Get_Project_Volume_Report",
    data: data,
  });
};

export const apiGetProjectCostReport = (data) => {
  return ProjectManagementGetApi({
    store: "Api_Get_Project_Cost_Report",
    data: data,
  });
};

export const apiGetProjectKPIReport = (data) => {
  return ProjectManagementGetApi({
    store: "Api_Get_Project_KPI_Report",
    data: data,
  });
};





