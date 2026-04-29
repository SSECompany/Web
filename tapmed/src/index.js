import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { RouterProvider } from "react-router-dom";
import "./index.css";
import router from "./router/routes";
import store from "./store";

//primereact
import { App as AntdApp, ConfigProvider, message } from "antd";
import locale from "antd/locale/vi_VN";
import dayjs from "dayjs";
import "dayjs/locale/vi";
import updateLocale from "dayjs/plugin/updateLocale";
import "primeflex/primeflex.css";
import "primeicons/primeicons.css";
import "primereact/resources/primereact.min.css";
import "primereact/resources/themes/lara-light-indigo/theme.css";
import { Suspense } from "react";
import App from "./App";
import Loading from "./components/common/Loading/Loading";
import reportWebVitals from "./reportWebVitals";
import themeComponents from "./utils/theme";

import AntdStaticHelper from "./utils/antdStatic";

dayjs.extend(updateLocale);
dayjs.updateLocale("vi", {});

// Cấu hình message: chỉ hiển thị 3 message tại một thời điểm
message.config({
  maxCount: 3,
  duration: 3,
  top: 24,
});

// Bắt unhandled promise rejection (tránh "Uncaught (in promise) undefined" từ extension/chunk bên ngoài)
window.addEventListener("unhandledrejection", (event) => {
  if (event.reason === undefined && event.promise) {
    event.preventDefault();
    event.stopPropagation();
  }
});

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <Provider store={store}>
    <Suspense fallback={<Loading />}>
      <ConfigProvider
        locale={locale}
        theme={{
          ...themeComponents,
        }}
      >
        <AntdApp>
          <AntdStaticHelper />
          <RouterProvider
            router={router}
            future={{ v7_startTransition: true }}
            fallbackElement={<App />}
          />
        </AntdApp>
      </ConfigProvider>
    </Suspense>
  </Provider>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
