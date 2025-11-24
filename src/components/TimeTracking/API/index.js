import { multipleTablePutApi } from "../../../api";

// Time Tracking APIs
export const TimeTrackingApi = (data) => {
  return multipleTablePutApi({
    store: data.store,
    data: data.data,
  });
};

export const TimeTrackingGetApi = (data) => {
  return multipleTablePutApi({
    store: data.store,
    data: data.data,
  });
};

// Time Entry APIs
export const apiCreateTimeEntry = (data) => {
  return TimeTrackingApi({
    store: "Api_Create_Time_Entry",
    data: data,
  });
};

export const apiUpdateTimeEntry = (data) => {
  return TimeTrackingApi({
    store: "Api_Update_Time_Entry",
    data: data,
  });
};

export const apiDeleteTimeEntry = (data) => {
  return TimeTrackingApi({
    store: "Api_Delete_Time_Entry",
    data: data,
  });
};

export const apiGetTimeEntries = (data) => {
  return TimeTrackingGetApi({
    store: "Api_Get_Time_Entries",
    data: data,
  });
};

export const apiGetTimeEntryDetail = (data) => {
  return TimeTrackingGetApi({
    store: "Api_Get_Time_Entry_Detail",
    data: data,
  });
};

// Time Entry Reports APIs
export const apiGetTimeEntryReport = (data) => {
  return TimeTrackingGetApi({
    store: "Api_Get_Time_Entry_Report",
    data: data,
  });
};

export const apiGetTimeEntryByProject = (data) => {
  return TimeTrackingGetApi({
    store: "Api_Get_Time_Entry_By_Project",
    data: data,
  });
};

export const apiGetTimeEntryByUser = (data) => {
  return TimeTrackingGetApi({
    store: "Api_Get_Time_Entry_By_User",
    data: data,
  });
};

// Activity Types APIs
export const apiGetActivityTypes = (data) => {
  return TimeTrackingGetApi({
    store: "Api_Get_Activity_Types",
    data: data,
  });
};


