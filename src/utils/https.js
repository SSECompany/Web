import { notification } from "antd";
import axios from "./axiosInstance";

class HttpService {
  querySearch(params) {
    return Object.keys(params)
      .map((k) => encodeURIComponent(k) + "=" + encodeURIComponent(params[k]))
      .join("&");
  }

  get(apiEndpoint, params = {}, settings = {}) {
    if (Object.keys(params).length > 0) {
      apiEndpoint = `${apiEndpoint}?${this.querySearch(params)}`;
    }
    return axios.get(apiEndpoint, settings).then(
      (res) => {
        return res;
      },
      (err) => {
        this.handleErorr(err?.response, err?.response?.status);
        return err.response;
      }
    );
  }

  post(apiEndpoint, payload, settings = {}) {
    return axios
      .post(apiEndpoint, payload, settings)
      .then((res) => {
        if (res?.data?.errors) {
          return this.handleErorr(res?.data?.errors);
        }
        return res;
      })
      .catch((err) => {
        this.handleErorr(err?.code, err?.response?.status);
        return err.response;
      });
  }

  put(apiEndpoint, payload) {
    return axios.put(apiEndpoint, payload).then(
      (res) => {
        if (res?.data?.errors) {
          return this.handleErorr(res?.data?.errors);
        }
        return res;
      },
      (err) => {
        this.handleErorr(err?.response, err?.response?.status);
        return err.response;
      }
    );
  }

  delete(apiEndpoint) {
    return axios.delete(apiEndpoint).then(
      (res) => {
        if (res.data) {
          return res;
        }
        return res;
      },
      (err) => {
        this.handleErorr(err?.response, err?.response?.status);
        return err.response;
      }
    );
  }

  handleErorr(error, statusCode = null) {
    if (error)
      return notification.error({
        message: `Không kết nối được đến server`,
      });

    switch (statusCode) {
      case 500:
        notification.error({
          message: `Không kết nối được đến server`,
          // description: `Quá thời gian thực hiện`,
        });
        break;

      case 404:
        notification.error({
          message: `Không tìm thấy API`,
          // description: `Quá thời gian thực hiện`,
        });
        break;

      case 401:
        break;

      default:
        notification.error({
          message: `Có lỗi phát sinh`,
          description: `Lỗi: ${
            error?.statusText ? error?.statusText : "Không xác định"
          }`,
        });
        break;
    }
  }
}

// eslint-disable-next-line import/no-anonymous-default-export
export default new HttpService();
