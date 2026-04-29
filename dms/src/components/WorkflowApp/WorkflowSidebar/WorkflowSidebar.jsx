import {
  AuditOutlined,
  CalendarOutlined,
  DashboardOutlined,
  DollarCircleOutlined,
  FundProjectionScreenOutlined,
  ProjectOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { Layout, Menu } from "antd";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./WorkflowSidebar.css";

const { Sider } = Layout;

const WorkflowSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [selectedKey, setSelectedKey] = useState("dashboard");

  useEffect(() => {
    // Set selected key based on current path
    const path = location.pathname;
    if (path.includes("/workflow/dashboard")) {
      setSelectedKey("dashboard");
    } else if (path.includes("/workflow/project-management")) {
      setSelectedKey("projects");
    } else if (path.includes("/workflow/task-management")) {
      setSelectedKey("tasks");
    } else if (path.includes("/workflow/calendar")) {
      setSelectedKey("calendar");
    } else if (path.includes("/workflow/roadmap")) {
      setSelectedKey("roadmap");
    } else if (path.includes("/workflow/finance/proposals")) {
      setSelectedKey("proposals");
    } else if (path.includes("/workflow/finance/ledger")) {
      setSelectedKey("finance-ledger");
    }
  }, [location.pathname]);

  const menuItems = [
    {
      key: "dashboard",
      icon: <DashboardOutlined />,
      label: "Dashboard",
      onClick: () => navigate("/workflow/dashboard"),
    },
    {
      type: "divider",
    },
    {
      key: "projects",
      icon: <ProjectOutlined />,
      label: "Quản lý dự án",
      children: [
        {
          key: "projects-list",
          label: "Danh sách dự án",
          onClick: () => navigate("/workflow/project-management/projects"),
        },
      ],
    },
    {
      key: "tasks",
      icon: <TeamOutlined />,
      label: "Quản lý công việc",
      children: [
        {
          key: "tasks-list",
          label: "Danh sách công việc",
          onClick: () => navigate("/workflow/task-management/tasks"),
        },
        {
          key: "tasks-reports",
          label: "Báo cáo công việc",
          onClick: () => navigate("/workflow/task-management/reports"),
        },
      ],
    },
    {
      type: "divider",
    },
    {
      key: "calendar",
      icon: <CalendarOutlined />,
      label: "Lịch",
      onClick: () => navigate("/workflow/calendar"),
    },
    {
      key: "roadmap",
      icon: <FundProjectionScreenOutlined />,
      label: "Roadmap",
      onClick: () => navigate("/workflow/roadmap"),
    },
    {
      type: "divider",
    },
    {
      key: "proposals",
      icon: <AuditOutlined />,
      label: "Trung tâm đề xuất",
      onClick: () => navigate("/workflow/finance/proposals"),
    },
    {
      key: "finance-ledger",
      icon: <DollarCircleOutlined />,
      label: "Sổ thu chi",
      onClick: () => navigate("/workflow/finance/ledger"),
    },
  ];

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={setCollapsed}
      width={250}
      className="workflow-sidebar"
      theme="light"
    >
      <div className="workflow-sidebar-logo">
        {!collapsed ? (
          <span style={{ fontWeight: "bold", fontSize: 16 }}>WORKFLOW</span>
        ) : (
          <span style={{ fontWeight: "bold" }}>WF</span>
        )}
      </div>
      <Menu
        mode="inline"
        selectedKeys={[selectedKey]}
        items={menuItems}
        style={{ borderRight: 0 }}
      />
    </Sider>
  );
};

export default WorkflowSidebar;

