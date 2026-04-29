import {
  CalendarOutlined,
  DashboardOutlined,
  FundProjectionScreenOutlined,
  ProjectOutlined,
  TeamOutlined,
  BellOutlined,
} from "@ant-design/icons";
import { Layout, Menu, Tooltip } from "antd";
import { useEffect, useMemo, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
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
    } else if (path.includes("/workflow/task-management/templates")) {
      setSelectedKey("tasks-templates");
    } else if (path.includes("/workflow/task-management/forms")) {
      setSelectedKey("tasks-forms");
    } else if (path.includes("/workflow/task-management/categories")) {
      setSelectedKey("tasks-categories");
    } else if (path.includes("/workflow/task-management/resources")) {
      setSelectedKey("tasks-resources");
    } else if (path.includes("/workflow/task-management/reminders")) {
      setSelectedKey("tasks-reminders");
    } else if (path.includes("/workflow/task-management")) {
      setSelectedKey("tasks-list");
    } else if (path.includes("/workflow/calendar")) {
      setSelectedKey("calendar");
    } else if (path.includes("/workflow/roadmap")) {
      setSelectedKey("roadmap");
    }
  }, [location.pathname]);

  useHotkeys(
    "alt+shift+n",
    () => {
      navigate("/workflow/task-management/reminders");
      setSelectedKey("tasks-reminders");
    },
    { enableOnFormTags: ["input", "select", "textarea"] }
  );

  const menuItems = useMemo(
    () => [
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
          key: "tasks-reminders",
          label: "Nhắc việc",
          onClick: () =>
            navigate("/workflow/task-management/reminders"),
        },
        {
          key: "tasks-resources",
          label: "Bảng nguồn lực",
          onClick: () =>
            navigate("/workflow/task-management/resources"),
        },
        {
          type: "group",
          label: "Mẫu & hạng mục",
          children: [
            {
              key: "tasks-templates",
              label: "Công việc mẫu",
              onClick: () =>
                navigate("/workflow/task-management/templates"),
            },
            {
              key: "tasks-forms",
              label: "Biểu mẫu",
              onClick: () =>
                navigate("/workflow/task-management/forms"),
            },
            {
              key: "tasks-categories",
              label: "Hạng mục",
              onClick: () =>
                navigate("/workflow/task-management/categories"),
            },
          ],
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
  ],
    [navigate]
  );

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

