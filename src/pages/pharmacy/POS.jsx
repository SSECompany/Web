import { Card, Typography, notification } from "antd";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createRetailOrder, searchVatTu } from "../../api";
import PaymentModal from "../../components/common/PaymentModal/PaymentModal";
import ProductSelectFull from "../../components/common/ProductSelectFull/ProductSelectFull";
import CartTable from "./components/CartTable";
import PaymentSummary from "./components/PaymentSummary";
import "./POS.css";

const { Title, Text } = Typography;

const POS = () => {
  const [cart, setCart] = useState([]);
  const [customer, setCustomer] = useState({
    phone: "",
    name: "",
    idNumber: "",
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

  // Load initial data when component mounts
  useEffect(() => {
    // Load initial product list when page loads
    const loadInitialData = async () => {
      setLoadingVatTu(true);
      try {
        const data = await searchVatTu("", 1, 20);

        // Transform API data to match ProductSelectFull format
        const transformedData = data.map((item) => ({
          value:
            item.value || item.ma_vt || item.sku || `ITEM1${Math.random()}`,
          label:
            item.label ||
            `${item.ten_vt || item.name || "Sản phẩm"} - ${
              item.ma_vt || item.sku || "N/A"
            }`,
          item: {
            sku:
              item.value || item.ma_vt || item.sku || `ITEM1${Math.random()}`,
            name: item.label || item.ten_vt || item.name || "Sản phẩm",
            price: item.gia || item.gia_ban || item.price || 0,
            unit: item.dvt || item.unit || "viên",
            stock: item.ton_kho || item.stock || 0,
          },
        }));

        setVatTuList(transformedData);
        setTotalPage(Math.max(1, Math.ceil(data.length / 20)));
        setCurrentKeyword("");
        setHasInitialData(true); // Set flag khi đã load data
      } catch (error) {
        console.error("Error loading initial data:", error);
        notification.error({
          message: "Lỗi tải danh sách sản phẩm",
          description: "Không thể tải danh sách sản phẩm từ server",
        });
        setVatTuList([]);
      } finally {
        setLoadingVatTu(false);
      }
    };

    loadInitialData();
  }, []); // Empty dependency array

  const subtotal = useMemo(
    () => cart.reduce((s, x) => s + x.price * x.qty, 0),
    [cart]
  );
  const discountAmount = useMemo(
    () =>
      cart.reduce((s, x) => s + ((x.discount || 0) / 100) * x.price * x.qty, 0),
    [cart]
  );
  const vat = useMemo(
    () => Math.round((subtotal - discountAmount) * 0.1),
    [subtotal, discountAmount]
  );
  const total = useMemo(
    () => Math.max(0, subtotal - discountAmount + vat),
    [subtotal, discountAmount, vat]
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
      setCart((prev) => [...prev, { ...item, qty: 1, discount: 0 }]);
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
      console.log("🔍 Fetching vat tu:", { keyword, page, append });
      setLoadingVatTu(true);
      try {
        // Call real API using searchVatTu
        const data = await searchVatTu(keyword, page, 20);
        console.log("📊 API response:", data);

        // Transform API data to match ProductSelectFull format
        const transformedData = data.map((item) => ({
          value:
            item.value ||
            item.ma_vt ||
            item.sku ||
            `ITEM${page}${Math.random()}`,
          label:
            item.label ||
            `${item.ten_vt || item.name || "Sản phẩm"} - ${
              item.ma_vt || item.sku || "N/A"
            }`,
          item: {
            sku:
              item.value ||
              item.ma_vt ||
              item.sku ||
              `ITEM${page}${Math.random()}`,
            name: item.label || item.ten_vt || item.name || "Sản phẩm",
            price: item.gia || item.gia_ban || item.price || 0,
            unit: item.dvt || item.unit || "viên",
            stock: item.ton_kho || item.stock || 0,
          },
        }));

        console.log("🔄 Transformed data:", transformedData);

        if (append) {
          setVatTuList((prev) => [...prev, ...transformedData]);
        } else {
          setVatTuList(transformedData);
        }

        // Calculate total pages based on data length
        setTotalPage(Math.max(1, Math.ceil(data.length / 20)));
        setCurrentKeyword(keyword);
      } catch (error) {
        console.error("Error fetching products:", error);
        notification.error({
          message: "Lỗi tải danh sách sản phẩm",
          description: "Không thể tải danh sách sản phẩm từ server",
        });
        // Fallback to empty array if API fails
        if (!append) {
          setVatTuList([]);
        }
      } finally {
        setLoadingVatTu(false);
      }
    },
    []
  );

  // Handle both Select choose and barcode submit from ProductSelectFull
  const handleVatTuSelect = useCallback(
    async (value, option) => {
      let selectedItem = option?.item;
      if (!selectedItem) {
        // value could be barcode/sku - try to get from current list
        const list = vatTuList.map((o) => o.item);
        selectedItem = list.find((x) => x.sku === value || x.value === value);

        // Nếu không tìm thấy trong danh sách, tạo item mới
        if (!selectedItem && typeof value === "string") {
          selectedItem = {
            sku: value,
            name: `Sản phẩm ${value}`,
            price: 0,
            unit: "cái",
            stock: 0,
          };
        }
      }

      if (selectedItem) {
        // Bỏ logic kiểm tra stock - cho phép add bất kỳ sản phẩm nào
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
    [vatTuList, addToCart] // Remove searchVatTu from dependencies to avoid circular dependency
  );

  const handleOpenPayment = () => {
    setPayModalOpen(true);
  };

  const handleConfirmPayment = async () => {
    try {
      // Create order payload for retail order
      const orderPayload = {
        tableId: "POS",
        storeId: "",
        status: "2",
        customer: {
          phone: customer.phone || "",
          name: customer.name || "",
          idNumber: customer.idNumber || "",
          address: "",
          email: "",
          taxCode: "",
          companyName: "",
        },
        items: cart.map((item, index) => ({
          name: item.name,
          sku: item.sku,
          ma_vt: item.sku,
          quantity: item.qty,
          qty: item.qty,
          price: item.price,
          note: "",
          uniqueId: `item_${Date.now()}_${index}`,
          voucher: "0",
        })),
        totals: {
          subtotal: subtotal,
          quantity: cart.reduce((sum, item) => sum + item.qty, 0),
          total: total,
        },
        payment: {
          method: payment.method === "cash" ? "tien_mat" : "chuyen_khoan",
          cash: payment.method === "cash" ? payment.cash : 0,
          transfer: payment.method === "transfer" ? payment.cash : 0,
        },
      };

      // Create order using createRetailOrder
      const orderResult = await createRetailOrder(orderPayload);

      if (orderResult) {
        notification.success({
          message: "Thành công",
          description: "Đơn hàng đã được tạo thành công",
        });

        // Reset form
        setCart([]);
        setPayment({ method: "cash", cash: 0 });
        setCustomer({
          phone: "",
          name: "",
          idNumber: "",
        });
        setPayModalOpen(false);
      }
    } catch (error) {
      console.error("Error creating order:", error);
      notification.error({
        message: "Lỗi tạo đơn hàng",
        description: "Không thể tạo đơn hàng. Vui lòng thử lại.",
      });
    }
  };

  return (
    <div className="pos-container">
      {/* Left Column - Product Management */}
      <div className="pos-left-column">
        {/* Search Section */}
        <Card
          size="small"
          title={
            <div className="search-title">
              <span>Tìm kiếm & Quét mã</span>
            </div>
          }
          className="search-card"
        >
          <ProductSelectFull
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
            hasInitialData={hasInitialData}
          />
        </Card>

        {/* Cart Table */}
        <CartTable cart={cart} removeAt={removeAt} updateLine={updateLine} />
      </div>

      {/* Right Column - Payment */}
      <div className="pos-right-column">
        <PaymentSummary
          customer={customer}
          setCustomer={setCustomer}
          customerOpen={customerOpen}
          setCustomerOpen={setCustomerOpen}
          payment={payment}
          setPayment={setPayment}
          subtotal={subtotal}
          discountAmount={discountAmount}
          vat={vat}
          total={total}
          change={change}
          cart={cart}
          onOpenPayment={handleOpenPayment}
          onClearCart={() => setCart([])}
        />
      </div>

      {/* Payment Modal */}
      <PaymentModal
        open={payModalOpen}
        onClose={() => setPayModalOpen(false)}
        onConfirm={handleConfirmPayment}
        total={total}
        change={change}
        payment={payment}
        setPayment={setPayment}
      />
    </div>
  );
};

export default POS;
