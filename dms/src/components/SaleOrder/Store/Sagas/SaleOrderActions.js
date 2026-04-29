import { notification } from "antd";
import store from "../../../../store";
import { formStatus } from "../../../../utils/constants";
import emitter from "../../../../utils/emitter";
import { SoFuckingUltimateGetApi2 } from "../../../DMS/API";
import { multipleTablePutApi } from "../../API";
import { saleOrderAction } from "../Slice/SaleOrderSlice";

const setSaleOrderLoading = (data) => {
  store.dispatch(saleOrderAction.setLoading(data));
};

const setOpenSaleOrderFilter = (data) => {
  store.dispatch(saleOrderAction.setIsOpenFilter(data));
};

const setSaleOrderCurrentStep = (data) => {
  store.dispatch(saleOrderAction.setCurrentStep(data));
};

const setMasterSaleOrderInfo = (data = {}) => {
  store.dispatch(saleOrderAction.setMasterSaleOrderInfo(data));
};

const setDetailSaleOrderInfo = (data) => {
  store.dispatch(saleOrderAction.setDetailSaleOrderInfo(data));
};

const setPromotionSaleOrderInfo = (data = []) => {
  store.dispatch(saleOrderAction.setPromotionItemsInfo(data));
};

const addPromotionSaleOrderInfo = async (data = {}) => {
  const currentPromos =
    store.getState().saleOrderReducer.promotionItemsInfo || [];
  store.dispatch(
    saleOrderAction.setPromotionItemsInfo([...currentPromos, data])
  );
};

const setPaymentSaleOrderInfo = (data = {}) => {
  store.dispatch(saleOrderAction.setPaymentSaleOrderInfo(data));
};

const setCurrentSaleOrder = async (data) => {
  store.dispatch(saleOrderAction.setCurrentItemId(data));
};

const setActionSaleOrder = async (data) => {
  store.dispatch(saleOrderAction.setAction(data));
};

const setSaleOrderInsertDetails = (data = []) => {
  store.dispatch(saleOrderAction.setSaleOrderInsertDetails(data));
};

const fetchSaleOrderList = async (params = {}) => {
  const data = { columns: [], dataSource: [], totalRecords: 0 };
  await SoFuckingUltimateGetApi2({
    store: "api_sale_order_list",
    data: {
      ...params,
    },
  }).then((res) => {
    data.columns = res?.reportLayoutModel || [];
    var dataSource = res?.data || [];
    dataSource.map((item) => (item.key = item.stt_rec));
    data.dataSource = dataSource || [];
    data.totalRecords = res?.pagegination?.totalRecord || 0;
  });

  store.dispatch(saleOrderAction.setSaleOrderList(data));
  setSaleOrderLoading(false);
};

