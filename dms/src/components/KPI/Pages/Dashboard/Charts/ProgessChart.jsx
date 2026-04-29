import { Popover } from "antd";
import { ProgressBar } from "primereact/progressbar";
import React, { useEffect, useRef, useState } from "react";
import "../KPIDashboard.css";

const fakeData = [
  {
    id_kpi: "KPI_0001",
    ten_kpi: "Doanh số",
    ma_nv: "HOND06",
    thang: 2,
    nam: 2023,
    ke_hoach: 20000000,
    thuc_hien: 6167464,
    ty_le: 30.83,
  },
  {
    id_kpi: "KPI_0002",
    ten_kpi: "Viếng thăm",
    ma_nv: "HOND06",
    thang: 2,
    nam: 2023,
    ke_hoach: 30000000,
    thuc_hien: 17090000,
    ty_le: 56.96,
  },
  {
    id_kpi: "KPI_0003",
    ten_kpi: "Mở mới",
    ma_nv: "HOND06",
    thang: 2,
    nam: 2023,
    ke_hoach: 20000000,
    thuc_hien: 21404762,
    ty_le: 107.02,
  },
  {
    id_kpi: "KPI_0004",
    ten_kpi: "Doanh thu",
    ma_nv: "HOND06",
    thang: 2,
    nam: 2023,
    ke_hoach: 30000000,
    thuc_hien: 29421000,
    ty_le: 98.07,
  },
  {
    id_kpi: "KPI_0004",
    ten_kpi: "Sản phẩm HOHO",
    ma_nv: "HOND06",
    thang: 2,
    nam: 2023,
    ke_hoach: 40000000,
    thuc_hien: 19421000,
    ty_le: 48.55,
  },
  {
    id_kpi: "KPI_0004",
    ten_kpi: "Mở mới tại khu vực HN",
    ma_nv: "HOND06",
    thang: 2,
    nam: 2023,
    ke_hoach: 40000000,
    thuc_hien: 29421000,
    ty_le: 73.55,
  },
];

const ProgessChart = () => {
  const [value, setValue] = useState(0);
  const interval = useRef(null);

  const valueTemplate = (value) => {
    return <React.Fragment>{value}%</React.Fragment>;
  };

  const popoverContent = (item) => {
    return (
      <div className="KPI__progess__bar__detail">
        <ProgressBar
          className="KPI__progess__bar"
          pt={{
            value: {
              style: {
                background: "linear-gradient(to right, #657194, #4779CF)",
              },
            },
          }}
          value={value}
          displayValueTemplate={() => (
            <React.Fragment>
              {item.thuc_hien}/{item.ke_hoach}
            </React.Fragment>
          )}
        ></ProgressBar>
        <div className="clear-both">
          <p className="text-float-left">Bạn đã hoàn thành</p>
          <p className="text-float-right primary_bold_text">{item.thuc_hien}</p>
        </div>
        <div className="clear-both">
          <p className="text-float-left">Tương ứng với</p>
          <p className="text-float-right primary_bold_text">{item.ty_le} %</p>
        </div>
        <div className="clear-both">
          <span className="dark_grey_text_color">
            Cuộc sống vốn là 1 cuộc thi chạy <br></br>
            Cụ thể đó là chạy{" "}
            <span className="danger_text_color">DEADLINE</span>. 😂😂😂
          </span>
        </div>
      </div>
    );
  };

  useEffect(() => {
    interval.current = setTimeout(() => {
      setValue(50);
    }, value);

    return () => {
      if (interval.current) {
        clearInterval(interval.current);
        interval.current = null;
      }
    };
  }, []);

  return (
    <>
      <span className="default_header_label">Tình trạng KPI</span>
      {fakeData.map((item, index) => {
        return (
          <Popover
            key={index}
            arrow={false}
            placement={"topLeft"}
            content={popoverContent(item)}
            title={`Chi tiết KPI: ${item.ten_kpi}`}
          >
            <div className="KPI__progess__bar__container">
              <span>{item.ten_kpi}</span>
              <ProgressBar
                className="KPI__progess__bar"
                pt={{
                  value: {
                    style: {
                      background: "linear-gradient(to right, #657194, #4779CF)",
                    },
                  },
                }}
                value={item.ty_le ? item.ty_le : 0}
                displayValueTemplate={valueTemplate}
              ></ProgressBar>
              <span className="dark_grey_text_color">
                {item.ty_le < 16
                  ? "Khởi động thôi 🏃"
                  : item.ty_le < 36
                  ? "Tiếp tục cố gắng nào 😉"
                  : item.ty_le < 50
                  ? "Sắp hoàn thành 1/3 rồi bạn ơi 🚀"
                  : item.ty_le < 75
                  ? "Chỉ còn một nửa con đường ✊"
                  : item.ty_le < 100
                  ? "Thành công sắp vẫy chào 👋"
                  : "Ánh sáng đã tới nơi đây 🌟🌟🌟"}
              </span>
            </div>
          </Popover>
        );
      })}
      {/* <Popover
        arrow={false}
        placement={"topLeft"}
        content={popoverContent("Mạch Hưng")}
        title="Chi tiết KPI"
      >
        <div className="KPI__progess__bar__container">
          <span>KPI viếng thăm</span>
          <ProgressBar
            className="KPI__progess__bar"
            pt={{
              value: {
                style: {
                  background: "linear-gradient(to right, #8e2de2, #4779CF)",
                },
              },
            }}
            value={value}
            displayValueTemplate={valueTemplate}
          ></ProgressBar>
          <span className="dark_grey_text_color">
            {value < 16
              ? "Khởi động thôi 🏃"
              : value < 36
              ? "Tiếp tục cố gắng nào 😉"
              : value < 50
              ? "Sắp hoàn thành 1/3 rồi bạn ơi 🚀"
              : value < 75
              ? "Chỉ còn một nửa con đường ✊"
              : value < 100
              ? "Thành công sắp vẫy chào 👋"
              : "Ánh sáng đã tới nơi đây 🌟🌟🌟"}
          </span>
        </div>
      </Popover> */}
    </>
  );
};

export default ProgessChart;
