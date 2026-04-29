import { MoreOutlined } from "@ant-design/icons";
import { Dropdown, Menu } from "antd";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useLocation } from "react-router-dom";

import { getRoutesAccess } from "../../../app/Functions/getRouteAccess";
import router, { routes } from "../../../router/routes";
import {
  setClaims,
  setIsBackgrouds,
} from "../../../store/reducers/claimsSlice";
import { getUserInfo } from "../../../store/selectors/Selectors";
import jwt from "../../../utils/jwt";

import { resetOrders } from "../../../modules/order/store/order";
import LogViewerButton from "../../common/LogViewer/LogViewerButton";
import VersionIndicator from "../../common/VersionIndicator/VersionIndicator";
import "./Navbar.css";

const Navbar = () => {
  const dispatch = useDispatch();
  const userInfo = useSelector(getUserInfo);
  const routeLocation = useLocation();
  const isMealTicketPage = routeLocation.pathname === "/meal-ticket";

  useEffect(() => {
    dispatch(setClaims(jwt.getClaims() || {}));
  }, [dispatch]);

  const handleLogout = async () => {
    await jwt.resetAccessToken();
    localStorage.removeItem("pos_activeTabId");
    localStorage.removeItem("pos_orders");
    router.navigate("/login");
    dispatch(resetOrders());
    dispatch(setClaims([]));
  };

  const handleSetBackground = () => {
    dispatch(setIsBackgrouds(true));
  };

  const handleRouteChange = async (data) => {
    const { flatRoutes } = await getRoutesAccess(routes);
    const validRoutes = ["", "/", "login", "transfer"];

    if (
      !validRoutes.includes(data?.pathname?.substring(1)) &&
      flatRoutes.findIndex(
        (item) => item.path === data?.pathname?.substring(1)
      ) < 0
    ) {
    }
  };

  useEffect(() => {
    handleRouteChange(routeLocation);
  }, [routeLocation]);

  const menuItems = [
    {
      key: "logout",
      label: <Link onClick={handleLogout}>Đăng Xuất</Link>,
      danger: true,
    },
  ];

  return (
    <div className="navbar">
      <div className="first_navbar_row_left">
        <div className="navbar_logo_functions">
          <div className="navbar_search_function">
            <h2 onClick={handleSetBackground} className="default_header_label">
              <img
                src="/logo-phenikaa-uni-02.png"
                alt="Phenikaa University"
              />
            </h2>
          </div>
        </div>

        <Menu
          mode="horizontal"
          className="navbar_routes"
          style={{
            lineHeight: "30px",
            border: "none",
            width: "100%",
            minWidth: "0",
            userSelect: "none",
          }}
        />
      </div>

      <div className="first_navbar_row_right flex gap-1">
        {!isMealTicketPage && (
          <div className="px-1 text-center flex items-center">
            <div className="navbar-controls-container">
              <LogViewerButton isInNavbar={true} />
              <VersionIndicator showDetails={true} size="small" />
            </div>
          </div>
        )}

        <div className="px-1 text-center flex full-name">
          <div className="primary_bold_text">{userInfo?.fullName || ""}</div>
        </div>

        <ul>
          <li>
            <div className="navbar_avatar_container">
              <Dropdown
                menu={{ items: menuItems }}
                overlayClassName="navbar_avatar_dropdown"
                placement="bottomRight"
                trigger={["click"]}
              >
                <MoreOutlined />
              </Dropdown>
            </div>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Navbar;