const fetchSaleOrderInfo = async (key = "") => {
  setSaleOrderLoading(true);
  if (key) {
    setActionSaleOrder(formStatus.VIEW);

    SoFuckingUltimateGetApi2({
      store: "api_get_sale_order_info",
      data: {
        stt_rec: key,
      },
    }).then((res) => {
      const resData = _.first(res?.data) || {};
      const paymentInfo = {};
      const masterInfo = {};
      Object.keys(store.getState().saleOrderReducer.paymentInfo).map((item) => {
        paymentInfo[`${item}`] = resData[`${item}`];
      });

      Object.keys(store.getState().saleOrderReducer.masterInfo).map((item) => {
        masterInfo[`${item}`] = resData[`${item}`];
      });

      setMasterSaleOrderInfo(masterInfo);
      setPaymentSaleOrderInfo(paymentInfo);
    });
  }

  SoFuckingUltimateGetApi2({
    store: "api_get_sale_order_promo",
    data: {
      stt_rec: key,
    },
  }).then((res) => {
    var promos = res.data.map((item) => {
      return {
        ma_vt: item.ma_vt,
        ten_vt: item.ten_vt,
        ma_kho: item.ma_kho,
        ten_kho: item.ten_kho,
        so_luong: item.so_luong,
        dvt: item.dvt,
      };
    });

    setPromotionSaleOrderInfo([...promos]);
  });

  await SoFuckingUltimateGetApi2({
    store: "api_get_sale_order_detail",
    data: {
      stt_rec: key,
    },
  }).then((res) => {
    var data = res?.data || [];
    data.map((item) => (item.key = item.stt_rec0));

    const layout = res?.reportLayoutModel.map((item) => {
      if (item.field === "ma_vt") {
        return {
          title: item.name,
          dataIndex: item.field,
          type: item.type,
          editable: true,
          key: item.field,
          reference: "ten_vt",
          controller: "dmvt_lookup",
          required: true,
        };
      }
      if (item.field === "ma_kho") {
        return {
          title: item.name,
          dataIndex: item.field,
          type: item.type,
          editable: true,
          key: item.field,
          reference: "ten_kho",
          controller: "dmkho_lookup",
          required: true,
        };
      }
      if (item.field === "dvt") {
        return {
          title: item.name,
          dataIndex: item.field,
          type: item.type,
          editable: true,
          key: item.field,
          controller: "dmdvt_lookup",
          required: true,
        };
      }

      return {
        title: item.name,
        dataIndex: item.field,
        type: item.type,
        editable: true,
        key: item.field,
      };
    });

    setDetailSaleOrderInfo({ columns: layout || [], data });
    setSaleOrderLoading(false);
  });
};

// Truyền về detail layout để không phải load lại
const resetFormSaleOrder = async (data = []) => {
  await store.dispatch(saleOrderAction.resetForm());
};

const resetSaleOrder = async (data) => {
  await store.dispatch(saleOrderAction.resetSaleOrder());
};

const saleOrderModify = async ({
  master = {},
  detail = [],
  promos = [],
  payment = {},
}) => {
  const { id, unitId } = store.getState().claimsReducer.userInfo;
  const itemId = store.getState().saleOrderReducer.currentItemId;
  await multipleTablePutApi({
    store: "api_sale_order_modify",
    param: {
      VoucherId: itemId || "",
      UserID: id,
      UnitID: unitId,
    },
    data: {
      detail,
      promos: _.isEmpty(promos) ? undefined : promos,
      master: [{ ...master, ...payment }],
    },
  })
    .then((res) => {
      if (res?.responseModel?.isSucceded) {
        notification.success({
          message: `Thực hiện thành công`,
        });
      } else {
        notification.warning({
          message: res?.responseModel?.message,
        });
      }
    })
    .catch((err) => {
      console.error(err);
    })
    .finally(() => {
      setActionSaleOrder(formStatus.VIEW);
      emitter.emit("HANLDE_REFRESH_LIST_SALE_ORDER");
    });
};

const saleOrderCancel = async (ID = "") => {
  const { id, unitId } = store.getState().claimsReducer.userInfo;
  if (!ID) return;

  await multipleTablePutApi({
    store: "api_sale_order_cancel",
    param: {
      VoucherId: ID,
      UserID: id,
      UnitID: unitId,
    },
    data: {},
  })
    .then((res) => {
      if (res?.responseModel?.isSucceded) {
        notification.success({
          message: `Thực hiện thành công`,
        });
      } else {
        notification.warning({
          message: res?.message,
        });
      }
    })
    .catch((err) => {
      console.error(err);
    })
    .finally(() => {
      setActionSaleOrder(formStatus.VIEW);
    });
};

export {
  setCurrentSaleOrder,
  setActionSaleOrder,
  setMasterSaleOrderInfo,
  setSaleOrderLoading,
  setSaleOrderCurrentStep,
  setDetailSaleOrderInfo,
  setPromotionSaleOrderInfo,
  fetchSaleOrderInfo,
  fetchSaleOrderList,
  setOpenSaleOrderFilter,
  addPromotionSaleOrderInfo,
  setPaymentSaleOrderInfo,
  resetSaleOrder,
  setSaleOrderInsertDetails,
  resetFormSaleOrder,
  saleOrderModify,
  saleOrderCancel,
};
