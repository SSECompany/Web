import "./MenuItem.css";

export default function MenuItem({ item, onAdd, isReadOnlyMode = false }) {
  return (
    <div
      className={`menu-item ${isReadOnlyMode ? "menu-item-disabled" : ""}`}
      onClick={isReadOnlyMode ? undefined : () => onAdd(item)}
      style={
        isReadOnlyMode
          ? {
              opacity: 0.5,
              cursor: "not-allowed",
              pointerEvents: "none",
            }
          : {}
      }
    >
      <img
        src={
          item.image?.startsWith("data:image") ? item.image : `/default-img.jpg`
        }
        alt={item.name}
      />
      <div className="menu-item-overlay">
        <p>{item.name}</p>
        <p>{item.price.toLocaleString()}đ</p>
      </div>
    </div>
  );
}
