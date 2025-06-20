import { message } from "antd";
import { debounce } from "lodash";
import { useRef, useState } from "react";
import https from "../../../../../utils/https";

export const usePhieuNhapKhoData = () => {
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

  const fetchVatTuListDebounced = useRef(
    debounce((keyword) => {
      fetchVatTuList(keyword);
    }, 500)
  ).current;

  const fetchMaGiaoDichList = async () => {
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
        setMaGiaoDichList(response.data.data);
      }
    } catch (error) {
      message.error("Không thể tải danh sách mã giao dịch");
    }
  };

  const fetchTkCoList = async (keyword = "") => {
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
      }
    } catch (error) {
      message.error("Không thể tải danh sách tài khoản");
    } finally {
      setLoadingTkCo(false);
    }
  };

  const fetchMaKhoList = async (keyword = "") => {
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
  };

  const fetchMaKhachList = async (keyword = "") => {
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
      }
    } catch (error) {
      message.error("Không thể tải danh sách khách hàng");
    } finally {
      setLoadingMaKhach(false);
    }
  };

  const fetchVatTuList = async (keyword = "") => {
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
      }
    } catch (error) {
      console.error("Error fetching vat tu list:", error);
      message.error("Không thể tải danh sách vật tư");
    } finally {
      setLoadingVatTu(false);
    }
  };

  const fetchVatTuDetail = async (maVatTu) => {
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
  };

  const fetchDonViTinh = async (maVatTu) => {
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
  };

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
    fetchVatTuListDebounced,
    fetchMaGiaoDichList,
    fetchTkCoList,
    fetchMaKhoList,
    fetchMaKhachList,
    fetchVatTuList,
    fetchVatTuDetail,
    fetchDonViTinh,
    setVatTuList,
  };
};
