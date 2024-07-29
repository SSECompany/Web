export const getCreateAccInfo = (state) => {
  return state.AccountsReducer.account;
};

export const getAllClaims = (state) => {
  return state.AccountsReducer.allClaims;
};

export const getCurrentPermissions = (state) => {
  return state.AccountsReducer.account.currentPermissions;
};

export const getChangedPermissions = (state) => {
  return state.AccountsReducer.account.changedPermissions;
};
