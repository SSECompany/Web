import { Avatar, Input, Popover } from "antd";
import _ from "lodash";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useDebouncedCallback } from "use-debounce";
import { filterKeyHelper } from "../../../../../app/Functions/filterHelper";
import no_file from "../../../../../Icons/no_file.svg";
import LoadingComponents from "../../../../Loading/LoadingComponents";
import {
  fetchTourList,
  resetBusinessMapState,
  setisSideBarColappsed,
  setTourSelected,
} from "../../../Store/Sagas/BusinessMapActions";
import { getBusinessMapState } from "../../../Store/Selector/Selectors";

const TourSelector = () => {
  const { isSideBarColappsed, tourList, tourSelected, isSideBarLoading } =
    useSelector(getBusinessMapState);
  const [isShowItem, setIsShowItem] = useState(true);

  const handleChangeSidebarState = () => {
    setisSideBarColappsed(!isSideBarColappsed);
  };

  const handleSelectTour = (tour) => {
    setTourSelected(tour);
  };

  const handleSearchCustomer = useDebouncedCallback(async (searchValue) => {
    const newKeywords = await filterKeyHelper(searchValue.target.value);
    fetchTourList(newKeywords);
  }, 800);

  useEffect(() => {
    fetchTourList("");
    return () => {
      resetBusinessMapState();
    };
  }, []);

  return (
    <div
      className={`BM__sidebar relative h-full min-h-0 shadow-2${
        isSideBarColappsed ? " collapsed" : ""
      }`}
      onTransitionEnd={() => {
        if (isSideBarColappsed) {
          setIsShowItem(false);
        } else setIsShowItem(true);
      }}
    >
      <LoadingComponents loading={isSideBarLoading} text={"Đang tải dữ liệu"} />
      <Popover
        title="Đóng/mở vùng tìm kiếm"
        trigger={"hover"}
        placement="right"
        arrows={false}
        mouseEnterDelay="0.8"
      >
        <div
          className={`BM__collaps__Button shadow-5${
            isSideBarColappsed ? " collapsed" : ""
          }`}
          onClick={handleChangeSidebarState}
        >
          <i className="pi pi-angle-left"></i>
        </div>
      </Popover>

      <div
        className={`flex flex-column${
          isSideBarColappsed ? " opacity-0 pointer-events-none" : " h-full"
        }`}
      >
        <div className="p-2 px-3">
          <Input
            className="w-full "
            placeholder="Tìm kiếm..."
            onChange={handleSearchCustomer}
          />
        </div>

        {isShowItem && (
          <div className="p-2 px-3 h-full flex flex-column gap-2 relative overflow-y-auto">
            {_.isEmpty(tourList) && !isSideBarLoading ? (
              <div className="abs_center">
                <img src={no_file} />
                <div className="text-center">
                  <b className="sub_text_color">Không có dữ liệu</b>
                </div>
              </div>
            ) : (
              tourList.map((tour, index) => (
                <div
                  key={index}
                  style={{
                    animationDuration: `${
                      (index + 2 < 10 ? index + 2 : 10) * 100
                    }ms`,
                  }}
                  className={`flex gap-2 align-items-center flex-shrink-0 tour__select__Item${
                    isSideBarColappsed ? " collapsed" : ""
                  }${tourSelected === tour?.ma_tuyen ? " selected" : ""}
                `}
                  onClick={() => {
                    handleSelectTour(tour?.ma_tuyen);
                  }}
                >
                  <div>
                    <Avatar
                      style={{
                        background:
                          tourSelected === tour?.ma_tuyen
                            ? "#f58220"
                            : "#4779CF",
                        transition: "background 0.3s ease-in-out",
                      }}
                      shape="square"
                      size={45}
                      icon={<i className="pi pi-map-marker text-2xl"></i>}
                    />
                  </div>
                  <div className="w-full min-w-0 flex flex-column justify-content-between">
                    <div style={{ whiteSpace: "break-spaces" }}>
                      <span
                        className={`font-bold transition-colors transition-ease-in-out transition-duration-300 ${
                          tourSelected === tour?.ma_tuyen
                            ? "primary_color"
                            : "sub_text_color"
                        }`}
                      >
                        {tour?.ten_tuyen}
                      </span>
                    </div>
                    <div>{tour?.ten_nvbh || "Không có dữ liệu"}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TourSelector;
