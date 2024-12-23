export const getDMSCustomerList = (state) => {
  return state.DMSCustomersReducer.Customers;
};

export const getcurrentDMSCustomer = (state) => {
  return state.DMSCustomersReducer.CurrentCustomer;
};

export const getActiveTab = (state) => {
  return state.DMSCustomersReducer.activeTab;
};

export const getTourDetail = (state) => {
  return state.tourDetailsReducer.detailData;
};

export const getTaskDetail = (state) => {
  return state.taskReducer.detailData;
};

export const getCurrentImagesList = (state) => {
  return state.imagesListReducer.currentImagesList;
};

export const getCurrentImageIndex = (state) => {
  return state.imagesListReducer.currentImageIndex;
};

export const getBusinessMapState = (state) => {
  return state.businessMapReducer;
};
