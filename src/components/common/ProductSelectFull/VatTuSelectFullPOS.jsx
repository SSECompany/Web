import { BarcodeOutlined } from "@ant-design/icons";
import { Button, Col, Input, Row, Select, Space, message } from "antd";
import { useEffect, useRef } from "react";

const VatTuSelectFullPOS = ({
  isEditMode = true,
  barcodeEnabled,
  setBarcodeEnabled,
  setBarcodeJustEnabled,
  vatTuInput,
  setVatTuInput,
  vatTuSelectRef,
  loadingVatTu,
  vatTuList,
  searchTimeoutRef,
  fetchVatTuList,
  handleVatTuSelect,
  totalPage = 1,
  pageIndex = 1,
  setPageIndex,
  setVatTuList,
  currentKeyword = "",
  onOpenQRScanner,
}) => {
  // Refs to prevent unnecessary API calls
  const dropdownOpenedRef = useRef(false);
  const lastSearchValueRef = useRef("");
  const focusTimeoutRef = useRef(null);
  const isProcessingRef = useRef(false);
  const lastProcessedBarcodeRef = useRef("");
  // Đảm bảo chỉ gọi fetchVatTuList("") 1 lần khi mount hoặc lần đầu mở dropdown
  const didInitRef = useRef(false);
  // Thêm ref để tránh gọi API scroll trùng lặp
  const isScrollingRef = useRef(false);
  const lastScrollPageRef = useRef(0);

  useEffect(() => {
    if (!didInitRef.current) {
      fetchVatTuList("", 1, false);
      didInitRef.current = true;
    }
  }, [fetchVatTuList]);

  // Auto focus khi chuyển sang chế độ barcode
  useEffect(() => {
    if (barcodeEnabled && vatTuSelectRef.current) {
      // Delay để đảm bảo DOM đã render
      focusTimeoutRef.current = setTimeout(() => {
        if (vatTuSelectRef.current) {
          vatTuSelectRef.current.focus();
          vatTuSelectRef.current.select();
        }
      }, 100);
    }
    return () => {
      if (focusTimeoutRef.current) {
        clearTimeout(focusTimeoutRef.current);
      }
    };
  }, [barcodeEnabled]);

  const handleSearch = (value) => {
    // Avoid duplicate searches
    if (lastSearchValueRef.current === value) {
      return;
    }
    lastSearchValueRef.current = value;

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      fetchVatTuList(value);
    }, 500);
  };

  const handleDropdownVisibleChange = (open) => {
    if (open) {
      // Always fetch full list when dropdown opens to ensure fresh data
      fetchVatTuList("");
      dropdownOpenedRef.current = true;
    } else {
      // Reset state when dropdown closes
      dropdownOpenedRef.current = false;
      lastSearchValueRef.current = "";
    }
  };

  const handleBarcodeInputChange = (e) => {
    const newValue = e.target.value;
    setVatTuInput(newValue);

    // Reset lastProcessedBarcodeRef when input is cleared
    if (!newValue || newValue.trim() === "") {
      lastProcessedBarcodeRef.current = null;
    }
  };

  const processBarcode = async (barcodeValue) => {
    // Prevent double processing
    if (isProcessingRef.current) {
      return;
    }

    // Allow reprocessing the same barcode after a delay
    const timeSinceLastProcess =
      Date.now() - (lastProcessedBarcodeRef.current?.timestamp || 0);
    if (
      lastProcessedBarcodeRef.current?.value === barcodeValue &&
      timeSinceLastProcess < 2000
    ) {
      return;
    }

    if (!barcodeValue || !barcodeValue.trim()) {
      return;
    }

    isProcessingRef.current = true;
    lastProcessedBarcodeRef.current = {
      value: barcodeValue,
      timestamp: Date.now(),
    };

    // Process the barcode
    try {
      const result = await handleVatTuSelect(barcodeValue);
      if (result === false) {
        // Báo lỗi và clear input sau 2 giây
        message.error("Thông tin vật tư không hợp lệ!");
        setTimeout(() => setVatTuInput(""), 2000);
      }
    } finally {
      setTimeout(() => {
        isProcessingRef.current = false;
      }, 1000);
    }
  };

  const handleBarcodeInputKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault(); // Prevent default to avoid form submission
      processBarcode(vatTuInput);
    }
  };

  const handleBarcodeInputKeyDown = (e) => {
    // Handle Enter key for tablet barcode scanners
    if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
      processBarcode(vatTuInput);
    }
  };

  const handleBarcodeInputBlur = () => {
    // Prevent blur on tablet by refocusing if still in barcode mode
    if (barcodeEnabled && vatTuSelectRef.current) {
      setTimeout(() => {
        if (barcodeEnabled && vatTuSelectRef.current) {
          vatTuSelectRef.current.focus();
        }
      }, 100);
    }
  };

  const handleBarcodeInputFocus = () => {
    // Ensure input is ready for barcode scanning
    if (vatTuSelectRef.current) {
      vatTuSelectRef.current.select();
    }
  };

  // Auto-submit when barcode is detected (for tablet scanners)
  useEffect(() => {
    if (barcodeEnabled && vatTuInput && vatTuInput.trim()) {
      // Check if input looks like a complete barcode (usually 8+ characters)
      if (vatTuInput.length >= 8) {
        const timer = setTimeout(() => {
          if (vatTuInput && vatTuInput.trim()) {
            processBarcode(vatTuInput);
          }
        }, 200); // Increased delay for tablet

        return () => clearTimeout(timer);
      }
    }
  }, [vatTuInput, barcodeEnabled]);

  // Xử lý scroll phân trang
  const handlePopupScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    if (
      scrollTop + clientHeight >= scrollHeight - 20 &&
      pageIndex < totalPage &&
      !loadingVatTu
    ) {
      // Gọi API trang tiếp theo, nối vào danh sách
      fetchVatTuList(currentKeyword, pageIndex + 1, true); // true: append
      if (setPageIndex) setPageIndex(pageIndex + 1);
    }
  };

  return (
    <>
      <Row gutter={16}>
        <Col span={24}>
          <Space.Compact style={{ width: "100%" }}>
            {!barcodeEnabled ? (
              <Select
                ref={vatTuSelectRef}
                showSearch
                placeholder="Chọn vật tư"
                optionFilterProp="children"
                loading={loadingVatTu}
                value={vatTuInput}
                onSearch={handleSearch}
                onSelect={handleVatTuSelect}
                onDropdownVisibleChange={handleDropdownVisibleChange}
                onPopupScroll={handlePopupScroll}
                filterOption={false}
                notFoundContent={
                  loadingVatTu ? "Đang tải..." : "Không tìm thấy"
                }
                style={{ width: "calc(100% - 40px)" }}
                disabled={!isEditMode}
                dropdownStyle={{ maxHeight: 300, overflow: "auto" }}
                getPopupContainer={(trigger) => trigger.parentNode}
              >
                {vatTuList.map((item) => (
                  <Select.Option key={item.value} value={item.value}>
                    <div>
                      <div style={{ fontWeight: "bold" }}>{item.value}</div>
                      <div style={{ fontSize: "12px", color: "#666" }}>
                        {item.label}
                      </div>
                    </div>
                  </Select.Option>
                ))}
              </Select>
            ) : (
              <Input
                ref={vatTuSelectRef}
                value={vatTuInput}
                onChange={handleBarcodeInputChange}
                onKeyPress={handleBarcodeInputKeyPress}
                onKeyDown={handleBarcodeInputKeyDown}
                onBlur={handleBarcodeInputBlur}
                onFocus={handleBarcodeInputFocus}
                placeholder="Quét barcode vật tư..."
                style={{ width: "calc(100% - 40px)" }}
                disabled={!isEditMode}
                autoFocus={barcodeEnabled}
                autoComplete="off"
                spellCheck={false}
                className="barcode-input"
                inputMode="text"
                pattern="[0-9A-Za-z]*"
                maxLength={50}
              />
            )}
            <Button
              icon={<BarcodeOutlined />}
              type={barcodeEnabled ? "primary" : "default"}
              onClick={() => {
                if (!isEditMode) return;

                if (barcodeEnabled) {
                  // Đang bật barcode -> tắt barcode
                  setBarcodeEnabled(false);
                  setVatTuInput("");
                  dropdownOpenedRef.current = false;
                  lastSearchValueRef.current = "";
                  isProcessingRef.current = false;
                  lastProcessedBarcodeRef.current = null;
                } else {
                  // Đang tắt barcode
                  if (onOpenQRScanner) {
                    // Có callback -> mở modal camera (phiếu nhặt hàng)
                    onOpenQRScanner();
                  } else {
                    // Không có callback -> bật barcode mode trực tiếp (POS)
                    setBarcodeEnabled(true);
                    setBarcodeJustEnabled(true);
                    setVatTuInput("");
                    dropdownOpenedRef.current = false;
                    lastSearchValueRef.current = "";
                    isProcessingRef.current = false;
                    lastProcessedBarcodeRef.current = null;
                  }
                }
              }}
              disabled={!isEditMode}
              title={
                onOpenQRScanner
                  ? barcodeEnabled
                    ? "Tắt chế độ barcode"
                    : "Mở camera quét mã"
                  : barcodeEnabled
                  ? "Tắt chế độ barcode"
                  : "Bật chế độ barcode"
              }
            />
          </Space.Compact>
        </Col>
      </Row>
    </>
  );
};

export default VatTuSelectFullPOS;
