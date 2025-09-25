import { configureStore } from "@reduxjs/toolkit";
import { businessMapReducer } from "../components/DMS/Store/Reducers/BusinessMap";
import { DMSCustomersReducer } from "../components/DMS/Store/Reducers/DMSCustomer";
import { imagesListReducer } from "../components/DMS/Store/Reducers/ImagesList";
import { taskReducer } from "../components/DMS/Store/Reducers/Task";
import { tourDetailsReducer } from "../components/DMS/Store/Reducers/TourDetail";
import { approveItemsReducer } from "../components/Items/Store/Slices/ApproveItems";
import { itemsListReducer } from "../components/Items/Store/Slices/Item";
import { KPIListReducer } from "../components/KPI/Store/Slices/KPIList";
import { KPIPerformReducer } from "../components/KPI/Store/Slices/KPIPerforms";
import { KPIPlansReducer } from "../components/KPI/Store/Slices/KPIPlans";
import { posReducer } from "../components/POS/Store/Slices/PosSlice";
import mealReducer from "../components/POS/Store/meal";
import orderReducer from "../components/POS/Store/order";
import { retailOrderReducer } from "../components/Retail/Store/Slices/RetailOrderSlice";
import { saleOrderReducer } from "../components/SaleOrder/Store/Slice/SaleOrderSlice";
import { saleoutDetailsReducer } from "../components/SaleOrder/Store/Slice/SaleOutSlice";
import { AccountsReducer } from "../components/SystemOptions/Store/Reducers/Reducers";
import { TransferReducer } from "../components/Transfer/Store/Slices/TransferSlice";
import claimsReducer from "./reducers/claimsSlice";
import loadingReducer from "./reducers/loadingSlice";
import todoReducer from "./reducers/todoSlice";
//store
const store = configureStore({
  reducer: {
    todoReducer,
    loadingReducer,
    claimsReducer,
    DMSCustomersReducer,
    tourDetailsReducer,
    taskReducer,
    saleoutDetailsReducer,
    approveItemsReducer,
    AccountsReducer,
    imagesListReducer,
    itemsListReducer,
    KPIPerformReducer,
    KPIPlansReducer,
    saleOrderReducer,
    KPIListReducer,
    retailOrderReducer,
    businessMapReducer,
    TransferReducer,
    posReducer,
    orders: orderReducer,
    meal: mealReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export default store;
