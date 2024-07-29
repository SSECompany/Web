import ReactECharts from "echarts-for-react";
import _ from "lodash";
import React, { useEffect, useState } from "react";
import { formatCurrency } from "../../../../app/hooks/dataFormatHelper";
import {
  getCircleOption,
  getLineOptions,
} from "../../../../app/Options/SimpleChartOptions";
import { multipleTablePutApi } from "../../../../components/SaleOrder/API";
import { SIMPLECHARTS } from "../../../../utils/constants";

const SimpleChart = ({ chartId, type, numCharts }) => {
  const [masterInfo, setMasterInfo] = useState({});
  const [options, setOptions] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchData = async (chartId = "", numCharts = 4) => {
    await multipleTablePutApi({
      store: "Api_get_dashboard_chart_info",
      param: {
        ChartId: chartId || "",
        NumOfMonths: numCharts < 4 ? 12 : 4,
      },
      data: {},
    })
      .then((res) => {
        const master = _.first(_.first(res?.listObject));
        var data = [];
        var columns = [];

        if (master?.ChartType == "Bar") {
          data = res?.listObject[1] || [];
          columns = res?.listObject[1]?.map((item) => {
            return item.Month;
          });
          setOptions(getLineOptions(data, columns) || {});
        }

        if (master?.ChartType == "Circle") {
          data = [
            {
              value: master?.value || 0,
              name: `${master?.value}%` || "",
            },
          ];
          setOptions(getCircleOption(data) || {});
        }
        setMasterInfo(master);
        setLoading(false);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  useEffect(() => {
    fetchData(chartId, numCharts);
    return () => {
      setOptions({});
    };
  }, []);

  return (
    <div className="dashboard__simple__chart__tag__details">
      <div className="dashboard__simple__chart__tag__details__data">
        <div>
          <span className="dashboard__general__statistic__data primary_bold_text">
            {masterInfo?.value}{" "}
          </span>
          {SIMPLECHARTS[`${chartId}`]?.unit}

          <span
            className={`text-float-right ${
              masterInfo?.Changes >= 0
                ? "success_text_color"
                : "danger_text_color"
            }`}
          >
            <i
              className={`${
                masterInfo?.Changes >= 0
                  ? "pi pi-caret-up"
                  : "pi pi-caret-down danger_text_color"
              }`}
            />
            {formatCurrency(masterInfo?.Changes)} %
          </span>
        </div>

        <p>
          Tháng trước {formatCurrency(masterInfo?.PreviousValue) || 0}{" "}
          {SIMPLECHARTS[`${chartId}`]?.unit}
        </p>
      </div>

      <div
        className="dashboard__simple__chart__tag__details__chart h-full"
        style={{
          paddingBottom: "10px",
        }}
      >
        <ReactECharts
          showLoading={loading}
          style={{ width: "100%", height: "130px" }}
          option={options}
        />
      </div>
    </div>
  );
};

export default SimpleChart;
