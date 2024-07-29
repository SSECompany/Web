import https from "../../../utils/https";

export const SoFuckingUltimateGetApi = async (payload) => {
  return await https.post(`user/get_ultimate`, payload).then((res) => {
    return res;
  });
};

export const apiGetUserClaims = async (payload) => {
  return await https.post(`Authentication/UserClaim`, payload).then((res) => {
    return res.data;
  });
};

export const apiGetAllClaims = async (payload) => {
  return await https.post(`Authentication/ListClaims`, payload).then((res) => {
    return res.data;
  });
};

export const apiGetUserGroup = async (payload) => {
  return await https
    .post(`Authentication/GetUserGroup`, payload)
    .then((res) => {
      return res.data;
    });
};

export const apiGetUnitByUser = async (payload) => {
  return await https.get(`Authentication/DVCS`, payload).then((res) => {
    return res.data;
  });
};

export const apiAlterUserClaims = async (payload) => {
  return await https
    .post(`Authentication/AlterUserClaims`, payload)
    .then((res) => {
      return res.data;
    });
};

export const apiGetGroupClaims = async (payload) => {
  return await https
    .post(`Authentication/GetGroupClaim`, payload)
    .then((res) => {
      return res.data;
    });
};

export const apiAlterGroupClaims = async (payload) => {
  return await https.post(`Authentication/AlterGroup`, payload).then((res) => {
    return res.data;
  });
};

export const apiCreategroup = async (payload) => {
  return await https.post(`Authentication/creategroup`, payload).then((res) => {
    return res.data;
  });
};

export const apiGetUnitClaims = async (payload) => {
  return await https.post(`Authentication/DVCSClaim`, payload).then((res) => {
    return res.data;
  });
};

export const apiAlterUnitClaims = async (payload) => {
  return await https.post(`Authentication/AlterDVCS`, payload).then((res) => {
    return res.data;
  });
};

export const apiAlterUserGroup = async (payload) => {
  return await https
    .post(`Authentication/AlterUserGroup`, payload)
    .then((res) => {
      return res.data;
    });
};
