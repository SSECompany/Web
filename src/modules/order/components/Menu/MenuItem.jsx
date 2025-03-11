export default function MenuItem({ item, onAdd }) {
    return (
        <div className="menu-item" onClick={() => onAdd(item)}>
            <img src={item.image ? `/images/${item.image}` : "/default-img.jpg"} alt={item.name} />
            <p>{item.name}</p>
            <p>{item.price.toLocaleString()}đ</p>
        </div>
    );
}