import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Column } from '@ant-design/plots';

const Invoices = () => {

  const [data, setData] = useState([]);

  useEffect(() => {
    asyncFetch();
  }, []);

  const asyncFetch = () => {
    fetch('https://gw.alipayobjects.com/os/antfincdn/PC3daFYjNw/column-data.json')
      .then((response) => response.json())
      .then((json) => setData(json))
      .catch((error) => {
        console.log('fetch data failed', error);
      });
  };
  const config = {
    data,
    xField: 'city',
    yField: 'value',
    seriesField: 'type',
    isGroup: true,
    columnStyle: {
      radius: [20, 20, 0, 0],
    },
  };
  return (
    <div className="Invoices">
      <Column {...config} />
    </div>
  );
};

export default Invoices;
