import { Tree } from "primereact/tree";
import React, { useState } from "react";

import { Outlet, useLocation, useNavigate } from "react-router-dom";
import SystemSetting from "../../../components/SystemOptions/Pages/SystemSetting/SystemSetting";
import { systemOptions } from "../../../utils/constants";
import "./System.css";

const System = () => {
  const [selectedNodeKey, setSelectedNodeKey] = useState("");
  const [expandedKeys, setExpandedKeys] = useState({});
  const navigate = useNavigate();
  const curLocation = useLocation();

  const onSelect = (event) => {
    if (event.node.key in expandedKeys) {
      const { [event.node.key]: removedProperty, ...newExpandedKeys } =
        expandedKeys;
      setExpandedKeys({ ...newExpandedKeys });
    } else {
      setExpandedKeys({ ...expandedKeys, [event.node.key]: true });
    }

    const node = { ...event.node };
    if (!node.children) {
      setSelectedNodeKey(node.key);
      return node.data ? navigate(node.data) : "";
    } else {
      setSelectedNodeKey("");
    }
  };

  const onUnselect = (event) => {};

  return (
    <div className="page_2_side_default gap-3">
      <div className="page_2_side_default_left system__left__side shadow-1">
        <Tree
          value={systemOptions}
          selectionMode="single"
          selectionKeys={selectedNodeKey}
          expandedKeys={expandedKeys}
          onSelect={onSelect}
          onToggle={(e) => {
            setExpandedKeys(e.value);
          }}
          onUnselect={onUnselect}
          filter
          filterMode="strict"
          filterPlaceholder="Tìm kiếm"
          className="system__left__navigation p-3"
        />
      </div>
      <div className="page_2_side_default_right border-round-sm system__right__side">
        {curLocation?.pathname === "/System" && <SystemSetting />}
        <Outlet />
      </div>
    </div>
  );
};

export default System;
