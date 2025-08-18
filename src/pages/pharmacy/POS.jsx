import { Card, Typography } from "antd";
import React, { useCallback, useMemo, useRef, useState } from "react";
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

  // Fetch list for ProductSelectFull (mocked/demo)
  const fetchVatTuList = useCallback(
    async (keyword, page = 1, append = false) => {
      setLoadingVatTu(true);
      try {
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 300));

        // Mock data - replace with real API call
        const mockData = Array.from({ length: 10 }, (_, i) => ({
          value: `SKU${page}${i + 1}`,
          label: `Sản phẩm ${keyword || "demo"} ${page}${i + 1}`,
          item: {
            sku: `SKU${page}${i + 1}`,
            name: `Sản phẩm ${keyword || "demo"} ${page}${i + 1}`,
            price: Math.floor(Math.random() * 100000) + 10000,
            unit: "viên",
          },
        }));

        if (append) {
          setVatTuList((prev) => [...prev, ...mockData]);
        } else {
          setVatTuList(mockData);
        }
        setTotalPage(3); // Mock total pages
        setCurrentKeyword(keyword);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoadingVatTu(false);
      }
    },
    []
  );

  // Handle both Select choose and barcode submit from ProductSelectFull
  const handleVatTuSelect = useCallback(
    (value, option) => {
      let selectedItem = option?.item;
      if (!selectedItem) {
        // value could be barcode/sku
        const list = vatTuList.map((o) => o.item);
        selectedItem = list.find((x) => x.sku === value);
      }
      if (!selectedItem && typeof value === "string") {
        // fallback demo item by sku/barcode
        selectedItem = {
          sku: value,
          name: `Sản phẩm ${value}`,
          price: Math.floor(Math.random() * 100000) + 10000,
          unit: "viên",
        };
      }
      if (selectedItem) {
        addToCart(selectedItem);
        setVatTuInput("");
        return true;
      }
      return false;
    },
    [vatTuList, addToCart]
  );

  const handleOpenPayment = () => {
    setPayModalOpen(true);
  };

  const handleConfirmPayment = () => {
    const order = {
      customer,
      items: cart,
      totals: { subtotal, discountAmount, vat, total },
      payment: { method: payment.method, cash: payment.cash, change },
    };
    console.log("Submit order:", order);
    setPayModalOpen(false);
    // Reset demo
    setCart([]);
    setPayment({ method: "cash", cash: 0 });
    setCustomer({
      phone: "",
      name: "",
      idNumber: "",
    });
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
