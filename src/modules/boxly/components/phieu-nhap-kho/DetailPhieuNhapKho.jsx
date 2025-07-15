import { EditOutlined, LeftOutlined } from "@ant-design/icons";
import { Button, Form, message, Space, Typography } from "antd";
import dayjs from "dayjs";
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import showConfirm from "../../../../components/common/Modal/ModalConfirm";
import https from "../../../../utils/https";
import PhieuNhapKhoFormInputs from "./components/PhieuNhapKhoFormInputs";
import VatTuNhapKhoTable from "./components/VatTuNhapKhoTable";
import { usePhieuNhapKhoData } from "./hooks/usePhieuNhapKhoData";
import { useVatTuManagerNhapKho } from "./hooks/useVatTuManagerNhapKho";
import "./phieu-nhap-kho.css";
import {
  buildPhieuNhapKhoPayload,
  deletePhieuNhapKho,
  submitPhieuNhapKho,
  validateDataSource,
} from "./utils/phieuNhapKhoUtils";

const { Title } = Typography;

const DetailPhieuNhapKho = ({ isEditMode: initialEditMode = false }) => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { stt_rec } = useParams();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [phieuData, setPhieuData] = useState(null);
  const [isEditMode, setIsEditMode] = useState(initialEditMode);
  const [vatTuInput, setVatTuInput] = useState(undefined);
  const [barcodeEnabled, setBarcodeEnabled] = useState(false);
  const [barcodeJustEnabled, setBarcodeJustEnabled] = useState(false);
  const [apiCalled, setApiCalled] = useState(false);

  const vatTuSelectRef = useRef();
  const searchTimeoutRef = useRef();
  const sctRec = location.state?.sctRec || stt_rec;
  const token = localStorage.getItem("access_token");

  // Custom hooks
  const {
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

  // Initialize data and load phieu details
  useEffect(() => {
    const initializeData = async () => {
      // Load master data
      await Promise.all([
        fetchMaGiaoDichList(),
        fetchMaKhoList(),
        fetchMaKhachList(),
        fetchVatTuList(),
      ]);
    };

    initializeData();
  }, []);

  // Set edit mode based on URL
  useEffect(() => {
    const isEditPath = location.pathname.includes("/edit/");
    setIsEditMode(isEditPath);
  }, [location.pathname]);

  // Load phieu details
  useEffect(() => {
    const fetchPhieuDetail = async () => {
      if (apiCalled || !sctRec) return;

      setLoading(true);
      setApiCalled(true);

      try {
        const response = await https.get(`v1/web/thong-tin-phieu-nhap-kho`, {
          stt_rec: sctRec,
        });

        if (response && response.data) {
          const apiData = response.data;
          const phieuInfo =
            apiData.data && apiData.data.length > 0 ? apiData.data[0] : null;
          const vatTuList = apiData.data2 || [];

          if (phieuInfo) {
            let statusValue = phieuInfo.status;
            if (statusValue === "*" || statusValue === null) {
              statusValue = "0";
            }

            const formattedData = {
              stt_rec: stt_rec,
              sttRec: phieuInfo.stt_rec,
              ngay: phieuInfo.ngay_ct ? dayjs(phieuInfo.ngay_ct) : dayjs(),
              soPhieu: phieuInfo.so_ct || "",
              maKhach: phieuInfo.ma_kh || "",
              dienGiai: phieuInfo.dien_giai || "",
              tenKhach: phieuInfo.ong_ba || "",
              maGiaoDich: phieuInfo.ma_gd || "",
              trangThai: statusValue,
              donViTienTe: "VND",
              tyGia: 1,
            };

            // Process vật tư list
            const processedVatTu = await Promise.all(
              vatTuList.map(async (item, index) => {
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
                const soLuongHienThi = item.sl_td3 ?? 0; // sl_td3 - số lượng thực tế
                const soLuongDeNghiHienThi = item.so_luong ?? 0; // so_luong - số lượng đề nghị
                const dvtHienTai = item.dvt ? item.dvt.trim() : dvtGocFromAPI;

                let soLuongGoc;
                let heSoHienTai = item.he_so || 1;

                // Nếu đang ở đơn vị gốc, tính ngược soLuong_goc từ hệ số gốc
                if (dvtHienTai.trim() === dvtGocFromAPI.trim()) {
                  soLuongGoc =
                    heSoGocFromAPI !== 0
                      ? soLuongHienThi / heSoGocFromAPI
                      : soLuongHienThi;
                  heSoHienTai = heSoGocFromAPI;
                } else {
                  // Nếu ở đơn vị khác, soLuongHienThi chính là soLuongGoc
                  soLuongGoc = soLuongHienThi;
                  // Tìm hệ số của đơn vị hiện tại từ danh sách đơn vị tính
                  const dvtHienTaiInfo = donViTinhList.find(
                    (dvt) => dvt.dvt.trim() === dvtHienTai
                  );
                  heSoHienTai = dvtHienTaiInfo
                    ? parseFloat(dvtHienTaiInfo.he_so) || 1
                    : 1;
                }

                // Tính lại soLuong hiển thị dựa trên soLuong_goc và hệ số
                let soLuongHienThiMoi;
                if (dvtHienTai.trim() === dvtGocFromAPI.trim()) {
                  // Ở đơn vị gốc: soLuong = soLuong_goc * he_so_goc
                  soLuongHienThiMoi = soLuongGoc * heSoGocFromAPI;
                } else {
                  // Ở đơn vị khác: soLuong = soLuong_goc (số nguyên)
                  soLuongHienThiMoi = soLuongGoc;
                }

                return {
                  key: index + 1,
                  maHang: item.ma_vt || "",
                  soLuong: Math.round(soLuongHienThiMoi * 1000) / 1000, // sl_td3 - số lượng thực tế
                  soLuong_goc: Math.round(soLuongGoc * 1000) / 1000,
                  soLuongDeNghi: parseFloat(soLuongDeNghiHienThi) || 0, // so_luong - số lượng đề nghị
                  he_so: heSoHienTai,
                  he_so_goc: heSoGocFromAPI, // Lưu hệ số gốc từ API
                  ten_mat_hang: item.ten_vt || item.ma_vt || "",
                  dvt: dvtHienTai,
                  dvt_goc: dvtGocFromAPI,
                  ma_kho: item.ma_kho || "",
                  tk_vt: item.tk_vt || "",
                  donViTinhList: donViTinhList,

                  // Lưu thêm các trường từ API để gửi lại khi update
                  stt_rec0: item.stt_rec0 || "",
                  ma_sp: item.ma_sp || "",
                  ma_bp: item.ma_bp || "",
                  so_lsx: item.so_lsx || "",
                  ma_vi_tri: item.ma_vi_tri || "",
                  ma_lo: item.ma_lo || "",
                  ma_vv: item.ma_vv || "",
                  ma_nx: item.ma_nx || "",
                  tk_du: item.tk_du || "",
                  gia_nt: item.gia_nt || 0,
                  gia: item.gia || 0,
                  tien_nt: item.tien_nt || 0,
                  tien: item.tien || 0,
                  pn_gia_tb: item.pn_gia_tb || false,
                  stt_rec_px: item.stt_rec_px || "",
                  stt_rec0px: item.stt_rec0px || "",
                  line_nbr: item.line_nbr || index + 1,
                };
              })
            );

            setPhieuData(formattedData);
            form.setFieldsValue(formattedData);
            setDataSource(processedVatTu);
          }
        }
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu phiếu:", error);
        message.error("Lỗi khi tải dữ liệu phiếu");
        setApiCalled(false);
      } finally {
        setLoading(false);
      }
    };

    fetchPhieuDetail();
  }, [sctRec, apiCalled]);

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

  const handleEdit = () => {
    navigate(`/boxly/phieu-nhap-kho/edit/${stt_rec}`);
    setIsEditMode(true);
  };

  const handleNew = () => {
    navigate("/boxly/phieu-nhap-kho/add");
  };

  const handleDelete = async () => {
    showConfirm({
      title: "Xác nhận xóa phiếu nhập kho",
      content: "Bạn có chắc chắn muốn xóa phiếu nhập kho này không?",
      type: "warning",
      onOk: async () => {
        setLoading(true);
        const result = await deletePhieuNhapKho(sctRec);
        setLoading(false);

        if (result.success) {
          navigate("/boxly/phieu-nhap-kho");
        }
      },
    });
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
      const payload = buildPhieuNhapKhoPayload(
        values,
        dataSource,
        phieuData,
        true
      );

      // Submit
      const result = await submitPhieuNhapKho(
        "v1/web/update-stock-voucher",
        payload,
        "Cập nhật phiếu nhập kho thành công"
      );

      if (result.success) {
        message.success(
          "Đã cập nhật thành công, đang chuyển về trang chính..."
        );

        // Delay một chút để user thấy message trước khi navigate
        setTimeout(() => {
          navigate("/boxly/phieu-nhap-kho");
        }, 1000);
      } else {
      }
    } catch (error) {
      console.error("Validation failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="phieu-nhap-container">
      <div
        className="phieu-nhap-header"
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
          onClick={() => navigate("/boxly/phieu-nhap-kho")}
          className="phieu-nhap-back-button"
        >
          Trở về
        </Button>
        <Title
          level={5}
          className="phieu-nhap-title"
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
          {isEditMode ? "CHỈNH SỬA PHIẾU NHẬP KHO" : "CHI TIẾT PHIẾU NHẬP KHO"}
        </Title>
        {!isEditMode ? (
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={handleEdit}
            className="phieu-nhap-edit-button"
            style={{
              background: "linear-gradient(145deg, #11998e 0%, #38ef7d 100%)",
              color: "white",
              boxShadow:
                "0 8px 24px rgba(17, 153, 142, 0.3), 0 2px 8px rgba(17, 153, 142, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.3)",
              border: "none",
              borderRadius: 20,
              fontWeight: 600,
              fontSize: 16,
              padding: "0 24px",
              height: 44,
              display: "flex",
              alignItems: "center",
              gap: 8,
              justifyContent: "center",
              minWidth: 120,
            }}
          >
            Chỉnh sửa
          </Button>
        ) : (
          <div style={{ width: 120 }}></div>
        )}
      </div>

      <div className="phieu-nhap-form-container">
        <Form
          form={form}
          layout="vertical"
          className="phieu-nhap-form"
          disabled={!isEditMode}
        >
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

          {isEditMode && (
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
          )}
        </Form>
      </div>
    </div>
  );
};

export default DetailPhieuNhapKho;
