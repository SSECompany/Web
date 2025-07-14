import { EditOutlined, LeftOutlined } from "@ant-design/icons";
import { Button, Form, Space, Typography } from "antd";
import moment from "moment/moment";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import showConfirm from "../../../../components/common/Modal/ModalConfirm";
import https from "../../../../utils/https";
import PhieuFormInputs from "./components/PhieuFormInputs";
import VatTuInputSection from "./components/VatTuInputSection";
import VatTuTable from "./components/VatTuTable";
import { usePhieuXuatKhoData } from "./hooks/usePhieuXuatKhoData";
import { useVatTuManager } from "./hooks/useVatTuManager";
import "./phieu-xuat-kho-ban-hang.css";
import {
  buildPayload,
  deletePhieu,
  submitPhieu,
  validateDataSource,
  validateQuantityAndShowConfirm,
} from "./utils/phieuXuatKhoUtils";

const { Title } = Typography;

const DetailPhieuXuatKhoBanHang = ({ isEditMode: initialEditMode = false }) => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { stt_rec } = useParams();
  const location = useLocation();

  // State
  const [phieuData, setPhieuData] = useState(null);
  const [isEditMode, setIsEditMode] = useState(initialEditMode);
  const [vatTuInput, setVatTuInput] = useState(undefined);
  const [barcodeEnabled, setBarcodeEnabled] = useState(false);
  const [barcodeJustEnabled, setBarcodeJustEnabled] = useState(false);
  const [screenSize, setScreenSize] = useState("desktop");

  // Refs for preventing multiple calls and caching
  const vatTuSelectRef = useRef();
  const searchTimeoutRef = useRef();
  const donViTinhCache = useRef(new Map()); // Keep cache for donViTinh only

  // Flags to prevent duplicate calls
  const masterDataLoadedRef = useRef(false);
  const phieuDetailLoadedRef = useRef(null); // Store loaded stt_rec
  const isLoadingMasterDataRef = useRef(false);
  const isLoadingPhieuDetailRef = useRef(false);

  // Custom hooks
  const {
    loading,
    setLoading,
    maGiaoDichList,
    maKhachList,
    loadingMaKhach,
    vatTuList,
    loadingVatTu,
    fetchMaKhachListDebounced,
    fetchMaGiaoDichList,
    fetchMaKhachList,
    fetchVatTuList,
    fetchVatTuDetail,
    fetchDonViTinh,
    setVatTuList,
  } = usePhieuXuatKhoData();

  const {
    dataSource,
    setDataSource,
    handleVatTuSelect: vatTuSelectHandler,
    handleQuantityChange,
    handleDeleteItem,
    handleDvtChange,
  } = useVatTuManager();

  // Batch fetch don vi tinh only (still needed for dropdown)
  const fetchDonViTinhBatch = useCallback(
    async (maVatTuList) => {
      if (!maVatTuList.length) return [];

      // Filter out already cached items
      const uncachedItems = maVatTuList.filter(
        (ma_vt) => !donViTinhCache.current.has(ma_vt.trim())
      );

      if (uncachedItems.length > 0) {
        try {
          // Batch API calls for uncached don vi tinh only
          await Promise.all(
            uncachedItems.map(async (ma_vt) => {
              const donViTinhList = await fetchDonViTinh(ma_vt);

              // Cache results
              donViTinhCache.current.set(ma_vt.trim(), donViTinhList);
            })
          );
        } catch (error) {
          console.error("Error in batch fetch don vi tinh:", error);
        }
      }

      // Return results from cache
      return maVatTuList.map((ma_vt) => ({
        ma_vt,
        donViTinhList: donViTinhCache.current.get(ma_vt.trim()) || [],
      }));
    },
    [fetchDonViTinh]
  );

  // Load master data only once
  const loadMasterData = useCallback(async () => {
    if (masterDataLoadedRef.current || isLoadingMasterDataRef.current) {
      return;
    }

    isLoadingMasterDataRef.current = true;

    try {
      // Call APIs in parallel
      await Promise.all([
        fetchMaGiaoDichList(),
        fetchMaKhachList(),
        fetchVatTuList(),
      ]);

      masterDataLoadedRef.current = true;
    } catch (error) {
      console.error("Error loading master data:", error);
    } finally {
      isLoadingMasterDataRef.current = false;
    }
  }, [fetchMaGiaoDichList, fetchMaKhachList, fetchVatTuList]);

  // Load phieu detail - OPTIMIZED: Use existing vat tu data, only fetch don vi tinh
  const fetchPhieuDetail = useCallback(async () => {
    // Prevent duplicate calls for same stt_rec
    if (
      phieuDetailLoadedRef.current === stt_rec ||
      isLoadingPhieuDetailRef.current
    ) {
      return;
    }

    isLoadingPhieuDetailRef.current = true;
    setLoading(true);

    try {
      const token = localStorage.getItem("access_token");
      const res = await https.get(
        `v1/web/chi-tiet-chung-tu-xuat-kho-ban-hang?stt_rec=${stt_rec}`,
        {},
        {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        }
      );

      const data = res.data;

      if (data?.data?.length > 0 && data?.data2?.length > 0) {
        const phieuHeader = data.data[0];
        const phieuDetails = data.data2;

        setPhieuData({
          ...phieuHeader,
          details: phieuDetails,
        });

        const ngayCt = phieuHeader.ngay_ct ? moment(phieuHeader.ngay_ct) : null;

        form.setFieldsValue({
          maKhach: phieuHeader.ma_kh,
          soPhieu: phieuHeader.so_ct,
          dienGiai: phieuHeader.dien_giai,
          ngay: ngayCt,
          maNVBH: phieuHeader.ma_nvbh || "",
          xe: phieuHeader.xe_vc || "",
          taiXe: phieuHeader.tai_xe || "",
          maGiaoDich: phieuHeader.ma_gd || "",
          trangThai: phieuHeader.status || "3",
        });

        if (phieuDetails.length > 0) {
          // ✅ OPTIMIZED: Only fetch don vi tinh (needed for dropdown), use existing vat tu data
          const uniqueMaVatTu = [
            ...new Set(phieuDetails.map((item) => item.ma_vt)),
          ];

          // Batch fetch don vi tinh AND vat tu detail (like phieu nhap kho)
          const batchResults = await fetchDonViTinhBatch(uniqueMaVatTu);

          // ✅ ADDED: Fetch vat tu detail for each item (like phieu nhap kho)
          const vatTuDetailResults = await Promise.all(
            uniqueMaVatTu.map(async (ma_vt) => {
              const vatTuDetail = await fetchVatTuDetail(ma_vt.trim());
              return { ma_vt, vatTuDetail };
            })
          );

          // Create lookup maps
          const donViTinhMap = new Map();
          const vatTuDetailMap = new Map();

          batchResults.forEach((result) => {
            if (result?.ma_vt) {
              donViTinhMap.set(result.ma_vt.trim(), result.donViTinhList);
            }
          });

          vatTuDetailResults.forEach((result) => {
            if (result?.ma_vt && result?.vatTuDetail) {
              vatTuDetailMap.set(result.ma_vt.trim(), result.vatTuDetail);
            }
          });

          const mappedItems = phieuDetails.map((item, index) => {
            // ✅ Use existing vat tu data from API response
            const heSoFromAPI = parseFloat(item.he_so) || 1;
            const dvtFromAPI = item.dvt?.trim() || "cái";

            // ✅ Get don vi tinh list from API (needed for dropdown)
            const donViTinhList = donViTinhMap.get(item.ma_vt.trim()) || [
              { dvt: dvtFromAPI, he_so: heSoFromAPI }, // Fallback if API fails
            ];

            // Process quantities using existing data
            const sl_td3_hienThi = item.sl_td3 ?? item.so_luong ?? 0;
            const so_luong_hienThi = item.so_luong ?? 0;
            const dvtHienTai = dvtFromAPI;

            // ✅ APPROACH 2: Sử dụng hệ số trực tiếp từ API response
            const heSoGocFromAPI = heSoFromAPI;

            // Calculate quantities based on current unit vs base unit
            let sl_td3_goc, so_luong_goc;
            let heSoHienTai = heSoFromAPI;

            if (dvtHienTai.trim() === dvtFromAPI.trim()) {
              // Same unit as in database
              sl_td3_goc =
                heSoGocFromAPI !== 0
                  ? sl_td3_hienThi / heSoGocFromAPI
                  : sl_td3_hienThi;
              so_luong_goc =
                so_luong_hienThi === 0
                  ? sl_td3_goc
                  : heSoGocFromAPI !== 0
                  ? so_luong_hienThi / heSoGocFromAPI
                  : so_luong_hienThi;
              heSoHienTai = heSoGocFromAPI;
            } else {
              // Different unit
              sl_td3_goc = sl_td3_hienThi;
              so_luong_goc =
                so_luong_hienThi === 0 ? sl_td3_hienThi : so_luong_hienThi;
              const dvtHienTaiInfo = donViTinhList.find(
                (dvt) => dvt.dvt.trim() === dvtHienTai.trim()
              );
              heSoHienTai = dvtHienTaiInfo
                ? parseFloat(dvtHienTaiInfo.he_so) || 1
                : 1;
            }

            return {
              key: index + 1,
              maHang: item.ma_vt,
              so_luong: Math.round(so_luong_hienThi * 1000) / 1000,
              so_luong_goc: Math.round(so_luong_goc * 1000) / 1000,
              sl_td3: sl_td3_hienThi,
              sl_td3_goc: Math.round(sl_td3_goc * 1000) / 1000,
              he_so: heSoHienTai,
              he_so_goc: heSoGocFromAPI,
              ten_mat_hang: item.ten_vt || item.ma_vt,
              dvt: dvtHienTai,
              dvt_goc: dvtFromAPI,
              tk_vt: item.tk_vt || "",
              ma_kho: item.ma_kho || "",
              donViTinhList: donViTinhList, // ✅ Real don vi tinh list from API

              // ✅ Add additional fields from API response for payload
              gia_nt2: parseFloat(item.gia_nt2) || 0,
              gia2: parseFloat(item.gia2) || 0,
              thue: parseFloat(item.thue) || 0,
              thue_nt: parseFloat(item.thue_nt) || 0,
              tien2: parseFloat(item.tien2) || 0,
              tien_nt2: parseFloat(item.tien_nt2) || 0,
              tl_ck: parseFloat(item.tl_ck) || 0,
              ck: parseFloat(item.ck) || 0,
              ck_nt: parseFloat(item.ck_nt) || 0,
              tk_gv: item.tk_gv || "",
              tk_dt: item.tk_dt || "",
              ma_thue: item.ma_thue || "",
              thue_suat: parseFloat(item.thue_suat) || 0,
              tk_thue: item.tk_thue || "",
              tl_ck_khac: parseFloat(item.tl_ck_khac) || 0,
              gia_ck: parseFloat(item.gia_ck) || 0,
              tien_ck_khac: parseFloat(item.tien_ck_khac) || 0,
              sl_td1: parseFloat(item.sl_td1) || 0,
              sl_td2: parseFloat(item.sl_td2) || 0,
              sl_dh: parseFloat(item.sl_dh) || 0,
              stt_rec_dh: item.stt_rec_dh || "",
              stt_rec0dh: item.stt_rec0dh || "",
              stt_rec_px: item.stt_rec_px || "",
              stt_rec0px: item.stt_rec0px || "",
            };
          });

          setDataSource(mappedItems);
        }

        // Mark as loaded
        phieuDetailLoadedRef.current = stt_rec;
      }
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu phiếu:", error);
    } finally {
      setLoading(false);
      isLoadingPhieuDetailRef.current = false;
    }
  }, [stt_rec, fetchDonViTinhBatch, setLoading, form, setDataSource]);

  // Effects with minimal dependencies
  useEffect(() => {
    if (barcodeJustEnabled && vatTuSelectRef.current) {
      vatTuSelectRef.current.focus();
      setBarcodeJustEnabled(false);
    }
  }, [barcodeJustEnabled]);

  // Load data only when stt_rec changes or component mounts
  useEffect(() => {
    const isEditPath = location.pathname.includes("/edit/");
    setIsEditMode(isEditPath);

    // Load master data only once
    if (!masterDataLoadedRef.current) {
      loadMasterData();
    }

    // Load phieu detail only if stt_rec changed
    if (phieuDetailLoadedRef.current !== stt_rec) {
      fetchPhieuDetail();
    }
  }, [stt_rec, location.pathname]);

  // Cleanup timeout
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Reset cache when component unmounts
  useEffect(() => {
    return () => {
      // Reset flags on unmount
      masterDataLoadedRef.current = false;
      phieuDetailLoadedRef.current = null;
      isLoadingMasterDataRef.current = false;
      isLoadingPhieuDetailRef.current = false;
    };
  }, []);

  // Handlers
  const handleVatTuSelect = useCallback(
    async (value) => {
      await vatTuSelectHandler(
        value,
        isEditMode,
        fetchVatTuDetail,
        fetchDonViTinh,
        setVatTuInput,
        setVatTuList,
        fetchVatTuList
      );
    },
    [
      isEditMode,
      vatTuSelectHandler,
      fetchVatTuDetail,
      fetchDonViTinh,
      setVatTuInput,
      setVatTuList,
      fetchVatTuList,
    ]
  );

  const handleSubmit = useCallback(async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();

      if (!validateDataSource(dataSource)) {
        setLoading(false);
        return;
      }

      // Kiểm tra số lượng xuất = 0 và hiển thị cảnh báo
      const quantityValidation = validateQuantityAndShowConfirm(
        dataSource,
        () => {
          showConfirm({
            title: "Cảnh báo số lượng xuất",
            content: quantityValidation.getContentJSX(),
            type: "info",
            className: "centered-buttons fixed-height wide-modal",
            onOk: async () => {
              // Xác nhận tiếp tục submit
              await submitPhieuData(values);
            },
            onCancel: () => {
              setLoading(false);
            },
          });
        }
      );

      if (quantityValidation.hasZeroQuantity) {
        quantityValidation.proceed();
        return;
      }

      // Không có vấn đề với số lượng, tiếp tục submit
      await submitPhieuData(values);
    } catch (error) {
      console.error("Lỗi khi cập nhật phiếu xuất kho:", error);
      setLoading(false);
    }
  }, [form, dataSource, phieuData, isEditMode, navigate, setLoading]);

  const submitPhieuData = useCallback(
    async (values) => {
      try {
        const payload = buildPayload(values, dataSource, phieuData, true);
        const result = await submitPhieu(
          "v1/web/cap-nhat-phieu-xuat-kho-ban-hang",
          payload,
          isEditMode ? "Cập nhật thành công" : "Lưu thành công"
        );

        if (result.success) {
          navigate("/boxly/phieu-xuat-kho-ban-hang");
        }
      } catch (error) {
        console.error("Lỗi khi cập nhật phiếu xuất kho:", error);
      } finally {
        setLoading(false);
      }
    },
    [dataSource, phieuData, isEditMode, navigate, setLoading]
  );

  const handleEdit = useCallback(() => {
    navigate(`/boxly/phieu-xuat-kho-ban-hang/edit/${stt_rec}`);
    setIsEditMode(true);
  }, [navigate, stt_rec]);

  const handleNew = useCallback(() => {
    navigate("/boxly/phieu-xuat-kho-ban-hang/add");
  }, [navigate]);

  const handleDelete = useCallback(() => {
    showConfirm({
      title: "Xác nhận xóa phiếu",
      content: "Bạn có chắc chắn muốn xóa phiếu này không?",
      type: "warning",
      onOk: async () => {
        setLoading(true);
        const result = await deletePhieu(stt_rec);
        setLoading(false);

        if (result.success) {
          navigate("/boxly/phieu-xuat-kho-ban-hang");
        }
      },
    });
  }, [stt_rec, navigate, setLoading]);

  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      if (width < 480) {
        setScreenSize("mobile");
      } else if (width < 768) {
        setScreenSize("mobileLandscape");
      } else if (width < 1024) {
        setScreenSize("tablet");
      } else {
        setScreenSize("desktop");
      }
    };
    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  return (
    <div className="phieu-xuat-bh-container">
      <div
        className="phieu-xuat-header"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 32,
          padding: "20px 24px",
          background:
            "linear-gradient(145deg,rgba(255,255,255,0.9) 0%,rgba(255,255,255,0.7) 100%)",
          borderRadius: 16,
        }}
      >
        <Button
          type="text"
          icon={<LeftOutlined />}
          onClick={() => navigate(-1)}
          className="phieu-xuat-back-button"
        >
          Trở về
        </Button>
        <Title
          level={5}
          className="phieu-xuat-title"
          style={{
            margin: 0,
            textAlign: "center",
            fontWeight: 700,
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            flex: 1,
            textShadow: "0 2px 4px rgba(0,0,0,0.1)",
          }}
        >
          {isEditMode
            ? "CHỈNH SỬA PHIẾU XUẤT KHO BÁN HÀNG"
            : "CHI TIẾT PHIẾU XUẤT KHO BÁN HÀNG"}
        </Title>
        {!isEditMode ? (
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={handleEdit}
            className="phieu-xuat-edit-button"
            style={{
              background: "linear-gradient(145deg, #11998e 0%, #38ef7d 100%)",
              color: "white",
              boxShadow:
                "0 8px 24px rgba(17, 153, 142, 0.3), 0 2px 8px rgba(17, 153, 142, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.3)",
              border: "none",
              borderRadius: 20,
              fontWeight: 600,
              fontSize: 16,
              padding: "0 24px",
              height: 44,
              display: "flex",
              alignItems: "center",
              gap: 8,
              justifyContent: "center",
              minWidth: 120,
            }}
          >
            Chỉnh sửa
          </Button>
        ) : (
          <div style={{ width: 120 }}></div>
        )}
      </div>

      <div className="phieu-xuat-bh-form-container">
        <Form
          form={form}
          layout="vertical"
          className="phieu-xuat-bh-form"
          disabled={!isEditMode}
        >
          <PhieuFormInputs
            isEditMode={isEditMode}
            maKhachList={maKhachList}
            loadingMaKhach={loadingMaKhach}
            fetchMaKhachListDebounced={fetchMaKhachListDebounced}
            maGiaoDichList={maGiaoDichList}
          />

          <VatTuInputSection
            isEditMode={isEditMode}
            barcodeEnabled={barcodeEnabled}
            setBarcodeEnabled={setBarcodeEnabled}
            setBarcodeJustEnabled={setBarcodeJustEnabled}
            vatTuInput={vatTuInput}
            setVatTuInput={setVatTuInput}
            vatTuSelectRef={vatTuSelectRef}
            loadingVatTu={loadingVatTu}
            vatTuList={vatTuList}
            searchTimeoutRef={searchTimeoutRef}
            fetchVatTuList={fetchVatTuList}
            handleVatTuSelect={handleVatTuSelect}
          />

          <VatTuTable
            dataSource={dataSource}
            isEditMode={isEditMode}
            handleQuantityChange={handleQuantityChange}
            handleDeleteItem={handleDeleteItem}
            handleDvtChange={handleDvtChange}
          />

          {isEditMode && (
            <div
              style={{
                display: "flex",
                justifyContent: "flex-start",
                marginTop: 16,
              }}
            >
              <Space>
                <Button type="primary" onClick={handleSubmit} loading={loading}>
                  Lưu
                </Button>
                <Button danger onClick={handleDelete}>
                  Xóa
                </Button>
                <Button onClick={handleNew}>Mới</Button>
              </Space>
            </div>
          )}
        </Form>
      </div>
    </div>
  );
};

export default DetailPhieuXuatKhoBanHang;
