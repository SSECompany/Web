import { QrcodeOutlined } from "@ant-design/icons";
import { Button, Col, Form, Input, Row, Select } from "antd";
import { useEffect, useRef } from "react";

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
  const dropdownOpenedRef = useRef(false);
  const lastSearchValueRef = useRef("");
  const focusTimeoutRef = useRef(null);
  const isProcessingRef = useRef(false);
  const lastProcessedBarcodeRef = useRef("");

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
      fetchVatTuList("");
      dropdownOpenedRef.current = true;
    } else {
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

  const processBarcode = (barcodeValue) => {
    // Prevent double processing
    if (isProcessingRef.current) {
      console.log("Already processing barcode, skipping:", barcodeValue);
      return;
    }

    // Allow reprocessing the same barcode after a delay
    const timeSinceLastProcess =
      Date.now() - (lastProcessedBarcodeRef.current?.timestamp || 0);
    if (
      lastProcessedBarcodeRef.current?.value === barcodeValue &&
      timeSinceLastProcess < 2000
    ) {
      console.log(
        "Barcode already processed recently, skipping:",
        barcodeValue
      );
      return;
    }

    if (!barcodeValue || !barcodeValue.trim()) {
      return;
    }

    console.log("Processing barcode:", barcodeValue);
    isProcessingRef.current = true;
    lastProcessedBarcodeRef.current = {
      value: barcodeValue,
      timestamp: Date.now(),
    };

    // Process the barcode
    handleVatTuSelect(barcodeValue);

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
            console.log("Auto-submitting barcode:", vatTuInput);
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
    <Row gutter={16}>
      <Col span={24}>
        <Form.Item label="Vật tư">
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
                notFoundContent={
                  loadingVatTu ? "Đang tải..." : "Không tìm thấy"
                }
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
            />
          </Input.Group>
        </Form.Item>
      </Col>
    </Row>
  );
};

export default VatTuInputSection;
