import https from "../utils/https";
import jwt from "../utils/jwt";

export const refreshToken = async () => {
  return await https
    .post(`Authentication/Refresh`, {
      token: await jwt.getAccessToken(),
      refreshToken: await jwt.getRefreshToken(),
    })
    .then(async (res) => {
      const token = res?.data?.token;
      const refreshToken = res?.data?.refreshToken;

      return [token, refreshToken];
    });
};

export const apiCreateAccount = async ({ name, userName, password, email }) => {
  return await https
    .post(`User/CreateUser`, {
      roleId: 2,
      isDisable: false,
      name,
      userName,
      password,
      email,
    })
    .then(async (res) => {
      return res.data;
    })
    .catch((err) => {
      return null;
    });
};

export const apiGetStoreByUser = async (payload) => {
  return await https.get(`User/GetStore`, payload).then((res) => {
    return res.data;
  });
};

export const multipleTablePutApi = async (payload) => {
  const isCustomerView = window.location.pathname.includes("order");
  const token = localStorage.getItem("access_token");

  let apiUrl;


  if (isCustomerView && !token) {
    apiUrl = `User/AddDataCustomerPre`;
  } else if (!isCustomerView && token) {
    apiUrl = `User/AddData`;
  } else {
    console.warn("⚠️ Không xác định endpoint phù hợp, sử dụng mặc định AddDataCustomerPre");
    apiUrl = `User/AddDataCustomerPre`;
  }

  return await https.post(apiUrl, payload, {

    headers: {
      Authorization: token ? `Bearer ${token}` : "",
    },
  }).then((res) => {
    return res?.data || [];
  });
};

export const printOrderApi = async (sttRec, userId) => {
  const token = localStorage.getItem("access_token");
  return await https.post(
    `Print/print-order`,
    {
      stt_rec: sttRec,
      action: "0",
      userId: userId,
    },
    {
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
        "Content-Type": "application/json",
      },
    }
  ).then((res) => {
    return res?.data || [];
  });
};

export const syncFastApi = async (sttRec, userId) => {
  const token = localStorage.getItem("access_token");
  return await https.post(
    `SynchronousFAST/SynchronousSCSVVoucher`,
    {
      stt_rec: sttRec,
      action: "1",
      userId: userId.toString(),
    },
    {
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
        "Content-Type": "application/json",
      },
    }
  ).then((res) => {
    return res?.data || [];
  });
};