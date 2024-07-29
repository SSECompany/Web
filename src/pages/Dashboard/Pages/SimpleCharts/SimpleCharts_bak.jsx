import { Column } from "@ant-design/plots";
import { Progress } from "antd";
import React, { memo, useEffect, useState } from "react";

const SimpleCharts = ({ type = "column" || "circle", title, key }) => {
  const [data, setData] = useState([]);
  const [statisticData, setStatisticData] = useState(0);
  const [changesData, setChangesData] = useState(0);
  const color = ["#E2E4EE", "#D5D7E2", "#4779CF"];
  const config = {
    xField: "month",
    yField: "sales",
    columnStyle: {
      radius: [10, 10, 0, 0],
    },
    color: ({ month }) => {
      var curColor = "";
      data.map((item, index) => {
        if (item.month === month) {
          return (curColor = color[index]);
        }
      });
      return curColor;
    },

    tooltip: {
      showTitle: false,
      formatter: (data) => {
        return { name: `Tháng: ${data.month}`, value: `${data.sales} đơn` };
      },
      domStyles: {
        "g2-tooltip": {
          width: "max-content",
        },
      },
    },
  };

  useEffect(() => {
    if (type === "column") {
      setData([
        {
          month: "1",
          sales: 38,
          index: 1,
        },
        {
          month: "2",
          sales: 68,
          index: 2,
        },
        {
          month: "3",
          sales: 58,
          index: 3,
        },
      ]);

      setChangesData(((58 / 68) * 100 - 100).toFixed(2));
    } else {
      setData(68);
      setChangesData(3);
    }
    setStatisticData(123);
  }, []);

  return (
    <div className="dashboard__simple__chart__tag">
      <div className="dashboard__simple__chart__tag__title">{title}</div>
      <div className="dashboard__simple__chart__tag__details">
        <div className="dashboard__simple__chart__tag__details__chart">
          {type == "column" ? (
            <Column
              className="dashboard__simple__chart"
              data={data}
              {...config}
            />
          ) : (
            <Progress
              strokeLinecap="round"
              type="circle"
              size={120}
              strokeWidth={13}
              showInfo={false}
              percent={data}
            />
          )}
        </div>
        <div className="dashboard__simple__chart__tag__details__data">
          <p>
            <span className="dashboard__general__statistic__data primary_bold_text">
              {statisticData}{" "}
            </span>
            Đơn
          </p>
          <p
            className={`${
              changesData > 0 ? "success_text_color" : "danger_text_color"
            }`}
          >
            <i
              className={`${
                changesData > 0 ? "pi pi-caret-up" : "pi pi-caret-down"
              }`}
            />
            {changesData} %
          </p>
          <p>Tháng trước {" 69,96 tỷ"}</p>
        </div>
      </div>
    </div>
  );
};

export default memo(SimpleCharts);
