import { message } from "antd";
import { debounce } from "lodash";
import { useCallback, useRef, useState } from "react";
import https from "../../../../../utils/https";
import { fetchVatTuListDynamicApi } from "../utils/phieuNhatHangUtils";

// Global cache for master data
const masterDataCache = {
  maGiaoDich: null,
  tkCo: null,
  maKho: null,
  maKhach: null,
  vatTu: null,
  donViTinh: {}, // Cache ĐVT theo maHang: { "ABC123": [{dvt: "Bo"}, {dvt: "Cai"}], ... }
  lastFetch: null,
};

const CACHE_EXPIRY = 30 * 60 * 1000; // 30 minutes - cache data trong 30 phút

export const usePhieuNhatHangData = () => {
  const [loading, setLoading] = useState(false);
  const [maGiaoDichList, setMaGiaoDichList] = useState([]);
  const [tkCoList, setTkCoList] = useState([]);
  const [loadingTkCo, setLoadingTkCo] = useState(false);
  const [maKhoList, setMaKhoList] = useState([]);
  const [loadingMaKho, setLoadingMaKho] = useState(false);
  const [maKhachList, setMaKhachList] = useState([]);
  const [loadingMaKhach, setLoadingMaKhach] = useState(false);
  const [vatTuList, setVatTuList] = useState([]);
  const [loadingVatTu, setLoadingVatTu] = useState(false);

  const token = localStorage.getItem("access_token");

  // Remove isCacheValid useMemo as it causes re-renders

  const fetchTkCoListDebounced = useRef(
    debounce((keyword) => {
      fetchTkCoList(keyword);
    }, 500)
  ).current;

  const fetchMaKhoListDebounced = useRef(
    debounce((keyword) => {
      fetchMaKhoList(keyword);
    }, 500)
  ).current;

  const fetchMaKhachListDebounced = useRef(
    debounce((keyword) => {
      fetchMaKhachList(keyword);
    }, 500)
  ).current;

  const fetchMaGiaoDichList = useCallback(async () => {
    // Return cached data if valid
    if (
      masterDataCache.lastFetch &&
      Date.now() - masterDataCache.lastFetch < CACHE_EXPIRY &&
      masterDataCache.maGiaoDich
    ) {
      setMaGiaoDichList(masterDataCache.maGiaoDich);
      return;
    }

    try {
      const response = await https.get(
        "v1/web/danh-sach-ma-gd",
        { ma_ct: "PND" },
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
  }, [token]);

  const fetchTkCoList = useCallback(
    async (keyword = "") => {
      // Use cache for empty search
      if (
        !keyword &&
        masterDataCache.lastFetch &&
        Date.now() - masterDataCache.lastFetch < CACHE_EXPIRY &&
        masterDataCache.tkCo
      ) {
        setTkCoList(masterDataCache.tkCo);
        return;
      }

      setLoadingTkCo(true);
      try {
        const response = await https.get(
          "v1/web/danh-sach-tk",
          { keyWord: keyword },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (response.data && response.data.data) {
          const options = response.data.data.map((item) => ({
            value: item.tk.trim(),
            label: `${item.tk.trim()} - ${item.ten_tk.trim()}`,
          }));
          setTkCoList(options);

          // Cache only if no search keyword
          if (!keyword) {
            masterDataCache.tkCo = options;
            masterDataCache.lastFetch = Date.now();
          }
        }
      } catch (error) {
        message.error("Không thể tải danh sách tài khoản");
      } finally {
        setLoadingTkCo(false);
      }
    },
    [token]
  );

  const fetchMaKhoList = useCallback(
    async (keyword = "", forceRefresh = false) => {
      // Kiểm tra cache trước khi call API
      if (!forceRefresh && !keyword) {
        // Nếu đã có data trong state, không cần gọi API
        if (maKhoList && maKhoList.length > 0) {
          return;
        }
        // Nếu có cache valid, sử dụng cache
        if (
          masterDataCache.lastFetch &&
          Date.now() - masterDataCache.lastFetch < CACHE_EXPIRY &&
          masterDataCache.maKho
        ) {
          setMaKhoList(masterDataCache.maKho);
          return;
        }
      }

      // Nếu đang search với keyword, kiểm tra cache và filter local
      if (
        keyword &&
        masterDataCache.maKho &&
        masterDataCache.lastFetch &&
        Date.now() - masterDataCache.lastFetch < CACHE_EXPIRY
      ) {
        const filteredData = masterDataCache.maKho.filter((item) =>
          item.label.toLowerCase().includes(keyword.toLowerCase())
        );
        setMaKhoList(filteredData);
        return;
      }

      setLoadingMaKho(true);
      try {
        const response = await https.get(
          "v1/web/danh-sach-kho",
          { keyword: keyword },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (response.data && response.data.data) {
          const options = response.data.data.map((item) => ({
            value: item.ma_kho.trim(),
            label: `${item.ma_kho.trim()} - ${item.ten_kho.trim()}`,
          }));
          setMaKhoList(options);

          // Cache only if no search keyword
          if (!keyword) {
            masterDataCache.maKho = options;
            masterDataCache.lastFetch = Date.now();
          }
        }
      } catch (error) {
        message.error("Không thể tải danh sách kho");
      } finally {
        setLoadingMaKho(false);
      }
    },
    [token]
  );

  const fetchMaKhachList = useCallback(
    async (keyword = "", forceRefresh = false) => {
      // Kiểm tra cache trước khi call API
      if (!forceRefresh && !keyword) {
        // Nếu đã có data trong state, không cần gọi API
        if (maKhachList && maKhachList.length > 0) {
          return;
        }
        // Nếu có cache valid, sử dụng cache
        if (
          masterDataCache.lastFetch &&
          Date.now() - masterDataCache.lastFetch < CACHE_EXPIRY &&
          masterDataCache.maKhach
        ) {
          setMaKhachList(masterDataCache.maKhach);
          return;
        }
      }

      // Nếu đang search với keyword, kiểm tra cache và filter local
      if (
        keyword &&
        masterDataCache.maKhach &&
        masterDataCache.lastFetch &&
        Date.now() - masterDataCache.lastFetch < CACHE_EXPIRY
      ) {
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
    [token]
  );

  const fetchVatTuList = useCallback(
    async (keyword = "", page = 1, append = false, callback) => {
      // Use cache for empty search
      if (
        !keyword &&
        masterDataCache.lastFetch &&
        Date.now() - masterDataCache.lastFetch < CACHE_EXPIRY &&
        masterDataCache.vatTu &&
        page === 1 &&
        !append
      ) {
        setVatTuList(masterDataCache.vatTu);
        if (callback) callback({ totalPage: 1 });
        return;
      }

      try {
        setLoadingVatTu(true);
        // Lấy unitCode từ localStorage hoặc mặc định
        const userStr = localStorage.getItem("user");
        const unitsResponseStr = localStorage.getItem("unitsResponse");
        const user = userStr ? JSON.parse(userStr) : {};
        const unitsResponse = unitsResponseStr
          ? JSON.parse(unitsResponseStr)
          : {};
        const unitCode = user.unitCode || unitsResponse.unitCode;
        // Gọi dynamic API
        const res = await fetchVatTuListDynamicApi({
          keyword,
          unitCode,
          pageIndex: page,
          pageSize: 100,
        });
        if (res.success && res.data) {
          const options = res.data.map((item) => ({
            label: `${item.ma_vt} - ${item.ten_vt}`,
            value: item.ma_vt,
            ...item,
          }));
          setVatTuList((prev) => (append ? [...prev, ...options] : options));
          // Cache only if no search keyword and first page
          if (!keyword && page === 1 && !append) {
            masterDataCache.vatTu = options;
            masterDataCache.lastFetch = Date.now();
          }
          if (callback) callback(res.pagination);
        } else {
          if (!append) setVatTuList([]);
          if (callback) callback({ totalPage: 1 });
        }
      } catch (error) {
        console.error("Error fetching vat tu list (dynamic):", error);
        message.error("Không thể tải danh sách vật tư");
        if (callback) callback({ totalPage: 1 });
      } finally {
        setLoadingVatTu(false);
      }
    },
    [token]
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
    async (maVatTu, forceRefresh = false) => {
      if (!maVatTu) return [];

      // Clean maVatTu để tránh encoding issues
      const cleanMaVatTu = maVatTu.trim().replace(/\s+/g, " ");

      // Kiểm tra cache trước khi gọi API
      if (
        !forceRefresh &&
        masterDataCache.lastFetch &&
        Date.now() - masterDataCache.lastFetch < CACHE_EXPIRY &&
        masterDataCache.donViTinh[cleanMaVatTu]
      ) {
        return masterDataCache.donViTinh[cleanMaVatTu];
      }

      try {
        // Alternative approach: use manual URL construction to avoid double encoding
        const encodedMaVt = encodeURIComponent(cleanMaVatTu);
        const url = `v1/web/danh-sach-dv?ma_vt=${encodedMaVt}`;

        const response = await https.get(
          url,
          {}, // Empty params since we manually built the URL
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.data && response.data.data) {
          const data = response.data.data;
          // Cache kết quả theo cleanMaVatTu
          masterDataCache.donViTinh[cleanMaVatTu] = data;
          masterDataCache.lastFetch = Date.now();
          return data;
        }
        return [];
      } catch (error) {
        console.error("Error fetching don vi tinh:", error);
        return [];
      }
    },
    [token]
  );

  // Clear cache function
  const clearCache = useCallback((type = null) => {
    if (type) {
      // Clear specific cache
      if (type === "donViTinh") {
        masterDataCache.donViTinh = {};
      } else if (masterDataCache[type]) {
        masterDataCache[type] = null;
      }
    } else {
      // Clear all cache
      masterDataCache.maGiaoDich = null;
      masterDataCache.tkCo = null;
      masterDataCache.maKho = null;
      masterDataCache.maKhach = null;
      masterDataCache.vatTu = null;
      masterDataCache.donViTinh = {};
      masterDataCache.lastFetch = null;
    }
  }, []);

  return {
    loading,
    setLoading,
    maGiaoDichList,
    tkCoList,
    loadingTkCo,
    maKhoList,
    loadingMaKho,
    maKhachList,
    loadingMaKhach,
    vatTuList,
    loadingVatTu,
    fetchTkCoListDebounced,
    fetchMaKhoListDebounced,
    fetchMaKhachListDebounced,
    fetchMaGiaoDichList,
    fetchTkCoList,
    fetchMaKhoList,
    fetchMaKhachList,
    fetchVatTuList,
    fetchVatTuDetail,
    fetchDonViTinh,
    setVatTuList,
    clearCache,
  };
};
