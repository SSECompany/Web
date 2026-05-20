import { configureStore } from "@reduxjs/toolkit";
import kho from "./../pages/kho/store/kho";
import claimsReducer from "./reducers/claimsSlice";
import loadingReducer from "./reducers/loadingSlice";
//store
export const store = configureStore({
  reducer: {
    loadingReducer,
    claimsReducer,
    kho: kho,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export default store;
