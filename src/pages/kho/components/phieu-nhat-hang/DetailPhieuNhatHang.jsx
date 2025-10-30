import {
  DownOutlined,
  EditOutlined,
  LeftOutlined,
  UpOutlined,
} from "@ant-design/icons";
import { Button, Form, Space, Typography, message } from "antd";
import dayjs from "dayjs";
import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import showConfirm from "../../../../components/common/Modal/ModalConfirm";
import VatTuSelectFullPOS from "../../../../components/common/ProductSelectFull/VatTuSelectFullPOS";
import QRScanner from "../../../../components/common/QRScanner/QRScanner";
import "../common-phieu.css";
import { validateQuantityForPhieu } from "../common/QuantityValidationUtils";
import PhieuNhatHangFormInputs from "./components/PhieuNhatHangFormInputs";
import VatTuNhatHangTable from "./components/VatTuNhatHangTable";
import { usePhieuNhatHangData } from "./hooks/usePhieuNhatHangData";
import { useVatTuManagerNhatHang } from "./hooks/useVatTuManagerNhatHang";
import {
  fetchPhieuNhatHangData,
  startPhieuNhatHang,
  updatePhieuNhatHang,
} from "./utils/phieuNhatHangApi";
import {
  buildPhieuNhatHangPayload,
  deletePhieuNhatHangDynamic,
  validateDataSource,
} from "./utils/phieuNhatHangUtils";

const { Title } = Typography;

