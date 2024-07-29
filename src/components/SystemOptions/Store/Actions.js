import store from "../../../store";
import { actions as CreateAccount } from "./Reducers/Reducers";

export const setCurrentStep = async (payload) => {
  try {
    store.dispatch(CreateAccount.setCurrentStep(payload));
  } catch (error) {
    console.error(error);
  }
};

export const setCurrentAccount = async (payload) => {
  try {
    store.dispatch(CreateAccount.setCurrentAccount(payload));
  } catch (error) {
    console.error(error);
  }
};

export const setCurrentAvatar = async (payload) => {
  try {
    store.dispatch(CreateAccount.setCurrentAvatar(payload));
  } catch (error) {
    console.error(error);
  }
};

export const setCurrentPermissions = async (payload) => {
  try {
    store.dispatch(CreateAccount.setCurrentPermissions(payload));
  } catch (error) {
    console.error(error);
  }
};

export const setAllClaims = async (payload) => {
  try {
    store.dispatch(CreateAccount.setAllClaims(payload));
  } catch (error) {
    console.error(error);
  }
};

export const setChangedPermissions = async (payload) => {
  try {
    store.dispatch(CreateAccount.setChangedPermissions(payload));
  } catch (error) {
    console.error(error);
  }
};

export const setCurrentGroupPermission = async (payload) => {
  try {
    store.dispatch(CreateAccount.setCurrentGroupPermission(payload || []));
  } catch (error) {
    console.error(error);
  }
};

export const setCurrentUnitsPermission = async (payload) => {
  try {
    store.dispatch(CreateAccount.setCurrentUnitsPermission(payload));
  } catch (error) {
    console.error(error);
  }
};
