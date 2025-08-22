import { Modal, Radio, Space, Spin } from "antd";
import dayjs from "dayjs";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { multipleTablePutApi } from "../../../../../api";
import { updateProductMeal } from "../../../store/order";
import "./SelectMealModal.css";

export default function SelectMealModal({
  isVisible,
  onClose,
  orderIndex,
  item,
}) {
  const [selectedMeal, setSelectedMeal] = useState("");
  const [mealOptions, setMealOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const { id, unitId } = useSelector(
    (state) => state.claimsReducer.userInfo || {}
  );

  // Khởi tạo selectedMeal khi modal mở
  useEffect(() => {
    if (isVisible && item?.selected_meal) {
      setSelectedMeal(item.selected_meal.value);
    } else if (isVisible) {
      setSelectedMeal("");
    }
  }, [isVisible, item?.selected_meal]);

  // Gọi API để lấy danh sách món ăn khi modal mở
  useEffect(() => {
    if (isVisible) {
      fetchMealOptions();
    }
  }, [isVisible]);

  const fetchMealOptions = async () => {
    setLoading(true);
    try {
      const res = await multipleTablePutApi({
        store: "api_getListFoodMealByPost",
        param: {
          searchValue: "",
          ngay_an: dayjs().format("YYYY-MM-DD HH:mm:ss"), // Format: '2025-08-21 11:30:00'
          pageIndex: 1,
          pageSize: 100,
        },
        data: {},
      });

      if (res?.responseModel?.isSucceded && res?.listObject?.[0]) {
        const foodList = res.listObject[0];
        // Lọc ra các món ăn phù hợp (có thể tùy chỉnh logic lọc)
        const options = foodList
          .filter((food) => food.ma_mon && food.ten_mon && food.gia_ban > 0)
          .map((food) => ({
            value: food.ma_mon,
            label: food.ten_mon,
            price: food.gia_ban,
            description: food.ma_mon_phu || "",
          }));
        setMealOptions(options);
      } else {
        console.error("API response error:", res?.responseModel?.message);
        // Fallback to default options if API fails
        setMealOptions([
          { value: "COMCHAY", label: "Cơm chay", price: 40000 },
          { value: "COMCHIEN02", label: "Cơm chiên hải sản", price: 60000 },
          { value: "COMCHIEN01", label: "Cơm chiên thập cẩm", price: 50000 },
        ]);
      }
    } catch (error) {
      console.error("Error fetching meal options:", error);
      // Fallback to default options if API fails
      setMealOptions([
        { value: "COMCHAY", label: "Cơm chay", price: 40000 },
        { value: "COMCHIEN02", label: "Cơm chiên hải sản", price: 60000 },
        { value: "COMCHIEN01", label: "Cơm chiên thập cẩm", price: 50000 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleOk = () => {
    if (selectedMeal) {
      const selectedOption = mealOptions.find(
        (option) => option.value === selectedMeal
      );
      dispatch(
        updateProductMeal({
          index: orderIndex,
          mealValue: selectedMeal,
          mealLabel: selectedOption.label,
          mealDescription: selectedOption.description,
        })
      );
    }
    onClose();
    setSelectedMeal("");
  };

  const handleCancel = () => {
    onClose();
    setSelectedMeal("");
  };

  return (
    <Modal
      title="Chọn món suất"
      open={isVisible}
      onOk={handleOk}
      onCancel={handleCancel}
      okText="Xác nhận"
      cancelText="Hủy"
      okButtonProps={{ disabled: !selectedMeal || loading }}
    >
      <div className="select-meal-content">
        <p>
          Vui lòng chọn món suất cho <strong>{item?.ten_vt}</strong>:
        </p>

        {loading ? (
          <div style={{ textAlign: "center", padding: "20px" }}>
            <Spin size="large" />
            <p style={{ marginTop: "10px", color: "#666" }}>
              Đang tải danh sách món ăn...
            </p>
          </div>
        ) : (
          <Radio.Group
            value={selectedMeal}
            onChange={(e) => setSelectedMeal(e.target.value)}
            className="meal-options"
          >
            <Space direction="vertical" size="middle" style={{ width: "100%" }}>
              {mealOptions.map((option) => (
                <Radio
                  key={option.value}
                  value={option.value}
                  className="meal-option"
                >
                  <div className="meal-option-content">
                    <div className="meal-info">
                      <span className="meal-label">{option.label}</span>
                      {option.description && (
                        <span className="meal-description">
                          {option.description}
                        </span>
                      )}
                    </div>
                  </div>
                </Radio>
              ))}
            </Space>
          </Radio.Group>
        )}
      </div>
    </Modal>
  );
}
