import { CloseOutlined, MinusOutlined, PlusOutlined } from "@ant-design/icons";
import { Checkbox, Input, Select } from "antd";
import React from "react";

const MealEntryRow = ({
  meal,
  index,
  timeOfDay,
  shiftName,
  listDietCategory,
  foodListForSelection,
  handleDeleteMeal,
  handleModeChange,
  handleChange,
  handleQuantityChange,
  handleCollectMoneyChange,
  showVipCheckbox,
  vipChecked,
  vipQuota,
  vipSelectedCount,
  handleVipChange,
  refetchDietCategory,
  refetchFoodList,
  firstMealInputRef,
  isAnotherMealSelected,
  hasMenuVip,
}) => {
  // Dùng foodListForSelection từ parent, NHƯNG thêm món hiện tại từ history nếu chưa có
  let availableFoods = [...(foodListForSelection || [])]; // Clone array để tránh mutate

  // Nếu meal có mealType mà không có trong foodListForSelection
  // Thì thêm vào để hiển thị trong dropdown (tránh bị mất value)
  if (meal.mealType) {
    const isInList = availableFoods.some(
      (food) => food.ma_mon === meal.mealType
    );
    if (!isInList) {
      // Thêm món hiện tại vào đầu danh sách
      // Nếu mealTypeName là mã món (chưa fetch API), dùng nó làm tên tạm thời
      availableFoods = [
        {
          ma_mon: meal.mealType,
          ten_mon: meal.mealTypeName || meal.mealType, // Fallback to ma_mon if no ten_mon
        },
        ...availableFoods,
      ];
    }
  }

  // Tương tự, thêm chế độ từ history vào listDietCategory nếu chưa có
  let availableDietCategories = listDietCategory || [];
  if (meal.mode && meal.modeName) {
    const isInList = availableDietCategories.some(
      (cat) => cat.ma_nh === meal.mode
    );
    if (!isInList) {
      availableDietCategories = [
        { ma_nh: meal.mode, ten_nh: meal.modeName },
        ...availableDietCategories,
      ];
    }
  }

  return (
    <div className="meal-entry-wrapper" key={index}>
      <div className="meal-entry">
        <div className="mode-selection-group">
          <div className="mode-controls">
            <label
              htmlFor={`mode-${timeOfDay}-${index}`}
              className="mode-label"
            >
              <span style={{ color: "#ff4d4f", marginRight: "4px" }}>*</span>
              Chế độ - {shiftName || timeOfDay}
            </label>
            <button
              className="mode-delete-button"
              onClick={() => handleDeleteMeal(timeOfDay, index)}
            >
              <CloseOutlined />
            </button>
          </div>
          <Select
            id={`mode-${timeOfDay}-${index}`}
            value={meal.mode}
            onChange={(value) => handleModeChange(timeOfDay, index, value)}
            onDropdownVisibleChange={(open) => {
              // Fetch api_getListDietCategory khi dropdown mở
              if (open && refetchDietCategory) {
                refetchDietCategory(timeOfDay);
              }
            }}
            className="mode-dropdown"
          >
            <Select.Option value="">Chọn chế độ</Select.Option>
            {availableDietCategories.map((category) => (
              <Select.Option key={category.ma_nh} value={category.ma_nh}>
                {category.ten_nh}
              </Select.Option>
            ))}
          </Select>
        </div>

        <div className="meal-selection-group">
          <div className="meal-type-selection">
            <Select
              value={meal.mealType || ""}
              onChange={(value) =>
                handleChange(timeOfDay, index, {
                  target: { name: "mealType", value },
                })
              }
              onDropdownVisibleChange={(open) => {
                // Call API khi dropdown mở
                if (open && meal.mode && refetchFoodList) {
                  refetchFoodList(timeOfDay, meal.mode);
                }
              }}
              placeholder="Chọn món ăn"
              disabled={!meal.mode}
            >
              <Select.Option value="">Chọn món ăn</Select.Option>
              {availableFoods.map((food) => (
                <Select.Option key={food.ma_mon} value={food.ma_mon}>
                  {food.ten_mon}
                </Select.Option>
              ))}
            </Select>
            {!meal.mode && (
              <div style={{ color: "#ff4d4f", fontSize: 12, marginTop: 4 }}>
                Vui lòng chọn chế độ trước
              </div>
            )}
            {meal.errors?.mealType && (
              <div style={{ color: "red", fontSize: 12, marginTop: 4 }}>
                {meal.errors.mealType}
              </div>
            )}
            {meal.mealType &&
              (() => {
                const selectedFood = availableFoods.find(
                  (food) => food.ma_mon === meal.mealType
                );
                if (selectedFood?.ma_mon_phu) {
                  return (
                    <div
                      style={{ color: "#595959", fontSize: 12, marginTop: 4 }}
                    >
                      {selectedFood.ma_mon_phu}
                    </div>
                  );
                }
                return null;
              })()}
          </div>
          <div className="meal-quantity-controls">
            <button
              onClick={() => handleQuantityChange(timeOfDay, index, -1)}
              className="quantity-button"
              disabled={
                !meal.mealType || 
                meal.quantity <= 1 || 
                meal.collectMoney
              }
            >
              <MinusOutlined />
            </button>
            <span className="quantity-display">{meal.quantity}</span>
            <button
              onClick={() => handleQuantityChange(timeOfDay, index, 1)}
              className="quantity-button"
              disabled={
                !meal.mealType || 
                meal.collectMoney
              }
            >
              <PlusOutlined />
            </button>
          </div>
        </div>

        <div className="price-input-group">
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ display: "flex", alignItems: "center" }}>
              <span className="price-label">Người bệnh</span>
              <Checkbox
                checked={meal.collectMoney || false}
                onChange={(e) => {
                  handleCollectMoneyChange(e);
                  if (e.target.checked) {
                    handleQuantityChange(timeOfDay, index, 1 - meal.quantity); // Set quantity = 1 immediately
                  }
                }}
                className="price-checkbox"
                disabled={
                  !meal.mealType || // Không có món ăn thì disable
                  (!meal.collectMoney && isAnotherMealSelected) || // Nếu đã có suất khác được chọn thì disable
                  !!vipChecked // Disable nếu đã tích VIP
                }
              />
            </div>
            {showVipCheckbox && (
              <div style={{ display: "flex", alignItems: "center" }}>
                <span className="price-label">{hasMenuVip ? "Người bệnh VIP" : "Người nhà VIP"}</span>
                <Checkbox
                  checked={!!vipChecked}
                  onChange={handleVipChange}
                  className="price-checkbox"
                  disabled={
                    !meal.mealType ||
                    (!vipChecked && vipSelectedCount >= vipQuota) ||
                    meal.collectMoney // Disable nếu đã tích "Người bệnh"
                  }
                />
                <span style={{ fontSize: 12, color: "#8c8c8c", marginLeft: "4px" }}>
                  {`(${vipSelectedCount}/${vipQuota})`}
                </span>
              </div>
            )}
          </div>
          <span className="price-display">
            {Number(meal.totalMoney || 0).toLocaleString()} đ
          </span>
        </div>

        {/* Notes */}
        <div className="notes-input-group">
          <label htmlFor={`note-${timeOfDay}-${index}`} className="note-label">
            Ghi chú
          </label>
          <Input.TextArea
            id={`note-${timeOfDay}-${index}`}
            name="note"
            ref={(el) => {
              if (index === 0 && el) firstMealInputRef.current = el;
            }}
            value={meal.note || ""}
            onChange={(e) => handleChange(timeOfDay, index, e)}
            placeholder="Nhập ghi chú"
            className="note-input"
            disabled={!meal.mealType}
          />
        </div>
      </div>
    </div>
  );
};

export default MealEntryRow;
