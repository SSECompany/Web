import { DatePicker, Segmented, Statistic } from "antd";
import React from "react";
import HorizonColumnChart from "./Charts/HorizonColumnChart";
import PrimaryChart from "./Charts/PrimaryChart";
import ProgessChart from "./Charts/ProgessChart";
import VerticalColumnChart from "./Charts/VerticalColumnChart";
import "./KPIDashboard.css";

const KPIDashboard = () => {
  return (
    <div className="page_default KPI__dashboard">
      <div>
        <div className="KPI__header__container">
          <div>
            <h1 className="KPI__header">Thống kê KPI</h1>
            <span>
              KPI của nhân viên{" "}
              <span
                style={{ fontSize: "14px" }}
                className="default_bold_label sub_text_color"
              >
                Mạch Hưng
              </span>
            </span>
          </div>

          <div>
            <Segmented
              className="KPI__time__segmeted"
              options={["Tuần", "Tháng", "Quý", "Năm"]}
            />
          </div>

          <div className="KPI__header__search">
            <DatePicker placeholder="Chọn ngày" />
            <i className="pi pi-search"></i>
          </div>
        </div>
      </div>

      <div className="KPI__statistic__container">
        <div className="default_rectangle flex flex-column gap-1 KPI__statistic__rectangle">
          <Statistic
            className="KPI__statistic"
            title={<span>Viếng thăm</span>}
            value={112893}
          />
          <div className="flex justify-content-between">
            <span>Đóng cửa</span>
            <span>18</span>
          </div>
          <div className="flex justify-content-between">
            <span>Mở cửa</span>
            <span>29</span>
          </div>
        </div>
        <div className="default_rectangle flex flex-column gap-4 KPI__statistic__rectangle">
          <Statistic className="KPI__statistic" title="Mở mới" value={112893} />
        </div>
        <div className="default_rectangle flex flex-column gap-4 KPI__statistic__rectangle">
          <Statistic
            className="KPI__statistic"
            title="Doanh số"
            value={112893}
          />
        </div>
        <div className="default_rectangle flex flex-column gap-4 KPI__statistic__rectangle">
          <Statistic
            className="KPI__statistic"
            title="Báo cáo vị trí"
            value={112893}
          />
        </div>
      </div>

      <div className="KPI__charts_container gap-3 h-full">
        <div className="default_rectangle h-full flex flex-column gap-1 KPI__chart">
          <PrimaryChart />
        </div>
        <div className="default_rectangle h-full flex flex-column gap-4 KPI__chart overflow-auto">
          <ProgessChart />
        </div>
        <div className="default_rectangle h-full flex flex-column gap-1 KPI__chart">
          <span>chart 3</span>
          <HorizonColumnChart />
        </div>
        <div className="default_rectangle h-full flex flex-column gap-1 KPI__chart">
          <span>chart 4</span>
          <VerticalColumnChart />
        </div>
      </div>
    </div>
  );
};

export default KPIDashboard;
