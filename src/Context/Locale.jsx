import { Result } from "antd";
import React from "react";

const Locale = () => {
  return (
    <Result
      icon={
        <img
          src="https://d29fhpw069ctt2.cloudfront.net/icon/image/47953/preview.svg"
          alt=""
        ></img>
      }
      className="full_width_results"
      title="Không có dữ liệu"
      subTitle="Không có dữ liệu nào được tạo, vui lòng thêm hoặc sửa"
    />
  );
};

export default Locale;
