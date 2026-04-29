import { Button, Empty } from "antd";
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import LoadingComponents from "../../../../Loading/LoadingComponents";
import { getSeletedReport } from "../../../../SystemOptions/Store/Actions/ReportDashboardActions";
import MiniReport from "./MiniReport/MiniReport";
import "./ReportDashboard.css";

const ReportDashboard = () => {
  const [rptSelected, setRptSelected] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSelectedReports = async () => {
    const result = await getSeletedReport();
    setRptSelected(result);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchSelectedReports();
    return () => {};
  }, []);

  const emptyRender = () => {
    return (
      <div>
        <Empty
          className="flex flex-column align-items-center"
          image={require("../../../../../Icons/folder-empty@3x.png")}
          description={
            <span>
              Không có báo cáo nào được chọn{" "}
              <b>
                <Link to={"/System/RpDashboardOptions"}>
                  Nhấn vào đây để tuỳ chọn
                </Link>
              </b>
            </span>
          }
        />
      </div>
    );
  };

  return (
    <div className="relative h-full">
      <LoadingComponents text={"Đang tải dữ liệu"} loading={isLoading} />
      <div className="flex justify-content-between">
        <span className="primary_bold_text text-lg line-height-4">
          Tổng hợp báo cáo
        </span>

        <Button
          className="default_button"
          icon={
            <i
              className="pi pi-wrench sub_text_color"
              style={{ fontWeight: "bold" }}
            ></i>
          }
        >
          <Link to={"/System/RpDashboardOptions"} className="sub_text_color">
            Chỉnh sửa
          </Link>
        </Button>
      </div>

      <div className="ReportDashboard__container">
        {_.isEmpty(rptSelected)
          ? emptyRender()
          : rptSelected.map((item) => (
              <MiniReport
                key={item?.RPTKey}
                reportKey={item?.RPTKey}
                reportTitle={item?.title}
                rptStore={item?.storeProduce}
                rptType={item?.type}
              />
            ))}
      </div>
    </div>
  );
};

export default ReportDashboard;
