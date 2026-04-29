import { Segmented } from "antd";
import ReactECharts from "echarts-for-react";
import _ from "lodash";
import React, { useEffect, useState } from "react";
import LoadingComponents from "../../../../../Loading/LoadingComponents";
import { fetchMiniReportData } from "../../../../Store/Actions/ReportDashboardActions";
import {
  getMiniBarReportOptions,
  getMinicircleOptions,
} from "./MiniReportOptions";

const MiniReport = ({
  reportKey,
  reportTitle,
  rptType,
  rptStore,
  ...props
}) => {
  const [values, setValues] = useState();
  const [labels, setLabels] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateType, setDateType] = useState("DAY");

  const statisticsDataProcess = (data = []) => {
    var statisticParams = {};

    data[0].map((item) => {
      if (item?.type?.includes("NOW")) {
        statisticParams.currentValue = item?.value || 0;
        statisticParams.growthRate = item?.Changes || 0;
      }

      if (item?.type?.includes("BEFORE")) {
        statisticParams.previousValue = item?.value || 0;
      }
    });

    statisticParams.note = _.first(data[1])?.note;

    return statisticParams;
  };

  const circleDataProcess = (data = []) => {
    return _.first(data) || [];
  };

  const barDataProcess = (data = []) => {
    const names = _.first(data).map((item) => item.name);
    const arrValue = _.first(data).map((item) => item.value);

    setValues(arrValue);
    setLabels(names);
  };

  const getReportData = async () => {
    setIsLoading(true);
    const result = await fetchMiniReportData(dateType, reportKey, rptStore);
    if (rptType === "Statistics") {
      setValues({ ...(await statisticsDataProcess(result)) });
    }

    if (rptType === "Circle") {
      setValues([...(await circleDataProcess(result))]);
    }

    if (rptType === "Bar") {
      await barDataProcess(result);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    getReportData();
    return () => {};
  }, [JSON.stringify(dateType)]);

  const statisticRender = ({
    currentValue = 0,
    previousValue = 0,
    growthRate = 0,
    description = "",
    note = "",
  }) => {
    return (
      <div>
        <div>
          <p className="opacity-50">Trị số giá trị hiện tại</p>
          <div className="flex justify-content-between align-items-center">
            <div>
              <b className="text-5xl">{currentValue}</b>
            </div>

            <div className="text-center">
              <i
                className={`pi pi-caret-up success_text_color${
                  growthRate > 0 ? "" : " opacity-0"
                }`}
                style={{ fontSize: "2rem" }}
              ></i>
              <p
                className={`font-bold${
                  growthRate > 0 ? " success_text_color" : " danger_text_color"
                }`}
              >
                {Math.abs(growthRate)}%
              </p>
              <i
                className={`pi pi-caret-down danger_text_color${
                  growthRate > 0 ? " opacity-0" : ""
                }`}
                style={{ fontSize: "2rem" }}
              ></i>
            </div>
          </div>
        </div>

        <div className="mt-1">
          <p>
            Diễn giải: tăng trưởng {growthRate}%, giá trị kỳ trước:{" "}
            {previousValue}
          </p>
          <p className="opacity-50 mt-1">Chú thích: {note}</p>
        </div>
      </div>
    );
  };

  const renderReport = () => {
    switch (rptType) {
      case "Statistics":
        return statisticRender(values || {});
        break;

      case "Circle":
        return (
          <ReactECharts
            style={{ width: "100%" }}
            option={getMinicircleOptions(values)}
          />
        );
        break;

      case "Bar":
        return (
          <ReactECharts
            style={{ width: "100%" }}
            option={getMiniBarReportOptions(
              _.isEmpty(labels) ? ["Không"] : labels,
              _.isEmpty(values) ? [0] : values
            )}
          />
        );
        break;

      default:
        return "Khai báo sai kiểu báo cáo";
        break;
    }
  };

  return (
    <div {...props} className="relative">
      <LoadingComponents loading={isLoading} text="Đang tải..." />
      <div className="flex justify-content-between align-items-center">
        <span className="default_header_label">{reportTitle}</span>
        <Segmented
          onChange={(value) => {
            setDateType(value);
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
      <div>{renderReport()}</div>
    </div>
  );
};

export default MiniReport;
