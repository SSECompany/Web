import store from "../../../../store";
import { multipleTablePutApi } from "../../../SaleOrder/API";

export const fetchMiniReportData = async (dateType, reportKey, reportStore) => {
  try {
    const { id, unitId, storeId } = store.getState().claimsReducer.userInfo;
    if (!id) return;

    const result = await multipleTablePutApi({
      store: reportStore || "api_get_mini_reportData",
      param: {
        reportKey,
        dateType,
        userId: id,
        unitId,
        storeId,
      },
      data: {},
    });

    return result?.listObject || [];
  } catch (error) {
    return [];
  }
};
