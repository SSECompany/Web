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
import { getLoItem, getViTriByKho } from "../../../../api";
import showConfirm from "../../../../components/common/Modal/ModalConfirm";
import VatTuSelectFullPOS from "../../../../components/common/ProductSelectFull/VatTuSelectFullPOS";
import QRScanner from "../../../../components/common/QRScanner/QRScanner";
import "../common-phieu.css";
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
  validateTongNhat,
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
  const returnUrl = location.state?.returnUrl || "/kho/nhat-hang";
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
    fcode3List,
    loadingFcode3,
    fetchMaKhoListDebounced,
    fetchMaKhachListDebounced,
    fetchFcode3ListDebounced,
    fetchMaGiaoDichList,
    fetchMaKhoList,
    fetchMaKhachList,
    fetchFcode3List,
    fetchVatTuList,
    fetchVatTuDetail,
    fetchDonViTinh,
    setVatTuList,
    setFcode3List,
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

            const isEmptyDate = (v) => {
              if (v === null || v === undefined) return true;
              const s = String(v).trim();
              if (!s || s.toLowerCase() === "null" || s === "*") return true;
              // common sentinel dates
              if (s.startsWith("1900") || s.startsWith("0001")) return true;
              return !dayjs(s).isValid();
            };

            const formattedData = {
              stt_rec: id,
              sttRec: phieuInfo.stt_rec,
              ngay: phieuInfo.ngay_lct || phieuInfo.ngay_ct ? dayjs(phieuInfo.ngay_lct || phieuInfo.ngay_ct) : dayjs(),
              soPhieu: phieuInfo.so_ct || "",
              maKhach: phieuInfo.ma_kh || "",
              tenKhach: phieuInfo.ten_kh || "",
              dienGiai: phieuInfo.ghi_chu || "",
              maGiaoDich: phieuInfo.ma_gd || "",
              soDonHang: phieuInfo.so_don_hang || "",
              vung: phieuInfo.ma_nhomvitri || "",
              nhanVien: phieuInfo.ma_nvbh || "",
              banDongGoi: phieuInfo.ban_dong_goi || "",
              trangThai: statusValue,
              statusname: phieuInfo.statusname || "",
              donViTienTe: "VND",
              tyGia: 1,
              // Map fcode3 and ten_vc for display
              loaiVanChuyen: phieuInfo.fcode3 || "",
              tenVc: phieuInfo.ten_vc || "",
              soPhieuXuatBan:
                phieuInfo.so_phieu_xuat1 || phieuInfo.so_phieu_xuat2 || "",
              // Map bat_dau_nhat_hang and nhat_hang_xong
              batDauNhatHang: isEmptyDate(phieuInfo.bat_dau_nhat_hang)
                ? ""
                : dayjs(phieuInfo.bat_dau_nhat_hang).format("DD/MM/YYYY HH:mm"),
              ketThucNhatHang: isEmptyDate(phieuInfo.nhat_hang_xong)
                ? ""
                : dayjs(phieuInfo.nhat_hang_xong).format("DD/MM/YYYY HH:mm"),
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

  // === API: fetch lists for Mã lô / Vị trí (edit page) ===
  const fetchLoList = async (keyword = "", record = {}, page = 1) => {
    try {
      const response = await getLoItem({
        ma_vt: (record?.maHang || record?.ma_vt || "").toString(),
        ma_lo: "",
        ten_lo: keyword,
        ngay_hhsd_tu: null,
        ngay_hhsd_den: null,
        pageIndex: page,
        pageSize: 10,
      });

      const data = response?.listObject?.[0] || [];
      const options = data.map((x) => {
        const value = (x?.ma_lo || x?.value || x?.ten_lo || "").toString();
        const label = x?.ma_lo || x?.ten_lo || x?.label || value;
        return { value, label };
      });
      return options;
    } catch (e) {
      console.error("fetchLoList (detail) error", e);
      return [];
    }
  };

  const fetchViTriList = async (keyword = "", record = {}, page = 1) => {
    try {
      const response = await getViTriByKho({
        ma_kho: (record?.ma_kho || "ST").toString(),
        ten_vi_tri: keyword,
        pageIndex: page,
        pageSize: 10,
      });

      const data = response?.listObject?.[0] || [];
      const options = data.map((x) => {
        const value = (
          x?.ma_vi_tri ||
          x?.value ||
          x?.ten_vi_tri ||
          ""
        ).toString();
        const label = x?.ma_vi_tri || x?.ten_vi_tri || x?.label || value;
        return { value, label };
      });
      return options;
    } catch (e) {
      console.error("fetchViTriList (detail) error", e);
      return [];
    }
  };

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
    // Không cho chỉnh sửa nếu phiếu đã hoàn thành (status = "2")
    const currentStatus = form.getFieldValue("trangThai") || phieuData?.status;
    if (currentStatus === "2" || currentStatus === 2) {
      message.warning("Phiếu nhặt hàng đã hoàn thành");
      return;
    }
    try {
      // Check if employee field is empty
      const isEmployeeEmpty =
        !phieuData?.ma_nvbh || phieuData.ma_nvbh.trim() === "";

      if (isEmployeeEmpty) {
        // Kiểm tra lại status trước khi gọi API để tránh gọi API khi đã hoàn thành
        const statusCheck = form.getFieldValue("trangThai") || phieuData?.status;
        if (statusCheck === "2" || statusCheck === 2) {
          message.warning("Phiếu nhặt hàng đã hoàn thành");
          return;
        }

        setLoading(true);

        // Call start picking API
        const startResult = await startPhieuNhatHang(sctRec, userInfo.id);

        if (!startResult.success) {
          // Kiểm tra lại status sau khi API trả về để tránh hiển thị message nếu đã hoàn thành
          const statusAfter = form.getFieldValue("trangThai") || phieuData?.status;
          if (statusAfter !== "2" && statusAfter !== 2) {
            message.error("Không thể bắt đầu nhặt hàng");
          }
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
            maGiaoDich: result.master.ma_gd || "",
            soDonHang: result.master.so_don_hang || "",
            vung: result.master.ma_nhomvitri || "",
            nhanVien: result.master.ma_nvbh || "",
            banDongGoi: result.master.ban_dong_goi || "",
            trangThai: result.master.status || "0",
            statusname: result.master.statusname || "",
            donViTienTe: "VND",
            tyGia: 1,
            loaiVanChuyen: result.master.fcode3 || "",
            tenVc: result.master.ten_vc || "",
            tenKhach: result.master.ten_kh || "",
            soPhieuXuatBan:
              result.master.so_phieu_xuat1 ||
              result.master.so_phieu_xuat2 ||
              "",
            // Map bat_dau_nhat_hang and nhat_hang_xong
            batDauNhatHang: result.master.bat_dau_nhat_hang
              ? dayjs(result.master.bat_dau_nhat_hang).format("DD/MM/YYYY HH:mm")
              : "",
            ketThucNhatHang: result.master.nhat_hang_xong
              ? dayjs(result.master.nhat_hang_xong).format("DD/MM/YYYY HH:mm")
              : "",
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
          navigate(returnUrl);
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

      // Validate tổng nhặt không được vượt quá số lượng đơn
      const tongNhatValidation = validateTongNhat(dataSource);
      if (!tongNhatValidation.isValid) {
        setLoading(false);
        return;
      }

      // Set status = 1 cho nút Lưu
      const updatedValues = {
        ...values,
        trangThai: "1",
      };

      // Build payload với status = 1
      const payload = buildPhieuNhatHangPayload(
        updatedValues,
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
        // Giữ nguyên màn hình chỉnh sửa, không navigate về trang chủ
        setLoading(false);
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error("Submit failed:", error);
      message.error("Có lỗi xảy ra khi cập nhật phiếu");
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();

      // Validate data source
      const validation = validateDataSource(dataSource);
      if (!validation.isValid) {
        setLoading(false);
        return;
      }

      // Validate tổng nhặt không được vượt quá số lượng đơn
      const tongNhatValidation = validateTongNhat(dataSource);
      if (!tongNhatValidation.isValid) {
        setLoading(false);
        return;
      }

      // Set status = 2 cho nút Hoàn thành
      const updatedValues = {
        ...values,
        trangThai: "2",
      };

      // Build payload với status = 2
      const payload = buildPhieuNhatHangPayload(
        updatedValues,
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
          "Đã hoàn thành phiếu nhặt hàng, đang chuyển về trang chính..."
        );

        // Delay một chút để user thấy message trước khi navigate
        setTimeout(() => {
          navigate(returnUrl);
        }, 1000);
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error("Complete failed:", error);
      message.error("Có lỗi xảy ra khi hoàn thành phiếu");
      setLoading(false);
    }
  };

  return (
    <div className="phieu-container">
      <div className="phieu-header">
        <Button
          type="text"
          icon={<LeftOutlined />}
          onClick={() => navigate(returnUrl)}
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
            disabled={(form.getFieldValue("trangThai") || phieuData?.status) === "2"}
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
              disabled={!isEditMode}
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
              isEditMode={false}
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
            fetchLoList={fetchLoList}
            fetchViTriList={fetchViTriList}
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
                <Button
                  type="primary"
                  onClick={handleComplete}
                  loading={loading}
                  style={{ backgroundColor: "#52c41a", borderColor: "#52c41a" }}
                >
                  Hoàn thành
                </Button>
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
