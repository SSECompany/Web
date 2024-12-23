import { Modal } from "antd";
import dayjs from "dayjs";
import ReactECharts from "echarts-for-react";
import React, { memo, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import {
  fetchKPIPerformDetailData,
  setIsOpenModal,
} from "../../../Store/Actions/KPIPerforms";
import { getKPIPerformState } from "../../../Store/Selectors/Selectors";
import "./../KPIPerformList.css";
import { KPIPerformChartConfig } from "./ChartConfig";

const KPIPerformDetail = () => {
  const [data, setData] = useState([]);
  const [detailData, setDetailData] = useState({});
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState({});
  const [pageLoaded, setPageLoaded] = useState(false);
  const { currentItem, isOpenModal } = useSelector(getKPIPerformState);

  const handleCloseModal = () => {
    setIsOpenModal(false);
  };

  const fetchData = async () => {
    const result = await fetchKPIPerformDetailData({
      id: currentItem.id,
    });

    const data = result.data.map((item) => item.thuc_hien);
    const columns = result.data.map((item) =>
      dayjs(item.ngay_ct).format("DD/MM/YYYY")
    );

    setDetailData(result.detailData);
    setOptions(KPIPerformChartConfig(data, columns) || {});
    setLoading(false);
  };

  useEffect(() => {
    if (isOpenModal) {
      setLoading(true);
      asyncFetch();
      fetchData();
      setPageLoaded(true);
    }
  }, [isOpenModal]);

  const asyncFetch = () => {
    fetch(
      "https://gw.alipayobjects.com/os/bmw-prod/1d565782-dde4-4bb6-8946-ea6a38ccf184.json"
    )
      .then((response) => response.json())
      .then((json) => setData(json))
      .catch((error) => {
        console.log("fetch data failed", error);
      });
  };
  const config = {
    data,
    padding: "auto",
    xField: "Date",
    yField: "scales",
    xAxis: {
      // type: 'timeCat',
      tickCount: 5,
    },
    smooth: true,
  };

  return (
    <Modal
      open={isOpenModal}
      onCancel={handleCloseModal}
      centered
      okButtonProps={{ style: { display: "none" } }}
      cancelButtonProps={{ style: { display: "none" } }}
      width={800}
      title="Chi tiết "
    >
      {pageLoaded && (
        <ReactECharts
          style={{ width: "100%" }}
          showLoading={loading}
          option={options}
        />
      )}

      <div className="KPI__modal__detail__container">
        <div>
          <span className="primary_bold_text">Thông tin KPI</span>
          <div className="clear-both">
            <p className="text-float-left">Nhân viên</p>
            <p className="text-float-right primary_bold_text">
              {detailData?.ma_nvbh || "Không có dữ liệu"} -{" "}
              {detailData?.ten_nvbh || "Không có dữ liệu"}
            </p>
          </div>
          <div className="clear-both">
            <p className="text-float-left">Ngày bắt đầu</p>
            <p className="text-float-right primary_bold_text">
              {dayjs(detailData?.ngay_bd).format("DD/MM/YYYY") ||
                "Không có dữ liệu"}{" "}
              -{" "}
              {dayjs(detailData?.ngay_kt).format("DD/MM/YYYY") ||
                "Không có dữ liệu"}
            </p>
          </div>
          <div className="clear-both">
            <p className="text-float-left">Nhóm KPI</p>
            <p className="text-float-right primary_bold_text">
              {detailData?.ten_kpi || "Không có dữ liệu"}
            </p>
          </div>
          <div className="clear-both">
            <p className="text-float-left">Đơn vị</p>
            <p className="text-float-right primary_bold_text">Công ty SSE</p>
          </div>
          <div className="clear-both">
            <p className="text-float-left">Diễn giải</p>
            <p className="text-float-right primary_bold_text">
              {detailData?.ghi_chu || "Không có dữ liệu"}
            </p>
          </div>
        </div>
        <div>
          <span className="primary_bold_text">Chi tiết hoạt động</span>
          <div className="clear-both">
            <p className="text-float-left">Tình trạng</p>

            {detailData?.total < detailData?.ke_hoach ? (
              <p className="text-float-right primary_bold_text warning_text_color">
                Chưa hoàn thành chỉ tiêu
              </p>
            ) : detailData?.total === detailData?.ke_hoach ? (
              <p className="text-float-right primary_bold_text success_text_color">
                Hoàn thành chỉ tiêu
              </p>
            ) : (
              <p className="text-float-right primary_bold_text success_text_color">
                Vượt chỉ tiêu 🙌🙌🙌
              </p>
            )}
          </div>
          <div className="clear-both">
            <p className="text-float-left">Kế hoạch</p>
            <p className="text-float-right primary_bold_text">
              {detailData?.ke_hoach || "Không có dữ liệu"}
            </p>
          </div>
          <div className="clear-both">
            <p className="text-float-left">Thực hiện</p>
            <p className="text-float-right primary_bold_text">
              {detailData?.total || "Không có dữ liệu"}
            </p>
          </div>
          <div className="clear-both">
            <p className="text-float-left">Thực hiện tốt nhất</p>
            <p className="text-float-right primary_bold_text">
              {dayjs(detailData?.max_day).format("DD/MM/YYYY")} -{" "}
              {detailData?.max_result || "Không có dữ liệu"}
            </p>
          </div>
          <div className="clear-both">
            <p className="text-float-left">Thực hiện thấp nhất</p>
            <p className="text-float-right primary_bold_text">
              {dayjs(detailData?.min_day).format("DD/MM/YYYY")} -{" "}
              {detailData?.min_result || "Không có dữ liệu"}
            </p>
          </div>
          <div className="clear-both">
            <p className="text-float-left">Vượt chỉ tiêu</p>
            <p className="text-float-right primary_bold_text">
              {detailData?.total < detailData?.ke_hoach
                ? "Chưa hoàn thành"
                : `${detailData?.total - detailData?.ke_hoach} - ${
                    ((detailData?.total - detailData?.ke_hoach) /
                      detailData?.ke_hoach) *
                    100
                  } %`}
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default memo(KPIPerformDetail);
