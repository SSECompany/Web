import { Button, Card, Tooltip, notification, Modal } from "antd";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSelector } from "react-redux";
import { searchVatTu, uploadPrescriptionImage } from "../../api";
import VatTuSelectFullPOS from "../../components/common/ProductSelectFull/VatTuSelectFullPOS";
import ReportModal from "../../components/common/ReportModal/ReportModal";
import RetailOrderListModal from "../../components/common/RetailOrderListModal/RetailOrderListModal";
import "./POS.css";
import CartTable from "./components/CartTable";
import PaymentSummary from "./components/PaymentSummary";
import PrescriptionModal from "./components/PrescriptionModal";

const POS = () => {
  // Lấy dữ liệu từ Redux store
  const { id: userId, unitId } = useSelector(
    (state) => state.claimsReducer.userInfo || {}
  );

  const [cart, setCart] = useState([]);
  const [customer, setCustomer] = useState({
    code: "",
    phone: "",
    name: "",
    idNumber: "",
    patientName: "",
  });
  const [payment, setPayment] = useState({ method: "cash", cash: 0 });
  const [currentOrderSttRec, setCurrentOrderSttRec] = useState(""); // Store stt_rec when editing order

  // Search/Barcode unified state for ProductSelectFull
  const [barcodeEnabled, setBarcodeEnabled] = useState(false);
  const [barcodeJustEnabled, setBarcodeJustEnabled] = useState(false);
  const [vatTuInput, setVatTuInput] = useState("");
  const vatTuSelectRef = useRef(null);
  const [loadingVatTu, setLoadingVatTu] = useState(false);
  const [vatTuList, setVatTuList] = useState([]);
  const searchTimeoutRef = useRef();
  const [pageIndex, setPageIndex] = useState(1);
  const [totalPage, setTotalPage] = useState(1);
  const [currentKeyword, setCurrentKeyword] = useState("");

  const [payModalOpen, setPayModalOpen] = useState(false);
  const [customerOpen, setCustomerOpen] = useState(false);
  const [hasInitialData, setHasInitialData] = useState(false);

  // Tooltip modal states
  const [isOrderListModalOpen, setIsOrderListModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false);
  const fileInputRef = useRef(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState("");
  const [isUploadPreviewOpen, setIsUploadPreviewOpen] = useState(false);
  const [localPreviewUrl, setLocalPreviewUrl] = useState("");
  const [uploadedKeyFields, setUploadedKeyFields] = useState("");

  const handleOpenFilePicker = () => {
    if (uploadedImageUrl) {
      setIsUploadPreviewOpen(true);
    } else {
      if (fileInputRef?.current) {
        // Reset value to allow selecting the same file again
        fileInputRef.current.value = "";
        fileInputRef.current.click();
      } else {
        console.error("File input ref is not available");
      }
    }
  };

  const [isUploading, setIsUploading] = useState(false);

  const handleUploadImage = async (event) => {
    const selectedFile = event?.target?.files?.[0];
    if (!selectedFile) {
      console.warn("No file selected");
      return;
    }

    setIsUploading(true);
    const loadingKey = "upload-loading";
    
    // Clear previous preview
    setLocalPreviewUrl("");
    setUploadedImageUrl("");
    setIsUploadPreviewOpen(false);
    
    notification.open({
      message: "Đang tải ảnh lên server...",
      description: "Vui lòng đợi",
      duration: 0,
      key: loadingKey,
    });

    try {
      // Upload file directly without compression
      const fileToUpload = selectedFile;

      // Ensure we have a file to upload
      if (!fileToUpload) {
        console.error("No file to upload after processing");
        throw new Error("Không có file để upload");
      }

      const res = await uploadPrescriptionImage({ file: fileToUpload });
      
      // Close loading notification
      notification.destroy(loadingKey);

      if (res?.success) {
        // Only show preview and success message after API succeeds
        setUploadedImageUrl(res?.data?.url || "");
        setUploadedKeyFields(res?.data?.keyFields || "");
        notification.success({ 
          message: "Tải ảnh thành công",
          description: "Ảnh đã được tải lên thành công"
        });
        // Open preview modal after successful upload
        setIsUploadPreviewOpen(true);
      } else {
        notification.error({ message: res?.message || "Tải ảnh thất bại" });
      }
    } catch (e) {
      console.error("Upload error:", e);
      // Close all loading notifications
      notification.destroy(loadingKey);
      notification.error({
        message: "Tải ảnh thất bại",
        description: e?.message || "Vui lòng thử lại",
      });
    } finally {
      // Ensure all loading notifications are closed
      notification.destroy(loadingKey);
      setIsUploading(false);
      // clear input so same file can be selected again
      if (fileInputRef?.current) fileInputRef.current.value = "";
    }
  };

  // Load initial data when component mounts
  useEffect(() => {
    // Load initial product list when page loads
    const loadInitialData = async () => {
      setLoadingVatTu(true);
      try {
        const response = await searchVatTu("", 1, 20, unitId, userId);

        // Kiểm tra response success - sử dụng cấu trúc API mới
        if (response?.responseModel?.isSucceded) {
          const listObject = response.listObject;

          // listObject[0] chứa array các items
          const data = listObject?.[0] || [];
          // listObject[1] chứa array thông tin pagination
          const paginationInfo = listObject?.[1]?.[0] || {};

          // Transform API data to match ProductSelectFull format
          const transformedData = data.map((item) => ({
            value: item.value || `ITEM1${Math.random()}`,
            label: item.label || `Sản phẩm - ${item.value || "N/A"}`,
            item: {
              sku: item.value || `ITEM1${Math.random()}`,
              name: item.label || `Sản phẩm`,
              price: item.gia || 0,
              unit: item.dvt || "viên",
              stock: 0, // API không trả về stock
            },
          }));

          setVatTuList(transformedData);
          // Sử dụng metadata phân trang từ API
          setTotalPage(paginationInfo.totalpage || 1);
          setCurrentKeyword("");
          setHasInitialData(true);
        } else {
          // Hiển thị error message từ API
          const errorMessage =
            response?.responseModel?.message ||
            "Không thể tải danh sách vật tư";
          notification.error({
            message: "Lỗi tải dữ liệu",
            description: errorMessage,
          });
          setVatTuList([]);
        }
      } catch (error) {
        console.error("Error loading initial data:", error);
        notification.error({
          message: "Lỗi kết nối",
          description: "Không thể kết nối đến máy chủ",
        });
        setVatTuList([]);
      } finally {
        setLoadingVatTu(false);
      }
    };

    if (unitId && userId) {
      loadInitialData();
    }
  }, [unitId, userId]);

  const subtotal = useMemo(
    () => cart.reduce((s, x) => s + x.price * x.qty, 0),
    [cart]
  );
  const discount = useMemo(
    () =>
      cart.reduce((s, x) => {
        const itemTotal = x.price * x.qty;
        // Phenikaa logic: Ưu tiên giảm tiền, nếu không có thì dùng giảm %
        const itemDiscount =
          x.discountAmount > 0
            ? x.discountAmount
            : Math.round((itemTotal * (x.discountPercent || 0)) / 100);
        return s + itemDiscount;
      }, 0),
    [cart]
  );
  const vat = useMemo(
    () =>
      cart.reduce((s, x) => {
        const itemTotal = x.price * x.qty;
        // Phenikaa logic: Tính VAT sau khi trừ giảm giá
        const itemDiscount =
          x.discountAmount > 0
            ? x.discountAmount
            : Math.round((itemTotal * (x.discountPercent || 0)) / 100);
        // Nếu đơn đang sửa đã có thue_nt từ API, ưu tiên dùng giá trị này
        const itemVat =
          Number(x.thue_nt) > 0
            ? Math.round(Number(x.thue_nt))
            : Math.round(((itemTotal - itemDiscount) * (x.vatPercent || 0)) / 100);
        return s + itemVat;
      }, 0),
    [cart]
  );
  const total = useMemo(
    () => Math.max(0, subtotal + vat - discount),
    [subtotal, vat, discount]
  );
  const change = useMemo(
    () => Math.max(0, (payment.cash || 0) - total),
    [payment.cash, total]
  );

  const addToCart = (item) => {
    const existingIndex = cart.findIndex((x) => x.sku === item.sku);
    if (existingIndex >= 0) {
      setCart((prev) =>
        prev.map((x, i) =>
          i === existingIndex ? { ...x, qty: (x.qty || 1) + 1 } : x
        )
      );
    } else {
      setCart((prev) => [
        ...prev,
        {
          ...item,
          qty: 1,
          batchExpiry: "",
          vatPercent: Number(item.thue_suat) || 0,
          ma_thue: (item.ma_thue || "").trim(),
          thue_suat: Number(item.thue_suat) || 0,
          discountPercent: 0,
          discountAmount: 0,
          remaining: 0,
          instructions: "",
        },
      ]);
    }
  };

  const removeAt = (index) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const updateLine = (index, field, value) => {
    setCart((prev) =>
      prev.map((x, i) => (i === index ? { ...x, [field]: value } : x))
    );
  };

  // Fetch list for ProductSelectFull using real API
  const fetchVatTuList = useCallback(
    async (keyword, page = 1, append = false) => {
      setLoadingVatTu(true);
      try {
        // Call real API using searchVatTu
        const response = await searchVatTu(keyword, page, 20, unitId, userId);

        // Kiểm tra response success - sử dụng cấu trúc API mới
        if (response?.responseModel?.isSucceded) {
          const listObject = response.listObject;

          // listObject[0] chứa array các items
          const data = listObject?.[0] || [];
          // listObject[1] chứa array thông tin pagination
          const paginationInfo = listObject?.[1]?.[0] || {};

          // Transform API data to match ProductSelectFull format
          const transformedData = data.map((item) => ({
            value: item.value || `ITEM${page}${Math.random()}`,
            label: item.label || `Sản phẩm - ${item.value || "N/A"}`,
            item: {
              sku: item.value || `ITEM${page}${Math.random()}`,
              name: item.label || `Sản phẩm`,
              price: item.gia || 0,
              unit: item.dvt || "viên",
              stock: 0, // API không trả về stock
              ma_thue: (item.ma_thue || "").trim(),
              thue_suat: Number(item.thue_suat) || 0,
            },
          }));

          if (append) {
            setVatTuList((prev) => [...prev, ...transformedData]);
            // Cập nhật pageIndex khi append thành công
            setPageIndex(page);
          } else {
            setVatTuList(transformedData);
            // Reset pageIndex khi search mới
            setPageIndex(1);
          }

          // Sử dụng metadata phân trang từ API
          const newTotalPage = paginationInfo.totalpage || 1;
          setTotalPage(newTotalPage);
          setCurrentKeyword(keyword);
        } else {
          // Hiển thị error message từ API
          const errorMessage =
            response?.responseModel?.message || "Không thể tìm kiếm vật tư";
          notification.error({
            message: "Lỗi tìm kiếm",
            description: errorMessage,
          });

          if (!append) {
            setVatTuList([]);
            setPageIndex(1);
          }
        }
      } catch (error) {
        console.error("Error fetching products:", error);
        notification.error({
          message: "Lỗi kết nối",
          description: "Không thể kết nối đến máy chủ",
        });

        if (!append) {
          setVatTuList([]);
          setPageIndex(1);
        }
      } finally {
        setLoadingVatTu(false);
      }
    },
    [unitId, userId, setPageIndex]
  );

  const handleVatTuSelect = useCallback(
    async (value, option) => {
      let selectedItem = option?.item;
      if (!selectedItem) {
        const list = vatTuList.map((o) => o.item);
        selectedItem = list.find((x) => x.sku === value || x.value === value);

        if (!selectedItem && typeof value === "string") {
          // Thử tìm kiếm sản phẩm theo barcode
          try {
            const response = await searchVatTu(value, 1, 1, unitId, userId);
            if (
              response.responseModel?.isSucceded &&
              response.listObject?.[0]?.length > 0
            ) {
              const foundItem = response.listObject[0][0];
              selectedItem = {
                sku: foundItem.value || value,
                name: foundItem.label || `Sản phẩm ${value}`,
                price: foundItem.gia || 0,
                unit: foundItem.dvt || "cái",
                stock: 0, // API không trả về stock
                ma_thue: (foundItem.ma_thue || "").trim(),
                thue_suat: Number(foundItem.thue_suat) || 0,
              };
            } else {
              // Hiển thị error message từ API nếu có
              const errorMessage =
                response.responseModel?.message ||
                `Không tìm thấy sản phẩm với mã: ${value}`;
              notification.error({
                message: "Không tìm thấy sản phẩm",
                description: errorMessage,
              });
              return false;
            }
          } catch (error) {
            console.error("Error searching product by barcode:", error);
            notification.error({
              message: "Lỗi tìm kiếm",
              description: `Không thể tìm kiếm sản phẩm với mã: ${value}`,
            });
            return false;
          }
        }
      }

      if (selectedItem) {
        addToCart(selectedItem);
        setVatTuInput("");
        return true;
      }

      notification.error({
        message: "Lỗi",
        description: `Không thể thêm sản phẩm: ${value}`,
      });
      return false;
    },
    [vatTuList, addToCart, unitId, userId]
  );

  const handleOpenPayment = () => {
    setPayModalOpen(true);
  };

  // Tooltip modal handlers
  const handleOrderListModal = useCallback(() => {
    setIsOrderListModalOpen(!isOrderListModalOpen);
  }, [isOrderListModalOpen]);

  const handleReportModal = useCallback(() => {
    setIsReportModalOpen(!isReportModalOpen);
  }, [isReportModalOpen]);

  const handlePrescriptionModal = useCallback(() => {
    setIsPrescriptionModalOpen(!isPrescriptionModalOpen);
  }, [isPrescriptionModalOpen]);

  // Load an existing retail order (from RetailOrderListModal)
  const handleLoadOrderFromModal = useCallback(({ master, detail }) => {
    try {
      // Store stt_rec for editing
      setCurrentOrderSttRec((master?.stt_rec || "").trim());

      // Map detail lines to cart structure
      const mappedCart = (detail || []).map((d) => ({
        sku: d.ma_vt || "",
        name: d.ten_vt || "",
        price: Number(d.don_gia) || 0,
        unit: (d.dvt || "").trim(),
        qty: Number(d.so_luong) || 1,
        batchExpiry: (d.ma_lo || "").trim(),
        vatPercent: Number(d.thue_suat) || 0,
        ma_thue: (d.ma_thue || "").trim(),
        thue_suat: Number(d.thue_suat) || 0,
        thue_nt: Number(d.thue_nt) || 0,
        discountPercent: Number(d.tl_ck) || 0,
        discountAmount: Number(d.ck_nt) || 0,
        remaining: 0,
        instructions: (d.ghi_chu || "").trim(),
        ghi_chu: (d.ghi_chu || "").trim(),
      }));

      setCart(mappedCart);

      // Map master -> customer (sử dụng dien_thoai thay vì so_dt)
      setCustomer({
        code: (master?.ma_kh || "").trim(),
        phone: (master?.dien_thoai || master?.so_dt || "").trim(),
        name: (master?.ten_kh || "").trim(),
        idNumber: (master?.ma_thue || master?.cccd || "").trim(),
        patientName: (master?.ong_ba || "").trim(),
      });

      // Map master -> payment
      const rawMethod = (master?.httt || "").trim().toLowerCase();
      const isTransfer =
        rawMethod === "chuyen_khoan" || Number(master?.chuyen_khoan || 0) > 0;
      const paymentMethod = isTransfer ? "transfer" : "cash";
      const cashAmount = isTransfer ? 0 : Number(master?.tien_mat || 0);

      setPayment({
        method: paymentMethod,
        cash: cashAmount,
      });

      setCustomerOpen(Boolean(master?.ma_kh || master?.ten_kh));
      setIsOrderListModalOpen(false);
    } catch (e) {
      console.error("Error loading order into POS:", e);
      notification.error({ message: "Không thể nạp đơn vào POS" });
    }
  }, []);

  return (
    <div className="pos-container">
      {/* Phần tìm kiếm full width */}
      <div className="pos-search-full-width">
        <Card
          size="small"
          title={
            <div className="search-title">
              <span>Tìm kiếm & Quét mã</span>
            </div>
          }
          className="search-card"
        >
          <div className="search-row">
            <div className="search-input-container">
              <VatTuSelectFullPOS
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
                totalPage={totalPage}
                pageIndex={pageIndex}
                setPageIndex={setPageIndex}
                setVatTuList={setVatTuList}
                currentKeyword={currentKeyword}
              />
            </div>
            <div className="search-actions">
              <Button
                type="primary"
                icon={<i className="pi pi-file-text"></i>}
                onClick={handlePrescriptionModal}
                className="prescription-search-btn"
                size="large"
              >
                Tìm đơn thuốc
              </Button>
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleUploadImage}
                style={{ display: "none" }}
              />
              <Button
                style={{ marginLeft: 12 }}
                icon={<i className="pi pi-upload"></i>}
                onClick={handleOpenFilePicker}
                size="large"
                loading={isUploading}
                disabled={isUploading}
              >
                {isUploading ? "Đang tải..." : "Upload ảnh"}
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Phần giỏ hàng và thanh toán */}
      <div className="pos-bottom-section">
        {/* Left side: Cart wrapper */}
        <div className="pos-left-wrapper">
          <div className="pos-cart-column">
            <CartTable
              cart={cart}
              removeAt={removeAt}
              updateLine={updateLine}
            />
          </div>
        </div>

        {/* Right side: Payment Summary */}
        <div className="pos-right-column">
          <PaymentSummary
            customer={customer}
            setCustomer={setCustomer}
            customerOpen={customerOpen}
            setCustomerOpen={setCustomerOpen}
            payment={payment}
            setPayment={setPayment}
            subtotal={subtotal}
            discount={discount}
            vat={vat}
            total={total}
            change={change}
            cart={cart}
            uploadedKeyFields={uploadedKeyFields}
            onClearCart={() => {
              setCart([]);
              setPayment({ method: "cash", cash: 0 });
              setCustomer({
                code: "",
                phone: "",
                name: "",
                idNumber: "",
                patientName: "",
              });
              setCustomerOpen(false);
              setUploadedKeyFields("");
              setUploadedImageUrl("");
              setCurrentOrderSttRec(""); // Clear stt_rec when clearing cart
            }}
            currentOrderSttRec={currentOrderSttRec}
            onUpdateCurrentOrderSttRec={setCurrentOrderSttRec}
          />
        </div>
      </div>

      {/* Fixed Tooltip at bottom left */}
      <div className="tool-tip">
        <div className="tool-tip-left">
          <Tooltip placement="top" title="Danh sách đơn">
            <Button className="default_button" onClick={handleOrderListModal}>
              <i className="pi pi-list sub_text_color"></i>
            </Button>
          </Tooltip>
          <Tooltip placement="top" title="Báo cáo kết ca">
            <Button className="default_button" onClick={handleReportModal}>
              <i className="pi pi-chart-line sub_text_color"></i>
            </Button>
          </Tooltip>
        </div>
        <div className="company-label">Designed by SSE</div>
      </div>

      <RetailOrderListModal
        isOpen={isOrderListModalOpen}
        onClose={handleOrderListModal}
        onLoadOrder={handleLoadOrderFromModal}
      />

      <ReportModal isOpen={isReportModalOpen} onClose={handleReportModal} />

      <PrescriptionModal
        isOpen={isPrescriptionModalOpen}
        onClose={handlePrescriptionModal}
        onApplyPrescription={(prescriptionItems) => {
          // Logic để áp dụng đơn thuốc vào giỏ hàng
          prescriptionItems.forEach((item) => {
            addToCart({
              sku: item.maThuoc,
              name: item.tenThuoc,
              price: item.gia || 0,
              unit: item.dvt || "viên",
              qty: item.slDuocBan || 1, // Sử dụng SL được bán
              batchExpiry: "",
              vatPercent: Number(item.thue_suat) || 0,
              ma_thue: (item.ma_thue || "").trim(),
              thue_suat: Number(item.thue_suat) || 0,
              remaining: 0,
              instructions: item.cachDung || "",
            });
          });
          setIsPrescriptionModalOpen(false);
        }}
      />

      <Modal
        title="Ảnh đã upload"
        open={isUploadPreviewOpen}
        onCancel={() => {
          setIsUploadPreviewOpen(false);
          try {
            if (localPreviewUrl && window.URL?.revokeObjectURL) {
              window.URL.revokeObjectURL(localPreviewUrl);
            }
          } catch (_) {}
        }}
        footer={[
          <Button key="reupload" onClick={() => {
            setIsUploadPreviewOpen(false);
            setTimeout(() => fileInputRef?.current?.click(), 0);
          }}>
            Tải lại ảnh
          </Button>,
          <Button key="close" type="primary" onClick={() => setIsUploadPreviewOpen(false)}>
            Đóng
          </Button>,
        ]}
      >
        {uploadedImageUrl || localPreviewUrl ? (
          <img
            alt="uploaded"
            src={uploadedImageUrl || localPreviewUrl}
            onError={(e) => {
              if (localPreviewUrl && e?.currentTarget?.src !== localPreviewUrl) {
                e.currentTarget.src = localPreviewUrl;
              }
            }}
            style={{ width: "100%", borderRadius: 6 }}
          />
        ) : (
          <div>Chưa có ảnh.</div>
        )}
      </Modal>
    </div>
  );
};

export default POS;
