import { notification } from "antd";
import axios from "axios";
import { refreshToken as refreshTokenReq } from "../api/index";
import router from "../router/routes";
import { APP_CONFIG } from "./constants";
import jwt from "./jwt";

const controller = new AbortController();
const MAX_REQUESTS_COUNT = 3;
const INTERVAL_MS = 300;
let PENDING_REQUESTS = 0;
let IS_REFRESHING = false;
const REQUESTS_QUEUE = [];

const instance = axios.create({
  timeout: 20000,
  baseURL: APP_CONFIG.apiUrl,
  headers: {
    // Authorization: `Bearer ${jwt.getAccessToken()}`,
    accept: "application/json",
    withCredentials: false,
    credentials: "include",
    crossDomain: true,
    common: {
      "X-Requested-With": "XMLHttpRequest",
    },
    "Content-Type": "application/json",
  },
});

const processQueue = (token = null) => {
  REQUESTS_QUEUE.forEach((prom) => {
    if (token) {
      prom.resolve(token);
    } else {
      prom.reject(null);
    }
  });

  REQUESTS_QUEUE.length = 0;
};

instance.interceptors.request.use((req) => {
  req.headers.Authorization = `Bearer ${jwt.getAccessToken()}`;
  return new Promise((resolve, reject) => {
    let interval = setInterval(() => {
      if (PENDING_REQUESTS < MAX_REQUESTS_COUNT) {
        PENDING_REQUESTS++;
        clearInterval(interval);
        resolve(req);
      }
    }, INTERVAL_MS);
  });
});

instance.interceptors.response.use(
  async (res) => {
    PENDING_REQUESTS = Math.max(0, PENDING_REQUESTS - 1);
    return Promise.resolve(res);
  },
  async (error) => {
    const config = error?.config;
    PENDING_REQUESTS = Math.max(0, PENDING_REQUESTS - 1);

    // if (
    //   config.url.includes("login") ||
    //   config.url.includes("Authentication/Refresh")
    // ) {
    //   controller.abort();
    //   await jwt.resetAccessToken();
    //   router.navigate("/login");
    // }

    if (error.response.status === 401 && !config._retry) {
      if (IS_REFRESHING) {
        return new Promise(function (resolve, reject) {
          REQUESTS_QUEUE.push({ resolve, reject });
        })
          .then((token) => {
            config.headers["Authorization"] = "Bearer " + token;
            return instance(config);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      config._retry = true;
      IS_REFRESHING = true;

      return new Promise(function (resolve, reject) {
        refreshTokenReq()
          .then((res) => {
            jwt.setRefreshToken(res.refreshToken);
            jwt.setAccessToken(res.token);

            processQueue(res.token);
            resolve(instance(config));
          })
          .catch((err) => {
            IS_REFRESHING = false;
            REQUESTS_QUEUE.length = 0;
            controller.abort();
            jwt.resetAccessToken();
            router.navigate("/login");
            reject(err);
          })
          .finally(() => {
            IS_REFRESHING = false;
            REQUESTS_QUEUE.length = 0;
          });
      });
    }

    if (error.response.status === 403) {
      notification.warning({
        message: `Bạn không có quyền truy cập.`,
        description: "Vui lòng liên hệ người quản lý !",
      });
      controller.abort();
      router.navigate(-1);
    }

    return Promise.reject(error);

    ////////////////////////////////////////////
    // return;

    // if (
    //   config.url.includes("login") ||
    //   config.url.includes("Authentication/Refresh")
    // ) {
    //   controller.abort();
    //   jwt.resetAccessToken();
    //   router.navigate("/login");
    // }

    // if (
    //   error.response.status === 401 &&
    //   !config.url.includes("Authentication/Refresh")
    // ) {
    //   try {
    //     var access_token;
    //     await refreshToken().then((res) => {
    //       jwt.setRefreshToken(res.refreshToken);
    //       jwt.setAccessToken(res.token);
    //       return (access_token = res.token);
    //     });

    //     if (access_token && access_token.length > 0) {
    //       instance.defaults.headers.Authorization = `Bearer ${access_token}`;
    //       return instance(config);
    //     }
    //   } catch (error) {
    //     controller.abort();
    //     jwt.resetAccessToken();
    //     router.navigate("/login");
    //   }
    // }

    // if (error.response.status === 403) {
    //   notification.warning({
    //     message: `Bạn không có quyền truy cập.`,
    //     description: "Vui lòng liên hệ người quản lý !",
    //   });
    //   controller.abort();
    //   router.navigate(-1);
    // }
    // return Promise.reject(error);
  }
);

export default instance;
