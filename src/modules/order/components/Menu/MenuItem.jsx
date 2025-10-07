import "./MenuItem.css";

export default function MenuItem({ item, onAdd, isReadOnlyMode = false }) {
  const hasStock = item.tonDuTru > 0;
  const isLowStock = item.tonDuTru > 0 && item.tonDuTru <= 5;

  const getStockBadgeClass = () => {
    if (isLowStock) return "stock-badge-warning";
    return "";
  };

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
      {/* Chỉ hiển thị badge khi có tồn kho > 0 */}
      {hasStock && (
        <div className={`stock-badge ${getStockBadgeClass()}`}>
          Tồn: {item.tonDuTru}
        </div>
      )}

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
