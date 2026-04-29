import { useState, useCallback, useRef, useMemo } from "react";
import { debounce } from "lodash";
import axiosInstance from "../../../../../../utils/axiosInstance";

/**
 * Custom hook quản lý tất cả API calls cho bảng vật tư
 * Tối ưu hiệu suất với debounce, caching và request cancellation
 */
export const useVatTuApi = () => {
  const [loadingStates, setLoadingStates] = useState({
    maKho: false,
    donViTinh: false,
  });

  const [selectData, setSelectData] = useState({
    maKhoList: [],
  });

  // Cache để tránh gọi API nhiều lần cho cùng một mã hàng
  const dvtCache = useRef({});
  const abortControllers = useRef({});

  // Hủy request cũ
  const cancelRequest = useCallback((key) => {
    if (abortControllers.current[key]) {
      abortControllers.current[key].abort();
      delete abortControllers.current[key];
    }
  }, []);

  // Fetch danh sách mã kho
  const fetchMaKhoList = useCallback(async (searchTerm = "") => {
    cancelRequest("maKho");
    
    const controller = new AbortController();
    abortControllers.current.maKho = controller;

    setLoadingStates((prev) => ({ ...prev, maKho: true }));

    try {
      const response = await axiosInstance.get("/danh-muc/ma-kho", {
        params: { search: searchTerm, limit: 50 },
        signal: controller.signal,
      });

      if (response.data && response.data.result) {
        const options = response.data.result.map((item) => ({
          value: item.ma_kho,
          label: `${item.ma_kho} - ${item.ten_kho}`,
        }));
        setSelectData((prev) => ({ ...prev, maKhoList: options }));
      }
    } catch (error) {
      if (error.name !== "AbortError") {
        console.error("Error fetching ma kho list:", error);
      }
    } finally {
      setLoadingStates((prev) => ({ ...prev, maKho: false }));
      delete abortControllers.current.maKho;
    }
  }, [cancelRequest]);

  // Debounced version cho search
  const fetchMaKhoListDebounced = useMemo(
    () => debounce((searchTerm) => {
      fetchMaKhoList(searchTerm);
    }, 300),
    [fetchMaKhoList]
  );

  // Fetch đơn vị tính với caching
  const fetchDonViTinh = useCallback(async (maHang, forceRefresh = false) => {
    if (!maHang) return [];

    // Kiểm tra cache nếu không force refresh
    if (!forceRefresh && dvtCache.current[maHang]) {
      return dvtCache.current[maHang];
    }

    const cacheKey = `dvt_${maHang}`;
    cancelRequest(cacheKey);

    const controller = new AbortController();
    abortControllers.current[cacheKey] = controller;

    try {
      const response = await axiosInstance.get(`/vat-tu/don-vi-tinh/${maHang}`, {
        signal: controller.signal,
      });

      if (response.data && response.data.result) {
        const dvtList = response.data.result;
        // Lưu vào cache
        dvtCache.current[maHang] = dvtList;
        return dvtList;
      }
      return [];
    } catch (error) {
      if (error.name !== "AbortError") {
        console.error("Error fetching don vi tinh:", error);
      }
      return [];
    } finally {
      delete abortControllers.current[cacheKey];
    }
  }, [cancelRequest]);

  // Clear specific cache or all
  const clearCache = useCallback((type = null) => {
    if (type === 'donViTinh') {
      dvtCache.current = {};
    } else if (type === 'all') {
      dvtCache.current = {};
    }
  }, []);

  // Cleanup function
  const cleanup = useCallback(() => {
    // Hủy tất cả requests đang chạy
    Object.keys(abortControllers.current).forEach((key) => {
      cancelRequest(key);
    });
    // Clear cache nếu cần
    dvtCache.current = {};
  }, [cancelRequest]);

  return {
    loadingStates,
    selectData,
    apiHandlers: {
      fetchMaKhoList,
      fetchMaKhoListDebounced,
      fetchDonViTinh,
    },
    clearCache,
    cleanup,
  };
};