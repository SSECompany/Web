// Phenikaa POS Selectors
export const getPhenikaaState = (state) => state.phenikaaReducer;

// Dashboard selectors
export const getDashboardStats = (state) => getPhenikaaState(state).dashboardStats;

// Order selectors
export const getOrders = (state) => getPhenikaaState(state).orders;
export const getCurrentOrder = (state) => getPhenikaaState(state).currentOrder;
export const getOrderLoading = (state) => getPhenikaaState(state).orderLoading;
export const getOrderFilters = (state) => getPhenikaaState(state).orderFilters;

// Product selectors
export const getProducts = (state) => getPhenikaaState(state).products;
export const getProductLoading = (state) => getPhenikaaState(state).productLoading;
export const getProductFilters = (state) => getPhenikaaState(state).productFilters;

// Customer selectors
export const getCustomers = (state) => getPhenikaaState(state).customers;
export const getCustomerLoading = (state) => getPhenikaaState(state).customerLoading;
export const getCustomerFilters = (state) => getPhenikaaState(state).customerFilters;

// Session selectors
export const getCurrentSession = (state) => getPhenikaaState(state).currentSession;
export const getIsSessionActive = (state) => getPhenikaaState(state).isSessionActive;

// Settings selectors
export const getPosSettings = (state) => getPhenikaaState(state).posSettings;
