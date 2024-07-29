import { Bar } from "@ant-design/plots";
import React from "react";

const HorizonColumnChart = () => {
  const data = [
    {
      label: "Mon.",
      type: "series1",
      value: 2800,
    },
    {
      label: "Mon.",
      type: "series2",
      value: 2260,
    },
    {
      label: "Tues.",
      type: "series1",
      value: 1800,
    },
    {
      label: "Tues.",
      type: "series2",
      value: 1300,
    },
    {
      label: "Wed.",
      type: "series1",
      value: 950,
    },
    {
      label: "Wed.",
      type: "series2",
      value: 900,
    },
    {
      label: "Thur.",
      type: "series1",
      value: 500,
    },
    {
      label: "Thur.",
      type: "series2",
      value: 390,
    },
    {
      label: "Fri.",
      type: "series1",
      value: 170,
    },
    {
      label: "Fri.",
      type: "series2",
      value: 100,
    },
  ];
  const config = {
    data,
    isGroup: true,
    xField: "value",
    yField: "label",
    /** nếu cần đổi màu*/
    // color: ['#1383ab', '#c52125'],
    seriesField: "type",
    marginRatio: 0,
    legend: false,
    dodgePadding: 0,
    intervalPadding: 20,
    columnStyle: {
      radius: [20, 20, 20, 20],
    },
  };
  return <Bar {...config} />;
};

export default HorizonColumnChart;
