import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  // Dashboard data
  dashboardStats: {
    todayOrders: 0,
    totalCustomers: 0,
    totalRevenue: 0,
    totalProducts: 0,
  },
  
  // Orders management
  orders: [],
  currentOrder: null,
  orderLoading: false,
  orderFilters: {
    search: "",
    status: "",
    paymentMethod: "",
    dateRange: null,
  },
  
  // Products management
  products: [],
  productLoading: false,
  productFilters: {
    search: "",
    category: "",
    status: "active",
  },
  
  // Customers management
  customers: [],
  customerLoading: false,
  customerFilters: {
    search: "",
    type: "",
  },
  
  // POS session
  currentSession: null,
  isSessionActive: false,
  
  // Settings
  posSettings: {
    storeName: "Phenikaa POS",
    currency: "VNĐ",
    taxRate: 10,
    receiptFooter: "Cảm ơn quý khách!",
  },
};

const phenikaaSlice = createSlice({
  name: "phenikaa",
  initialState,
  reducers: {
    // Dashboard actions
    setDashboardStats: (state, action) => {
      state.dashboardStats = { ...state.dashboardStats, ...action.payload };
    },
    
    // Order actions
    setOrders: (state, action) => {
      state.orders = action.payload;
    },
    
    setCurrentOrder: (state, action) => {
      state.currentOrder = action.payload;
    },
    
    setOrderLoading: (state, action) => {
      state.orderLoading = action.payload;
    },
    
    setOrderFilters: (state, action) => {
      state.orderFilters = { ...state.orderFilters, ...action.payload };
    },
    
    addOrder: (state, action) => {
      state.orders.unshift(action.payload);
    },
    
    updateOrder: (state, action) => {
      const index = state.orders.findIndex(order => order.id === action.payload.id);
      if (index !== -1) {
        state.orders[index] = { ...state.orders[index], ...action.payload };
      }
    },
    
    // Product actions
    setProducts: (state, action) => {
      state.products = action.payload;
    },
    
    setProductLoading: (state, action) => {
      state.productLoading = action.payload;
    },
    
    setProductFilters: (state, action) => {
      state.productFilters = { ...state.productFilters, ...action.payload };
    },
    
    addProduct: (state, action) => {
      state.products.unshift(action.payload);
    },
    
    updateProduct: (state, action) => {
      const index = state.products.findIndex(product => product.id === action.payload.id);
      if (index !== -1) {
        state.products[index] = { ...state.products[index], ...action.payload };
      }
    },
    
    // Customer actions
    setCustomers: (state, action) => {
      state.customers = action.payload;
    },
    
    setCustomerLoading: (state, action) => {
      state.customerLoading = action.payload;
    },
    
    setCustomerFilters: (state, action) => {
      state.customerFilters = { ...state.customerFilters, ...action.payload };
    },
    
    addCustomer: (state, action) => {
      state.customers.unshift(action.payload);
    },
    
    updateCustomer: (state, action) => {
      const index = state.customers.findIndex(customer => customer.id === action.payload.id);
      if (index !== -1) {
        state.customers[index] = { ...state.customers[index], ...action.payload };
      }
    },
    
    // Session actions
    startSession: (state, action) => {
      state.currentSession = action.payload;
      state.isSessionActive = true;
    },
    
    endSession: (state) => {
      state.currentSession = null;
      state.isSessionActive = false;
    },
    
    // Settings actions
    updateSettings: (state, action) => {
      state.posSettings = { ...state.posSettings, ...action.payload };
    },
    
    // Reset action
    resetPhenikaaState: () => initialState,
  },
});

export const {
  // Dashboard actions
  setDashboardStats,
  
  // Order actions
  setOrders,
  setCurrentOrder,
  setOrderLoading,
  setOrderFilters,
  addOrder,
  updateOrder,
  
  // Product actions
  setProducts,
  setProductLoading,
  setProductFilters,
  addProduct,
  updateProduct,
  
  // Customer actions
  setCustomers,
  setCustomerLoading,
  setCustomerFilters,
  addCustomer,
  updateCustomer,
  
  // Session actions
  startSession,
  endSession,
  
  // Settings actions
  updateSettings,
  
  // Reset action
  resetPhenikaaState,
} = phenikaaSlice.actions;

export const phenikaaReducer = phenikaaSlice.reducer;
