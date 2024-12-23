export const getApproveItemDetail = (store) => {
  return store.approveItemsReducer.detailData;
};

export const getCurrentItem = (store) => {
  return store.itemsListReducer.currentItem;
};

export const getIsOpenItemListModal = (store) => {
  return store.itemsListReducer.isOpenModal;
};

export const getOpenItemListModalType = (store) => {
  return store.itemsListReducer.openType;
};
