import { configureStore } from "@reduxjs/toolkit";
import claimsReducer from "./reducers/claimsSlice";
import loadingReducer from "./reducers/loadingSlice";
import boxlys from "../modules/boxly/store/boxly";

//store
const store = configureStore({
  reducer: {
    loadingReducer,
    claimsReducer,
    boxly: boxlys,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export default store;
