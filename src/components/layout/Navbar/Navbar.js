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
        } catch (error) {}
      }
    } else {
      // Real JWT - try to decode
      try {
        dispatch(setClaims(jwt.getClaims() || {}));
      } catch (error) {}
    }

    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUserFromStorage(JSON.parse(storedUser));
      } catch (error) {}
    }
  }, [dispatch]);

  const handleLogout = async () => {
    await jwt.resetAccessToken();
    localStorage.removeItem("ban_hang_activeTabId");
    localStorage.removeItem("ban_hang_orders");
    localStorage.clear();
    router.navigate("/login");
    dispatch(setClaims([]));
  };

  const handleSetBackground = () => {
    dispatch(setIsBackgrouds(true));
  };

  const handleRouteChange = (data) => {
    // Simplified route handling for pharmacy app
    const validRoutes = [
      "",
      "/",
      "login",
      "ban-hang", // Bán hàng
      "tra-hang", // Trả hàng
      "kho",
      "kho/nhat-hang", // Phiếu nhặt hàng
      "kho/nhat-hang/them-moi",
      "kho/nhap-kho", // Legacy - có thể xóa sau
      "kho/nhap-kho/them-moi", // Legacy - có thể xóa sau
      "kho/xuat-ban",
      "kho/xuat-dieu-chuyen",
      "kho/xuat-kho",
      "bao-cao/phieu-ban-le", // Báo cáo
      "bao-cao/ton-kho",
      "bao-cao/tong-hop-nhap-xuat-ton",
    ];

    const currentPath = data?.pathname?.substring(1);

    // Check if current path matches any valid route or pattern
    const isValidRoute =
      validRoutes.includes(currentPath) ||
      currentPath.match(/^kho\/nhat-hang\/chi-tiet\/[^/]+$/) || // Detail route pattern (allow alphanumeric IDs)
      currentPath.match(/^kho\/nhat-hang\/edit\/[^/]+$/) || // Edit route pattern
      currentPath.match(/^kho\/nhap-kho\/chi-tiet\/[^/]+$/); // Legacy detail route

    if (!isValidRoute) {
      // Redirect to Bán hàng if invalid route
      router.navigate("/ban-hang");
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
            items={[
              {
                key: "ban-hang",
                label: <Link to="/ban-hang">Bán hàng</Link>,
              },
              {
                key: "tra-hang",
                label: <Link to="/tra-hang">Trả hàng</Link>,
              },
              {
                key: "kho",
                label: <Link to="/kho">Kho</Link>,
              },
              {
                key: "bao-cao",
                label: "Báo cáo",
                children: [
                  {
                    key: "phieu-ban-le",
                    label: <Link to="/bao-cao/phieu-ban-le">Báo cáo phiếu bán lẻ</Link>,
                  },
                  {
                    key: "ton-kho",
                    label: <Link to="/bao-cao/ton-kho">Báo cáo tồn kho</Link>,
                  },
                  {
                    key: "tong-hop-nhap-xuat-ton",
                    label: <Link to="/bao-cao/tong-hop-nhap-xuat-ton">Tổng hợp nhập xuất tồn</Link>,
                  },
                ],
              },
            ]}
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
            <div className="primary_bold_text">
              {userInfo?.fullName || userInfo?.userName}
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
