import { useCallback, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setClaims } from "../store/reducers/claimsSlice";
// Master data imports removed - will be implemented for pharmacy module

// 🚀 Custom hook cho Auth
export const useAuth = () => {
  const dispatch = useDispatch();

  // Lấy data từ claimsReducer và localStorage
  const userInfo = useSelector((state) => state?.claimsReducer?.userInfo || {});
  const token = useSelector((state) => localStorage.getItem("access_token"));
  const isAuthenticated = useSelector((state) => {
    const token = localStorage.getItem("access_token");
    const tokenExpiry = localStorage.getItem("token_expiry");
    return !!token && tokenExpiry && Date.now() < parseInt(tokenExpiry);
  });
  const error = useSelector((state) => null); // No error state in claimsReducer
  const loading = useSelector((state) => false); // No loading state in claimsReducer
  const userDisplay = useSelector((state) => {
    const userInfo = state?.claimsReducer?.userInfo || {};
    return userInfo.userName || userInfo.unitName || "Unknown User";
  });
  const isValidSession = useSelector((state) => {
    const token = localStorage.getItem("access_token");
    const tokenExpiry = localStorage.getItem("token_expiry");
    return !!token && tokenExpiry && Date.now() < parseInt(tokenExpiry);
  });

  const loginUser = useCallback(
    (authData) => {
      // Set claims data
      if (authData.claims) {
        dispatch(setClaims(authData.claims));
      }
      
      // Set localStorage data
      if (authData.token) {
        localStorage.setItem("access_token", authData.token);
      }
      if (authData.refreshToken) {
        localStorage.setItem("refresh_token", authData.refreshToken);
      }
      if (authData.tokenExpiry) {
        localStorage.setItem("token_expiry", authData.tokenExpiry.toString());
      }
    },
    [dispatch]
  );

  const logoutUser = useCallback(() => {
    // Clear claims data
    dispatch(setClaims([]));
    
    // Clear localStorage
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("token_expiry");
    localStorage.removeItem("claims");
  }, [dispatch]);

  const updateUser = useCallback(
    (userData) => {
      // Update claims data
      dispatch(setClaims(userData));
    },
    [dispatch]
  );

  const clearError = useCallback(() => {
    // No error state to clear
  }, []);

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
