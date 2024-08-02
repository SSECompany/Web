import React, { useEffect, useState } from "react";
import ReactECharts from "echarts-for-react";
import { multipleTablePutApi } from "../../../../components/SaleOrder/API";
import { dayjs } from "dayjs";
import { List, InfiniteScroll } from "antd";
import { formatCurrency } from "../../../../app/hooks/dataFormatHelper";

import {
  CalendarOutlined,
  ArrowDownOutlined,
  ArrowUpOutlined,
} from "@ant-design/icons";

const DashboardReport = () => {
  const dayofmonth = Array.from({ length: 31 }, (v, i) => i + 1);

  const [fetchData, setFetchData] = useState({
    thisMonth: [],
    lastMohth: [],
  });
  const [revenueToday, setrevenueToday] = useState([]);
  const [revenueYesterday, setrevenueYesterday] = useState([]);
  const [revenueByUnit, setrevenueByUnit] = useState([]);
  const [revenueThisWeek, setrevenueThisWeek] = useState([]);
  const [revenueThisMonth, setrevenueThisMonth] = useState([]);

  const [options, setOptions] = useState({});
  const [loading, setLoading] = useState(true);

  const handelData = async () => {
    await multipleTablePutApi({
      store: "api_get_revenue",
      param: {},
      data: {},
    })
      .then((res) => {
        // setFetchData({
        //   thisMonth: res.listObject[0]
        //     .filter((id) => id.id === id.id)
        //     .map((day) => day.tien ?? 0),
        //   lastMohth: res.listObject[1]
        //     .filter((id) => id.id === id.id)
        //     .map((day) => day.tien ?? 0),
        // });
        setOptions({
          tooltip: {
            trigger: "axis",
          },
          xAxis: {
            type: "category",
            boundaryGap: false,
            data: dayofmonth,
          },
          yAxis: {
            type: "value",
            position: "right",
          },
          legend: {
            data: ["Tháng này", "Tháng trước"],
          },

          series: [
            {
              name: "Tháng này",
              areaStyle: {
                opacity: 0.3,
              },
              smooth: true,
              data: res.listObject[0]
                .filter((id) => id.id === id.id)
                .map((day) => day.tien ?? 0),
              type: "line",
            },
            {
              name: "Tháng trước",
              data: res.listObject[1]
                .filter((id) => id.id === id.id)
                .map((day) => day.tien ?? 0),
              type: "line",
              areaStyle: {
                opacity: 0.3,
              },
              smooth: true,
            },
          ],
        });
        setLoading(false);
        setrevenueToday(res.listObject[2]);
        setrevenueYesterday(res.listObject[3]);
        setrevenueByUnit(res.listObject[4]);
        setrevenueThisWeek(res.listObject[5]);
        setrevenueThisMonth(res.listObject[6]);
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {
        return {};
      });
  };
  useEffect(() => {
    handelData();
  }, []);
  console.log("aaaaaa");
  return (
    <div className="w-full flex gap-5" style={{ maxHeight: "36rem" }}>
      <div className="w-full min-w-0 min-h-0">
        <div class="flex flex-wrap justify-content-center gap-3">
          <div class="border-round surface-border border-3 w-12rem h-6rem bg-white m-2 font-bold flex align-items-center justify-content-center">
            <ul>
              <li class="flex align-items-center justify-content-center grap-1">
                <CalendarOutlined /> Hôm qua
              </li>
              <li class="flex align-items-center justify-content-center">
                {revenueYesterday.map((revenueYesterday) =>
                  formatCurrency(revenueYesterday.tien)
                )}
              </li>
              <li class="flex align-items-center justify-content-center">
                <ArrowDownOutlined /> 20%
              </li>
            </ul>
          </div>
          <div class="border-round surface-border border-3 w-12rem h-6rem bg-white m-2 font-bold flex align-items-center justify-content-center">
            <ul>
              <li class="flex align-items-center justify-content-center">
                <CalendarOutlined /> Hôm nay
              </li>
              <li class="flex align-items-center justify-content-center">
                {revenueToday.map((revenueToday) =>
                  formatCurrency(revenueToday.tien)
                )}
              </li>
              <li class="flex align-items-center justify-content-center">
                <ArrowDownOutlined /> 83%
              </li>
            </ul>{" "}
          </div>
          <div class="border-round surface-border border-3 w-12rem h-6rem bg-white m-2 font-bold flex align-items-center justify-content-center">
            <ul>
              <li class="flex align-items-center justify-content-center">
                <CalendarOutlined /> Tuần này
              </li>
              <li class="flex align-items-center justify-content-center">
                {revenueThisWeek.map((revenueThisWeek) =>
                  formatCurrency(revenueThisWeek.tien)
                )}
              </li>
              <li class="flex align-items-center justify-content-center">
                <ArrowDownOutlined /> 68%
              </li>
            </ul>{" "}
          </div>
          <div class="border-round surface-border border-3 w-12rem h-6rem bg-white m-2 font-bold flex align-items-center justify-content-center">
            <ul>
              <li class="flex align-items-center justify-content-center">
                <CalendarOutlined /> Tháng này
              </li>
              <li class="flex align-items-center justify-content-center">
                {revenueThisMonth.map((revenueThisMonth) =>
                  formatCurrency(revenueThisMonth.tien)
                )}
              </li>
              <li class="flex align-items-center justify-content-center">
                <ArrowUpOutlined /> 10%
              </li>
            </ul>
          </div>
        </div>
        <ReactECharts showLoading={loading} option={options} />
      </div>

      <div className="dashboard__simple__chart__tag ">
        <div className="dashboard__simple__chart__tag__title">
          <span>Top doanh thu theo cửa hàng</span>

          <span className="primary_color">Doanh thu</span>
        </div>

        <List
          className="p-2 h-max-content"
          itemLayout="horizontal"
          style={{
            height: "max-content",
            width: "40rem",
            overflow: "auto",
            padding: "0 16px",
          }}
          dataSource={revenueByUnit.slice().sort((a, b) => a.tien + b.tien)}
          renderItem={(item, index) => (
            <List.Item className="item_in_list">
              <div className="w-1rem">{index + 1}</div>
              <List.Item.Meta
                //avatar={<Avatar src={item.picture.large} />}
                //title={<a href="https://ant.design">{item.name.last}</a>}
                description={item.ten_dvcs}
              />
              <div>{item.tien}</div>
            </List.Item>
          )}
        />
      </div>
    </div>
  );
};

export default DashboardReport;
