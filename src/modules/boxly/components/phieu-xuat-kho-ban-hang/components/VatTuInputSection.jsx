import { QrcodeOutlined } from "@ant-design/icons";
import { Button, Col, Form, Input, Row, Select } from "antd";
import { useRef } from "react";

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
}) => {
  // Refs to prevent unnecessary API calls
  const dropdownOpenedRef = useRef(false);
  const lastSearchValueRef = useRef("");

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
                // Add these props to improve performance
                showArrow={true}
                optionFilterProp="label"
                notFoundContent={
                  loadingVatTu ? "Đang tải..." : "Không tìm thấy"
                }
              />
            ) : (
              <Input
                ref={vatTuSelectRef}
                value={vatTuInput}
                onChange={(e) => setVatTuInput(e.target.value)}
                placeholder="Quét barcode vật tư..."
                style={{ width: "calc(100% - 40px)" }}
                onPressEnter={() => {
                  if (vatTuInput && vatTuInput.trim()) {
                    handleVatTuSelect(vatTuInput);
                  }
                }}
                disabled={!isEditMode}
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
                    setVatTuInput(undefined);
                    // Reset refs when switching to barcode mode
                    dropdownOpenedRef.current = false;
                    lastSearchValueRef.current = "";
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
