import { notification } from "antd";
import axios from "axios";
import { refreshToken } from "../api";
import router from "../router/routes";
import { APP_CONFIG } from "./constants";
import jwt from "./jwt";

const controller = new AbortController();
const MAX_REQUESTS_COUNT = 3;
const INTERVAL_MS = 300;
let PENDING_REQUESTS = 0;
let refreshingFunc = undefined;

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

instance.interceptors.request.use((req) => {
  // Only set Authorization header if not present in any case (uppercase or lowercase)
  if (
    !req.headers ||
    (!req.headers["Authorization"] && !req.headers["authorization"])
  ) {
    req.headers.Authorization = `Bearer ${jwt.getAccessToken()}`;
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
      // Kiểm tra xem token có thực sự hết hạn không
      if (jwt.isTokenExpired()) {
        // Clear tất cả tokens và localStorage
        jwt.clearTokens();
        localStorage.clear();

        notification.error({
          message: "Phiên đăng nhập hết hạn",
          description: "Vui lòng đăng nhập lại để tiếp tục",
          placement: "topRight",
          duration: 3,
        });

        router.navigate("/login");
        return Promise.reject(error);
      }

      try {
        if (!refreshingFunc) refreshingFunc = refreshToken();

        const [newToken, newRefreshToken] = await refreshingFunc;

        await jwt.setRefreshToken(newRefreshToken);
        await jwt.setAccessToken(newToken, true); // Skip expiry update khi refresh token

        config.headers.Authorization = `Bearer ${newToken}`;
        // retry original request
        try {
          return await axios.request(config);
        } catch (innerError) {
          // if original req failed with 401 again - it means server returned not valid token for refresh request
          if (innerError?.response?.status === 401) {
            jwt.clearTokens();
            localStorage.clear();

            notification.error({
              message: "Phiên đăng nhập hết hạn",
              description: "Vui lòng đăng nhập lại để tiếp tục",
              placement: "topRight",
              duration: 3,
            });

            router.navigate("/login");
            return Promise.reject(innerError);
          } else {
            controller.abort();
          }
        }
      } catch (error) {
        jwt.clearTokens();
        localStorage.clear();

        notification.error({
          message: "Phiên đăng nhập hết hạn",
          description: "Vui lòng đăng nhập lại để tiếp tục",
          placement: "topRight",
          duration: 3,
        });

        router.navigate("/login");
        return Promise.reject(error);
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
