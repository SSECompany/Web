import { message } from "antd";
import { debounce } from "lodash";
import { useCallback, useRef, useState } from "react";
import dayjs from "dayjs";
import https from "../../../../../utils/https";
import {
  fetchVatTuSelection,
  fetchThongTinVatTu,
  fetchKhachHangSelection,
} from "../../../../kinh-doanh/components/phieu-kinh-doanh/phieuKinhDoanhApi";
import { fetchMaKhoApi } from "../utils/phieuNhapHangApi";

const masterDataCache = {
  maGiaoDich: null,
  tkCo: null,
  maKho: null,
  maKhach: null,
  vatTu: null,
  donViTinh: {},
  lastFetch: null,
};

const CACHE_EXPIRY = 30 * 60 * 1000;

export const usePhieuNhapHangData = () => {
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
        { ma_ct: "PNA" },
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
        masterDataCache.maGiaoDich = data;
        masterDataCache.lastFetch = Date.now();
      }
    } catch (error) {
      message.error("Không thể tải danh sách mã giao dịch");
    }
  }, [token]);

  const fetchTkCoList = useCallback(
    async (keyword = "") => {
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
      if (!forceRefresh && !keyword) {
        if (maKhoList && maKhoList.length > 0) {
          return;
        }
        if (
          masterDataCache.lastFetch &&
          Date.now() - masterDataCache.lastFetch < CACHE_EXPIRY &&
          masterDataCache.maKho
        ) {
          setMaKhoList(masterDataCache.maKho);
          return;
        }
      }

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
        // Gọi api_list_kho thay vì endpoint cũ
        const options = await fetchMaKhoApi(keyword);
        setMaKhoList(options);
        if (!keyword) {
          masterDataCache.maKho = options;
          masterDataCache.lastFetch = Date.now();
        }
      } catch (error) {
        message.error("Không thể tải danh sách kho");
      } finally {
        setLoadingMaKho(false);
      }
    },
    [maKhoList]
  );

  // ===== REUSE FROM KD MODULE: fetchKhachHangSelection =====
  const fetchMaKhachList = useCallback(
    async (keyword = "", forceRefresh = false) => {
      if (!forceRefresh && !keyword) {
        if (maKhachList && maKhachList.length > 0) {
          return;
        }
        if (
          masterDataCache.lastFetch &&
          Date.now() - masterDataCache.lastFetch < CACHE_EXPIRY &&
          masterDataCache.maKhach
        ) {
          setMaKhachList(masterDataCache.maKhach);
          return;
        }
      }

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
        // Reuse KD module's fetchKhachHangSelection API
        const data = await fetchKhachHangSelection(keyword, "ten_kh");
        const options = data.map((item) => ({
          value: item.ma_kh.trim(),
          label: `${item.ma_kh.trim()} - ${item.ten_kh.trim()}`,
        }));
        setMaKhachList(options);
        if (!keyword) {
          masterDataCache.maKhach = options;
          masterDataCache.lastFetch = Date.now();
        }
      } catch (error) {
        message.error("Không thể tải danh sách khách hàng");
      } finally {
        setLoadingMaKhach(false);
      }
    },
    [maKhachList]
  );

  // ===== REUSE FROM KD MODULE: fetchVatTuSelection =====
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
        // Reuse KD module's fetchVatTuSelection API
        const data = await fetchVatTuSelection(keyword, page, 100);

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
        if (callback) callback({ totalPage: 1 });
      } catch (error) {
        console.error("Error fetching vat tu list (KD reuse):", error);
        message.error("Không thể tải danh sách vật tư");
        if (callback) callback({ totalPage: 1 });
      } finally {
        setLoadingVatTu(false);
      }
    },
    []
  );

  // ===== REUSE FROM KD MODULE: fetchThongTinVatTu =====
  const fetchVatTuDetail = useCallback(
    async (maVatTu, maKho = "", maKh = "", ngayCt = dayjs().format("YYYY-MM-DD")) => {
      try {
        const data = await fetchThongTinVatTu({
          ma_vt: maVatTu,
          ma_kho: maKho,
          ma_kh: maKh,
          ngay_ct: ngayCt,
          ma_nt: "VND",
          userId: 0,
          UnitId: "TAPMED",
        });
        return data;
      } catch (error) {
        console.error("Error fetching vat tu detail (KD reuse):", error);
        message.error("Không thể tải thông tin vật tư");
        return null;
      }
    },
    []
  );

  const fetchDonViTinh = useCallback(
    async (maVatTu, forceRefresh = false) => {
      if (!maVatTu) return [];

      const cleanMaVatTu = maVatTu.trim().replace(/\s+/g, " ");

      if (
        !forceRefresh &&
        masterDataCache.lastFetch &&
        Date.now() - masterDataCache.lastFetch < CACHE_EXPIRY &&
        masterDataCache.donViTinh[cleanMaVatTu]
      ) {
        return masterDataCache.donViTinh[cleanMaVatTu];
      }

      try {
        const encodedMaVt = encodeURIComponent(cleanMaVatTu);
        const url = `v1/web/danh-sach-dv?ma_vt=${encodedMaVt}`;

        const response = await https.get(
          url,
          {},
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.data && response.data.data) {
          const data = response.data.data;
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

  const clearCache = useCallback((type = null) => {
    if (type) {
      if (type === "donViTinh") {
        masterDataCache.donViTinh = {};
      } else if (masterDataCache[type]) {
        masterDataCache[type] = null;
      }
    } else {
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
    setMaKhachList,
    clearCache,
  };
};

