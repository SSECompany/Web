import {
  getAllRowKeys,
  getAllValueByRow,
} from "../../../../app/Functions/getTableValue";
import store from "../../../../store";
import { multipleTablePutApi } from "../../../SaleOrder/API";
import { retailOrderActions } from "../Slices/RetailOrderSlice";

export const setCurrentRetailOrder = (data) => {
  try {
    store.dispatch(retailOrderActions.setCurrentOrder(data));
  } catch (error) {
    console.log(error);
  }
};

export const setRetailOrderList = (data) => {
  try {
    store.dispatch(retailOrderActions.setListOrder(data));
  } catch (error) {
    console.log(error);
  }
};

export const setRetailOrderScanning = (data) => {
  try {
    store.dispatch(retailOrderActions.setIsScanning(data));
  } catch (error) {
    console.log(error);
  }
};

export const resetRetailOrder = (data) => {
  try {
    store.dispatch(retailOrderActions.reset());
  } catch (error) {
    console.log(error);
  }
};

export const getValueParam = (key) => {
  try {
    const { fetchListParams } = store.getState().retailOrderReducer;
    return fetchListParams[`${key}`];
  } catch (error) {
    console.log(error);
  }
};

export const setFetchListParams = (data) => {
  try {
    const { fetchListParams } = store.getState().retailOrderReducer;

    store.dispatch(
      retailOrderActions.setFetchListParams({ ...fetchListParams, ...data })
    );
  } catch (error) {
    console.log(error);
  }
};

export const resetFetchListParams = async (params) => {
  store.dispatch(retailOrderActions.resetFetchListParams());
};

export const fetchRetailOderList = async (params) => {
  try {
    const result = await multipleTablePutApi({
      store: "api_get_retail_order",
      param: {
        ...params,
      },
      data: {},
    });

    return {
      columns: result?.listObject[1],
      data: result?.listObject[0],
      pagination: result?.listObject[2],
    };
  } catch (error) {
    console.log(error);
  }
};

export const fetchRetailOderDetail = async (params) => {
  try {
    const result = await multipleTablePutApi({
      store: "api_get_retail_order_detail",
      param: {
        ...params,
      },
      data: {},
    });

    const columns = result?.listObject[2].map((item) => {
      return {
        key: item?.Field,
        title: item?.Name,
        dataKey: item?.Field,
        width: item?.width,
        resizable: item?.width ? true : false,
        sortable: false,
        hidden: !item?.width ? true : false,
      };
    });

    return {
      detail: result?.listObject[1],
      master: result?.listObject[0][0],
      columns,
    };
  } catch (error) {
    console.log(error);
  }
};

export const fetchRetailOderPromotion = async (data = [], customer = "") => {
  try {
    modifyIsLoadingPromotion(true);
    const { id, unitId, storeId } = store.getState().claimsReducer.userInfo;

    var lstItems = [];
    var lstIds = [];
    var lstStock = [];
    var lstPrice = [];
    var lstQuantity = [];
    var listTotal = [];
    const detailData = [];

    getAllRowKeys(data).map((item) => {
      return detailData.push({ id: item, ...getAllValueByRow(item, data) });
    });

    detailData.map((item) => {
      if (!item.ck_yn) {
        lstItems.push(item?.ma_vt);
        lstIds.push(item?.id);
        lstStock.push(item?.ma_kho);
        lstPrice.push(item?.don_gia);
        lstQuantity.push(item?.so_luong);
        listTotal.push(item?.thanh_tien);
      }
      return true;
    });

    const result = await multipleTablePutApi({
      store: "API_SSELIB$Voucher$Sales$Discount",
      param: {
        cLstItemPr: lstItems.join(","),
        cLstQtyPr: lstQuantity.join(","),
        cLstPricePr: lstPrice.join(","),
        cLstMoneyPr: listTotal.join(","),
        cLstSitePr: lstStock.join(","),
        clistID: lstIds.join(","),
        ma_kh: customer,
        voucherCode: "HDL",
        gt_vip_yn: 0,
        storeId,
        unitId,
      },
      data: {},
    });

    modifyIsLoadingPromotion(false);

    return {
      ckvt: result?.listObject[1] || [],
      ckth: result?.listObject[2] || [],
      cktd: result?.listObject[0] || [],
    };
  } catch (error) {
    console.log(error);
  }
};

export const apiCreateRefundOrder = async (master = {}, detail = []) => {
  const { id, unitId, storeId } = store.getState().claimsReducer.userInfo;
  const result = await multipleTablePutApi({
    store: "Api_create_return_order",
    param: {
      UnitID: unitId,
      StoreID: storeId,
      userId: id,
    },
    data: {
      master: [
        {
          ...master,
        },
      ],
      detail,
    },
  });

  return result;
};

export const modifyIsFormLoading = async (params) => {
  store.dispatch(retailOrderActions.setIsFormLoading(params));
};

export const modifyIsOpenPromotion = async (params) => {
  store.dispatch(retailOrderActions.setIsOpenPromotion(params));
};

export const modifyIsLoadingPromotion = async (params) => {
  store.dispatch(retailOrderActions.setIsPromotionLoading(params));
};
