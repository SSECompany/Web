export const APP_CONFIG = {
  debug: true,
  apiUrl: process.env.REACT_APP_ROOT_API || "https://heijco-cloud.sse.net.vn/api",
};

export const formStatus = {
  ADD: "ADD",
  EDIT: "EDIT",
  VIEW: "VIEW",
  SAVED: "SAVED",
  DELETE: "DELETE",
};

export const FILE_EXTENSION = {
  EXCEL: "EXCEL",
  PDF: "PDF",
  CSV: "CSV",
  OTHER: "OTHER",
};
