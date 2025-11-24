import { EllipsisOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import { Button, Dropdown, Menu, message } from "antd";
import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { formatNumber } from "../../../../app/hook/dataFormatHelper";
import {
  applyVoucherToProduct,
  updateProductPrice,
  updateProductQuantity,
} from "../../store/order";
import "./OrderItem.css";
import AddNoteAndExtrasModal from "./modal/AddNoteAndExtrasModal";
import DiscountModal from "./modal/DiscountModal";
import SelectMealModal from "./modal/SelectMealModal";

export default function OrderItem({
  item,
  index,
  onUpdateQuantity,
  onDeleteItem,
  onAddNote,
  isReadOnlyMode = false,
}) {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isSelectMealModalVisible, setIsSelectMealModalVisible] =
    useState(false);
  const [isDiscountModalVisible, setIsDiscountModalVisible] = useState(false);
  const [priceInput, setPriceInput] = useState("");
  const dispatch = useDispatch();
  const token = localStorage.getItem("access_token");

  // Kiểm tra tồn kho
  const checkInventory = (newQuantity) => {
    if (item.selected_meal && item.selected_meal.tonDuTru !== undefined) {
      const availableStock = parseInt(item.selected_meal.tonDuTru) || 0;
      return newQuantity <= availableStock;
    }
    return true; // Không có thông tin tồn kho thì cho phép
  };

  // Lấy số lượng tồn kho hiện tại
  const getAvailableStock = () => {
    if (item.selected_meal && item.selected_meal.tonDuTru !== undefined) {
      return parseInt(item.selected_meal.tonDuTru) || 0;
    }
    return null;
  };

  useEffect(() => {
    // Hiển thị giá sau giảm giá (thanh_tien) thay vì giá gốc (don_gia)
    setPriceInput(
      item.thanh_tien?.toString() || item.don_gia?.toString() || ""
    );
  }, [item.don_gia, item.thanh_tien, item.selected_meal]);

  const handleAddNote = () => {
    onAddNote();
    setIsModalVisible(true);
  };

  const handleApplyVoucher = () => {
    dispatch(updateProductPrice({ index, newPrice: 0 }));
    dispatch(applyVoucherToProduct({ index }));
    setPriceInput("0");
  };

  const handleSelectMeal = () => {
    setIsSelectMealModalVisible(true);
  };

  const handleOpenDiscountModal = () => {
    setIsDiscountModalVisible(true);
  };

  const handleUpdateQuantity = (increment) => {
    const currentQuantity = parseInt(item.so_luong);
    const newQuantity = Math.max(1, currentQuantity + increment);

    // Kiểm tra tồn kho trước khi update
    if (!checkInventory(newQuantity)) {
      const availableStock = getAvailableStock();
      message.warning(
        `Không thể tăng số lượng! Tồn kho hiện tại: ${availableStock} suất`
      );
      return;
    }

    // Gọi hàm update quantity từ props hoặc dispatch trực tiếp
    if (onUpdateQuantity) {
      onUpdateQuantity(index, increment);
    } else {
      // Fallback: dispatch trực tiếp nếu không có onUpdateQuantity
      dispatch(
        updateProductQuantity({
          internalId: null, // Sẽ được xử lý trong reducer
          productIndex: index,
          increment: increment,
          inventoryCheck: true,
        })
      );
    }
  };

  // Kiểm tra xem item có phải là "Cơm Suất tối" hoặc "Cơm Suất trưa" không
  const isMealSetItem = item.ma_vt === "COM02" || item.ma_vt === "COM01";

  const menu = (
    <Menu>
      <Menu.Item key="add-note" onClick={handleAddNote}>
        Ghi chú/Món thêm
      </Menu.Item>
      {isMealSetItem && (
        <Menu.Item key="select-meal" onClick={handleSelectMeal}>
          Chọn món suất
        </Menu.Item>
      )}
      <Menu.Item key="apply-discount" onClick={handleOpenDiscountModal}>
        Giảm giá
      </Menu.Item>
      {token && (
        <Menu.Item key="apply-voucher" onClick={handleApplyVoucher}>
          Áp dụng voucher
        </Menu.Item>
      )}
      <Menu.Item key="delete-item" danger onClick={() => onDeleteItem(index)}>
        Xóa món
      </Menu.Item>
    </Menu>
  );

  return (
    <>
      <li className="order-item">
        <div className="order-item-main">
          <span className="order-item-index">{index + 1}.</span>
          <span className="order-item-name">
            {item.selected_meal ? item.selected_meal.label : item.ten_vt}
          </span>
          <div className="quantity-controls">
            <Button
              onClick={() => handleUpdateQuantity(-1)}
              disabled={item.so_luong <= 1 || isReadOnlyMode}
              style={
                isReadOnlyMode ? { opacity: 0.5, cursor: "not-allowed" } : {}
              }
            >
              -
            </Button>
            <span>{item.so_luong}</span>
            <Button
              onClick={() => handleUpdateQuantity(1)}
              disabled={isReadOnlyMode}
              style={
                isReadOnlyMode ? { opacity: 0.5, cursor: "not-allowed" } : {}
              }
            >
              +
            </Button>
          </div>
          <span
            className="order-item-price-input"
            style={{
              width: "90px",
              textAlign: "right",
              color: "#28a745",
              display: "inline-block",
            }}
          >
            {formatNumber(priceInput)}
            {/* Hiển thị giá gốc bị gạch ngang khi có giảm giá */}
            {parseFloat(item.tl_ck || 0) > 0 ||
            parseFloat(item.ck_nt || 0) > 0 ? (
              <div
                style={{
                  fontSize: "12px",
                  color: "#999",
                  textDecoration: "line-through",
                  marginTop: "2px",
                }}
              >
                {formatNumber(item.don_gia || 0)}
              </div>
            ) : null}
          </span>
          <Dropdown
            overlay={menu}
            trigger={["click"]}
            placement="bottomRight"
            disabled={isReadOnlyMode}
          >
            <Button
              type="text"
              icon={<EllipsisOutlined style={{ fontSize: "20px" }} />}
              disabled={isReadOnlyMode}
              style={
                isReadOnlyMode ? { opacity: 0.5, cursor: "not-allowed" } : {}
              }
            />
          </Dropdown>
        </div>

        {item.extras && item.extras.length > 0 && (
          <ul className="order-item-extras">
            {item.extras.map((extra) => {
              return (
                <li key={extra.ma_vt_more} className="order-extra-item">
                  <span className="extra-name">+ {extra.ten_vt}</span>
                  <span className="extra-quantity">
                    {extra.quantity || extra.so_luong}
                  </span>
                  <span className="extra-price">
                    {formatNumber(extra.gia || extra.don_gia)} đ
                  </span>
                </li>
              );
            })}
          </ul>
        )}
        {item.selected_meal && (
          <div className="order-item-selected-meal">
            Ghi chú: <strong>{item.ten_vt}</strong>
            {item.selected_meal.description && (
              <div className="meal-description-small">
                {item.selected_meal.description}
              </div>
            )}
            {/* Chỉ hiển thị cảnh báo khi vượt quá tồn kho */}
            {item.selected_meal.tonDuTru !== undefined &&
              parseInt(item.so_luong) >
                parseInt(item.selected_meal.tonDuTru) && (
                <div className="inventory-warning-info">
                  <ExclamationCircleOutlined className="inventory-warning-icon" />
                  <span className="inventory-warning-text">
                    Cảnh báo: Đã vượt quá tồn kho ({item.selected_meal.tonDuTru}{" "}
                    suất)
                  </span>
                </div>
              )}
          </div>
        )}
        {item.ghi_chu && !item.selected_meal && (
          <div className="order-item-note">Ghi chú: {item.ghi_chu}</div>
        )}
      </li>

      <AddNoteAndExtrasModal
        isVisible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        orderIndex={index}
      />
      <SelectMealModal
        isVisible={isSelectMealModalVisible}
        onClose={() => setIsSelectMealModalVisible(false)}
        orderIndex={index}
        item={item}
      />
      <DiscountModal
        isVisible={isDiscountModalVisible}
        onClose={() => setIsDiscountModalVisible(false)}
        orderIndex={index}
        item={item}
      />
    </>
  );
}
