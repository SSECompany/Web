export const getRetailOrderState = (state) => {
  return state.retailOrderReducer;
};
export const getIsAddNewCustomer = (state) => {
  return state.retailOrderReducer.isAddNewCustomer;
};