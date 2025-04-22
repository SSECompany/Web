import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    meals: {
        masterData: {
            name: '',
            roomCode: '',
            quantity: 0,
            price: 0,
            beds: '',
        },
        detailData: [
            {
                CA1: [{ mode: '', mealType: '', mealTypeName: '', quantity: 0, note: '', collectMoney: false, totalMoney: 0, isPaid: false, date: '' }],
                CA2: [{ mode: '', mealType: '', mealTypeName: '', quantity: 0, note: '', collectMoney: false, totalMoney: 0, isPaid: false, date: '' }],
                CA3: [{ mode: '', mealType: '', mealTypeName: '', quantity: 0, note: '', collectMoney: false, totalMoney: 0, isPaid: false, date: '' }]
            }
        ],
    },
    selectedCategory: {
        CA1: "",
        CA2: "",
        CA3: "",
    },
    listBeds: [],
    showRoomSelection: true,
    showMealDetails: false,
    currentBedIndex: 0,
    submittedBeds: [],
    listDietCategory: [],
    listMealCode: [],
    listFood: [],
    listDepartment: [],
    listRoom: [],
    selectedDate: '',
};

const mealSlice = createSlice({
    name: 'meals',
    initialState,
    reducers: {
        setMeal: (state, action) => {
            const { mealEntries, bedIndex = state.currentBedIndex } = action.payload;

            // Đảm bảo rằng detailData có cấu trúc đúng
            if (!Array.isArray(state.meals.detailData)) {
                state.meals.detailData = [];
            }

            while (state.meals.detailData.length <= bedIndex) {
                state.meals.detailData.push({});
            }

            // Cập nhật các món ăn cho giường và thời gian (CA1, CA2, CA3)
            if (mealEntries && typeof mealEntries === 'object') {
                state.meals.detailData = mealEntries; // Cập nhật lại detailData vào store
                let totalQuantity = 0;
                let totalPrice = 0;

                const bedMeals = mealEntries[bedIndex] || {};

                Object.keys(bedMeals).forEach((timeOfDay) => {
                    const meals = bedMeals[timeOfDay];
                    if (Array.isArray(meals)) {
                        meals.forEach((meal) => {
                            totalQuantity += meal.quantity;
                            totalPrice += meal.totalMoney;
                        });
                    }
                });

                // Cập nhật lại tổng số lượng và giá trị vào masterData
                state.meals.masterData.quantity = totalQuantity;
                state.meals.masterData.price = totalPrice;
                state.totalMoney = totalPrice;
            }
        },
        setShowMealDetails: (state, action) => {
            state.showMealDetails = action.payload;
        },
        setShowRoomSelection: (state, action) => {
            state.showRoomSelection = action.payload;
        },

        setRoomCode: (state, action) => {
            state.meals.masterData.roomCode = action.payload;
        },
        setMealType: (state, action) => {
            state.meals.masterData.mealType = action.payload;
        },
        setQuantity: (state, action) => {
            const newQuantity = Math.max(action.payload, 1);
            state.meals.masterData.quantity = newQuantity;
            state.totalMoney = state.meals.masterData.price / state.meals.masterData.quantity * newQuantity;
        },
        setPrice: (state, action) => {
            state.meals.masterData.price = action.payload;
        },
        setMasterData: (state, action) => {
            state.meals.masterData = { ...state.meals.masterData, ...action.payload };
        },
        addMeal: (state, action) => {
            const { mealTime, mealData, bedIndex = 0 } = action.payload;
            if (state.meals.detailData[bedIndex] && state.meals.detailData[bedIndex][mealTime]) {
                state.meals.detailData[bedIndex][mealTime].push({
                    ...mealData,
                    totalMoney: mealData.price * mealData.quantity // Calculate totalMoney for the new meal entry
                });
            } else if (state.meals.detailData[bedIndex]) {
                state.meals.detailData[bedIndex][mealTime] = [{
                    ...mealData,
                    totalMoney: mealData.price * mealData.quantity // Calculate totalMoney for the new meal entry
                }];
            }
        },
        removeMeal: (state, action) => {
            const { mealTime, mealIndex, bedIndex = state.currentBedIndex } = action.payload;
            if (
                Array.isArray(state.meals.detailData) &&
                state.meals.detailData[bedIndex] &&
                Array.isArray(state.meals.detailData[bedIndex][mealTime])
            ) {
                state.meals.detailData[bedIndex][mealTime].splice(mealIndex, 1);
            }
        },
        clearMeals: (state) => {
            state.meals.detailData = [];
        },
        setSelectedCategory: (state, action) => {
            const { category, value } = action.payload;
            state.selectedCategory[category] = value;
        },
        setListBeds: (state, action) => {
            const beds = action.payload;
            if (JSON.stringify(beds) !== JSON.stringify(state.listBeds)) {
                const validBeds = Array.isArray(beds)
                    ? beds.map(bed => ({
                        ma_phong: typeof bed.ma_phong === 'string' ? bed.ma_phong.trim() : '',
                        ma_giuong: typeof bed.ma_giuong === 'string' ? bed.ma_giuong.trim() : '',
                        ten_giuong: typeof bed.ten_giuong === 'string' ? bed.ten_giuong.trim() : 'Không rõ tên giường',
                    }))
                    : [];
                state.listBeds = validBeds;

            }
        },
        setCurrentBedIndex: (state, action) => {
            const bedIndex = action.payload;
            state.currentBedIndex = bedIndex;

            if (!state.meals.detailData[bedIndex]) {
                state.meals.detailData[bedIndex] = {
                    CA1: [{ mode: '', mealType: '', quantity: 0, note: '', collectMoney: false, totalMoney: 0, isPaid: false, date: '' }],
                    CA2: [{ mode: '', mealType: '', quantity: 0, note: '', collectMoney: false, totalMoney: 0, isPaid: false, date: '' }],
                    CA3: [{ mode: '', mealType: '', quantity: 0, note: '', collectMoney: false, totalMoney: 0, isPaid: false, date: '' }]
                };
            }

            const bedMeals = state.meals.detailData[bedIndex];
            let totalQuantity = 0;
            let totalPrice = 0;

            ['CA1', 'CA2', 'CA3'].forEach((shift) => {
                const meals = bedMeals[shift] || [];
                meals.forEach((meal) => {
                    if (!meal.collectMoney) {
                        totalQuantity += meal.quantity;
                        totalPrice += meal.price * meal.quantity;
                    }
                });
            });

            state.meals.masterData.quantity = totalQuantity;
            state.meals.masterData.price = totalPrice;
    state.totalMoney = totalPrice;
    const hasMealData = ['CA1', 'CA2', 'CA3'].some(shift => bedMeals[shift]?.some(meal => meal.mode || meal.mealType));
    if (!hasMealData) {
        state.selectedDate = '';
    }
},
        markBedAsSubmitted: (state, action) => {
            const bedIndex = action.payload;
            if (!state.submittedBeds.includes(bedIndex)) {
                state.submittedBeds.push(bedIndex);
            }
        },
        setListDietCategory: (state, action) => {
            state.listDietCategory = action.payload;
        },
        setListMealCode: (state, action) => {
            state.listMealCode = action.payload;  // Lưu vào store
        },
        setListFood: (state, action) => {
            state.listFood = action.payload;
        },
        setListDepartment: (state, action) => {
            state.listDepartment = action.payload;
        },
        setListRoom: (state, action) => {
            state.listRoom = action.payload;
        },
        setSelectedDate: (state, action) => {
            state.selectedDate = action.payload;
        },
        resetAllMeals: (state) => {
            state.meals.masterData = {
                name: '',
                roomCode: '',
                quantity: 0,
                price: 0,
                beds: '',
            };
            state.meals.detailData = [
                {
                    CA1: [{ mode: '', mealType: '', mealTypeName: '', quantity: 0, note: '', collectMoney: false, totalMoney: 0, isPaid: false, date: '' }],
                    CA2: [{ mode: '', mealType: '', mealTypeName: '', quantity: 0, note: '', collectMoney: false, totalMoney: 0, isPaid: false, date: '' }],
                    CA3: [{ mode: '', mealType: '', mealTypeName: '', quantity: 0, note: '', collectMoney: false, totalMoney: 0, isPaid: false, date: '' }]
                }
            ];
            state.listBeds = [];
            state.listRoom = [];
            state.submittedBeds = [];
            state.selectedDate = '';
        },
    },
});

export const {
    setMealDetails,
    setShowMealDetails,
    setShowRoomSelection,
    setRoomCode,
    setMealType,
    setQuantity,
    setPrice,
    setMasterData,
    addMeal,
    removeMeal,
    clearMeals,
    setSelectedCategory,
    setListBeds,
    setMeal,
    setCurrentBedIndex,
    markBedAsSubmitted,
    setListDietCategory,
    setListMealCode,
    setListFood,
    setListDepartment,
    setListRoom,
    resetAllMeals
} = mealSlice.actions;

export default mealSlice.reducer;