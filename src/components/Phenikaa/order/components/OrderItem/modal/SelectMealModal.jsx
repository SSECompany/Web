import { Modal, Radio, Space, Spin, Tabs } from "antd";
import dayjs from "dayjs";
import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { multipleTablePutApi } from '../../../API/phenikaaApi';
import { updateProductMeal } from "../../../Store/order";
import "./SelectMealModal.css";

export default function SelectMealModal({
  isVisible,
  onClose,
  orderIndex,
  item,
}) {
  const [selectedMeal, setSelectedMeal] = useState("");
  const [selectedShift, setSelectedShift] = useState("sang");
  const [mealOptions, setMealOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();

  // Định nghĩa các ca bọc
  const mealShifts = [
    { key: "sang", label: "Ca Sáng", code: "CA1" },
    { key: "trua", label: "Ca Trưa", code: "CA2" },
    { key: "toi", label: "Ca Tối", code: "CA3" },
  ];

  // Kiểm tra món ăn có ca cố định không
  const getFixedShift = (itemCode) => {
    if (itemCode === "COM01") return "trua"; // Cơm suất trưa -> Ca Trưa (COM01)
    if (itemCode === "COM02") return "toi"; // Cơm suất tối -> Ca Tối (COM02)
    return null;
  };

  const fixedShift = getFixedShift(item?.ma_vt);
  const isFixedShiftItem = fixedShift !== null;

  useEffect(() => {
    if (isVisible && item?.selected_meal) {
      setSelectedMeal(item.selected_meal.value);
      // Nếu có thông tin ca bọc từ item, set ca bọc đó
      if (item.selected_meal.shift) {
        // Tìm key từ code (CA1 -> sang, CA2 -> trua, CA3 -> toi)
        const shiftKey =
          mealShifts.find((shift) => shift.code === item.selected_meal.shift)
            ?.key || "sang";
        setSelectedShift(shiftKey);
      }
    } else if (isVisible) {
      setSelectedMeal("");
      // Nếu là món có ca cố định, tự động set ca đó
      if (isFixedShiftItem) {
        setSelectedShift(fixedShift);
      } else {
        setSelectedShift("sang");
      }
    }
  }, [isVisible, item?.selected_meal, isFixedShiftItem, fixedShift]);

  useEffect(() => {
    if (isVisible) {
      fetchMealOptions();
    }
  }, [isVisible, selectedShift]);

  const fetchMealOptions = async () => {
    setLoading(true);
    try {
      // Tạo thời gian dựa trên ca bọc được chọn
      const currentDate = dayjs().format("YYYY-MM-DD");
      let mealTime;

      switch (selectedShift) {
        case "sang":
          mealTime = `${currentDate} 08:00:00`;
          break;
        case "trua":
          mealTime = `${currentDate} 12:00:00`;
          break;
        case "toi":
          mealTime = `${currentDate} 18:00:00`;
          break;
        default:
          mealTime = dayjs().format("YYYY-MM-DD HH:mm:ss");
      }

      const res = await multipleTablePutApi({
        store: "api_getListFoodMealByPost",
        param: {
          searchValue: "",
          ngay_an: mealTime,
          pageIndex: 1,
          pageSize: 100,
        },
        data: {},
      });

      if (res?.responseModel?.isSucceded && res?.listObject?.[0]) {
        const foodList = res.listObject[0];
        const options = foodList
          .filter((food) => food.ma_mon && food.ten_mon)
          .map((food) => ({
            value: food.ma_mon,
            label: food.ten_mon,
            price: food.gia_ban,
            description: food.ma_mon_phu || "",
          }));
        setMealOptions(options);
      } else {
        console.error("API response error:", res?.responseModel?.message);
        setMealOptions([]);
      }
    } catch (error) {
      console.error("Error fetching meal options:", error);
      setMealOptions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOk = () => {
    if (selectedMeal) {
      const selectedOption = mealOptions.find(
        (option) => option.value === selectedMeal
      );
      const selectedShiftInfo = mealShifts.find(
        (shift) => shift.key === selectedShift
      );
      dispatch(
        updateProductMeal({
          index: orderIndex,
          mealValue: selectedMeal,
          mealLabel: selectedOption.label,
          mealDescription: selectedOption.description,
          mealShift: selectedShiftInfo.code,
          mealShiftLabel: selectedShiftInfo.label,
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

  const handleShiftChange = (key) => {
    // Không cho phép thay đổi ca nếu là món có ca cố định
    if (isFixedShiftItem) {
      return;
    }
    setSelectedShift(key);
    setSelectedMeal(""); // Reset món ăn khi chuyển ca bọc
  };

  const tabItems = mealShifts.map((shift) => ({
    key: shift.key,
    label: shift.label,
    children: (
      <div className="meal-options-container">
        {loading ? (
          <div style={{ textAlign: "center", padding: "20px" }}>
            <Spin size="large" />
            <p style={{ marginTop: "10px", color: "#666" }}>
              Đang tải danh sách món ăn ca {shift.label.toLowerCase()}...
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
    ),
  }));

  return (
    <Modal
      title="Chọn món suất"
      open={isVisible}
      onOk={handleOk}
      onCancel={handleCancel}
      okText="Xác nhận"
      cancelText="Hủy"
      okButtonProps={{ disabled: !selectedMeal || loading }}
      width={600}
    >
      <div className="select-meal-content">
        <p>
          {isFixedShiftItem
            ? `Vui lòng chọn món suất cho ${item?.ten_vt}:`
            : `Vui lòng chọn ca bọc và món suất cho ${item?.ten_vt}:`}
        </p>

        {isFixedShiftItem ? (
          // Hiển thị trực tiếp nội dung ca cố định mà không có tabs và badge
          <div className="fixed-meal-shift">
            {tabItems.find((tab) => tab.key === fixedShift)?.children}
          </div>
        ) : (
          <Tabs
            activeKey={selectedShift}
            onChange={handleShiftChange}
            items={tabItems}
            className="meal-shift-tabs"
          />
        )}
      </div>
    </Modal>
  );
}
