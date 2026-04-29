import { Result } from "antd";
import React from "react";

const TableLocale = () => {
  const locale = {
    emptyText: (
      <Result
        className="full_width_results"
        title="Không có dữ liệu"
        subTitle="Không có dữ liệu nào được tạo, vui lòng thêm hoặc sửa"
      />
    ),
  };
  return locale;
};

export default TableLocale;
