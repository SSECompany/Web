import https from "../../../utils/https";

export const SoFuckingUltimateApi = async (payload) => {
  return await https.post(`user/UltimateRequest`, payload).then((res) => {
    return res;
  });
};

// export const multipleTablePutApi = async (payload) => {
//   return await https
//     .post(`User/AddData`, { data: encrypted(payload) })
//     .then((res) => {
//       return res?.data || [];
//     });
// };

export const multipleTablePutApi = async (payload) => {
  return await https.post(`User/AddData`, payload).then((res) => {
    return res?.data || [];
  });
};
