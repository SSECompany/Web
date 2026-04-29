import { BarcodeOutlined } from "@ant-design/icons";
import { Button, Col, Input, Row, Select, Space, message, Spin } from "antd";
import { useEffect, useRef, useState } from "react";

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
  disableSearch = false,
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
  // State để track xem có đang search không (cho Enter key handling)
  const [isSearching, setIsSearching] = useState(false);
  const [isWaitingForEnter, setIsWaitingForEnter] = useState(false); // Track khi đang chờ Enter key
  const pendingEnterValueRef = useRef(null);
  const searchPromiseRef = useRef(null);

  useEffect(() => {
    if (!didInitRef.current) {
      fetchVatTuList("", 1, false);
      didInitRef.current = true;
    }
    
    // Cleanup on unmount
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      if (focusTimeoutRef.current) {
        clearTimeout(focusTimeoutRef.current);
      }
    };
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

  const handleSearch = (value, immediate = false) => {
    const trimmedValue = value?.trim() || "";
    
    // Avoid duplicate searches only if:
    // 1. Not immediate mode
    // 2. The value is exactly the same as last search
    // 3. There's a valid search promise AND we're currently searching
    // This allows re-searching the same value if dropdown was closed and reopened
    // or if the previous search has completed
    if (!immediate && lastSearchValueRef.current === trimmedValue && isSearching && searchPromiseRef.current) {
      // Only skip if search is currently in progress
      return searchPromiseRef.current || Promise.resolve();
    }
    
    // If immediate and there's a pending search with different value, we need to wait for it or cancel
    if (immediate && isSearching && lastSearchValueRef.current !== trimmedValue && searchPromiseRef.current) {
      // Wait for current search to complete first, then start new one
      return searchPromiseRef.current.then(() => {
        return handleSearch(trimmedValue, true);
      });
    }
    
    // If keyword changed, clear old data immediately
    if (lastSearchValueRef.current !== trimmedValue) {
      // Clear old data when starting new search
      setVatTuList([]);
    }
    
    lastSearchValueRef.current = trimmedValue;

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = null;
    }
    
    // Clear pending Enter value if search keyword changes
    if (pendingEnterValueRef.current !== null && pendingEnterValueRef.current !== trimmedValue) {
      pendingEnterValueRef.current = null;
      setIsWaitingForEnter(false);
    }

    // Only set searching state when actually calling API (not during debounce)
    // For immediate searches, set searching right away
    if (immediate) {
      setIsSearching(true);
    }
    // For debounced searches, we'll set searching when the timeout fires

    // Create a promise that resolves when search completes (including debounce + API call)
    let resolvePromise;
    const debounceTime = immediate ? 0 : 500; // No debounce if immediate
    
    searchPromiseRef.current = new Promise((resolve) => {
      resolvePromise = resolve;
      searchTimeoutRef.current = setTimeout(async () => {
        // Set searching state when actually calling API (after debounce)
        if (!immediate) {
          setIsSearching(true);
        }
        try {
          // Reset page to 1 when starting new search
          if (setPageIndex) {
            setPageIndex(1);
          }
          // Call API with proper parameters: keyword, page, append
          await fetchVatTuList(trimmedValue, 1, false);
        } catch (error) {
          console.error("Error in handleSearch:", error);
        } finally {
          setIsSearching(false);
          setIsWaitingForEnter(false);
          // If there's a pending Enter key with matching value, process it now
          if (pendingEnterValueRef.current !== null && pendingEnterValueRef.current === trimmedValue) {
            const pendingValue = pendingEnterValueRef.current;
            pendingEnterValueRef.current = null;
            // Small delay to ensure list is updated
            setTimeout(() => {
              handleVatTuSelect(pendingValue);
            }, 100);
          }
          resolvePromise();
        }
      }, debounceTime);
    });
    
    return searchPromiseRef.current;
  };

  const handleDropdownVisibleChange = (open) => {
    if (open) {
      // Always fetch full list when dropdown opens to ensure fresh data
      // Clear any pending search operations
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = null;
      }
      setIsSearching(false);
      setIsWaitingForEnter(false);
      pendingEnterValueRef.current = null;
      // Reset lastSearchValueRef to ensure fresh search state when dropdown opens
      lastSearchValueRef.current = "";
      // Reset searchPromiseRef to allow new searches
      searchPromiseRef.current = null;
      // Clear input value when dropdown opens to ensure onSearch is triggered on new input
      // This fixes the issue where onSearch doesn't fire on second open if input has value
      // Use setTimeout to ensure the clear happens after dropdown is fully opened
      setTimeout(() => {
        if (vatTuInput) {
          setVatTuInput("");
        }
      }, 0);
      fetchVatTuList("", 1, false);
      dropdownOpenedRef.current = true;
    } else {
      // Reset state when dropdown closes
      dropdownOpenedRef.current = false;
      lastSearchValueRef.current = "";
      setIsSearching(false);
      setIsWaitingForEnter(false);
      pendingEnterValueRef.current = null;
      // Reset searchPromiseRef when closing
      searchPromiseRef.current = null;
      // Clear any pending search timeout
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = null;
      }
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
              <div style={{ position: "relative", width: "calc(100% - 40px)" }}>
                {(loadingVatTu || isSearching) && (
                  <div
                    style={{
                      position: "absolute",
                      right: "8px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      zIndex: 10,
                      pointerEvents: "none",
                    }}
                  >
                    <Spin size="small" />
                  </div>
                )}
                <Select
                  ref={vatTuSelectRef}
                  showSearch={!disableSearch}
                  placeholder={disableSearch ? "Chỉ quét camera" : (isSearching ? "Đang tìm kiếm..." : "Chọn vật tư")}
                  optionFilterProp="children"
                  loading={loadingVatTu || isSearching}
                  value={vatTuInput}
                  onSearch={disableSearch ? undefined : handleSearch}
                  onSelect={(value, option) => {
                    if (disableSearch) {
                      message.warning("Chỉ cho phép quét camera. Vui lòng sử dụng nút camera để quét mã.");
                      return;
                    }
                    // Block select if currently searching (waiting for API)
                    if (isSearching) {
                      message.warning("Vui lòng đợi kết quả tìm kiếm...");
                      return;
                    }
                    // Only allow select if we have data and it matches current search
                    if (vatTuList.length === 0) {
                      message.warning("Vui lòng đợi kết quả tìm kiếm...");
                      return;
                    }
                    handleVatTuSelect(value, option);
                  }}
                  onOpenChange={disableSearch ? undefined : handleDropdownVisibleChange}
                  onPopupScroll={handlePopupScroll}
                  filterOption={false}
                  notFoundContent={
                    disableSearch ? (
                      <div style={{ padding: "8px", textAlign: "center" }}>
                        Vui lòng sử dụng camera để quét mã
                      </div>
                    ) : loadingVatTu || isSearching ? (
                      <div style={{ padding: "8px", textAlign: "center" }}>
                        <Spin size="small" /> <span style={{ marginLeft: 8 }}>Đang tìm kiếm...</span>
                      </div>
                    ) : vatTuList.length === 0 ? (
                      <div style={{ padding: "8px", textAlign: "center" }}>
                        <Spin size="small" /> <span style={{ marginLeft: 8 }}>Đang tìm kiếm...</span>
                      </div>
                    ) : (
                      "Không tìm thấy"
                    )
                  }
                onKeyDown={async (e) => {
                  if (disableSearch) {
                    e.preventDefault();
                    message.warning("Chỉ cho phép quét camera. Vui lòng sử dụng nút camera để quét mã.");
                    return;
                  }
                  // Handle Enter key - wait for search to complete if searching
                  if (e.key === "Enter" && vatTuInput && vatTuInput.trim()) {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    const trimmedValue = vatTuInput.trim();
                    
                    // Block Enter if currently searching (waiting for API)
                    if (isSearching && searchPromiseRef.current) {
                      // There's a search in progress (API call)
                      pendingEnterValueRef.current = trimmedValue;
                      setIsWaitingForEnter(true);
                      try {
                        // Wait for the entire search process to complete (debounce + API)
                        await searchPromiseRef.current;
                        // The search completion handler will process the pending value
                      } catch (error) {
                        console.error("Error waiting for search:", error);
                        // If search fails, clear pending
                        pendingEnterValueRef.current = null;
                        setIsWaitingForEnter(false);
                        message.warning("Tìm kiếm thất bại, vui lòng thử lại");
                      }
                      return;
                    }
                    
                    // Block Enter if list is empty and we haven't searched yet
                    // This means user is trying to select before search completes
                    if (vatTuList.length === 0 && trimmedValue !== currentKeyword) {
                      // Trigger search immediately (no debounce) and wait for it
                      pendingEnterValueRef.current = trimmedValue;
                      setIsWaitingForEnter(true);
                      try {
                        await handleSearch(trimmedValue, true);
                        // The search completion handler will process the pending value
                      } catch (error) {
                        console.error("Error in search after Enter:", error);
                        pendingEnterValueRef.current = null;
                        setIsWaitingForEnter(false);
                        message.warning("Tìm kiếm thất bại, vui lòng thử lại");
                      }
                      return;
                    }
                    
                    // If not searching and list has data, check if value exists in current list
                    const existsInList = vatTuList.some(
                      (item) => item.value === trimmedValue || 
                                item.item?.sku === trimmedValue
                    );
                    
                    if (existsInList) {
                      // Value exists, select it immediately
                      handleVatTuSelect(trimmedValue);
                    } else {
                      // Value doesn't exist, trigger search immediately (no debounce)
                      pendingEnterValueRef.current = trimmedValue;
                      setIsWaitingForEnter(true);
                      try {
                        // Trigger search immediately (no debounce) and wait for it
                        await handleSearch(trimmedValue, true);
                        // The search completion handler will process the pending value
                      } catch (error) {
                        console.error("Error in search after Enter:", error);
                        pendingEnterValueRef.current = null;
                        setIsWaitingForEnter(false);
                        message.warning("Tìm kiếm thất bại, vui lòng thử lại");
                      }
                    }
                  }
                }}
                  style={{ width: "100%" }}
                  disabled={!isEditMode || disableSearch || (isSearching && isWaitingForEnter)}
                  styles={{
                    popup: {
                      root: { maxHeight: 300, overflow: "auto" },
                    },
                  }}
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
              </div>
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
