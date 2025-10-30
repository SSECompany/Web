import { DownOutlined, LeftOutlined, UpOutlined } from "@ant-design/icons";
import { Button, Form, Space, Typography, message } from "antd";
import dayjs from "dayjs";
import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
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
    fetchMaKhoListDebounced,
    fetchMaKhachListDebounced,
    fetchMaGiaoDichList,
    fetchMaKhoList,
    fetchMaKhachList,
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

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();

      // Validate data source
      const validation = validateDataSource(dataSource, "nhat-hang");
      if (!validation.isValid) {
        return;
      }

      // Kiểm tra số lượng lệch nhau trước khi submit
      const currentStatus = values.trangThai || "0";

      validateQuantityForPhieu(
        dataSource,
        "phieu_nhat_hang",
        currentStatus,
        async () => {
          // Callback khi user xác nhận tiếp tục
          try {
            // Build payload
            const payload = buildPhieuNhatHangPayload(
              values,
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
              "Thêm phiếu nhặt hàng thành công",
              false,
              userInfo
            );

            if (result.success) {
              navigate("/kho/nhat-hang");
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
              isEditMode={isEditMode}
              maKhachList={maKhachList}
              loadingMaKhach={loadingMaKhach}
              fetchMaKhachListDebounced={fetchMaKhachListDebounced}
              maGiaoDichList={maGiaoDichList}
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
            maKhoList={maKhoList}
            loadingMaKho={loadingMaKho}
            fetchMaKhoListDebounced={fetchMaKhoListDebounced}
            fetchMaKhoList={fetchMaKhoList}
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
