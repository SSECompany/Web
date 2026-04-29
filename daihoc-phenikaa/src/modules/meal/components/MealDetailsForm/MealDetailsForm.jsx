import { ArrowLeftOutlined, PlusOutlined } from "@ant-design/icons";
import { Checkbox, DatePicker, Modal, notification, Tabs } from "antd";
import dayjs from "dayjs";
import cloneDeep from "lodash.clonedeep";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { multipleTablePutApi, apiProcessCombinedMealOrder, syncFastMutiApi } from "../../../../api";
import { formatNumber } from "../../../../app/hook/dataFormatHelper";
import showConfirm from "../../../../components/common/Modal/ModalConfirm";
import {
    markBedAsSubmitted,
    removeMeal,
    setListDietCategory,
    setListFood,
    setMeal,
    setMealHistory,
    setShowMealDetails,
    setShowRoomSelection,
    setBedPaymentToggled,
    setSubmittedBeds
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

  // Track xem user có thay đổi gì trong session hiện tại không
  const hasChangedInThisSession = useRef(false);

  // Local state để lưu food list riêng cho từng ca + chế độ
  const [foodListByShiftAndMode, setFoodListByShiftAndMode] = useState({});

  const selectedDate = useSelector((state) => state.meals.roomSelectedDate);
  const listMealCode = useSelector((state) => state.meals.listMealCode);
  const listDietCategory = useSelector((state) => state.meals.listDietCategory);
  const masterData = useSelector((state) => state.meals.meals.masterData);
  const { userName, unitId, id: userId } = useSelector(
    (state) => state.claimsReducer.userInfo || {}
  );
  const [activeTab, setActiveTab] = useState(listMealCode[0]?.ma_ca || "CA1");
  const [selectedPatientInShift, setSelectedPatientInShift] = useState({});

  const [mealEntries, setMealEntries] = useState(detailData);

  // Sync detailData to local state khi detailData thay doi
  useEffect(() => {
    if (detailData && Array.isArray(detailData)) {
      setMealEntries(detailData);
    }
  }, [detailData, currentBedIndex]);

  // Chi reset flag va clear cache khi chuyen giuong hoac doi ngay
  // KHONG reset khi chi thay doi detailData (do user edit)
  useEffect(() => {
    // Reset flag khi load data mới (chuyen giuong hoac doi ngay)
    hasChangedInThisSession.current = false;

    // Clear TOÀN BỘ cache khi chuyển giường hoặc load data mới
    setFoodListByShiftAndMode({});
    setPaymentMethod("");
    setIsPaid(false);
    setSelectedPatientInShift({});
  }, [currentBedIndex, selectedDate]);

  // Clear cache khi mealHistory thay đổi (sau khi gửi đơn thành công)
  useEffect(() => {
    setFoodListByShiftAndMode({});
  }, [mealHistory]);

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

  // KHÔNG auto-fetch api_getListFood khi load form
  // Chỉ fetch khi user click vào dropdown chọn món (onFocus)

  // Hàm fetch diet category khi user click vào select box chế độ
  const refetchDietCategory = useCallback(
    async (timeOfDay) => {
      if (!selectedDate) return;

      try {
        const response = await multipleTablePutApi({
          store: "[api_getListDietCategory]",
          param: {
            searchValue: "",
            ngay_an: selectedDate,
            ma_ca: timeOfDay,
            pageindex: 1,
            pagesize: 100,
          },
          data: {},
        });

        const dietCategoryList = response?.listObject?.[0] || [];
        
        // Kiểm tra nếu API trả về data hợp lệ
        if (Array.isArray(dietCategoryList) && dietCategoryList.length > 0 && dietCategoryList[0].ma_nh) {
          // Merge với danh sách hiện có thay vì ghi đè
          const currentCategories = listDietCategory || [];
          const mergedCategories = [...currentCategories];
          
          dietCategoryList.forEach(newCategory => {
            const exists = mergedCategories.some(cat => cat.ma_nh === newCategory.ma_nh);
            if (!exists) {
              mergedCategories.push(newCategory);
            }
          });
          
          dispatch(setListDietCategory(mergedCategories));
        } else {
          console.warn(`⚠️ Invalid diet category data for ${timeOfDay}:`, dietCategoryList);
          // Nếu API trả về rỗng, vẫn dispatch để clear cache cũ
          dispatch(setListDietCategory([]));
        }
      } catch (error) {
        console.error(`❌ Lỗi fetch diet category cho ${timeOfDay}:`, error);
        // Trong trường hợp lỗi, không thay đổi listDietCategory
      }
    },
    [selectedDate, dispatch, listDietCategory]
  );

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
      // Món đã xóa được xóa thật khỏi array, không cần check status
      if (meal.totalMoney && !meal.collectMoney) {
        return total + meal.totalMoney;
      }
      return total;
    }, 0);
  };

  const updateMealEntry = useCallback((timeOfDay, index, updateFn, shouldMarkAsEdit = true) => {
    setMealEntries((prev) => {
      const updatedMeals = [...prev];
      if (!updatedMeals[currentBedIndex]) {
        updatedMeals[currentBedIndex] = { CA1: [], CA2: [], CA3: [] };
      }
      const bedMeals = { ...updatedMeals[currentBedIndex] };
      const meals = [...(bedMeals[timeOfDay] || [])];
      const meal = { ...meals[index] };

      updateFn(meal);
      // CHỈ đánh dấu isEdit nếu shouldMarkAsEdit = true VÀ meal có stt_rec
      if (shouldMarkAsEdit && meal.stt_rec) {
        meal.isEdit = true;
        // Đánh dấu có thay đổi trong session này
        hasChangedInThisSession.current = true;
      }

      meals[index] = meal;
      bedMeals[timeOfDay] = meals;
      updatedMeals[currentBedIndex] = bedMeals;

      // Update Redux store NGAY LẬP TỨC
      dispatch(setMeal({ mealEntries: updatedMeals, bedIndex: currentBedIndex }));

      return updatedMeals;
    });
  }, [currentBedIndex, dispatch]);

  const handleChange = useCallback(
    (timeOfDay, index, e) => {
      const { name, value } = e.target;

      // Lấy giá trị cũ để so sánh
      const meals = mealEntries[currentBedIndex]?.[timeOfDay] || [];
      const oldMeal = meals[index];
      const oldValue = name === "note" ? (oldMeal?.note || "") : (oldMeal?.[name] || "");
      const newValue = value || "";

      // CHỈ đánh dấu isEdit nếu có thay đổi thực sự
      const hasRealChange = oldValue !== newValue;

      // Danh dau co thay doi neu co stt_rec va co thay doi that su
      if (hasRealChange && oldMeal?.stt_rec) {
        hasChangedInThisSession.current = true;
      }

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
      }, hasRealChange); // Chỉ đánh dấu isEdit nếu có thay đổi thực sự
    },
    [foodListByShiftAndMode, mealEntries, currentBedIndex]
  );

  const handleQuantityChange = useCallback(
    (timeOfDay, index, change) => {
      const meals = mealEntries[currentBedIndex]?.[timeOfDay] || [];
      const currentMeal = meals[index];

      // Xử lý bình thường
      const oldQuantity = currentMeal?.quantity || 0;
      const newQuantity = Math.max(1, oldQuantity + change);
      const hasRealChange = oldQuantity !== newQuantity;

      // Set flag if has real change and has stt_rec
      if (hasRealChange && currentMeal?.stt_rec) {
        hasChangedInThisSession.current = true;
      }

      updateMealEntry(timeOfDay, index, (meal) => {
        // Lấy food list từ local state theo ca và chế độ hiện tại
        const key = `${timeOfDay}_${meal.mode}`;
        const foodsForThisShiftAndMode = foodListByShiftAndMode[key] || [];

        const selectedFood = foodsForThisShiftAndMode.find(
          (food) => food.ma_mon === meal.mealType
        );
        // Ưu tiên dùng giá đã có trong meal (đã load từ lịch sử), fallback giá từ danh sách món
        const price = (meal.price ?? 0) || selectedFood?.gia_ban || 0;
        meal.quantity = newQuantity;
        meal.totalMoney = meal.collectMoney ? 0 : price * newQuantity;
      }, hasRealChange); // Chỉ đánh dấu isEdit nếu số lượng thay đổi
    },
    [foodListByShiftAndMode, mealEntries, currentBedIndex]
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
      // Check if mode really changed
      const meals = mealEntries[currentBedIndex]?.[timeOfDay] || [];
      const oldMeal = meals[index];
      const hasRealChange = oldMeal?.mode !== value;

      // Set flag if has real change and has stt_rec
      if (hasRealChange && oldMeal?.stt_rec) {
        hasChangedInThisSession.current = true;
      }

      // Tìm tên chế độ từ listDietCategory
      const selectedMode = listDietCategory.find(cat => cat.ma_nh === value);
      const modeName = selectedMode?.ten_nh || "";

      updateMealEntry(timeOfDay, index, (meal) => {
        meal.mode = value;
        meal.modeName = modeName;
        // Reset meal type when mode changes
        meal.mealType = "";
        meal.mealTypeName = "";
        meal.quantity = 0;
        meal.totalMoney = 0;
      }, hasRealChange);

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
    [selectedDate, listDietCategory, updateMealEntry, currentBedIndex, mealEntries]
  );

  // Hàm để fetch food list khi user click vào dropdown món ăn
  const refetchFoodList = useCallback(
    async (timeOfDay, mode) => {
      if (!selectedDate || !mode) return;

      const key = `${timeOfDay}_${mode}`;

      // Nếu đã có trong cache, không fetch lại
      if (foodListByShiftAndMode[key]) {
        return;
      }

      try {
        const response = await multipleTablePutApi({
          store: "[api_getListFood]",
          param: {
            bn_yn: "",
            ma_ca: timeOfDay,
            ma_nh: mode,
            searchValue: "",
            ngay_an: selectedDate,
            pageindex: 1,
            pagesize: 50,
          },
          data: {},
        });

        const foodList = response?.listObject?.[0] || [];

        // Lưu food list vào cache
        setFoodListByShiftAndMode((prev) => ({
          ...prev,
          [key]: foodList
        }));
      } catch (error) {
        console.error("Lỗi fetch food list:", error);
        // Trong trường hợp lỗi, vẫn lưu array rỗng để tránh fetch lại
        setFoodListByShiftAndMode((prev) => ({
          ...prev,
          [key]: []
        }));
      }
    },
    [selectedDate, foodListByShiftAndMode]
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

          // Đảm bảo cấu trúc dữ liệu tồn tại
          if (!updatedMeals[currentBedIndex]) {
            updatedMeals[currentBedIndex] = { CA1: [], CA2: [], CA3: [] };
          }

          const bedMeals = { ...updatedMeals[currentBedIndex] };
          const meals = [...(bedMeals[timeOfDay] || [])];

          const mealToDelete = meals[index];
          const mealDate =
            selectedDate && typeof selectedDate === "string"
              ? dayjs(selectedDate, "DD/MM/YYYY").format("DD/MM/YYYY")
              : dayjs().format("DD/MM/YYYY");

          // XÓA THẬT món khỏi array (không đánh dấu status="3")
          if (meals.length === 1) {
            // Nếu chỉ còn 1 món, tạo món rỗng mới
            const newDefaultMeal = {
              ...createDefaultMeal(mealDate),
              isPaid: isPaid,
              httt: isPaid ? paymentMethod : "",
            };
            bedMeals[timeOfDay] = [newDefaultMeal];
          } else {
            // Nhiều hơn 1 món, xóa món này khỏi array
            meals.splice(index, 1);
            bedMeals[timeOfDay] = meals;
          }

          // Đánh dấu có thay đổi nếu món bị xóa có stt_rec (để biết ca này cần gửi lên server)
          if (mealToDelete?.stt_rec) {
            hasChangedInThisSession.current = true;
          }

          updatedMeals[currentBedIndex] = bedMeals;

          // Update Redux store NGAY LẬP TỨC
          dispatch(setMeal({ mealEntries: updatedMeals, bedIndex: currentBedIndex }));
          
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

  const handlePatientCheckboxChange = async (timeOfDay, index, checked) => {
    setSelectedPatientInShift((prev) => {
      const updated = { ...prev };
      if (checked) {
        updated[timeOfDay] = index;
      } else {
        delete updated[timeOfDay];
      }
      return updated;
    });

    // Nếu bỏ tích bệnh nhân, kiểm tra xem có cần fetch food list không
    const meals = mealEntries[currentBedIndex]?.[timeOfDay] || [];
    const currentMeal = meals[index];
    const mealMode = currentMeal?.mode;
    const key = `${timeOfDay}_${mealMode}`;
    
    let freshFoodList = null; // Lưu food list vừa fetch để dùng ngay
    
    // Nếu bỏ tích VÀ (chưa có food list HOẶC giá hiện tại = 0)
    if (!checked && mealMode && (!foodListByShiftAndMode[key] || currentMeal?.price === 0)) {
      try {
        const response = await multipleTablePutApi({
          store: "[api_getListFood]",
          param: {
            bn_yn: "",
            ma_ca: timeOfDay,
            ma_nh: mealMode,
            searchValue: "",
            ngay_an: selectedDate,
            pageindex: 1,
            pagesize: 50,
          },
          data: {},
        });

        freshFoodList = response?.listObject?.[0] || [];
        
        // Cập nhật cache
        setFoodListByShiftAndMode((prev) => ({
          ...prev,
          [key]: freshFoodList
        }));
      } catch (error) {
        console.error("❌ Lỗi fetch food list:", error);
      }
    }

    setMealEntries((prev) => {
      const updatedMeals = [...prev];
      const bedMeals = { ...updatedMeals[currentBedIndex] };
      const meals = [...(bedMeals[timeOfDay] || [])];

      // Lấy food list từ local state theo ca và chế độ
      const mealMode = meals[index]?.mode;
      const key = `${timeOfDay}_${mealMode}`;
      
      // Ưu tiên dùng freshFoodList (vừa fetch), nếu không có thì dùng từ cache
      const foodsForThisShiftAndMode = freshFoodList || foodListByShiftAndMode[key] || [];

      const selectedFood = foodsForThisShiftAndMode.find(
        (food) => food.ma_mon === meals[index]?.mealType
      );
      const priceFromFood = selectedFood?.gia_ban || 0;
      const currentMeal = meals[index];
      
      // Khi BỎ TÍCH bệnh nhân (checked = false), ưu tiên dùng giá từ foodList
      // Vì giá cũ có thể = 0 (do món ban đầu là bệnh nhân trả)
      const priceToUse = !checked && priceFromFood > 0 
        ? priceFromFood  // Dùng giá mới từ API
        : (currentMeal?.price || priceFromFood || 0); // Giữ giá cũ

      bedMeals[timeOfDay] = meals.map((meal, i) => {
        if (i === index) {
          const quantityToUse = meal.quantity || 1;
          
          // Tính giá cho món này
          const mealSelectedFood = foodsForThisShiftAndMode.find(
            (food) => food.ma_mon === meal.mealType
          );
          const mealPriceFromFood = mealSelectedFood?.gia_ban || 0;
          const finalPrice = !checked && mealPriceFromFood > 0 
            ? mealPriceFromFood 
            : (meal.price || mealPriceFromFood || 0);
          
          const updatedMeal = {
            ...meal,
            collectMoney: checked,
            price: finalPrice, // CẬP NHẬT giá mới
            // Khi bỏ tích bệnh nhân, tính lại theo giá MỚI
            totalMoney: checked ? 0 : finalPrice * quantityToUse,
          };
          // CHỈ đánh dấu isEdit nếu THỰC SỰ có thay đổi
          if (updatedMeal.stt_rec && meal.collectMoney !== checked) {
            updatedMeal.isEdit = true;
            hasChangedInThisSession.current = true;
          }
          return updatedMeal;
        } else {
          // CHỈ update nếu món này đang có collectMoney = true (cần bỏ tích)
          if (meal.collectMoney) {
            // Lấy giá mới từ foodList khi bỏ tích (dùng freshFoodList nếu có)
            const mealSelectedFood = foodsForThisShiftAndMode.find(
              (food) => food.ma_mon === meal.mealType
            );
            const mealPriceFromFood = mealSelectedFood?.gia_ban || 0;
            const priceToUse = mealPriceFromFood > 0 ? mealPriceFromFood : (meal.price || 0);
            const quantityToUse = meal.quantity || 1;

            const updatedMeal = {
              ...meal,
              collectMoney: false,
              price: priceToUse, // CẬP NHẬT giá mới
              totalMoney: priceToUse * quantityToUse,
            };
            // CHỈ đánh dấu isEdit nếu món này THỰC SỰ bị thay đổi
            if (meal.stt_rec) {
              updatedMeal.isEdit = true;
              hasChangedInThisSession.current = true;
            }
            return updatedMeal;
          }
          // Không thay đổi gì với món này
          return meal;
        }
      });

      updatedMeals[currentBedIndex] = bedMeals;

      // Update Redux store NGAY LẬP TỨC
      dispatch(setMeal({ mealEntries: updatedMeals, bedIndex: currentBedIndex }));

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
        // Bỏ qua món rỗng (món đã xóa được xóa thật khỏi array)
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

    // Kiểm tra xem có thay đổi thực sự không
    // 1. Có món mới (không có stt_rec)
    // 2. Có món bị sửa (isEdit = true)
    // 3. Có món bị xóa (hasChangedInThisSession = true khi xóa món có stt_rec)
    // 4. Có món đã bị hủy (status = "3") - cần khôi phục
    // 5. Có món từ history (stt_rec) - luôn mark để user có thể gửi lại nếu cần
    const hasNewMeals = ["CA1", "CA2", "CA3"].some((shift) => {
      const meals = bedMeals[shift] || [];
      return meals.some((meal) => meal.mealType && !meal.stt_rec);
    });

    const hasEditedMeals = ["CA1", "CA2", "CA3"].some((shift) => {
      const meals = bedMeals[shift] || [];
      return meals.some((meal) => meal.isEdit);
    });

    // Kiểm tra có món nào đã bị hủy (status = "3") không
    // Nếu có → LUÔN mark submitted để cho phép khôi phục đơn
    const cancelledMealsList = [];
    ["CA1", "CA2", "CA3"].forEach((shift) => {
      const meals = bedMeals[shift] || [];
      meals.forEach((meal, idx) => {
        if (meal.mealType && meal.stt_rec && (meal.status === "3" || meal.status === 3)) {
          cancelledMealsList.push({
            shift,
            index: idx,
            mealType: meal.mealType,
            status: meal.status,
            stt_rec: meal.stt_rec
          });
        }
      });
    });
    
    const hasCancelledMeals = cancelledMealsList.length > 0;

    // Logic khác nhau:
    // - Đơn đã hủy (hasCancelledMeals): LUÔN mark submitted (cho phép khôi phục)
    // - Đơn đang hoạt động: CHỈ mark khi có thay đổi thực sự
    const hasRealChanges = hasChangedInThisSession.current || hasNewMeals || hasEditedMeals;
    const hasChanges = hasCancelledMeals || hasRealChanges;

    if (hasChanges) {
      dispatch(markBedAsSubmitted(currentBedIndex));
    }

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

  // Check if all orders are cancelled (status = 3)
  const allOrdersCancelled = useMemo(() => {
    const bedMaGiuong = bedName?.ma_giuong;
    const bedMeals = mealHistory.filter((m) => m.ma_giuong?.trim() === bedMaGiuong?.trim());
    if (bedMeals.length === 0) return false;
    return bedMeals.every((m) => m.status === "3" || m.status === 3);
  }, [mealHistory, bedName]);

  const handleCancelOrder = () => {
    showConfirm({
      title: "Bạn có chắc chắn muốn huỷ đơn đã đặt?",
      onOk: async () => {
        try {
          const master = [
            {
              ngay_ct: selectedDate,
              ma_khoa: masterData.name,
              ma_phong: masterData.roomCode,
            },
          ];

          // Lấy tất cả món ăn của giường này từ history và set status = 3 để huỷ
          // Chỉ lấy món chưa bị huỷ (status !== 3)
          const cancelDetail = [];
          const bedMealsHistory = mealHistory.filter(
            (m) => m.ma_giuong?.trim() === bedName?.ma_giuong?.trim() && m.status !== "3" && m.status !== 3
          );

          bedMealsHistory.forEach((meal) => {
            const caMapping = {
              "Ca sáng": "CA1",
              "Ca trưa": "CA2",
              "Ca chiều": "CA3",
            };
            const caCode = caMapping[meal.ten_ca?.trim()];

            if (caCode && meal.stt_rec) {
              // Convert boolean/number/string sang 0/1 - hỗ trợ nhiều format
              const benhNhanYn = (meal.benh_nhan_yn === true ||
                                  meal.benh_nhan_yn === 1 ||
                                  meal.benh_nhan_yn === "1" ||
                                  meal.benh_nhan_yn === "true") ? 1 : 0;
              const thuTienYn = (meal.thu_tien_yn === true ||
                                meal.thu_tien_yn === 1 ||
                                meal.thu_tien_yn === "1" ||
                                meal.thu_tien_yn === "true" ||
                                meal.thu_tien === true) ? 1 : 0;

              cancelDetail.push({
                ma_giuong: bedName.ma_giuong,
                ma_ca: caCode,
                ma_che_do: meal.ma_che_do || "",
                ma_mon: meal.ma_mon || "",
                so_luong: meal.so_luong || 1,
                don_gia: meal.don_gia || meal.gia_ban || 0,
                thanh_tien: meal.thanh_tien || 0,
                // Convert sang 0/1
                benh_nhan_yn: benhNhanYn,
                ghi_chu: meal.ghi_chu || "",
                thu_tien_yn: thuTienYn,
                httt: meal.httt || "",
                stt_rec: meal.stt_rec || "",
                stt_rec0: meal.stt_rec0 || "",
                status: "3", // Status 3 để huỷ đơn
                so_ct: meal.so_ct || "",
              });
            }
          });

          if (cancelDetail.length === 0) {
            notification.warning({ message: "Không tìm thấy đơn để huỷ!" });
            return;
          }

          const response = await apiProcessCombinedMealOrder({
            StoreID: masterData.name,
            unitId: unitId,
            userId: userId,
            masterData: master,
            detailData: cancelDetail,
          });

          if (response?.responseModel?.isSucceded) {
            const sttRecList = JSON.parse(
              response?.listObject?.[0]?.[0]?.list_stt_rec || "[]"
            );
            if (Array.isArray(sttRecList) && sttRecList.length > 0) {
              await syncFastMutiApi(sttRecList, userId);
            }
            notification.success({ message: "Huỷ đơn thành công!" });

            // Fetch lại api_getMealDetailsByDepartmentRoomBed để cập nhật data
            try {
              const reloadResponse = await multipleTablePutApi({
                store: "api_getMealDetailsByDepartmentRoomBed",
                param: {
                  ngay_ct: selectedDate,
                  ma_bp: masterData.name,
                  ma_phong: masterData.roomCode,
                  username: userName,
                },
                data: {},
              });

              // Cập nhật mealHistory với data mới
              if (Array.isArray(reloadResponse?.listObject)) {
                dispatch(setMealHistory(reloadResponse.listObject));
              }
              
              // Clear detailData của giường hiện tại để force reload khi click lại
              const updatedDetailData = [...mealEntries];
              updatedDetailData[currentBedIndex] = {
                CA1: [],
                CA2: [],
                CA3: [],
              };
              dispatch(setMeal({ mealEntries: updatedDetailData, bedIndex: currentBedIndex }));
              
              // Reload submittedBeds từ Redux để clear mark "đã sửa" nếu có
              // (sẽ được fetch lại từ RoomSelectionForm khi reload beds)
              dispatch(setSubmittedBeds([]));
            } catch (error) {
              console.error("Lỗi reload data sau khi hủy đơn:", error);
            }

            // Chuyển về RoomSelectionForm
            dispatch(setShowMealDetails(false));
            dispatch(setShowRoomSelection(true));
          } else {
            notification.warning({ message: response?.responseModel?.message || "Huỷ đơn thất bại!" });
          }
        } catch (error) {
          console.error("Lỗi khi huỷ đơn:", error);
          notification.error({ message: "Có lỗi xảy ra khi huỷ đơn!" });
        }
      },
    });
  };

  // Hàm hủy một ca cụ thể
  const handleCancelShift = (shift) => {
    const shiftName = shift === "CA1" ? "Ca sáng" : shift === "CA2" ? "Ca trưa" : "Ca chiều";
    
    showConfirm({
      title: `Bạn có chắc chắn muốn huỷ ${shiftName}?`,
      onOk: async () => {
        try {
          const master = [
            {
              ngay_ct: selectedDate,
              ma_khoa: masterData.name,
              ma_phong: masterData.roomCode,
            },
          ];

          // Lấy món ăn của CA này từ history và set status = 3 để huỷ
          // Chỉ lấy món chưa bị huỷ (status !== 3)
          const caMapping = {
            "Ca sáng": "CA1",
            "Ca trưa": "CA2",
            "Ca chiều": "CA3",
          };
          const shiftLabel = shift === "CA1" ? "Ca sáng" : shift === "CA2" ? "Ca trưa" : "Ca chiều";
          
          const cancelDetail = [];
          const shiftMealsHistory = mealHistory.filter(
            (m) => m.ma_giuong?.trim() === bedName?.ma_giuong?.trim() 
                && m.ten_ca?.trim() === shiftLabel
                && m.status !== "3" && m.status !== 3
          );

          shiftMealsHistory.forEach((meal) => {
            if (meal.stt_rec) {
              // Convert boolean/number/string sang 0/1
              const benhNhanYn = (meal.benh_nhan_yn === true ||
                                  meal.benh_nhan_yn === 1 ||
                                  meal.benh_nhan_yn === "1" ||
                                  meal.benh_nhan_yn === "true") ? 1 : 0;
              const thuTienYn = (meal.thu_tien_yn === true ||
                                meal.thu_tien_yn === 1 ||
                                meal.thu_tien_yn === "1" ||
                                meal.thu_tien_yn === "true" ||
                                meal.thu_tien === true) ? 1 : 0;

              cancelDetail.push({
                ma_giuong: bedName.ma_giuong,
                ma_ca: shift,
                ma_che_do: meal.ma_che_do || "",
                ma_mon: meal.ma_mon || "",
                so_luong: meal.so_luong || 1,
                don_gia: meal.don_gia || meal.gia_ban || 0,
                thanh_tien: meal.thanh_tien || 0,
                benh_nhan_yn: benhNhanYn,
                ghi_chu: meal.ghi_chu || "",
                thu_tien_yn: thuTienYn,
                httt: meal.httt || "",
                stt_rec: meal.stt_rec || "",
                stt_rec0: meal.stt_rec0 || "",
                status: "3", // Status 3 để huỷ ca
                so_ct: meal.so_ct || "",
              });
            }
          });

          if (cancelDetail.length === 0) {
            notification.warning({ message: `Không tìm thấy món nào để huỷ trong ${shiftName}!` });
            return;
          }

          const response = await apiProcessCombinedMealOrder({
            StoreID: masterData.name,
            unitId: unitId,
            userId: userId,
            masterData: master,
            detailData: cancelDetail,
          });

          if (response?.responseModel?.isSucceded) {
            const sttRecList = JSON.parse(
              response?.listObject?.[0]?.[0]?.list_stt_rec || "[]"
            );
            if (Array.isArray(sttRecList) && sttRecList.length > 0) {
              await syncFastMutiApi(sttRecList, userId);
            }
            notification.success({ message: `Huỷ ${shiftName} thành công!` });

            // Fetch lại data và clear cache
            try {
              const reloadResponse = await multipleTablePutApi({
                store: "api_getMealDetailsByDepartmentRoomBed",
                param: {
                  ngay_ct: selectedDate,
                  ma_bp: masterData.name,
                  ma_phong: masterData.roomCode,
                  username: userName,
                },
                data: {},
              });

              if (Array.isArray(reloadResponse?.listObject)) {
                dispatch(setMealHistory(reloadResponse.listObject));
              }
              
              // Clear detailData của giường hiện tại
              const updatedDetailData = [...mealEntries];
              updatedDetailData[currentBedIndex] = {
                CA1: [],
                CA2: [],
                CA3: [],
              };
              dispatch(setMeal({ mealEntries: updatedDetailData, bedIndex: currentBedIndex }));
              dispatch(setSubmittedBeds([]));
            } catch (error) {
              console.error("Lỗi reload data sau khi hủy ca:", error);
            }

            // Quay về RoomSelectionForm
            dispatch(setShowMealDetails(false));
            dispatch(setShowRoomSelection(true));
          } else {
            notification.warning({ message: response?.responseModel?.message || `Huỷ ${shiftName} thất bại!` });
          }
        } catch (error) {
          console.error("Lỗi khi huỷ ca:", error);
          notification.error({ message: "Có lỗi xảy ra khi huỷ ca!" });
        }
      },
    });
  };

  // Check xem ca này có món chưa bị hủy không (để hiện nút "Hủy ca")
  const hasActiveShiftMeals = useCallback((shift) => {
    const shiftLabel = shift === "CA1" ? "Ca sáng" : shift === "CA2" ? "Ca trưa" : "Ca chiều";
    const bedMaGiuong = bedName?.ma_giuong;
    
    const shiftMeals = mealHistory.filter(
      (m) => m.ma_giuong?.trim() === bedMaGiuong?.trim() 
          && m.ten_ca?.trim() === shiftLabel
          && m.status !== "3" && m.status !== 3
    );
    
    return shiftMeals.length > 0;
  }, [mealHistory, bedName]);

  // Check xem ca này đã bị hủy toàn bộ chưa (để hiện badge "Đã hủy")
  const isShiftCancelled = useCallback((shift) => {
    const shiftLabel = shift === "CA1" ? "Ca sáng" : shift === "CA2" ? "Ca trưa" : "Ca chiều";
    const bedMaGiuong = bedName?.ma_giuong;
    
    const allShiftMeals = mealHistory.filter(
      (m) => m.ma_giuong?.trim() === bedMaGiuong?.trim() 
          && m.ten_ca?.trim() === shiftLabel
    );
    
    // Ca đã hủy nếu: có món VÀ TẤT CẢ đều bị hủy
    if (allShiftMeals.length === 0) return false;
    
    return allShiftMeals.every((m) => m.status === "3" || m.status === 3);
  }, [mealHistory, bedName]);

  const renderedMealEntries = useMemo(() => {
    const bedMeals = mealEntries[currentBedIndex] || {};
    const result = {};

    ["CA1", "CA2", "CA3"].forEach((shift) => {
      const entries = bedMeals[shift] || [];
      const selectedIndex = selectedPatientInShift[shift]; // Lấy index của suất ăn được chọn trong ca

      // Món đã bị xóa thật khỏi array, không cần filter status="3"
      result[shift] = entries.map((meal, index) => (
        <MealEntryRow
          key={`${shift}-${index}-${meal.mealType || 'empty'}`}
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
          refetchDietCategory={refetchDietCategory}
          refetchFoodList={refetchFoodList}
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
    handlePatientCheckboxChange,
    refetchDietCategory,
    refetchFoodList,
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
        onChange={(key) => {
          setActiveTab(key);
          // Force re-render khi chuyển tab
          setMealEntries(prev => [...prev]);
        }}
      >
        {listMealCode.map((meal) => (
          <TabPane
            tab={`${meal.ten_ca}
            - ${formatNumber(calculateTotalByShift(meal.ma_ca))} đ
            `}
            key={meal.ma_ca}
          >
            <div>
              {/* Nút Hủy ca hoặc Badge Đã hủy - góc phải trên */}
              <div style={{ 
                display: 'flex',
                justifyContent: 'flex-end',
                marginBottom: '8px',
              }}>
                {hasActiveShiftMeals(meal.ma_ca) ? (
                  <button
                    onClick={() => handleCancelShift(meal.ma_ca)}
                    style={{
                      padding: '4px 12px',
                      fontSize: '11px',
                      backgroundColor: '#ff4d4f',
                      color: 'white',
                      border: 'none',
                      borderRadius: '3px',
                      cursor: 'pointer',
                      fontWeight: '500',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#ff7875';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#ff4d4f';
                    }}
                  >
                    Huỷ ca
                  </button>
                ) : isShiftCancelled(meal.ma_ca) ? (
                  <span
                    style={{
                      padding: '4px 12px',
                      fontSize: '11px',
                      backgroundColor: '#ffa39e',
                      color: '#820014',
                      borderRadius: '3px',
                      fontWeight: '500',
                      display: 'inline-block',
                    }}
                  >
                    Đã hủy
                  </span>
                ) : null}
              </div>
              
              {renderedMealEntries[meal.ma_ca]}
              
              {/* Nút + thêm món - giữ nguyên vị trí */}
              <button
                className="add-row-button"
                onClick={() => handleAddMeal(meal.ma_ca)}
              >
                <PlusOutlined />
              </button>
            </div>
          </TabPane>
        ))}
      </Tabs>
      <div style={{ marginTop: 16 }}>
        <Checkbox
          checked={isPaid}
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
                ).map((meal) => {
                  const hasIsPaidChanged = meal.isPaid !== newIsPaid;
                  const shouldMarkAsEdit = meal.stt_rec && hasIsPaidChanged;

                  if (shouldMarkAsEdit) {
                    hasChangedInThisSession.current = true;
                  }

                  return {
                    ...meal,
                    isPaid: newIsPaid,
                    httt: newIsPaid ? "chuyen_khoan" : "",
                    isEdit: shouldMarkAsEdit ? true : meal.isEdit,
                  };
                });
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
              // Đánh dấu giường này vừa được toggle thu tiền trong phiên hiện tại
              dispatch(setBedPaymentToggled({ bedIndex: currentBedIndex, toggled: newIsPaid }));
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
        {/* Hiển thị nút Hủy đơn nếu có đơn và chưa bị hủy toàn bộ */}
        {hasExistingOrder && !allOrdersCancelled && (
          <button
            className="cancel-button"
            onClick={handleCancelOrder}
          >
            Huỷ đơn
          </button>
        )}


        {/* Luôn hiển thị nút Hoàn thành */}
        <button
          className="submit-button"
          onClick={handleSubmit}
        >
          Hoàn thành
        </button>
      </div>
    </div>
  );
};

export default MealDetailsForm;
