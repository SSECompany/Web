import { message } from "antd";
import { debounce } from "lodash";
import { useCallback, useMemo, useState } from "react";
import https from "../../../../../utils/https";

// Global cache for master data
const masterDataCache = {
  maGiaoDich: null,
  maKhach: null,
  vatTu: null,
  lastFetch: null,
};

const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

export const usePhieuXuatKhoData = () => {
  const [loading, setLoading] = useState(false);
  const [maGiaoDichList, setMaGiaoDichList] = useState([]);
  const [maKhachList, setMaKhachList] = useState([]);
  const [loadingMaKhach, setLoadingMaKhach] = useState(false);
  const [vatTuList, setVatTuList] = useState([]);
  const [loadingVatTu, setLoadingVatTu] = useState(false);

  const token = localStorage.getItem("access_token");

  // Check if cache is still valid
  const isCacheValid = useMemo(() => {
    if (!masterDataCache.lastFetch) return false;
    return Date.now() - masterDataCache.lastFetch < CACHE_EXPIRY;
  }, []);

  // Memoize all API functions to prevent re-creation
  const fetchMaGiaoDichList = useCallback(async () => {
    // Return cached data if valid
    if (isCacheValid && masterDataCache.maGiaoDich) {
      setMaGiaoDichList(masterDataCache.maGiaoDich);
      return;
    }

    try {
      const response = await https.get(
        "v1/web/danh-sach-ma-gd",
        { ma_ct: "HDA" },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.data && response.data.data) {
        const data = response.data.data;
        setMaGiaoDichList(data);
        // Cache the data
        masterDataCache.maGiaoDich = data;
        masterDataCache.lastFetch = Date.now();
      }
    } catch (error) {
      message.error("Không thể tải danh sách mã giao dịch");
    }
  }, [isCacheValid, token]);

  const fetchMaKhachList = useCallback(
    async (keyword = "") => {
      // Skip cache for search queries
      if (keyword && isCacheValid && masterDataCache.maKhach) {
        const filteredData = masterDataCache.maKhach.filter((item) =>
          item.label.toLowerCase().includes(keyword.toLowerCase())
        );
        setMaKhachList(filteredData);
        return;
      }

      setLoadingMaKhach(true);
      try {
        const response = await https.get(
          "v1/web/danh-sach-khach-hang",
          {
            searchMaKH: "",
            searchTenKH: keyword,
          },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (response.data && response.data.data) {
          const options = response.data.data.map((item) => ({
            value: item.ma_kh.trim(),
            label: `${item.ma_kh.trim()} - ${item.ten_kh.trim()}`,
          }));
          setMaKhachList(options);

          // Cache only if no search keyword
          if (!keyword) {
            masterDataCache.maKhach = options;
            masterDataCache.lastFetch = Date.now();
          }
        }
      } catch (error) {
        message.error("Không thể tải danh sách khách hàng");
      } finally {
        setLoadingMaKhach(false);
      }
    },
    [isCacheValid, token]
  );

  const fetchVatTuList = useCallback(
    async (keyword = "") => {
      // Use cache for empty search
      if (!keyword && isCacheValid && masterDataCache.vatTu) {
        setVatTuList(masterDataCache.vatTu);
        return;
      }

      try {
        setLoadingVatTu(true);
        const response = await https.post(
          "v1/web/danh-sach-vat-tu",
          {
            key_word: keyword,
          },
          {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          }
        );

        if (response.data && response.data.data) {
          const options = response.data.data.map((item) => ({
            label: `${item.ma_vt} - ${item.ten_vt}`,
            value: item.ma_vt,
            ...item,
          }));
          setVatTuList(options);

          // Cache only if no search keyword
          if (!keyword) {
            masterDataCache.vatTu = options;
            masterDataCache.lastFetch = Date.now();
          }
        }
      } catch (error) {
        console.error("Error fetching vat tu list:", error);
        message.error("Không thể tải danh sách vật tư");
      } finally {
        setLoadingVatTu(false);
      }
    },
    [isCacheValid, token]
  );

  const fetchVatTuDetail = useCallback(
    async (maVatTu) => {
      try {
        const response = await https.post(
          "v1/web/tim-kiem-vat-tu",
          {
            key_word: maVatTu,
          },
          {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          }
        );

        if (response.data && response.data.data) {
          return response.data.data;
        }
        return null;
      } catch (error) {
        console.error("Error fetching vat tu detail:", error);
        message.error("Không thể tải thông tin vật tư");
        return null;
      }
    },
    [token]
  );

  const fetchDonViTinh = useCallback(
    async (maVatTu) => {
      try {
        const response = await https.get(
          "v1/web/danh-sach-dv",
          {
            ma_vt: maVatTu,
          },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.data && response.data.data) {
          return response.data.data;
        }
        return [];
      } catch (error) {
        console.error("Error fetching don vi tinh:", error);
        return [];
      }
    },
    [token]
  );

  // Memoize debounced functions with stable references
  const fetchMaKhachListDebounced = useMemo(
    () =>
      debounce((keyword) => {
        fetchMaKhachList(keyword);
      }, 500),
    [fetchMaKhachList]
  );

  const fetchVatTuListDebounced = useMemo(
    () =>
      debounce((keyword) => {
        fetchVatTuList(keyword);
      }, 500),
    [fetchVatTuList]
  );

  // Clear cache function
  const clearCache = useCallback(() => {
    masterDataCache.maGiaoDich = null;
    masterDataCache.maKhach = null;
    masterDataCache.vatTu = null;
    masterDataCache.lastFetch = null;
  }, []);

  return {
    loading,
    setLoading,
    maGiaoDichList,
    maKhachList,
    loadingMaKhach,
    vatTuList,
    loadingVatTu,
    fetchMaKhachListDebounced,
    fetchVatTuListDebounced,
    fetchMaGiaoDichList,
    fetchMaKhachList,
    fetchVatTuList,
    fetchVatTuDetail,
    fetchDonViTinh,
    setVatTuList,
    clearCache, // Export clear cache function
  };
};
