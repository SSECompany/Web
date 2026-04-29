import { notification } from "antd";
import axios from "axios";
import { refreshToken } from "../api";
import router from "../router/routes";
import jwt from "./jwt";

const controller = new AbortController();
const MAX_REQUESTS_COUNT = 3;
const INTERVAL_MS = 300;
let PENDING_REQUESTS = 0;
let refreshingFunc = undefined;

// Tạo instance riêng sử dụng REACT_APP_ROOT_API
const baseURL = process.env.REACT_APP_ROOT_API;

const instance = axios.create({
  timeout: 20000,
  baseURL: baseURL,
  headers: {
    accept: "application/json",
    // Bỏ withCredentials và credentials vì không cần cho GET request
    // withCredentials: false,
    // credentials: "include",
    // crossDomain: true,
    // Bỏ X-Requested-With vì có thể gây CORS preflight
    // common: {
    //   "X-Requested-With": "XMLHttpRequest",
    // },
    // Bỏ Content-Type cho GET request để tránh preflight
    // "Content-Type": "application/json",
  },
});

instance.interceptors.request.use((req) => {
  // Tạm thời comment để test CORS - nếu không cần auth thì có thể bỏ
  const token = jwt.getAccessToken();
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  
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

    if (error?.response?.status === 401) {
      try {
        if (!refreshingFunc) refreshingFunc = refreshToken();

        const [newToken, newRefreshToken] = await refreshingFunc;

        await jwt.setRefreshToken(newRefreshToken);
        await jwt.setAccessToken(newToken);

        config.headers.Authorization = `Bearer ${newToken}`;
        // retry original request - dùng instance thay vì axios global
        try {
          return await instance.request(config);
        } catch (innerError) {
          // if original req failed with 401 again - it means server returned not valid token for refresh request
          if (error.response.status === 401) {
            throw innerError;
            jwt.resetAccessToken();
            router.navigate("/login");
            Promise.reject(error);
          } else controller.abort();
        }
      } catch (error) {
        jwt.resetAccessToken();
        router.navigate("/login");
        Promise.reject(error);
      } finally {
        refreshingFunc = undefined;
      }
    }

    if (error?.response?.status === 403) {
      notification.warning({
        message: `Bạn không có quyền truy cập.`,
        description: "Vui lòng liên hệ người quản lý !",
      });
      controller.abort();
      router.navigate(-1);
    }
    return Promise.reject(error);
  }
);

export default instance;

