// Example usage of Phieu Xuat Dieu Chuyen API calls
import {
  createPhieuXuatDieuChuyen,
  deletePhieuXuatDieuChuyen,
  fetchPhieuXuatDieuChuyenDetail,
  fetchPhieuXuatDieuChuyenList,
  updatePhieuXuatDieuChuyen,
} from "./phieuXuatDieuChuyenApi";

// Example 1: Lấy danh sách phiếu xuất điều chuyển
export const exampleFetchList = async () => {
  const params = {
    so_ct: "",
    ma_kh: "",
    ten_kh: "",
    DateFrom: "2025-01-01",
    DateTo: "2025-12-31",
    PageIndex: 1,
    PageSize: 20,
    Status: "",
  };

  const result = await fetchPhieuXuatDieuChuyenList(params);

  if (result.success) {
    console.log("Danh sách phiếu:", result.data);
    console.log("Phân trang:", result.pagination);
  } else {
    console.error("Lỗi:", result.error);
  }
};

// Example 2: Lấy chi tiết phiếu xuất điều chuyển
export const exampleFetchDetail = async (stt_rec) => {
  const result = await fetchPhieuXuatDieuChuyenDetail(stt_rec);

  if (result.success) {
    console.log("Thông tin master:", result.master);
    console.log("Chi tiết vật tư:", result.detail);
  } else {
    console.error("Lỗi:", result.error);
  }
};

// Example 3: Tạo mới phiếu xuất điều chuyển
export const exampleCreate = async () => {
  const data = {
    master: [
      {
        stt_rec: "",
        ma_dvcs: "vikosan",
        ma_ct: "PXA",
        loai_ct: "2",
        so_lo: "",
        ngay_lo: "",
        ma_nk: "",
        ma_gd: "2",
        ngay_ct: "2025-07-13",
        so_ct: "HD001",
        ma_kho: "KH001",
        ma_khon: "KH001",
        status: "1",
      },
    ],
    detail: [
      {
        stt_rec: "",
        stt_rec0: "",
        ma_ct: "PXA",
        ngay_ct: "2025-07-13",
        so_ct: "HD001",
        ma_vt: "DB1820920",
        dvt: "Cái",
        so_luong: 1,
        ma_nx: "155",
        tk_du: "1123",
        tk_vt: "1551",
        gia_nt: 0,
        gia: 0,
        tien_nt: 0,
        tien: 0,
      },
      {
        stt_rec: "",
        stt_rec0: "",
        ma_ct: "PXA",
        ngay_ct: "2025-07-13",
        so_ct: "HD001",
        ma_vt: "BT90",
        dvt: "Cái",
        so_luong: 1,
        ma_nx: "155",
        tk_du: "1123",
        tk_vt: "1551",
        gia_nt: 0,
        gia: 0,
        tien_nt: 0,
        tien: 0,
      },
    ],
  };

  const result = await createPhieuXuatDieuChuyen(data);

  if (result.success) {
    console.log("Tạo phiếu thành công");
  } else {
    console.error("Lỗi:", result.message);
  }
};

// Example 4: Cập nhật phiếu xuất điều chuyển
export const exampleUpdate = async (stt_rec) => {
  const data = {
    master: [
      {
        stt_rec: stt_rec,
        ma_dvcs: "vikosan",
        ma_ct: "PXA",
        loai_ct: "2",
        so_lo: "",
        ngay_lo: "",
        ma_nk: "",
        ma_gd: "2",
        ngay_ct: "2025-07-13",
        so_ct: "HD001",
        ma_kho: "KH001",
        ma_khon: "KH001",
        status: "1",
      },
    ],
    detail: [
      {
        stt_rec: "",
        stt_rec0: "",
        ma_ct: "PXA",
        ngay_ct: "2025-07-13",
        so_ct: "HD001",
        ma_vt: "DB1820920",
        dvt: "Cái",
        so_luong: 2, // Cập nhật số lượng
        ma_nx: "155",
        tk_du: "1123",
        tk_vt: "1551",
        gia_nt: 0,
        gia: 0,
        tien_nt: 0,
        tien: 0,
      },
    ],
  };

  const result = await updatePhieuXuatDieuChuyen(data);

  if (result.success) {
    console.log("Cập nhật phiếu thành công");
  } else {
    console.error("Lỗi:", result.message);
  }
};

// Example 5: Xóa phiếu xuất điều chuyển
export const exampleDelete = async (stt_rec) => {
  const result = await deletePhieuXuatDieuChuyen(stt_rec);

  if (result.success) {
    console.log("Xóa phiếu thành công");
  } else {
    console.error("Lỗi:", result.message);
  }
};

// Example 6: Sử dụng trong React component
export const exampleReactComponent = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await fetchPhieuXuatDieuChuyenList({
        PageIndex: 1,
        PageSize: 10,
      });

      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error("Lỗi:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (formData) => {
    try {
      const result = await createPhieuXuatDieuChuyen(formData);
      if (result.success) {
        // Refresh data
        fetchData();
      }
    } catch (error) {
      console.error("Lỗi:", error);
    }
  };

  const handleUpdate = async (stt_rec, formData) => {
    try {
      const result = await updatePhieuXuatDieuChuyen(formData);
      if (result.success) {
        // Refresh data
        fetchData();
      }
    } catch (error) {
      console.error("Lỗi:", error);
    }
  };

  const handleDelete = async (stt_rec) => {
    try {
      const result = await deletePhieuXuatDieuChuyen(stt_rec);
      if (result.success) {
        // Refresh data
        fetchData();
      }
    } catch (error) {
      console.error("Lỗi:", error);
    }
  };

  return {
    data,
    loading,
    fetchData,
    handleCreate,
    handleUpdate,
    handleDelete,
  };
};
