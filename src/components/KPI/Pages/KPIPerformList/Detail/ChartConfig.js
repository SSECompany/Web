import { graphic } from "echarts";

export const KPIPerformChartConfig = (data, catagory) => {
  return {
    color: ["#F58220"],
    xAxis: {
      show: true,
      type: "category",
      boundaryGap: false,
      data: catagory,
    },

    tooltip: {
      trigger: "axis",

      textStyle: {
        fontFamily: "'Lexend Deca', sans-serif",
      },
      axisPointer: {
        type: "cross",
        label: {
          backgroundColor: "#6a7985",
        },
      },
    },
    yAxis: {
      type: "value",
    },
    grid: {
      left: "1%",
      right: "5%",
      bottom: "0%",
      top: "7%",
      containLabel: true,
    },
    series: [
      {
        areaStyle: {
          opacity: 0.3,
          color: new graphic.LinearGradient(0, 0, 0, 1, [
            {
              offset: 0,
              color: "rgb(245, 130, 32)",
            },
            {
              offset: 1,
              color: "rgb(255, 255, 255)",
            },
          ]),
        },
        showSymbol: true,
        symbolSize: 2,
        lineStyle: {
          width: 1,
          color: "#F58220",
        },
        label: {
          show: true,
          position: "top",
        },
        data: data,
        type: "line",
        smooth: true,
        emphasis: {
          focus: "series",
        },
      },
    ],
  };
};
