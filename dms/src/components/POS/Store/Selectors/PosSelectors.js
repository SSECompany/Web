// POS Selectors
export const getPosState = (state) => state.posReducer;

// Dashboard selectors
export const getDashboardStats = (state) => getPosState(state).dashboardStats;

// Order selectors
export const getOrders = (state) => getPosState(state).orders;
export const getCurrentOrder = (state) => getPosState(state).currentOrder;
export const getOrderLoading = (state) => getPosState(state).orderLoading;
export const getOrderFilters = (state) => getPosState(state).orderFilters;

// Product selectors
export const getProducts = (state) => getPosState(state).products;
export const getProductLoading = (state) => getPosState(state).productLoading;
export const getProductFilters = (state) => getPosState(state).productFilters;

// Customer selectors
export const getCustomers = (state) => getPosState(state).customers;
export const getCustomerLoading = (state) => getPosState(state).customerLoading;
export const getCustomerFilters = (state) => getPosState(state).customerFilters;

// Session selectors
export const getCurrentSession = (state) => getPosState(state).currentSession;
export const getIsSessionActive = (state) => getPosState(state).isSessionActive;

// Settings selectors
export const getPosSettings = (state) => getPosState(state).posSettings;
