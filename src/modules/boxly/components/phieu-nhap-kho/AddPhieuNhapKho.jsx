import { LeftOutlined } from "@ant-design/icons";
import { Button, Form, message, Space, Typography } from "antd";
import dayjs from "dayjs";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import PhieuNhapKhoFormInputs from "./components/PhieuNhapKhoFormInputs";
import VatTuNhapKhoTable from "./components/VatTuNhapKhoTable";
import { usePhieuNhapKhoData } from "./hooks/usePhieuNhapKhoData";
import { useVatTuManagerNhapKho } from "./hooks/useVatTuManagerNhapKho";
import "./phieu-nhap-kho.css";
import {
  buildPhieuNhapKhoPayload,
  fetchVoucherInfo,
  submitPhieuNhapKho,
  validateDataSource,
} from "./utils/phieuNhapKhoUtils";

const { Title } = Typography;

const AddPhieuNhapKho = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [isEditMode, setIsEditMode] = useState(true);
  const [vatTuInput, setVatTuInput] = useState(undefined);
  const [barcodeEnabled, setBarcodeEnabled] = useState(false);
  const [barcodeJustEnabled, setBarcodeJustEnabled] = useState(false);

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
  } = usePhieuNhapKhoData();

  const {
    dataSource,
    setDataSource,
    handleVatTuSelect: vatTuSelectHandler,
    handleQuantityChange,
    handleSelectChange,
    handleDeleteItem,
    handleDvtChange,
  } = useVatTuManagerNhapKho();

  // Initialize data
  useEffect(() => {
    const initializeData = async () => {
      // Load master data
      await Promise.all([
        fetchMaGiaoDichList(),
        fetchMaKhoList(),
        fetchMaKhachList(),
        fetchVatTuList(),
      ]);

      // Load voucher info
      const voucherData = await fetchVoucherInfo();
      if (voucherData) {
        const formData = {
          soPhieu: voucherData.so_phieu_nhap,
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
  }, []);

  // Handle barcode focus
  useEffect(() => {
    if (barcodeJustEnabled && vatTuSelectRef.current) {
      vatTuSelectRef.current.focus();
      setBarcodeJustEnabled(false);
    }
  }, [barcodeJustEnabled]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
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
      fetchVatTuList
    );
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();

      // Validate data source
      const validation = validateDataSource(dataSource);
      if (!validation.isValid) {
        return;
      }

      // Build payload
      const payload = buildPhieuNhapKhoPayload(values, dataSource);

      // Submit
      const result = await submitPhieuNhapKho(
        "v1/web/create-stock-voucher",
        payload,
        "Thêm phiếu nhập kho thành công"
      );

      if (result.success) {
        navigate("/boxly/phieu-nhap-kho");
      }
    } catch (error) {
      console.error("Validation failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="phieu-nhap-container">
      <div className="phieu-nhap-header">
        <Button
          type="text"
          icon={<LeftOutlined />}
          onClick={() => navigate(-1)}
          className="phieu-nhap-back-button"
        >
          Trở về
        </Button>
        <Title level={5} className="phieu-nhap-title">
          THÊM PHIẾU NHẬP KHO MỚI
        </Title>
        <div style={{ width: "120px" }}></div>
      </div>

      <div className="phieu-nhap-form-container">
        <Form form={form} layout="vertical" className="phieu-nhap-form">
          <PhieuNhapKhoFormInputs
            isEditMode={isEditMode}
            maKhachList={maKhachList}
            loadingMaKhach={loadingMaKhach}
            fetchMaKhachListDebounced={fetchMaKhachListDebounced}
            maGiaoDichList={maGiaoDichList}
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

          <VatTuNhapKhoTable
            dataSource={dataSource}
            isEditMode={isEditMode}
            handleQuantityChange={handleQuantityChange}
            handleSelectChange={handleSelectChange}
            handleDeleteItem={handleDeleteItem}
            handleDvtChange={handleDvtChange}
            maKhoList={maKhoList}
            loadingMaKho={loadingMaKho}
            fetchMaKhoListDebounced={fetchMaKhoListDebounced}
          />

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
              <Button onClick={() => navigate(-1)}>Hủy</Button>
            </Space>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default AddPhieuNhapKho;
