export const todoSelector = (state) => state.todoReducer.allTodos;
export const getLoading = (state) => state.loadingReducer.loading;
export const getClaims = (state) => state.claimsReducer.claims;
export const getTestText = (state) => state.claimsReducer.textTest;
export const getUserInfo = (state) => state.claimsReducer.userInfo;
export const getIsBackgound = (state) => state.claimsReducer.isBackgound;
export const getIsHideNav = (state) => state.claimsReducer.isHideNav;
