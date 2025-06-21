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
    handleVatTuSelect: vatTuSelectHandler,
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
              // Lấy danh sách đơn vị tính và thông tin vật tư từ API
              const donViTinhList = await fetchDonViTinh(item.ma_vt);
              const vatTuDetail = await fetchVatTuDetail(item.ma_vt.trim());

              // Lấy hệ số gốc từ API vật tư thay vì từ database
              const vatTuInfo = Array.isArray(vatTuDetail)
                ? vatTuDetail[0]
                : vatTuDetail;
              const heSoGocFromAPI = vatTuInfo
                ? parseFloat(vatTuInfo.he_so) || 1
                : 1;
              const dvtGocFromAPI = vatTuInfo
                ? vatTuInfo.dvt
                  ? vatTuInfo.dvt.trim()
                  : "cái"
                : "cái";

              // Sử dụng nullish coalescing để xử lý đúng giá trị 0
              const sl_td3_hienThi = item.sl_td3 ?? item.so_luong ?? 0;
              const so_luong_hienThi = item.so_luong ?? 0;
              const dvtHienTai = item.dvt || dvtGocFromAPI;

              let sl_td3_goc, so_luong_goc;
              let heSoHienTai = item.he_so || 1;

              // Nếu đang ở đơn vị gốc, tính ngược từ hệ số gốc
              if (dvtHienTai.trim() === dvtGocFromAPI.trim()) {
                sl_td3_goc =
                  heSoGocFromAPI !== 0
                    ? sl_td3_hienThi / heSoGocFromAPI
                    : sl_td3_hienThi;
                // Nếu so_luong = 0, sử dụng sl_td3_goc làm so_luong_goc
                if (so_luong_hienThi === 0) {
                  so_luong_goc = sl_td3_goc;
                } else {
                  so_luong_goc =
                    heSoGocFromAPI !== 0
                      ? so_luong_hienThi / heSoGocFromAPI
                      : so_luong_hienThi;
                }
                heSoHienTai = heSoGocFromAPI;
              } else {
                // Nếu ở đơn vị khác, giá trị hiển thị chính là giá trị gốc
                sl_td3_goc = sl_td3_hienThi;
                // Nếu so_luong = 0, sử dụng sl_td3_goc làm so_luong_goc
                so_luong_goc =
                  so_luong_hienThi === 0 ? sl_td3_hienThi : so_luong_hienThi;
                // Tìm hệ số của đơn vị hiện tại từ danh sách đơn vị tính
                const dvtHienTaiInfo = donViTinhList.find(
                  (dvt) => dvt.dvt.trim() === dvtHienTai.trim()
                );
                heSoHienTai = dvtHienTaiInfo
                  ? parseFloat(dvtHienTaiInfo.he_so) || 1
                  : 1;
              }

              // Đảm bảo số lượng gốc không bằng 0 để tránh lỗi khi đổi đơn vị tính
              if (sl_td3_goc === 0) sl_td3_goc = 1;
              if (so_luong_goc === 0) so_luong_goc = 1;

              // Tính lại so_luong hiển thị dựa trên so_luong_goc và hệ số
              let so_luong_hienThi_moi;
              if (dvtHienTai.trim() === dvtGocFromAPI.trim()) {
                // Ở đơn vị gốc: so_luong = so_luong_goc * he_so_goc
                so_luong_hienThi_moi = so_luong_goc * heSoGocFromAPI;
              } else {
                // Ở đơn vị khác: so_luong = so_luong_goc (số nguyên)
                so_luong_hienThi_moi = so_luong_goc;
              }

              return {
                key: index + 1,
                maHang: item.ma_vt,
                so_luong: Math.round(so_luong_hienThi_moi * 1000) / 1000,
                so_luong_goc: Math.round(so_luong_goc * 1000) / 1000,
                sl_td3: sl_td3_hienThi,
                sl_td3_goc: Math.round(sl_td3_goc * 1000) / 1000,
                he_so: heSoHienTai,
                he_so_goc: heSoGocFromAPI, // Lưu hệ số gốc từ API
                ten_mat_hang: item.ten_vt || item.ma_vt,
                dvt: dvtHienTai,
                dvt_goc: dvtGocFromAPI,
                tk_vt: item.tk_vt || "",
                ma_kho: item.ma_kho || "",
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
