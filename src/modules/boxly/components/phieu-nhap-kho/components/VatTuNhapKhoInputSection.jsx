import { QrcodeOutlined } from "@ant-design/icons";
import { Button, Col, Form, Input, Row, Select } from "antd";

const VatTuNhapKhoInputSection = ({
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
}) => {
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
                onSearch={(value) => {
                  if (searchTimeoutRef.current) {
                    clearTimeout(searchTimeoutRef.current);
                  }
                  searchTimeoutRef.current = setTimeout(() => {
                    fetchVatTuList(value);
                  }, 500);
                }}
                onDropdownVisibleChange={(open) => {
                  // Chỉ load khi mở dropdown, input trống và danh sách rỗng
                  if (open && !vatTuInput && vatTuList.length === 0) {
                    fetchVatTuList("");
                  }
                }}
                filterOption={false}
                onSelect={handleVatTuSelect}
                disabled={!isEditMode}
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

export default VatTuNhapKhoInputSection;
