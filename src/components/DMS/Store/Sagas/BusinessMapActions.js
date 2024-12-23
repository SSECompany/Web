import _ from "lodash";
import store from "../../../../store";
import { multipleTablePutApi } from "../../../SaleOrder/API";
import { actions } from "../Reducers/BusinessMap";

export const fetchTourList = async (searchValue) => {
  store.dispatch(actions.setTourList([]));
  const { id, unitId, storeId } = store.getState().claimsReducer.userInfo;
  store.dispatch(actions.setSideBarLoading(true));

  const result = await multipleTablePutApi({
    store: "api_get_geo_tour",
    param: {
      searchValue,
      userId: id,
      unitId,
      storeId,
    },
    data: {},
  });

  store.dispatch(actions.setSideBarLoading(false));
  store.dispatch(actions.setTourList(_.first(result?.listObject) || []));
};

export const setTourSelected = (tour = "") => {
  store.dispatch(actions.setTourSelected(tour));
};

export const setCustomerSelected = (
  customer = "",
  position = { lat: 0, lng: 0 }
) => {
  store.dispatch(actions.setIsFooterColappsed(false));
  store.dispatch(actions.setCustomerSelected(customer));
  store.dispatch(actions.setPositionSelected(position));
};

export const resetBusinessMapState = () => {
  store.dispatch(actions.reset());
};

export const setisSideBarColappsed = async (state = false) => {
  store.dispatch(actions.setIsSideBarColappsed(state));
};

export const setisFooterColappsed = async (state = false) => {
  store.dispatch(actions.setIsFooterColappsed(state));
};

export const fetchTourPoints = async (tourCode = "") => {
  store.dispatch(actions.setCurentPoints([]));
  const { id, unitId, storeId } = store.getState().claimsReducer.userInfo;
  store.dispatch(actions.setIsMapLoading(true));

  const result = await multipleTablePutApi({
    store: "api_get_geo_data_by_tour",
    param: {
      ma_tuyen: "",
      userId: id,
      unitId,
      storeId,
    },
    data: {},
  });

  store.dispatch(actions.setIsMapLoading(false));
  store.dispatch(actions.setCurentPoints(_.first(result?.listObject) || []));
};
