import { formatCurrency } from "../../../../../../app/hooks/dataFormatHelper";
import { CHARTCOLORS } from "../../../../../../utils/constants";

export const getMiniBarReportOptions = (title = [], value = []) => {
  return {
    grid: {
      left: 5,
      right: 5,
      bottom: 0,
      top: 20,
      containLabel: true,
    },
    textStyle: {
      fontFamily: "'Lexend Deca', sans-serif",
    },
    tooltip: {
      trigger: "item",
      axisPointer: {
        type: "shadow",
        label: {
          show: true,
        },
      },
    },
    xAxis: {
      type: "category",
      data: title,
    },
    yAxis: {
      type: "value",
      splitLine: {
        lineStyle: {
          type: "dashed",
        },
      },
    },
    series: [
      {
        data: value,
        type: "bar",
        itemStyle: {
          borderRadius: [4, 4, 0, 0],
        },
        colorBy: "data",
        color: CHARTCOLORS,
        // markLine: {
        //   silent: true,
        //   symbolSize: 6,
        //   label: {
        //     show: false,
        //   },
        //   lineStyle: {
        //     type: "dashed",
        //     color: "#1A4898",
        //     width: 1, // Độ dày của nét đứt
        //   },
        //   data: [
        //     [
        //       {
        //         type: "max",
        //       },
        //       {
        //         type: "min",
        //       },
        //     ],
        //   ],
        // },
        barWidth: "50",
      },
    ],
    label: {
      show: true, // Hiển thị nhãn
      position: "top", // Vị trí: trên thanh
      color: "#000",
      formatter: function (params) {
        return `${formatCurrency(params?.data)}`;
      },
    },
  };
};

export const lineOptions = {};

export const getMinicircleOptions = (data) => {
  console.log("data", data);
  return {
    tooltip: {
      trigger: "item",
      formatter: function (params) {
        return `${params.marker} ${params.name} 
               <span class="text-float-left ml-2 primary_bold_text">${formatCurrency(
                 params.value
               )} - </span>
               <span class="text-float-right primary_bold_text">${
                 params.percent
               }%</span>`;
      },
      textStyle: {
        fontFamily: "'Lexend Deca', sans-serif",
      },
    },

    legend: {
      bottom: "-2%",
      left: "center",
      textStyle: {
        fontFamily: "'Lexend Deca', sans-serif",
      },
    },

    series: [
      {
        type: "pie",
        radius: ["45%", "80%"],

        itemStyle: {
          borderRadius: 6,
          borderColor: "#fff",
          borderWidth: 2,
        },

        height: "275px",

        label: {
          show: false,
          position: "center",
        },

        colorBy: "data",
        color: CHARTCOLORS,

        emphasis: {
          label: {
            show: false,
            fontSize: 20,
            fontWeight: "bold",
          },
        },
        labelLine: {
          show: false,
        },
        data: data,
      },
    ],
  };
};
