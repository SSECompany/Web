import { Tree } from "primereact/tree";
import React, { useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import ReportDashboard from "./ReportDashboard/ReportDashboard";

const reportLayout = [
  {
    key: "reports",
    label: "Dashboard",
    data: "/reports",
    icon: "pi pi-chart-bar",
  },

  {
    key: "1",
    label: "Bán hàng",
    data: "Báo cáo",
    icon: "pi pi-dollar",
    children: [
      {
        key: "1-1",
        label: "Bảng kê hoá đơn bán hàng",
        icon: "pi pi-list",
        data: "rptOrderList",
      },

      {
        key: "1-2",
        label: "Tổng hợp bán hàng",
        icon: "pi pi-dollar",
        data: "rptSalesSummary",
      },
    ],
  },
  // {
  //   key: "1",
  //   label: "Tài khoản",
  //   data: "Events Folder",
  //   icon: "pi pi-id-card",
  //   children: [
  //     {
  //       key: "1-0",
  //       label: "Tạo tài khoản",
  //       icon: "pi pi-user-plus",
  //       data: "Accounts",
  //     },
  //   ],
  // },
];

const reportLayoutDMS = [
  {
    key: "reports",
    label: "Dashboard",
    data: "/reports",
    icon: "pi pi-chart-bar",
  },

  {
    key: "0",
    label: "Viếng thăm",
    data: "Báo cáo",
    icon: "pi pi-clipboard",
    children: [
      {
        key: "checkin",
        label: "Báo cáo viếng thăm",
        icon: "pi pi-check-circle",
        data: "checkin",
      },
      {
        key: "locationReport",
        label: "Báo cáo vị trí",
        icon: "pi pi-map-marker",
        data: "locationReport",
      },
    ],
  },

  {
    key: "1",
    label: "Bán hàng",
    data: "Báo cáo",
    icon: "pi pi-dollar",
    children: [],
  },
  // {
  //   key: "1",
  //   label: "Tài khoản",
  //   data: "Events Folder",
  //   icon: "pi pi-id-card",
  //   children: [
  //     {
  //       key: "1-0",
  //       label: "Tạo tài khoản",
  //       icon: "pi pi-user-plus",
  //       data: "Accounts",
  //     },
  //   ],
  // },
];

const ReportLayout = () => {
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
    <div className="page_2_side_default">
      <div className="page_2_side_default_left system__left__side">
        <Tree
          value={reportLayout}
          selectionMode="single"
          selectionKeys={selectedNodeKey}
          expandedKeys={expandedKeys}
          onSelect={onSelect}
          onUnselect={onUnselect}
          onToggle={(e) => {
            setExpandedKeys(e.value);
          }}
          filter
          filterMode="strict"
          filterPlaceholder="Tìm kiếm"
          className="system__left__navigation"
        />
      </div>
      <div className="page_2_side_default_right system__right__side">
        {curLocation?.pathname === "/reports" && <ReportDashboard />}

        <Outlet />
      </div>
    </div>
  );
};

export default ReportLayout;
