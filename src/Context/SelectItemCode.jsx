import { Select, Space } from "antd";
import React from "react";

const SelectItemCode = (options) => {
  return (
    <>
      {options.map((option, i) => {
        return (
          <Select.Option
            key={option.value}
            value={option.value}
            label={option.label}
          >
            <Space>
              <span
                role="img"
                className="default_select_code"
                aria-label={option.label}
              >
                {option.value}
              </span>

              <span>{option.label}</span>
            </Space>
          </Select.Option>
        );
      })}
    </>
  );
};

export default SelectItemCode;
