import { ArrowLeftOutlined, PlusOutlined } from '@ant-design/icons';
import { Checkbox, DatePicker, Tabs } from 'antd';
import dayjs from 'dayjs';
import cloneDeep from 'lodash.clonedeep';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { multipleTablePutApi } from "../../../../api";
import { formatNumber } from '../../../../app/hook/dataFormatHelper';
import showConfirm from '../../../../components/common/Modal/ModalConfirm';
import { markBedAsSubmitted, removeMeal, setListFood, setMeal, setShowMealDetails, setShowRoomSelection } from '../../store/meal';
import './MealDetailsForm.css';
import MealEntryRow from './MealInputBlock/MealInputBlock';
import { mealSchema } from './validator/validationSchema';

const { TabPane } = Tabs;

const MealDetailsForm = ({ onDateChange }) => {
    const firstMealInputRef = useRef(null);
    const tabsRef = useRef();
    const dispatch = useDispatch();
    const currentBedIndex = useSelector((state) => state.meals.currentBedIndex);
    const listBeds = useSelector((state) => state.meals.listBeds);
    const bedName = listBeds[currentBedIndex];
    const listFood = useSelector((state) => state.meals.listFood);
    const detailData = useSelector((state) => state.meals.meals.detailData);
    const [isPaid, setIsPaid] = useState(false);

    const [selectedDate, setSelectedDate] = useState(dayjs());
    const listMealCode = useSelector((state) => state.meals.listMealCode);
    const listDietCategory = useSelector((state) => state.meals.listDietCategory);
    const [activeTab, setActiveTab] = useState(listMealCode[0]?.ma_ca || 'CA1');
    const [selectedPatientInShift, setSelectedPatientInShift] = useState({}); // Lưu trạng thái "Bệnh nhân" theo từng ca


    useEffect(() => {
        const bedMeals = detailData[currentBedIndex];
        if (bedMeals && bedMeals[activeTab]) {
            const meals = [...(bedMeals[activeTab] || [])];
            const hasPaid = meals.length > 0 && meals.every(meal => meal.isPaid);
            setIsPaid(hasPaid);
        } else {
            setIsPaid(false);
        }
    }, [detailData, currentBedIndex, activeTab]);

    const dateFormat = 'DD/MM/YYYY';
    const createDefaultMeal = (date) => ({
        date: date || dayjs().format('DD/MM/YYYY'),
        mode: '',
        mealType: '',
        mealTypeName: '',
        quantity: 0,
        note: '',
        collectMoney: false,
        totalMoney: 0,
        isPaid: false,
    });

    // Initializing mealEntries from Redux state (detailData)
    const [mealEntries, setMealEntries] = useState(detailData);

    useEffect(() => {
        const bedMeals = detailData[currentBedIndex];

        if (bedMeals) {
            const timeOrders = ['CA1', 'CA2', 'CA3'];
            let foundDate = '';

            for (const time of timeOrders) {
                const meals = bedMeals[time] || [];
                if (meals.length > 0 && meals[0].date) {
                    foundDate = meals[0].date;
                    break;
                }
            }

            if (foundDate) {
                setSelectedDate(dayjs(foundDate, 'DD/MM/YYYY'));
            } else {
                setSelectedDate(dayjs());
            }
        }
    }, [currentBedIndex, detailData]);

    useEffect(() => {
        const fetchListFood = async () => {
            if (!selectedDate || !selectedDate.isValid()) return;

            let dateToUse = selectedDate;
            const bedMeals = detailData[currentBedIndex];

            if (bedMeals) {
                const shifts = ['CA1', 'CA2', 'CA3'];
                for (const shift of shifts) {
                    const meals = bedMeals[shift] || [];
                    if (meals.length > 0 && meals[0].date) {
                        dateToUse = dayjs(meals[0].date, 'DD/MM/YYYY');
                        break;
                    }
                }
            }

            try {
                const response = await multipleTablePutApi({
                    store: "[api_getListFood]",
                    param: {
                        bn_yn: "",
                        ma_ca: "",
                        ma_nh: "",
                        searchValue: "",
                        ngay_an: dateToUse.format('DD/MM/YYYY'),
                        pageindex: 1,
                        pagesize: 10,
                    },
                    data: {},
                });

                const foodList = response?.listObject?.[0] || [];
                dispatch(setListFood(foodList));
            } catch (error) {
                console.error(' Lỗi lấy listFood theo ngày:', error);
            }
        };

        fetchListFood();
    }, [selectedDate, currentBedIndex, detailData, dispatch]);

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

    const handleChange = useCallback((timeOfDay, index, e) => {
        const { name, value } = e.target;
        updateMealEntry(timeOfDay, index, (meal) => {
            if (name === 'mealType') {
                const selectedFood = listFood.find(food => food.ma_mon === value && food.ma_ca === timeOfDay);
                const price = selectedFood?.gia_ban || 0;
                meal.mealType = value;
                meal.mealTypeName = selectedFood?.ten_mon || '';
                meal.quantity = 1;
                meal.totalMoney = price * meal.quantity;
                meal.price = price;
            } else if (name === 'note') {
                meal.note = value;
            } else {
                meal[name] = value;
            }
        });
    }, [listFood]);

    const handleQuantityChange = useCallback((timeOfDay, index, change) => {
        updateMealEntry(timeOfDay, index, (meal) => {
            const newQuantity = Math.max(1, meal.quantity + change);
            const selectedFood = listFood.find(food => food.ma_mon === meal.mealType && food.ma_ca === timeOfDay);
            const price = selectedFood?.gia_ban || 0;
            meal.quantity = newQuantity;
            meal.totalMoney = meal.collectMoney ? 0 : price * newQuantity;
        });
    }, [listFood]);

    const handleAddMeal = (timeOfDay) => {
        setMealEntries((prev) => {
            const updatedMeals = [...prev];
            if (!updatedMeals[currentBedIndex]) {
                updatedMeals[currentBedIndex] = { CA1: [], CA2: [], CA3: [] };
            }
            const bedMeals = { ...updatedMeals[currentBedIndex] };
            const meals = [...(bedMeals[timeOfDay] || [])];

            meals.push(createDefaultMeal(selectedDate.format('DD/MM/YYYY')));

            bedMeals[timeOfDay] = meals;
            updatedMeals[currentBedIndex] = bedMeals;

            updateMealEntriesInRedux(updatedMeals);
            return updatedMeals;
        });
    };


    const handleModeChange = useCallback((timeOfDay, index, value) => {
        updateMealEntry(timeOfDay, index, (meal) => {
            meal.mode = value;
        });
    }, []);

    const handleDeleteMeal = (timeOfDay, index) => {
        showConfirm({
            title: 'Bạn có chắc chắn muốn xoá món ăn này?',
            onOk: () => {
                setMealEntries((prev) => {
                    const updatedMeals = cloneDeep(prev);
                    const bedMeals = { ...updatedMeals[currentBedIndex] };
                    const meals = [...(bedMeals[timeOfDay] || [])];

                    if (meals.length === 1) {
                        // Nếu chỉ còn 1 phần tử thì clear mảng thành 1 phần tử trống mới
                        bedMeals[timeOfDay] = [createDefaultMeal(selectedDate.format('DD/MM/YYYY'))];
                    } else {
                        meals.splice(index, 1);
                        bedMeals[timeOfDay] = meals;
                    }
                    updatedMeals[currentBedIndex] = bedMeals;

                    dispatch(removeMeal({ mealTime: timeOfDay, mealIndex: index, bedIndex: currentBedIndex }));

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

            const selectedFood = listFood.find(food => food.ma_mon === meals[index]?.mealType && food.ma_ca === timeOfDay);
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
        const emptyShifts = [];

        for (const shift of ['CA1', 'CA2', 'CA3']) {
            const meals = bedMeals[shift] || [];
            const hasMeal = meals.some(meal => meal.mealType);
            if (!hasMeal) {
                emptyShifts.push(shift);
            }
        }

        const shiftLabels = { CA1: 'Ca Sáng', CA2: 'Ca Trưa', CA3: 'Ca Chiều' };

        if (emptyShifts.length > 0) {
            const emptyShiftNames = emptyShifts.map((shift) => shiftLabels[shift]).join(', ');

            showConfirm({
                title: (
                    <>
                        Bạn chưa nhập liệu cho các ca:{" "}
                        <span style={{ color: "#fa541c" }}>
                            {emptyShiftNames}
                        </span>
                        . Bạn có chắc chắn muốn tiếp tục?
                    </>
                ),
                onOk: async () => {
                    let needValidate = false;

                    for (const shift of Object.keys(bedMeals)) {
                        for (let index = 0; index < (bedMeals[shift]?.length || 0); index++) {
                            const meal = bedMeals[shift][index];
                            if (meal.mode && !meal.mealType) {
                                needValidate = true;
                                break;
                            }
                        }
                        if (needValidate) break;
                    }

                    if (needValidate) {
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
                    }

                    dispatch(setMeal({ mealEntries: updatedMeals, bedIndex: currentBedIndex }));
                    dispatch(markBedAsSubmitted(currentBedIndex));
                    dispatch(setShowMealDetails(false));
                    dispatch(setShowRoomSelection(true));
                },
                onCancel: () => {
                    if (emptyShifts.length > 0) {
                        setActiveTab(emptyShifts[0]);
                    }
                },
            });
            return;
        }

        let hasError = false;

        for (const shift of Object.keys(bedMeals)) {
            for (let index = 0; index < (bedMeals[shift]?.length || 0); index++) {
                const meal = bedMeals[shift][index];
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

    const handleDateChange = (date) => {
        if (!date || !date.isValid()) return;

        showConfirm({
            title: "Bạn có chắc chắn muốn đổi ngày? Dữ liệu các suất ăn hiện tại sẽ cập nhật theo ngày mới.",
            onOk: () => {
                const formattedDate = date.format('DD/MM/YYYY');
                setSelectedDate(date);
                onDateChange(formattedDate);

                setMealEntries((prev) => {
                    const updatedMeals = [...prev];
                    updatedMeals[currentBedIndex] = {
                        CA1: [{ ...createDefaultMeal(formattedDate) }],
                        CA2: [{ ...createDefaultMeal(formattedDate) }],
                        CA3: [{ ...createDefaultMeal(formattedDate) }],
                    };
                    return updatedMeals;
                });
            },
        });
    };



    const renderedMealEntries = useMemo(() => {
        const bedMeals = mealEntries[currentBedIndex] || {};
        const result = {};

        ['CA1', 'CA2', 'CA3'].forEach((shift) => {
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
                    handleDeleteMeal={handleDeleteMeal}
                    handleModeChange={handleModeChange}
                    handleChange={handleChange}
                    handleQuantityChange={handleQuantityChange}
                    handleCollectMoneyChange={(e) => handlePatientCheckboxChange(shift, index, e.target.checked)}
                    firstMealInputRef={firstMealInputRef}
                    isAnotherMealSelected={selectedIndex !== undefined && selectedIndex !== index} // Kiểm tra nếu đã có suất khác được chọn
                />
            ));
        });

        return result;
    }, [mealEntries, currentBedIndex, listFood, listDietCategory, selectedPatientInShift]);

    return (
        <div className="meal-ticket-form">
            <div className="back-button-container">
                <button className="back-button" onClick={handleBackToRoomSelection}>
                    <ArrowLeftOutlined />
                </button>
            </div>
            <h2 className='form-title_detail'>
                Giường {bedName?.ten_giuong || 'Không rõ tên giường'}
            </h2>
            <div className="meal-details-datepicker">
                <DatePicker
                    id="date-picker"
                    value={selectedDate}
                    onChange={handleDateChange}
                    format={dateFormat}
                    className="meal-date-picker-input"
                />

            </div>
            <Tabs
                ref={tabsRef}
                defaultActiveKey={listMealCode[0]?.ma_ca || 'CA1'}
                activeKey={activeTab}
                onChange={setActiveTab}
            >
                {listMealCode.map((meal) => (
                    <TabPane tab={`${meal.ten_ca} - ${formatNumber(calculateTotalByShift(meal.ma_ca))} đ`} key={meal.ma_ca}>
                        {renderedMealEntries[meal.ma_ca]}
                        <button className="add-row-button" onClick={() => handleAddMeal(meal.ma_ca)}>
                            <PlusOutlined />
                        </button>
                    </TabPane>
                ))}
            </Tabs>
            <div style={{ marginTop: 16 }}>
                <Checkbox
                    checked={isPaid}
                    disabled={calculateTotalByShift(activeTab) === 0}
                    onChange={(e) => {
                        const newIsPaid = e.target.checked;
                        setIsPaid(newIsPaid);

                        setMealEntries((prev) => {
                            const updatedMeals = cloneDeep(prev);
                            if (!updatedMeals[currentBedIndex]) {
                                updatedMeals[currentBedIndex] = { CA1: [], CA2: [], CA3: [] };
                            }

                            if (updatedMeals[currentBedIndex][activeTab]) {
                                updatedMeals[currentBedIndex][activeTab] = (updatedMeals[currentBedIndex][activeTab] || []).map((meal) => ({
                                    ...meal,
                                    isPaid: newIsPaid,
                                }));
                            }

                            dispatch(setMeal({ mealEntries: updatedMeals, bedIndex: currentBedIndex }));

                            return updatedMeals;
                        });
                    }}
                >
                    Thu tiền
                </Checkbox>
            </div>
            <div className='total-money'>
                Tổng tiền: {formatNumber(calculateTotalAllShift())} đ
            </div>

            <button className="submit-button"
                onClick={handleSubmit}
                disabled={!(
                    mealEntries[currentBedIndex]?.CA1?.length ||
                    mealEntries[currentBedIndex]?.CA2?.length ||
                    mealEntries[currentBedIndex]?.CA3?.length
                )}
            >
                Hoàn thành
            </button>
        </div>
    );
};

export default MealDetailsForm;