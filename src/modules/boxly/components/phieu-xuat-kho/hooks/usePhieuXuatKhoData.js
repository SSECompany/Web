import { message } from "antd";
import { debounce } from "lodash";
import { useCallback, useMemo, useState } from "react";
import https from "../../../../../utils/https";
import { fetchVatTuListDynamicApi } from "../../phieu-nhap-kho/utils/phieuNhapKhoUtils";

const masterDataCache = {
  maGiaoDich: null,
  maKhach: null,
  vatTu: null,
  lastFetch: null,
};

const CACHE_EXPIRY = 5 * 60 * 1000;

export const usePhieuXuatKhoData = () => {
  const [loading, setLoading] = useState(false);
  const [maGiaoDichList, setMaGiaoDichList] = useState([]);
  const [maKhachList, setMaKhachList] = useState([]);
  const [loadingMaKhach, setLoadingMaKhach] = useState(false);
  const [vatTuList, setVatTuList] = useState([]);
  const [loadingVatTu, setLoadingVatTu] = useState(false);
  const [maKhoList, setMaKhoList] = useState([]);
  const [loadingMaKho, setLoadingMaKho] = useState(false);

  const token = localStorage.getItem("access_token");

  const isCacheValid = useMemo(() => {
    if (!masterDataCache.lastFetch) return false;
    return Date.now() - masterDataCache.lastFetch < CACHE_EXPIRY;
  }, []);

  const fetchMaGiaoDichList = useCallback(async () => {
    if (isCacheValid && masterDataCache.maGiaoDich) {
      setMaGiaoDichList(masterDataCache.maGiaoDich);
      return;
    }

    try {
      const response = await https.get(
        "v1/web/danh-sach-ma-gd",
        { ma_ct: "PXA" },
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
  }, [isCacheValid, token]);

  const fetchMaKhachList = useCallback(
    async (keyword = "") => {
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
    async (keyword = "", page = 1, append = false, callback) => {
      if (
        !keyword &&
        isCacheValid &&
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
        // Gọi API dùng fetchVatTuListDynamicApi giống phiếu xuất điều chuyển
        const res = await fetchVatTuListDynamicApi({
          keyword,
          unitCode,
          pageIndex: page,
          pageSize: 200,
        });
        if (res.success && res.data) {
          const options = res.data.map((item) => ({
            label: `${item.ma_vt} - ${item.ten_vt}`,
            value: item.ma_vt,
            ...item,
          }));
          setVatTuList((prev) => (append ? [...prev, ...options] : options));
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
    [isCacheValid]
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

  const fetchMaKhoList = useCallback(
    async (keyword = "") => {
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
        }
      } catch (error) {
        message.error("Không thể tải danh sách kho");
      } finally {
        setLoadingMaKho(false);
      }
    },
    [token]
  );

  const fetchMaKhoListDebounced = useMemo(
    () =>
      debounce((keyword) => {
        fetchMaKhoList(keyword);
      }, 500),
    [fetchMaKhoList]
  );

  const fetchPhieuXuatKhoDetail = useCallback(
    async (sttRec) => {
      try {
        setLoading(true);
        const body = {
          store: "api_get_data_detail_phieu_xuat_kho_voucher",
          param: {
            stt_rec: sttRec,
          },
          data: {},
          resultSetNames: ["master", "detail"],
        };

        const response = await https.post(
          "v1/dynamicApi/call-dynamic-api",
          body,
          {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          }
        );

       

        // Xử lý response theo cấu trúc mới
        const masterData =
          response.data?.listObject?.dataLists?.master?.[0] || {};
        const detailData = response.data?.listObject?.dataLists?.detail || [];

      

        return {
          master: masterData,
          detail: detailData,
        };
      } catch (error) {
        console.error("Error fetching phieu xuat kho detail:", error);
        message.error("Không thể tải chi tiết phiếu xuất kho");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

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
    maKhoList,
    loadingMaKho,
    fetchMaKhachListDebounced,
    fetchVatTuListDebounced,
    fetchMaKhoListDebounced,
    fetchMaGiaoDichList,
    fetchMaKhachList,
    fetchMaKhoList,
    fetchVatTuList,
    fetchVatTuDetail,
    fetchDonViTinh,
    fetchPhieuXuatKhoDetail,
    setVatTuList,
    clearCache,
  };
};
