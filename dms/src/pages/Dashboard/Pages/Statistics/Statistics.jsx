import React, { useEffect, useState } from "react";
import { STATISTICS_ICONS } from "../../../../utils/constants";
import jwt from "../../../../utils/jwt";

const Statistics = ({ type = "SO" || "OL" || "PO" || "DT", value = 99999 }) => {
  const [charts, setCharts] = useState([]);

  useEffect(() => {
    setCharts(jwt.getStatistictboardSetting());
    return () => {
      setCharts([]);
    };
  }, []);

  return (
    <>
      {charts.map((chart, index) => (
        <div key={index} className="dashboard__general__statistic__items">
          <div className="dashboard__general__statistic__icon">
            <img src={STATISTICS_ICONS[chart].icon} alt="voucher" />
          </div>
          <div className="dashboard__general__statistic__details">
            <p className="dashboard__general__statistic__title">
              {STATISTICS_ICONS[chart].title}
            </p>
            <span className="dashboard__general__statistic__data">{value}</span>
          </div>
        </div>
      ))}
    </>
  );
};

export default Statistics;
