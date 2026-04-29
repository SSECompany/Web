import { Tree } from "antd";
import React, { memo, useState } from "react";

const ReportLayoutPicker = ({ layout, selectCallback }) => {
  const [layoutKey, setLayoutKey] = useState([]);
  return (
    <div>
      <Tree
        className="permission__tree__container"
        checkable
        onCheck={(item) => {
          setLayoutKey(item);
          selectCallback(item);
        }}
        checkedKeys={layoutKey}
        treeData={layout}
      />
    </div>
  );
};

export default memo(ReportLayoutPicker);
