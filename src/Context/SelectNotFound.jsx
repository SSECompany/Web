import { Empty, Spin } from "antd";
import React from "react";

const SelectNotFound = (loading, options) => {
  if (loading && options.length == 0) {
    return <Spin size="small" />;
  }
  if (!loading && options.length == 0) {
    return (
      <Empty
        className="default_select_empty"
        image="https://gw.alipayobjects.com/zos/antfincdn/ZHrcdLPrvN/empty.svg"
        description={<span>Không có dữ liệu</span>}
      ></Empty>
    );
  }
  return null;
};

export default SelectNotFound;
