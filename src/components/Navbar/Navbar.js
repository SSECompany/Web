import { UilSearch } from "@iconscout/react-unicons";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import "./Navbar.css";

import { Dropdown, Input, Menu, Modal } from "antd";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getRoutesAccess } from "../../app/Functions/getRouteAccess";
import options__icon from "../../Icons/options__icon.svg";
import sse__logo from "../../Icons/sse__logo.svg";
import router, { routes } from "../../router/routes";
import { setClaims, setIsBackgrouds } from "../../store/reducers/claimsSlice";
import { getIsHideNav, getUserInfo } from "../../store/selectors/Selectors";
import jwt from "../../utils/jwt";
import Notify from "./Notify/Notify.jsx";

const Navbar = () => {
  const [resultsSearchModal, setResultsSearchModal] = useState([]);
  const [isOpenSearchModal, setOpenSearchModal] = useState(false);
  const [inputSearchModal, setInputSearchModal] = useState("");
  const [navbarSelectedKey, setnavbarSelectedKey] = useState("");
  const [navbarItems, setNavbarItems] = useState();
  const [searchFunctions, setSearchFunctions] = useState([]);
  const isHideNav = useSelector(getIsHideNav);
  const userInfo = useSelector(getUserInfo);
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
    console.log("routeLocation.pathname", routeLocation);
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

  const handleLoadNavbar = async () => {
    const navitems = { ...(await getRoutesAccess(routes)) };
    renderNavbar(navitems.nestedRoutes);
    setSearchFunctions((item) => {
      return (item = navitems.flatRoutes.filter(
        (item) =>
          (!item.children || !item?.children?.length > 0) && !item.isParent
      ));
    });
  };

  useEffect(() => {
    dispatch(setClaims(jwt.getClaims() ? jwt.getClaims() : {}));
    handleLoadNavbar();
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
      const category = `${query}`;
      return {
        value: result.label,
        label: (
          <div
            className="modal_search_results_item"
            onClick={() => handleSelectFuntion(result.path)}
          >
            <span>{result.label}</span>
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
  }, [routeLocation]);

  return (
    <div className={`navbar${isHideNav ? " hiden" : ""}`}>
      <div className="first_navbar_row_left">
        <div className="navbar_logo_functions">
          <img
            src={sse__logo}
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
            <span
              onClick={handleSetBackground}
              className="default_header_label"
            >
              DMS
            </span>
          </div>
        </div>

        <Menu
          mode="horizontal"
          items={navbarItems}
          className="navbar_routes"
          onSelect={handleNavbarClick}
          selectedKeys={navbarSelectedKey}
          style={{
            height: "30px",
            lineHeight: "30px",
            border: "none",
            width: "100%",
            minWidth: "0",
            userSelect: "none",
          }}
          overflowedIndicator={
            <span style={{ color: "#1677ff" }}>Mở rộng ...</span>
          }
        />
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
                <img
                  className="navbar_avatar"
                  src="https://i.ex-cdn.com/mgn.vn/files/content/2023/02/14/hutao-yelan-banner-revenue-1-1657.jpg"
                  alt=""
                />
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
              placeholder="Tìm kiếm..."
              value={inputSearchModal}
              onChange={(e) => {
                setInputSearchModal(e.target.value);
                handleSearchInModal(e.target.value);
              }}
              prefix={<UilSearch size="18" color="#1677ff" />}
            />
          </div>
          <div className="modal_search_results">
            {resultsSearchModal.length === 0 && !inputSearchModal && (
              <p>
                Tìm gì đó{" "}
                <i className="pi  pi-comments" style={{ fontSize: "26px" }}></i>
              </p>
            )}

            {resultsSearchModal.length === 0 && inputSearchModal && (
              <p>Không có chức năng tương ứng</p>
            )}

            {resultsSearchModal.map((item, index) => (
              <span key={index}>{item.label}</span>
            ))}
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
