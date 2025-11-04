import { DownOutlined, LeftOutlined, UpOutlined } from "@ant-design/icons";
import { Button, Form, Space, Typography, message } from "antd";
import dayjs from "dayjs";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { getLoItem, getViTriByKho } from "../../../../api";
import VatTuSelectFull from "../../../../components/common/ProductSelectFull/VatTuSelectFull";
import "../common-phieu.css";
import { validateQuantityForPhieu } from "../common/QuantityValidationUtils";
import PhieuNhatHangFormInputs from "./components/PhieuNhatHangFormInputs";
import VatTuNhatHangTable from "./components/VatTuNhatHangTable";
import { usePhieuNhatHangData } from "./hooks/usePhieuNhatHangData";
import { useVatTuManagerNhatHang } from "./hooks/useVatTuManagerNhatHang";
import {
  buildPhieuNhatHangPayload,
  fetchVoucherInfo,
  submitPhieuNhatHangDynamic,
  validateDataSource,
  validateTongNhat,
} from "./utils/phieuNhatHangUtils";

const { Title } = Typography;

const AddPhieuNhatHang = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();

  // Get user info from Redux
  const userInfo = useSelector((state) => state?.claimsReducer?.userInfo || {});
  const [isEditMode, setIsEditMode] = useState(true);
  const [vatTuInput, setVatTuInput] = useState(undefined);
  const [barcodeEnabled, setBarcodeEnabled] = useState(false);
  const [barcodeJustEnabled, setBarcodeJustEnabled] = useState(false);
  const [pageIndex, setPageIndex] = useState(1);
  const [totalPage, setTotalPage] = useState(1);
  const [currentKeyword, setCurrentKeyword] = useState("");
  const [isInitialized, setIsInitialized] = useState(false);
  const [showFormFields, setShowFormFields] = useState(true);

  const vatTuSelectRef = useRef();
  const searchTimeoutRef = useRef();

  // Custom hooks
  const {
    loading,
    setLoading,
    maGiaoDichList,
    maKhoList,
    loadingMaKho,
    maKhachList,
    loadingMaKhach,
    vatTuList,
    loadingVatTu,
    fcode3List,
    loadingFcode3,
    fetchMaKhoListDebounced,
    fetchMaKhachListDebounced,
    fetchFcode3ListDebounced,
    fetchMaGiaoDichList,
    fetchMaKhoList,
    fetchMaKhachList,
    fetchFcode3List,
    fetchVatTuList,
    fetchVatTuDetail,
    fetchDonViTinh,
    setVatTuList,
  } = usePhieuNhatHangData();

  const {
    dataSource,
    setDataSource,
    handleVatTuSelect: vatTuSelectHandler,
    handleQuantityChange,
    handleSelectChange,
    handleDeleteItem,
    handleAddItem,
    handleDvtChange,
  } = useVatTuManagerNhatHang();

  // Phân trang vật tư
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

  // Initialize data
  useEffect(() => {
    if (isInitialized) return;

    const initializeData = async () => {
      setIsInitialized(true);

      // Load master data
      await Promise.all([
        fetchMaGiaoDichList(),
        fetchMaKhoList(),
        fetchMaKhachList(),
        fetchFcode3List(),
        fetchVatTuListPaging("", 1, false),
      ]);

      // Load voucher info
      const voucherData = await fetchVoucherInfo();
      if (voucherData) {
        const formData = {
          soPhieu: voucherData.so_phieu_nhat_hang,
          ngay: voucherData.ngay_lap ? dayjs(voucherData.ngay_lap) : dayjs(),
          maGiaoDich: voucherData.ma_giao_dich,
          maCt: voucherData.ma_ct,
          donViTienTe: voucherData.base_currency,
          tyGia: 1,
          trangThai: "3",
          maKhach: voucherData.ma_khach || "",
          dienGiai: voucherData.dien_giai || "",
        };
        form.setFieldsValue(formData);
        message.success("Đã tải thông tin phiếu nhập thành công");
      }
    };

    initializeData();
  }, [
    fetchMaGiaoDichList,
    fetchMaKhoList,
    fetchMaKhachList,
    fetchFcode3List,
    fetchVatTuList,
    isInitialized,
    form,
  ]);

  // Handle barcode focus
  useEffect(() => {
    if (barcodeJustEnabled && vatTuSelectRef.current) {
      vatTuSelectRef.current.focus();
      setBarcodeJustEnabled(false);
    }
  }, [barcodeJustEnabled]);

  // Cleanup
  useEffect(() => {
    const timeoutRef = searchTimeoutRef.current;
    return () => {
      if (timeoutRef) {
        clearTimeout(timeoutRef);
      }
    };
  }, []);

  const handleVatTuSelect = async (value) => {
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
  };

  // === API: fetch lists for Mã lô / Vị trí ===

  const fetchLoList = useCallback(
    async (keyword = "", record = {}, page = 1) => {
      try {
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
        const options = data.map((x) => {
          const value = (x?.ma_lo || x?.value || x?.ten_lo || "").toString();
          const label = x?.ma_lo || x?.ten_lo || x?.label || value;
          return { value, label };
        });
        return options;
      } catch (e) {
        console.error("fetchLoList error", e);
        return [];
      }
    },
    []
  );

  const fetchViTriList = useCallback(
    async (keyword = "", record = {}, page = 1) => {
      try {
        const response = await getViTriByKho({
          ma_kho: (record?.ma_kho || "ST").toString(),
          ten_vi_tri: keyword,
          pageIndex: page,
          pageSize: 10,
        });

        const data = response?.listObject?.[0] || [];
        const options = data.map((x) => {
          const value = (
            x?.ma_vi_tri ||
            x?.value ||
            x?.ten_vi_tri ||
            ""
          ).toString();
          const label = x?.ma_vi_tri || x?.ten_vi_tri || x?.label || value;
          return { value, label };
        });
        return options;
      } catch (e) {
        console.error("fetchViTriList error", e);
        return [];
      }
    },
    []
  );

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();

      // Validate data source
      const validation = validateDataSource(dataSource, "nhat-hang");
      if (!validation.isValid) {
        setLoading(false);
        return;
      }

      // Validate tổng nhặt không được vượt quá số lượng đơn
      const tongNhatValidation = validateTongNhat(dataSource);
      if (!tongNhatValidation.isValid) {
        setLoading(false);
        return;
      }

      // Set status = 1 cho nút Lưu
      const updatedValues = {
        ...values,
        trangThai: "1",
      };

      // Kiểm tra số lượng lệch nhau trước khi submit
      const currentStatus = updatedValues.trangThai || "1";

      validateQuantityForPhieu(
        dataSource,
        "phieu_nhat_hang",
        currentStatus,
        async () => {
          // Callback khi user xác nhận tiếp tục
          try {
            // Build payload với status = 1
            const payload = buildPhieuNhatHangPayload(
              updatedValues,
              dataSource,
              null,
              false,
              userInfo
            );

            if (!payload) {
              message.error("Không thể tạo payload");
              setLoading(false);
              return;
            }

            // Submit
            const result = await submitPhieuNhatHangDynamic(
              payload,
              "Lưu thành công",
              false,
              userInfo
            );

            if (result.success) {
              // Giữ nguyên màn hình chỉnh sửa, không navigate về trang chủ
            }
          } catch (error) {
            console.error("Submit failed:", error);
          } finally {
            setLoading(false);
          }
        },
        () => {
          // Callback khi user hủy
          setLoading(false);
        }
      );
    } catch (error) {
      console.error("Validation failed:", error);
      setLoading(false);
    }
  };

  return (
    <div className="phieu-container">
      <div className="phieu-header">
        <Button
          type="text"
          icon={<LeftOutlined />}
          onClick={() => navigate("/kho/nhat-hang")}
          className="phieu-back-button"
        >
          Trở về
        </Button>
        <Title level={5} className="phieu-title">
          THÊM MỚI PHIẾU NHẶT HÀNG
        </Title>
        <div style={{ width: "120px" }}></div>
      </div>

      {/* Small toggle button at top left */}
      <div style={{ marginBottom: 8 }}>
        <Button
          size="small"
          type="text"
          icon={showFormFields ? <UpOutlined /> : <DownOutlined />}
          onClick={() => setShowFormFields(!showFormFields)}
          style={{
            color: "#1890ff",
            fontWeight: "bold",
            fontSize: "12px",
            padding: "4px 8px",
            height: "auto",
          }}
        >
          {showFormFields ? "Ẩn thông tin đơn" : "Hiện thông tin đơn"}
        </Button>
      </div>

      {/* Div 1: Thông tin đơn (Mã khách => Ghi chú) */}
      {showFormFields && (
        <div className="phieu-form-container" style={{ marginBottom: 16 }}>
          <Form form={form} layout="vertical" className="phieu-form">
            <PhieuNhatHangFormInputs
              isEditMode={false}
              maKhachList={maKhachList}
              loadingMaKhach={loadingMaKhach}
              fetchMaKhachListDebounced={fetchMaKhachListDebounced}
              maGiaoDichList={maGiaoDichList}
              fetchMaKhachList={fetchMaKhachList}
              fetchMaGiaoDichList={fetchMaGiaoDichList}
              fcode3List={fcode3List}
              loadingFcode3={loadingFcode3}
              fetchFcode3ListDebounced={fetchFcode3ListDebounced}
              fetchFcode3List={fetchFcode3List}
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
          </Form>
        </div>
      )}

      {/* Div 2: Vật tư và bảng */}
      <div className="phieu-form-container">
        <Form form={form} layout="vertical" className="phieu-form">
          {/* Title Vật tư */}
          <div style={{ marginBottom: 8 }}>
            <span
              style={{ fontSize: "14px", fontWeight: "normal", color: "#000" }}
            >
              Vật tư
            </span>
          </div>

          {/* Vật tư section */}
          <div>
            <VatTuSelectFull
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
              fetchVatTuList={fetchVatTuListPaging}
              totalPage={totalPage}
              pageIndex={pageIndex}
              setPageIndex={setPageIndex}
              setVatTuList={setVatTuList}
              currentKeyword={currentKeyword}
              handleVatTuSelect={handleVatTuSelect}
            />
          </div>

          {/* Bảng vật tư */}
          <VatTuNhatHangTable
            dataSource={dataSource}
            isEditMode={isEditMode}
            handleQuantityChange={handleQuantityChange}
            handleSelectChange={handleSelectChange}
            handleDeleteItem={handleDeleteItem}
            handleAddItem={handleAddItem}
            handleDvtChange={handleDvtChange}
            onDataSourceUpdate={setDataSource}
            maKhoList={maKhoList}
            loadingMaKho={loadingMaKho}
            fetchMaKhoListDebounced={fetchMaKhoListDebounced}
            fetchMaKhoList={fetchMaKhoList}
            fetchLoList={fetchLoList}
            fetchViTriList={fetchViTriList}
          />

          {/* Action buttons */}
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
              <Button onClick={() => navigate("/kho/nhat-hang")}>Hủy</Button>
            </Space>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default AddPhieuNhatHang;
