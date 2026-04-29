import { message } from "antd";
import { debounce } from "lodash";
import { useCallback, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { searchVatTu } from "../../../../../api";
import https from "../../../../../utils/https";

// Global cache for master data
const masterDataCache = {
  maGiaoDich: null,
  maKho: null,
  maKhach: null,
  vatTu: null,
  lastFetch: null,
};

const CACHE_EXPIRY = 30 * 60 * 1000; // 30 minutes

export const usePhieuGiaoHangData = () => {
  const userInfo = useSelector((state) => state?.claimsReducer?.userInfo || {});

  const [loading, setLoading] = useState(false);
  const [maGiaoDichList, setMaGiaoDichList] = useState([]);
  const [maKhoList, setMaKhoList] = useState([]);
  const [loadingMaKho, setLoadingMaKho] = useState(false);
  const [maKhachList, setMaKhachList] = useState([]);
  const [loadingMaKhach, setLoadingMaKhach] = useState(false);
  const [vatTuList, setVatTuList] = useState([]);
  const [loadingVatTu, setLoadingVatTu] = useState(false);

  const token = localStorage.getItem("access_token");

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
    // API đã bị vô hiệu hóa - không gọi API nữa
    setMaGiaoDichList([]);
    return;
    
    // Code cũ đã bị comment
    /*
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
        { ma_ct: "PGH" },
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
    */
  }, []);

  const fetchMaKhoList = useCallback(
    async (keyword = "", forceRefresh = false) => {
      // API đã bị vô hiệu hóa - không gọi API nữa
      setLoadingMaKho(false);
      setMaKhoList([]);
      return;
      
      // Code cũ đã bị comment
      /*
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
      */
    },
    []
  );

  const fetchMaKhachList = useCallback(
    async (keyword = "") => {
      if (
        !keyword &&
        masterDataCache.lastFetch &&
        Date.now() - masterDataCache.lastFetch < CACHE_EXPIRY &&
        masterDataCache.maKhach
      ) {
        setMaKhachList(masterDataCache.maKhach);
        return;
      }

      // API đã bị vô hiệu hóa - không gọi API nữa
      setLoadingMaKhach(false);
      setMaKhachList([]);
      return;
      
      // Code cũ đã bị comment
      /*
      setLoadingMaKhach(true);
      try {
        const response = await https.get(
          "v1/web/danh-sach-khach-hang",
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
            value: item.ma_kh.trim(),
            label: `${item.ma_kh.trim()} - ${item.ten_kh.trim()}`,
            ten_kh: item.ten_kh.trim(),
            dia_chi: item.dia_chi?.trim() || "",
          }));
          setMaKhachList(options);

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
      */
    },
    []
  );

  const fetchVatTuList = useCallback(
    async (keyword = "", pageIndex = 1, pageSize = 20) => {
      setLoadingVatTu(true);
      try {
        const results = await searchVatTu(keyword, pageIndex, pageSize);
        if (results) {
          setVatTuList(results);
        }
      } catch (error) {
        message.error("Không thể tải danh sách vật tư");
      } finally {
        setLoadingVatTu(false);
      }
    },
    []
  );

  const fetchVatTuDetail = useCallback(
    async (ma_vt) => {
      try {
        const response = await https.get(
          "v1/web/get-vat-tu-detail",
          { ma_vt: ma_vt },
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
        return null;
      } catch (error) {
        message.error("Không thể tải chi tiết vật tư");
        return null;
      }
    },
    [token]
  );

  const fetchDonViTinh = useCallback(
    async (ma_vt) => {
      try {
        const response = await https.get(
          "v1/web/get-don-vi-tinh",
          { ma_vt: ma_vt },
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
        console.error("Không thể tải danh sách đơn vị tính:", error);
        return [];
      }
    },
    [token]
  );

  return {
    loading,
    maGiaoDichList,
    maKhoList,
    loadingMaKho,
    maKhachList,
    loadingMaKhach,
    vatTuList,
    loadingVatTu,
    fetchMaKhoListDebounced,
    fetchMaKhachListDebounced,
    fetchMaGiaoDichList,
    fetchMaKhoList,
    fetchMaKhachList,
    fetchVatTuList,
    fetchVatTuDetail,
    fetchDonViTinh,
    setVatTuList,
  };
};
