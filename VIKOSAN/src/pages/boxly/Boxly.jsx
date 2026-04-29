import {
  HomeOutlined,
  InboxOutlined,
  SendOutlined,
  ShoppingCartOutlined,
} from "@ant-design/icons";
import React, { useMemo } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import "./Boxly.css";

const Boxly = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const buttons = useMemo(
    () => [
      {
        id: 1,
        label: "Phiếu nhập kho",
        path: "phieu-nhap-kho",
        colorClass: "boxly-btn-color-1",
        icon: <InboxOutlined className="boxly-button-icon" />,
        description: "Quản lý nhập kho hàng hóa",
      },
      {
        id: 2,
        label: "Phiếu xuất kho bán hàng",
        path: "phieu-xuat-kho-ban-hang",
        colorClass: "boxly-btn-color-2",
        icon: <ShoppingCartOutlined className="boxly-button-icon" />,
        description: "Quản lý xuất kho bán hàng",
      },
      {
        id: 3,
        label: "Phiếu xuất điều chuyển",
        path: "phieu-xuat-dieu-chuyen",
        colorClass: "boxly-btn-color-3",
        icon: <SendOutlined className="boxly-button-icon" />,
        description: "Quản lý xuất kho điều chuyển",
      },
      {
        id: 4,
        label: "Phiếu xuất kho",
        path: "phieu-xuat-kho",
        colorClass: "boxly-btn-color-4",
        icon: <HomeOutlined className="boxly-button-icon" />,
        description: "Quản lý xuất kho",
      },
    ],
    []
  );

  const isSubRoute = location.pathname !== "/boxly";

  return (
    <div className="boxly-container">
      {!isSubRoute && (
        <div className="boxly-content">
          <div className="boxly-header">
            <h1 className="boxly-title">Quản lý kho</h1>
            <p className="boxly-subtitle">
              Vui lòng chọn phiếu bạn muốn thực hiện
            </p>
          </div>
          <div className="boxly-button-grid">
            {buttons.map((button) => (
              <button
                key={button.id}
                className={`boxly-button-tile ${button.colorClass}`}
                onClick={() => navigate(button.path)}
              >
                <div className="boxly-button-content">
                  {button.icon}
                  <span className="boxly-button-label">{button.label}</span>
                  <span className="boxly-button-description">
                    {button.description}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
      <Outlet />
    </div>
  );
};

export default React.memo(Boxly);
