import { configureStore } from "@reduxjs/toolkit";
import orders from "./../modules/order/store/order";
import claimsReducer from './reducers/claimsSlice';
import loadingReducer from "./reducers/loadingSlice";
import meals from "./../modules/meal/store/meal";

//store
const store = configureStore({
  reducer: {
    orders: orders,
    loadingReducer,
    claimsReducer,
    meals: meals

  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export default store;
