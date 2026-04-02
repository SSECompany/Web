import { message } from "antd";
import { debounce } from "lodash";
import { useCallback, useMemo, useState } from "react";
import https from "../../../../../utils/https";
import dayjs from "dayjs";
import { fetchThongTinVatTu, getCachedUnits } from "../../../../kinh-doanh/components/phieu-kinh-doanh/phieuKinhDoanhApi";
import { fetchVatTuListDynamicApi } from "../../phieu-nhat-hang/utils/phieuNhatHangUtils";

const masterDataCache = {
  maGiaoDich: null,
  maKho: null,
  vatTu: null,
  donViTinh: {}, // Cache ĐVT theo maHang
  lastFetch: null,
};

const CACHE_EXPIRY = 30 * 60 * 1000; // 30 minutes - cache data trong 30 phút

export const usePhieuNhapDieuChuyenData = () => {
  const [loading, setLoading] = useState(false);
  const [maGiaoDichList, setMaGiaoDichList] = useState([]);
  const [maKhoList, setMaKhoList] = useState([]);
  const [loadingMaKho, setLoadingMaKho] = useState(false);
  const [vatTuList, setVatTuList] = useState([]);
  const [loadingVatTu, setLoadingVatTu] = useState(false);

  const token = localStorage.getItem("access_token");

  // Remove isCacheValid useMemo as it causes re-renders

  const fetchMaGiaoDichList = useCallback(async () => {
    if (
      masterDataCache.lastFetch &&
      Date.now() - masterDataCache.lastFetch < CACHE_EXPIRY &&
      masterDataCache.maGiaoDich
    ) {
      setMaGiaoDichList(masterDataCache.maGiaoDich);
      return;
    }

    try {
      const response = await https.post(
        "User/AddData",
        {
          store: "api_list_ma_gd",
          param: {
            ma_ct: "PXB",
            ma_gd: "",
            ten_gd: "",
            PageIndex: 1,
            PageSize: 100,
          },
          data: {},
          resultSetNames: ["data"],
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const listObject = response.data?.listObject || [];
      const data = listObject[0] || [];
      
      if (data) {
        setMaGiaoDichList(data);
        masterDataCache.maGiaoDich = data;
        masterDataCache.lastFetch = Date.now();
      }
    } catch (error) {
      console.error("Error fetching ma giao dich:", error);
      message.error("Không thể tải danh sách mã giao dịch");
    }
  }, [token]);

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
        const response = await https.post(
          "User/AddData",
          {
            store: "api_list_kho",
            param: {
              ma_kho: keyword || "",
              ten_kho: "",
              ma_dvcs: "TAPMED",
              PageIndex: 1,
              PageSize: 100,
            },
            data: {},
            resultSetNames: ["data"],
          },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const listObject = response.data?.listObject || [];
        const data = listObject[0] || [];

        if (Array.isArray(data)) {
          const options = data.map((item) => ({
            value: (item.ma_kho || "").trim(),
            label: `${(item.ma_kho || "").trim()} - ${(item.ten_kho || "").trim()}`,
            ...item
          }));
          setMaKhoList(options);

          if (!keyword) {
            masterDataCache.maKho = options;
            masterDataCache.lastFetch = Date.now();
          }
        }
      } catch (error) {
        console.error("Error fetching ma kho:", error);
        message.error("Không thể tải danh sách kho");
      } finally {
        setLoadingMaKho(false);
      }
    },
    [token, maKhoList]
  );

  const fetchVatTuList = useCallback(
    async (keyword = "", page = 1, append = false, callback) => {
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
        const userStr = localStorage.getItem("user");
        const unitsResponseStr = localStorage.getItem("unitsResponse");
        const user = userStr ? JSON.parse(userStr) : {};
        const unitsResponse = unitsResponseStr
          ? JSON.parse(unitsResponseStr)
          : {};
        const unitCode = user.unitCode || unitsResponse.unitCode || "01";
        const payload = {
          store: "api_getListItem",
          data: {},
          param: {
            Currency: "VND",
            searchValue: keyword || "",
            unitId: unitCode || "TAPMED ",
            userId: user.id || 0,
            pageindex: page,
            pagesize: 200,
          },
          resultSetNames: ["data"]
        };
        const token = localStorage.getItem("access_token");
        const res = await https.post("User/AddData", payload, {
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
        });

        const listObject = res.data?.listObject || [];
        const data = listObject[0] || [];

        if (Array.isArray(data)) {
          const options = data.map((item) => ({
            label: `${item.ma_vt} - ${item.ten_vt}`,
            value: item.ma_vt,
            ...item,
          }));
          setVatTuList((prev) => (append ? [...prev, ...options] : options));
          if (!keyword && page === 1 && !append) {
            masterDataCache.vatTu = options;
            masterDataCache.lastFetch = Date.now();
          }
          if (callback) callback({ totalPage: data[0]?.totalPage || 1 });
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
    []
  );

  const fetchVatTuDetail = useCallback(
    async (maVatTu, maKho = "", maKh = "", ngayCt = dayjs().format("YYYY-MM-DD")) => {
      try {
        const userStr = localStorage.getItem("user");
        const unitsResponseStr = localStorage.getItem("unitsResponse");
        const user = userStr ? JSON.parse(userStr) : {};
        const unitsResponse = unitsResponseStr ? JSON.parse(unitsResponseStr) : {};
        const unitId = user.unitCode || unitsResponse.unitCode || "TAPMED";
        const userId = user.id || 0;

        const data = await fetchThongTinVatTu({
          ma_vt: maVatTu,
          ma_kho: maKho,
          ma_kh: maKh,
          ngay_ct: ngayCt,
          ma_nt: "VND",
          userId: userId,
          UnitId: unitId,
        });

        return data; 
      } catch (error) {
        console.error("Error fetching vat tu detail:", error);
        return null;
      }
    },
    []
  );

  const fetchDonViTinh = useCallback(
    async (maHang, forceRefresh = false) => {
      if (!maHang) return [];

      const cleanMaHang = maHang.trim();

      // NEW: Prioritize global cache from fetchThongTinVatTu
      const cached = getCachedUnits(cleanMaHang);
      if (cached && !forceRefresh) return cached;

      // Kiểm tra cache trước khi gọi API
      if (
        !forceRefresh &&
        masterDataCache.lastFetch &&
        Date.now() - masterDataCache.lastFetch < CACHE_EXPIRY &&
        masterDataCache.donViTinh[cleanMaHang]
      ) {
        return masterDataCache.donViTinh[cleanMaHang];
      }

      try {
        const response = await https.get(
          "v1/web/danh-sach-dv",
          {
            ma_vt: cleanMaHang,
          }
        );

        if (response.data && response.data.data) {
          const data = response.data.data;
          // Cache kết quả theo maHang
          masterDataCache.donViTinh[cleanMaHang] = data;
          masterDataCache.lastFetch = Date.now();
          return data;
        }
        return [];
      } catch (error) {
        console.error("Error fetching don vi tinh:", error);
        return [];
      }
    },
    []
  );

  const fetchMaKhoListDebounced = useMemo(
    () =>
      debounce((keyword) => {
        fetchMaKhoList(keyword);
      }, 500),
    [fetchMaKhoList]
  );

  const fetchVatTuListDebounced = useMemo(
    () =>
      debounce((keyword) => {
        fetchVatTuList(keyword);
      }, 500),
    [fetchVatTuList]
  );

  const clearCache = useCallback(() => {
    masterDataCache.maGiaoDich = null;
    masterDataCache.vatTu = null;
    masterDataCache.lastFetch = null;
  }, []);

  return {
    loading,
    setLoading,
    maGiaoDichList,
    maKhoList,
    loadingMaKho,
    vatTuList,
    loadingVatTu,
    fetchMaKhoListDebounced,
    fetchVatTuListDebounced,
    fetchMaGiaoDichList,
    fetchMaKhoList,
    fetchVatTuList,
    fetchVatTuDetail,
    fetchDonViTinh,
    setVatTuList,
    clearCache,
  };
};
