import { message } from "antd";
import { debounce } from "lodash";
import { useCallback, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { searchVatTu } from "../../../../../api";
import https from "../../../../../utils/https";

// Global cache for master data
const masterDataCache = {
  maGiaoDich: null,
  tkCo: null,
  maKho: null,
  maKhach: null,
  vatTu: null,
  fcode3: null,
  donViTinh: {}, // Cache ĐVT theo maHang: { "ABC123": [{dvt: "Bo"}, {dvt: "Cai"}], ... }
  lastFetch: null,
};

const CACHE_EXPIRY = 30 * 60 * 1000; // 30 minutes - cache data trong 30 phút

export const usePhieuNhatHangData = () => {
  // Get user info from Redux instead of localStorage
  const userInfo = useSelector((state) => state?.claimsReducer?.userInfo || {});

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
  const [fcode3List, setFcode3List] = useState([]);
  const [loadingFcode3, setLoadingFcode3] = useState(false);

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

  const fetchFcode3ListDebounced = useRef(
    debounce((keyword) => {
      fetchFcode3List(keyword);
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
    // maKhoList intentionally omitted to avoid infinite loop (callback sets it)
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // maKhachList intentionally omitted to avoid infinite loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [token]
  );

  const fetchFcode3List = useCallback(
    async (keyword = "", forceRefresh = false) => {
      // Kiểm tra cache trước khi call API
      if (!forceRefresh && !keyword) {
        // Nếu đã có data trong state, không cần gọi API
        if (fcode3List && fcode3List.length > 0) {
          return;
        }
        // Nếu có cache valid, sử dụng cache
        if (
          masterDataCache.lastFetch &&
          Date.now() - masterDataCache.lastFetch < CACHE_EXPIRY &&
          masterDataCache.fcode3
        ) {
          setFcode3List(masterDataCache.fcode3);
          return;
        }
      }

      // Nếu đang search với keyword, kiểm tra cache và filter local
      if (
        keyword &&
        masterDataCache.fcode3 &&
        masterDataCache.lastFetch &&
        Date.now() - masterDataCache.lastFetch < CACHE_EXPIRY
      ) {
        const filteredData = masterDataCache.fcode3.filter((item) =>
          item.label.toLowerCase().includes(keyword.toLowerCase())
        );
        setFcode3List(filteredData);
        return;
      }

      setLoadingFcode3(true);
      try {
        const response = await https.get(
          "v1/web/danh-sach-phuong-tien-van-chuyen",
          {
            keyword: keyword,
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
            value: item.fcode3?.trim() || "",
            label: item.ten_vc?.trim() || item.fcode3?.trim() || "",
          }));
          setFcode3List(options);

          // Cache only if no search keyword
          if (!keyword) {
            masterDataCache.fcode3 = options;
            masterDataCache.lastFetch = Date.now();
          }
        }
      } catch (error) {
        console.error("Error fetching fcode3:", error);
        // If API doesn't exist, use hardcoded data for now
        const defaultOptions = [
          {
            value: "NX.0001",
            label: "Nhà Khách Sơn La - Mộc Châu, Sơn La",
          },
        ];
        setFcode3List(defaultOptions);
        if (!keyword) {
          masterDataCache.fcode3 = defaultOptions;
          masterDataCache.lastFetch = Date.now();
        }
      } finally {
        setLoadingFcode3(false);
      }
    },
    // fcode3List intentionally omitted to avoid infinite loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [token]
  );

  const fetchVatTuList = useCallback(
    async (keyword = "", page = 1, append = false, callback) => {
      // TẠM THỜI TẮT CACHE để test pagination
      // Use cache for empty search - CHỈ cache khi không có keyword và page 1
      // if (
      //   !keyword &&
      //   masterDataCache.lastFetch &&
      //   Date.now() - masterDataCache.lastFetch < CACHE_EXPIRY &&
      //   masterDataCache.vatTu &&
      //   page === 1 &&
      //   !append
      // ) {
      //   setVatTuList(masterDataCache.vatTu);
      //   // KHÔNG set totalPage = 1 cố định, để API tự tính
      //   if (callback) callback({ totalPage: 1 });
      //   return;
      // }

      try {
        setLoadingVatTu(true);

        // Get unitsResponse from localStorage as fallback for unitId
        const unitsResponseStr = localStorage.getItem("unitsResponse");
        const unitsResponse = unitsResponseStr
          ? JSON.parse(unitsResponseStr)
          : {};

        // Get user info from Redux instead of localStorage
        const unitId = userInfo?.unitId || unitsResponse?.unitId || "";
        const userId = userInfo?.id || userInfo?.userId || "";

        // Sử dụng searchVatTu API giống như POS
        const response = await searchVatTu(keyword, page, 20, unitId, userId);

        // Kiểm tra response success - sử dụng cấu trúc API mới
        if (response?.responseModel?.isSucceded) {
          const listObject = response.listObject;

          // listObject[0] chứa array các items
          const data = listObject?.[0] || [];
          // listObject[1] chứa array thông tin pagination
          const paginationInfo = listObject?.[1]?.[0] || {};

          // Transform API data to match ProductSelectFull format (same as POS)
          const transformedData = data.map((item) => ({
            value: item.value || `ITEM${page}${Math.random()}`,
            label: item.label || `Sản phẩm - ${item.value || "N/A"}`,
            item: {
              sku: item.value || `ITEM${page}${Math.random()}`,
              name: item.label || `Sản phẩm`,
              price: item.gia || 0,
              unit: item.dvt || "viên",
              stock: 0, // API không trả về stock
              ma_thue: (item.ma_thue || "").trim(),
              thue_suat: Number(item.thue_suat) || 0,
            },
            // Keep additional fields for backward compatibility
            ma_vt: item.value,
            ten_vt: item.label,
            gia: item.gia || 0,
            dvt: item.dvt || "viên",
            ...item,
          }));

          if (append) {
            setVatTuList((prev) => [...prev, ...transformedData]);
          } else {
            setVatTuList(transformedData);
          }

          // Cache only if no search keyword and first page
          if (!keyword && page === 1 && !append) {
            masterDataCache.vatTu = transformedData;
            masterDataCache.lastFetch = Date.now();
          }

          // Parse phân trang linh hoạt từ API
          const pageSize = 20;
          const totalRecord =
            paginationInfo.totalrecord ??
            paginationInfo.totalRecord ??
            paginationInfo.TotalRecord ??
            paginationInfo.Totalrecord;
          let newTotalPage =
            paginationInfo.totalpage ??
            paginationInfo.totalPage ??
            paginationInfo.TotalPage ??
            paginationInfo.Totalpage ??
            0;

          if (!newTotalPage) {
            if (typeof totalRecord === "number") {
              newTotalPage = Math.max(1, Math.ceil(totalRecord / pageSize));
            } else {
              // Fallback: nếu dữ liệu trang < pageSize coi như hết trang
              newTotalPage = data.length < pageSize ? page : page + 1;
            }
          }

          if (callback) callback({ totalPage: newTotalPage });
        } else {
          // Hiển thị error message từ API
          const errorMessage =
            response?.responseModel?.message || "Không thể tìm kiếm vật tư";
          message.error({
            message: "Lỗi tìm kiếm",
            description: errorMessage,
          });

          if (!append) {
            setVatTuList([]);
          }
          if (callback) callback({ totalPage: 1 });
        }
      } catch (error) {
        console.error("Error fetching vat tu list:", error);
        message.error({
          message: "Lỗi kết nối",
          description: "Không thể kết nối đến máy chủ",
        });

        if (!append) {
          setVatTuList([]);
        }
        if (callback) callback({ totalPage: 1 });
      } finally {
        setLoadingVatTu(false);
      }
    },
    [userInfo]
  );

  const fetchVatTuDetail = useCallback(
    async (maVatTu) => {
      try {
        // Get unitsResponse from localStorage as fallback for unitId
        const unitsResponseStr = localStorage.getItem("unitsResponse");
        const unitsResponse = unitsResponseStr
          ? JSON.parse(unitsResponseStr)
          : {};

        // Get user info from Redux instead of localStorage
        const unitId = userInfo?.unitId || unitsResponse?.unitId || "";
        const userId = userInfo?.id || userInfo?.userId || "";

        // Sử dụng searchVatTu API để tìm kiếm chi tiết vật tư
        const response = await searchVatTu(maVatTu, 1, 1, unitId, userId);

        if (
          response?.responseModel?.isSucceded &&
          response.listObject?.[0]?.length > 0
        ) {
          const foundItem = response.listObject[0][0];
          return {
            ma_vt: foundItem.value,
            ten_vt: foundItem.label,
            gia: foundItem.gia || 0,
            dvt: foundItem.dvt || "viên",
            ...foundItem,
          };
        }
        return null;
      } catch (error) {
        console.error("Error fetching vat tu detail:", error);
        message.error("Không thể tải thông tin vật tư");
        return null;
      }
    },
    [userInfo]
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
      masterDataCache.fcode3 = null;
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
    fcode3List,
    loadingFcode3,
    fetchTkCoListDebounced,
    fetchMaKhoListDebounced,
    fetchMaKhachListDebounced,
    fetchFcode3ListDebounced,
    fetchMaGiaoDichList,
    fetchTkCoList,
    fetchMaKhoList,
    fetchMaKhachList,
    fetchFcode3List,
    fetchVatTuList,
    fetchVatTuDetail,
    fetchDonViTinh,
    setVatTuList,
    setFcode3List,
    clearCache,
  };
};
