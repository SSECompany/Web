import { Transfe,Tree , Select, Space ,Switch,Button  } from "antd";
import React, { useEffect, useState,useCallback,useMemo} from "react";
import https from "../../../../utils/https";
import LoadingComponents from "../../../Loading/LoadingComponents";
import {
  fetchReportList,
  getSeletedReport,
  modifiedSeletedReport,
} from "../../Store/Actions/ReportDashboardActions";
import { forEach } from "lodash";
import {
  apigetAllClaimsByUser,
  apiGetAllClaims,
  apiGetUnitClaims,
} from "../../API";

const TreeNode = React.memo(({defaultSelected,dataClaims,test}) => {
  const [expandedKeys, setExpandedKeys] = useState(defaultSelected);
  const [checkedKeys, setCheckedKeys] = useState(defaultSelected);
  const [selectedKeys, setSelectedKeys] = useState(defaultSelected);
  const [autoExpandParent, setAutoExpandParent] = useState(true);
  const onExpand = (expandedKeysValue) => {
    console.log('onExpand', expandedKeysValue);
    // if not set autoExpandParent to false, if children expanded, parent can not collapse.
    // or, you can remove all expanded children keys.
    setExpandedKeys(expandedKeysValue);
    setAutoExpandParent(false);
  };
 
  const onCheck = (checkedKeysValue) => {
    console.log('onCheck', checkedKeysValue);
    setCheckedKeys(checkedKeysValue);
  };

  const onSelect = (selectedKeysValue, info) => {
    console.log('onSelect', info);
    setSelectedKeys(selectedKeysValue);
  };
 
  useEffect(() => {
    console.log(defaultSelected);
    return () => {};
  }, []);
  useEffect(() => {
    console.log(defaultSelected);
    return () => {};
  }, [defaultSelected]);

  return (
      <Tree  className=" p-2 shadow-1" checkable
        onExpand={onExpand}
        expandedKeys={expandedKeys}
        autoExpandParent={autoExpandParent}
        onCheck={onCheck}
        checkedKeys={defaultSelected}
        defaultCheckedKeys={defaultSelected}
        defaultSelectedKeys={defaultSelected}
        onSelect={onSelect}
        selectedKeys={defaultSelected}
        treeData={dataClaims} >
      </Tree>
  );
});

export default TreeNode;
