import { Button, Card, Tooltip, notification } from "antd";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSelector } from "react-redux";
import { searchVatTu } from "../../api";
import VatTuSelectFullPOS from "../../components/common/ProductSelectFull/VatTuSelectFullPOS";
import ReportModal from "../../components/common/ReportModal/ReportModal";
import RetailOrderListModal from "../../components/common/RetailOrderListModal/RetailOrderListModal";
import "./POS.css";
import CartTable from "./components/CartTable";
import PaymentSummary from "./components/PaymentSummary";
import ReturnOrderModal from "./components/ReturnOrderModal";

const ReturnPOS = () => {
  // Lấy dữ liệu từ Redux store
  const { id: userId, unitId } = useSelector(
    (state) => state.claimsReducer.userInfo || {}
  );

  const [cart, setCart] = useState([]);
  const [customer, setCustomer] = useState({
    phone: "",
    name: "",
    idNumber: "",
    prescriptionCode: "",
    patientName: "",
    patientAddress: "",
    diagnosis: "",
    treatmentPeriod: "",
    prescribingDoctor: "",
    examinationFacility: "",
  });
  const [payment, setPayment] = useState({ method: "cash", cash: 0 });

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
  const [isReturnOrderModalOpen, setIsReturnOrderModalOpen] = useState(false);

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
              ma_kho: item.ma_kho || "",
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
        const itemTotalAfterDiscount = itemTotal - itemDiscount;
        const itemVat = Math.round(
          (itemTotalAfterDiscount * (x.vatPercent || 0)) / 100
        );
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
              ma_kho: item.ma_kho || "",
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
                ma_kho: foundItem.ma_kho || "",
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

  const handleReturnOrderModal = useCallback(() => {
    setIsReturnOrderModalOpen(!isReturnOrderModalOpen);
  }, [isReturnOrderModalOpen]);

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
                onClick={handleReturnOrderModal}
                className="prescription-search-btn"
                size="large"
              >
                Tìm đơn trả
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
            onClearCart={() => setCart([])}
          />
        </div>
      </div>

      {/* Fixed Tooltip at bottom left */}
      <div className="tool-tip">
        <div className="tool-tip-left">
          <Tooltip placement="top" title="Danh sách đơn trả">
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
      />

      <ReportModal isOpen={isReportModalOpen} onClose={handleReportModal} />

      <ReturnOrderModal
        isOpen={isReturnOrderModalOpen}
        onClose={handleReturnOrderModal}
        onApplyReturnOrder={(returnItems) => {
          // Logic để áp dụng đơn trả vào giỏ hàng
          returnItems.forEach((item) => {
            addToCart(item);
          });
          setIsReturnOrderModalOpen(false);
        }}
      />
    </div>
  );
};

export default ReturnPOS;
