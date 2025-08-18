import { useCallback, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  clearError as clearAuthError,
  login,
  logout,
  selectAuthError,
  selectAuthLoading,
  selectIsAuthenticated,
  selectIsValidSession,
  selectToken,
  selectUserDisplay,
  // Auth actions & selectors
  selectUserInfo,
  setUser,
} from "../store/slices/authSlice";
// Master data imports removed - will be implemented for pharmacy module

// 🚀 Custom hook cho Auth
export const useAuth = () => {
  const dispatch = useDispatch();

  const userInfo = useSelector(selectUserInfo);
  const token = useSelector(selectToken);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const error = useSelector(selectAuthError);
  const loading = useSelector(selectAuthLoading);
  const userDisplay = useSelector(selectUserDisplay);
  const isValidSession = useSelector(selectIsValidSession);

  const loginUser = useCallback(
    (authData) => {
      dispatch(login(authData));
    },
    [dispatch]
  );

  const logoutUser = useCallback(() => {
    dispatch(logout());
  }, [dispatch]);

  const updateUser = useCallback(
    (userData) => {
      dispatch(setUser(userData));
    },
    [dispatch]
  );

  const clearError = useCallback(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  return {
    // State
    userInfo,
    token,
    isAuthenticated,
    error,
    loading,
    userDisplay,
    isValidSession,
    // Actions
    login: loginUser,
    logout: logoutUser,
    updateUser,
    clearError,
  };
};

// 🚀 Custom hook cho Pharmacy Data - will be implemented later
export const usePharmacyData = () => {
  // Placeholder for pharmacy-specific data hooks
  return {
    products: { options: [], loading: false },
    suppliers: { options: [], loading: false },
    customers: { options: [], loading: false },
    inventory: { options: [], loading: false },
  };
};

// 🚀 Custom hook cho pharmacy data types - placeholder
export const usePharmacyDataType = (dataType) => {
  // Placeholder for pharmacy-specific data type hooks
  const data = { options: [], loading: false };

  const fetch = useCallback(() => {
    console.log(`Fetching ${dataType} - to be implemented`);
  }, [dataType]);

  const refresh = useCallback(() => {
    console.log(`Refreshing ${dataType} - to be implemented`);
  }, [dataType]);

  return {
    ...data,
    fetch,
    refresh,
  };
};

// 🚀 Custom hook cho debounced search - placeholder
export const usePharmacyDebouncedSearch = (dataType, delay = 500) => {
  const { fetch, ...rest } = usePharmacyDataType(dataType);

  const debouncedFetch = useMemo(() => {
    let timeoutId;
    return (keyword) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        fetch(keyword);
      }, delay);
    };
  }, [fetch, delay]);

  return {
    ...rest,
    debouncedFetch,
    fetch,
  };
};

// 🚀 Custom hook cho pharmacy app initialization
export const useInitializePharmacy = () => {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      // Initialize pharmacy data when authenticated
      console.log("Initializing pharmacy app...");
    }
  }, [isAuthenticated]);

  return {
    isAuthenticated,
    isInitialized: true, // Placeholder
  };
};

// 🚀 Custom hook cho pharmacy form data
export const usePharmacyFormData = () => {
  const { userInfo } = useAuth();
  const pharmacyData = usePharmacyData();

  // 🔥 Memoized form options for pharmacy
  const formOptions = useMemo(
    () => ({
      products: pharmacyData.products.options,
      suppliers: pharmacyData.suppliers.options,
      customers: pharmacyData.customers.options,
      inventory: pharmacyData.inventory.options,
    }),
    [pharmacyData]
  );

  // 🔥 Memoized default values
  const defaultValues = useMemo(
    () => ({
      pharmacyId: userInfo.unitId || "PHARMACY",
      userId: userInfo.userId || 4061,
      userName: userInfo.userName || "",
      pharmacyName: userInfo.unitName || "PHARMACY",
    }),
    [userInfo]
  );

  return {
    formOptions,
    defaultValues,
    userInfo,
    ...pharmacyData,
  };
};

// 🚀 Export all hooks
export default {
  useAuth,
  usePharmacyData,
  usePharmacyDataType,
  usePharmacyDebouncedSearch,
  useInitializePharmacy,
  usePharmacyFormData,
};
