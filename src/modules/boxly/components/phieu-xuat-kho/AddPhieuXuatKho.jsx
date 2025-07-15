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
import "./phieu-xuat-kho.css";
import { buildPayload, validateDataSource } from "./utils/phieuXuatKhoUtils";

const { Title } = Typography;

const AddPhieuXuatKho = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const [vatTuInput, setVatTuInput] = useState(undefined);
  const [barcodeEnabled, setBarcodeEnabled] = useState(false);
  const [barcodeJustEnabled, setBarcodeJustEnabled] = useState(false);

  const vatTuSelectRef = useRef();
  const searchTimeoutRef = useRef();

  const {
    loading,
    setLoading,
    maGiaoDichList,
    maKhachList,
    loadingMaKhach,
    vatTuList,
    loadingVatTu,
    maKhoList,
    loadingMaKho,
    fetchMaKhachListDebounced,
    fetchMaKhoListDebounced,
    fetchMaGiaoDichList,
    fetchMaKhachList,
    fetchMaKhoList,
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
    handleSelectChange,
    handleDeleteItem,
    handleDvtChange,
  } = useVatTuManager();

  const token = localStorage.getItem("access_token");

  useEffect(() => {
    fetchMaGiaoDichList();
    fetchMaKhachList();
    fetchMaKhoList();
    fetchVatTuList();
    fetchVoucherInfo();

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

  const fetchVoucherInfo = async () => {
    try {
      const response = await https.get(
        "v1/web/thong-tin-phieu-nhap",
        { voucherCode: "PXA" },
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

        form.setFieldsValue({
          so_ct: voucherData.so_phieu_nhap,
          ngay_ct: voucherData.ngay_lap ? dayjs(voucherData.ngay_lap) : dayjs(),
          ma_gd: "2",
          ma_kh: voucherData.ma_khach || "",
          dien_giai: voucherData.dien_giai || "",
          status: "3",
        });
      }
    } catch (error) {
      console.error("Error fetching voucher info:", error);
    }
  };

  const handleVatTuSelect = async (value) => {
    await vatTuSelectHandler(
      value,
      true,
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

      if (!payload) {
        setLoading(false);
        return;
      }

      // Gọi dynamicApi thêm mới phiếu xuất kho
      const response = await https.post(
        "v1/dynamicApi/call-dynamic-api",
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (
        response.data &&
        (response.data.statusCode === 200 ||
          response.data.responseModel?.isSucceded)
      ) {
        navigate("/boxly/phieu-xuat-kho");
      }
    } catch (error) {
      console.error("Lỗi khi tạo phiếu xuất kho:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="phieu-xuat-container">
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
          onClick={() => navigate("/boxly/phieu-xuat-kho")}
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
          THÊM PHIẾU XUẤT KHO
        </Title>
        <div style={{ width: 120 }}></div>
      </div>

      <div className="phieu-xuat-form-container">
        <Form form={form} layout="vertical" className="phieu-xuat-form">
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
              <Button onClick={() => navigate("/boxly/phieu-xuat-kho")}>Hủy</Button>
            </Space>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default AddPhieuXuatKho;
