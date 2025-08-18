import { MoreOutlined } from "@ant-design/icons";
import { Dropdown, Menu } from "antd";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useLocation } from "react-router-dom";

import router from "../../../router/routes";
import {
  setClaims,
  setIsBackgrouds,
} from "../../../store/reducers/claimsSlice";
import { getUserInfo } from "../../../store/selectors/Selectors";
import jwt from "../../../utils/jwt";

import "./Navbar.css";

const Navbar = () => {
  const dispatch = useDispatch();
  const userInfo = useSelector(getUserInfo);
  const [userFromStorage, setUserFromStorage] = useState(null);
  const routeLocation = useLocation();

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const isSessionToken = token && token.startsWith("session.");

    if (isSessionToken) {
      const unitsResponse = localStorage.getItem("unitsResponse");
      const user = localStorage.getItem("user");

      if (unitsResponse && user) {
        try {
          const unitsData = JSON.parse(unitsResponse);
          const userData = JSON.parse(user);
          dispatch(
            setClaims({
              Name: userData.userName || userData.name || "",
              MA_DVCS: unitsData.unitId || "",
              DVCS: unitsData.unitName || "",
            })
          );
        } catch (error) {
          console.log("Error parsing session data:", error);
        }
      }
    } else {
      // Real JWT - try to decode
      try {
        dispatch(setClaims(jwt.getClaims() || {}));
      } catch (error) {
        console.log("Error decoding JWT:", error);
      }
    }

    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUserFromStorage(JSON.parse(storedUser));
      } catch (error) {
        console.log("Error parsing user data:", error);
      }
    }
  }, [dispatch]);

  const handleLogout = async () => {
    await jwt.resetAccessToken();
    localStorage.removeItem("pharmacy_activeTabId");
    localStorage.removeItem("pharmacy_orders");
    localStorage.clear();
    router.navigate("/login");
    dispatch(setClaims([]));
  };

  const handleSetBackground = () => {
    dispatch(setIsBackgrouds(true));
  };

  const handleRouteChange = (data) => {
    // Simplified route handling for pharmacy app
    const validRoutes = ["", "/", "login", "pos"];

    if (!validRoutes.includes(data?.pathname?.substring(1))) {
      // Redirect to POS if invalid route
      router.navigate("/pos");
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
    <>
      <div className="navbar">
        <div className="first_navbar_row_left">
          <div className="navbar_logo_functions">
            <div className="navbar_search_function">
              <h2
                onClick={handleSetBackground}
                className="default_header_label"
              >
                TAPMED
              </h2>
            </div>
          </div>

          <Menu
            mode="horizontal"
            className="navbar_routes"
            items={[]}
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
          <div className="px-1 text-center flex full-name">
            <div className="primary_bold_text">{userInfo?.fullName}</div>
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
    </>
  );
};

export default Navbar;
