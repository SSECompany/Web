import { configureStore } from "@reduxjs/toolkit";
import claimsReducer from "./reducers/claimsSlice";
import loadingReducer from "./reducers/loadingSlice";

//store
export const store = configureStore({
  reducer: {
    loadingReducer,
    claimsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

// Setup window.__REDUX_STORE__ for global access
if (typeof window !== "undefined") {
  window.__REDUX_STORE__ = store;
}

export default store;