const DetailPhieuNhatHang = ({ isEditMode: initialEditMode = false }) => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [phieuData, setPhieuData] = useState(null);
  const [isEditMode, setIsEditMode] = useState(initialEditMode);
  const [vatTuInput, setVatTuInput] = useState(undefined);
  const [barcodeEnabled, setBarcodeEnabled] = useState(false);
  const [barcodeJustEnabled, setBarcodeJustEnabled] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [apiCalled, setApiCalled] = useState(false);
  const [pageIndex, setPageIndex] = useState(1);
  const [totalPage, setTotalPage] = useState(1);
  const [currentKeyword, setCurrentKeyword] = useState("");
  const [phieuDetailLoaded, setPhieuDetailLoaded] = useState(false);
  const [showFormFields, setShowFormFields] = useState(true);

  const vatTuSelectRef = useRef();
  const searchTimeoutRef = useRef();
  const sctRec = location.state?.sctRec || id;
  const token = localStorage.getItem("access_token");

  // Get user info from Redux instead of localStorage
  const userInfo = useSelector((state) => state?.claimsReducer?.userInfo || {});

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

  // Phân trang vật tư - sử dụng API giống POS
  const fetchVatTuListPaging = async (
    keyword = "",
    page = 1,
    append = false
  ) => {
    setCurrentKeyword(keyword);

    // Gọi hàm trong hook để quản lý loading + transform thống nhất
    await fetchVatTuList(keyword, page, append, (pagination) => {
      setPageIndex(page);
      setTotalPage(pagination?.totalPage || 1);
    });
  };

  // Set edit mode based on URL (or prop)
  useEffect(() => {
    const isEditPath = location.pathname.includes("/edit/");
    setIsEditMode(initialEditMode || isEditPath);
  }, [location.pathname, initialEditMode]);

  // Load phieu details
  useEffect(() => {
    const fetchPhieuDetail = async () => {
      if (apiCalled || !sctRec || phieuDetailLoaded) return;

      setLoading(true);
      setApiCalled(true);
      setPhieuDetailLoaded(true);

      try {
        const result = await fetchPhieuNhatHangData(sctRec);

        if (result.success) {
          const phieuInfo = result.master;
          const vatTuList = result.detail;

          if (phieuInfo) {
            let statusValue = phieuInfo.status;
            if (statusValue === "*" || statusValue === null) {
              statusValue = "0";
            }

            const formattedData = {
              stt_rec: id,
              sttRec: phieuInfo.stt_rec,
              ngay: phieuInfo.ngay_ct ? dayjs(phieuInfo.ngay_ct) : dayjs(),
              soPhieu: phieuInfo.so_ct || "",
              maKhach: phieuInfo.ma_kh || "",
              dienGiai: phieuInfo.ghi_chu || "",
              tenKhach: phieuInfo.ten_kh || "",
              maGiaoDich: phieuInfo.ma_gd || "",
              soDonHang: phieuInfo.so_don_hang || "",
              vung: phieuInfo.ma_nhomvitri || "",
              nhanVien: phieuInfo.ma_nvbh || "",
              banDongGoi: phieuInfo.ban_dong_goi || "",
              trangThai: statusValue,
              donViTienTe: "VND",
              tyGia: 1,
              // Add missing fields from API response
              loaiVanChuyen: phieuInfo.loai_van_chuyen || "",
              soPhieuXuatBan:
                phieuInfo.so_phieu_xuat1 || phieuInfo.so_phieu_xuat2 || "",
            };

            // Process vật tư list - DYNAMIC: Giữ nguyên TẤT CẢ trường từ API
            const processedVatTu = vatTuList.map((item, index) => {
              const soLuongNhat = item.nhat ?? 0; // số lượng nhặt thực tế
              const soLuongDon = item.so_luong ?? 0; // số lượng theo đơn
              const dvtHienTai = item.dvt ? item.dvt.trim() : "cái";

              return {
                // Giữ nguyên TẤT CẢ trường từ API response
                ...item,

                // Override với UI-friendly fields
                key: index + 1,
                maHang: item.ma_vt || "",
                soLuong:
                  Math.round((parseFloat(soLuongNhat) || 0) * 1000) / 1000, // nhặt
                soLuongDeNghi: parseFloat(item.so_luong) || 0, // số lượng đơn
                ten_mat_hang: item.ten_vt || item.ma_vt || "",
                dvt: dvtHienTai,
                ma_kho: item.ma_kho || "",
                tk_vt: item.tk_vt || "",
                line_nbr: item.line_nbr || index + 1,
                // Add missing fields for table display
                ma_lo: item.ma_lo || "",
                ma_vi_tri: item.ma_vi_tri || "",
                nhat: item.nhat || false,
                so_luong_ton: item.so_luong_ton || 0,
                tong_nhat: item.tong_nhat || 0,
                ghi_chu: item.ghi_chu || "",
              };
            });

            // Lưu chỉ data gốc từ API để sử dụng khi build payload (không merge với UI data)
            setPhieuData(phieuInfo);
            form.setFieldsValue(formattedData);
            setDataSource(processedVatTu);
          }
        } else {
          message.error("Không thể tải dữ liệu phiếu");
          setApiCalled(false);
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
  }, [sctRec, apiCalled, token, id, phieuDetailLoaded]);

  // Wrapper function to match VatTuSelectFullPOS expected signature
  const fetchVatTuListWrapper = async (
    keyword = "",
    page = 1,
    append = false
  ) => {
    return fetchVatTuListPaging(keyword, page, append);
  };

  // Load initial search data when component mounts
  useEffect(() => {
    if (isEditMode) {
      fetchVatTuListPaging("", 1, false);
    }
  }, [isEditMode]);

  // Handle barcode focus
  useEffect(() => {
    if (barcodeJustEnabled && vatTuSelectRef.current) {
      vatTuSelectRef.current.focus();
      setBarcodeJustEnabled(false);
    }
  }, [barcodeJustEnabled]);

  // Prevent focus from moving to other inputs when in barcode mode
  useEffect(() => {
    if (barcodeEnabled) {
      const handleFocusIn = (e) => {
        // If focus moves to any input other than barcode input, move it back
        if (
          !e.target.classList.contains("barcode-input") &&
          (e.target.tagName === "INPUT" || e.target.tagName === "SELECT")
        ) {
          setTimeout(() => {
            if (vatTuSelectRef.current && barcodeEnabled) {
              vatTuSelectRef.current.focus();
            }
          }, 10);
        }
      };

      document.addEventListener("focusin", handleFocusIn);

      return () => {
        document.removeEventListener("focusin", handleFocusIn);
      };
    }
  }, [barcodeEnabled]);

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
    try {
      // Tìm item trong danh sách hiện tại
      const selectedItem = vatTuList.find((item) => item.value === value);

      if (selectedItem) {
        // Tạo item mới cho bảng
        const newItem = {
          key: Date.now(),
          maHang: selectedItem.item.sku,
          ten_mat_hang: selectedItem.item.name,
          dvt: selectedItem.item.unit,
          soLuong: 0,
          soLuongDeNghi: 0,
          ma_kho: "ST", // Default kho
          tk_vt: "",
          line_nbr: dataSource.length + 1,
        };

        // Thêm vào dataSource
        setDataSource((prev) => [...prev, newItem]);
        setVatTuInput("");

        return true;
      } else {
        message.error("Không tìm thấy vật tư");
        return false;
      }
    } catch (error) {
      console.error("Lỗi khi chọn vật tư:", error);
      message.error("Có lỗi xảy ra khi chọn vật tư");
      return false;
    }
  };

  const handleQRScanSuccess = async (scannedCode) => {
    try {
      // Tìm vật tư theo mã đã quét
      const foundVatTu = vatTuList.find(
        (item) => item.item.sku === scannedCode.trim()
      );

      if (foundVatTu) {
        // Tạo item mới cho bảng
        const newItem = {
          key: Date.now(),
          maHang: foundVatTu.item.sku,
          ten_mat_hang: foundVatTu.item.name,
          dvt: foundVatTu.item.unit,
          soLuong: 0,
          soLuongDeNghi: 0,
          ma_kho: "ST", // Default kho
          tk_vt: "",
          line_nbr: dataSource.length + 1,
        };

        // Thêm vào dataSource
        setDataSource((prev) => [...prev, newItem]);
        message.success(`Đã thêm vật tư: ${foundVatTu.item.name}`);
      } else {
        message.error(`Không tìm thấy vật tư với mã: ${scannedCode}`);
      }
    } catch (error) {
      console.error("Lỗi khi xử lý mã quét:", error);
      message.error("Có lỗi xảy ra khi xử lý mã quét");
    }
  };

  const handleSwitchToBarcodeMode = () => {
    setShowQRScanner(false);
    setBarcodeEnabled(true);
    setBarcodeJustEnabled(true);
  };

  const handleEdit = async () => {
    try {
      // Check if employee field is empty
      const isEmployeeEmpty =
        !phieuData?.ma_nvbh || phieuData.ma_nvbh.trim() === "";

      if (isEmployeeEmpty) {
        setLoading(true);

        // Call start picking API
        const startResult = await startPhieuNhatHang(sctRec, userInfo.id);

        if (!startResult.success) {
          message.error("Không thể bắt đầu nhặt hàng");
          setLoading(false);
          return;
        }

        // Reload phieu details to get updated employee info
        const result = await fetchPhieuNhatHangData(sctRec);

        if (result.success && result.master) {
          setPhieuData(result.master);

          // Update form with new data
          const updatedFormattedData = {
            stt_rec: id,
            sttRec: result.master.stt_rec,
            ngay: result.master.ngay_ct
              ? dayjs(result.master.ngay_ct)
              : dayjs(),
            soPhieu: result.master.so_ct || "",
            maKhach: result.master.ma_kh || "",
            dienGiai: result.master.ghi_chu || "",
            tenKhach: result.master.ten_kh || "",
            maGiaoDich: result.master.ma_gd || "",
            soDonHang: result.master.so_don_hang || "",
            vung: result.master.ma_nhomvitri || "",
            nhanVien: result.master.ma_nvbh || "",
            banDongGoi: result.master.ban_dong_goi || "",
            trangThai: result.master.status || "0",
            donViTienTe: "VND",
            tyGia: 1,
            loaiVanChuyen: result.master.loai_van_chuyen || "",
            soPhieuXuatBan:
              result.master.so_phieu_xuat1 ||
              result.master.so_phieu_xuat2 ||
              "",
          };

          form.setFieldsValue(updatedFormattedData);
          message.success("Đã bắt đầu nhặt hàng thành công");
        }

        setLoading(false);
      }

      // Switch to edit mode
      navigate(`/kho/nhat-hang/chi-tiet/${id}`);
      setIsEditMode(true);
    } catch (error) {
      console.error("Error in handleEdit:", error);
      message.error("Có lỗi xảy ra khi bắt đầu chỉnh sửa");
      setLoading(false);
    }
  };

  const handleNew = () => {
    navigate("/kho/nhat-hang/them-moi");
  };

  const handleDelete = async () => {
    showConfirm({
      title: "Xác nhận xóa phiếu nhặt hàng",
      content: "Bạn có chắc chắn muốn xóa phiếu nhặt hàng này không?",
      type: "warning",
      onOk: async () => {
        setLoading(true);
        const result = await deletePhieuNhatHangDynamic(sctRec, userInfo);
        setLoading(false);

        if (result.success) {
          navigate("/kho/nhat-hang");
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
        setLoading(false);
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
              phieuData,
              true,
              userInfo
            );

            if (!payload) {
              message.error("Không thể tạo payload");
              setLoading(false);
              return;
            }

            // Gọi API cập nhật với stored procedure
            // Wrap payload in Data structure như API cũ mong đợi
            const wrappedPayload = {
              Data: payload,
            };

            const result = await updatePhieuNhatHang(wrappedPayload, userInfo);

            if (result.success) {
              message.success(
                "Đã cập nhật thành công, đang chuyển về trang chính..."
              );

              // Delay một chút để user thấy message trước khi navigate
              setTimeout(() => {
                navigate("/kho/nhat-hang");
              }, 1000);
            }
          } catch (error) {
            console.error("Submit failed:", error);
            message.error("Có lỗi xảy ra khi cập nhật phiếu");
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
          {isEditMode
            ? "CHỈNH SỬA PHIẾU NHẶT HÀNG"
            : "CHI TIẾT PHIẾU NHẶT HÀNG"}
        </Title>
        {!isEditMode ? (
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={handleEdit}
            className="phieu-edit-button"
          >
            Chỉnh sửa
          </Button>
        ) : (
          <div style={{ width: 120 }}></div>
        )}
      </div>

      <div className="phieu-form-container">
        <Form
          form={form}
          layout="vertical"
          className="phieu-form"
          disabled={!isEditMode}
        >
          {/* Toggle hiển/ẩn thông tin phiếu */}
          <div style={{ marginBottom: 8 }}>
            <Button
              size="small"
              type="text"
              icon={showFormFields ? <UpOutlined /> : <DownOutlined />}
              onClick={() => setShowFormFields(!showFormFields)}
              disabled={false}
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

          {showFormFields && (
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
              handleVatTuSelect={handleVatTuSelect}
            />
          )}

          {/* Divider to separate form and table area */}
          <div
            style={{
              borderTop: "1px solid rgba(255,255,255,0.12)",
              margin: "8px 0 12px 0",
            }}
          />

          {/* Thanh tìm kiếm/ chọn vật tư đặt ngay trên bảng */}
          <div style={{ marginTop: 8, marginBottom: 8 }}>
            <div
              style={{
                marginBottom: 8,
                fontWeight: "bold",
                fontSize: "14px",
                color: "#333",
              }}
            >
              Vật tư
            </div>
            <VatTuSelectFullPOS
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
              fetchVatTuList={fetchVatTuListWrapper}
              handleVatTuSelect={handleVatTuSelect}
              totalPage={totalPage}
              pageIndex={pageIndex}
              setPageIndex={setPageIndex}
              setVatTuList={setVatTuList}
              currentKeyword={currentKeyword}
              onOpenQRScanner={() => setShowQRScanner(true)}
            />
          </div>

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
            fetchDonViTinh={fetchDonViTinh}
            onDataSourceUpdate={setDataSource}
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

      {/* QR Scanner Modal */}
      <QRScanner
        isOpen={showQRScanner}
        onClose={() => setShowQRScanner(false)}
        onScanSuccess={handleQRScanSuccess}
        onSwitchToBarcode={handleSwitchToBarcodeMode}
      />
    </div>
  );
};

export default DetailPhieuNhatHang;
