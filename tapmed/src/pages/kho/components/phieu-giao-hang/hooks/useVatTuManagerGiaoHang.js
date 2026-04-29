import { message } from "antd";
import { useCallback } from "react";

export const useVatTuManagerGiaoHang = () => {
  const handleVatTuSelect = useCallback((selectedVatTu, dataSource, setDataSource) => {
    if (!selectedVatTu) return;

    const exists = dataSource.some(
      (item) => item.ma_vt === selectedVatTu.ma_vt
    );

    if (exists) {
      message.warning("Vật tư này đã có trong danh sách");
      return;
    }

    const newItem = {
      key: Date.now(),
      stt_rec0: 0,
      stt_rec: 0,
      ma_vt: selectedVatTu.ma_vt || "",
      ten_vt: selectedVatTu.ten_vt || "",
      dvt: selectedVatTu.dvt || "",
      so_luong: 1,
      ma_kho: "",
      ma_lo: "",
      han_dung: "",
      ghi_chu: "",
    };

    setDataSource([...dataSource, newItem]);
  }, []);

  const handleQuantityChange = useCallback((key, value, dataSource, setDataSource) => {
    const newData = dataSource.map((item) => {
      if (item.key === key) {
        return { ...item, so_luong: value };
      }
      return item;
    });
    setDataSource(newData);
  }, []);

  const handleSelectChange = useCallback((key, field, value, dataSource, setDataSource) => {
    const newData = dataSource.map((item) => {
      if (item.key === key) {
        return { ...item, [field]: value };
      }
      return item;
    });
    setDataSource(newData);
  }, []);

  const handleDeleteItem = useCallback((key, dataSource, setDataSource) => {
    const newData = dataSource.filter((item) => item.key !== key);
    setDataSource(newData);
  }, []);

  const handleAddItem = useCallback((dataSource, setDataSource) => {
    const newItem = {
      key: Date.now(),
      stt_rec0: 0,
      stt_rec: 0,
      ma_vt: "",
      ten_vt: "",
      dvt: "",
      so_luong: 1,
      ma_kho: "",
      ma_lo: "",
      han_dung: "",
      ghi_chu: "",
    };
    setDataSource([...dataSource, newItem]);
  }, []);

  return {
    handleVatTuSelect,
    handleQuantityChange,
    handleSelectChange,
    handleDeleteItem,
    handleAddItem,
  };
};
