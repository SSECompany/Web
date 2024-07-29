import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { RouterProvider } from "react-router-dom";
import "./index.css";
import reportWebVitals from "./reportWebVitals";
import router from "./router/routes";
import store from "./store";

//primereact
import { ConfigProvider } from "antd";
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
import Loading from "./components/Loading/Loading";
import themeComponents from "./utils/theme";

dayjs.extend(updateLocale);
dayjs.updateLocale("vi", {});

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
        <RouterProvider
          router={router}
          future={{ v7_startTransition: true }}
          fallbackElement={<App />}
        />
      </ConfigProvider>
    </Suspense>
  </Provider>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
