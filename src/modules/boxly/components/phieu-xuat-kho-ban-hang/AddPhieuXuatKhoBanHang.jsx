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
import "./phieu-xuat-kho-ban-hang.css";
import {
  buildPayload,
  submitPhieu,
  validateDataSource,
} from "./utils/phieuXuatKhoUtils";

const { Title } = Typography;

const AddPhieuXuatKhoBanHang = () => {
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
    try {
      const vatTuDetail = await fetchVatTuDetail(value.trim());
      if (!vatTuDetail) return;

      const vatTuInfo = Array.isArray(vatTuDetail)
        ? vatTuDetail[0]
        : vatTuDetail;
      const donViTinhList = await fetchDonViTinh(value.trim());
      const defaultDvt = vatTuInfo.dvt ? vatTuInfo.dvt.trim() : "cái";

      setDataSource((prev) => {
        const existing = prev.find((item) => item.maHang === value);
        if (existing) {
          return prev.map((item) => {
            if (item.maHang === value) {
              // Luôn cộng 1 vào số lượng gốc
              const sl_td3_goc_moi = (item.sl_td3_goc || 1) + 1;
              // Tính lại số lượng hiển thị dựa trên hệ số hiện tại
              const sl_td3_moi = sl_td3_goc_moi * (item.he_so || 1);
              const sl_td3_lam_tron = Math.round(sl_td3_moi * 1000) / 1000;

              return {
                ...item,
                sl_td3: sl_td3_lam_tron,
                sl_td3_goc: sl_td3_goc_moi,
              };
            }
            return item;
          });
        } else {
          const newItem = {
            key: prev.length + 1,
            maHang: value,
            so_luong: 0,
            sl_td3: 1,
            sl_td3_goc: 1,
            he_so: 1,
            ten_mat_hang: vatTuInfo.ten_vt || value,
            dvt: defaultDvt,
            dvt_goc: defaultDvt,
            tk_vt: vatTuInfo.tk_vt ? vatTuInfo.tk_vt.trim() : "",
            ma_kho: vatTuInfo.ma_kho ? vatTuInfo.ma_kho.trim() : "",
            donViTinhList: donViTinhList,
          };
          return [...prev, newItem];
        }
      });

      // Clear input và reset danh sách ngay lập tức
      setVatTuInput(undefined);
      setVatTuList([]);

      // Load lại toàn bộ danh sách vật tư ngay lập tức
      fetchVatTuList("");
    } catch (error) {
      console.error("Error adding vat tu:", error);
    }
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
        "v1/web/tao-phieu-xuat-kho-ban-hang",
        payload,
        "Tạo phiếu xuất kho bán hàng thành công"
      );

      if (result.success) {
        navigate("/boxly/phieu-xuat-kho-ban-hang");
      }
    } catch (error) {
      console.error("Lỗi khi tạo phiếu xuất kho:", error);
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
          onClick={() => navigate("/boxly/phieu-xuat-kho-ban-hang")}
          className="phieu-back-button"
        >
          Trở về
        </Button>
        <Title level={3} className="phieu-title">
          THÊM PHIẾU XUẤT KHO BÁN HÀNG
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
              <Button
                onClick={() => navigate("/boxly/phieu-xuat-kho-ban-hang")}
              >
                Hủy
              </Button>
            </Space>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default AddPhieuXuatKhoBanHang;
