import https from "../../../utils/https";

// Base API endpoint for Phenikaa POS
const PHENIKAA_API_BASE = "phenikaa";

// Dashboard APIs
export const getDashboardStats = async () => {
  return await https.get(`${PHENIKAA_API_BASE}/dashboard/stats`).then((res) => {
    return res.data;
  });
};

// Order APIs
export const getOrders = async (params = {}) => {
  return await https.get(`${PHENIKAA_API_BASE}/orders`, { params }).then((res) => {
    return res.data;
  });
};

export const getOrderById = async (orderId) => {
  return await https.get(`${PHENIKAA_API_BASE}/orders/${orderId}`).then((res) => {
    return res.data;
  });
};

export const createOrder = async (orderData) => {
  return await https.post(`${PHENIKAA_API_BASE}/orders`, orderData).then((res) => {
    return res.data;
  });
};

export const updateOrder = async (orderId, orderData) => {
  return await https.put(`${PHENIKAA_API_BASE}/orders/${orderId}`, orderData).then((res) => {
    return res.data;
  });
};

export const deleteOrder = async (orderId) => {
  return await https.delete(`${PHENIKAA_API_BASE}/orders/${orderId}`).then((res) => {
    return res.data;
  });
};

// Product APIs
export const getProducts = async (params = {}) => {
  return await https.get(`${PHENIKAA_API_BASE}/products`, { params }).then((res) => {
    return res.data;
  });
};

export const getProductById = async (productId) => {
  return await https.get(`${PHENIKAA_API_BASE}/products/${productId}`).then((res) => {
    return res.data;
  });
};

export const createProduct = async (productData) => {
  return await https.post(`${PHENIKAA_API_BASE}/products`, productData).then((res) => {
    return res.data;
  });
};

export const updateProduct = async (productId, productData) => {
  return await https.put(`${PHENIKAA_API_BASE}/products/${productId}`, productData).then((res) => {
    return res.data;
  });
};

export const deleteProduct = async (productId) => {
  return await https.delete(`${PHENIKAA_API_BASE}/products/${productId}`).then((res) => {
    return res.data;
  });
};

// Customer APIs
export const getCustomers = async (params = {}) => {
  return await https.get(`${PHENIKAA_API_BASE}/customers`, { params }).then((res) => {
    return res.data;
  });
};

export const getCustomerById = async (customerId) => {
  return await https.get(`${PHENIKAA_API_BASE}/customers/${customerId}`).then((res) => {
    return res.data;
  });
};

export const createCustomer = async (customerData) => {
  return await https.post(`${PHENIKAA_API_BASE}/customers`, customerData).then((res) => {
    return res.data;
  });
};

export const updateCustomer = async (customerId, customerData) => {
  return await https.put(`${PHENIKAA_API_BASE}/customers/${customerId}`, customerData).then((res) => {
    return res.data;
  });
};

export const deleteCustomer = async (customerId) => {
  return await https.delete(`${PHENIKAA_API_BASE}/customers/${customerId}`).then((res) => {
    return res.data;
  });
};

// Report APIs
export const getSalesReport = async (params = {}) => {
  return await https.get(`${PHENIKAA_API_BASE}/reports/sales`, { params }).then((res) => {
    return res.data;
  });
};

export const getProductReport = async (params = {}) => {
  return await https.get(`${PHENIKAA_API_BASE}/reports/products`, { params }).then((res) => {
    return res.data;
  });
};

export const getCustomerReport = async (params = {}) => {
  return await https.get(`${PHENIKAA_API_BASE}/reports/customers`, { params }).then((res) => {
    return res.data;
  });
};

// Settings APIs
export const getSettings = async () => {
  return await https.get(`${PHENIKAA_API_BASE}/settings`).then((res) => {
    return res.data;
  });
};

export const updateSettings = async (settingsData) => {
  return await https.put(`${PHENIKAA_API_BASE}/settings`, settingsData).then((res) => {
    return res.data;
  });
};

// Session APIs
export const startPosSession = async (sessionData) => {
  return await https.post(`${PHENIKAA_API_BASE}/sessions/start`, sessionData).then((res) => {
    return res.data;
  });
};

export const endPosSession = async (sessionId) => {
  return await https.post(`${PHENIKAA_API_BASE}/sessions/${sessionId}/end`).then((res) => {
    return res.data;
  });
};

export const getCurrentSession = async () => {
  return await https.get(`${PHENIKAA_API_BASE}/sessions/current`).then((res) => {
    return res.data;
  });
};
