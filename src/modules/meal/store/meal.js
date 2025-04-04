import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    mealDetails: {
        mode: '',
        name: '',
        roomCode: '',
        bed: '',
        mealType: 'comGa',
        quantity: 1,
        price: 0,
        note: '',
        beds: [],
        meals: {
            morning: {
                viemGanMan: [],
                giamCan: [],
                tieuDuong: []
            },
            afternoon: {
                viemGanMan: [],
                giamCan: [],
                tieuDuong: []
            },
            evening: {
                viemGanMan: [],
                giamCan: [],
                tieuDuong: []
            }
        },
    },
    showFormDetails: false,
    showRoomSelection: true,
    showMealDetails: false,
    selectedTimeOfDay: 'morning',
    selectedMode: '',
    isModeSelected: false,
};

const mealSlice = createSlice({
    name: 'meals',
    initialState,
    reducers: {
        setMealDetails: (state, action) => {
            state.mealDetails = { ...state.mealDetails, ...action.payload };
        },
        setShowFormDetails: (state, action) => {
            state.showFormDetails = action.payload;
        },
        setShowRoomSelection: (state, action) => {
            state.showRoomSelection = action.payload;
        },
        setShowMealDetails: (state, action) => {
            state.showMealDetails = action.payload;
        },
        setBeds: (state, action) => {
            state.mealDetails.beds = Array.isArray(action.payload) ? action.payload : [];
            state.mealDetails.bed = action.payload[0];
        },
        setRoomCode: (state, action) => {
            state.mealDetails.roomCode = action.payload;
        },
        setMealType: (state, action) => {
            state.mealDetails.mealType = action.payload;
        },
        setQuantity: (state, action) => {
            const newQuantity = Math.max(action.payload, 1);
            state.mealDetails.quantity = newQuantity;
            if (state.isModeSelected) {
                state.mealDetails.price = state.mealDetails.price / state.mealDetails.quantity * newQuantity; // Update price based on quantity
            }
        },
        setPrice: (state, action) => {
            if (state.isModeSelected) {
                state.mealDetails.price = action.payload; // Update price based on meal price and quantity
            }
        },
        addMeal: (state, action) => {
            const { mealTime, meal, mode } = action.payload;
            if (state.mealDetails.meals[mealTime] && state.mealDetails.meals[mealTime][mode]) {
                state.mealDetails.meals[mealTime][mode].push(meal);
            }
        },
        clearMeals: (state) => {
            state.mealDetails.meals = {
                morning: {
                    viemGanMan: [],
                    giamCan: [],
                    tieuDuong: []
                },
                afternoon: {
                    viemGanMan: [],
                    giamCan: [],
                    tieuDuong: []
                },
                evening: {
                    viemGanMan: [],
                    giamCan: [],
                    tieuDuong: []
                }
            };
        },
        filterMealsByModeAndTime: (state, action) => {
            const { mealTime, mode } = action.payload;
            const meals = state.mealDetails.meals[mealTime]?.[mode] || [];
            if (meals.length === 0) {
                // Handle case when there are no meals for the selected mode and time
                console.log(`No meals available for ${mode} during ${mealTime}`);
                return []; // Return an empty array to indicate no meals found
            }
            return meals;
        },
        setSelectedTimeOfDay: (state, action) => {
            state.selectedTimeOfDay = action.payload;
        },
        setSelectedMode: (state, action) => {
            state.selectedMode = action.payload;
            state.isModeSelected = action.payload !== ''; // Update mode selection state
            if (!state.isModeSelected) {
                state.mealDetails.quantity = 1; // Reset quantity to 1 if no mode is selected
                state.mealDetails.price = 0; // Reset price to 0 if no mode is selected
            }
        },
    },
});

export const {
    setMealDetails,
    setShowFormDetails,
    setShowRoomSelection,
    setShowMealDetails,
    setBeds,
    setRoomCode,
    setMealType,
    setQuantity,
    setPrice,
    addMeal,
    clearMeals,
    filterMealsByModeAndTime,
    setSelectedTimeOfDay,
    setSelectedMode,
} = mealSlice.actions;

export default mealSlice.reducer;