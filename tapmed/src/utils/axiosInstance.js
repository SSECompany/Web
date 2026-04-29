import { notification } from "antd";
import axios from "axios";
import { store } from "../store";
import { refreshToken } from "../api";
import router from "../router/routes";
import {
  setClaims,
  setRefreshToken as setRefreshTokenRedux,
  setTokenExpiry as setTokenExpiryRedux,
} from "../store/reducers/claimsSlice";
import { APP_CONFIG } from "./constants";
import jwt from "./jwt";
import { clearStorageExceptVersion } from "./tokenUtils";

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
  // Only set Authorization header if not present, and token looks like a real JWT
  if (!req.headers) req.headers = {};
  const existingAuth =
    req.headers["Authorization"] || req.headers["authorization"];
  if (!existingAuth) {
    const token = jwt.getAccessToken();
    const isJWT =
      typeof token === "string" &&
      token.split(".").length === 3 &&
      token.startsWith("ey");
    if (isJWT) {
      req.headers.Authorization = `Bearer ${token}`;
    }
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
      // Request refresh trả 401 → logout ngay, không gọi refresh lại
      if (config?.url?.toLowerCase?.().includes("authentication/refresh")) {
        jwt.clearTokens();
        clearStorageExceptVersion();
        notification.error({
          message: "Phiên đăng nhập hết hạn",
          description: "Vui lòng đăng nhập lại để tiếp tục",
          placement: "topRight",
          duration: 3,
        });
        router.navigate("/login");
        return Promise.reject(error);
      }

      // Đã retry rồi mà vẫn 401 → logout
      if ((config?.__retryCount || 0) >= 1) {
        jwt.clearTokens();
        clearStorageExceptVersion();
        notification.error({
          message: "Phiên đăng nhập hết hạn",
          description: "Vui lòng đăng nhập lại để tiếp tục",
          placement: "topRight",
          duration: 3,
        });
        router.navigate("/login");
        return Promise.reject(error);
      }

      // Access token hết hạn (token_expiry qua) vẫn thử refresh trước; chỉ logout khi refresh thất bại (refresh_token hết hạn)
      try {
        if (!refreshingFunc) refreshingFunc = refreshToken();

        const [newToken, newRefreshToken] = await refreshingFunc;

        jwt.applyRefreshResponse(newToken, newRefreshToken);
        store.dispatch(setClaims(jwt.getClaims()));
        store.dispatch(setRefreshTokenRedux(newRefreshToken));
        store.dispatch(setTokenExpiryRedux(jwt.getTokenExpiry()));

        if (!config.headers) config.headers = {};
        config.headers.Authorization = `Bearer ${newToken}`;
        config.__retryCount = (config.__retryCount || 0) + 1;
        // retry original request bằng cùng instance (baseURL đúng)
        try {
          return await instance.request(config);
        } catch (innerError) {
          // if original req failed with 401 again - it means server returned not valid token for refresh request
          if (innerError?.response?.status === 401) {
            jwt.clearTokens();
            clearStorageExceptVersion();

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
            return Promise.reject(innerError);
          }
        }
      } catch (error) {
        jwt.clearTokens();
        clearStorageExceptVersion();

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
      // Đã bỏ notification 403, để component tự xử lý message
      // const errorMessage = error?.response?.data?.message || "Bạn không có quyền truy cập. Vui lòng liên hệ người quản lý !";
      // notification.warning({
      //   message: errorMessage,
      //   description: "",
      // });
      // Không tự động redirect - để component tự xử lý
    }
    return Promise.reject(error);
  }
);

export default instance;
