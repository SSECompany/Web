import store from "../../../../store";
import { actions as approveItemActions } from "../Slices/ApproveItems";
import { actions as ItemsListActions } from "../Slices/Item";

export const setApproveItemDetail = async (payload) => {
  try {
    store.dispatch(approveItemActions.setDetailData(payload));
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
};

export const setCurrentItem = async (payload) => {
  try {
    store.dispatch(ItemsListActions.setCurrentItem(payload));
  } catch (error) {
    console.error(error);
  }
};

export const setIsOpenItemListModal = async (payload) => {
  try {
    store.dispatch(ItemsListActions.setIsOpenModal(payload));
  } catch (error) {
    console.error(error);
  }
};

export const setOpenItemListModalType = async (payload) => {
  try {
    store.dispatch(ItemsListActions.setIsOpenType(payload));
  } catch (error) {
    console.error(error);
  }
};
