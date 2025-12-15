import { Col, DatePicker, Form, Input, Row, Select } from "antd";

const PhieuFormInputs = ({
  isEditMode,
  maGiaoDichList,
  maKhoList,
  loadingMaKho,
  fetchMaKhoListDebounced,
  fetchMaKhoList,
  fetchMaGiaoDichList,
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
  totalPage,
  pageIndex,
  setPageIndex,
  setVatTuList,
  currentKeyword,
  VatTuSelectComponent,
}) => {
  return (
    <>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="maKhoXuat"
            label="Mã kho xuất"
            rules={[
              {
                required: true,
                message: "Vui lòng chọn kho xuất",
              },
            ]}
          >
            <Select
              showSearch
              allowClear
              placeholder="Chọn kho xuất"
              loading={loadingMaKho}
              filterOption={false}
              onSearch={fetchMaKhoListDebounced}
              onOpenChange={(open) => {
                if (open && fetchMaKhoList) {
                  fetchMaKhoList("");
                }
              }}
              options={maKhoList || []}
              classNames={{ popup: { root: "phieu-form-dropdown" } }}
              optionLabelProp="value"
              disabled={!isEditMode}
              popupMatchSelectWidth={false}
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="maKhoNhap"
            label="Mã kho nhập"
            rules={[
              {
                required: true,
                message: "Vui lòng chọn kho nhập",
              },
            ]}
          >
            <Select
              showSearch
              allowClear
              placeholder="Chọn kho nhập"
              loading={loadingMaKho}
              filterOption={false}
              onSearch={fetchMaKhoListDebounced}
              onOpenChange={(open) => {
                if (open && fetchMaKhoList) {
                  fetchMaKhoList("");
                }
              }}
              options={maKhoList || []}
              classNames={{ popup: { root: "phieu-form-dropdown" } }}
              optionLabelProp="value"
              disabled={!isEditMode}
              popupMatchSelectWidth={false}
            />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="soPhieu" label="Số phiếu">
            <Input placeholder="Nhập số phiếu" disabled={!isEditMode} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="ngay" label="Ngày lập">
            <DatePicker
              style={{ width: "100%" }}
              format="DD/MM/YYYY"
              placeholder="Chọn ngày"
              inputReadOnly
              disabled={!isEditMode}
            />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="maGiaoDich" label="Mã giao dịch">
            <Select
              placeholder="Chọn mã giao dịch"
              options={(maGiaoDichList || []).map((item) => ({
                value: item.ma_gd?.trim() || "",
                label: `${item.ma_gd?.trim() || ""} - ${item.ten_gd || ""}`,
              }))}
              showSearch
              optionFilterProp="label"
              allowClear
              onOpenChange={(open) => {
                if (open && fetchMaGiaoDichList) {
                  fetchMaGiaoDichList();
                }
              }}
              disabled={!isEditMode}
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="trangThai" label="Trạng thái">
            <Select placeholder="Chọn trạng thái" disabled={!isEditMode}>
              <Select.Option value="0">Lập chứng từ</Select.Option>
              <Select.Option value="1">Điều chuyển</Select.Option>
              <Select.Option value="2">Chuyển KTTH</Select.Option>
              <Select.Option value="3">Chuyển sổ cái</Select.Option>
              <Select.Option value="9">Tài chính</Select.Option>
            </Select>
          </Form.Item>
        </Col>
      </Row>
      {isEditMode && (
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item label="Vật tư">
              {VatTuSelectComponent && (
                <VatTuSelectComponent
                  isEditMode={isEditMode}
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
              )}
            </Form.Item>
          </Col>
        </Row>
      )}
    </>
  );
};

export default PhieuFormInputs;
