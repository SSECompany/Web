import store from "../../../../store";
import { multipleTablePutApi } from "../../../SaleOrder/API";

export const fetchSystemSetting = async () => {
  try {
    const { id } = store.getState().claimsReducer.userInfo;
    if (!id) return;

    const result = await multipleTablePutApi({
      store: "Api_Get_System_Settings",
      param: {
        userId: id,
      },
      data: {},
    });

    return result?.listObject[0] || [];
  } catch (error) {
    console.log(error);
    return [];
  }
};

export const updateSystemSetting = async (data = []) => {
  try {
    const { id } = store.getState().claimsReducer.userInfo;
    if (!id) return;

    const result = await multipleTablePutApi({
      store: "Api_Update_System_Settings",
      param: {
        userId: id,
      },
      data: {
        data,
      },
    });

    return result?.responseModel?.isSucceded || false;
  } catch (error) {
    console.log(error);
    return [];
  }
};
