import { QrcodeOutlined } from "@ant-design/icons";
import { Button, Col, Input, Row, Select, Space, message } from "antd";
import { useEffect, useRef } from "react";

const ProductSelectFull = ({
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
  currentKeyword = "",
  hasInitialData = false,
}) => {
  const dropdownOpenedRef = useRef(false);
  const lastSearchValueRef = useRef("");
  const focusTimeoutRef = useRef(null);
  const isProcessingRef = useRef(false);
  const lastProcessedBarcodeRef = useRef("");
  const didInitRef = useRef(false);
  const hasInitialDataRef = useRef(false);
  const isSearchingRef = useRef(false);
  const searchStartTimeRef = useRef(0);

  useEffect(() => {
    if (!didInitRef.current) {
      didInitRef.current = true;
    }
    if (hasInitialData) {
      hasInitialDataRef.current = true;
    }

    if (vatTuList.length > 0 && !vatTuList.every((item) => item.label)) {
      hasInitialDataRef.current = true;
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [hasInitialData, vatTuList]);

  useEffect(() => {
    if (barcodeEnabled && vatTuSelectRef.current) {
      if (focusTimeoutRef.current) {
        clearTimeout(focusTimeoutRef.current);
      }

      focusTimeoutRef.current = setTimeout(() => {
        if (vatTuSelectRef.current) {
          vatTuSelectRef.current.focus();
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

    isSearchingRef.current = true;
    searchStartTimeRef.current = Date.now();

    let delay = 1000;
    if (value && value.trim()) {
      if (value.length <= 2) {
        delay = 600;
      } else {
        delay = 400;
      }
    }

    searchTimeoutRef.current = setTimeout(() => {
      if (setPageIndex) setPageIndex(1);
      fetchVatTuList(value, 1, false); 
      hasInitialDataRef.current = true;
      isSearchingRef.current = false;
    }, delay);
  };

  const handleDropdownVisibleChange = (open) => {
    if (open) {
      dropdownOpenedRef.current = true;
      if (
        (vatTuList.length === 0 ||
          vatTuList.every((item) => item.label )) &&
        !loadingVatTu
      ) {
        fetchVatTuList("", 1, false);
      }
    } else {
      dropdownOpenedRef.current = false;
      lastSearchValueRef.current = "";
    }
  };

  const handleSelectFocus = () => {
    if (
      (vatTuList.length === 0 ||
        vatTuList.every((item) => item.label )) &&
      !loadingVatTu
    ) {
      fetchVatTuList("", 1, false);
    }
  };

  const handleBarcodeInputChange = (e) => {
    const newValue = e.target.value;
    setVatTuInput(newValue);

    if (!newValue || newValue.trim() === "") {
      lastProcessedBarcodeRef.current = null;
    }
  };

  const processBarcode = async (barcodeValue) => {
    if (isProcessingRef.current) {
      return;
    }
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

    try {
      const result = await handleVatTuSelect(barcodeValue);
      if (result === false) {
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
      e.preventDefault(); 
      processBarcode(vatTuInput);
    }
  };

  const handleBarcodeInputKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
      processBarcode(vatTuInput);
    }
  };

  const handleBarcodeInputBlur = () => {
    if (barcodeEnabled && vatTuSelectRef.current) {
      setTimeout(() => {
        if (barcodeEnabled && vatTuSelectRef.current) {
          vatTuSelectRef.current.focus();
        }
      }, 100);
    }
  };

  const handleBarcodeInputFocus = () => {
    if (vatTuSelectRef.current) {
      vatTuSelectRef.current.select();
    }
  };

  useEffect(() => {
    if (barcodeEnabled && vatTuInput && vatTuInput.trim()) {
      if (vatTuInput.length >= 8) {
        const timer = setTimeout(() => {
          if (vatTuInput && vatTuInput.trim()) {
            processBarcode(vatTuInput);
          }
        }, 200); 

        return () => clearTimeout(timer);
      }
    }
  }, [vatTuInput, barcodeEnabled]);

  const handlePopupScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    if (
      scrollTop + clientHeight >= scrollHeight - 20 &&
      pageIndex < totalPage &&
      !loadingVatTu
    ) {
      fetchVatTuList(currentKeyword, pageIndex + 1, true); 
      if (setPageIndex) setPageIndex(pageIndex + 1);
    }
  };

  return (
    <Row gutter={16}>
      <Col span={24}>
        <Space.Compact style={{ width: "100%" }}>
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
              filterOption={false}
              onSelect={handleVatTuSelect}
              onDropdownVisibleChange={handleDropdownVisibleChange}
              onFocus={handleSelectFocus}
              disabled={!isEditMode}
              popupClassName="vat-tu-dropdown"
              popupMatchSelectWidth={true}
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
              setBarcodeEnabled((prev) => {
                const next = !prev;
                if (next) {
                  setBarcodeJustEnabled(true);
                  setVatTuInput("");
                  dropdownOpenedRef.current = false;
                  lastSearchValueRef.current = "";
                  isProcessingRef.current = false;
                  lastProcessedBarcodeRef.current = null;
                }
                return next;
              });
            }}
            disabled={!isEditMode}
          />
        </Space.Compact>
      </Col>
    </Row>
  );
};

export default ProductSelectFull;
