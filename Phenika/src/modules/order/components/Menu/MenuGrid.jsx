import React from "react";
import { useSelector } from "react-redux";
import "./MenuGrid.css";
import MenuItem from "./MenuItem";

export default function MenuGrid({ onAdd, isReadOnlyMode = false }) {
  const menuItems = useSelector((state) => state.orders.menuItems);

  return (
    <div className="menu-grid">
      {Array.isArray(menuItems) &&
        menuItems.length > 0 &&
        menuItems.map((item) => {
          return (
            <MenuItem
              key={item.value}
              item={{
                name: item.label,
                price: item.gia,
                unit: item.dvt,
                id: item.value,
                image: item.image,
                tonDuTru: item.tonDuTru || 0,
              }}
              onAdd={onAdd}
              isReadOnlyMode={isReadOnlyMode}
            />
          );
        })}
    </div>
  );
}
