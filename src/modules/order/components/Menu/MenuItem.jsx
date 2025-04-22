import "./MenuItem.css";

export default function MenuItem({ item, onAdd }) {
    return (
        <div className="menu-item" onClick={() => onAdd(item)}>
            <img src={item.image?.startsWith('data:image') ? item.image : `/default-img.jpg`} alt={item.name} />
            <div className="menu-item-overlay">
                <p>{item.name}</p>
                <p>{item.price.toLocaleString()}đ</p>
            </div>
        </div>
    );
}