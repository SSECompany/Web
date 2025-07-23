import { LeftOutlined } from "@ant-design/icons";
import { Button, Form, Space, Typography } from "antd";
import dayjs from "dayjs";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import showConfirm from "../../../../components/common/Modal/ModalConfirm";
import https from "../../../../utils/https";
import "../common-phieu.css";
import PhieuFormInputs from "./components/PhieuFormInputs";
import VatTuInputSection from "./components/VatTuInputSection";
import VatTuTable from "./components/VatTuTable";
import { usePhieuXuatKhoData } from "./hooks/usePhieuXuatKhoData";
import { useVatTuManager } from "./hooks/useVatTuManager";
import {
  buildPayload,
  submitPhieu,
  validateDataSource,
  validateQuantityAndShowConfirm,
} from "./utils/phieuXuatKhoBanHangUtils";

const { Title } = Typography;

const AddPhieuXuatKhoBanHang = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();

  // State
  const [vatTuInput, setVatTuInput] = useState(undefined);
  const [barcodeEnabled, setBarcodeEnabled] = useState(false);
  const [barcodeJustEnabled, setBarcodeJustEnabled] = useState(false);
  const [pageIndex, setPageIndex] = useState(1);
  const [totalPage, setTotalPage] = useState(1);
  const [currentKeyword, setCurrentKeyword] = useState("");

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
      true,
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
      console.error("Lỗi khi tạo phiếu xuất kho:", error);
      setLoading(false);
    }
  };

  const submitPhieuData = async (values) => {
    try {
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
          THÊM PHIẾU XUẤT KHO BÁN HÀNG
        </Title>
        <div style={{ width: 120 }}></div>
      </div>
      <div className="phieu-form-container">
        <Form form={form} layout="vertical" className="phieu-form">
          <PhieuFormInputs
            isEditMode={true}
            maGiaoDichList={maGiaoDichList}
            maKhachList={maKhachList}
            loadingMaKhach={loadingMaKhach}
            fetchMaKhachListDebounced={fetchMaKhachListDebounced}
            fetchMaKhachList={fetchMaKhachList}
            fetchMaGiaoDichList={fetchMaGiaoDichList}
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
            fetchVatTuList={fetchVatTuListPaging}
            totalPage={totalPage}
            pageIndex={pageIndex}
            setPageIndex={setPageIndex}
            setVatTuList={setVatTuList}
            currentKeyword={currentKeyword}
            handleVatTuSelect={handleVatTuSelect}
          />
          <VatTuTable
            dataSource={dataSource}
            isEditMode={true}
            handleQuantityChange={handleQuantityChange}
            handleDeleteItem={handleDeleteItem}
            handleDvtChange={handleDvtChange}
            maKhachList={maKhachList}
            loadingMaKhach={loadingMaKhach}
            fetchMaKhachListDebounced={fetchMaKhachListDebounced}
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
