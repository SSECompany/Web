import { Checkbox } from "antd";
import React, { memo } from "react";

const SelectCellHeader = ({ column }) => {
  const { selectedRowKeys, dataLength } = column;
  const checked = selectedRowKeys.length === dataLength && dataLength !== 0;

  const handleChange = (e) => {
    const { onSelectAll } = column;
    onSelectAll({ selected: e.target.checked });
  };

  return (
    <Checkbox className="ml-1" onChange={handleChange} checked={checked} />
  );
};

export default memo(SelectCellHeader);
