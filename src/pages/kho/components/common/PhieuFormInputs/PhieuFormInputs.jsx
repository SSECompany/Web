import React, { memo, useMemo } from "react";
import { Col, DatePicker, Form, Input, Row, Select } from "antd";

// Constants
const TRANG_THAI_OPTIONS = [
  { value: "2", label: "Chuyển vào SC" },
  { value: "3", label: "Nhập kho" },
];

const PhieuFormInputs = memo(({
  // Basic props
  isEditMode = true,
  formType = "nhap-kho", // 'nhap-kho', 'nhap-hang', 'xuat-kho', 'nhap-dieu-chuyen', 'xuat-kho-ban-hang'
  
  // Select data & handlers
  selectData = {},
  selectHandlers = {},
  loadingStates = {},
  
  // VatTu component props
  vatTuProps = {},
  VatTuSelectComponent,
  
  // Custom field config
  fieldConfig = {},
}) => {
  // Destructure với default values
  const {
    maKhachList = [],
    maGiaoDichList = [],
    maKhoList = [],
  } = selectData;

  const {
    fetchMaKhachList,
    fetchMaKhachListDebounced,
    fetchMaGiaoDichList,
    fetchMaKhoList,
    fetchMaKhoListDebounced,
    onPoSearch,
  } = selectHandlers;

  const {
    loadingMaKhach = false,
    loadingMaKho = false,
  } = loadingStates;

  // Memoized field names based on form type
  const fieldNames = useMemo(() => {
    const baseFields = {
      'nhap-kho': {
        maKhach: 'maKhach',
        soPhieu: 'soPhieu',
        dienGiai: 'dienGiai',
        ngay: 'ngay',
        maGiaoDich: 'maGiaoDich',
        trangThai: 'trangThai',
      },
      'nhap-hang': {
        maKhach: "maKhach",
        soPhieu: "soPhieu",
        dienGiai: "dienGiai",
        ngay: "ngay",
        maGiaoDich: "maGiaoDich",
        trangThai: "trangThai",
        soDonHang: "soDonHang",
        nguoiGiaoHang: "nguoiGiaoHang",
        maKho: "maKho",
        ngayDonHang: "ngayDonHang",
        ma_nv_mua: "ma_nv_mua",
        ngayHachToan: "ngayHachToan",
        maNT: "maNT",
        tyGia: "tyGia",
      },
      'xuat-kho': {
        maKhach: 'ma_kh',
        soPhieu: 'so_phieu',
        dienGiai: 'dien_giai',
        ngay: 'ngay',
        maGiaoDich: 'ma_gd',
        trangThai: 'trang_thai',
      },
      'nhap-dieu-chuyen': {
        maKhoXuat: 'maKhoXuat',
        maKhoNhap: 'maKhoNhap',
        soPhieu: 'so_phieu',
        dienGiai: 'dien_giai',
        ngay: 'ngay',
        maGiaoDich: 'ma_gd',
        trangThai: 'trang_thai',
      },
      'xuat-kho-ban-hang': {
        maKhach: 'ma_kh',
        soPhieu: 'so_phieu',
        dienGiai: 'dien_giai',
        ngay: 'ngay',
        maGiaoDich: 'ma_gd',
        trangThai: 'trang_thai',
      },
    };
    
    return { ...baseFields[formType], ...fieldConfig };
  }, [formType, fieldConfig]);

  // Memoized mã giao dịch options
  const maGiaoDichOptions = useMemo(() => {
    return (maGiaoDichList || []).map((item) => ({
      value: item.ma_gd?.trim() || item.ma_giao_dich?.trim(),
      label: `${item.ma_gd?.trim() || item.ma_giao_dich?.trim()} - ${item.ten_gd || item.ten_giao_dich}`,
    }));
  }, [maGiaoDichList]);

  const responsiveGutter = { xs: 8, sm: 16, md: 24 };

  // Layout đặc thù cho Phiếu nhập hàng
  if (formType === 'nhap-hang') {
    return (
      <>
        <Form.Item name={fieldNames.soPhieu} noStyle><Input type="hidden" /></Form.Item>
        <Form.Item name={fieldNames.soDonHang} noStyle><Input type="hidden" /></Form.Item>
        <Form.Item name={fieldNames.ngayDonHang} noStyle><Input type="hidden" /></Form.Item>

        <Row gutter={responsiveGutter}>
          <Col span={24}>
            <Form.Item
              name={fieldNames.maKhach}
              label="Tên nhà cung cấp"
              rules={[{ required: true, message: "Vui lòng chọn nhà cung cấp" }]}
            >
              {!isEditMode ? (
                <Form.Item noStyle shouldUpdate={(pv, cv) => pv[fieldNames.maKhach] !== cv[fieldNames.maKhach]}>
                  {({ getFieldValue }) => {
                    const currentVal = getFieldValue(fieldNames.maKhach);
                    const option = maKhachList.find(o => o.value === currentVal);
                    const nameDisplay = option ? option.label : currentVal;
                    return (
                        <Input.TextArea disabled autoSize className="customer-display" value={nameDisplay} />
                    );
                  }}
                </Form.Item>
              ) : (
                <Select
                  showSearch
                  allowClear
                  placeholder="Nhập tên nhà cung cấp"
                  loading={loadingMaKhach}
                  filterOption={false}
                  onSearch={fetchMaKhachListDebounced}
                  onOpenChange={(open) => open && fetchMaKhachList && fetchMaKhachList("")}
                  options={maKhachList}
                  disabled={!isEditMode}
                  popupMatchSelectWidth={false}
                />
              )}
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={responsiveGutter}>
          <Col xs={24} sm={16}>
            <Form.Item name={fieldNames.nguoiGiaoHang} label="Người giao hàng">
              <Input placeholder="Nhập người giao hàng" disabled={!isEditMode} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item name={fieldNames.ngay} label="Ngày lập" rules={[{ required: true, message: "Chọn ngày lập" }]}>
              <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" disabled={!isEditMode} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={responsiveGutter}>
          <Col xs={24} sm={16}>
            <Form.Item name={fieldNames.dienGiai} label="Diễn giải">
              <Input placeholder="Nhập diễn giải" disabled={!isEditMode} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item name={fieldNames.ngayHachToan} label="Ngày hạch toán" rules={[{ required: true, message: "Chọn ngày hạch toán" }]}>
              <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" disabled={!isEditMode} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={responsiveGutter}>
          <Col xs={24} sm={16}>
            <Form.Item name={fieldNames.ma_nv_mua} label="Nhân viên mua">
              <Input placeholder="Nhân viên mua" disabled={!isEditMode} />
            </Form.Item>
          </Col>
        </Row>
      </>
    );
  }

  // Layout đặc thù cho Phiếu nhập điều chuyển
  if (formType === 'nhap-dieu-chuyen') {
    return (
      <>
        <Row gutter={[32, 0]}>
          {/* CỘT TRÁI */}
          <Col xs={24} md={14}>
            <Form.Item
              name={fieldNames.maKhoNhap}
              label="Mã kho nhập"
              rules={[{ required: true, message: "Chọn kho nhập" }]}
            >
              <Select
                showSearch
                allowClear
                placeholder="Chọn kho nhập"
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
              name={fieldNames.maKhoXuat}
              label="Mã kho xuất"
              rules={[{ required: true, message: "Chọn kho xuất" }]}
            >
              <Select
                showSearch
                allowClear
                placeholder="Chọn kho xuất"
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
              name={fieldNames.maGiaoDich}
              label="Mã giao dịch"
              rules={[{ required: true, message: "Chọn mã giao dịch" }]}
            >
              <Select
                placeholder="Chọn mã giao dịch"
                options={maGiaoDichOptions}
                showSearch
                optionFilterProp="label"
                allowClear
                onOpenChange={(open) => open && fetchMaGiaoDichList && fetchMaGiaoDichList()}
                disabled={!isEditMode}
                popupMatchSelectWidth={false}
              />
            </Form.Item>

            <Form.Item name={fieldNames.dienGiai} label="Diễn giải">
              <Input placeholder="Nhập diễn giải" disabled={!isEditMode} />
            </Form.Item>
          </Col>

          {/* CỘT PHẢI */}
          <Col xs={24} md={10}>
            <Form.Item
              name={fieldNames.soPhieu}
              label="Số phiếu"
            >
              <Input placeholder="Nhập số phiếu" disabled={!isEditMode} style={{ textAlign: "right" }} />
            </Form.Item>

            <Form.Item
              name={fieldNames.ngay}
              label="Ngày lập"
              rules={[{ required: true, message: "Chọn ngày lập" }]}
            >
              <DatePicker
                style={{ width: "100%" }}
                format="DD/MM/YYYY"
                disabled={!isEditMode}
              />
            </Form.Item>

            <Form.Item
              name="ngay_lct"
              label="Ngày hạch toán"
              rules={[{ required: true, message: "Chọn ngày hạch toán" }]}
            >
              <DatePicker
                style={{ width: "100%" }}
                format="DD/MM/YYYY"
                disabled={!isEditMode}
              />
            </Form.Item>

            <Row gutter={8}>
                <Col span={10}>
                    <Form.Item name="ma_nt" label="Mã NT">
                        <Input disabled value="VND" style={{ textAlign: "center" }} />
                    </Form.Item>
                </Col>
                <Col span={14}>
                    <Form.Item name="ty_gia" label="Tỷ giá">
                        <Input disabled style={{ textAlign: "right" }} />
                    </Form.Item>
                </Col>
            </Row>

            <Form.Item name={fieldNames.trangThai} label="Trạng thái">
              <Select
                placeholder="Chọn trạng thái"
                disabled={!isEditMode}
                options={[
                    { value: "0", label: "0. Lập chứng từ" },
                    { value: "1", label: "1. Điều chuyển" },
                    { value: "2", label: "2. Xuất kho" },
                    { value: "3", label: "3. Chuyển sổ cái" },
                    { value: "4", label: "4. Hoàn tất" },
                    { value: "5", label: "5. Đề nghị xuất kho" },
                    { value: "9", label: "9. Tài chính" },
                ]}
              />
            </Form.Item>
          </Col>
        </Row>

        {isEditMode && VatTuSelectComponent && (
            <div style={{ marginTop: 16 }}>
                <Form.Item label="Chọn vật tư">
                    <VatTuSelectComponent isEditMode={isEditMode} {...vatTuProps} />
                </Form.Item>
            </div>
        )}
      </>
    );
  }

  // DEFAULT LAYOUT
  return (
    <>
      <Row gutter={responsiveGutter}>
        {/* Render Kho/Khách field */}
        {formType === 'xuat-kho-ban-hang' || formType === 'xuat-kho' ? (
             <Col xs={24} sm={12}>
                <Form.Item name={fieldNames.maKhach} label="Mã khách" rules={[{ required: true, message: "Vui lòng chọn mã khách" }]}>
                    <Select
                        showSearch
                        allowClear
                        placeholder="Chọn khách hàng"
                        loading={loadingMaKhach}
                        filterOption={false}
                        onSearch={fetchMaKhachListDebounced}
                        onOpenChange={(open) => open && fetchMaKhachList && fetchMaKhachList("")}
                        options={maKhachList}
                        disabled={!isEditMode}
                    />
                </Form.Item>
            </Col>
        ) : (
             <Col xs={24} sm={12}>
                <Form.Item name={fieldNames.maKhach} label="Mã ncc" rules={[{ required: true, message: "Vui lòng chọn mã khách" }]}>
                    <Select
                        showSearch
                        allowClear
                        placeholder="Chọn khách hàng"
                        loading={loadingMaKhach}
                        filterOption={false}
                        onSearch={fetchMaKhachListDebounced}
                        onOpenChange={(open) => open && fetchMaKhachList && fetchMaKhachList("")}
                        options={maKhachList}
                        disabled={!isEditMode}
                    />
                </Form.Item>
            </Col>
        )}
        
        <Col xs={24} sm={12}>
          <Form.Item name={fieldNames.soPhieu} label="Số phiếu" rules={[{ required: true, message: "Vui lòng nhập số phiếu" }]}>
            <Input placeholder="Nhập số phiếu" disabled={!isEditMode} />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={responsiveGutter}>
        <Col xs={24} sm={12}>
          <Form.Item name={fieldNames.dienGiai} label="Diễn giải">
            <Input placeholder="Nhập diễn giải" disabled={!isEditMode} />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item name={fieldNames.ngay} label="Ngày lập" rules={[{ required: true, message: "Vui lòng chọn ngày lập" }]}>
            <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" placeholder="Chọn ngày" inputReadOnly disabled={!isEditMode} />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={responsiveGutter}>
        <Col xs={24} sm={12}>
          <Form.Item name={fieldNames.maGiaoDich} label="Mã giao dịch">
            <Select
              placeholder="Chọn mã giao dịch"
              options={maGiaoDichOptions}
              showSearch
              optionFilterProp="label"
              allowClear
              onOpenChange={(open) => open && fetchMaGiaoDichList && fetchMaGiaoDichList()}
              disabled={!isEditMode}
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item name={fieldNames.trangThai} label="Trạng thái">
            <Select placeholder="Chọn trạng thái" disabled={!isEditMode} options={TRANG_THAI_OPTIONS} />
          </Form.Item>
        </Col>
      </Row>

      {isEditMode && VatTuSelectComponent && (
        <Row gutter={responsiveGutter}>
          <Col span={24}>
            <Form.Item label="Vật tư">
              <VatTuSelectComponent isEditMode={isEditMode} {...vatTuProps} />
            </Form.Item>
          </Col>
        </Row>
      )}
    </>
  );
});

PhieuFormInputs.displayName = 'PhieuFormInputs';

export default PhieuFormInputs;