import React from "react";
import "./MenuItem.css";

export default function MenuItem({ item, onAdd }) {
    return (
        <div className="menu-item" onClick={() => onAdd(item)}>
            <img src={`images/${item.image}`} alt={item.name} />
            <p>{item.name}</p>
            <p>{item.price.toLocaleString()}đ</p>
        </div>
    );
}
