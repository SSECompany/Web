import { Spin } from "antd";
import React from "react";
import "./Loading.css";

const Loading = ({ size = "large", tip = "Đang tải..." }) => {
  return (
    <div className="loading-container">
      <Spin size={size} tip={tip} />
    </div>
  );
};

export default Loading;




