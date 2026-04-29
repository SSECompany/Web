import { message } from "antd";
import { debounce } from "lodash";
import { useCallback, useMemo, useState } from "react";
import https from "../../../../../utils/https";
import { fetchVatTuListDynamicApi } from "../../phieu-nhat-hang/utils/phieuNhatHangUtils";

const masterDataCache = {
  maGiaoDich: null,
  maKhach: null,
  maKho: null,
  vatTu: null,
  donViTinh: {}, // Cache ĐVT theo maHang
  lastFetch: null,
};

const CACHE_EXPIRY = 30 * 60 * 1000; // 30 minutes - cache data trong 30 phút

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
  }, [token]);

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
    [token, maKhachList]
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
        // Gọi API dùng fetchVatTuListDynamicApi giống phiếu xuất điều chuyển
        const res = await fetchVatTuListDynamicApi({
          keyword,
          unitCode,
          pageIndex: page,
          pageSize: 200,
        });
        if (res.success && res.data) {
          const options = res.data.map((item) => {
            const maVt = item.ma_vt || item.value || "";
            const tenVt = item.ten_vt || item.label || "";
            return {
              label: tenVt ? `${maVt} - ${tenVt}` : maVt,
              value: maVt,
              ...item,
              ma_vt: maVt,
              ten_vt: tenVt,
            };
          });
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
    []
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
    async (maHang, forceRefresh = false) => {
      if (!maHang) return [];

      // Kiểm tra cache trước khi gọi API
      if (
        !forceRefresh &&
        masterDataCache.lastFetch &&
        Date.now() - masterDataCache.lastFetch < CACHE_EXPIRY &&
        masterDataCache.donViTinh[maHang]
      ) {
        return masterDataCache.donViTinh[maHang];
      }

      // API v1/web/danh-sach-dv đã bị bỏ theo yêu cầu.
      return [];
    },
    []
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
    [token, maKhoList]
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

        const response = await https.post("User/AddData", body, {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        });

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
    fetchLoList: useCallback(async (keyword = "", record = {}, page = 1) => {
      try {
        const { getLoItem } = require("../../../../../api");
        const response = await getLoItem({
          ma_vt: (record?.maHang || record?.ma_vt || "").toString(),
          ma_lo: "",
          ten_lo: keyword,
          ngay_hhsd_tu: null,
          ngay_hhsd_den: null,
          pageIndex: page,
          pageSize: 10,
        });

        const data = response?.listObject?.[0] || [];
        const totalPage = response?.listObject?.[1]?.[0]?.totalPage ?? 1;

        const options = data.map((x) => {
          const value = (x?.ma_lo || x?.value || x?.ten_lo || "").toString();
          let label = value;
          if (x?.ngay_hhsd) {
            const formattedDate = new Date(x.ngay_hhsd).toLocaleDateString("vi-VN");
            label = `${value}-${formattedDate}`;
          } else {
            label = x?.ma_lo || x?.ten_lo || x?.label || value;
          }
          return { value, label, ...x };
        });
        return { options, totalPage };
      } catch (e) {
        console.error("fetchLoList error", e);
        return { options: [], totalPage: 1 };
      }
    }, []),
    fetchViTriList: useCallback(async (keyword = "", record = {}, page = 1) => {
      try {
        const { getViTriByKho } = require("../../../../../api");
        const response = await getViTriByKho({
          ma_kho: (record?.ma_kho || "").toString(),
          ma_vt: (record?.maHang || record?.ma_vt || "").toString(),
          ma_vi_tri: "",
          ten_vi_tri: keyword,
          pageIndex: page,
          pageSize: 10,
        });

        const data = response?.listObject?.[0] || [];
        const totalPage = response?.listObject?.[1]?.[0]?.totalPage ?? 1;

        const options = data.map((x) => {
          const value = (x?.ma_vi_tri || x?.value || "").toString();
          const label = x?.ten_vi_tri || x?.label || value;
          return { value, label, ...x };
        });
        return { options, totalPage };
      } catch (e) {
        console.error("fetchViTriList error", e);
        return { options: [], totalPage: 1 };
      }
    }, []),
    setVatTuList,
    clearCache,
  };
};
