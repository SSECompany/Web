import { ArrowLeftOutlined, PlusOutlined } from "@ant-design/icons";
import { Checkbox, DatePicker, Modal, notification, Tabs } from "antd";
import dayjs from "dayjs";
import cloneDeep from "lodash.clonedeep";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { multipleTablePutApi } from "../../../../api";
import { formatNumber } from "../../../../app/hook/dataFormatHelper";
import showConfirm from "../../../../components/common/Modal/ModalConfirm";
import {
    markBedAsSubmitted,
    removeMeal,
    setListDietCategory,
    setListFood,
    setMeal,
    setShowMealDetails,
    setShowRoomSelection
} from "../../store/meal";
import MealEntryRow from "../MealInputBlock/MealInputBlock";
import "./MealDetailsForm.css";
import { mealSchema } from "./validator/validationSchema";

const { TabPane } = Tabs;

const MealDetailsForm = () => {
  const firstMealInputRef = useRef(null);
  const tabsRef = useRef();
  const dispatch = useDispatch();
  const currentBedIndex = useSelector((state) => state.meals.currentBedIndex);
  const listBeds = useSelector((state) => state.meals.listBeds);
  const bedName = listBeds[currentBedIndex];
  const listFood = useSelector((state) => state.meals.listFood);
  const detailData = useSelector((state) => state.meals.meals.detailData);
  const mealHistory = useSelector((state) => state.meals.mealHistory || []);
  const [isPaid, setIsPaid] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("");
  
  // Local state để lưu food list riêng cho từng ca + chế độ
  const [foodListByShiftAndMode, setFoodListByShiftAndMode] = useState({});

  const selectedDate = useSelector((state) => state.meals.roomSelectedDate);
  const listMealCode = useSelector((state) => state.meals.listMealCode);
  const listDietCategory = useSelector((state) => state.meals.listDietCategory);
  const [activeTab, setActiveTab] = useState(listMealCode[0]?.ma_ca || "CA1");
  const [selectedPatientInShift, setSelectedPatientInShift] = useState({});

  const [mealEntries, setMealEntries] = useState(detailData);

  useEffect(() => {
    setMealEntries(detailData);
    
    // Clear TOÀN BỘ cache khi chuyển giường hoặc load data mới
    setFoodListByShiftAndMode({});
    
    // Auto fetch food list khi có mode từ API
    const bedMeals = detailData[currentBedIndex];
    if (bedMeals && selectedDate) {
      const fetchFoodLists = async () => {
        const newCache = {};
        
        for (const shift of ["CA1", "CA2", "CA3"]) {
          const meals = bedMeals[shift] || [];
          
          for (const meal of meals) {
            if (meal.mode && meal.mode.trim() !== "") {
              const key = `${shift}_${meal.mode}`;
              
              // Chỉ fetch nếu chưa có trong cache tạm
              if (!newCache[key]) {
                try {
                  const response = await multipleTablePutApi({
                    store: "[api_getListFood]",
                    param: {
                      bn_yn: "",
                      ma_ca: shift,
                      ma_nh: meal.mode,
                      searchValue: "",
                      ngay_an: selectedDate,
                      pageindex: 1,
                      pagesize: 50,
                    },
                    data: {},
                  });

                  const foodList = response?.listObject?.[0] || [];
                  newCache[key] = foodList;
                } catch (error) {
                  console.error("Lỗi fetch food list cho mode từ API:", error);
                }
              }
            }
          }
        }
        
        // Set tất cả cache mới một lần duy nhất
        setFoodListByShiftAndMode(newCache);
      };
      
      fetchFoodLists();
    }
  }, [detailData, currentBedIndex, selectedDate]);

  useEffect(() => {
    const bedMeals = detailData[currentBedIndex];
    if (bedMeals) {
      const allMeals = Object.values(bedMeals).flat();
      const hasPaid =
        allMeals.length > 0 && allMeals.every((meal) => meal.isPaid);
      setIsPaid(hasPaid);
    } else {
      setIsPaid(false);
    }
  }, [detailData, currentBedIndex]);

  useEffect(() => {
    const fetchListFood = async () => {
      if (!selectedDate) return;

      // Clear listFood trước khi fetch
      dispatch(setListFood([]));

      try {
        const response = await multipleTablePutApi({
          store: "[api_getListFood]",
          param: {
            bn_yn: "",
            ma_ca: "",
            ma_nh: "",
            searchValue: "",
            ngay_an: selectedDate,
            pageindex: 1,
            pagesize: 50,
          },
          data: {},
        });

        const foodList = response?.listObject?.[0] || [];
        // Luôn dispatch kể cả khi rỗng
        dispatch(setListFood(foodList));
      } catch (error) {
        console.error("Lỗi lấy listFood theo ngày:", error);
        dispatch(setListFood([]));
      }
    };

    fetchListFood();
  }, [selectedDate, dispatch]);

  // Fetch listDietCategory khi component mount hoặc khi đổi ngày/ca
  useEffect(() => {
    const fetchListDietCategory = async () => {
      if (!selectedDate) return;

      // Clear listDietCategory trước khi fetch để tránh hiển thị data cũ
      dispatch(setListDietCategory([]));

      try {
        const response = await multipleTablePutApi({
          store: "[api_getListDietCategory]",
          param: {
            searchValue: "",
            ngay_an: selectedDate,
            ma_ca: activeTab,
            pageindex: 1,
            pagesize: 100,
          },
          data: {},
        });

        const dietCategoryList = response?.listObject?.[0] || [];
        // Luôn dispatch kể cả khi rỗng, để clear data cũ
        dispatch(setListDietCategory(dietCategoryList));
      } catch (error) {
        console.error("Lỗi lấy listDietCategory:", error);
        // Nếu lỗi, vẫn set rỗng để clear data cũ
        dispatch(setListDietCategory([]));
      }
    };

    fetchListDietCategory();
  }, [selectedDate, activeTab, dispatch]);

  const updateMealEntriesInRedux = (updatedMeals) => {
    const newMeals = cloneDeep(updatedMeals);
    dispatch(setMeal({ mealEntries: newMeals, bedIndex: currentBedIndex }));
  };

  const calculateTotalAllShift = () => {
    const bedMeals = mealEntries[currentBedIndex] || {};
    let total = 0;

    Object.keys(bedMeals).forEach((shift) => {
      total += (bedMeals[shift] || []).reduce((shiftTotal, meal) => {
        if (meal.totalMoney && !meal.collectMoney) {
          return shiftTotal + meal.totalMoney;
        }
        return shiftTotal;
      }, 0);
    });

    return total;
  };

  const calculateTotalByShift = (shift) => {
    const entries = mealEntries[currentBedIndex]?.[shift] || [];
    return entries.reduce((total, meal) => {
      if (meal.totalMoney && !meal.collectMoney) {
        return total + meal.totalMoney;
      }
      return total;
    }, 0);
  };

  const updateMealEntry = (timeOfDay, index, updateFn) => {
    setMealEntries((prev) => {
      const updatedMeals = [...prev];
      if (!updatedMeals[currentBedIndex]) {
        updatedMeals[currentBedIndex] = { CA1: [], CA2: [], CA3: [] };
      }
      const bedMeals = { ...updatedMeals[currentBedIndex] };
      const meals = [...(bedMeals[timeOfDay] || [])];
      const meal = { ...meals[index] };

      updateFn(meal);
      // Nếu là meal đã đặt (có stt_rec) thì set isEdit: true khi có thay đổi
      if (meal.stt_rec) meal.isEdit = true;

      meals[index] = meal;
      bedMeals[timeOfDay] = meals;
      updatedMeals[currentBedIndex] = bedMeals;

      return updatedMeals;
    });
  };

  const handleChange = useCallback(
    (timeOfDay, index, e) => {
      const { name, value } = e.target;
      updateMealEntry(timeOfDay, index, (meal) => {
        if (name === "mealType") {
          // Lấy food list từ local state theo ca và chế độ hiện tại
          const key = `${timeOfDay}_${meal.mode}`;
          const foodsForThisShiftAndMode = foodListByShiftAndMode[key] || [];
          
          const selectedFood = foodsForThisShiftAndMode.find(
            (food) => food.ma_mon === value
          );
          const price = selectedFood?.gia_ban || meal.price || 0;
          
          // Only reset quantity and price if this is a NEW selection (meal didn't have mealType before)
          // If meal already has mealType and price, keep them (from history)
          const isNewSelection = !meal.mealType;
          
          meal.mealType = value;
          meal.mealTypeName = selectedFood?.ten_mon || "";
          
          if (isNewSelection) {
            // New selection - use default quantity and price from API
            meal.quantity = 1;
            meal.price = price;
            meal.totalMoney = price * 1;
          } else {
            // Existing meal (from history) - keep existing quantity and price
            meal.totalMoney = meal.price * meal.quantity;
          }
        } else if (name === "note") {
          meal.note = value;
        } else {
          meal[name] = value;
        }
      });
    },
    [foodListByShiftAndMode]
  );

  const handleQuantityChange = useCallback(
    (timeOfDay, index, change) => {
      updateMealEntry(timeOfDay, index, (meal) => {
        const newQuantity = Math.max(1, meal.quantity + change);
        
        // Lấy food list từ local state theo ca và chế độ hiện tại
        const key = `${timeOfDay}_${meal.mode}`;
        const foodsForThisShiftAndMode = foodListByShiftAndMode[key] || [];
        
        const selectedFood = foodsForThisShiftAndMode.find(
          (food) => food.ma_mon === meal.mealType
        );
        const price = selectedFood?.gia_ban || 0;
        meal.quantity = newQuantity;
        meal.totalMoney = meal.collectMoney ? 0 : price * newQuantity;
      });
    },
    [foodListByShiftAndMode]
  );

  const handleAddMeal = (timeOfDay) => {
    setMealEntries((prev) => {
      const updatedMeals = [...prev];
      if (!updatedMeals[currentBedIndex]) {
        updatedMeals[currentBedIndex] = { CA1: [], CA2: [], CA3: [] };
      }
      const bedMeals = { ...updatedMeals[currentBedIndex] };
      const meals = [...(bedMeals[timeOfDay] || [])];

      const mealDate =
        selectedDate && typeof selectedDate === "string"
          ? dayjs(selectedDate, "DD/MM/YYYY").format("DD/MM/YYYY")
          : dayjs().format("DD/MM/YYYY");

      // Create new meal with current payment method and isPaid status
      const newMeal = {
        ...createDefaultMeal(mealDate),
        isPaid: isPaid,
        httt: isPaid ? paymentMethod : "",
      };

      meals.push(newMeal);

      bedMeals[timeOfDay] = meals;
      updatedMeals[currentBedIndex] = bedMeals;

      updateMealEntriesInRedux(updatedMeals);
      return updatedMeals;
    });
  };

  const handleModeChange = useCallback(
    (timeOfDay, index, value) => {
      updateMealEntry(timeOfDay, index, (meal) => {
        meal.mode = value;
        // Reset meal type when mode changes
        meal.mealType = "";
        meal.mealTypeName = "";
        meal.quantity = 0;
        meal.totalMoney = 0;
      });

      // Fetch food list when mode changes - LUÔN fetch mới từ API
      const fetchListFood = async () => {
        if (!selectedDate || !value) return;

        try {
          const response = await multipleTablePutApi({
            store: "[api_getListFood]",
            param: {
              bn_yn: "",
              ma_ca: timeOfDay,
              ma_nh: value,
              searchValue: "",
              ngay_an: selectedDate,
              pageindex: 1,
              pagesize: 50,
            },
            data: {},
          });

          const foodList = response?.listObject?.[0] || [];

          // Lưu food list cho key này, GHI ĐÈ nếu đã tồn tại
          const key = `${timeOfDay}_${value}`;
          setFoodListByShiftAndMode((prev) => {
            // Tạo object mới, chỉ giữ lại các key khác ca hiện tại
            const newState = {};
            Object.keys(prev).forEach((k) => {
              // Chỉ giữ lại nếu KHÔNG cùng ca
              if (!k.startsWith(`${timeOfDay}_`)) {
                newState[k] = prev[k];
              }
            });
            // Thêm key mới
            newState[key] = foodList;
            return newState;
          });
        } catch (error) {
          console.error("Lỗi lấy listFood theo chế độ:", error);
        }
      };

      fetchListFood();
    },
    [selectedDate]
  );

  // Thêm hàm helper để lấy danh sách món ăn theo ca và chế độ
  const getFoodListByShiftAndMode = useCallback(
    (timeOfDay, mode) => {
      if (!timeOfDay || !mode) return [];

      // Lấy từ local state theo key
      const key = `${timeOfDay}_${mode}`;
      const foodsFromApi = foodListByShiftAndMode[key] || [];

      return foodsFromApi;
    },
    [foodListByShiftAndMode]
  );

  const handleDeleteMeal = (timeOfDay, index) => {
    showConfirm({
      title: "Bạn có chắc chắn muốn xoá món ăn này?",
      onOk: () => {
        setMealEntries((prev) => {
          const updatedMeals = cloneDeep(prev);
          const bedMeals = { ...updatedMeals[currentBedIndex] };
          const meals = [...(bedMeals[timeOfDay] || [])];

          const mealDate =
            selectedDate && typeof selectedDate === "string"
              ? dayjs(selectedDate, "DD/MM/YYYY").format("DD/MM/YYYY")
              : dayjs().format("DD/MM/YYYY");

          if (meals.length === 1) {
            // Create new default meal with current payment method and isPaid status
            const newDefaultMeal = {
              ...createDefaultMeal(mealDate),
              isPaid: isPaid,
              httt: isPaid ? paymentMethod : "",
            };
            bedMeals[timeOfDay] = [newDefaultMeal];
          } else {
            meals.splice(index, 1);
            bedMeals[timeOfDay] = meals;
          }
          updatedMeals[currentBedIndex] = bedMeals;

          dispatch(
            removeMeal({
              mealTime: timeOfDay,
              mealIndex: index,
              bedIndex: currentBedIndex,
            })
          );

          updateMealEntriesInRedux(updatedMeals);
          return updatedMeals;
        });
        setTimeout(() => {
          if (firstMealInputRef.current) {
            firstMealInputRef.current.focus();
          }
        }, 100);
      },
    });
  };

  const handlePatientCheckboxChange = (timeOfDay, index, checked) => {
    setSelectedPatientInShift((prev) => {
      const updated = { ...prev };
      if (checked) {
        updated[timeOfDay] = index;
      } else {
        delete updated[timeOfDay];
      }
      return updated;
    });

    setMealEntries((prev) => {
      const updatedMeals = [...prev];
      const bedMeals = { ...updatedMeals[currentBedIndex] };
      const meals = [...(bedMeals[timeOfDay] || [])];

      // Lấy food list từ local state theo ca và chế độ
      const mealMode = meals[index]?.mode;
      const key = `${timeOfDay}_${mealMode}`;
      const foodsForThisShiftAndMode = foodListByShiftAndMode[key] || [];
      
      const selectedFood = foodsForThisShiftAndMode.find(
        (food) => food.ma_mon === meals[index]?.mealType
      );
      const price = selectedFood?.gia_ban || 0;

      bedMeals[timeOfDay] = meals.map((meal, i) => {
        if (i === index) {
          return {
            ...meal,
            collectMoney: checked,
            quantity: 1,
            totalMoney: checked ? 0 : price * 1,
          };
        } else {
          return {
            ...meal,
            collectMoney: false,
          };
        }
      });

      updatedMeals[currentBedIndex] = bedMeals;
      return updatedMeals;
    });
  };

  const handleSubmit = async () => {
    const bedMeals = mealEntries[currentBedIndex] || {};

    // Validate meals: check for price = 0 and benh_nhan_yn = 0, and missing payment method
    const invalidPriceMeals = [];

    ["CA1", "CA2", "CA3"].forEach((shift) => {
      const meals = bedMeals[shift] || [];
      meals.forEach((meal) => {
        if (!meal.mealType) return;

        const price = meal.price || 0;
        const collectMoney = meal.collectMoney;
        const isPaid = meal.isPaid;
        const httt = meal.httt;

        const shiftName =
          shift === "CA1"
            ? "Ca sáng"
            : shift === "CA2"
            ? "Ca trưa"
            : "Ca chiều";

        // Find meal name from listFood
        const mealName =
          listFood.find((food) => food.ma_mon === meal.mealType)?.ten_mon ||
          meal.mealType;

        // Check for price = 0 and not paid by patient
        if (price === 0 && !collectMoney) {
          invalidPriceMeals.push({
            shift: shiftName,
            mealName: mealName,
            issue: "Có giá = 0 nhưng không được tích 'Bệnh nhân trả tiền'",
          });
        }

      });
    });

    if (invalidPriceMeals.length > 0) {
      Modal.warning({
        title: (
          <div style={{ display: "flex", alignItems: "center" }}>
            Không thể hoàn thành - Có món ăn chưa hợp lệ
          </div>
        ),
        content: (
          <div style={{ marginTop: "16px" }}>
            <p style={{ marginBottom: "12px" }}>Các món ăn sau có vấn đề:</p>
            <div
              style={{
                backgroundColor: "#fff7e6",
                border: "1px solid #ffd591",
                borderRadius: "4px",
                padding: "12px",
                marginBottom: "12px",
              }}
            >
              {invalidPriceMeals.map((detail, index) => (
                <div key={index} style={{ marginBottom: "8px" }}>
                  • <strong>{detail.shift}</strong>: {detail.mealName}
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#666",
                      marginLeft: "12px",
                      marginTop: "2px",
                    }}
                  >
                    {detail.issue}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: "13px", color: "#666" }}>
              <p style={{ marginBottom: "4px" }}>Vui lòng:</p>
              <ul style={{ margin: "0", paddingLeft: "16px" }}>
                <li>
                  Tích "Bệnh nhân trả tiền" cho các món có giá = 0 hoặc cập
                  nhật giá tiền
                </li>
              </ul>
            </div>
          </div>
        ),
        width: 550,
        okText: "Đã hiểu",
      });
      return;
    }

    const updatedMeals = cloneDeep(mealEntries);

    // Check if all shifts have meals
    const allShiftsHaveMeals = ["CA1", "CA2", "CA3"].every((shift) => {
      const meals = bedMeals[shift] || [];
      return meals.some((meal) => meal.mealType);
    });

    if (!allShiftsHaveMeals) {
      // This should not happen because the submit button is disabled
      // But we add this check as a safeguard
      notification.error({
        message: "Lỗi",
        description: "Vui lòng nhập đủ món ăn cho cả 3 ca (Sáng, Trưa, Chiều)",
      });
      return;
    }

    let hasError = false;

    for (const shift of Object.keys(bedMeals)) {
      for (let index = 0; index < (bedMeals[shift]?.length || 0); index++) {
        const meal = bedMeals[shift][index];

        if (!meal.mode && !meal.mealType) continue;

        try {
          await mealSchema.validate(meal, { abortEarly: false });
          updatedMeals[currentBedIndex][shift][index] = {
            ...meal,
            errors: {},
          };
        } catch (validationError) {
          hasError = true;
          const errors = {};
          validationError.inner.forEach((err) => {
            errors[err.path] = err.message;
          });
          updatedMeals[currentBedIndex][shift][index] = {
            ...meal,
            errors: errors,
          };
        }
      }
    }

    if (hasError) {
      setMealEntries(updatedMeals);
      return;
    }

    dispatch(setMeal({ mealEntries: updatedMeals, bedIndex: currentBedIndex }));
    dispatch(markBedAsSubmitted(currentBedIndex));
    dispatch(setShowMealDetails(false));
    dispatch(setShowRoomSelection(true));
  };

  const handleBackToRoomSelection = () => {
    showConfirm({
      title: "Bạn có chắc chắn muốn quay lại? Dữ liệu hiện tại sẽ bị mất",
      onOk: () => {
        dispatch(setShowMealDetails(false));
        dispatch(setShowRoomSelection(true));
      },
    });
  };

  // Check if current bed has existing order (from history)
  const hasExistingOrder = useMemo(() => {
    const bedMaGiuong = bedName?.ma_giuong;
    return mealHistory.some((m) => m.ma_giuong?.trim() === bedMaGiuong?.trim());
  }, [mealHistory, bedName]);

  const handleCancelOrder = () => {
    showConfirm({
      title: "Bạn có chắc chắn muốn huỷ đơn đã đặt?",
      onOk: async () => {
        try {
          // TODO: Call API to cancel order
          // const response = await cancelMealOrderApi({ ... });
          
          notification.success({ message: "Huỷ đơn thành công!" });
          
          dispatch(setShowMealDetails(false));
          dispatch(setShowRoomSelection(true));
        } catch (error) {
          console.error("Lỗi khi huỷ đơn:", error);
          notification.error({ message: "Huỷ đơn thất bại!" });
        }
      },
    });
  };

  const renderedMealEntries = useMemo(() => {
    const bedMeals = mealEntries[currentBedIndex] || {};
    const result = {};

    ["CA1", "CA2", "CA3"].forEach((shift) => {
      const entries = bedMeals[shift] || [];
      const selectedIndex = selectedPatientInShift[shift]; // Lấy index của suất ăn được chọn trong ca

      result[shift] = entries.map((meal, index) => (
        <MealEntryRow
          key={index}
          meal={meal}
          index={index}
          timeOfDay={shift}
          listDietCategory={listDietCategory}
          foodListForSelection={getFoodListByShiftAndMode(shift, meal.mode)}
          handleDeleteMeal={handleDeleteMeal}
          handleModeChange={handleModeChange}
          handleChange={handleChange}
          handleQuantityChange={handleQuantityChange}
          handleCollectMoneyChange={(e) =>
            handlePatientCheckboxChange(shift, index, e.target.checked)
          }
          firstMealInputRef={firstMealInputRef}
          isAnotherMealSelected={
            selectedIndex !== undefined && selectedIndex !== index
          } // Kiểm tra nếu đã có suất khác được chọn
        />
      ));
    });

    return result;
  }, [
    mealEntries,
    currentBedIndex,
    listDietCategory,
    selectedPatientInShift,
    getFoodListByShiftAndMode,
    handleDeleteMeal,
    handleModeChange,
    handleChange,
    handleQuantityChange,
  ]);

  useEffect(() => {
    const bedMeals = detailData[currentBedIndex];
    if (bedMeals) {
      let foundHttt = "";
      ["CA1", "CA2", "CA3"].some((shift) => {
        const meals = bedMeals[shift] || [];
        for (let meal of meals) {
          if (meal.httt) {
            foundHttt = meal.httt;
            return true;
          }
        }
        return false;
      });
      setPaymentMethod(foundHttt);
    } else {
      setPaymentMethod("");
    }
  }, [detailData, currentBedIndex]);

  const createDefaultMeal = (date) => ({
    date: date || dayjs().format("DD/MM/YYYY"),
    mode: "",
    mealType: "",
    mealTypeName: "",
    quantity: 0,
    note: "",
    collectMoney: false,
    totalMoney: 0,
    isPaid: false,
    httt: "",
    // Empty cho meal mới
    stt_rec: "",
    stt_rec0: "",
    so_ct: "",
  });

  return (
    <div className="meal-ticket-form">
      <div className="back-button-container">
        <button className="back-button" onClick={handleBackToRoomSelection}>
          <ArrowLeftOutlined />
        </button>
      </div>
      <h2 className="form-title_detail">
        Giường {bedName?.ten_giuong || "Không rõ tên giường"}
      </h2>
      <div className="meal-details-datepicker">
        <DatePicker
          id="date-picker"
          value={dayjs(selectedDate, "DD/MM/YYYY")}
          format="DD/MM/YYYY"
          className="meal-date-picker-input"
          disabled
          inputReadOnly
          style={{ cursor: "default" }}
        />
      </div>
      <Tabs
        ref={tabsRef}
        defaultActiveKey={listMealCode[0]?.ma_ca || "CA1"}
        activeKey={activeTab}
        onChange={setActiveTab}
      >
        {listMealCode.map((meal) => (
          <TabPane
            tab={`${meal.ten_ca}
            - ${formatNumber(calculateTotalByShift(meal.ma_ca))} đ
            `}
            key={meal.ma_ca}
          >
            {renderedMealEntries[meal.ma_ca]}
            <button
              className="add-row-button"
              onClick={() => handleAddMeal(meal.ma_ca)}
            >
              <PlusOutlined />
            </button>
          </TabPane>
        ))}
      </Tabs>
      <div style={{ marginTop: 16 }}>
        <Checkbox
          checked={isPaid}
          disabled={calculateTotalAllShift() === 0}
          onChange={(e) => {
            const newIsPaid = e.target.checked;
            setIsPaid(newIsPaid);

            setMealEntries((prev) => {
              const updatedMeals = cloneDeep(prev);
              if (!updatedMeals[currentBedIndex]) {
                updatedMeals[currentBedIndex] = { CA1: [], CA2: [], CA3: [] };
              }

              const shifts = ["CA1", "CA2", "CA3"];
              shifts.forEach((shift) => {
                updatedMeals[currentBedIndex][shift] = (
                  updatedMeals[currentBedIndex][shift] || []
                ).map((meal) => ({
                  ...meal,
                  isPaid: newIsPaid,
                  httt: newIsPaid ? "chuyen_khoan" : "",
                }));
              });

              if (newIsPaid) {
                setPaymentMethod("chuyen_khoan");
              } else {
                setPaymentMethod("");
              }

              dispatch(
                setMeal({
                  mealEntries: updatedMeals,
                  bedIndex: currentBedIndex,
                })
              );
              return updatedMeals;
            });
          }}
        >
          Thu tiền
        </Checkbox>
      </div>
      <div className="total-money">
        Tổng tiền: {formatNumber(calculateTotalAllShift())} đ
      </div>

      <div style={{ display: 'flex', gap: '12px' }}>
        {hasExistingOrder && (
          <button
            className="cancel-button"
            onClick={handleCancelOrder}
          >
            Huỷ đơn
          </button>
        )}
        <button
          className="submit-button"
          onClick={handleSubmit}
          disabled={
            !(
              mealEntries[currentBedIndex]?.CA1?.some((meal) => meal.mealType) &&
              mealEntries[currentBedIndex]?.CA2?.some((meal) => meal.mealType) &&
              mealEntries[currentBedIndex]?.CA3?.some((meal) => meal.mealType)
            )
          }
        >
          Hoàn thành
        </button>
      </div>
    </div>
  );
};

export default MealDetailsForm;
