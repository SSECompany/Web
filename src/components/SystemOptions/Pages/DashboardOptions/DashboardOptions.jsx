import { notification, Popover, Select } from "antd";
import React, { useEffect, useState } from "react";
import {
  SIMPLECHARTS,
  SIMPLECHARTS_LIMIT,
  SIMPLECHARTS_MIN,
  STATISTICS_ICONS,
  STATISTICS_LIMIT,
  STATISTICS_MIN,
} from "../../../../utils/constants";
import emitter from "../../../../utils/emitter";
import jwt from "../../../../utils/jwt";
import HeaderTableBar from "../../../ReuseComponents/HeaderTableBar";
import "./DashboardOptions.css";
import TransferForm from "./Transfer/TransferForm";

const DashboardOptions = () => {
  const [statisticSelected, setstatisticSelected] = useState(
    jwt.getStatistictboardSetting()
  );
  const [simpleChartSelected, setSimpleChartSelected] = useState(
    jwt.getSimpleChartboardSetting()
  );

  const [reportSelected, setReportSelected] = useState(
    jwt.getDashboardReport() || "SOReport"
  );

  const content = (type) => {
    return (
      <div className="Dashboard__options__image__popover">
        <img
          src={
            type == "totaly"
              ? require("../../../../media/Images/totaly_infos.png")
              : type == "simpleChart"
              ? require("../../../../media/Images/simple_chart.png")
              : ""
          }
          alt="123"
        />
      </div>
    );
  };

  const handleSave = () => {
    // jwt.setStatisticboardSetting(statisticSelected);
    // jwt.setSimpleChartboardSetting(simpleChartSelected);
    // jwt.setDashboardReport(reportSelected);

    notification.success({
      message: `Thực hiện thành công`,
    });
  };

  useEffect(() => {
    emitter.on("SAVE_STATISTICS_LAYOUT", (data) => {
      console.log("SAVE_STATISTICS_LAYOUT", data);
      jwt.setStatisticboardSetting(data);
    });

    emitter.on("SAVE_SIMPLECHARTS_LAYOUT", (data) => {
      console.log("SAVE_SIMPLECHARTS_LAYOUT", data);
      jwt.setSimpleChartboardSetting(data);
    });
    return () => {
      emitter.removeAllListeners();
    };
  }, []);

  return (
    <div className="relative p-3" style={{ background: "white" }}>
      <Popover content={content("totaly")} trigger="hover">
        <div className="w-fit mb-2">
          <HeaderTableBar
            name={"Thông tin tổng hợp"}
            title={
              <span>
                Thông tin tổng hợp (
                <span className="primary_bold_text">
                  {statisticSelected.length}
                </span>
                /{STATISTICS_LIMIT})
              </span>
            }
          />
        </div>
      </Popover>

      <div className="w-full">
        <TransferForm
          dataset={Object.keys(STATISTICS_ICONS).map((item, index) => {
            return {
              key: item,
              title: STATISTICS_ICONS[item].title,
            };
          })}
          eventId={"SAVE_STATISTICS_LAYOUT"}
          limit={STATISTICS_LIMIT}
          min={STATISTICS_MIN}
          selectedKeys={jwt.getStatistictboardSetting()}
        />
      </div>

      <Popover content={content("simpleChart")} trigger="hover">
        <div className="w-fit mb-2">
          <HeaderTableBar
            name={"Số liệu chung"}
            title={
              <span>
                Số liệu chung (
                <span className="primary_bold_text">
                  {simpleChartSelected.length}
                </span>
                /4)
              </span>
            }
          />
        </div>
      </Popover>

      <div className="w-full">
        <TransferForm
          dataset={Object.keys(SIMPLECHARTS).map((item, index) => {
            return {
              key: item,
              title: SIMPLECHARTS[item].title,
            };
          })}
          eventId={"SAVE_SIMPLECHARTS_LAYOUT"}
          limit={SIMPLECHARTS_LIMIT}
          min={SIMPLECHARTS_MIN}
          selectedKeys={jwt.getSimpleChartboardSetting()}
        />
      </div>

      <div className="w-fit mb-2">
        <HeaderTableBar name={"Báo cáo"} title={<span>Báo cáo</span>} />
      </div>

      <div className="dashboard__simple__chart__items__container">
        <div
          className="p-2"
          style={{
            gridColumn: "1/4",
            borderRadius: "12px",
            background: "white",
          }}
        >
          <img
            style={{ borderRadius: "6px", background: "white" }}
            src={require("../../../../media/Images/dashboard_report.png")}
            alt=""
          />
        </div>
        <div>
          <p className="default_header_label">Loại báo cáo</p>

          <Select
            className="w-full mt-3"
            defaultValue={reportSelected}
            onSelect={(selected) => {
              setReportSelected(selected);
            }}
            options={[
              { value: "SOReport", label: "Báo cáo bán hàng" },
              { value: "POReport", label: "Báo cáo mua hàng" },
              { value: "NXTReport", label: "Tổng hợp nhập xuất tồn" },
            ]}
          />
        </div>
      </div>
    </div>
  );
};

export default DashboardOptions;
