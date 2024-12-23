export const getCurrentSaleOutDetail = (state) => {
  return state.saleoutDetailsReducer.currentDetailItem;
};

export const getCurrentSaleOutMaster = (state) => {
  return state.saleoutDetailsReducer.currentMasterItem;
};

export const getFinalDetail = (state) => {
  return state.saleoutDetailsReducer.finalDetails;
};

export const getSaleOrderInfo = (state) => {
  return state.saleOrderReducer;
};

export const getSaleOutInfo = (state) => {
  return state.saleoutDetailsReducer;
};
