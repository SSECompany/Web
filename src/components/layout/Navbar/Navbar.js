import { MoreOutlined, ReloadOutlined } from "@ant-design/icons";
import { Dropdown, Menu, Tooltip } from "antd";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useLocation } from "react-router-dom";

import { getRoutesAccess } from "../../../app/Functions/getRouteAccess";
import useVersionCheck from "../../../hooks/useVersionCheck";
import router, { routes } from "../../../router/routes";
import {
    setClaims,
    setIsBackgrouds,
} from "../../../store/reducers/claimsSlice";
import { getUserInfo } from "../../../store/selectors/Selectors";
import jwt from "../../../utils/jwt";
import TokenTimer from "../../common/TokenTimer/TokenTimer";

import "./Navbar.css";

const Navbar = () => {
  const dispatch = useDispatch();
  const userInfo = useSelector(getUserInfo);
  const [userFromStorage, setUserFromStorage] = useState(null);
  const routeLocation = useLocation();
  const { currentVersion, hasNewVersion, forceReload } = useVersionCheck();

  useEffect(() => {
    dispatch(setClaims(jwt.getClaims() || {}));
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUserFromStorage(JSON.parse(storedUser));
    }
  }, [dispatch]);

  const handleLogout = async () => {
    await jwt.resetAccessToken();
    localStorage.removeItem("pos_activeTabId");
    localStorage.removeItem("pos_orders");
    localStorage.clear();
    router.navigate("/login");
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
    <>
      <TokenTimer />
      <div className="navbar">
        <div className="first_navbar_row_left">
          <div className="navbar_logo_functions">
            <div className="navbar_search_function">
              <h2
                onClick={handleSetBackground}
                className="default_header_label"
              >
                VIKOSAN
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
          <Tooltip
            title={
              hasNewVersion
                ? "Có phiên bản mới! Click để cập nhật"
                : `Phiên bản hiện tại: v${currentVersion?.version || ""}`
            }
          >
            <div
              onClick={hasNewVersion ? forceReload : undefined}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "0 12px",
                fontSize: "13px",
                cursor: hasNewVersion ? "pointer" : "default",
                transition: "all 0.3s",
              }}
            >
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: hasNewVersion ? "#1890ff" : "#8c8c8c",
                  transition: "background 0.3s",
                }}
              />
              <span
                style={{
                  color: hasNewVersion ? "#1890ff" : "#8c8c8c",
                  fontWeight: 500,
                  transition: "color 0.3s",
                }}
              >
                v{currentVersion?.version || "—"}
              </span>
              {hasNewVersion && (
                <span
                  style={{
                    color: "#1890ff",
                    fontSize: "12px",
                    fontWeight: 400,
                  }}
                >
                  (Có cập nhật mới)
                </span>
              )}
              {hasNewVersion && (
                <ReloadOutlined
                  spin
                  style={{
                    fontSize: "14px",
                    color: "#1890ff",
                  }}
                />
              )}
            </div>
          </Tooltip>

          <div className="px-1 text-center flex full-name">
            <div className="primary_bold_text">
              {userFromStorage?.fullName || ""}
            </div>
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
