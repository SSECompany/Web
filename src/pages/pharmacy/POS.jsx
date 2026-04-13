import { Button, Card, Modal, Tooltip, notification } from "antd";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSelector } from "react-redux";
import { searchVatTu, uploadPrescriptionImage } from "../../api";
import { compressImage } from "../../utils/imageCompression";
import VatTuSelectFullPOS from "../../components/common/ProductSelectFull/VatTuSelectFullPOS";

import ReportModal from "../../components/common/ReportModal/ReportModal";
import RetailOrderListModal from "../../components/common/RetailOrderListModal/RetailOrderListModal";
import "./POS.css";
import CartTable from "./components/CartTable";
import PaymentSummary from "./components/PaymentSummary";
import PrescriptionModal from "./components/PrescriptionModal";

const POS = () => {
  // Lấy dữ liệu từ Redux store
  const { id: userId, unitId, unitName } = useSelector(
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
  // Lưu mã đơn thuốc quốc gia đã áp dụng (nếu có)
  const [activePrescriptionCode, setActivePrescriptionCode] = useState("");
  const revokeObjectUrl = useCallback((url) => {
    try {
      if (url && window.URL?.revokeObjectURL) {
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.warn("Failed to revoke object URL", error);
    }
  }, []);
  useEffect(() => {
    return () => {
      revokeObjectUrl(localPreviewUrl);
    };
  }, [localPreviewUrl, revokeObjectUrl]);

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
    setLocalPreviewUrl((prev) => {
      revokeObjectUrl(prev);
      return "";
    });
    setUploadedImageUrl("");
    setIsUploadPreviewOpen(false);

    try {
      notification.open({
        message: "Đang nén ảnh...",
        description: "Vui lòng đợi trong giây lát",
        key: loadingKey,
      });

      // Compress and convert to WebP
      const compressedFile = await compressImage(selectedFile, {
        maxWidth: 1200,
        maxHeight: 1200,
        quality: 0.7,
        format: "image/webp",
      });

      notification.open({
        message: "Đang tải ảnh lên server...",
        description: "Vui lòng đợi",
        duration: 0,
        key: loadingKey,
      });

      const fileToUpload = compressedFile || selectedFile;

      // Ensure we have a file to upload
      if (!fileToUpload) {
        console.error("No file to upload after processing");
        throw new Error("Không có file để upload");
      }

      const previewUrl =
        window.URL?.createObjectURL?.(fileToUpload) ||
        window.webkitURL?.createObjectURL?.(fileToUpload);
      if (previewUrl) {
        setLocalPreviewUrl((prev) => {
          revokeObjectUrl(prev);
          return previewUrl;
        });
      }

      const res = await uploadPrescriptionImage({
        file: fileToUpload,
        slug: (customer?.code || "").trim() || "KVL",
      });

      // Close loading notification
      notification.destroy(loadingKey);

      if (res?.success) {
        // Only show preview and success message after API succeeds
        setUploadedImageUrl(res?.data?.url || "");
        setUploadedKeyFields(res?.data?.keyFields || "");
        notification.success({
          message: "Tải ảnh thành công",
          description: "Ảnh đã được tải lên thành công",
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
              stock: item.ton13 || 0,
              ma_kho: item.ma_kho || "",
              ton13: item.ton13,
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

  const subtotal = useMemo(() => {
    // Tạm tính = Tổng (Tiền trước V)
    return cart.reduce((s, x) => s + Number(x.thanh_tien || (x.price * (x.qty || 1))), 0);
  }, [cart]);

  const discount = useMemo(() => {
    return cart.reduce((s, x) => s + Number(x.discountAmount || 0), 0);
  }, [cart]);

  const vat = useMemo(() => {
    // Tổng tiền thuế đã được tính lẻ từng dòng theo logic ERP
    return cart.reduce((s, x) => s + Number(x.thue_nt || 0), 0);
  }, [cart]);

  const total = useMemo(() => {
    // Tổng cộng = Tổng(giá niêm yết * số lượng) - Tổng(chiết khấu)
    // Phải khớp từng đơn vị (round error) với cột TỔNG TIỀN trên UI
    return cart.reduce((s, x) => {
      const lineTotalAfterVAT = Number(x.thanh_tien_sau_vat || ((x.listPrice || x.price || 0) * (x.qty || 1)));
      const lineDiscount = Number(x.discountAmount || 0);
      return s + (lineTotalAfterVAT - lineDiscount);
    }, 0);
  }, [cart]);
  const change = useMemo(
    () => Math.max(0, (payment.cash || 0) - total),
    [payment.cash, total]
  );

  const addToCart = useCallback((item, ma_gd = null) => {
    const existingIndex = cart.findIndex((x) => x.sku === item.sku);
    if (existingIndex >= 0) {
      setCart((prev) =>
        prev.map((x, i) => {
          if (i === existingIndex) {
            const nextQty = (x.qty || 1) + 1;
            const totalAfterVAT = Math.round(x.listPrice * nextQty);
            const totalBeforeVAT = Math.round(totalAfterVAT / (1 + x.thue_suat / 100));
            const vatAmountTotal = totalAfterVAT - totalBeforeVAT;
            const remaining = totalAfterVAT - (x.discountAmount || 0);

            return {
              ...x,
              qty: nextQty,
              thanh_tien: totalBeforeVAT,
              thue_nt: vatAmountTotal,
              thanh_tien_sau_vat: totalAfterVAT,
              remaining: remaining,
            };
          }
          return x;
        })
      );
    } else {
      const listPrice = item.price || 0;
      const qty = 1;
      const thue_suat = (item.thue_suat !== null && item.thue_suat !== undefined && item.thue_suat !== "") ? Number(item.thue_suat) : undefined;
      
      // Calculations matching CartTable.jsx logic
      const totalAfterVAT = Math.round(listPrice * qty);
      const totalBeforeVAT = Math.round(totalAfterVAT / (1 + thue_suat / 100));
      const vatAmountTotal = totalAfterVAT - totalBeforeVAT;
      const priceBeforeVAT = Math.round(listPrice / (1 + thue_suat / 100));

      setCart((prev) => [
        ...prev,
        {
          ...item,
          listPrice: listPrice,
          price: priceBeforeVAT,
          qty: qty,
          batchExpiry: "",
          vatPercent: thue_suat,
          ma_thue: (item.ma_thue || "").trim() || undefined,
          thue_suat: thue_suat,
          discountPercent: 0,
          discountAmount: 0,
          thanh_tien: totalBeforeVAT,
          thue_nt: vatAmountTotal,
          thanh_tien_sau_vat: totalAfterVAT,
          remaining: totalAfterVAT,
          instructions: (item.instructions || item.ghi_chu || "").trim(),
          ghi_chu: (item.ghi_chu || item.instructions || "").trim(),
          ma_gd: ma_gd !== null ? ma_gd : (item.ma_gd || null),
        },
      ]);
    }
  }, [cart]);

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
              stock: item.ton13 || 0,
              ma_thue: (item.ma_thue || "").trim() || undefined,
              thue_suat: (item.thue_suat !== null && item.thue_suat !== undefined && item.thue_suat !== "") ? Number(item.thue_suat) : undefined,
              image: item.image || "",
              ma_kho: item.ma_kho || "",
              ton13: item.ton13,
            },
            // Giữ thêm trường image ở root để tiện dùng
            image: item.image || "",
            ...item,
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
          // Chỉ tìm kiếm API nếu không tìm thấy trong list hiện tại
          // Điều này xảy ra khi người dùng nhập mã trực tiếp mà không có trong kết quả search
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
                stock: foundItem.ton13 || 0,
                ma_thue: (foundItem.ma_thue || "").trim() || undefined,
                thue_suat: (foundItem.thue_suat !== null && foundItem.thue_suat !== undefined && foundItem.thue_suat !== "") ? Number(foundItem.thue_suat) : undefined,
                ma_kho: foundItem.ma_kho || "",
                ton13: foundItem.ton13,
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
        addToCart(selectedItem, 1); // ma_gd = 1 cho vật tư từ thanh tìm kiếm
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
      const mappedCart = (detail || []).map((d) => {
        const qty = Number(d.so_luong) || 1;
        const listPrice = Number(d.listPrice) || Number(d.don_gia) || 0;
        const thue_suat = (d.thue_suat !== null && d.thue_suat !== undefined && d.thue_suat !== "") ? Number(d.thue_suat) : undefined;
        
        // Recompute standard fields for POS UI consistency
        const totalAfterVAT = Math.round(listPrice * qty);
        const totalBeforeVAT = Math.round(totalAfterVAT / (1 + thue_suat / 100));
        const vatAmountTotal = totalAfterVAT - totalBeforeVAT;
        const discountAmount = Number(d.ck_nt || d.ck || 0);
        const remaining = totalAfterVAT - discountAmount;

        return {
          sku: (d.ma_vt || "").trim(),
          name: (d.ten_vt || "").trim(),
          price: Number(d.don_gia_nt || d.don_gia) || 0, // Giá trước v
          unit: (d.dvt || "").trim(),
          qty: qty,
          listPrice: listPrice,
          batchExpiry: (d.ma_lo || "").trim(),
          vatPercent: thue_suat,
          ma_thue: (d.ma_thue || "").trim() || undefined,
          thue_suat: thue_suat,
          thue_nt: vatAmountTotal, // Ưu tiên recompute hoặc dùng d.thue_nt? Recompute tốt hơn cho đồng bộ UI
          discountPercent: Number(d.tl_ck) || 0,
          discountAmount: discountAmount,
          thanh_tien: totalBeforeVAT,
          thanh_tien_sau_vat: totalAfterVAT,
          remaining: remaining,
          instructions: (d.ghi_chu || "").trim(),
          ghi_chu: (d.ghi_chu || "").trim(),
          ma_gd: d.ma_gd !== undefined ? Number(d.ma_gd) : null,
        };
      });

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
              {unitName && (
                <div className="pos-unit-indicator">
                  <strong>{unitName}</strong>
                </div>
              )}
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
                disabled={true}
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
              currentOrderSttRec={currentOrderSttRec}
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
            prescriptionCode={activePrescriptionCode}
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
              setActivePrescriptionCode("");
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
          {/* <Tooltip placement="top" title="Báo cáo kết ca">
            <Button className="default_button" onClick={handleReportModal}>
              <i className="pi pi-chart-line sub_text_color"></i>
            </Button>
          </Tooltip> */}
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
        onApplyPrescription={(prescriptionItems, info) => {
          // Logic để áp dụng đơn thuốc vào giỏ hàng
          setActivePrescriptionCode(info?.maDonThuoc || "");
          
          // Cập nhật thông tin khách hàng từ đơn thuốc quốc gia
          if (info) {
            setCustomer((prevCustomer) => ({
              ...prevCustomer,
              // Cập nhật thông tin khách hàng từ đơn thuốc
              name: info.hoTenBenhNhan || info.tenKhachHang || prevCustomer.name || "",
              phone: info.soDienThoaiNguoiKhamBenh || prevCustomer.phone || "",
              idNumber: info.maDinhDanhYTe || prevCustomer.idNumber || "",
              patientName: info.hoTenBenhNhan || prevCustomer.patientName || "",
            }));
          }
          
          prescriptionItems.forEach((item) => {
            const note = (
              item.ghi_chu ||
              item.ghiChu ||
              item.chi_dan ||
              item.chiDan ||
              item.note ||
              item.cachDung ||
              ""
            ).trim();
            
            // ma_vt: mã vật tư từ danh mục đã chọn (nếu có), nếu không có thì dùng từ đơn thuốc quốc gia
            // ma_vt_dtqg: mã thuốc từ đơn thuốc quốc gia (luôn lấy từ maThuoc)
            const ma_vt = item.selectedMedicineCode || item.maThuoc; // Mã vật tư từ danh mục
            const ma_vt_dtqg = item.maThuoc || ""; // Mã thuốc từ đơn thuốc quốc gia
            const name = item.selectedMedicineName || item.tenThuoc;
            const unit = item.selectedMedicineUnit || item.dvt || "viên";
            const price = item.selectedMedicinePrice > 0 ? item.selectedMedicinePrice : (item.gia || 0);
            
            addToCart({
              sku: ma_vt, // ma_vt: mã từ danh mục đã chọn
              name: name,
              price: price,
              unit: unit,
              qty: item.slDuocBan || 1, // Sử dụng SL được bán
              batchExpiry: "",
              vatPercent: (item.thue_suat !== null && item.thue_suat !== undefined && item.thue_suat !== "") ? Number(item.thue_suat) : undefined,
              ma_thue: (item.ma_thue || "").trim() || undefined,
              thue_suat: (item.thue_suat !== null && item.thue_suat !== undefined && item.thue_suat !== "") ? Number(item.thue_suat) : undefined,
              remaining: 0,
              instructions: note,
              ghi_chu: note,
              // Đánh dấu và giữ lại các field từ Đơn thuốc QG để map sang payload
              isFromDonThuocQG: true,
              ma_vt_dtqg: ma_vt_dtqg, // Mã thuốc từ đơn thuốc quốc gia
              ten_vt_dtqg: item.ten_vt_dtqg || "",
              so_luong_dtqg: item.so_luong_dtqg || "",
              lieu_dung: item.lieu_dung || note,
              biet_duoc: item.biet_duoc || "",
            }, 2); // ma_gd = 2 cho vật tư từ đơn thuốc quốc gia
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
          <Button
            key="reupload"
            onClick={() => {
              setIsUploadPreviewOpen(false);
              setTimeout(() => fileInputRef?.current?.click(), 0);
            }}
          >
            Tải lại ảnh
          </Button>,
          <Button
            key="close"
            type="primary"
            onClick={() => setIsUploadPreviewOpen(false)}
          >
            Đóng
          </Button>,
        ]}
      >
        {uploadedImageUrl || localPreviewUrl ? (
          <img
            alt="uploaded"
            src={uploadedImageUrl || localPreviewUrl}
            onError={(e) => {
              if (
                localPreviewUrl &&
                e?.currentTarget?.src !== localPreviewUrl
              ) {
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
