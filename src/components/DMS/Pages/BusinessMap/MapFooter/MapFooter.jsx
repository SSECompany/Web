import { Popover } from "antd";
import React from "react";
import { useSelector } from "react-redux";
import { setisFooterColappsed } from "../../../Store/Sagas/BusinessMapActions";
import { getBusinessMapState } from "../../../Store/Selector/Selectors";

const MapFooter = () => {
  const { isFooterColappsed, customerSelected, isFooterLoading } =
    useSelector(getBusinessMapState);

  const handleChangeFooterState = () => {
    setisFooterColappsed(!isFooterColappsed);
  };

  return (
    <div
      className={`relative p-3 w-full min-w-0 BM__footer__Container${
        isFooterColappsed ? " collapsed" : ""
      }`}
    >
      <Popover
        title="Đóng/mở vùng thông tin chi tiết"
        trigger={"hover"}
        placement="right"
        arrows={false}
        mouseEnterDelay="0.8"
      >
        <div
          className={`BM_footer__collaps__Button shadow-5${
            isFooterColappsed ? " collapsed" : ""
          }`}
          onClick={handleChangeFooterState}
        >
          <i className="pi pi-angle-down"></i>
        </div>
      </Popover>
      <div className={isFooterColappsed ? "opacity-0 pointer-events-none" : ""}>
        <p className="text-8xl"> hihihi {customerSelected}</p>
      </div>
    </div>
  );
};

export default MapFooter;
