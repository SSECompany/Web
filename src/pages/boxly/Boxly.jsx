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
      },
      {
        id: 2,
        label: "Phiếu xuất kho",
        path: "phieu-xuat-kho",
        colorClass: "boxly-btn-color-2",
      },
      {
        id: 3,
        label: "Phiếu nhập điều chuyển",
        path: "phieu-nhap-dieu-chuyen",
        colorClass: "boxly-btn-color-3",
      },
      {
        id: 4,
        label: "Phiếu xuất điều chuyển",
        path: "phieu-xuat-dieu-chuyen",
        colorClass: "boxly-btn-color-4",
      },
    ],
    []
  );

  // Kiểm tra xem có đang ở route con nào không
  const isSubRoute = location.pathname !== "/boxly";

  return (
    <div className="boxly-container">
      {!isSubRoute && (
        <div className="boxly-button-grid">
          {buttons.map((button) => (
            <button
              key={button.id}
              className={`boxly-button-tile ${button.colorClass}`}
              onClick={() => navigate(button.path)}
            >
              {button.label}
            </button>
          ))}
        </div>
      )}
      <Outlet />
    </div>
  );
};

export default React.memo(Boxly);
