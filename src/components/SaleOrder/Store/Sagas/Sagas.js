import store from "../../../../store";
import { SoFuckingUltimateGetApi } from "../../../DMS/API";
import { actions as saleoutActions } from "../Slice/SaleOutSlice";

const userInfo = store.getState().claimsReducer.claims;

export const fetchDMSCustomers = async (payload) => {
  try {
    await SoFuckingUltimateGetApi(payload).then((res) => {
      store.dispatch(saleoutActions.setDMSCustomers(res.data));
    });
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
};

export const setFinalDetails = async (payload) => {
  try {
    store.dispatch(saleoutActions.setFinalDetails(payload));
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
};

export const setSaleOutAction = async (payload) => {
  try {
    store.dispatch(saleoutActions.setAction(payload));
  } catch (error) {
    console.error(error);
  }
};

export const fetchSaleOutMaster = async (payload) => {
  try {
    const params = {
      store: "api_get_order_master",
      data: {
        stt_rec: payload.stt_rec,
        Invoice_date: payload.ngay_ct,
        UserID: userInfo.Id,
      },
    };

    await SoFuckingUltimateGetApi(params).then(async (res) => {
      await store.dispatch(saleoutActions.setCurrentMasterSaleOut(res));
    });
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
};

export const setCurrentDetailSaleOut = async (payload) => {
  store.dispatch(saleoutActions.setCurrentDetailSaleOut(payload));
};

export const fetchSaleOutDetail = async (payload) => {
  try {
    const params = {
      store: "api_get_order_detail",
      data: {
        stt_rec: payload.stt_rec,
        Invoice_date: payload.ngay_ct,
        UserID: userInfo.Id,
      },
    };

    await SoFuckingUltimateGetApi(params).then(async (res) => {
      await store.dispatch(saleoutActions.setCurrentDetailSaleOut(res));
    });
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
};
