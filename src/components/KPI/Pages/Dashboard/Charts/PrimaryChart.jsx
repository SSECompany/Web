import { Line } from "@ant-design/plots";
import React, { useEffect, useState } from "react";

const PrimaryChart = () => {
  const [lineData, setLineData] = useState([]);
  const asyncFetch = () => {
    fetch(
      "https://gw.alipayobjects.com/os/bmw-prod/e00d52f4-2fa6-47ee-a0d7-105dd95bde20.json"
    )
      .then((response) => response.json())
      .then((json) =>
        setLineData([
          {
            name: "Việt Nam",
            year: "2000",
            gdp: 1211346869605.24,
          },
          {
            name: "Việt Nam",
            year: "2001",
            gdp: 1339395718865.3,
          },
          {
            name: "Việt Nam",
            year: "2002",
            gdp: 1470550015081.55,
          },
          {
            name: "Việt Nam",
            year: "2003",
            gdp: 1660287965662.68,
          },
          {
            name: "Việt Nam",
            year: "2004",
            gdp: 1955347004963.27,
          },
          {
            name: "Việt Nam",
            year: "2005",
            gdp: 2285965892360.54,
          },
          {
            name: "Việt Nam",
            year: "2006",
            gdp: 2752131773355.16,
          },

          {
            name: "United States",
            year: "2000",
            gdp: 10252345464000,
          },
          {
            name: "United States",
            year: "2001",
            gdp: 10581821399000,
          },
          {
            name: "United States",
            year: "2002",
            gdp: 10936419054000,
          },
          {
            name: "United States",
            year: "2003",
            gdp: 11458243878000,
          },
          {
            name: "United States",
            year: "2004",
            gdp: 12213729147000,
          },
          {
            name: "United States",
            year: "2005",
            gdp: 13036640229000,
          },
          {
            name: "United States",
            year: "2006",
            gdp: 13814611414000,
          },
          {
            name: "United States",
            year: "2007",
            gdp: 14451858650000,
          },

          {
            name: "United Kingdom",
            year: "2000",
            gdp: 1657816613708.58,
          },
          {
            name: "United Kingdom",
            year: "2001",
            gdp: 1640246149417.01,
          },
          {
            name: "United Kingdom",
            year: "2002",
            gdp: 1784473920863.31,
          },
          {
            name: "United Kingdom",
            year: "2003",
            gdp: 2053018775510.2,
          },
          {
            name: "United Kingdom",
            year: "2004",
            gdp: 2416931526913.22,
          },
          {
            name: "United Kingdom",
            year: "2005",
            gdp: 2538680000000,
          },
          {
            name: "United Kingdom",
            year: "2006",
            gdp: 2713749770009.2,
          },
          {
            name: "United Kingdom",
            year: "2007",
            gdp: 3100882352941.18,
          },

          {
            name: "Russian",
            year: "2000",
            gdp: 259710142196.94,
          },
          {
            name: "Russian",
            year: "2001",
            gdp: 306602070620.5,
          },
          {
            name: "Russian",
            year: "2002",
            gdp: 345470494417.86,
          },
          {
            name: "Russian",
            year: "2003",
            gdp: 430347770731.79,
          },
          {
            name: "Russian",
            year: "2004",
            gdp: 591016690742.8,
          },
          {
            name: "Russian",
            year: "2005",
            gdp: 764017107992.39,
          },
          {
            name: "Russian",
            year: "2006",
            gdp: 989930542278.7,
          },
          {
            name: "Russian",
            year: "2007",
            gdp: 1299705764823.62,
          },

          {
            name: "Japan",
            year: "2000",
            gdp: 4887519660744.86,
          },
          {
            name: "Japan",
            year: "2001",
            gdp: 4303544259842.72,
          },
          {
            name: "Japan",
            year: "2002",
            gdp: 4115116279069.77,
          },
          {
            name: "Japan",
            year: "2003",
            gdp: 4445658071221.86,
          },
          {
            name: "Japan",
            year: "2004",
            gdp: 4815148854362.11,
          },
          {
            name: "Japan",
            year: "2005",
            gdp: 4755410630912.14,
          },
          {
            name: "Japan",
            year: "2006",
            gdp: 4530377224970.4,
          },
          {
            name: "Japan",
            year: "2007",
            gdp: 4515264514430.57,
          },
        ])
      )
      .catch((error) => {
        console.log("fetch data failed", error);
      });
  };

  const config = {
    data: lineData,
    xField: "year",
    yField: "gdp",
    seriesField: "name",
    yAxis: {
      label: {
        formatter: (v) => `${(v / 10e8).toFixed(1)} B`,
      },
    },

    smooth: true,
    animation: {
      appear: {
        animation: "path-in",
        duration: 2000,
      },
    },
  };

  useEffect(() => {
    asyncFetch();
  }, []);

  return <Line {...config} />;
};

export default PrimaryChart;
