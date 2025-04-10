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
                caSang: [],
                caTrua: [],
                caToi: []
            }
        ]
    },
    selectedCategory: {
        caSang: "",
        caTrua: "",
        caToi: "",
    },
    listBeds: [],
    showRoomSelection: true,
    showMealDetails: false,
    currentBedIndex: 0,
    submittedBeds: [],
};

const mealSlice = createSlice({
    name: 'meals',
    initialState,
    reducers: {
        setMeal: (state, action) => {
            const { mealEntries } = action.payload;
            const bedIndex = action.payload.bedIndex !== undefined ? action.payload.bedIndex : state.currentBedIndex;

            if (!Array.isArray(state.meals.detailData)) {
                state.meals.detailData = [];
            }

            while (state.meals.detailData.length <= bedIndex) {
                state.meals.detailData.push({
                    caSang: [],
                    caTrua: [],
                    caToi: [],
                });
            }

            if (mealEntries && typeof mealEntries === 'object') {
                Object.keys(mealEntries).forEach((timeOfDay) => {
                    state.meals.detailData[bedIndex][timeOfDay] = mealEntries[timeOfDay].map((meal) => ({
                        ...meal,
                        totalMoney: meal.collectMoney ? 0 : meal.price * meal.quantity || 0,
                    }));
                });

            }
        },
        setShowMealDetails: (state, action) => {
            state.showMealDetails = action.payload;
        },
        setShowRoomSelection: (state, action) => {
            state.showRoomSelection = action.payload;
        },
        setBeds: (state, action) => {
            state.meals.masterData.beds = action.payload;
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
            const { mealTime, mode, mealIndex } = action.payload;
            state.meals.detailData[mode].splice(mealIndex, 1);
        },
        clearMeals: (state) => {
            state.meals.detailData = {
                caSang: [],
                caTrua: [],
                caToi: []
            };
        },
        setSelectedCategory: (state, action) => {
            const { category, value } = action.payload;
            state.selectedCategory[category] = value;
        },
        setListBeds: (state, action) => {
            const beds = action.payload;
            state.listBeds = beds;
            state.meals.detailData = beds.map(() => ({
                caSang: [],
                caTrua: [],
                caToi: [],
            }));
        },
        setCurrentBedIndex: (state, action) => { // New reducer to set current bed index
            state.currentBedIndex = action.payload;
        },
        markBedAsSubmitted: (state, action) => { // New reducer to mark bed as submitted
            const bedIndex = action.payload;
            if (!state.submittedBeds.includes(bedIndex)) {
                state.submittedBeds.push(bedIndex);
            }
        },
    },
});

export const {
    setMealDetails,
    setShowMealDetails,
    setShowRoomSelection,
    setBeds,
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
    setCurrentBedIndex, // Exporting the new action
    markBedAsSubmitted // Exporting the new action
} = mealSlice.actions;

export default mealSlice.reducer;