import { Col, DatePicker, Form, Input, Row, Select } from "antd";

const PhieuNhapKhoFormInputs = ({
  isEditMode = true,
  maKhachList,
  loadingMaKhach,
  fetchMaKhachListDebounced,
  maGiaoDichList,
  fetchMaKhachList,
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
            name="maKhach"
            label={<span>Mã khách</span>}
            rules={[{ required: true, message: "Vui lòng chọn mã khách" }]}
          >
            <Select
              showSearch
              allowClear
              placeholder="Chọn khách hàng"
              loading={loadingMaKhach}
              filterOption={false}
              onSearch={fetchMaKhachListDebounced}
              onDropdownVisibleChange={(open) => {
                if (open && fetchMaKhachList) {
                  fetchMaKhachList("");
                }
              }}
              options={maKhachList}
              dropdownClassName="phieu-form-dropdown"
              optionLabelProp="value"
              disabled={!isEditMode}
              popupMatchSelectWidth={false}
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="soPhieu"
            label={<span>Số phiếu</span>}
            rules={[{ required: true, message: "Vui lòng nhập số phiếu" }]}
          >
            <Input placeholder="Nhập số phiếu" disabled={!isEditMode} />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="dienGiai" label="Diễn giải">
            <Input placeholder="Nhập diễn giải" disabled={!isEditMode} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="ngay"
            label={<span>Ngày lập</span>}
            rules={[{ required: true, message: "Vui lòng chọn ngày lập" }]}
          >
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
              options={maGiaoDichList.map((item) => ({
                value: item.ma_gd.trim(),
                label: `${item.ma_gd.trim()} - ${item.ten_gd}`,
              }))}
              showSearch
              optionFilterProp="label"
              allowClear
              onDropdownVisibleChange={(open) => {
                if (open && fetchMaGiaoDichList) {
                  fetchMaGiaoDichList();
                }
              }}
              dropdownClassName="phieu-form-dropdown"
              disabled={!isEditMode}
              popupMatchSelectWidth={false}
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="trangThai" label="Trạng thái">
            <Select
              placeholder="Chọn trạng thái"
              disabled={!isEditMode}
              dropdownClassName="phieu-form-dropdown"
              popupMatchSelectWidth={false}
            >
              <Select.Option value="0">Lập chứng từ</Select.Option>
              <Select.Option value="2">Nhập kho</Select.Option>
              <Select.Option value="3">Chuyển số cái</Select.Option>
              <Select.Option value="5">Đề nghị nhập kho</Select.Option>
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

export default PhieuNhapKhoFormInputs;
