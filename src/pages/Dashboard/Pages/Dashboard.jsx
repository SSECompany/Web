import { Segmented } from "antd";
import React, { useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import dashboard__hi from "../../../Icons/dashboard__hi.svg";
import { getUserInfo } from "../../../store/selectors/Selectors";
import "./Dashboard.css";
import SaleStatistics from "./SaleStatistics/SaleStatistics";
import SimpleCharts from "./SimpleCharts/SimpleCharts";

const Dashboard = () => {
  const userInfo = useSelector(getUserInfo);
  const navigate = useNavigate();
  const [saleStatisticType, setSaleStatisticType] = useState("day");

  const test = () => {
    navigate("/images/gallary", { state: { id: "MachHung" } });
  };

  return (
    <div className="dashboard page_default">
      <div className="dashboard__general__statistic__container">
        <div
          onClick={test}
          className="dashboard__general__statistic__items--hello dashboard__general__statistic__items"
        >
          <img style={{ flexShrink: "0" }} src={dashboard__hi} alt="icon hi" />
          <span>
            Chào mừng
            <span style={{ fontWeight: "Bold" }}>
              {userInfo.userName ? " " + userInfo.userName + " " : " Unknown "}
            </span>
            đã quay trở lại hệ thống!
          </span>
        </div>

        {React.createElement(require("./Statistics/Statistics").default)}
      </div>
      <div className="dashboard__simple__chart__container">
        <span className="default_header_label">Báo cáo nhanh</span>
        <SimpleCharts />
      </div>
      <div className="dashboard__simple__chart__container">
        <span className="default_header_label">Bán hàng</span>
        {React.createElement(require("./Report/DashboardReport").default)}
      </div>

      <div>
        <div className="default_header_label mb-3 mt-3">
          <span className="default_header_label">Tình trạng bán hàng</span>
          <Segmented
            className="ml-3"
            onChange={(value) => {
              setSaleStatisticType(value);
            }}
            options={[
              {
                value: "DAY",
                label: "Ngày",
              },
              {
                value: "WEEK",
                label: "Tuần",
              },
              {
                value: "MONTH",
                label: "Tháng",
              },
            ]}
          />
        </div>

        <div className="dashboard__simple__chart__items__container">
          <SaleStatistics type={saleStatisticType} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
