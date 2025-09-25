import { configureStore } from "@reduxjs/toolkit";
import kho from "./../pages/kho/store/kho";
import orders from "./../pages/pharmacy/store/order";
import returnOrders from "./../pages/pharmacy/store/returnOrder";
import claimsReducer from "./reducers/claimsSlice";
import loadingReducer from "./reducers/loadingSlice";
//store
export const store = configureStore({
  reducer: {
    loadingReducer,
    claimsReducer,
    orders: orders,
    returnOrders: returnOrders,
    kho: kho,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export default store;
