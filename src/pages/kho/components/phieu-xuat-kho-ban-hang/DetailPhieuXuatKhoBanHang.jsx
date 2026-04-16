import { EditOutlined, LeftOutlined } from "@ant-design/icons";
import { Button, Form, message, Space, Typography, Select } from "antd";
import dayjs from "dayjs";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import showConfirm from "../../../../components/common/Modal/ModalConfirm";
import VatTuSelectFull from "../../../../components/common/ProductSelectFull/VatTuSelectFull";
import https from "../../../../utils/https";
import "../common-phieu.css";
import { validateQuantityForPhieu } from "../common/QuantityValidationUtils";
import { fetchVatTuListDynamicApi } from "../phieu-nhat-hang/utils/phieuNhatHangUtils";
import PhieuFormInputs from "./components/PhieuFormInputs";
import VatTuTable from "./components/VatTuTable";
import { usePhieuXuatKhoData } from "./hooks/usePhieuXuatKhoData";
import { useVatTuManager } from "./hooks/useVatTuManager";
import {
  buildPayload,
  convertApiDataToFormData,
  createDataSnapshot,
  deletePhieuDynamic,
  submitPhieuDynamic,
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

  // Dynamic payload states
  const [originalApiData, setOriginalApiData] = useState({
    master: null,
    detail: [],
  });
  const [originalSnapshot, setOriginalSnapshot] = useState({
    master: null,
    detail: [],
  });

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

  const fetchVatTuList = useCallback(
    async (keyword = "", page = 1, append = false, callback) => {
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
    },
    [] // setVatTuList is from useState, fetchVatTuListDynamicApi is imported
  );

  const fetchVatTuListPaging = useCallback(
    async (keyword = "", page = 1, append = false) => {
      setCurrentKeyword(keyword);
      await fetchVatTuList(keyword, page, append, (pagination) => {
        setPageIndex(page);
        setTotalPage(pagination?.totalPage || 1);
      });
    },
    [fetchVatTuList]
  );

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
      const body = {
        store: "api_get_data_detail_phieu_xuat_kho_ban_hang_voucher",
        param: {
          stt_rec: stt_rec,
        },
        data: {},
        resultSetNames: ["master", "detail"],
      };

      const res = await https.post("User/AddData", body, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = res.data?.listObject?.dataLists || {};

      if (data?.master?.length > 0 && data?.detail?.length > 0) {
        const phieuHeader = data.master[0];
        const phieuDetails = data.detail;

        // Lưu original API data cho dynamic payload
        setOriginalApiData({ master: phieuHeader, detail: phieuDetails });

        // Sử dụng convertApiDataToFormData để có consistency
        const { formData, dataSource: convertedDataSource } =
          convertApiDataToFormData(phieuHeader, phieuDetails);

        // Tạo snapshot để track changes
        const snapshot = createDataSnapshot(formData, convertedDataSource);
        setOriginalSnapshot(snapshot);

        // Lưu chỉ data gốc từ API để sử dụng khi build payload (không merge với UI data)
        setPhieuData(phieuHeader);

        // Set form với converted data
        form.setFieldsValue(formData);

        // Set dataSource với converted data (đã có tất cả API fields)
        setDataSource(convertedDataSource);

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
  }, [stt_rec, location.pathname, fetchPhieuDetail]);

  // Cleanup timeout
  useEffect(() => {
    const searchTimeout = searchTimeoutRef.current;
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
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

  const submitPhieuData = useCallback(
    async (values) => {
      try {
        // Sử dụng buildPayload với dynamic logic đã được implement
        const payload = buildPayload(values, dataSource, phieuData, true);

        if (!payload) {
          message.error(
            "Không thể tạo payload. Vui lòng kiểm tra lại dữ liệu."
          );
          setLoading(false);
          return;
        }
        const result = await submitPhieuDynamic(
          payload,
          isEditMode
            ? "Cập nhật phiếu xuất kho bán hàng thành công"
            : "Lưu phiếu xuất kho bán hàng thành công",
          true
        );

        if (result.success) {
          message.success(
            "Đã cập nhật thành công, đang chuyển về trang chính..."
          );

          // Delay một chút để user thấy message trước khi navigate
          setTimeout(() => {
            navigate("/kho/xuat-kho-ban-hang");
          }, 1000);
        } else {
        }
      } catch (error) {
        console.error("Lỗi khi cập nhật phiếu xuất kho:", error);
      } finally {
        setLoading(false);
      }
    },
    [dataSource, phieuData, isEditMode, navigate, setLoading]
  );

  const handleSubmit = useCallback(async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();

      if (!validateDataSource(dataSource)) {
        setLoading(false);
        return;
      }

      // Kiểm tra số lượng lệch nhau trước khi submit
      const currentStatus = values.trangThai || "0";

      validateQuantityForPhieu(
        dataSource,
        "phieu_xuat_kho_ban_hang",
        currentStatus,
        async () => {
          // Callback khi user xác nhận tiếp tục
          try {
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
            console.error("Submit failed:", error);
            setLoading(false);
          }
        },
        () => {
          // Callback khi user hủy
          setLoading(false);
        }
      );
    } catch (error) {
      console.error("Lỗi khi cập nhật phiếu xuất kho:", error);
      setLoading(false);
    }
  }, [form, dataSource, submitPhieuData, setLoading]);

  const handleEdit = useCallback(() => {
    navigate(`/kho/xuat-kho-ban-hang/edit/${stt_rec}`);
    setIsEditMode(true);
  }, [navigate, stt_rec]);

  const handleNew = useCallback(() => {
    navigate("/kho/xuat-kho-ban-hang/add");
  }, [navigate]);

  const handleDelete = useCallback(() => {
    showConfirm({
      title: "Xác nhận xóa phiếu",
      content: "Bạn có chắc chắn muốn xóa phiếu này không?",
      type: "warning",
      onOk: async () => {
        setLoading(true);
        const result = await deletePhieuDynamic(stt_rec);
        setLoading(false);

        if (result.success) {
          navigate("/kho/xuat-kho-ban-hang");
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
          onClick={() => navigate("/kho/xuat-kho-ban-hang")}
          className="phieu-back-button"
        />
        
        <div className="phieu-header-info">
          <div className="phieu-header-tags">
            <span className={`phieu-header-badge ${!stt_rec ? 'phieu-header-badge--green' : isEditMode ? 'phieu-header-badge--orange' : 'phieu-header-badge--blue'}`}>
              {stt_rec ? (isEditMode ? "SỬA PHIẾU XUẤT" : "CHI TIẾT PHIẾU XUẤT") : "THÊM PHIẾU XUẤT MỚI"}
            </span>
          </div>

          <div className="phieu-header-meta-stack">
            <div className="phieu-header-meta-item">
              ĐƠN HÀNG: <span className="phieu-header-meta-value">
                {form.getFieldValue('soPhieu') || '.........'} 
                {form.getFieldValue('bcontract_id') && (
                  <span className="phieu-header-meta-sequence">
                    ({form.getFieldValue('bcontract_id')})
                  </span>
                )}
              </span>
            </div>
            <div className="phieu-header-meta-item">
              NGÀY: <span className="phieu-header-meta-value">{form.getFieldValue('ngay') ? dayjs(form.getFieldValue('ngay')).format('DD/MM/YYYY') : '.........'}</span>
            </div>
            <div className="phieu-header-status-row">
              <span className="phieu-header-status-label">TRẠNG THÁI:</span>
              <Form.Item name="trangThai" noStyle>
                <Select 
                  size="small"
                  className="phieu-header-status-select"
                  dropdownMatchSelectWidth={false}
                >
                  <Select.Option value="0">0. Lập chứng từ</Select.Option>
                  <Select.Option value="1">1. Chờ duyệt</Select.Option>
                  <Select.Option value="2">2. Duyệt</Select.Option>
                </Select>
              </Form.Item>
            </div>
          </div>
        </div>

        <div className="phieu-header-right">
          {!isEditMode && stt_rec ? (
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
      </div>

      <div className="phieu-form-container">
        <Form
          form={form}
          layout="vertical"
          className="phieu-form phieu-form--floating"
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
            fetchDonViTinh={fetchDonViTinh}
            onDataSourceUpdate={setDataSource}
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
