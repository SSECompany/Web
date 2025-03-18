import { Spin } from "antd";
import PropTypes from "prop-types";
import React, { memo } from "react";
import "./Loading.css";

const LoadingComponents = ({ size, loading, text }) => {
  return (
    <>
      {loading && (
        <div className="loading__component">
          <b className="mb-2">{text || "Không có dữ liệu"}</b>

          <Spin className="mt-2" size="default" />
        </div>
      )}
    </>
  );
};

export default memo(LoadingComponents);

LoadingComponents.prototype = {
  size: PropTypes.number,
  loading: PropTypes.string.isRequired,
  text: PropTypes.string.isRequired,
};
