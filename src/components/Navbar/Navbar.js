import { DownOutlined } from "@ant-design/icons";
import { Dropdown, Menu, Modal } from "antd";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { Link, useLocation } from "react-router-dom";
import { getRoutesAccess } from "../../app/Functions/getRouteAccess";
import router, { routes } from "../../router/routes";
import { setClaims, setIsBackgrouds } from "../../store/reducers/claimsSlice";
import jwt from "../../utils/jwt";
import "./Navbar.css";

const Navbar = () => {

  const [isShowAlert, setIsShowAlert] = useState(false);

  const routeLocation = useLocation();


  const dispatch = useDispatch();

  const handleLogout = async () => {
    await jwt.resetAccessToken();
    router.navigate("/login");
    dispatch(setClaims([]));
  };

  useEffect(() => {
    dispatch(setClaims(jwt.getClaims() ? jwt.getClaims() : {}));
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
      key: "4",
      label: <Link onClick={handleLogout}>Logout</Link>,
      danger: true,
    },
  ];




  const handleSetBackground = () => {
    dispatch(setIsBackgrouds(true));
  };

  const handleRouteChange = async (data) => {
    const { flatRoutes } = await getRoutesAccess(routes);
    const validRoutes = [
      "/",
      "",
      "login",
      "transfer",
    ];
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

  return (
    <div className={`navbar`}>
      <div className="first_navbar_row_left">
        <div className="navbar_logo_functions">

          <div className="navbar_search_function">
            <span
              onClick={handleSetBackground}
              className="default_header_label"
            >
              PHENIKAA
            </span>
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
        <div className="px-1 text-center">
          <div className="primary_bold_text">{"huudat"}</div>
          <div className="primary_text_color">
            <i className="pi pi-map-marker mr-1"></i>
            {"cau giay"}
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
        </ul>
      </div>

      <Modal
        open={isShowAlert}
        onCancel={() => {
          setIsShowAlert(false);
        }}
        onOk={() => {
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
