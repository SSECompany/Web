import { Checkbox } from "antd";
import React, { memo } from "react";

const SelectCell = ({ rowData, rowIndex, column }) => {
  const { selectedRowKeys } = column;
  const checked = selectedRowKeys?.includes(rowData?.id);

  const handleChange = (e) => {
    const { onChange } = column;
    onChange({
      selected: e.target.checked,
      rowKey: rowData?.id,
      rowData,
      rowIndex,
    });
  };
  return (
    <Checkbox className="ml-1" onChange={handleChange} checked={checked} />
  );
};

export default memo(SelectCell);
