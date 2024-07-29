import store from "../../../../store";
import { multipleTablePutApi } from "../../../SaleOrder/API";

export const fetchReportList = async () => {
  try {
    const { id, unitId, storeId } = store.getState().claimsReducer.userInfo;
    if (!id) return;

    const result = await multipleTablePutApi({
      store: "api_get_report_Dashboard",
      param: {
        userId: id,
        unitId,
        storeId,
      },
      data: {},
    });

    return result?.listObject[0] || [];
  } catch (error) {
    return [];
  }
};

export const modifiedSeletedReport = async (ids) => {
  try {
    const { id, unitId, storeId } = store.getState().claimsReducer.userInfo;
    if (!id) return;

    const result = await multipleTablePutApi({
      store: "api_modified_report_Dashboard",
      param: {
        ids,
        userId: id,
        unitId,
        storeId,
      },
      data: {},
    });
  } catch (error) {
    return [];
  }
};

export const getSeletedReport = async () => {
  try {
    const { id, unitId, storeId } = store.getState().claimsReducer.userInfo;
    if (!id) return;

    const result = await multipleTablePutApi({
      store: "api_get_report_Dashboard_selected",
      param: {
        userId: id,
        unitId,
        storeId,
      },
      data: {},
    });

    return result?.listObject[0] || [];
  } catch (error) {
    return [];
  }
};
