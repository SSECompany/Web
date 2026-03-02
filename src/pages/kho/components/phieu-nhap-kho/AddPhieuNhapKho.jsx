import { LeftOutlined } from "@ant-design/icons";
import { Button, Form, message, Space, Typography } from "antd";
import dayjs from "dayjs";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import VatTuSelectFull from "../../../../components/common/ProductSelectFull/VatTuSelectFull";
import "../common-phieu.css";
import { validateQuantityForPhieu } from "../common/QuantityValidationUtils";
import PhieuNhapKhoFormInputs from "./components/PhieuNhapKhoFormInputs";
import VatTuNhapKhoTable from "./components/VatTuNhapKhoTable";
import { usePhieuNhapKhoData } from "./hooks/usePhieuNhapKhoData";
import { useVatTuManagerNhapKho } from "./hooks/useVatTuManagerNhapKho";
import {
  buildPhieuNhapKhoPayload,
  fetchVoucherInfo,
  submitPhieuNhapKhoDynamic,
  validateDataSource,
} from "./utils/phieuNhapKhoUtils";

const { Title } = Typography;

const AddPhieuNhapKho = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [isEditMode] = useState(true);
  const [vatTuInput, setVatTuInput] = useState(undefined);
  const [barcodeEnabled, setBarcodeEnabled] = useState(false);
  const [barcodeJustEnabled, setBarcodeJustEnabled] = useState(false);
  const [pageIndex, setPageIndex] = useState(1);
  const [totalPage, setTotalPage] = useState(1);
  const [currentKeyword, setCurrentKeyword] = useState("");
  const [isInitialized, setIsInitialized] = useState(false);

  const vatTuSelectRef = useRef();
  const searchTimeoutRef = useRef();

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
    handleVatTuSelect: vatTuSelectHandler,
    handleQuantityChange,
    handleSelectChange,
    handleDeleteItem,
    handleDvtChange,
  } = useVatTuManagerNhapKho();

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

  useEffect(() => {
    if (isInitialized) return;

    const initializeData = async () => {
      setIsInitialized(true);

      await Promise.all([
        fetchMaGiaoDichList(),
        fetchMaKhoList(),
        fetchMaKhachList(),
        fetchVatTuList(),
      ]);

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
  }, [
    fetchMaGiaoDichList,
    fetchMaKhoList,
    fetchMaKhachList,
    fetchVatTuList,
    form,
    isInitialized,
  ]);

  useEffect(() => {
    if (barcodeJustEnabled && vatTuSelectRef.current) {
      vatTuSelectRef.current.focus();
      setBarcodeJustEnabled(false);
    }
  }, [barcodeJustEnabled]);

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

      const validation = validateDataSource(dataSource);
      if (!validation.isValid) {
        setLoading(false);
        return;
      }

      const currentStatus = values.trangThai || "0";

      validateQuantityForPhieu(
        dataSource,
        "phieu_nhap_kho",
        currentStatus,
        async () => {
          try {
            const payload = buildPhieuNhapKhoPayload(values, dataSource);

            if (!payload) {
              message.error("Không thể tạo payload");
              setLoading(false);
              return;
            }

            const result = await submitPhieuNhapKhoDynamic(
              payload,
              "Thêm phiếu nhập kho thành công",
              false
            );

            if (result.success) {
              navigate("/kho/nhap-kho");
            }
          } catch (error) {
            console.error("Submit failed:", error);
          } finally {
            setLoading(false);
          }
        },
        () => {
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
          onClick={() => navigate("/kho/nhap-kho")}
          className="phieu-back-button"
        >
          Trở về
        </Button>
        <Title level={5} className="phieu-title">
          THÊM PHIẾU NHẬP KHO MỚI
        </Title>
        <div style={{ width: "120px" }}></div>
      </div>

      <div className="phieu-form-container">
        <Form form={form} layout="vertical" className="phieu-form">
          <PhieuNhapKhoFormInputs
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
            fetchMaKhoList={fetchMaKhoList}
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
              <Button onClick={() => navigate("/kho/nhap-kho")}>Hủy</Button>
            </Space>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default AddPhieuNhapKho;

