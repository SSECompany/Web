import { configureStore } from "@reduxjs/toolkit";
import claimsReducer from "./reducers/claimsSlice";
import loadingReducer from "./reducers/loadingSlice";
import authReducer from "./slices/authSlice";

//store
export const store = configureStore({
  reducer: {
    auth: authReducer,
    loadingReducer,
    claimsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export default store;
