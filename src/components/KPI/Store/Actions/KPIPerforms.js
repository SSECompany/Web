import store from "../../../../store";
import { multipleTablePutApi } from "../../../SaleOrder/API";
import { actions } from "../Slices/KPIPerforms";

export const setIsOpenModal = async (payload) => {
  try {
    store.dispatch(actions.setIsOpenModal(payload));
  } catch (error) {
    console.error(error);
  }
};

export const setIsOpenKPIPerformFilterModal = async (payload) => {
  try {
    store.dispatch(actions.setIsOpenFilterModal(payload));
  } catch (error) {
    console.error(error);
  }
};

export const fetchKPIPerformData = async (payload) => {
  try {
    var result = {};
    const { id, unitId } = store.getState().claimsReducer.userInfo;
    result = await multipleTablePutApi({
      store: "api_get_KPI_perform",
      param: { ...payload, UserID: id, unitId },
      data: {},
    });
    return {
      data: _.first(result?.listObject) || [],
      totalRecord: _.first(result?.listObject)?.length || 0,
    };
  } catch (error) {
    console.error(error);
  }
};

export const fetchKPIPerformDetailData = async (payload) => {
  try {
    var result = {};
    const { id, unitId } = store.getState().claimsReducer.userInfo;
    result = await multipleTablePutApi({
      store: "api_get_KPI_perform_detail",
      param: { ...payload, UserID: id, unitId },
      data: {},
    });
    return {
      data: _.first(result?.listObject) || [],
      detailData: _.first(result?.listObject[1]) || [],
    };
  } catch (error) {
    console.error(error);
  }
};

export const setCurrentItem = async (payload) => {
  try {
    store.dispatch(actions.setCurrentItem(payload));
  } catch (error) {
    console.error(error);
  }
};
