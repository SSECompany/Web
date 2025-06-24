import { LeftOutlined } from "@ant-design/icons";
import { Button, Form, Space, Typography } from "antd";
import dayjs from "dayjs";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import https from "../../../../utils/https";
import PhieuFormInputs from "./components/PhieuFormInputs";
import VatTuInputSection from "./components/VatTuInputSection";
import VatTuTable from "./components/VatTuTable";
import { usePhieuXuatKhoData } from "./hooks/usePhieuXuatKhoData";
import { useVatTuManager } from "./hooks/useVatTuManager";
import "./phieu-xuat-dieu-chuyen.css";
import {
  buildPayload,
  submitPhieu,
  validateDataSource,
} from "./utils/phieuXuatKhoUtils";

const { Title } = Typography;

const AddPhieuXuatDieuChuyen = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();

  // State
  const [vatTuInput, setVatTuInput] = useState(undefined);
  const [barcodeEnabled, setBarcodeEnabled] = useState(false);
  const [barcodeJustEnabled, setBarcodeJustEnabled] = useState(false);

  // Refs
  const vatTuSelectRef = useRef();
  const searchTimeoutRef = useRef();

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

  const token = localStorage.getItem("access_token");

  // Effects
  useEffect(() => {
    // Tải danh sách mã giao dịch và mã khách
    fetchMaGiaoDichList();
    fetchMaKhachList();
    fetchVatTuList();
    fetchVoucherInfo();

    // Thiết lập giá trị mặc định cho ngày
    form.setFieldsValue({
      ngay: dayjs(),
      trangThai: "0",
    });
  }, []);

  useEffect(() => {
    if (barcodeJustEnabled && vatTuSelectRef.current) {
      vatTuSelectRef.current.focus();
      setBarcodeJustEnabled(false);
    }
  }, [barcodeJustEnabled]);

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Functions
  const fetchVoucherInfo = async () => {
    try {
      const response = await https.get(
        "v1/web/thong-tin-phieu-nhap",
        { voucherCode: "HDA" },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (
        response.data &&
        response.data.data &&
        response.data.data.length > 0
      ) {
        const voucherData = response.data.data[0];
        console.log("Voucher data:", voucherData);

        form.setFieldsValue({
          soPhieu: voucherData.so_phieu_nhap,
          ngay: voucherData.ngay_lap ? dayjs(voucherData.ngay_lap) : dayjs(),
          maGiaoDich: voucherData.ma_giao_dich || "1",
          maKhach: voucherData.ma_khach || "",
          dienGiai: voucherData.dien_giai || "",
          trangThai: voucherData.status || "0",
        });
      }
    } catch (error) {
      console.error("Error fetching voucher info:", error);
    }
  };

  const handleVatTuSelect = async (value) => {
    await vatTuSelectHandler(
      value,
      true, // isEditMode
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

      if (!validateDataSource(dataSource)) return;

      // Kiểm tra số lượng xuất phải lớn hơn 0
      const invalidItems = [];
      dataSource.forEach((item, index) => {
        const sl_td3 = parseFloat(item.sl_td3 || 0);
        if (sl_td3 <= 0) {
          invalidItems.push(`Dòng ${index + 1}: Số lượng xuất phải lớn hơn 0`);
        }
      });

      if (invalidItems.length > 0) {
        return;
      }

      const payload = buildPayload(values, dataSource, null, false);
      const result = await submitPhieu(
        "v1/web/tao-phieu-xuat-dieu-chuyen",
        payload,
        "Tạo phiếu xuất điều chuyển thành công"
      );

      if (result.success) {
        navigate("/boxly/phieu-xuat-dieu-chuyen");
      }
    } catch (error) {
      console.error("Lỗi khi tạo phiếu xuất điều chuyển:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="phieu-container">
      <div className="phieu-header">
        <Button
          type="text"
          icon={<LeftOutlined />}
          onClick={() => navigate(-1)}
          className="phieu-back-button"
        >
          Trở về
        </Button>
        <Title level={3} className="phieu-title">
          THÊM PHIẾU XUẤT ĐIỀU CHUYỂN
        </Title>
      </div>

      <div className="phieu-form-container">
        <Form form={form} layout="vertical" className="phieu-form">
          <PhieuFormInputs
            isEditMode={true}
            maKhachList={maKhachList}
            loadingMaKhach={loadingMaKhach}
            fetchMaKhachListDebounced={fetchMaKhachListDebounced}
            maGiaoDichList={maGiaoDichList}
          />

          <VatTuInputSection
            isEditMode={true}
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
            isEditMode={true}
            handleQuantityChange={handleQuantityChange}
            handleDeleteItem={handleDeleteItem}
            handleDvtChange={handleDvtChange}
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

export default AddPhieuXuatDieuChuyen;
