import { QrcodeOutlined } from "@ant-design/icons";
import { Button, Col, Input, Row, Select, message } from "antd";
import { useEffect, useRef, useState } from "react";
import QRScanner from "../QRScanner/QRScanner";

const VatTuSelectFull = ({
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
}) => {
  // Refs to prevent unnecessary API calls
  const dropdownOpenedRef = useRef(false);
  const lastSearchValueRef = useRef("");
  const focusTimeoutRef = useRef(null);
  const isProcessingRef = useRef(false);
  const lastProcessedBarcodeRef = useRef("");
  // Đảm bảo chỉ gọi fetchVatTuList("") 1 lần khi mount hoặc lần đầu mở dropdown
  const didInitRef = useRef(false);
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);

  useEffect(() => {
    if (!didInitRef.current) {
      fetchVatTuList("", 1, false);
      didInitRef.current = true;
    }
  }, [fetchVatTuList]);

  // Auto focus khi chuyển sang chế độ barcode
  useEffect(() => {
    if (barcodeEnabled && vatTuSelectRef.current) {
      // Clear any existing timeout
      if (focusTimeoutRef.current) {
        clearTimeout(focusTimeoutRef.current);
      }

      // Use longer delay for tablet
      focusTimeoutRef.current = setTimeout(() => {
        if (vatTuSelectRef.current) {
          vatTuSelectRef.current.focus();
          // Force focus again after a short delay to ensure it works on tablet
          setTimeout(() => {
            if (vatTuSelectRef.current) {
              vatTuSelectRef.current.focus();
            }
          }, 50);
        }
      }, 200);
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
      if (setPageIndex) setPageIndex(1);
      fetchVatTuList(value, 1, false); // reset page, không append
    }, 500);
  };

  const handleDropdownVisibleChange = (open) => {
    if (open && !dropdownOpenedRef.current) {
      // Chỉ gọi lại nếu chưa từng mở dropdown (đã gọi ở useEffect rồi)
      dropdownOpenedRef.current = true;
    } else if (!open) {
      // Reset state khi đóng dropdown
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

  // QR Scanner handlers
  const handleQRScannerOpen = () => {
    // Đăng ký callback để chuyển đổi mode barcode
    window.triggerBarcodeMode = () => {
      // Chỉ chuyển sang mode barcode nếu đang ở mode select
      if (!barcodeEnabled) {
        setBarcodeEnabled(true);
        setBarcodeJustEnabled(true);
        setVatTuInput("");
        dropdownOpenedRef.current = false;
        lastSearchValueRef.current = "";
        // Reset processing flags
        isProcessingRef.current = false;
        lastProcessedBarcodeRef.current = null;
      }
    };
    setIsQRScannerOpen(true);
  };

  const handleQRScannerClose = () => {
    setIsQRScannerOpen(false);
  };

  const handleQRScanSuccess = (decodedText, decodedResult) => {
    // Tự động tìm kiếm sản phẩm với mã QR đã quét
    if (decodedText && decodedText.trim()) {
      setVatTuInput(decodedText.trim());
      handleVatTuSelect(decodedText.trim());
    }
  };

  return (
    <>
      <Row gutter={16}>
        <Col span={24}>
          <Input.Group compact>
            {!barcodeEnabled ? (
              <Select
                ref={vatTuSelectRef}
                value={vatTuInput}
                onChange={setVatTuInput}
                allowClear
                showSearch
                loading={loadingVatTu}
                placeholder="Tìm kiếm hoặc chọn vật tư"
                style={{ width: "calc(100% - 40px)" }}
                options={vatTuList}
                onSearch={handleSearch}
                onDropdownVisibleChange={handleDropdownVisibleChange}
                filterOption={false}
                onSelect={handleVatTuSelect}
                disabled={!isEditMode}
                dropdownClassName="vat-tu-dropdown"
                popupMatchSelectWidth={true}
                showArrow={true}
                optionFilterProp="label"
                notFoundContent={loadingVatTu ? "Đang tải..." : "Không tìm thấy"}
                onPopupScroll={handlePopupScroll}
              />
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
              icon={<QrcodeOutlined />}
              type={barcodeEnabled ? "primary" : "default"}
              onClick={() => {
                if (!isEditMode) {
                  return;
                }
                if (barcodeEnabled) {
                  // Nếu đang ở mode barcode, click để tắt mode barcode
                  setBarcodeEnabled(false);
                  setVatTuInput("");
                  dropdownOpenedRef.current = false;
                  lastSearchValueRef.current = "";
                  // Reset processing flags
                  isProcessingRef.current = false;
                  lastProcessedBarcodeRef.current = null;
                } else {
                  // Nếu đang ở mode select, mở QR Scanner
                  handleQRScannerOpen();
                }
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                if (!isEditMode) {
                  return;
                }
                // Right click để toggle barcode mode (giữ nguyên chức năng ban đầu)
                setBarcodeEnabled((prev) => {
                  const next = !prev;
                  if (next) {
                    setBarcodeJustEnabled(true);
                    setVatTuInput("");
                    dropdownOpenedRef.current = false;
                    lastSearchValueRef.current = "";
                    // Reset processing flags
                    isProcessingRef.current = false;
                    lastProcessedBarcodeRef.current = null;
                  }
                  return next;
                });
              }}
              disabled={!isEditMode}
              title={
                barcodeEnabled
                  ? "Click: Tắt mode barcode | Right-click: Chuyển đổi mode"
                  : "Click: Quét QR/Camera | Right-click: Chuyển đổi mode barcode"
              }
            />
          </Input.Group>
        </Col>
      </Row>

      <QRScanner
        isOpen={isQRScannerOpen}
        onClose={handleQRScannerClose}
        onScanSuccess={handleQRScanSuccess}
        onSwitchToBarcode={() => {
          if (window.triggerBarcodeMode) {
            window.triggerBarcodeMode();
          }
        }}
      />
    </>
  );
};

export default VatTuSelectFull;
