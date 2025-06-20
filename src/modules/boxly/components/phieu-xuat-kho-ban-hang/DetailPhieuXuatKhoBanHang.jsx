import { EditOutlined, LeftOutlined } from "@ant-design/icons";
import { Button, Form, Modal, Space, Typography } from "antd";
import moment from "moment/moment";
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import https from "../../../../utils/https";
import PhieuFormInputs from "./components/PhieuFormInputs";
import VatTuInputSection from "./components/VatTuInputSection";
import VatTuTable from "./components/VatTuTable";
import { usePhieuXuatKhoData } from "./hooks/usePhieuXuatKhoData";
import { useVatTuManager } from "./hooks/useVatTuManager";
import "./phieu-xuat-kho-ban-hang.css";
import {
  buildPayload,
  deletePhieu,
  submitPhieu,
  validateDataSource,
} from "./utils/phieuXuatKhoUtils";

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

  // Effects
  useEffect(() => {
    if (barcodeJustEnabled && vatTuSelectRef.current) {
      vatTuSelectRef.current.focus();
      setBarcodeJustEnabled(false);
    }
  }, [barcodeJustEnabled]);

  useEffect(() => {
    const isEditPath = location.pathname.includes("/edit/");
    setIsEditMode(isEditPath);

    // Tải danh sách
    fetchMaGiaoDichList();
    fetchMaKhachList();
    fetchVatTuList();

    if (!phieuData || phieuData.stt_rec !== stt_rec) {
      fetchPhieuDetail();
    }
  }, [stt_rec, location.pathname]);

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Functions
  const fetchPhieuDetail = async () => {
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

      if (
        data &&
        data.data &&
        data.data.length > 0 &&
        data.data2 &&
        data.data2.length > 0
      ) {
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
          const mappedItems = await Promise.all(
            phieuDetails.map(async (item, index) => {
              const donViTinhList = await fetchDonViTinh(item.ma_vt);
              return {
                key: index + 1,
                maHang: item.ma_vt,
                so_luong: item.so_luong || 0,
                sl_td3: item.sl_td3 || item.so_luong || 0,
                sl_td3_goc: item.sl_td3 || item.so_luong || 0,
                he_so: item.he_so || 1,
                ten_mat_hang: item.ten_vt || item.ma_vt,
                dvt: item.dvt,
                dvt_goc: item.dvt,
                tk_vt: item.tk_vt || "",
                ma_kho: item.ma_kho || "",
                tk_co: item.tk_co || "",
                donViTinhList: donViTinhList,
              };
            })
          );
          setDataSource(mappedItems);
        }
      }
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu phiếu:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleVatTuSelect = async (value) => {
    if (!isEditMode) return;

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
  };

  const handleEdit = () => {
    navigate(`/boxly/phieu-xuat-kho-ban-hang/edit/${stt_rec}`);
    setIsEditMode(true);
  };

  const handleNew = () => {
    navigate("/boxly/phieu-xuat-kho-ban-hang/add");
  };

  const handleDelete = () => {
    Modal.confirm({
      title: "Xác nhận xóa phiếu",
      content: "Bạn có chắc chắn muốn xóa phiếu này không?",
      okText: "Xóa",
      okType: "danger",
      cancelText: "Hủy",
      onOk: async () => {
        setLoading(true);
        const result = await deletePhieu(stt_rec);
        setLoading(false);

        if (result.success) {
          navigate("/boxly/phieu-xuat-kho-ban-hang");
        }
      },
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
        <Title level={3} className="phieu-title">
          {isEditMode
            ? "CHỈNH SỬA PHIẾU XUẤT KHO BÁN HÀNG"
            : "CHI TIẾT PHIẾU XUẤT KHO BÁN HÀNG"}
        </Title>
        {!isEditMode && (
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={handleEdit}
            className="phieu-edit-button"
          >
            Chỉnh sửa
          </Button>
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
            maKhachList={maKhachList}
            loadingMaKhach={loadingMaKhach}
            fetchMaKhachListDebounced={fetchMaKhachListDebounced}
            maGiaoDichList={maGiaoDichList}
          />

          <VatTuInputSection
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
            fetchVatTuList={fetchVatTuList}
            handleVatTuSelect={handleVatTuSelect}
          />

          <VatTuTable
            dataSource={dataSource}
            isEditMode={isEditMode}
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
              <Button danger onClick={handleDelete}>
                Xóa
              </Button>
              <Button onClick={handleNew}>Mới</Button>
            </Space>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default DetailPhieuXuatKhoBanHang;
