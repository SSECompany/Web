import React, { useEffect, useState } from "react";
import { SIMPLECHARTS } from "../../../../utils/constants";
import jwt from "../../../../utils/jwt";
import SimpleChart from "../Charts/SimpleChart";

const color = ["#E2E4EE", "#D5D7E2", "#4779CF"];

const SimpleCharts = () => {
  const [charts, setCharts] = useState([]);

  useEffect(() => {
    setCharts(jwt.getSimpleChartboardSetting());
    return () => {
      setCharts([]);
    };
  }, []);

  return (
    <div className="dashboard__simple__chart__items__container">
      {charts.map((item, index) => (
        <div key={index} className="dashboard__simple__chart__tag">
          <div className="dashboard__simple__chart__tag__title">
            <span>{SIMPLECHARTS[`${item}`]?.title}</span>

            <span className="primary_color">
              {SIMPLECHARTS[`${item}`]?.unit}
            </span>
          </div>
          <SimpleChart
            numCharts={charts.length || 1}
            chartId={item}
            type={SIMPLECHARTS[`${item}`]?.type || "bar"}
          />
        </div>
      ))}
    </div>
  );
};

export default SimpleCharts;
