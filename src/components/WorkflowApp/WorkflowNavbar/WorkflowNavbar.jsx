import { DownOutlined } from "@ant-design/icons";
import { UilSearch } from "@iconscout/react-unicons";
import { Input, Menu, Modal } from "antd";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";

import options__icon from "../../../Icons/options__icon.svg";
import white from "../../../Icons/white.png";
import { getIsHideNav, getUserInfo } from "../../../store/selectors/Selectors";
import Notify from "../../Navbar/Notify/Notify";
import "./WorkflowNavbar.css";

const WorkflowNavbar = () => {
  const [resultsSearchModal, setResultsSearchModal] = useState([]);
  const [isOpenSearchModal, setOpenSearchModal] = useState(false);
  const [inputSearchModal, setInputSearchModal] = useState("");
  const [navbarSelectedKey, setnavbarSelectedKey] = useState("");
  const [currentSystem] = useState("Workflow");

  const isHideNav = useSelector(getIsHideNav);
  const userInfo = useSelector(getUserInfo);
  const routeLocation = useLocation();
  const navigate = useNavigate();

  // Workflow specific modules for search
  const workflowModules = [
    {
      label: "Dashboard",
      path: "workflow/dashboard",
      description: "Tổng quan workflow",
    },
    {
      label: "Danh sách dự án",
      path: "workflow/project-management/projects",
      description: "Quản lý tất cả dự án",
    },
    {
      label: "Báo cáo tiến độ dự án",
      path: "workflow/project-management/reports/progress",
      description: "Theo dõi tiến độ các dự án",
    },
    {
      label: "Báo cáo khối lượng dự án",
      path: "workflow/project-management/reports/volume",
      description: "Báo cáo khối lượng thực hiện",
    },
    {
      label: "Báo cáo chi phí dự án",
      path: "workflow/project-management/reports/cost",
      description: "Theo dõi chi phí dự án",
    },
    {
      label: "Báo cáo KPI dự án",
      path: "workflow/project-management/reports/kpi",
      description: "Đánh giá KPI dự án",
    },
    {
      label: "Danh sách công việc",
      path: "workflow/task-management/tasks",
      description: "Quản lý tất cả công việc",
    },
    {
      label: "Giao việc",
      path: "workflow/task-management/assignment",
      description: "Phân công công việc",
    },
    {
      label: "Nhắc việc",
      path: "workflow/task-management/reminders",
      description: "Quản lý nhắc việc",
    },
    {
      label: "Báo cáo tiến độ công việc",
      path: "workflow/task-management/reports/progress",
      description: "Theo dõi tiến độ công việc",
    },
    {
      label: "Báo cáo KPI công việc",
      path: "workflow/task-management/reports/kpi",
      description: "Đánh giá KPI công việc",
    },
  ];

  const handleOpenSearchModal = () => setOpenSearchModal(true);

  const handleCancelSearchModal = () => {
    setOpenSearchModal(false);
    setInputSearchModal("");
    setResultsSearchModal([]);
  };

  const handleSearchInModal = (searchValue) => {
    if (!searchValue.trim()) {
      setResultsSearchModal([]);
      return;
    }

    const filtered = workflowModules.filter(
      (module) =>
        module.label.toLowerCase().includes(searchValue.toLowerCase()) ||
        module.description.toLowerCase().includes(searchValue.toLowerCase())
    );

    setResultsSearchModal(filtered);
  };

  const handleSelectFunction = (path) => {
    navigate(`/${path}`);
    handleCancelSearchModal();
  };

  const handleNavbarClick = (item) => {
    if (item.path) {
      navigate(`/${item.path}`);
    }
  };

  const handleLogo = () => {
    navigate("/workflow/dashboard");
  };

  // Workflow menu items
  const workflowMenuItems = [
    {
      key: "dashboard",
      label: "Dashboard",
      onClick: () => navigate("/workflow/dashboard"),
    },
    {
      key: "projects",
      label: "Quản lý dự án",
      children: [
        {
          key: "project-list",
          label: "Danh sách dự án",
          onClick: () => navigate("/workflow/project-management/projects"),
        },
        {
          key: "project-reports",
          label: "Báo cáo dự án",
          children: [
            {
              key: "project-progress",
              label: "Báo cáo tiến độ",
              onClick: () =>
                navigate("/workflow/project-management/reports/progress"),
            },
            {
              key: "project-volume",
              label: "Báo cáo khối lượng",
              onClick: () =>
                navigate("/workflow/project-management/reports/volume"),
            },
            {
              key: "project-cost",
              label: "Báo cáo chi phí",
              onClick: () =>
                navigate("/workflow/project-management/reports/cost"),
            },
            {
              key: "project-kpi",
              label: "Báo cáo KPI",
              onClick: () =>
                navigate("/workflow/project-management/reports/kpi"),
            },
          ],
        },
      ],
    },
    {
      key: "tasks",
      label: "Quản lý công việc",
      children: [
        {
          key: "task-list",
          label: "Danh sách công việc",
          onClick: () => navigate("/workflow/task-management/tasks"),
        },
        {
          key: "task-assignment",
          label: "Giao việc",
          onClick: () => navigate("/workflow/task-management/assignment"),
        },
        {
          key: "task-reminders",
          label: "Nhắc việc",
          onClick: () => navigate("/workflow/task-management/reminders"),
        },
        {
          key: "task-reports",
          label: "Báo cáo công việc",
          children: [
            {
              key: "task-progress",
              label: "Báo cáo tiến độ",
              onClick: () =>
                navigate("/workflow/task-management/reports/progress"),
            },
            {
              key: "task-kpi",
              label: "Báo cáo KPI",
              onClick: () => navigate("/workflow/task-management/reports/kpi"),
            },
          ],
        },
      ],
    },
  ];

  useEffect(() => {
    // Update selected key based on current route
    const pathname = routeLocation.pathname;
    if (pathname.includes("/workflow/dashboard")) {
      setnavbarSelectedKey("dashboard");
    } else if (pathname.includes("/workflow/project-management")) {
      setnavbarSelectedKey("projects");
    } else if (pathname.includes("/workflow/task-management")) {
      setnavbarSelectedKey("tasks");
    } else {
      setnavbarSelectedKey("");
    }
  }, [routeLocation]);

  return (
    <div className="workflow-navbar">
      <div className="workflow-navbar-left">
        <div className="workflow-navbar-logo">
          <img
            src={white}
            alt="WORKFLOW"
            onClick={handleLogo}
            style={{ cursor: "pointer", height: "30px" }}
          />
          <div className="workflow-navbar-search">
            <img
              src={options__icon}
              alt="Search"
              onClick={handleOpenSearchModal}
              style={{ cursor: "pointer" }}
            />
            <span className="workflow-system-label">
              {currentSystem}
              <DownOutlined style={{ fontSize: "12px", marginLeft: "8px" }} />
            </span>
          </div>
        </div>

        {/* Menu Navigation */}
        <div className="workflow-navbar-menu">
          <Menu
            mode="horizontal"
            selectedKeys={[navbarSelectedKey]}
            items={workflowMenuItems}
            style={{
              background: "transparent",
              border: "none",
              fontSize: "14px",
            }}
          />
        </div>
      </div>

      <div className="workflow-navbar-right">
        <div className="workflow-user-info">
          <span>Xin chào, {userInfo?.fullName || "User"}</span>
          <Notify />
        </div>
      </div>

      {/* Search Modal */}
      <Modal
        className="workflow-search-modal"
        open={isOpenSearchModal}
        onCancel={handleCancelSearchModal}
        closable={false}
        title="Tìm kiếm chức năng Workflow"
        okButtonProps={{ style: { display: "none" } }}
        cancelText="Đóng"
        centered
        width={600}
      >
        <div className="workflow-search-container">
          <Input
            className="workflow-search-input"
            placeholder="Tìm kiếm chức năng workflow..."
            value={inputSearchModal}
            onChange={(e) => {
              setInputSearchModal(e.target.value);
              handleSearchInModal(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                handleCancelSearchModal();
              } else if (e.key === "Enter" && resultsSearchModal.length > 0) {
                handleSelectFunction(resultsSearchModal[0].path);
              }
            }}
            prefix={<UilSearch size="18" color="#1677ff" />}
            autoFocus
          />

          <div className="workflow-search-results">
            {resultsSearchModal.length === 0 && !inputSearchModal && (
              <div className="workflow-search-help">
                <h4>🔍 Các chức năng có sẵn:</h4>
                <div className="workflow-modules-grid">
                  {workflowModules.map((module, index) => (
                    <div
                      key={index}
                      className="workflow-module-item"
                      onClick={() => handleSelectFunction(module.path)}
                    >
                      <strong>{module.label}</strong>
                      <p>{module.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {resultsSearchModal.length === 0 && inputSearchModal && (
              <div className="workflow-no-results">
                Không tìm thấy chức năng nào phù hợp với "{inputSearchModal}"
              </div>
            )}

            {resultsSearchModal.length > 0 && (
              <div className="workflow-results-list">
                {resultsSearchModal.map((result, index) => (
                  <div
                    key={index}
                    className="workflow-result-item"
                    onClick={() => handleSelectFunction(result.path)}
                  >
                    <strong>{result.label}</strong>
                    <p>{result.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default WorkflowNavbar;
