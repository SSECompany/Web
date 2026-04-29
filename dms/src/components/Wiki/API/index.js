import { multipleTablePutApi } from "../../../api";

// Wiki APIs
export const WikiApi = (data) => {
  return multipleTablePutApi({
    store: data.store,
    data: data.data,
  });
};

export const WikiGetApi = (data) => {
  return multipleTablePutApi({
    store: data.store,
    data: data.data,
  });
};

// Wiki Page APIs
export const apiGetWikiPages = (data) => {
  return WikiGetApi({
    store: "Api_Get_Wiki_Pages",
    data: data,
  });
};

export const apiGetWikiPage = (data) => {
  return WikiGetApi({
    store: "Api_Get_Wiki_Page",
    data: data,
  });
};

export const apiCreateWikiPage = (data) => {
  return WikiApi({
    store: "Api_Create_Wiki_Page",
    data: data,
  });
};

export const apiUpdateWikiPage = (data) => {
  return WikiApi({
    store: "Api_Update_Wiki_Page",
    data: data,
  });
};

export const apiDeleteWikiPage = (data) => {
  return WikiApi({
    store: "Api_Delete_Wiki_Page",
    data: data,
  });
};

// Wiki Page Versions APIs
export const apiGetWikiPageVersions = (data) => {
  return WikiGetApi({
    store: "Api_Get_Wiki_Page_Versions",
    data: data,
  });
};

export const apiGetWikiPageVersion = (data) => {
  return WikiGetApi({
    store: "Api_Get_Wiki_Page_Version",
    data: data,
  });
};

export const apiRestoreWikiPageVersion = (data) => {
  return WikiApi({
    store: "Api_Restore_Wiki_Page_Version",
    data: data,
  });
};

// Wiki Attachments APIs
export const apiUploadWikiAttachment = (data) => {
  return WikiApi({
    store: "Api_Upload_Wiki_Attachment",
    data: data,
  });
};

export const apiGetWikiAttachments = (data) => {
  return WikiGetApi({
    store: "Api_Get_Wiki_Attachments",
    data: data,
  });
};

export const apiDeleteWikiAttachment = (data) => {
  return WikiApi({
    store: "Api_Delete_Wiki_Attachment",
    data: data,
  });
};


