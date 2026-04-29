import { Transfer } from "antd";
import React, { useEffect, useState } from "react";
import LoadingComponents from "../../../Loading/LoadingComponents";
import {
  fetchReportList,
  getSeletedReport,
  modifiedSeletedReport,
} from "../../Store/Actions/ReportDashboardActions";

const ReportDashboardOptions = () => {
  const [targetKeys, setTargetKeys] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dataSource, setDataSource] = useState([]);

  const filterOption = (inputValue, option) =>
    option?.title?.indexOf(inputValue) > -1;

  const handleChange = (newTargetKeys) => {
    modifiedSeletedReport(newTargetKeys.join(","));
    setTargetKeys(newTargetKeys);
  };

  const handleFetchData = async () => {
    setIsLoading(true);
    getSeletedReport().then((res) => {
      setTargetKeys(
        res.map((item) => {
          return item?.RPTKey;
        })
      );
    });

    const result = await fetchReportList();
    const data = result.map((item) => {
      item.key = item?.RPTKey;
      return item;
    });
    setDataSource(data || []);
    setIsLoading(false);
  };

  useEffect(() => {
    handleFetchData();
    return () => {};
  }, []);

  return (
    <div className="h-full min-h-full relative">
      <LoadingComponents loading={isLoading} text={"Đang tải dữ liệu"} />
      <Transfer
        className="h-full"
        listStyle={{
          height: "100%",
          background: "rgba(255, 255, 255,1)",
        }}
        select
        titles={["Báo cáo", "Đã chọn"]}
        dataSource={dataSource}
        showSearch
        oneWay
        filterOption={filterOption}
        targetKeys={targetKeys}
        onChange={handleChange}
        render={(item) => item.title}
      />
    </div>
  );
};

export default ReportDashboardOptions;
