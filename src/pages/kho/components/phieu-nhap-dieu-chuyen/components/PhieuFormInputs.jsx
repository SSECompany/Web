import React from "react";
import { Col, DatePicker, Form, Input, Row, Select } from "antd";

const PhieuFormInputs = ({
  isEditMode,
  phieuData,
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
  const commonInputStyle = { width: "100%" };

  return (
    <div className="phieu-nhap-dieu-chuyen-form">
      <Row gutter={[32, 4]}>
        {/* CỘT TRÁI */}
        <Col span={14}>
          <Form.Item
            name="maKhoNhap"
            label="Mã kho nhập"
            rules={[{ required: true, message: "Chọn kho nhập" }]}
          >
            <Select
              showSearch
              allowClear
              placeholder="Chọn kho nhập (Mã - Tên)"
              loading={loadingMaKho}
              filterOption={false}
              onSearch={fetchMaKhoListDebounced}
              onOpenChange={(open) => open && fetchMaKhoList && fetchMaKhoList("")}
              options={maKhoList}
              disabled={!isEditMode}
              popupMatchSelectWidth={false}
              optionFilterProp="label"
            />
          </Form.Item>

          <Form.Item
            name="maKhoXuat"
            label="Mã kho xuất"
            rules={[{ required: true, message: "Chọn kho xuất" }]}
          >
            <Select
              showSearch
              allowClear
              placeholder="Chọn kho xuất (Mã - Tên)"
              loading={loadingMaKho}
              filterOption={false}
              onSearch={fetchMaKhoListDebounced}
              onOpenChange={(open) => open && fetchMaKhoList && fetchMaKhoList("")}
              options={maKhoList}
              disabled={!isEditMode}
              popupMatchSelectWidth={false}
              optionFilterProp="label"
            />
          </Form.Item>

          <Form.Item name="ong_ba" label="Người giao">
            <Input placeholder="Nhập người giao" disabled={!isEditMode} />
          </Form.Item>

          <Form.Item
            name="maGiaoDich"
            label="Mã giao dịch"
            rules={[{ required: true, message: "Chọn mã giao dịch" }]}
          >
            <Select
              showSearch
              placeholder="Chọn mã giao dịch (Mã - Tên)"
              options={[
                { value: "3", label: "3 - Nhập điều chuyển" },
                ...(phieuData && phieuData.ma_gd ? [{ value: phieuData.ma_gd.trim(), label: `${phieuData.ma_gd.trim()} - ${phieuData.ten_gd}` }] : []),
                ...(maGiaoDichList || []).map(item => ({
                  value: item.ma_gd?.trim(),
                  label: `${item.ma_gd?.trim()} - ${item.ten_gd}`
                }))
              ].filter((v, i, a) => a.findIndex(t => (t.value === v.value)) === i)}
              onOpenChange={(open) => open && fetchMaGiaoDichList && fetchMaGiaoDichList()}
              disabled={true}
              popupMatchSelectWidth={false}
              optionFilterProp="label"
            />
          </Form.Item>

          <Form.Item name="dien_giai" label="Diễn giải">
            <Input placeholder="Nhập diễn giải" disabled={!isEditMode} />
          </Form.Item>
        </Col>

        {/* CỘT PHẢI */}
        <Col span={10}>


          <Form.Item 
            name="ngay" 
            label="Ngày lập"
            rules={[{ required: true, message: "Chọn ngày lập" }]}
          >
            <DatePicker 
                style={commonInputStyle} 
                format="DD/MM/YYYY" 
                inputReadOnly 
                disabled={!isEditMode} 
            />
          </Form.Item>

          <Form.Item 
            name="ngay_lct" 
            label="Ngày hạch toán"
            rules={[{ required: true, message: "Chọn ngày hạch toán" }]}
          >
            <DatePicker 
                style={commonInputStyle} 
                format="DD/MM/YYYY" 
                inputReadOnly 
                disabled={!isEditMode} 
            />
          </Form.Item>


        </Col>
      </Row>

      {isEditMode && VatTuSelectComponent && (
        <Row style={{ marginTop: 16 }}>
          <Col span={24}>
            <Form.Item label={<span style={{ fontWeight: 500, fontSize: '16px' }}>Chi tiết</span>}>
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
            </Form.Item>
          </Col>
        </Row>
      )}
    </div>
  );
};

export default PhieuFormInputs;
