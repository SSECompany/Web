import { Avatar, List, Skeleton } from "antd";
import ReactECharts from "echarts-for-react";
import _ from "lodash";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { formatCurrency } from "../../../../app/hooks/dataFormatHelper";
import { multipleTablePutApi } from "../../../../components/SaleOrder/API";
import { getUserInfo } from "../../../../store/selectors/Selectors";

const data = [
  {
    title: "Ant Design Title 1",
  },
  {
    title: "Ant Design Title 2",
  },
  {
    title: "Ant Design Title 3",
  },
  {
    title: "Ant Design Title 4",
  },
  {
    title: "Ant Design Title 4",
  },
];

const getChartOptions = (data) => {
  return {
    tooltip: {
      trigger: "item",
      formatter: function (params) {
        return `${params.marker} ${params.name}<br>
             <span class="text-float-left primary_bold_text">${params.value} : </span>
             <span class="text-float-right ml-3 primary_bold_text">${params.percent}%</span>`;
      },
      textStyle: {
        fontFamily: "'Lexend Deca', sans-serif",
      },
    },

    legend: {
      bottom: "5%",
      left: "center",
      textStyle: {
        fontFamily: "'Lexend Deca', sans-serif",
      },
    },

    series: [
      {
        type: "pie",
        radius: ["40%", "90%"],

        itemStyle: {
          borderRadius: 6,
          borderColor: "#fff",
          borderWidth: 2,
        },
        height: "270px",

        label: {
          show: false,
          position: "center",
        },
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

const SaleStatistics = ({ type }) => {
  const { id, unitId } = useSelector(getUserInfo);
  const [loading, setLoading] = useState(false);
  const [fetchData, setFetchData] = useState({
    DSNV: [],
    DSSP: [],
    MMKH: [],
    KHM: [],
  });

  const getData = async (type) => {
    setLoading(true);
    await multipleTablePutApi({
      store: "api_get_sale_statistics",
      param: {
        dateType: type || "DAY",
        userId: id,
        unitId: unitId,
      },
      data: {},
    }).then((res) => {
      if (res?.responseModel?.isSucceded) {
        // Bảng 1 doanh số theo nhân viên
        // Bảng 2 doanh số theo sản phẩm
        // Bảng 3 top nhân viên mở mới
        // Bảng 4 khách hàng mới gần đây

        // console.log(res.listObject[0]);
        // console.log(res.listObject[1]);
        // console.log(res.listObject[2]);
        // console.log(res.listObject[3]);

        setFetchData({
          DSNV: _.isEmpty(res.listObject[0])
            ? [{ value: 0, name: "Không có dữ liệu" }]
            : res.listObject[0],
          DSSP: res.listObject[1] || [],
          MMKH: res.listObject[2] || [],
          KHM: res.listObject[3] || [],
        });

        setLoading(false);
      }
    });
  };

  useEffect(() => {
    getData(type);
    return () => {};
  }, [type]);

  return (
    <>
      <div className="dashboard__simple__chart__tag">
        <div className="dashboard__simple__chart__tag__title">
          <span>Top doanh thu theo nhân viên</span>

          <span className="primary_color">Đồng</span>
        </div>
        <ReactECharts
          showLoading={loading}
          style={{ height: "370px" }}
          option={getChartOptions(fetchData.DSNV)}
        />
      </div>
      <div className="dashboard__simple__chart__tag">
        <div className="dashboard__simple__chart__tag__title">
          <span>Top doanh thu theo sản phẩm</span>

          <span className="primary_color">Đồng</span>
        </div>

        <List
          className="p-2 h-full"
          itemLayout="horizontal"
          dataSource={fetchData.DSSP}
          renderItem={(item, index) => (
            <List.Item className="item_in_list">
              <Skeleton avatar title={false} loading={loading} active>
                <List.Item.Meta
                  className="align-items-center"
                  avatar={
                    <Avatar
                      src={`https://api.dicebear.com/7.x/miniavs/svg?seed=${Math.floor(
                        Math.random() * 12
                      )}`}
                    />
                  }
                  title={<span>{item.title}</span>}
                  description={
                    <span className="primary_bold_text">
                      {formatCurrency(item.value)}
                    </span>
                  }
                />
              </Skeleton>
            </List.Item>
          )}
        />
      </div>
      <div className="dashboard__simple__chart__tag">
        <div className="dashboard__simple__chart__tag__title">
          <span>Top nhân viên mở mới</span>
        </div>
        <List
          className="p-2 h-full"
          itemLayout="horizontal"
          dataSource={fetchData.MMKH}
          renderItem={(item, index) => (
            <List.Item
              className="item_in_list"
              onClick={() => {
                console.log(item);
              }}
            >
              <Skeleton avatar title={false} loading={loading} active>
                <List.Item.Meta
                  className="align-items-center"
                  avatar={
                    <Avatar
                      src={`https://api.dicebear.com/7.x/miniavs/svg?seed=${Math.floor(
                        Math.random() * 12
                      )}`}
                    />
                  }
                  title={<span>{item.title}</span>}
                  description={
                    <span className="primary_bold_text">
                      {formatCurrency(item.value)}
                    </span>
                  }
                />
              </Skeleton>
            </List.Item>
          )}
        />
      </div>
      <div className="dashboard__simple__chart__tag">
        <div className="dashboard__simple__chart__tag__title">
          <span> Địa điểm mở mới gần đây</span>
        </div>
        <List
          className="p-2 h-full"
          itemLayout="horizontal"
          dataSource={fetchData.KHM}
          renderItem={(item, index) => (
            <List.Item
              className="item_in_list"
              onClick={() => {
                console.log(item);
              }}
            >
              <Skeleton avatar title={false} loading={loading} active>
                <List.Item.Meta
                  className="align-items-center"
                  avatar={
                    <Avatar
                      src={`https://api.dicebear.com/7.x/miniavs/svg?seed=${Math.floor(
                        Math.random() * 12
                      )}`}
                    />
                  }
                  title={<span>{item.title}</span>}
                  description={
                    <span className="primary_bold_text">{item.value}</span>
                  }
                />
              </Skeleton>
            </List.Item>
          )}
        />
      </div>
    </>
  );
};

export default SaleStatistics;
