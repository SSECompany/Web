import { DownOutlined } from "@ant-design/icons";
import { UilSearch } from "@iconscout/react-unicons";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import "./Navbar.css";

import { Dropdown, Input, Modal } from "antd";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getRoutesAccess } from "../../app/Functions/getRouteAccess";
import options__icon from "../../Icons/options__icon.svg";
import white from "../../Icons/white.png";
import router, { routes } from "../../router/routes";
import {
  setClaims,
  setIsBackgrouds,
  setUserSetting,
} from "../../store/reducers/claimsSlice";
import { getClaims, getUserInfo } from "../../store/selectors/Selectors";
import jwt from "../../utils/jwt";
import { multipleTablePutApi } from "../SaleOrder/API";
import Notify from "./Notify/Notify.jsx";

const Navbar = () => {
  const [resultsSearchModal, setResultsSearchModal] = useState([]);
  const [isOpenSearchModal, setOpenSearchModal] = useState(false);
  const [inputSearchModal, setInputSearchModal] = useState("");
  const [navbarSelectedKey, setnavbarSelectedKey] = useState("");
  const [navbarItems, setNavbarItems] = useState();
  const [searchFunctions, setSearchFunctions] = useState([]);
  const [currentSystem, setCurrentSystem] = useState("DMS");
  const [systemDropdownVisible, setSystemDropdownVisible] = useState(false);
  // Navbar luôn hiển thị - bỏ logic ẩn navbar
  // const isHideNav = useSelector(getIsHideNav);
  const userInfo = useSelector(getUserInfo);
  const userClaims = useSelector(getClaims);
  const [isShowAlert, setIsShowAlert] = useState(false);
  const [nextRoute, setNextRoute] = useState("");

  const routeLocation = useLocation();

  const renderNavbar = (navItems) => {
    const renderedNavbar = navItems.map((item) => {
      if (item?.children?.length == 0) {
        item.label = <span className="navbar_child_route">{item.label}</span>;
        delete item.children;
      }

      if (item?.children?.length > 0) {
        item.onTitleClick = () => {
          handleNavbarClick(item.children[0]);
        };
        item.children.map((child) => {
          child.label = (
            <span className="navbar_child_route dark_grey_text_color">
              {child.label}
            </span>
          );
        });
      } else {
        item.onTitleClick = () => {
          handleNavbarClick(item);
        };
      }
      return item;
    });

    setNavbarItems(renderedNavbar || []);
  };

  // firebase to send notifications
  // const serviceNotifyParams = useMemo(() => {
  //   if (navbarItems) return { colection: "Notify", type: "all" };
  // }, [navbarItems]);

  // const servicePushNotifyParams = useMemo(() => {
  //   if (navbarItems) return { colection: "Notify", type: "changes" };
  // }, [navbarItems]);

  // const getNotify = useFireStore(
  //   serviceNotifyParams.colection,
  //   serviceNotifyParams.type
  // );
  // const pushNotify = useFireStore(
  //   serviceNotifyParams.colection,
  //   serviceNotifyParams.type
  // );

  // function usePrevious(value) {
  //   const ref = useRef();
  //   useEffect(() => {
  //     ref.current = value;
  //   });
  //   return ref.current;
  // }
  // const prevAmount = usePrevious(getNotify);

  // useEffect(() => {
  //   if (getNotify && getNotify.length > 0 && prevAmount.length > 0) {
  //     console.log(getNotify);
  //   }

  //   if (pushNotify.length > 0) {
  //     console.log(pushNotify);
  //   }
  // }, [getNotify, pushNotify]);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleOpenSearchModal = () => {
    setOpenSearchModal(true);
  };

  const handleCancelSearchModal = () => {
    setOpenSearchModal(false);
    setInputSearchModal("");
    setResultsSearchModal([]);
  };
  const handleLogout = async () => {
    await jwt.resetAccessToken();
    router.navigate("/login");
    dispatch(setClaims([]));
  };
  const handleNavbarClick = (item) => {
    if (routeLocation.pathname === "/RO/Reatailorder") {
      setIsShowAlert(true);
      setNextRoute(
        item?.item?.props?.path ? `${item.item.props.path}` : `${item.path}`
      );
      return;
    }
    navigate(
      item?.item?.props?.path ? `${item.item.props.path}` : `${item.path}`
    );
  };

  const handleLogo = () => {
    setnavbarSelectedKey("");
    if (!router.state.location.pathname.includes("Dashboard")) navigate("/");
  };

  const handleLoadNavbar = async (systemType = "DMS") => {
    const navitems = { ...(await getRoutesAccess(routes)) };

    let filteredSearchFunctions = navitems.flatRoutes.filter(
      (item) =>
        (!item.children || !item?.children?.length > 0) && !item.isParent
    );

    // Tạo các groups modules riêng biệt
    const dmsModules = filteredSearchFunctions.filter(
      (route) =>
        // Loại bỏ tất cả workflow và HR modules
        !route.path?.includes("workflow") &&
        !route.path?.includes("project") &&
        !route.path?.includes("task") &&
        !route.path?.includes("HR") &&
        !route.path?.includes("schedule") &&
        !route.label.toLowerCase().includes("dự án") &&
        !route.label.toLowerCase().includes("công việc") &&
        !route.label.toLowerCase().includes("chấm công") &&
        !route.label.toLowerCase().includes("project") &&
        !route.label.toLowerCase().includes("task")
    );

    const workflowModules = filteredSearchFunctions.filter(
      (route) =>
        // Chỉ các route thực sự thuộc workflow system
        route.path?.includes("workflow") ||
        route.path?.includes("project") ||
        route.path?.includes("task") ||
        route.label.toLowerCase().includes("dự án") ||
        route.label.toLowerCase().includes("công việc") ||
        route.label.toLowerCase().includes("project") ||
        route.label.toLowerCase().includes("task") ||
        // Dashboard chỉ khi ở workflow
        (route.label.toLowerCase() === "dashboard" &&
          route.path?.includes("workflow"))
    );

    const hrmModules = filteredSearchFunctions.filter(
      (route) =>
        // Chỉ các route thực sự thuộc HR system
        route.path?.includes("HR") ||
        route.path?.includes("schedule") ||
        route.label.toLowerCase().includes("chấm công") ||
        route.label.toLowerCase().includes("nhân sự") ||
        route.label.toLowerCase().includes("hr")
    );

    // Filter theo system hiện tại
    if (systemType === "WORKFLOW") {
      // CHỈ 5 MODULES CỐT LÕI - Đã được user confirm
      filteredSearchFunctions = [
        {
          label: "Dashboard Workflow",
          path: "workflow/dashboard",
          icon: "📊",
          description: "Tổng quan dự án & công việc",
        },
        {
          label: "Danh sách dự án",
          path: "workflow/projects",
          icon: "📁",
          description: "Quản lý tất cả dự án",
        },
        {
          label: "Danh sách công việc",
          path: "workflow/tasks",
          icon: "✅",
          description: "Quản lý tasks như Redmine",
        },
        {
          label: "Giao việc",
          path: "workflow/assignment",
          icon: "👥",
          description: "Phân công công việc",
        },
        {
          label: "Báo cáo tổng hợp",
          path: "workflow/reports",
          icon: "📈",
          description: "Reports & Analytics",
        },
      ];
    } else if (systemType === "HRM") {
      // LUÔN sử dụng modules tùy chỉnh cho HRM để đảm bảo hoàn toàn riêng biệt
      filteredSearchFunctions = [
        { label: "Dashboard HR", path: "hrm/dashboard" },
        { label: "Bảng chấm công", path: "HR/Schedule" },
        { label: "Bảng chấm công chi tiết", path: "HR/ScheduleDetail" },
        { label: "Quản lý nhân sự", path: "hrm/employees" },
        { label: "Báo cáo nhân sự", path: "hrm/reports" },
        { label: "Quản lý ca làm việc", path: "hrm/shifts" },
        { label: "Nghỉ phép", path: "hrm/leaves" },
        { label: "Tính lương", path: "hrm/payroll" },
      ];
    } else {
      // DMS hiển thị modules DMS + một số chung
      filteredSearchFunctions = dmsModules;
    }

    renderNavbar(navitems.nestedRoutes);
    setSearchFunctions(filteredSearchFunctions);
  };
  const getUserSetting = async (ma_dvcs) => {
    const t = await multipleTablePutApi({
      store: "api_user_setting",
      param: { ma_dvcs: ma_dvcs },
      data: {},
    }).then((res) => {
      const data = res.listObject;

      const setting = {
        tk_nh: data[0][0]?.tk_nh,
        bin: data[0][0]?.bin | "",
        bank_account_name: data[0][0]?.bank_account_name | "",
        hs_quy_doi: data[0][0]?.hs_quy_doi | 0,
        maxPoint: data[0][0]?.maxPoint,
        address_bp: data[0][0]?.address_bp,
        tell_bp: data[0][0]?.tell_bp,
        name_dvcs: data[0][0]?.name_dvcs,
      };

      dispatch(setUserSetting(setting));
    });
  };

  useEffect(() => {
    dispatch(setClaims(jwt.getClaims() ? jwt.getClaims() : {}));
    getUserSetting(jwt.getClaims().MA_DVCS);

    // Auto-detect system from URL
    const currentPath = window.location.pathname;
    if (currentPath.includes("/workflow")) {
      setCurrentSystem("WORKFLOW");
    } else if (currentPath.includes("/hrm")) {
      setCurrentSystem("HRM");
    } else {
      setCurrentSystem("DMS");
    }

    // Sử dụng system đã được detect thay vì default
    const detectedSystem = currentPath.includes("/workflow")
      ? "WORKFLOW"
      : currentPath.includes("/hrm")
      ? "HRM"
      : "DMS";

    handleLoadNavbar(detectedSystem);
  }, []);

  const items = [
    {
      key: "1",
      label: "Cài đặt",
    },
    {
      key: "contact",
      label: <Link to={"contact"}>Liên hệ</Link>,
    },
    {
      key: "3",
      label: "lịch sử hoạt động",
    },
    {
      key: "4",
      label: <Link onClick={handleLogout}>Logout</Link>,
      danger: true,
    },
  ];
  const searchResult = (query) => {
    const results = searchFunctions.filter((item) =>
      item.label.toLocaleLowerCase().includes(query.toLocaleLowerCase())
    );
    return results.map((result, idx) => {
      // Highlight matching text
      const label = result.label;
      const regex = new RegExp(`(${query})`, "gi");
      const highlightedLabel = label.replace(regex, "<mark>$1</mark>");

      return {
        value: result.label,
        path: result.path,
        label: (
          <div
            className="modal_search_results_item"
            onClick={() => handleSelectFuntion(result.path)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSelectFuntion(result.path);
              }
            }}
            tabIndex={0}
          >
            <span dangerouslySetInnerHTML={{ __html: highlightedLabel }}></span>
          </div>
        ),
      };
    });
  };

  const handleSearchInModal = (value) => {
    setResultsSearchModal(value ? searchResult(value) : []);
  };

  const handleSelectFuntion = (path) => {
    router.navigate("/" + path);
    handleCancelSearchModal();
  };

  const handleSetBackground = () => {
    dispatch(setIsBackgrouds(true));
  };

  const handleSystemChange = (system) => {
    setCurrentSystem(system);
    setSystemDropdownVisible(false);

    // Reload navbar với search functions phù hợp cho system mới
    handleLoadNavbar(system);

    // Logic để chuyển đổi giao diện theo hệ thống
    switch (system) {
      case "DMS":
        // Navigate to DMS interface và kích hoạt background
        handleSetBackground();
        navigate("/");
        break;
      case "HRM":
        // Navigate to HRM interface - tắt background để phân biệt
        dispatch(setIsBackgrouds(false));
        navigate("/hrm");
        break;
      case "WORKFLOW":
        // Navigate to WORKFLOW dashboard - tắt background để phân biệt
        dispatch(setIsBackgrouds(false));
        navigate("/workflow/dashboard");
        break;
      default:
        navigate("/");
    }
  };

  const systemItems = [
    {
      key: "DMS",
      label: (
        <div
          className={`system_dropdown_item dms_theme ${
            currentSystem === "DMS" ? "active" : ""
          }`}
          onClick={() => handleSystemChange("DMS")}
        >
          <span className="system_name">DMS</span>
        </div>
      ),
    },
    {
      key: "HRM",
      label: (
        <div
          className={`system_dropdown_item hrm_theme ${
            currentSystem === "HRM" ? "active" : ""
          }`}
          onClick={() => handleSystemChange("HRM")}
        >
          <span className="system_name">HRM</span>
        </div>
      ),
    },
    {
      key: "WORKFLOW",
      label: (
        <div
          className={`system_dropdown_item workflow_theme ${
            currentSystem === "WORKFLOW" ? "active" : ""
          }`}
          onClick={() => handleSystemChange("WORKFLOW")}
        >
          <span className="system_name">WORKFLOW</span>
        </div>
      ),
    },
  ];

  const handleRouteChange = async (data) => {
    setnavbarSelectedKey(data?.pathname?.substring(1) || "");
    const { flatRoutes } = await getRoutesAccess(routes);
    const validRoutes = [
      "/",
      "Dashboard",
      " ",
      "",
      "login",
      "loginSSO",
      "transfer",
    ];
    if (
      !validRoutes.includes(data?.pathname?.substring(1)) &&
      flatRoutes.findIndex(
        (item) => item.path === data?.pathname?.substring(1)
      ) < 0
    ) {
      // navigate("/notFound");
    }
  };

  useEffect(() => {
    handleRouteChange(routeLocation);

    // Auto-update system based on route changes - NHƯNG KHÔNG RELOAD NAVBAR
    const currentPath = routeLocation.pathname;
    let detectedSystem = "DMS";
    if (currentPath.includes("/workflow")) {
      detectedSystem = "WORKFLOW";
    } else if (currentPath.includes("/hrm")) {
      detectedSystem = "HRM";
    }

    // Chỉ update system nếu khác với hiện tại
    if (detectedSystem !== currentSystem) {
      setCurrentSystem(detectedSystem);
      // KHÔNG gọi handleLoadNavbar ở đây để tránh override
    }
  }, [routeLocation, currentSystem]);

  return (
    <div className="navbar">
      <div className="first_navbar_row_left">
        <div className="navbar_logo_functions">
          <img
            src={white}
            alt="SSE giải pháp phần mềm doanh nghiệp"
            onClick={handleLogo}
            color="red"
          ></img>
          <div className="navbar_search_function">
            <img
              src={options__icon}
              alt="SSE giải pháp phần mềm doanh nghiệp"
              onClick={handleOpenSearchModal}
              color="red"
            ></img>
            <Dropdown
              menu={{ items: systemItems }}
              trigger={["click"]}
              open={systemDropdownVisible}
              onOpenChange={setSystemDropdownVisible}
              overlayClassName="system_dropdown"
              placement="bottomLeft"
            >
              <span
                onClick={() => setSystemDropdownVisible(!systemDropdownVisible)}
                className="default_header_label system_selector"
              >
                {currentSystem}
                <i
                  className={`pi pi-chevron-down ${
                    systemDropdownVisible ? "rotated" : ""
                  }`}
                ></i>
              </span>
            </Dropdown>
          </div>
        </div>

        {/* Menu routes đã được ẩn - sử dụng tìm kiếm để truy cập các chức năng */}
      </div>
      <div className="first_navbar_row_right flex gap-1">
        <div className="px-1 text-center">
          <div className="primary_bold_text">{userInfo?.fullName || ""}</div>
          <div className="primary_text_color">
            <i className="pi pi-map-marker mr-1"></i>
            {userInfo?.storeName || ""}
          </div>
        </div>

        <ul>
          <li>
            <div className="navbar_avatar_container">
              <Dropdown
                menu={{ items: items }}
                overlayClassName="navbar_avatar_dropdown"
                placement="bottomRight"
                trigger={["click"]}
              >
                <DownOutlined />
              </Dropdown>
            </div>
          </li>
          <li>
            <Notify />
          </li>
        </ul>
      </div>

      <Modal
        className="modal_home_search"
        open={isOpenSearchModal}
        onCancel={handleCancelSearchModal}
        closable={false}
        title="Tìm kiếm"
        okButtonProps={{ style: { display: "none" } }}
        cancelText="Đóng"
        centered
        width={600}
      >
        <div className="search_modal_search_bar_container">
          <div className="search_modal_search_bar">
            <Input
              id="navbar_input_search"
              className="navbar_input_search"
              placeholder="Tìm kiếm chức năng..."
              value={inputSearchModal}
              onChange={(e) => {
                setInputSearchModal(e.target.value);
                handleSearchInModal(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  handleCancelSearchModal();
                } else if (e.key === "Enter" && resultsSearchModal.length > 0) {
                  // Navigate to first result when pressing Enter
                  const firstResult = resultsSearchModal[0];
                  if (firstResult.path) {
                    handleSelectFuntion(firstResult.path);
                  }
                }
              }}
              prefix={<UilSearch size="18" color="#1677ff" />}
              autoFocus
            />
          </div>
          <div className="modal_search_results">
            {resultsSearchModal.length === 0 && !inputSearchModal && (
              <div className="search_help_container">
                <div className="search_help_title">
                  <i
                    className="pi pi-search"
                    style={{ fontSize: "24px", color: "#1677ff" }}
                  ></i>
                  <h3>Tìm kiếm nhanh chức năng</h3>
                </div>

                <div className="search_suggestions">
                  <h4>📌 Tất cả các modules có thể truy cập:</h4>
                  <div className="popular_functions">
                    {searchFunctions.map((func, index) => (
                      <div
                        key={index}
                        className="popular_function_item"
                        onClick={() => handleSelectFuntion(func.path)}
                      >
                        <span>{func.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {resultsSearchModal.length === 0 && inputSearchModal && (
              <div className="no_results">
                <i
                  className="pi pi-exclamation-triangle"
                  style={{ fontSize: "48px", color: "#ffa500" }}
                ></i>
                <p>Không tìm thấy chức năng phù hợp</p>
                <small>
                  Thử tìm với từ khóa khác hoặc chọn từ danh sách bên dưới
                </small>
                <div className="alternative_suggestions">
                  {searchFunctions.slice(0, 4).map((func, index) => (
                    <div
                      key={index}
                      className="alternative_item"
                      onClick={() => handleSelectFuntion(func.path)}
                    >
                      {func.label}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {resultsSearchModal.length > 0 && (
              <div className="search_results_grid">
                {resultsSearchModal.map((item, index) => (
                  <span key={index}>{item.label}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>

      <Modal
        open={isShowAlert}
        onCancel={() => {
          setIsShowAlert(false);
        }}
        onOk={() => {
          navigate(nextRoute);
          setIsShowAlert(false);
        }}
        closable={true}
        title="Cảnh báo"
        cancelText="Đóng"
        centered
      >
        <span>
          Khi chuyển trang bạn sẽ mất những dữ liệu đang dở dang, tiếp tục hay
          không ?
        </span>
      </Modal>
    </div>
  );
};

export default Navbar;


