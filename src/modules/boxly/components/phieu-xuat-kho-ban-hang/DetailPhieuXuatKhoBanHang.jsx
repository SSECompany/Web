import { EditOutlined, LeftOutlined } from "@ant-design/icons";
import { Button, Form, Space, Typography } from "antd";
import moment from "moment/moment";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import showConfirm from "../../../../components/common/Modal/ModalConfirm";
import VatTuSelectFull from "../../../../components/common/VatTuSelectFull/VatTuSelectFull";
import https from "../../../../utils/https";
import "../common-phieu.css";
import { fetchVatTuListDynamicApi } from "../phieu-nhap-kho/utils/phieuNhapKhoUtils";
import PhieuFormInputs from "./components/PhieuFormInputs";
import VatTuTable from "./components/VatTuTable";
import { usePhieuXuatKhoData } from "./hooks/usePhieuXuatKhoData";
import { useVatTuManager } from "./hooks/useVatTuManager";
import {
  buildPayload,
  deletePhieu,
  submitPhieu,
  validateDataSource,
  validateQuantityAndShowConfirm,
} from "./utils/phieuXuatKhoBanHangUtils";

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
  const [pageIndex, setPageIndex] = useState(1);
  const [totalPage, setTotalPage] = useState(1);
  const [currentKeyword, setCurrentKeyword] = useState("");
  const [vatTuList, setVatTuList] = useState([]);
  const [loadingVatTu, setLoadingVatTu] = useState(false);

  // Refs for preventing multiple calls and caching
  const vatTuSelectRef = useRef();
  const searchTimeoutRef = useRef();

  // Flags to prevent duplicate calls
  const phieuDetailLoadedRef = useRef(null); // Store loaded stt_rec
  const isLoadingPhieuDetailRef = useRef(false);

  // Custom hooks
  const {
    loading,
    setLoading,
    maGiaoDichList,
    maKhachList,
    loadingMaKhach,
    fetchMaKhachListDebounced,
    fetchMaGiaoDichList,
    fetchMaKhachList,
    fetchVatTuDetail,
    fetchDonViTinh,
  } = usePhieuXuatKhoData();

  const {
    dataSource,
    setDataSource,
    handleVatTuSelect: vatTuSelectHandler,
    handleQuantityChange,
    handleDeleteItem,
    handleDvtChange,
  } = useVatTuManager();

  const fetchVatTuList = async (
    keyword = "",
    page = 1,
    append = false,
    callback
  ) => {
    setLoadingVatTu(true);
    try {
      const userStr = localStorage.getItem("user");
      const unitsResponseStr = localStorage.getItem("unitsResponse");
      const user = userStr ? JSON.parse(userStr) : {};
      const unitsResponse = unitsResponseStr
        ? JSON.parse(unitsResponseStr)
        : {};
      const unitCode = user.unitCode || unitsResponse.unitCode;
      const res = await fetchVatTuListDynamicApi({
        keyword,
        unitCode,
        pageIndex: page,
        pageSize: 100,
      });
      if (res.success && res.data) {
        const options = res.data.map((item) => ({
          label: `${item.ma_vt} - ${item.ten_vt}`,
          value: item.ma_vt,
          ...item,
        }));
        setVatTuList((prev) => (append ? [...prev, ...options] : options));
        if (callback) callback(res.pagination);
      } else {
        if (!append) setVatTuList([]);
        if (callback) callback({ totalPage: 1 });
      }
    } catch (error) {
      setVatTuList([]);
      if (callback) callback({ totalPage: 1 });
    } finally {
      setLoadingVatTu(false);
    }
  };

  const fetchVatTuListPaging = async (
    keyword = "",
    page = 1,
    append = false
  ) => {
    setCurrentKeyword(keyword);
    await fetchVatTuList(keyword, page, append, (pagination) => {
      setPageIndex(page);
      setTotalPage(pagination?.totalPage || 1);
    });
  };

  // Load phieu detail - chỉ load thông tin cơ bản
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
          // Chỉ load thông tin cơ bản, không gọi API master data
          const mappedItems = phieuDetails.map((item, index) => {
            const sl_td3_hienThi = item.sl_td3 ?? item.so_luong ?? 0;
            const so_luong_hienThi = item.so_luong ?? 0;
            const dvtHienTai = item.dvt?.trim() || "cái";

            return {
              key: index + 1,
              maHang: item.ma_vt,
              so_luong: Math.round(so_luong_hienThi * 1000) / 1000,
              sl_td3: sl_td3_hienThi,
              ten_mat_hang: item.ten_vt || item.ma_vt,
              dvt: dvtHienTai,
              tk_vt: item.tk_vt || "",
              ma_kho: item.ma_kho || "",

              // Thêm các trường từ API response để gửi lại khi update
              gia_nt2: parseFloat(item.gia_nt2) || 0,
              gia2: parseFloat(item.gia2) || 0,
              thue: parseFloat(item.thue) || 0,
              thue_nt: parseFloat(item.thue_nt) || 0,
              tien2: parseFloat(item.tien2) || 0,
              tien_nt2: parseFloat(item.tien_nt2) || 0,
              tl_ck: parseFloat(item.tl_ck) || 0,
              ck: parseFloat(item.ck) || 0,
              ck_nt: parseFloat(item.ck_nt) || 0,
              stt_rec0: item.stt_rec0 || "",
              ma_sp: item.ma_sp || "",
              ma_bp: item.ma_bp || "",
              so_lsx: item.so_lsx || "",
              ma_vi_tri: item.ma_vi_tri || "",
              ma_lo: item.ma_lo || "",
              ma_vv: item.ma_vv || "",
              ma_nx: item.ma_nx || "",
              tk_du: item.tk_du || "",
              gia_nt: item.gia_nt || 0,
              gia: item.gia || 0,
              tien_nt: item.tien_nt || 0,
              tien: item.tien || 0,
              line_nbr: item.line_nbr || index + 1,
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
  }, [stt_rec, setLoading, form, setDataSource]);

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
      phieuDetailLoadedRef.current = null;
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
        fetchVatTuList,
        vatTuSelectRef
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
      vatTuSelectRef,
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
    <div className="phieu-container">
      <div className="phieu-header">
        <Button
          type="text"
          icon={<LeftOutlined />}
          onClick={() => navigate("/boxly/phieu-xuat-kho-ban-hang")}
          className="phieu-back-button"
        >
          Trở về
        </Button>
        <Title level={5} className="phieu-title">
          {isEditMode
            ? "CHỈNH SỬA PHIẾU XUẤT KHO BÁN HÀNG"
            : "CHI TIẾT PHIẾU XUẤT KHO BÁN HÀNG"}
        </Title>
        {!isEditMode ? (
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={handleEdit}
            className="phieu-edit-button"
          >
            Chỉnh sửa
          </Button>
        ) : (
          <div style={{ width: 120 }}></div>
        )}
      </div>

      <div className="phieu-form-container">
        <Form
          form={form}
          layout="vertical"
          className="phieu-form"
          disabled={!isEditMode}
        >
          <PhieuFormInputs
            isEditMode={isEditMode}
            maGiaoDichList={maGiaoDichList}
            maKhachList={maKhachList}
            loadingMaKhach={loadingMaKhach}
            fetchMaKhachListDebounced={fetchMaKhachListDebounced}
            fetchMaKhachList={fetchMaKhachList}
            fetchMaGiaoDichList={fetchMaGiaoDichList}
            barcodeEnabled={barcodeEnabled}
            setBarcodeEnabled={setBarcodeEnabled}
            setBarcodeJustEnabled={setBarcodeJustEnabled}
            vatTuInput={vatTuInput}
            setVatTuInput={setVatTuInput}
            vatTuSelectRef={vatTuSelectRef}
            loadingVatTu={loadingVatTu}
            vatTuList={vatTuList}
            searchTimeoutRef={searchTimeoutRef}
            fetchVatTuList={fetchVatTuListPaging}
            totalPage={totalPage}
            pageIndex={pageIndex}
            setPageIndex={setPageIndex}
            setVatTuList={setVatTuList}
            currentKeyword={currentKeyword}
            VatTuSelectComponent={VatTuSelectFull}
            handleVatTuSelect={handleVatTuSelect}
          />

          <VatTuTable
            dataSource={dataSource}
            isEditMode={isEditMode}
            handleQuantityChange={handleQuantityChange}
            handleDeleteItem={handleDeleteItem}
            handleDvtChange={handleDvtChange}
            maKhachList={maKhachList}
            loadingMaKhach={loadingMaKhach}
            fetchMaKhachListDebounced={fetchMaKhachListDebounced}
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
