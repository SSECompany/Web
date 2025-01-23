import { graphic } from "echarts";
import _ from "lodash";
import { CHARTCOLORS } from "../../utils/constants";

function renderToolTips(data) {
  var htmlString = "";
  const defaultParams = ["value", "Title", "ChartType", "Month", "Year"];

  const diffArray = _.difference(Object.keys(data), defaultParams);
  const toolTipData = diffArray.filter(
    (item) => !item.includes("_title") && !item.includes("_unit")
  );
  toolTipData.map((item) => {
    htmlString += `\n ${
      data[item + "_title"]
    } : <span class="text-float-right ml-3 primary_bold_text">${data[item]} ${
      data[item + "_unit"]
    }</span><br>`;
  });

  return htmlString;
}

function getBarOption(data, catagory) {
  return {
    grid: {
      left: 5,
      right: 5,
      bottom: 0,
      top: 10,
      containLabel: true,
    },
    tooltip: {
      trigger: "item",
      axisPointer: {
        type: "shadow",
        label: {
          show: true,
        },
      },
      formatter: function (params) {
        return `${params.marker}  Tháng ${params.name} : ${params.value}`;
      },
    },
    xAxis: {
      type: "category",
      data: catagory,
    },
    yAxis: {
      type: "value",
    },
    series: [
      {
        data: data,
        type: "bar",
        itemStyle: {
          borderRadius: [999, 999, 0, 0],
        },
        colorBy: "data",
        color: CHARTCOLORS,
      },
    ],
  };
}

function getCircleOption(data) {
  return {
    series: [
      {
        radius: "100%",
        center: ["50%", "50%"],
        type: "gauge",
        startAngle: 90,
        endAngle: -270,
        pointer: {
          show: false,
        },
        progress: {
          show: true,
          overlap: false,
          roundCap: true,
          clip: false,
          itemStyle: {
            borderWidth: 0,
            borderColor: "#464646",
          },
        },
        axisLine: {
          lineStyle: {
            width: 16,
          },
        },
        splitLine: {
          show: false,
          distance: 0,
          length: 10,
        },
        axisTick: {
          show: false,
        },
        axisLabel: {
          show: false,
        },
        data: data,
        title: {
          fontSize: 20,
          offsetCenter: ["0%", "0%"],
        },
        detail: {
          show: false,
        },
      },
    ],
  };
}

function getLineOptions(data, catagory) {
  return {
    color: ["#F58220"],
    xAxis: {
      show: false,
      boundaryGap: false,
      type: "category",
      data: catagory,
    },

    tooltip: {
      trigger: "axis",

      // axisPointer: {
      //   type: "shadow",
      //   label: {
      //     show: true,
      //   },
      // },

      formatter: function (params) {
        var data = _.first(params);
        var htmlString = renderToolTips(data.data);
        return `${data.marker} ${data.data.Title}<br>
                ${htmlString}`;
      },

      textStyle: {
        fontFamily: "'Lexend Deca', sans-serif",
      },
      // axisPointer: {
      //   type: "cross",
      //   label: {
      //     backgroundColor: "#6a7985",
      //   },
      // },
    },
    yAxis: {
      show: false,
      type: "value",
    },
    grid: {
      left: 0,
      right: 0,
      bottom: 0.5,
      top: 1,
      containLabel: false,
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
        symbolSize: 0,
        lineStyle: {
          width: 1,
          color: "#F58220",
        },
        label: {
          show: false,
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
}

export { getBarOption, getCircleOption, getLineOptions };
