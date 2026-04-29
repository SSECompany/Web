import {
  CheckOutlined,
  CloseOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { Button, Input, Modal, Table, Typography, notification } from "antd";
import React, { useCallback, useRef, useState } from "react";
import { useSelector } from "react-redux";
import {
  fetchPrescriptionFromDonThuocQG,
  searchVatTu,
} from "../../../api";
import VatTuSelectFullPOS from "../../../components/common/ProductSelectFull/VatTuSelectFullPOS";
import "./PrescriptionModal.css";

const { Title, Text } = Typography;

const USE_FAKE_PRESCRIPTION = false;
const DEFAULT_MA_DVCS = "TAPMED";

const mockPrescriptionResponse = {
  success: true,
  data: {
    listObject: [
      [
        {
          ma_don_thuoc: "123",
          ho_ten_benh_nhan: "Tên khách hàng: SDGDG",
          ngay_sinh_benh_nhan: "12-06-2002",
          ma_dinh_danh_y_te: "012345678901",
          loai_don_thuoc: "Ngoại trú",
          hinh_thuc_dieu_tri: "Điều trị tại nhà",
          dia_chi: "FGFG",
          gioi_tinh: "Nam",
          can_nang: "70kg",
          ma_so_the_bao_hiem_y_te: "AB123456789",
          thong_tin_don_thuoc:
            "Bệnh tả - abc Bệnh thương hàn và phó thương hàn - aaaaaaa",
          dot_dung_thuoc: "Đợt 1",
          chan_doan: "Bệnh tả",
          luu_y: "Không tự ý ngưng thuốc",
          loi_dan: "Uống thuốc sau ăn",
          ten_bac_si: "Nguyễn Văn Ngọ",
          ten_co_so_kham_chua_benh: "Bệnh viện Bưu điện",
          so_dien_thoai_co_so_kham_chua_benh: "0123456789",
          ngay_gio_ke_don: "04-09-2025 10:30",
        },
      ],
      [
        {
          id: 1,
          ma_thuoc: "00000000002",
          ten_thuoc_tren_don: "Sintrom 4mg - VIEN",
          hoat_chat: "Viên uống (Oral tablet)",
          don_vi_tinh: "Viên",
          sl_duoc_ban: -4,
          sl_ke_don: 1,
          sl_da_ban: 5,
          cach_dung: "Sáng 1 viên",
          gia: 50000,
        },
        {
          id: 2,
          ma_thuoc: "00000000001",
          ten_thuoc_tren_don: "Glucobay 50mg - VIEN",
          hoat_chat:
            "Hộp 10 vỉ x 10 viên, Viên nén (Box of 10 blisters x 10 tablets, Film-coated tablet)",
          don_vi_tinh: "Viên",
          sl_duoc_ban: -9,
          sl_ke_don: 1,
          sl_da_ban: 10,
          cach_dung: "Chiều 1 viên",
          gia: 75000,
        },
      ],
    ],
  },
};

const safeJsonParse = (value) => {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch (error) {
    console.warn("Không thể parse JSON:", error);
    return value;
  }
};

const extractFirstObject = (dataset) => {
  if (!dataset) return {};
  if (Array.isArray(dataset)) {
    if (dataset.length === 0) return {};
    if (Array.isArray(dataset[0])) {
      return dataset[0][0] || {};
    }
    return dataset[0] || {};
  }
  if (typeof dataset === "object") {
    return dataset;
  }
  return {};
};

const extractArrayFromDataset = (dataset) => {
  if (!dataset) return [];
  if (Array.isArray(dataset)) {
    if (dataset.length > 0 && Array.isArray(dataset[0])) {
      return dataset[0];
    }
    return dataset;
  }
  return [];
};

const normalizeGender = (value) => {
  if (value === null || value === undefined || value === "") return "";
  const normalized = String(value).trim().toLowerCase();
  if (["1", "nam", "male", "m"].includes(normalized)) return "Nam";
  if (["0", "nu", "female", "f"].includes(normalized)) return "Nữ";
  return String(value);
};

const formatPrescriptionInfo = (rawInfo = {}) => {
  const info = rawInfo || {};
  const normalizeTextField = (value) => {
    if (!value) return "";
    if (Array.isArray(value)) {
      return value
        .map((item) => {
          if (typeof item === "string") return item;
          if (item && typeof item === "object") {
            return (
              item.ten_chan_doan ||
              item.ten_chan_doan_icd ||
              item.ten_thuoc ||
              item.tenThuoc ||
              item.ghi_chu ||
              JSON.stringify(item)
            );
          }
          return String(item);
        })
        .filter(Boolean)
        .join("; ");
    }
    if (typeof value === "object") {
      return (
        value.ten_chan_doan ||
        value.ten_thuoc ||
        value.ghi_chu ||
        Object.values(value).join(" - ")
      );
    }
    return String(value);
  };

  const thongTinDonThuocText = normalizeTextField(
    info.thong_tin_don_thuoc || info.thongTinDonThuoc || ""
  );
  const chanDoanText = normalizeTextField(info.chan_doan || info.chanDoan || "");

  return {
    maDonThuoc: info.ma_don_thuoc || info.maDonThuoc || info.ma_don || "",
    hoTenBenhNhan: info.ho_ten_benh_nhan || info.hoTenBenhNhan || "",
    tenBenhNhan: info.ten_benh_nhan || info.tenBenhNhan || "",
    tenKhachHang: info.ten_khach_hang || info.tenKhachHang || "",
    ngaySinhBenhNhan: info.ngay_sinh_benh_nhan || info.ngaySinhBenhNhan || "",
    maDinhDanhYTe: info.ma_dinh_danh_y_te || info.maDinhDanhYTe || "",
    loaiDonThuoc:
      info.loai_don_thuoc ||
      info.loaiDonThuoc ||
      (() => {
        const code = info.ma_don_thuoc || info.maDonThuoc || "";
        if (typeof code === "string" && code.includes("-")) {
          return code.split("-").pop();
        }
        return "";
      })(),
    hinhThucDieuTri: info.hinh_thuc_dieu_tri || info.hinhThucDieuTri || "",
    diaChi: info.dia_chi || info.diaChi || "",
    gioiTinh: normalizeGender(info.gioi_tinh || info.gioiTinh),
    canNang: info.can_nang || info.canNang || "",
    maSoTheBaoHiemYTe:
      info.ma_so_the_bao_hiem_y_te ||
      info.maSoTheBaoHiemYTe ||
      info.ma_so_bhyt ||
      "",
    thongTinDonThuoc:
      info.thong_tin_don_thuoc_format ||
      thongTinDonThuocText ||
      "",
    dotDungThuoc: info.dot_dung_thuoc || info.dotDungThuoc || "",
    chanDoan: chanDoanText,
    luuY: info.luu_y || info.luuY || "",
    loiDan: info.loi_dan || info.loiDan || "",
    tenBacSi: info.ten_bac_si || info.tenBacSi || "",
    tenCoSoKhamChuaBenh:
      info.ten_co_so_kham_chua_benh || info.tenCoSoKhamChuaBenh || "",
    soDienThoaiCoSoKhamChuaBenh:
      info.so_dien_thoai_co_so_kham_chua_benh ||
      info.soDienThoaiCoSoKhamChuaBenh ||
      "",
    soDienThoaiNguoiKhamBenh:
      info.so_dien_thoai_nguoi_kham_benh ||
      info.soDienThoaiNguoiKhamBenh ||
      "",
    ngayGioKeDon: info.ngay_gio_ke_don || info.ngayGioKeDon || "",
  };
};

const normalizeMedicinesList = (rawList = []) => {
  const list = Array.isArray(rawList) ? rawList : [];
  return list.map((item, index) => {
    const safeNumber = (value) => {
      if (value === null || value === undefined || value === "") return "";
      const parsed = Number(value);
      return Number.isNaN(parsed) ? value : parsed;
    };
    const note =
      item.ghi_chu ||
      item.ghiChu ||
      item.ghiChuChiDinh ||
      item.chi_dan ||
      item.chiDan ||
      "";

    // Mã thuốc từ đơn thuốc quốc gia
    const maThuocDTQG = item.ma_thuoc || item.maThuoc || item.ma_vt || "";
    
    return {
      id: item.id || item.ID || item.ma_thuoc || index + 1,
      // Thông tin gốc để map sang các field Đơn thuốc QG
      ma_vt_dtqg: maThuocDTQG, // Mã thuốc từ đơn thuốc quốc gia
      ten_vt_dtqg: item.ten_thuoc || item.tenThuoc || "",
      so_luong_dtqg: item.so_luong || "",
      lieu_dung: item.lieu_dung || item.cach_dung || item.cachDung || "",
      biet_duoc: item.biet_duoc || "",
      maThuoc: maThuocDTQG, // Mã thuốc từ đơn thuốc quốc gia
      tenThuoc:
        item.ten_thuoc_tren_don ||
        item.tenThuocTrenDon ||
        item.ten_thuoc ||
        item.ten_vt ||
        "",
      hoatChat:
        item.biet_duoc ||
        item.hoat_chat ||
        item.hoatChat ||
        "",
      dvt: item.don_vi_tinh || item.dvt || "",
      slDuocBan:
        safeNumber(item.sl_duoc_ban || item.so_luong_duoc_ban || item.slDuocBan) ||
        "",
      slKeDon:
        safeNumber(
          item.sl_ke_don || item.so_luong_ke_don || item.so_luong || item.slKeDon
        ) || "",
      cachDung: item.cach_dung || item.cachDung || "",
      gia: item.gia || item.don_gia || 0,
      ghi_chu: typeof note === "string" ? note.trim() : note,
      selected: false,
      searchInput: "",
      selectedMedicineName: "",
      selectedMedicineCode: "",
      selectedMedicineUnit: "",
      selectedMedicinePrice: 0,
    };
  });
};

const normalizePrescriptionResponse = (rawData) => {
  if (!rawData) {
    return { info: null, medicines: [] };
  }

  const unwrapData = (data) => {
    if (!data) return null;
    if (data.data) return data.data;
    if (data.result) return data.result;
    return data;
  };

  const source = unwrapData(rawData) || {};
  const parsedSource = source?.parsed || source;

  const listObject = Array.isArray(parsedSource?.listObject)
    ? parsedSource.listObject
    : Array.isArray(parsedSource)
    ? parsedSource
    : Array.isArray(parsedSource?.data)
    ? parsedSource.data
    : Array.isArray(source?.listObject)
    ? source.listObject
    : [];

  const baseInfo =
    parsedSource && !Array.isArray(parsedSource) ? parsedSource : null;

  let infoSource =
    baseInfo ||
    parsedSource?.info ||
    parsedSource?.prescriptionInfo ||
    source?.info ||
    source?.prescriptionInfo ||
    extractFirstObject(listObject[0]) ||
    extractFirstObject(parsedSource?.data) ||
    extractFirstObject(source?.data) ||
    {};

  if (
    (!infoSource || Object.keys(infoSource).length === 0) &&
    Array.isArray(parsedSource?.master)
  ) {
    infoSource = extractFirstObject(parsedSource.master);
  }

  if (
    (!infoSource || Object.keys(infoSource).length === 0) &&
    Array.isArray(source?.master)
  ) {
    infoSource = extractFirstObject(source.master);
  }

  if (typeof infoSource === "string") {
    infoSource = safeJsonParse(infoSource);
  }

  let medicinesSource =
    parsedSource?.thong_tin_don_thuoc ||
    parsedSource?.chi_tiet_dt_client ||
    parsedSource?.chi_tiet_don_thuoc ||
    parsedSource?.details ||
    parsedSource?.prescriptionItems ||
    parsedSource?.items ||
    source?.chi_tiet_don_thuoc ||
    source?.details ||
    source?.prescriptionItems ||
    source?.items ||
    extractArrayFromDataset(listObject[1]);

  if (!medicinesSource.length && Array.isArray(parsedSource?.detail)) {
    medicinesSource = parsedSource.detail;
  }

  if (!medicinesSource.length && Array.isArray(source?.detail)) {
    medicinesSource = source.detail;
  }

  if (
    !medicinesSource.length &&
    typeof infoSource?.thong_tin_don_thuoc === "string"
  ) {
    const parsed = safeJsonParse(infoSource.thong_tin_don_thuoc);
    medicinesSource = Array.isArray(parsed) ? parsed : [];
  }

  if (
    !medicinesSource.length &&
    Array.isArray(parsedSource?.chi_tiet_don_thuoc_json)
  ) {
    medicinesSource = parsedSource.chi_tiet_don_thuoc_json;
  }

  if (
    !medicinesSource.length &&
    Array.isArray(source?.chi_tiet_don_thuoc_json)
  ) {
    medicinesSource = source.chi_tiet_don_thuoc_json;
  }

  return {
    info: formatPrescriptionInfo(infoSource),
    medicines: normalizeMedicinesList(medicinesSource),
  };
};

const PrescriptionModal = ({ isOpen, onClose, onApplyPrescription }) => {
  // Get user info from Redux
  const { id: userId, unitId } = useSelector(
    (state) => state.claimsReducer.userInfo || {}
  );

  const [prescriptionCode, setPrescriptionCode] = useState("");
  const [searching, setSearching] = useState(false);
  const [prescriptionInfo, setPrescriptionInfo] = useState(null);
  const [selectedMedicines, setSelectedMedicines] = useState([]);
  const [medicines, setMedicines] = useState([]);

  // States for VatTuSelectFullPOS
  const [vatTuInput, setVatTuInput] = useState("");
  const [barcodeEnabled, setBarcodeEnabled] = useState(false);
  const [barcodeJustEnabled, setBarcodeJustEnabled] = useState(false);
  const [vatTuList, setVatTuList] = useState([]);
  const [loadingVatTu, setLoadingVatTu] = useState(false);
  const [pageIndex, setPageIndex] = useState(1);
  const [totalPage, setTotalPage] = useState(1);
  const [currentKeyword, setCurrentKeyword] = useState("");

  const vatTuSelectRef = useRef();
  const searchTimeoutRef = useRef();

  const handleSearch = async () => {
    if (!prescriptionCode.trim()) {
      notification.warning({
        message: "Vui lòng nhập mã đơn thuốc",
      });
      return;
    }

    setSearching(true);

    try {
      let payloadData = null;

      if (USE_FAKE_PRESCRIPTION) {
        payloadData = mockPrescriptionResponse.data;
      } else {
        const apiResponse = await fetchPrescriptionFromDonThuocQG({
          ma_dvcs: (unitId && String(unitId)) || DEFAULT_MA_DVCS,
          ma_don_thuoc: prescriptionCode.trim(),
        });

        if (!apiResponse?.success) {
          throw new Error(
            apiResponse?.message || "Không tìm thấy dữ liệu đơn thuốc"
          );
        }

        payloadData = apiResponse.data;
      }

      const { info, medicines: normalizedMedicines } =
        normalizePrescriptionResponse(payloadData);

      if (!info || !info.maDonThuoc) {
        notification.warning({
          message: "Đơn thuốc không hợp lệ",
          description: "Không tìm thấy thông tin đơn thuốc phù hợp",
        });
        setPrescriptionInfo(null);
        setMedicines([]);
        setSelectedMedicines([]);
        return;
      }

      setPrescriptionInfo(info);
      setMedicines(normalizedMedicines);
      setSelectedMedicines([]);

      notification.success({
        message: USE_FAKE_PRESCRIPTION ? "Đã tải dữ liệu mẫu" : "Tìm thấy đơn thuốc",
        description: `Đã tải ${normalizedMedicines.length} dòng thuốc`,
      });
    } catch (error) {
      console.error("Lỗi tìm kiếm đơn thuốc:", error);
      notification.error({
        message: "Lỗi kết nối",
        description:
          error?.message || "Không thể kết nối đến máy chủ hoặc không tìm thấy đơn",
      });
      setPrescriptionInfo(null);
      setMedicines([]);
      setSelectedMedicines([]);
    } finally {
      setSearching(false);
    }
  };

  const handleMedicineSelect = (medicineId, checked) => {
    setMedicines((prev) =>
      prev.map((med) =>
        med.id === medicineId ? { ...med, selected: checked } : med
      )
    );

    if (checked) {
      setSelectedMedicines((prev) => [...prev, medicineId]);
    } else {
      setSelectedMedicines((prev) => prev.filter((id) => id !== medicineId));
    }
  };

  // Real API function for fetching medicine list (same as POS)
  const fetchVatTuList = useCallback(
    async (keyword = "", page = 1, append = false) => {
      setLoadingVatTu(true);

      try {
        const response = await searchVatTu(keyword, page, 20, unitId, userId);

        // Kiểm tra response success - sử dụng cấu trúc API mới
        if (response?.responseModel?.isSucceded) {
          const listObject = response.listObject;

          // listObject[0] chứa array các items
          const data = listObject?.[0] || [];
          // listObject[1] chứa array thông tin pagination
          const paginationInfo = listObject?.[1]?.[0] || {};

          // Transform API data to match ProductSelectFull format
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
          }));

          if (append) {
            setVatTuList((prev) => [...prev, ...transformedData]);
            // Cập nhật pageIndex khi append thành công
            setPageIndex(page);
          } else {
            setVatTuList(transformedData);
            // Reset pageIndex khi search mới
            setPageIndex(1);
          }

          // Sử dụng metadata phân trang từ API
          const newTotalPage = paginationInfo.totalpage || 1;
          setTotalPage(newTotalPage);
          setCurrentKeyword(keyword);
        } else {
          // Hiển thị error message từ API
          const errorMessage =
            response?.responseModel?.message || "Không thể tìm kiếm vật tư";
          notification.error({
            message: "Lỗi tìm kiếm",
            description: errorMessage,
          });

          if (!append) {
            setVatTuList([]);
            setPageIndex(1);
          }
        }
      } catch (error) {
        console.error("Error fetching products:", error);
        notification.error({
          message: "Lỗi kết nối",
          description: "Không thể kết nối đến máy chủ",
        });

        if (!append) {
          setVatTuList([]);
          setPageIndex(1);
        }
      } finally {
        setLoadingVatTu(false);
      }
    },
    [unitId, userId]
  );

  const handleVatTuSelectForRow = async (value, record) => {
    try {
      // Tìm item trong danh sách hiện tại
      let selectedItem = vatTuList.find((item) => item.value === value);

      // Nếu không tìm thấy trong danh sách, gọi API để tìm kiếm (giống POS)
      if (!selectedItem && typeof value === "string") {
        // Chỉ tìm kiếm API nếu không tìm thấy trong list hiện tại
        // Điều này xảy ra khi người dùng nhập mã trực tiếp mà không có trong kết quả search
        try {
          const response = await searchVatTu(value, 1, 1, unitId, userId);
          if (
            response.responseModel?.isSucceded &&
            response.listObject?.[0]?.length > 0
          ) {
            const foundItem = response.listObject[0][0];
            selectedItem = {
              value: foundItem.value || value,
              label: foundItem.label || `Sản phẩm - ${value}`,
              item: {
                sku: foundItem.value || value,
                name: foundItem.label || `Sản phẩm ${value}`,
                price: foundItem.gia || 0,
                unit: foundItem.dvt || "cái",
                stock: 0, // API không trả về stock
                ma_thue: (foundItem.ma_thue || "").trim(),
                thue_suat: Number(foundItem.thue_suat) || 0,
              },
            };
          } else {
            // Hiển thị error message từ API nếu có
            const errorMessage =
              response.responseModel?.message ||
              `Không tìm thấy sản phẩm với mã: ${value}`;
            notification.error({
              message: "Không tìm thấy thuốc",
              description: errorMessage,
            });
            return false;
          }
        } catch (error) {
          console.error("Error searching product by barcode:", error);
          notification.error({
            message: "Lỗi tìm kiếm",
            description: `Không thể tìm kiếm sản phẩm với mã: ${value}`,
          });
          return false;
        }
      }

      if (selectedItem) {
        // Cập nhật thông tin thuốc đã chọn từ danh mục (không thay đổi tenThuoc - tên thuốc trên đơn)
        const updatedMedicine = {
          ...record,
          selectedMedicineCode: selectedItem.item.sku, // Mã thuốc đã chọn
          selectedMedicineName: selectedItem.item.name, // Tên thuốc đã chọn
          selectedMedicineUnit: selectedItem.item.unit, // ĐVT đã chọn
          selectedMedicinePrice: selectedItem.item.price, // Giá đã chọn
          searchInput: "", // Clear search input
        };

        // Cập nhật dòng trong danh sách
        setMedicines((prev) =>
          prev.map((med) => (med.id === record.id ? updatedMedicine : med))
        );

        notification.success({
          message: "Đã chọn thuốc",
          description: `Đã chọn ${selectedItem.item.name}`,
        });

        return true;
      } else {
        notification.error({
          message: "Không tìm thấy thuốc",
          description: `Không thể tìm thấy sản phẩm với mã: ${value}`,
        });
        return false;
      }
    } catch (error) {
      console.error("Lỗi khi chọn thuốc:", error);
      notification.error({
        message: "Có lỗi xảy ra khi chọn thuốc",
        description: error?.message || "Vui lòng thử lại",
      });
      return false;
    }
  };

  const handleApplyPrescription = () => {
    if (medicines.length === 0) {
      notification.warning({
        message: "Vui lòng chọn ít nhất một loại thuốc",
      });
      return;
    }

    // Kiểm tra tất cả các thuốc đã được chọn từ danh mục chưa
    const unselectedMedicines = medicines.filter(
      (med) => !med.selectedMedicineCode || med.selectedMedicineCode.trim() === ""
    );

    if (unselectedMedicines.length > 0) {
      notification.error({
        message: "Vui lòng chọn thuốc từ danh mục",
        description: `Có ${unselectedMedicines.length} thuốc chưa được chọn từ danh mục. Vui lòng chọn thuốc cho tất cả các dòng trước khi áp dụng.`,
        duration: 5,
      });
      return;
    }

    onApplyPrescription(medicines, prescriptionInfo);

    notification.success({
      message: "Áp dụng đơn thuốc thành công",
      description: `Đã thêm ${medicines.length} loại thuốc vào giỏ hàng`,
    });

    handleClose();
  };

  const handleClose = () => {
    setPrescriptionCode("");
    setPrescriptionInfo(null);
    setMedicines([]);
    setSelectedMedicines([]);
    setVatTuInput("");
    setBarcodeEnabled(false);
    setBarcodeJustEnabled(false);
    setVatTuList([]);
    setLoadingVatTu(false);
    setPageIndex(1);
    setTotalPage(1);
    setCurrentKeyword("");
    onClose();
  };

  const columns = [
    {
      title: "Chọn thuốc từ danh mục",
      key: "select",
      width: 320,
      minWidth: 280,
      align: "center",
      render: (_, record) => (
        <VatTuSelectFullPOS
          isEditMode={true}
          barcodeEnabled={barcodeEnabled}
          setBarcodeEnabled={setBarcodeEnabled}
          setBarcodeJustEnabled={setBarcodeJustEnabled}
          vatTuInput={record.selectedMedicineName || record.searchInput || ""}
          setVatTuInput={(value) => {
            // Nếu user xóa selectedMedicineName (value rỗng và trước đó có selectedMedicineName)
            if (!value && record.selectedMedicineName) {
              setMedicines((prev) =>
                prev.map((med) =>
                  med.id === record.id
                    ? {
                        ...med,
                        searchInput: "",
                        selectedMedicineName: "",
                        selectedMedicineCode: "",
                        selectedMedicineUnit: "",
                        selectedMedicinePrice: 0,
                      }
                    : med
                )
              );
            } else {
              // Cập nhật searchInput để tìm kiếm
              setMedicines((prev) =>
                prev.map((med) =>
                  med.id === record.id ? { ...med, searchInput: value } : med
                )
              );
            }
          }}
          vatTuSelectRef={vatTuSelectRef}
          loadingVatTu={loadingVatTu}
          vatTuList={vatTuList}
          searchTimeoutRef={searchTimeoutRef}
          fetchVatTuList={fetchVatTuList}
          handleVatTuSelect={(value) => handleVatTuSelectForRow(value, record)}
          totalPage={totalPage}
          pageIndex={pageIndex}
          setPageIndex={setPageIndex}
          setVatTuList={setVatTuList}
          currentKeyword={currentKeyword}
        />
      ),
    },
    {
      title: "Mã thuốc",
      dataIndex: "maThuoc",
      key: "maThuoc",
      width: 140,
      minWidth: 120,
      align: "center",
      render: (text) => <div>{text}</div>,
    },
    {
      title: "Tên thuốc trên đơn",
      dataIndex: "tenThuoc",
      key: "tenThuoc",
      width: 250,
      minWidth: 220,
      align: "center",
      render: (text) => (
        <div
          style={{
            whiteSpace: "normal",
            wordWrap: "break-word",
            overflowWrap: "break-word",
          }}
        >
          {text}
        </div>
      ),
    },
    {
      title: "Hoạt chất",
      dataIndex: "hoatChat",
      key: "hoatChat",
      width: 320,
      minWidth: 280,
      align: "center",
      render: (text) => (
        <div
          style={{
            whiteSpace: "normal",
            wordWrap: "break-word",
            overflowWrap: "break-word",
          }}
        >
          {text}
        </div>
      ),
    },
    {
      title: "ĐVT",
      dataIndex: "dvt",
      key: "dvt",
      width: 80,
      minWidth: 70,
      align: "center",
    },
    {
      title: "SL kê đơn",
      dataIndex: "slKeDon",
      key: "slKeDon",
      width: 110,
      minWidth: 90,
      align: "center",
    },
    {
      title: "Cách dùng",
      dataIndex: "cachDung",
      key: "cachDung",
      width: 220,
      minWidth: 180,
      align: "center",
      render: (text) => (
        <div
          style={{
            whiteSpace: "normal",
            wordWrap: "break-word",
            overflowWrap: "break-word",
          }}
        >
          {text}
        </div>
      ),
    },
  ];

  return (
    <Modal
      open={isOpen}
      onCancel={handleClose}
      footer={null}
      width={1600}
      className="prescription-modal"
      centered
    >
      <div className="prescription-modal-content">
        {/* Scrollable Content Area */}
        <div className="prescription-scrollable-content">
          {/* Header */}
          <div className="prescription-header">
            <Title level={5} className="prescription-title">
              Thông tin đơn thuốc
            </Title>
          </div>

          {/* Search Section */}
          <div className="prescription-search">
            <div className="search-input-group">
              <Input
                placeholder="Mã đơn thuốc"
                value={prescriptionCode}
                onChange={(e) => setPrescriptionCode(e.target.value)}
                className="prescription-input"
                onPressEnter={handleSearch}
              />
              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={handleSearch}
                loading={searching}
                className="search-button"
              >
                Tìm kiếm
              </Button>
            </div>
          </div>

          {/* Information Display - Only show after search */}
          {prescriptionInfo && (
            <div className="prescription-info">
              {[
                {
                  title: "Thông tin bệnh nhân",
                  rows: [
                    [
                      { label: "Mã đơn thuốc", value: prescriptionInfo.maDonThuoc },
                      { label: "Họ tên bệnh nhân", value: prescriptionInfo.hoTenBenhNhan },
                      {
                        label: "Tên khách hàng",
                        value:
                          prescriptionInfo.tenKhachHang ||
                          prescriptionInfo.tenBenhNhan ||
                          prescriptionInfo.hoTenBenhNhan,
                      },
                    ],
                    [
                      { label: "Ngày sinh", value: prescriptionInfo.ngaySinhBenhNhan },
                      { label: "Giới tính", value: prescriptionInfo.gioiTinh },
                      { label: "Cân nặng", value: prescriptionInfo.canNang },
                    ],
                    [
                      { label: "Mã định danh y tế", value: prescriptionInfo.maDinhDanhYTe },
                      { label: "Mã thẻ BHYT", value: prescriptionInfo.maSoTheBaoHiemYTe },
                      { label: "Địa chỉ", value: prescriptionInfo.diaChi },
                    ],
                  ],
                  isGrouped: true,
                },
                {
                  title: "Thông tin kê đơn",
                  rows: [
                    { label: "Loại đơn thuốc", value: prescriptionInfo.loaiDonThuoc },
                    { label: "Hình thức điều trị", value: prescriptionInfo.hinhThucDieuTri },
                    { label: "Ngày giờ kê đơn", value: prescriptionInfo.ngayGioKeDon },
                    { label: "Đợt dùng thuốc", value: prescriptionInfo.dotDungThuoc },
                  ],
                },
                {
                  title: "Cơ sở khám chữa bệnh",
                  rows: [
                    { label: "Tên bác sĩ", value: prescriptionInfo.tenBacSi },
                    {
                      label: "Tên cơ sở khám chữa bệnh",
                      value: prescriptionInfo.tenCoSoKhamChuaBenh,
                    },
                    {
                      label: "SĐT cơ sở khám chữa bệnh",
                      value: prescriptionInfo.soDienThoaiCoSoKhamChuaBenh,
                    },
                  ],
                },
                {
                  title: "Chẩn đoán & hướng dẫn",
                  rows: [
                    { label: "Chẩn đoán", value: prescriptionInfo.chanDoan },
                    { label: "Thông tin đơn thuốc", value: prescriptionInfo.thongTinDonThuoc },
                    { label: "Lưu ý", value: prescriptionInfo.luuY },
                    { label: "Lời dặn", value: prescriptionInfo.loiDan },
                  ],
                },
              ]
                .filter((group) => {
                  const rowsArray = group.isGrouped ? group.rows.flat() : group.rows;
                  return rowsArray.some(
                    (row) =>
                      row.value !== null &&
                      row.value !== undefined &&
                      row.value !== ""
                  );
                })
                .map((group) => (
                  <div key={group.title} className="info-card">
                    <Text className="info-card-title">{group.title}</Text>
                    {group.isGrouped ? (
                      group.rows.map((rowGroup, index) => (
                        <div className="info-grid" key={`${group.title}-group-${index}`}>
                          {rowGroup.map((row) => (
                            <div className="info-row" key={`${group.title}-${row.label}`}>
                              <span className="info-label">{row.label}:</span>
                              <span className="info-value">{row.value || "--"}</span>
                            </div>
                          ))}
                        </div>
                      ))
                    ) : (
                      <div className="info-grid">
                        {group.rows.map((row) => (
                          <div className="info-row" key={`${group.title}-${row.label}`}>
                            <span className="info-label">{row.label}:</span>
                            <span className="info-value">{row.value || "--"}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          )}

          {/* Medicine Table - Only show after search */}
          {medicines.length > 0 && (
            <div className="medicine-table-section">
              <div className="medicine-table-wrapper">
                <Table
                  columns={columns}
                  dataSource={medicines.filter(
                    (med) => med && med.id && med.maThuoc && med.tenThuoc
                  )}
                  rowKey="id"
                  pagination={false}
                  size="small"
                  className="medicine-table"
                  scroll={{ x: "max-content" }}
                  style={{ fontSize: "16px", minHeight: "100%" }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer with Actions - Only show after search */}
        {prescriptionInfo && (
          <div className="prescription-footer">
            <div className="action-buttons">
              <Button
                type="primary"
                icon={<CheckOutlined />}
                onClick={handleApplyPrescription}
                disabled={
                  medicines.length === 0 ||
                  medicines.some(
                    (med) => !med.selectedMedicineCode || med.selectedMedicineCode.trim() === ""
                  )
                }
                className="apply-button"
              >
                Áp dụng đơn thuốc
              </Button>
              <Button
                type="text"
                icon={<CloseOutlined />}
                onClick={handleClose}
                className="exit-button"
              >
                Thoát
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default PrescriptionModal;
