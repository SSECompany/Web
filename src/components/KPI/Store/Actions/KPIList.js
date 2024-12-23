import renderColumns from "../../../../app/hooks/renderColumns";
import store from "../../../../store";
import { SoFuckingUltimateGetApi } from "../../../DMS/API";
import { multipleTablePutApi } from "../../../SaleOrder/API";
import { KPIListActions as actions } from "../Slices/KPIList";

export const setKPIListOpenModal = async (payload) => {
  try {
    store.dispatch(actions.setIsOpenModal(payload));
  } catch (error) {
    console.error(error);
  }
};

export const setKPIListCurrentItem = async (payload) => {
  try {
    store.dispatch(actions.setCurrentItem(payload));
  } catch (error) {
    console.error(error);
  }
};

export const putKpilist = async (payload) => {
  try {
    var result = {};
    const { id } = store.getState().claimsReducer.userInfo;
    result = await multipleTablePutApi({
      store: "api_put_KPI_List",
      param: { ...payload, UserID: id },
      data: {},
    });
    return result?.responseModel;
  } catch (error) {
    console.error(error);
  }
};

export const deleteKpilist = async (payload) => {
  try {
    var result = {};
    const { id } = store.getState().claimsReducer.userInfo;
    result = await multipleTablePutApi({
      store: "api_delete_KPI_List",
      param: { ...payload, UserID: id },
      data: {},
    });
    return result.listObject?.isSucceded;
  } catch (error) {
    console.error(error);
  }
};

export const fetchKPIListData = async (payload) => {
  try {
    var result = {};

    await SoFuckingUltimateGetApi({
      store: "api_get_KPI_list",
      data: { ...payload },
    }).then((res) => {
      let layout = renderColumns(res?.reportLayoutModel);
      const data = res.data;
      data.map((item, index) => {
        item.key = item.ma_kpi;
        return item;
      });
      const totalCount = res?.pagegination?.totalRecord;

      result.layout = layout || [];
      result.data = data || [];
      result.totalCount = totalCount || 0;
    });

    return result;
  } catch (error) {
    console.error(error);
  }
};
