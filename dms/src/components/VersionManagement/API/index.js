import { multipleTablePutApi } from "../../../api";

// Version/Release Management APIs
export const VersionManagementApi = (data) => {
  return multipleTablePutApi({
    store: data.store,
    data: data.data,
  });
};

export const VersionManagementGetApi = (data) => {
  return multipleTablePutApi({
    store: data.store,
    data: data.data,
  });
};

// Version CRUD APIs
export const apiGetVersions = (data) => {
  return VersionManagementGetApi({
    store: "Api_Get_Versions",
    data: data,
  });
};

export const apiGetVersion = (data) => {
  return VersionManagementGetApi({
    store: "Api_Get_Version",
    data: data,
  });
};

export const apiCreateVersion = (data) => {
  return VersionManagementApi({
    store: "Api_Create_Version",
    data: data,
  });
};

export const apiUpdateVersion = (data) => {
  return VersionManagementApi({
    store: "Api_Update_Version",
    data: data,
  });
};

export const apiDeleteVersion = (data) => {
  return VersionManagementApi({
    store: "Api_Delete_Version",
    data: data,
  });
};

// Version Issues/Tasks APIs
export const apiGetVersionIssues = (data) => {
  return VersionManagementGetApi({
    store: "Api_Get_Version_Issues",
    data: data,
  });
};

export const apiAssignIssueToVersion = (data) => {
  return VersionManagementApi({
    store: "Api_Assign_Issue_To_Version",
    data: data,
  });
};

export const apiRemoveIssueFromVersion = (data) => {
  return VersionManagementApi({
    store: "Api_Remove_Issue_From_Version",
    data: data,
  });
};

// Version Statistics APIs
export const apiGetVersionStatistics = (data) => {
  return VersionManagementGetApi({
    store: "Api_Get_Version_Statistics",
    data: data,
  });
};


