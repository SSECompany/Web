import { RightOutlined } from "@ant-design/icons";
import { DatePicker, notification, Select } from "antd";
import dayjs from "dayjs";
import _ from "lodash";
import debounce from "lodash/debounce";
import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
    addDataMultiObjectApi,
    apiProcessCombinedMealOrder,
    multipleTablePutApi,
    syncFastMutiApi,
} from "../../../../api";
import {
    markBedAsSubmitted,
    resetAllMeals,
    setCurrentBedIndex,
    setListBeds,
    setListDepartment,
    setListRoom,
    setMasterData,
    setMeal,
    setMealHistory,
    setRoomCode,
    setRoomSelectedDate,
    setShowMealDetails,
    setShowRoomSelection,
    setSubmittedBeds
} from "../../store/meal";
import "./RoomSelectionForm.css";

const { Option } = Select;

const RoomSelectionForm = () => {
  const dispatch = useDispatch();
  const dateFormat = "DD/MM/YYYY";
  const [searchDepartment, setSearchDepartment] = useState("");
  const [searchRoom, setSearchRoom] = useState("");
  const [loadingDepartment, setLoadingDepartment] = useState(false);
  const [loadingRoom, setLoadingRoom] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    meals: { masterData = {}, detailData = [] },
    listDepartment = [],
    listRoom = [],
    listBeds = [],
    submittedBeds = [],
    listFood = [],
    listDietCategory = [],
    roomSelectedDate,
  } = useSelector((state) => state.meals);
  const { userName, unitId, id } = useSelector(
    (state) => state.claimsReducer.userInfo || {}
  );
  const mealHistory = useSelector((state) => state.meals.mealHistory || []);
  const lastLoadedDateRef = useRef(null);
  const lastRoomCodeRef = useRef(null);
  const fetchedModesRef = useRef(new Set());

  // Đặt handleDepartmentSearch và handleRoomSearch lên trước useEffect debounce
  const handleDepartmentSearch = useCallback(
    async (value) => {
      if (!userName) {
        console.warn("⚠️ Username chưa load xong, không gọi API.");
        return;
      }

      setSearchDepartment(value);
      setLoadingDepartment(true);

      try {
        const response = await addDataMultiObjectApi({
          store: "api_getDepartmentRoomService",
          param: {
            mabp: "",
            maphong: "",
            searchValue: value,
            username: userName,
          },
          data: {},
          resultSetNames: ["phong", "giuong", "list3"],
        });

        const departmentList = response?.listObject?.dataLists?.phong || [];
        dispatch(setListDepartment(departmentList));
      } catch (error) {
        console.error("❌ Error searching departments:", error);
      } finally {
        setLoadingDepartment(false);
      }
    },
    [dispatch, userName]
  );

  const handleRoomSearch = useCallback(
    async (value) => {
      if (!userName || !masterData.name) {
        console.warn("⚠️ Username hoặc Mã khoa chưa load xong, không gọi API.");
        return;
      }

      setSearchRoom(value);
      setLoadingRoom(true);

      try {
        const response = await addDataMultiObjectApi({
          store: "api_getDepartmentRoomService",
          param: {
            mabp: masterData.name,
            maphong: "",
            searchValue: value,
            username: userName,
          },
          data: {},
          resultSetNames: ["phong", "giuong", "list3"],
        });

        const roomList = response?.listObject?.dataLists?.giuong || [];
        dispatch(setListRoom(roomList));
      } catch (error) {
        console.error("❌ Error searching rooms:", error);
      } finally {
        setLoadingRoom(false);
      }
    },
    [dispatch, userName, masterData.name]
  );

  // Debounced search handlers
  const debouncedDepartmentSearch = useRef();
  const debouncedRoomSearch = useRef();

  useEffect(() => {
    debouncedDepartmentSearch.current = debounce((value) => {
      handleDepartmentSearch(value);
    }, 400);
    debouncedRoomSearch.current = debounce((value) => {
      handleRoomSearch(value);
    }, 400);
    return () => {
      debouncedDepartmentSearch.current.cancel();
      debouncedRoomSearch.current.cancel();
    };
  }, [handleDepartmentSearch, handleRoomSearch]);

  useEffect(() => {
    if (!roomSelectedDate) {
      const tomorrow = dayjs().add(1, "day").format(dateFormat);
      dispatch(setRoomSelectedDate(tomorrow));
    } else if (masterData.roomCode) {
      loadBedsWithMeals(masterData.roomCode, roomSelectedDate);
    }
  }, [roomSelectedDate, masterData.roomCode]);

  const handleBedClick = useCallback(
    (bed, index) => {
      dispatch(setMasterData({ beds: [bed] }));
      dispatch(setCurrentBedIndex(index));

      // Check if this bed has meal history data (không bao gồm đơn đã huỷ)
      // Khi giường có đơn đã huỷ, không load dữ liệu cũ - để form trống cho tạo mới
      const bedMealsHistory = mealHistory.filter(
        (m) => m.ma_giuong?.trim() === bed.ma_giuong?.trim() && m.status !== "3" && m.status !== 3
      );

      if (bedMealsHistory.length > 0) {
        // Convert history data to detail data format
        const convertedMeals = {
          CA1: [],
          CA2: [],
          CA3: [],
        };

        // Map ca labels to CA codes
        const caMapping = {
          "Ca sáng": "CA1",
          "Ca trưa": "CA2",
          "Ca chiều": "CA3",
        };

        bedMealsHistory.forEach((meal) => {
          const caCode = caMapping[meal.ten_ca?.trim()];
          if (caCode) {
            // Extract ma_che_do from ten_che_do (e.g., "BT01-Cơm bình thường" -> "BT01")
            const maCheDoMatch = meal.ten_che_do?.match(/^([^-]+)/);
            const maCheDoExtracted = maCheDoMatch ? maCheDoMatch[1].trim() : "";

            // Use data directly from API response
            // Backend should provide: ma_mon, ma_che_do, don_gia/gia_ban
            const maMon = meal.ma_mon || meal.ten_mon; // Fallback to ten_mon if ma_mon not provided yet
            const price = meal.don_gia || meal.gia_ban || 0;
            const quantity = meal.so_luong || 1;

            convertedMeals[caCode].push({
              mode: meal.ma_che_do || maCheDoExtracted,
              mealType: maMon,
              mealTypeName: meal.ten_mon || "",
              quantity: quantity,
              note: meal.ghi_chu || "",
              collectMoney: false,
              totalMoney: quantity * price,
              price: price,
              isPaid: meal.thu_tien ? true : false,
              httt: meal.httt || "",
              date: roomSelectedDate,
              // Lưu thêm field để update
              stt_rec: meal.stt_rec || "",
              stt_rec0: meal.stt_rec0 || "",
              status: meal.status || "0",
              so_ct: meal.so_ct || "",
            });
          }
        });

        // Ensure each shift has at least one meal entry
        ["CA1", "CA2", "CA3"].forEach((shift) => {
          if (convertedMeals[shift].length === 0) {
            convertedMeals[shift].push({
              mode: "",
              mealType: "",
              mealTypeName: "",
              quantity: 0,
              note: "",
              collectMoney: false,
              totalMoney: 0,
              price: 0,
              isPaid: false,
              httt: "",
              date: roomSelectedDate,
              // Empty cho meal mới
              stt_rec: "",
              stt_rec0: "",
              status: "0",
              so_ct: "",
            });
          }
        });

        // Update the meal data in Redux
        const updatedDetailData = [...detailData];
        updatedDetailData[index] = convertedMeals;
        dispatch(setMeal({ mealEntries: updatedDetailData, bedIndex: index }));
      } else {
        // Giường không có history - tạo data rỗng mới
        const emptyMeals = {
          CA1: [{
            mode: "",
            mealType: "",
            mealTypeName: "",
            quantity: 0,
            note: "",
            collectMoney: false,
            totalMoney: 0,
            price: 0,
            isPaid: false,
            httt: "",
            date: roomSelectedDate,
            stt_rec: "",
            stt_rec0: "",
            status: "0",
            so_ct: "",
          }],
          CA2: [{
            mode: "",
            mealType: "",
            mealTypeName: "",
            quantity: 0,
            note: "",
            collectMoney: false,
            totalMoney: 0,
            price: 0,
            isPaid: false,
            httt: "",
            date: roomSelectedDate,
            stt_rec: "",
            stt_rec0: "",
            status: "0",
            so_ct: "",
          }],
          CA3: [{
            mode: "",
            mealType: "",
            mealTypeName: "",
            quantity: 0,
            note: "",
            collectMoney: false,
            totalMoney: 0,
            price: 0,
            isPaid: false,
            httt: "",
            date: roomSelectedDate,
            stt_rec: "",
            stt_rec0: "",
            status: "0",
            so_ct: "",
          }],
        };

        // Clear old data and set new empty data
        const updatedDetailData = [...detailData];
        updatedDetailData[index] = emptyMeals;
        dispatch(setMeal({ mealEntries: updatedDetailData, bedIndex: index }));
      }

      dispatch(setShowMealDetails(true));
      dispatch(setShowRoomSelection(false));
    },
    [dispatch, mealHistory, roomSelectedDate, detailData]
  );

  const loadBedsWithMeals = async (roomCode, date) => {
    dispatch(setRoomCode(roomCode));
    try {
      const [bedResponse, mealResponse] = await Promise.all([
        addDataMultiObjectApi({
          store: "api_getDepartmentRoomService",
          param: {
            mabp: masterData.name,
            maphong: roomCode,
            searchValue: "",
            username: userName,
          },
          data: {},
          resultSetNames: ["phong", "giuong", "list3"],
        }),
        multipleTablePutApi({
          store: "api_getMealDetailsByDepartmentRoomBed",
          param: {
            ngay_ct: date,
            ma_bp: masterData.name,
            ma_phong: roomCode,
            username: userName,
          },
          data: {},
        }),
      ]);

      const bedList = bedResponse?.listObject?.dataLists?.list3 || [];
      dispatch(setListBeds(bedList));

      if (Array.isArray(mealResponse?.listObject)) {
        dispatch(setMealHistory(mealResponse.listObject));
      }
      const bedMealMap = mealResponse?.listObject?.bedMealMap || [];

      bedMealMap.forEach((meals, i) => {
        const { CA1, CA2, CA3 } = meals || {};
        if (
          [...(CA1 || []), ...(CA2 || []), ...(CA3 || [])].some(
            (m) => m.mode || m.mealType
          )
        ) {
          dispatch(markBedAsSubmitted(i));
        }
      });

      const filteredMealMap = bedMealMap.map((m) => ({
        CA1: Array.isArray(m?.CA1) ? m.CA1 : [],
        CA2: Array.isArray(m?.CA2) ? m.CA2 : [],
        CA3: Array.isArray(m?.CA3) ? m.CA3 : [],
      }));

      const hasAnyMeal = filteredMealMap.some((meals) =>
        [...meals.CA1, ...meals.CA2, ...meals.CA3].some(
          (m) => m.mode || m.mealType
        )
      );

      if (hasAnyMeal) {
        dispatch(setMeal({ mealEntries: filteredMealMap }));
      } else {
        console.warn("⚠️ Không gọi setMeal vì không có suất ăn nào hợp lệ.");
      }
    } catch (error) {
      console.error("❌ Lỗi khi gọi song song API:", error);
      dispatch(setListBeds([]));
    }
  };

  const handleRoomChange = useCallback(
    (value) => {
      dispatch(setListBeds([]));

      const updatedMasterData = { ...masterData, roomCode: value };
      dispatch(setMasterData(updatedMasterData));
      lastRoomCodeRef.current = null;

      const date = roomSelectedDate || dayjs().format(dateFormat);
      if (updatedMasterData.name && value) {
        loadBedsWithMeals(value, date);
      }
    },
    [masterData, roomSelectedDate]
  );

  const handleDepartmentChange = useCallback(
    async (value) => {
      if (!userName) {
        console.warn("⚠️ Username chưa load xong, không gọi API.");
        return;
      }

      dispatch(setMasterData({ name: value, roomCode: "", beds: [] }));
      dispatch(setListBeds([]));
      dispatch(setListRoom([]));
      lastRoomCodeRef.current = null;
      lastLoadedDateRef.current = null;

      try {
        const response = await addDataMultiObjectApi({
          store: "api_getDepartmentRoomService",
          param: {
            mabp: value,
            maphong: "",
            searchValue: "",
            username: userName,
          },
          data: {},
          resultSetNames: ["phong", "giuong", "list3"],
        });

        const roomList = response?.listObject?.dataLists?.giuong || [];
        dispatch(setListRoom(roomList));
      } catch (error) {
        console.error("❌ Error fetching room list by department:", error);
        dispatch(setListRoom([]));
      }
    },
    [dispatch, userName]
  );

  useEffect(() => {
    if (masterData.roomCode && Array.isArray(listBeds)) {
      const filteredBeds = listBeds.filter(
        (b) => b.ma_phong?.trim() === masterData.roomCode
      );
      const isSame = _.isEqual(filteredBeds, listBeds);

      if (!isSame) {
        dispatch(setListBeds(filteredBeds));
      }
    }
  }, [masterData.roomCode, listBeds, dispatch]);

  useEffect(() => {
    if (!roomSelectedDate || !masterData.roomCode) return;

    const currentDate = roomSelectedDate;
    const lastDate = lastLoadedDateRef.current;
    const lastRoomCode = lastRoomCodeRef.current;

    if (lastDate === null && lastRoomCode === null) {
      lastLoadedDateRef.current = currentDate;
      lastRoomCodeRef.current = masterData.roomCode;
      return;
    }

    if (currentDate !== lastDate || masterData.roomCode !== lastRoomCode) {
      lastLoadedDateRef.current = currentDate;
      lastRoomCodeRef.current = masterData.roomCode;
      loadBedsWithMeals(masterData.roomCode, currentDate);
    }
  }, [roomSelectedDate, masterData.roomCode]);

  const handleSubmit = useCallback(async () => {
    if (isSubmitting) {
      notification.warning({ message: "Đang xử lý, vui lòng đợi..." });
      return;
    }

    if (!masterData.name || !masterData.roomCode) {
      console.warn("⚠️ Vui lòng chọn đủ Mã khoa và Mã phòng trước khi gửi.");
      return;
    }

    if (!Array.isArray(detailData) || detailData.length === 0) {
      console.warn("⚠️ Chưa có dữ liệu suất ăn để gửi.");
      return;
    }

    const master = [
      {
        ngay_ct: roomSelectedDate,
        ma_khoa: masterData.name,
        ma_phong: masterData.roomCode,
      },
    ];

    // Gửi tất cả các món ăn của các giường có thay đổi (cả 3 ca)
    const filteredDetail = [];
    let hasAnyChanges = false;

    detailData.forEach((bedMeals, bedIndex) => {
      const bed = listBeds[bedIndex];
      if (!bed || !bedMeals) return;

      // Kiểm tra xem giường này có món nào được chỉnh sửa hoặc là món mới không
      // Bao gồm cả đơn đã huỷ (không có stt_rec do đã xóa khi load)
      const hasChanges = ["CA1", "CA2", "CA3"].some((shift) => {
        const meals = bedMeals[shift] || [];
        return meals.some((meal) => meal.mealType && (!meal.stt_rec || meal.isEdit));
      });

      // Nếu giường này có thay đổi, gửi TẤT CẢ các món ăn của cả 3 ca
      if (hasChanges) {
        hasAnyChanges = true;
        ["CA1", "CA2", "CA3"].forEach((shift) => {
          const meals = bedMeals[shift] || [];
          meals.forEach((meal) => {
            if (!meal.mealType) return;
            filteredDetail.push({
              ma_giuong: bed.ma_giuong,
              ma_ca: shift,
              ma_che_do: meal.mode || "",
              ma_mon: meal.mealType,
              so_luong: meal.quantity,
              don_gia: meal.price || 0,
              thanh_tien: meal.totalMoney || 0,
              benh_nhan_yn: meal.collectMoney ? 1 : 0,
              ghi_chu: meal.note || "",
              thu_tien_yn: meal.isPaid ? 1 : 0,
              httt: meal.httt || "",
              stt_rec: meal.stt_rec || "",
              stt_rec0: meal.stt_rec0 || "",
              status: meal.status || "0",
              so_ct: meal.so_ct || "",
            });
          });
        });
      }
    });

    // Kiểm tra nếu không có thay đổi gì thì không gửi
    if (!hasAnyChanges || filteredDetail.length === 0) {
      notification.warning({ message: "Không có thay đổi nào để lưu!" });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await apiProcessCombinedMealOrder({
        StoreID: masterData.name,
        unitId: unitId,
        userId: id,
        masterData: master,
        detailData: filteredDetail,
      });

      if (response?.responseModel?.isSucceded) {
        const sttRecList = JSON.parse(
          response?.listObject?.[0]?.[0]?.list_stt_rec || "[]"
        );
        if (Array.isArray(sttRecList) && sttRecList.length > 0) {
          await syncFastMutiApi(sttRecList, id);
        }
        notification.success({ message: "Đăng ký thành công !" });
        setTimeout(() => {
          dispatch(resetAllMeals());
          dispatch(setMasterData({ name: "", roomCode: "", beds: [] }));
          dispatch(setShowMealDetails(false));
          dispatch(setShowRoomSelection(true));
          setIsSubmitting(false);
        }, 500);
      } else {
        notification.warning({ message: response?.responseModel?.message });
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error("Lỗi gửi đơn hàng:", error);
      notification.error({ message: "Có lỗi xảy ra, vui lòng thử lại!" });
      setIsSubmitting(false);
    }
  }, [masterData, detailData, listBeds, roomSelectedDate, isSubmitting]);

  const handleDateChange = (date) => {
    if (!date || !dayjs(date).isValid()) return;

    // Check if the selected date is before today
    if (date.isBefore(dayjs().startOf("day"))) {
      notification.warning({ message: "Không thể chọn ngày trong quá khứ!" });
      return;
    }

    const formattedDate = date.format(dateFormat);
    dispatch(setRoomSelectedDate(formattedDate));

    dispatch(setMeal({ mealEntries: [] }));
    dispatch(setSubmittedBeds([]));

    if (masterData.roomCode) {
      loadBedsWithMeals(masterData.roomCode, formattedDate);
    } else {
      console.warn("⚠️ Không gọi loadBedsWithMeals vì chưa chọn Mã phòng.");
    }
  };

  const isBedInMealHistory = (ma_giuong) => {
    return mealHistory.some((m) => m.ma_giuong?.trim() === ma_giuong?.trim());
  };

  const getBedStatus = (ma_giuong) => {
    const bedMeals = mealHistory.filter(
      (m) => m.ma_giuong?.trim() === ma_giuong?.trim()
    );

    if (bedMeals.length === 0) return null;

    // Đếm số món đã huỷ và chưa huỷ
    const cancelledCount = bedMeals.filter(m => m.status === "3" || m.status === 3).length;
    const activeCount = bedMeals.filter(m => m.status !== "3" && m.status !== 3).length;

    if (cancelledCount > 0 && activeCount === 0) {
      // TẤT CẢ đều đã huỷ
      return "all_cancelled";
    } else if (cancelledCount > 0 && activeCount > 0) {
      // Có CẢ món đã huỷ và món active
      return "partial_cancelled";
    }

    // Chỉ có món active
    return "ordered";
  };

  const getBedMealsFromHistory = (ma_giuong, caLabel) => {
    // Trả về TẤT CẢ món ăn, kể cả món đã huỷ
    return mealHistory.filter(
      (m) => m.ma_giuong === ma_giuong && m.ten_ca?.trim() === caLabel
    );
  };

  const getPaymentMethodText = (httt) => {
    if (httt === "tien_mat") return "Tiền mặt";
    if (httt === "chuyen_khoan") return "Chuyển khoản";
    return "Chưa chọn";
  };

  return (
    <div className="form-container">
      <div className="centered-group">
        <h2 className="form-title" style={{ marginBottom: 8 }}>
          Đăng ký suất ăn
        </h2>
        <div className="room-datepicker">
          <DatePicker
            id="date-picker"
            value={
              roomSelectedDate ? dayjs(roomSelectedDate, dateFormat) : null
            }
            onChange={handleDateChange}
            format={dateFormat}
            className="room-date-picker-input"
            disabledDate={(current) =>
              current && current < dayjs().startOf("day")
            }
          />
        </div>
      </div>

      <div className="input-group">
        <label htmlFor="name">Mã Khoa:</label>
        <Select
          id="name"
          name="name"
          value={masterData.name}
          onChange={handleDepartmentChange}
          onSearch={debouncedDepartmentSearch.current}
          showSearch
          filterOption={false}
          loading={loadingDepartment}
          className="custom-select"
          placeholder="Tìm kiếm Mã Khoa"
        >
          <Option value="">Select Mã Khoa</Option>
          {listDepartment.map((dept) => (
            <Option key={dept.ma_bp?.trim?.()} value={dept.ma_bp?.trim?.()}>
              {dept.ten_bp}
            </Option>
          ))}
        </Select>
      </div>

      <div className="input-group">
        <label htmlFor="roomCode">Mã Phòng:</label>
        <Select
          id="roomCode"
          name="roomCode"
          value={masterData.roomCode}
          onChange={handleRoomChange}
          onSearch={debouncedRoomSearch.current}
          showSearch
          filterOption={false}
          loading={loadingRoom}
          className="custom-select"
          placeholder="Tìm kiếm Mã Phòng"
          disabled={!masterData.name}
        >
          <Option value="">Select Mã Phòng</Option>
          {listRoom.map((room) => {
            const maPhong = room?.ma_phong?.trim?.() || "";
            return (
              <Option key={maPhong} value={maPhong}>
                {room?.ten_phong}
              </Option>
            );
          })}
        </Select>
      </div>

      {Array.isArray(listBeds) && listBeds.length > 0 && (
        <div className="list-items">
          {listBeds.map((bed, index) => {
            const isSubmitted = submittedBeds.includes(index);
            const bedStatus = getBedStatus(bed.ma_giuong);
            const isDisabled = bedStatus === "ordered" || bedStatus === "partial_cancelled";
            const isCancelled = bedStatus === "all_cancelled";
            const isPartialCancelled = bedStatus === "partial_cancelled";

            return (
              <div key={index}>
                <div
                  className={`list-item ${isDisabled ? 'bed-already-ordered' : ''}`}
                  onClick={() => handleBedClick(bed, index)}
                  style={{
                    backgroundColor: isCancelled
                      ? "#fff1f0"   // Màu đỏ nhạt cho đơn đã huỷ toàn bộ
                      : isPartialCancelled
                      ? "#fffbe6"   // Màu vàng nhạt cho đơn có một phần huỷ
                      : isDisabled
                      ? "#fff3e0"   // Màu cam nhạt cho đơn đã đặt
                      : isSubmitted
                      ? "#e6fffb"   // Màu xanh nhạt cho đơn mới submit
                      : "white",
                    cursor: "pointer",
                    opacity: isCancelled ? 0.7 : 1,
                    borderColor: isCancelled ? "#ff4d4f" : isPartialCancelled ? "#faad14" : isDisabled ? "#ff9800" : "#ddd",
                    borderWidth: isDisabled || isCancelled ? "2px" : "1px",
                  }}
                >
                  <span style={{ fontWeight: isDisabled || isCancelled ? "600" : "500" }}>
                    {bed?.ten_giuong}
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    {bedStatus === "ordered" && (
                      <span className="bed-status-badge" style={{
                        backgroundColor: "#ff9800",
                        color: "white",
                        padding: "2px 8px",
                        borderRadius: "4px",
                        fontSize: "12px"
                      }}>
                        Đã đặt
                      </span>
                    )}
                    {isPartialCancelled && (
                      <span className="bed-status-badge" style={{
                        backgroundColor: "#faad14",
                        color: "white",
                        padding: "2px 8px",
                        borderRadius: "4px",
                        fontSize: "12px"
                      }}>
                        Có món đã huỷ
                      </span>
                    )}
                    {isCancelled && (
                      <span className="bed-status-badge" style={{
                        backgroundColor: "#ff4d4f",
                        color: "white",
                        padding: "2px 8px",
                        borderRadius: "4px",
                        fontSize: "12px"
                      }}>
                        Đã huỷ toàn bộ
                      </span>
                    )}
                    <RightOutlined style={{ fontSize: "18px", color: isCancelled ? "#ff4d4f" : isPartialCancelled ? "#faad14" : isDisabled ? "#ff9800" : "#4caf50" }} />
                  </div>
                </div>

                {(isDisabled || isCancelled) && (
                  <div className="submitted-item">
                    {["Ca sáng", "Ca trưa", "Ca chiều"].map((caLabel) => {
                      const caMeals = getBedMealsFromHistory(
                        bed.ma_giuong,
                        caLabel
                      );

                      if (!caMeals.length) return null;

                      return (
                        <div key={caLabel} style={{ marginBottom: "16px" }}>
                          <p style={{ fontWeight: "bold" }}>{caLabel}</p>
                          {caMeals.map((m, idx) => {
                            const isItemCancelled = m.status === "3" || m.status === 3;
                            return (
                              <div
                                key={idx}
                                style={{
                                  marginLeft: "16px",
                                  marginBottom: "8px",
                                  paddingBottom: "8px",
                                  borderBottom: "1px solid #ccc",
                                  opacity: isItemCancelled ? 0.6 : 1,
                                  backgroundColor: isItemCancelled ? "#fff1f0" : "transparent",
                                  padding: isItemCancelled ? "4px" : 0,
                                  borderRadius: isItemCancelled ? "4px" : 0,
                                }}
                              >
                                <p>+ Món ăn: {m.ten_mon || "Không rõ"}</p>
                                <p>+ Số lượng: {m.so_luong}</p>
                                <p>+ Chế độ: {m.ten_che_do || "Không"}</p>
                                <p>
                                  + Thu tiền:{" "}
                                  {m.thu_tien ? "Đã thu tiền" : "Chưa thu tiền"}
                                </p>
                                {m.httt && (
                                  <p>
                                    + Hình thức thanh toán:{" "}
                                    {getPaymentMethodText(m.httt)}
                                  </p>
                                )}
                                <p>
                                  + Số chứng từ: {m.so_ct?.trim() || "Không có"}
                                </p>
                                {isItemCancelled && (
                                  <p style={{ color: "#ff4d4f", fontWeight: "600" }}>
                                    + Trạng thái: ĐÃ HUỶ
                                  </p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Người dùng tự submit trên client */}
                {isSubmitted && !isDisabled && (
                  <div className="submitted-item">
                    {["CA1", "CA2", "CA3"].map((mealType) => {
                      const meals = detailData[index]?.[mealType] || [];
                      const hasMeals = meals.some((m) => m.mode || m.mealType);

                      if (!hasMeals) return null;

                      return (
                        <div key={mealType} style={{ marginBottom: "16px" }}>
                          <p style={{ fontWeight: "bold" }}>
                            {mealType === "CA1"
                              ? "Ca Sáng"
                              : mealType === "CA2"
                              ? "Ca Trưa"
                              : "Ca Tối"}
                          </p>

                          {meals.map((m, idx) => {
                            const foodName =
                              listFood.find(
                                (food) => food.ma_mon === m.mealType
                              )?.ten_mon ||
                              m.mealType ||
                              "Chưa chọn món";
                            const dietName =
                              listDietCategory.find((d) => d.ma_nh === m.mode)
                                ?.ten_nh ||
                              m.mode ||
                              "Chưa chọn chế độ";

                            return (
                              <div
                                key={idx}
                                style={{
                                  marginLeft: "16px",
                                  marginBottom: "8px",
                                  paddingBottom: "8px",
                                  borderBottom: "1px solid #ccc",
                                }}
                              >
                                {m.mode && <p>+ Chế độ: {dietName}</p>}
                                {m.mealType && <p>+ Món ăn: {foodName}</p>}
                                {m.quantity > 0 && (
                                  <p>+ Số lượng: {m.quantity}</p>
                                )}
                                {typeof m.collectMoney === "boolean" && (
                                  <p>
                                    + Thu tiền:{" "}
                                    {m.isPaid ? "Đã thu tiền" : "Chưa thu tiền"}
                                  </p>
                                )}
                                {m.httt && (
                                  <p>
                                    + Hình thức thanh toán:{" "}
                                    {getPaymentMethodText(m.httt)}
                                  </p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <button
        className="submit-button"
        onClick={handleSubmit}
        disabled={
          isSubmitting ||
          !detailData.some((bedMeals, bedIndex) => {
            // Kiểm tra xem có dữ liệu mới hoặc chỉnh sửa không
            return ["CA1", "CA2", "CA3"].some((shift) => {
              const meals = bedMeals?.[shift] || [];
              return meals.some((meal) => {
                // Chỉ enable nếu có món mới (!stt_rec) hoặc đã chỉnh sửa (isEdit)
                return meal.mealType && (!meal.stt_rec || meal.isEdit);
              });
            });
          })
        }
      >
        {isSubmitting ? "Đang gửi..." : "Gửi"}
      </button>
    </div>
  );
};

export default RoomSelectionForm;
