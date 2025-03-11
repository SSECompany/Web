import { configureStore } from "@reduxjs/toolkit";
import claimsReducer from './reducers/claimsSlice';
import loadingReducer from "./reducers/loadingSlice";
import orders from "./reducers/order";

//store
const store = configureStore({
  reducer: {
    orders: orders,
    loadingReducer,
    claimsReducer

  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export default store;
