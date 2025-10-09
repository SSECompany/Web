import { CloseOutlined, MinusOutlined, PlusOutlined } from "@ant-design/icons";
import { Checkbox, Input, Select } from "antd";
import React from "react";

const MealEntryRow = ({
  meal,
  index,
  timeOfDay,
  listDietCategory,
  foodListForSelection,
  handleDeleteMeal,
  handleModeChange,
  handleChange,
  handleQuantityChange,
  handleCollectMoneyChange,
  refetchDietCategory,
  refetchFoodList,
  firstMealInputRef,
  isAnotherMealSelected,
  isReadOnly = false, // Thêm prop để disable form khi xem đơn đã đặt
}) => {
  // Dùng foodListForSelection từ parent, NHƯNG thêm món hiện tại từ history nếu chưa có
  let availableFoods = [...(foodListForSelection || [])]; // Clone array để tránh mutate

  // Nếu meal có mealType mà không có trong foodListForSelection
  // Thì thêm vào để hiển thị trong dropdown (tránh bị mất value)
  if (meal.mealType) {
    const isInList = availableFoods.some(food => food.ma_mon === meal.mealType);
    if (!isInList) {
      // Thêm món hiện tại vào đầu danh sách
      // Nếu mealTypeName là mã món (chưa fetch API), dùng nó làm tên tạm thời
      availableFoods = [
        {
          ma_mon: meal.mealType,
          ten_mon: meal.mealTypeName || meal.mealType // Fallback to ma_mon if no ten_mon
        },
        ...availableFoods
      ];
    }
  }

  // Tương tự, thêm chế độ từ history vào listDietCategory nếu chưa có
  let availableDietCategories = listDietCategory || [];
  if (meal.mode && meal.modeName) {
    const isInList = availableDietCategories.some(cat => cat.ma_nh === meal.mode);
    if (!isInList) {
      availableDietCategories = [
        { ma_nh: meal.mode, ten_nh: meal.modeName },
        ...availableDietCategories
      ];
    }
  }

  // Determine shift name for display
  const shiftName =
    timeOfDay === "CA1"
      ? "Ca Sáng"
      : timeOfDay === "CA2"
      ? "Ca Trưa"
      : "Ca Chiều";

  return (
    <div className="meal-entry-wrapper" key={index}>
      {index === 0 && (
        <div
          style={{
            backgroundColor: "#f6ffed",
            padding: "8px",
            marginBottom: "12px",
            borderRadius: "4px",
            border: "1px solid #b7eb8f",
          }}
        >
          <p style={{ margin: 0, color: "#52c41a", fontWeight: "bold" }}>
            Lưu ý: Bạn cần nhập đủ món ăn cho cả 3 ca (Sáng, Trưa, Chiều) để
            hoàn thành
          </p>
        </div>
      )}
      <div className="meal-entry">
        <div className="mode-selection-group">
          <div className="mode-controls">
            <label
              htmlFor={`mode-${timeOfDay}-${index}`}
              className="mode-label"
            >
              <span style={{ color: "#ff4d4f", marginRight: "4px" }}>*</span>
              Chế độ - {shiftName}
            </label>
            {!isReadOnly && (
              <button
                className="mode-delete-button"
                onClick={() => handleDeleteMeal(timeOfDay, index)}
              >
                <CloseOutlined />
              </button>
            )}
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
            disabled={isReadOnly}
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
              disabled={isReadOnly || !meal.mode}
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
                isReadOnly || !meal.mealType || meal.quantity <= 1 || meal.collectMoney
              }
            >
              <MinusOutlined />
            </button>
            <span className="quantity-display">{meal.quantity}</span>
            <button
              onClick={() => handleQuantityChange(timeOfDay, index, 1)}
              className="quantity-button"
              disabled={isReadOnly || !meal.mealType || meal.collectMoney}
            >
              <PlusOutlined />
            </button>
          </div>
        </div>

        <div className="price-input-group">
          <div>
            <span className="price-label">Bệnh nhân</span>
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
                isReadOnly ||
                !meal.mealType || // Không có món ăn thì disable
                (!meal.collectMoney && isAnotherMealSelected) // Nếu đã có suất khác được chọn thì disable
              }
            />
          </div>
          <span className="price-display">
            {(meal.totalMoney || 0).toLocaleString()} đ
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
            disabled={isReadOnly || !meal.mealType}
          />
        </div>
      </div>
    </div>
  );
};

export default MealEntryRow;
