import { QrcodeOutlined } from "@ant-design/icons";
import { Button, Col, Form, Input, Row, Select } from "antd";
import { useEffect, useRef, useState } from "react";
import QRScanner from "../../../common/QRScanner/QRScanner";

const VatTuInputSection = ({
  isEditMode,
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
  const [hiddenBarcode, setHiddenBarcode] = useState("");
  const hiddenInputRef = useRef();
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);

  // Auto focus khi chuyển sang chế độ barcode
  useEffect(() => {
    // KHÔNG focus input khi barcodeEnabled để tránh bật bàn phím ảo
    return () => {
      if (focusTimeoutRef.current) {
        clearTimeout(focusTimeoutRef.current);
      }
    };
  }, [barcodeEnabled]);

  useEffect(() => {
    if (barcodeEnabled && hiddenInputRef.current) {
      hiddenInputRef.current.focus();
    }
  }, [barcodeEnabled]);

  const handleHiddenInput = (e) => {
    const value = e.target.value;
    if (value && value.length > 0) {
      processBarcode(value);
      setHiddenBarcode(""); // clear ngay sau khi scan
    }
  };

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
    // Nếu trước đó có lỗi (ví dụ: không tìm thấy vật tư), hoặc mỗi lần scan mới thì clear input trước
    if (vatTuInput && vatTuInput !== newValue) {
      setVatTuInput(""); // Clear input trước khi nhập mã mới
    }
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
      // Gọi handleVatTuSelect với đầy đủ tham số để setVatTuInput hoạt động
      const result = await handleVatTuSelect(
        barcodeValue,
        isEditMode,
        fetchVatTuDetail,
        fetchDonViTinh,
        setVatTuInput,
        setVatTuList,
        fetchVatTuList,
        vatTuSelectRef
      );
      // Nếu handleVatTuSelect trả về false hoặc lỗi, clear input
      if (result === false) {
        setVatTuInput("");
        setHiddenBarcode(""); // Force re-render input ẩn
      }
    } catch (err) {
      setVatTuInput("");
      setHiddenBarcode(""); // Force re-render input ẩn
    }

    // Reset processing flag after a delay
    setTimeout(() => {
      isProcessingRef.current = false;
    }, 1000);
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
        setHiddenBarcode("");
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
      processBarcode(decodedText.trim());
    }
  };

  return (
    <>
      <Row gutter={16}>
        <Col span={24}>
          <Form.Item label="Vật tư">
            <Input.Group compact>
              {barcodeEnabled && (
                <input
                  ref={hiddenInputRef}
                  value={hiddenBarcode}
                  onChange={handleHiddenInput}
                  style={{
                    position: "absolute",
                    opacity: 0,
                    width: 1,
                    height: 1,
                    zIndex: -1,
                  }}
                  tabIndex={-1}
                  autoFocus
                />
              )}
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
                  onOpenChange={handleDropdownVisibleChange}
                  filterOption={false}
                  onSelect={handleVatTuSelect}
                  disabled={!isEditMode}
                  classNames={{ popup: { root: "vat-tu-dropdown" } }}
                  popupMatchSelectWidth={true}
                  showArrow={true}
                  optionFilterProp="label"
                  notFoundContent={
                    loadingVatTu ? "Đang tải..." : "Không tìm thấy"
                  }
                  onPopupScroll={handlePopupScroll}
                />
              ) : (
                <Input
                  value={vatTuInput}
                  readOnly
                  placeholder="Quét barcode vật tư..."
                  style={{ width: "calc(100% - 40px)" }}
                  disabled={!isEditMode}
                  key={vatTuInput || ""}
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
                    setHiddenBarcode("");
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
                      setHiddenBarcode("");
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
          </Form.Item>
        </Col>
      </Row>

      <QRScanner
        isOpen={isQRScannerOpen}
        onClose={handleQRScannerClose}
        onScanSuccess={handleQRScanSuccess}
      />
    </>
  );
};

export default VatTuInputSection;
