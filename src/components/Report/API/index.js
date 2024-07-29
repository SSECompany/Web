import https from "../../../utils/https";

export const ApiGetPrintReportFile = async (
  link,
  params,
  setting = {
    responseType: "blob",
  }
) => {
  return await https.post(`${link}`, params, setting).then((res) => {
    return res.data;
  });
};

export const ApiPrintReport = async (
  params,
  setting = {
    responseType: "blob",
  }
) => {
  return await https.post(`User/LoadReport`, params, setting).then((res) => {
    return res;
  });
};
