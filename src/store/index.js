import { configureStore } from "@reduxjs/toolkit";
import loadingReducer from "./reducers/loadingSlice";
import orders from "./reducers/order";

//store
const store = configureStore({
  reducer: {
    orders: orders,
    loadingReducer,

  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export default store;
