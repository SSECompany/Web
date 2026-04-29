import { useDispatch, useSelector } from "react-redux";
import {
  addTab,
  clearAllTabs,
  removeTab,
  setActiveTab,
  setListCategory,
  setListItemExtra,
  setListOrderInfo,
  setListOrderTable,
  setMenuItems,
  setSelectedCategory,
  setSelectedItem,
  updateOrder,
  updateTab,
} from "../store/kho";

export const useKho = () => {
  const dispatch = useDispatch();
  const khoState = useSelector((state) => state.kho);

  return {
    // State
    ...khoState,

    // Actions
    addTab: (payload) => dispatch(addTab(payload)),
    updateTab: (payload) => dispatch(updateTab(payload)),
    removeTab: (payload) => dispatch(removeTab(payload)),
    setActiveTab: (payload) => dispatch(setActiveTab(payload)),
    updateOrder: (payload) => dispatch(updateOrder(payload)),
    setListOrderTable: (payload) => dispatch(setListOrderTable(payload)),
    setListOrderInfo: (payload) => dispatch(setListOrderInfo(payload)),
    setListCategory: (payload) => dispatch(setListCategory(payload)),
    setSelectedCategory: (payload) => dispatch(setSelectedCategory(payload)),
    setMenuItems: (payload) => dispatch(setMenuItems(payload)),
    setSelectedItem: (payload) => dispatch(setSelectedItem(payload)),
    setListItemExtra: (payload) => dispatch(setListItemExtra(payload)),
    clearAllTabs: () => dispatch(clearAllTabs()),
  };
};



