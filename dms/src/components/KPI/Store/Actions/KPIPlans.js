import renderColumns from "../../../../app/hooks/renderColumns";
import store from "../../../../store";
import { SoFuckingUltimateGetApi } from "../../../DMS/API";
import { multipleTablePutApi } from "../../../SaleOrder/API";
import { actions } from "../Slices/KPIPlans";

export const setIsOpenModal = async (payload) => {
  try {
    store.dispatch(actions.setIsOpenModal(payload));
  } catch (error) {
    console.error(error);
  }
};

export const setCurrentKPIPlanAction = async (payload) => {
  try {
    store.dispatch(actions.setCurrentAction(payload));
  } catch (error) {
    console.error(error);
  }
};

export const fetchKPIPlansDetailData = async (payload) => {
  var result = {};

  await SoFuckingUltimateGetApi({
    store: "api_get_KPI_plans_detail",
    data: { ...payload },
  }).then((res) => {
    let layout = renderColumns(res?.reportLayoutModel);
    const data = res.data;
    data.map((item, index) => {
      item.key = item.id;
      return item;
    });
    const totalCount = res?.pagegination?.totalRecord;

    result.layout = layout || [];
    result.data = data || [];
    result.totalCount = totalCount || 0;
  });

  return result;
};

export const fetchKPIPlansData = async (payload) => {
  try {
    var result = {};
    const { id } = store.getState().claimsReducer.userInfo;
    result = await multipleTablePutApi({
      store: "api_get_KPI_plans_list",
      param: { ...payload, UserID: id },
      data: {},
    });
    return {
      data: _.first(result?.listObject) || [],
      totalRecord: _.first(result?.listObject[1])?.totalRecord || 0,
    };
  } catch (error) {
    console.error(error);
  }
};

export const KPIPlanModify = async (payload) => {
  try {
    const { id } = store.getState().claimsReducer.userInfo;
    const result = await multipleTablePutApi({
      store: "api_modify_KPI_plans",
      param: { ...payload, UserID: id },
      data: {},
    });
    return result?.responseModel?.isSucceded;
  } catch (error) {
    console.error(error);
    return false;
  }
};

export const setCurrentItem = async (payload) => {
  try {
    store.dispatch(actions.setCurrentItem(payload));
  } catch (error) {
    console.error(error);
  }
};
