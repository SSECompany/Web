import { Statistic } from "antd";
import dayjs from "dayjs";
import { ProgressBar } from "primereact/progressbar";
import React, { useCallback, useEffect, useState } from "react";
import LoadingComponents from "../../../Loading/LoadingComponents";
import HeaderTableBar from "../../../ReuseComponents/HeaderTableBar";
import {
  fetchKPIPerformData,
  setCurrentItem,
  setIsOpenKPIPerformFilterModal,
  setIsOpenModal,
} from "../../Store/Actions/KPIPerforms";
import KPIPerformDetail from "./Detail/KPIPerformDetail";
import KPIPerformFilter from "./Filter/KPIPerformFilter";
import "./KPIPerformList.css";

const KPIPerformList = () => {
  const [data, setData] = useState([
    {
      id: null,
      ma_nvbh: "",
      thuc_hien: 0,
      ke_hoach: 0,
      trong_so: 0,
      ratio: 0,
      ngay_bd: null,
      ngay_kt: null,
      ma_kpi: "",
      ten_kpi: "",
      ten_nvbh: "",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [params, setParams] = useState({
    ma_nvbh: "",
    ma_kpi: "",
    ngay_bd: null,
    ngay_kt: null,
  });
  const [totalResults, setTotalResults] = useState(0);

  const refreshData = useCallback(() => {
    setParams({ ...params });
  }, [params]);

  const handleFilter = useCallback((params) => {
    const newParams = {
      ...params,
      ngay_bd: params.ngay_bd
        ? dayjs(params.ngay_bd).format("YYYY/MM/DD")
        : params.ngay_bd,
      ngay_kt: params.ngay_kt
        ? dayjs(params.ngay_kt).format("YYYY/MM/DD")
        : params.ngay_kt,
    };
    setParams({ ...params, ...newParams });
  }, []);

  const handleOpenFilterModal = useCallback(() => {
    setIsOpenKPIPerformFilterModal(true);
  }, []);

  const handleOpenDetailModal = (item) => {
    setIsOpenModal(true);
    setCurrentItem(item);
  };

  const getData = async () => {
    setLoading(true);
    const result = await fetchKPIPerformData({
      ...params,
    });
    await setLoading(false);
    console.log(result?.data);
    setData(result?.data || []);
    setTotalResults(result?.totalRecord || 0);
  };

  // effectively #########################################################################
  useEffect(() => {
    setLoading(true);
    getData();
  }, [params]);

  return (
    <div className="page_default KPI__list">
      <HeaderTableBar
        name={"KPI"}
        title={"Danh sách thực hiện KPI"}
        totalResults={totalResults}
        advanceFilter={handleOpenFilterModal}
        refreshEvent={refreshData}
      />
      <div className="h-full KPI__list__container">
        <LoadingComponents
          loading={loading}
          text={"Đang tải"}
        ></LoadingComponents>

        {data.map((item, index) => (
          <div
            key={index}
            className="default_rectangle flex flex-column justify-content-between KPI__statistic__rectangle"
            onClick={() => {
              handleOpenDetailModal(item);
            }}
          >
            <div>
              <Statistic
                className="KPI__statistic"
                title={item?.ten_kpi || "Không có dữ liệu"}
                valueStyle={{
                  color: "#4779CF",
                }}
                value={item?.thuc_hien || 0}
              />
              <div className="clear-both">
                <p className="text-float-left">Nhân viên: </p>
                <p className="text-float-right primary_bold_text">
                  {item?.ma_nvbh || ""} - {item?.ten_nvbh || ""}
                </p>
              </div>
              <div className="clear-both">
                <p className="text-float-left">Hiệu lực: </p>
                <p className="text-float-right primary_bold_text">
                  {dayjs(item?.ngay_bd).format("DD/MM/YYYY")} -{" "}
                  {dayjs(item?.ngay_kt).format("DD/MM/YYYY")}
                </p>
              </div>
              <div className="clear-both">
                <p className="text-float-left">Kế hoạch :</p>
                <p className="text-float-right primary_bold_text">
                  {item?.ke_hoach || 0}
                </p>
              </div>
            </div>
            <div>
              <span className="dark_grey_text_color">
                Tiến độ: <b>{item?.ratio || 0}/100</b>
              </span>
              <ProgressBar
                pt={{
                  value: {
                    style: {
                      background: "linear-gradient(to right, #657194, #4779CF)",
                    },
                  },
                }}
                value={item?.ratio || 0}
                style={{ height: "6px" }}
                showValue={false}
              ></ProgressBar>
            </div>
          </div>
        ))}
      </div>

      <KPIPerformDetail key={"KPIDetail"} />
      <KPIPerformFilter onFilter={handleFilter} />
    </div>
  );
};

export default KPIPerformList;
