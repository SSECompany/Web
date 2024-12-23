import { Column } from "@ant-design/plots";
import React, { useEffect, useState } from "react";

const VerticalColumnChart = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    asyncFetch();
  }, []);

  const asyncFetch = () => {
    fetch(
      "https://gw.alipayobjects.com/os/antfincdn/PC3daFYjNw/column-data.json"
    )
      .then((response) => response.json())
      .then((json) =>
        setData([
          { city: "Thái Nguyên", type: "Hoa quả", value: 14500 },
          { city: "Thái Nguyên", type: "Gạo", value: 8500 },
          { city: "Thái Nguyên", type: "Đặc sản", value: 10000 },
          { city: "Thái Nguyên", type: "Trà", value: 7000 },
          { city: "Kontum", type: "Hoa quả", value: 9000 },
          { city: "Kontum", type: "Gạo", value: 8500 },
          { city: "Kontum", type: "Đặc sản", value: 11000 },
          { city: "Kontum", type: "Trà", value: 6000 },
          { city: "Gia Lai", type: "Hoa quả", value: 16000 },
          { city: "Gia Lai", type: "Gạo", value: 5000 },
          { city: "Gia Lai", type: "Đặc sản", value: 6000 },
          { city: "Gia Lai", type: "Trà", value: 10000 },
          { city: "Thái Bình", type: "Hoa quả", value: 14000 },
          { city: "Thái Bình", type: "Gạo", value: 9000 },
          { city: "Thái Bình", type: "Đặc sản", value: 10000 },
          { city: "Thái Bình", type: "Trà", value: 9000 },
          { city: "Hà Nội", type: "Hoa quả", value: 14000 },
          { city: "Hà Nội", type: "Gạo", value: 9000 },
          { city: "Hà Nội", type: "Đặc sản", value: 10000 },
          { city: "Hà Nội", type: "Trà", value: 6000 },
          { city: "Ninh Bình", type: "Hoa quả", value: 9000 },
          { city: "Ninh Bình", type: "Gạo", value: 8500 },
          { city: "Ninh Bình", type: "Đặc sản", value: 10000 },
          { city: "Ninh Bình", type: "Trà", value: 6000 },
          { city: "Quảng Ninh", type: "Hoa quả", value: 17000 },
          { city: "Quảng Ninh", type: "Gạo", value: 6000 },
          { city: "Quảng Ninh", type: "Đặc sản", value: 7000 },
          { city: "Quảng Ninh", type: "Trà", value: 10000 },
          { city: "Nghệ An", type: "Hoa quả", value: 18000 },
          { city: "Nghệ An", type: "Gạo", value: 11000 },
          { city: "Nghệ An", type: "Đặc sản", value: 15000 },
          { city: "Nghệ An", type: "Trà", value: 14000 },
        ])
      )
      .catch((error) => {
        console.log("fetch data failed", error);
      });
  };
  const config = {
    data,
    xField: "city",
    yField: "value",
    seriesField: "type",
    isGroup: true,
    dodgePadding: 1,

    columnStyle: {
      radius: [1, 1, 0, 0],
    },
    legend: false,
  };

  return <Column {...config} />;
};

export default VerticalColumnChart;
