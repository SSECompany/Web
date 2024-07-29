import { UserOutlined } from "@ant-design/icons";
import { Avatar, Pagination } from "antd";
import React, { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useDebouncedCallback } from "use-debounce";
import { filterKeyHelper } from "../../../../app/Functions/filterHelper";
import { formStatus } from "../../../../utils/constants";
import LoadingComponents from "../../../Loading/LoadingComponents";
import HeaderTableBar from "../../../ReuseComponents/HeaderTableBar";
import KPIPlansDetail from "../../Modals/KPIPlansDetail/KPIPlansDetail";
import {
  fetchKPIPlansData,
  setCurrentItem,
  setCurrentKPIPlanAction,
  setIsOpenModal,
} from "../../Store/Actions/KPIPlans";
import { getKPIPlansState } from "../../Store/Selectors/Selectors";
import "./KPIPlans.css";

const KPIPlans = () => {
  const KPIPlansState = useSelector(getKPIPlansState);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [params, setParams] = useState({
    keywords: "",
  });
  const [pagination, setPagination] = useState({
    pageIndex: 1,
    pageSize: 10,
  });
  const [totalResults, setTotalResults] = useState(0);

  const refreshData = useCallback(() => {
    setPagination({ ...pagination, pageIndex: 1, current: 1 });
    if (pagination.pageIndex === 1) {
      setLoading(true);
    }
  }, [pagination]);

  const handleOpenDetailModal = (item) => {
    setIsOpenModal(true);
    setCurrentItem(item || {});
    setCurrentKPIPlanAction(formStatus.EDIT);
  };

  const handleAddItem = useCallback((item) => {
    setIsOpenModal(true);
    setCurrentItem({});
    setCurrentKPIPlanAction(formStatus.ADD);
  }, []);

  const getData = async () => {
    setLoading(true);
    const result = await fetchKPIPlansData({
      ...params,
      pageIndex: pagination.pageIndex,
      pageSize: pagination.pageSize,
    });
    await setLoading(false);
    setData(result.data);
    setTotalResults(result.totalRecord);
  };

  const handleChangePagination = useCallback((pageSize) => {
    setPagination({ ...pagination, pageSize: pageSize });
  }, []);

  const handleChangePageIndex = (pageIndex) => {
    setPagination({ ...pagination, pageIndex: pageIndex });
  };

  const handleSearch = useCallback(
    useDebouncedCallback((value) => {
      setParams({ ...params, keywords: filterKeyHelper(value) });
      setPagination({ ...pagination, pageIndex: 1 });
    }, 600),
    []
  );

  // effectively #########################################################################
  useEffect(() => {
    setLoading(true);
    getData();
  }, [JSON.stringify(params), pagination]);

  return (
    <div className="page_default KPI__list">
      <HeaderTableBar
        refreshEvent={refreshData}
        name={"KPI"}
        title={"Kế hoạch KPI của nhân viên"}
        changePaginations={handleChangePagination}
        searchCallBack={handleSearch}
        totalResults={totalResults}
        addEvent={handleAddItem}
      />
      <div className="h-full KPI__Employees__container">
        <LoadingComponents
          loading={loading}
          text={"Đang tải"}
        ></LoadingComponents>

        {data.map((item, index) => (
          <div
            key={index}
            className="default_rectangle KPI__statistic__rectangle KPI__Employee"
            onClick={() => {
              handleOpenDetailModal(item);
            }}
          >
            <div className="KPI__Employee__avartar">
              <Avatar
                size={55}
                icon={<UserOutlined style={{ fontSize: "45px" }} />}
              />
            </div>
            <div>
              <div className="clear-both">
                <p className="text-float-left">Mã nhân viên: </p>
                <p className="text-float-right primary_bold_text">
                  {item?.ma_nvbh || "Không có dữ liệu"}
                </p>
              </div>
              <div className="clear-both">
                <p className="text-float-left">Họ tên: </p>
                <p className="text-float-right primary_bold_text">
                  {item?.ten_nvbh || "Không có dữ liệu"}
                </p>
              </div>

              <div className="clear-both">
                <p className="text-float-left">Số kế hoạch: </p>
                <p className="text-float-right primary_bold_text">
                  {item?.so_ke_hoach || "Không có dữ liệu"}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Pagination
        current={pagination.pageIndex}
        onChange={handleChangePageIndex}
        total={totalResults}
        pageSize={14}
        showSizeChanger={false}
        className="default_pagination_bar mt-2 relative"
      />

      <KPIPlansDetail refreshList={refreshData} />
    </div>
  );
};

export default KPIPlans;
