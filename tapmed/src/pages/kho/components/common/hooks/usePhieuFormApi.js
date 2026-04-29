import { debounce } from "lodash";
import { useCallback, useEffect, useRef, useState } from "react";
import axiosInstance from "../../../../utils/axiosInstance";

/**
 * Custom hook tối ưu cho API calls trong form phiếu
 * Giảm duplicate code và tối ưu performance
 */
export const usePhieuFormApi = (formType = "nhat-hang") => {
  // Loading states
  const [loadingStates, setLoadingStates] = useState({
    maKhach: false,
    maKho: false,
    maGiaoDich: false,
  });

  // Data states
  const [selectData, setSelectData] = useState({
    maKhachList: [],
    maKhoList: [],
    maGiaoDichList: [],
  });

  // Cache và abort controllers
  const cache = useRef({});
  const abortControllers = useRef({});

  // Cancel request utility
  const cancelRequest = useCallback((key) => {
    if (abortControllers.current[key]) {
      abortControllers.current[key].abort();
      delete abortControllers.current[key];
    }
  }, []);

  // Generic fetch function với caching
  const fetchWithCache = useCallback(
    async (key, url, params = {}) => {
      const cacheKey = `${key}_${JSON.stringify(params)}`;

      // Return cached data if exists
      if (cache.current[cacheKey]) {
        return cache.current[cacheKey];
      }

      cancelRequest(key);

      const controller = new AbortController();
      abortControllers.current[key] = controller;

      setLoadingStates((prev) => ({ ...prev, [key]: true }));

      try {
        const response = await axiosInstance.get(url, {
          params,
          signal: controller.signal,
        });

        if (response.data && response.data.result) {
          cache.current[cacheKey] = response.data.result;
          return response.data.result;
        }
        return [];
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error(`Error fetching ${key}:`, error);
        }
        return [];
      } finally {
        setLoadingStates((prev) => ({ ...prev, [key]: false }));
        delete abortControllers.current[key];
      }
    },
    [cancelRequest]
  );

  // Fetch mã khách
  const fetchMaKhachList = useCallback(
    async (searchTerm = "") => {
      const result = await fetchWithCache("maKhach", "/danh-muc/ma-khach", {
        search: searchTerm,
        limit: 50,
      });

      const options = result.map((item) => ({
        value: item.ma_khach || item.ma_kh,
        label: `${item.ma_khach || item.ma_kh} - ${
          item.ten_khach || item.ten_kh
        }`,
      }));

      setSelectData((prev) => ({ ...prev, maKhachList: options }));
    },
    [fetchWithCache]
  );

  // Debounced search cho mã khách
  const fetchMaKhachListDebounced = useCallback(
    debounce((searchTerm) => {
      fetchMaKhachList(searchTerm);
    }, 300),
    [fetchMaKhachList]
  );

  // Fetch mã kho
  const fetchMaKhoList = useCallback(
    async (searchTerm = "") => {
      const result = await fetchWithCache("maKho", "/danh-muc/ma-kho", {
        search: searchTerm,
        limit: 50,
      });

      const options = result.map((item) => ({
        value: item.ma_kho,
        label: `${item.ma_kho} - ${item.ten_kho}`,
      }));

      setSelectData((prev) => ({ ...prev, maKhoList: options }));
    },
    [fetchWithCache]
  );

  // Debounced search cho mã kho
  const fetchMaKhoListDebounced = useCallback(
    debounce((searchTerm) => {
      fetchMaKhoList(searchTerm);
    }, 300),
    [fetchMaKhoList]
  );

  // Fetch mã giao dịch
  const fetchMaGiaoDichList = useCallback(async () => {
    // Check cache first
    if (
      cache.current["maGiaoDich_"] &&
      cache.current["maGiaoDich_"].length > 0
    ) {
      return;
    }

    const result = await fetchWithCache(
      "maGiaoDich",
      "/danh-muc/ma-giao-dich",
      { type: formType }
    );

    setSelectData((prev) => ({
      ...prev,
      maGiaoDichList: result,
    }));
  }, [fetchWithCache, formType]);

  // Clear cache utility
  const clearCache = useCallback((key) => {
    if (key) {
      Object.keys(cache.current).forEach((cacheKey) => {
        if (cacheKey.startsWith(key)) {
          delete cache.current[cacheKey];
        }
      });
    } else {
      cache.current = {};
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Cancel all pending requests
      Object.keys(abortControllers.current).forEach((key) => {
        cancelRequest(key);
      });
    };
  }, [cancelRequest]);

  return {
    // States
    loadingStates,
    selectData,

    // Handlers
    selectHandlers: {
      fetchMaKhachList,
      fetchMaKhachListDebounced,
      fetchMaKhoList,
      fetchMaKhoListDebounced,
      fetchMaGiaoDichList,
    },

    // Utilities
    clearCache,
  };
};

/**
 * Hook wrapper cho từng loại phiếu
 */
export const usePhieuNhapKhoApi = () => usePhieuFormApi("nhap-kho");
export const usePhieuXuatKhoApi = () => usePhieuFormApi("xuat-kho");
export const usePhieuNhapDieuChuyenApi = () =>
  usePhieuFormApi("nhap-dieu-chuyen");
export const usePhieuXuatKhoBanHangApi = () =>
  usePhieuFormApi("xuat-kho-ban-hang");
