import { Col, DatePicker, Form, Input, Row, Select } from "antd";

const PhieuFormInputs = ({
  isEditMode,
  maKhachList,
  loadingMaKhach,
  fetchMaKhachListDebounced,
  maGiaoDichList,
  fetchMaGiaoDichList,
  fetchMaKhachList,
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
            name="ma_kh"
            label="Mã khách"
            rules={[{ required: true, message: "Vui lòng chọn mã khách" }]}
          >
            <Select
              showSearch
              allowClear
              placeholder="Chọn khách hàng"
              loading={loadingMaKhach}
              filterOption={false}
              onSearch={fetchMaKhachListDebounced}
              onOpenChange={(open) => {
                if (open) {
                  fetchMaKhachList("");
                }
              }}
              options={maKhachList}
              dropdownClassName="custom-dropdown"
              optionLabelProp="value"
              disabled={!isEditMode}
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="so_ct" label="Số phiếu">
            <Input placeholder="Nhập số phiếu" disabled={!isEditMode} />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="ma_gd" label="Mã giao dịch">
            <Select
              placeholder="Chọn mã giao dịch"
              options={maGiaoDichList.map((item) => ({
                value: item.ma_gd.trim(),
                label: `${item.ma_gd.trim()} - ${item.ten_gd}`,
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
          <Form.Item name="status" label="Trạng thái">
            <Select placeholder="Chọn trạng thái" disabled={!isEditMode}>
              <Select.Option value="0">Lập chứng từ</Select.Option>
              <Select.Option value="5">Đề nghị xuất kho</Select.Option>
              <Select.Option value="1">Xuất kho</Select.Option>
              <Select.Option value="3">Chuyển sổ cái</Select.Option>
            </Select>
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="ngay_ct" label="Ngày lập">
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
