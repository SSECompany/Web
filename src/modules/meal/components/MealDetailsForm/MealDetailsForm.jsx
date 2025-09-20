import { ArrowLeftOutlined } from "@ant-design/icons";
import { DatePicker, Tabs } from "antd";
import dayjs from "dayjs";
import cloneDeep from "lodash.clonedeep";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { multipleTablePutApi } from "../../../../api";
import showConfirm from "../../../../components/common/Modal/ModalConfirm";
import {
  markBedAsSubmitted,
  removeMeal,
  setListFood,
  setMeal,
  setShowMealDetails,
  setShowRoomSelection,
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
  const [isPaid, setIsPaid] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("");

  const selectedDate = useSelector((state) => state.meals.roomSelectedDate);
  const listMealCode = useSelector((state) => state.meals.listMealCode);
  const listDietCategory = useSelector((state) => state.meals.listDietCategory);
  const [activeTab, setActiveTab] = useState(listMealCode[0]?.ma_ca || "CA1");
  const [selectedPatientInShift, setSelectedPatientInShift] = useState({});

  const [mealEntries, setMealEntries] = useState(detailData);
  const [localFoodList, setLocalFoodList] = useState({});

  useEffect(() => {
    setMealEntries(detailData);
  }, [detailData]);

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
        dispatch(setListFood(foodList));
      } catch (error) {
        console.error("Lỗi lấy listFood theo ngày:", error);
      }
    };

    fetchListFood();
  }, [selectedDate, dispatch]);

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
          const selectedFood = listFood.find(
            (food) => food.ma_mon === value && food.ma_ca === timeOfDay
          );
          const price = selectedFood?.gia_ban || 0;
          meal.mealType = value;
          meal.mealTypeName = selectedFood?.ten_mon || "";
          meal.quantity = 1;
          meal.totalMoney = price * meal.quantity;
          meal.price = price;
        } else if (name === "note") {
          meal.note = value;
        } else {
          meal[name] = value;
        }
      });
    },
    [listFood]
  );

  const handleQuantityChange = useCallback(
    (timeOfDay, index, change) => {
      updateMealEntry(timeOfDay, index, (meal) => {
        const newQuantity = Math.max(1, meal.quantity + change);
        const selectedFood = listFood.find(
          (food) => food.ma_mon === meal.mealType && food.ma_ca === timeOfDay
        );
        const price = selectedFood?.gia_ban || 0;
        meal.quantity = newQuantity;
        meal.totalMoney = meal.collectMoney ? 0 : price * newQuantity;
      });
    },
    [listFood]
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

      meals.push(createDefaultMeal(mealDate));

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

      // Fetch food list when mode changes
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

          // Lưu vào state local thay vì Redux
          setLocalFoodList((prev) => {
            const key = `${timeOfDay}_${value}`;
            return {
              ...prev,
              [key]: foodList,
            };
          });

          // Cập nhật danh sách món ăn trong redux để component MealInputBlock có thể truy cập
          const currentFoodList = [...listFood];

          // Lọc ra các món ăn đã tồn tại trong danh sách hiện tại để tránh trùng lặp
          const newFoodItems = foodList.filter(
            (newFood) =>
              !currentFoodList.some(
                (existingFood) =>
                  existingFood.ma_mon === newFood.ma_mon &&
                  existingFood.ma_ca === newFood.ma_ca &&
                  existingFood.ma_nh === newFood.ma_nh
              )
          );

          // Nếu có món ăn mới, thêm vào danh sách và cập nhật Redux
          if (newFoodItems.length > 0) {
            const updatedFoodList = [...currentFoodList, ...newFoodItems];
            dispatch(setListFood(updatedFoodList));
          }
        } catch (error) {
          console.error("Lỗi lấy listFood theo chế độ:", error);
        }
      };

      fetchListFood();
    },
    [selectedDate, dispatch, listFood]
  );

  // Thêm hàm helper để lấy danh sách món ăn theo ca và chế độ
  const getFoodListByShiftAndMode = useCallback(
    (timeOfDay, mode) => {
      if (!timeOfDay || !mode) return [];

      const key = `${timeOfDay}_${mode}`;
      const localList = localFoodList[key] || [];

      // Nếu đã có trong local state, trả về từ đó
      if (localList.length > 0) {
        return localList;
      }

      // Nếu không, lọc từ listFood trong redux
      return listFood.filter(
        (food) => food.ma_ca === timeOfDay && food.ma_nh === mode
      );
    },
    [localFoodList, listFood]
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
            bedMeals[timeOfDay] = [createDefaultMeal(mealDate)];
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

      const selectedFood = listFood.find(
        (food) =>
          food.ma_mon === meals[index]?.mealType && food.ma_ca === timeOfDay
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
          listFood={listFood}
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
    listFood,
    listDietCategory,
    selectedPatientInShift,
    getFoodListByShiftAndMode,
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
            //   tab={`${meal.ten_ca}
            //   - ${formatNumber(
            //     calculateTotalByShift(meal.ma_ca)
            //   )} đ
            //   `
            // }
            tab={`${meal.ten_ca}`}
            key={meal.ma_ca}
          >
            {renderedMealEntries[meal.ma_ca]}
            {/* <button
              className="add-row-button"
              onClick={() => handleAddMeal(meal.ma_ca)}
            >
              <PlusOutlined />
            </button> */}
          </TabPane>
        ))}
      </Tabs>
      {/* <div style={{ marginTop: 16 }}>
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
                  httt: newIsPaid ? meal.httt : "",
                }));
              });

              if (!newIsPaid) setPaymentMethod("");

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
        <Select
          value={paymentMethod}
          disabled={!isPaid}
          onChange={(value) => {
            setPaymentMethod(value);
            const updatedMeals = cloneDeep(mealEntries);
            if (!updatedMeals[currentBedIndex]) {
              updatedMeals[currentBedIndex] = { CA1: [], CA2: [], CA3: [] };
            }
            const shifts = ["CA1", "CA2", "CA3"];
            shifts.forEach((shift) => {
              if (updatedMeals[currentBedIndex][shift]) {
                updatedMeals[currentBedIndex][shift] = updatedMeals[
                  currentBedIndex
                ][shift].map((meal) => ({
                  ...meal,
                  httt: value,
                }));
              }
            });

            dispatch(
              setMeal({
                mealEntries: updatedMeals,
                bedIndex: currentBedIndex,
              })
            );
            setMealEntries(updatedMeals);
          }}
          style={{ width: 140, marginLeft: 12 }}
          options={[
            { label: "Vui lòng chọn", value: "" },
            { label: "Tiền mặt", value: "tien_mat" },
            { label: "Chuyển khoản", value: "chuyen_khoan" },
          ]}
        />
      </div> */}
      {/* <div className="total-money">
        Tổng tiền: {formatNumber(calculateTotalAllShift())} đ
      </div> */}

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
  );
};

export default MealDetailsForm;
