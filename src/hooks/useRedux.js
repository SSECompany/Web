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
import {
  clearAllMasterData,
  fetchMaGiaoDichList,
  fetchMaKhachList,
  fetchMaKhoList,
  fetchTkCoList,
  // Master data actions & selectors
  fetchVatTuList,
  forceRefresh,
  selectAllDataLoaded,
  selectGlobalLoading,
  selectHasErrors,
  selectMaGiaoDichOptions,
  selectMaKhachLoading,
  selectMaKhachOptions,
  selectMaKhoLoading,
  selectMaKhoOptions,
  selectTkCoLoading,
  selectTkCoOptions,
  selectVatTuLoading,
  selectVatTuOptions,
} from "../store/slices/masterDataSlice";

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

// 🚀 Custom hook cho Master Data
export const useMasterData = () => {
  const dispatch = useDispatch();

  // Selectors
  const vatTuOptions = useSelector(selectVatTuOptions);
  const vatTuLoading = useSelector(selectVatTuLoading);
  const maGiaoDichOptions = useSelector(selectMaGiaoDichOptions);
  const tkCoOptions = useSelector(selectTkCoOptions);
  const tkCoLoading = useSelector(selectTkCoLoading);
  const maKhoOptions = useSelector(selectMaKhoOptions);
  const maKhoLoading = useSelector(selectMaKhoLoading);
  const maKhachOptions = useSelector(selectMaKhachOptions);
  const maKhachLoading = useSelector(selectMaKhachLoading);
  const globalLoading = useSelector(selectGlobalLoading);
  const allDataLoaded = useSelector(selectAllDataLoaded);
  const hasErrors = useSelector(selectHasErrors);

  // 🔥 Memoized actions để tránh re-renders
  const actions = useMemo(
    () => ({
      fetchVatTu: (keyword) => dispatch(fetchVatTuList(keyword)),
      fetchMaGiaoDich: () => dispatch(fetchMaGiaoDichList()),
      fetchTkCo: (keyword) => dispatch(fetchTkCoList(keyword)),
      fetchMaKho: (keyword) => dispatch(fetchMaKhoList(keyword)),
      fetchMaKhach: (keyword) => dispatch(fetchMaKhachList(keyword)),
      clearAll: () => dispatch(clearAllMasterData()),
      forceRefreshData: (dataType) => dispatch(forceRefresh({ dataType })),
    }),
    [dispatch]
  );

  // 🔥 Batch fetch function
  const fetchAllData = useCallback(() => {
    actions.fetchVatTu();
    actions.fetchMaGiaoDich();
    actions.fetchTkCo();
    actions.fetchMaKho();
    actions.fetchMaKhach();
  }, [actions]);

  return {
    // Data
    vatTu: { options: vatTuOptions, loading: vatTuLoading },
    maGiaoDich: { options: maGiaoDichOptions },
    tkCo: { options: tkCoOptions, loading: tkCoLoading },
    maKho: { options: maKhoOptions, loading: maKhoLoading },
    maKhach: { options: maKhachOptions, loading: maKhachLoading },

    // Global state
    globalLoading,
    allDataLoaded,
    hasErrors,

    // Actions
    ...actions,
    fetchAllData,
  };
};

// 🚀 Custom hook cho specific data type
export const useDataType = (dataType) => {
  const dispatch = useDispatch();

  const data = useSelector((state) => {
    switch (dataType) {
      case "vatTu":
        return {
          options: selectVatTuOptions(state),
          loading: selectVatTuLoading(state),
        };
      case "tkCo":
        return {
          options: selectTkCoOptions(state),
          loading: selectTkCoLoading(state),
        };
      case "maKho":
        return {
          options: selectMaKhoOptions(state),
          loading: selectMaKhoLoading(state),
        };
      case "maKhach":
        return {
          options: selectMaKhachOptions(state),
          loading: selectMaKhachLoading(state),
        };
      case "maGiaoDich":
        return {
          options: selectMaGiaoDichOptions(state),
          loading: false, // No loading state for this
        };
      default:
        return { options: [], loading: false };
    }
  });

  const fetch = useCallback(
    (keyword) => {
      switch (dataType) {
        case "vatTu":
          dispatch(fetchVatTuList(keyword));
          break;
        case "tkCo":
          dispatch(fetchTkCoList(keyword));
          break;
        case "maKho":
          dispatch(fetchMaKhoList(keyword));
          break;
        case "maKhach":
          dispatch(fetchMaKhachList(keyword));
          break;
        case "maGiaoDich":
          dispatch(fetchMaGiaoDichList());
          break;
        default:
          console.warn(`Unknown data type: ${dataType}`);
      }
    },
    [dispatch, dataType]
  );

  const refresh = useCallback(() => {
    dispatch(forceRefresh({ dataType }));
    fetch();
  }, [dispatch, dataType, fetch]);

  return {
    ...data,
    fetch,
    refresh,
  };
};

// 🚀 Custom hook cho debounced search
export const useDebouncedSearch = (dataType, delay = 500) => {
  const { fetch, ...rest } = useDataType(dataType);

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

// 🚀 Custom hook cho component initialization
export const useInitializeApp = () => {
  const { isAuthenticated } = useAuth();
  const { fetchAllData, allDataLoaded } = useMasterData();

  useEffect(() => {
    if (isAuthenticated && !allDataLoaded) {
      console.log("🚀 Initializing app data...");
      fetchAllData();
    }
  }, [isAuthenticated, allDataLoaded, fetchAllData]);

  return {
    isAuthenticated,
    allDataLoaded,
  };
};

// 🚀 Custom hook cho form optimization
export const useFormData = () => {
  const { userInfo } = useAuth();
  const masterData = useMasterData();

  // 🔥 Memoized form options
  const formOptions = useMemo(
    () => ({
      maGiaoDich: masterData.maGiaoDich.options.map((item) => ({
        value: item.ma_gd?.trim(),
        label: `${item.ma_gd?.trim()} - ${item.ten_gd}`,
      })),
      tkCo: masterData.tkCo.options,
      maKho: masterData.maKho.options,
      maKhach: masterData.maKhach.options,
      vatTu: masterData.vatTu.options,
    }),
    [masterData]
  );

  // 🔥 Memoized default values
  const defaultValues = useMemo(
    () => ({
      ma_dvcs: userInfo.unitId || "VIKOSAN",
      user_id: userInfo.userId || 4061,
      userName: userInfo.userName || "",
      unitName: userInfo.unitName || "VIKOSAN",
    }),
    [userInfo]
  );

  return {
    formOptions,
    defaultValues,
    userInfo,
    ...masterData,
  };
};

// 🚀 Export all hooks
export default {
  useAuth,
  useMasterData,
  useDataType,
  useDebouncedSearch,
  useInitializeApp,
  useFormData,
};
