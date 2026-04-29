import React, { memo, useMemo } from "react";
import { Col, DatePicker, Form, Input, Row, Select } from "antd";

// Constants
const TRANG_THAI_OPTIONS = [
  { value: "0", label: "Lập chứng từ" },
  { value: "2", label: "Nhập kho" },
  { value: "3", label: "Chuyển số cái" },
  { value: "5", label: "Đề nghị nhập kho" },
];

/**
 * Component form inputs chung cho các loại phiếu
 * Giữ nguyên logic và luồng hoạt động, chỉ tối ưu code
 */
const PhieuFormInputs = memo(({
  // Basic props
  isEditMode = true,
  formType = "nhap-kho", // 'nhap-kho', 'xuat-kho', 'xuat-dieu-chuyen', 'xuat-kho-ban-hang'
  
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
      'xuat-kho': {
        maKhach: 'ma_kh',
        soPhieu: 'so_phieu',
        dienGiai: 'dien_giai',
        ngay: 'ngay',
        maGiaoDich: 'ma_gd',
        trangThai: 'trang_thai',
      },
      'xuat-dieu-chuyen': {
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

  // Render mã khách/kho fields based on form type
  const renderMainSelectFields = () => {
    if (formType === 'xuat-dieu-chuyen') {
      return (
        <>
          <Col span={12}>
            <Form.Item
              name={fieldNames.maKhoXuat}
              label="Mã kho xuất"
              rules={[{ required: true, message: "Vui lòng chọn kho xuất" }]}
            >
              <Select
                showSearch
                allowClear
                placeholder="Chọn kho xuất"
                loading={loadingMaKho}
                filterOption={false}
                onSearch={fetchMaKhoListDebounced}
                onDropdownVisibleChange={(open) => {
                  if (open && fetchMaKhoList) {
                    fetchMaKhoList("");
                  }
                }}
                options={maKhoList}
                dropdownClassName="phieu-form-dropdown"
                disabled={!isEditMode}
                popupMatchSelectWidth={false}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name={fieldNames.maKhoNhap}
              label="Mã kho nhập"
              rules={[{ required: true, message: "Vui lòng chọn kho nhập" }]}
            >
              <Select
                showSearch
                allowClear
                placeholder="Chọn kho nhập"
                loading={loadingMaKho}
                filterOption={false}
                onSearch={fetchMaKhoListDebounced}
                onDropdownVisibleChange={(open) => {
                  if (open && fetchMaKhoList) {
                    fetchMaKhoList("");
                  }
                }}
                options={maKhoList}
                dropdownClassName="phieu-form-dropdown"
                disabled={!isEditMode}
                popupMatchSelectWidth={false}
              />
            </Form.Item>
          </Col>
        </>
      );
    }

    // Default: mã khách field
    return (
      <Col span={12}>
        <Form.Item
          name={fieldNames.maKhach}
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
    );
  };

  // Memoized mã giao dịch options
  const maGiaoDichOptions = useMemo(() => {
    return maGiaoDichList.map((item) => ({
      value: item.ma_gd?.trim() || item.ma_giao_dich?.trim(),
      label: `${item.ma_gd?.trim() || item.ma_giao_dich?.trim()} - ${item.ten_gd || item.ten_giao_dich}`,
    }));
  }, [maGiaoDichList]);

  return (
    <>
      {/* Row 1: Mã khách/kho và Số phiếu */}
      <Row gutter={16}>
        {renderMainSelectFields()}
        {formType !== 'xuat-dieu-chuyen' && (
          <Col span={12}>
            <Form.Item
              name={fieldNames.soPhieu}
              label="Số phiếu"
              rules={[{ required: true, message: "Vui lòng nhập số phiếu" }]}
            >
              <Input placeholder="Nhập số phiếu" disabled={!isEditMode} />
            </Form.Item>
          </Col>
        )}
      </Row>

      {/* Row 2: Diễn giải và Ngày lập (hoặc Số phiếu cho xuất điều chuyển) */}
      <Row gutter={16}>
        <Col span={12}>
          {formType === 'xuat-dieu-chuyen' ? (
            <Form.Item
              name={fieldNames.soPhieu}
              label="Số phiếu"
              rules={[{ required: true, message: "Vui lòng nhập số phiếu" }]}
            >
              <Input placeholder="Nhập số phiếu" disabled={!isEditMode} />
            </Form.Item>
          ) : (
            <Form.Item name={fieldNames.dienGiai} label="Diễn giải">
              <Input placeholder="Nhập diễn giải" disabled={!isEditMode} />
            </Form.Item>
          )}
        </Col>
        <Col span={12}>
          <Form.Item
            name={fieldNames.ngay}
            label="Ngày lập"
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

      {/* Row 3: Mã giao dịch và Trạng thái (hoặc Diễn giải cho xuất điều chuyển) */}
      <Row gutter={16}>
        <Col span={12}>
          {formType === 'xuat-dieu-chuyen' ? (
            <Form.Item name={fieldNames.dienGiai} label="Diễn giải">
              <Input placeholder="Nhập diễn giải" disabled={!isEditMode} />
            </Form.Item>
          ) : (
            <Form.Item name={fieldNames.maGiaoDich} label="Mã giao dịch">
              <Select
                placeholder="Chọn mã giao dịch"
                options={maGiaoDichOptions}
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
          )}
        </Col>
        <Col span={12}>
          {formType === 'xuat-dieu-chuyen' ? (
            <Form.Item name={fieldNames.maGiaoDich} label="Mã giao dịch">
              <Select
                placeholder="Chọn mã giao dịch"
                options={maGiaoDichOptions}
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
          ) : (
            <Form.Item name={fieldNames.trangThai} label="Trạng thái">
              <Select
                placeholder="Chọn trạng thái"
                disabled={!isEditMode}
                dropdownClassName="phieu-form-dropdown"
                popupMatchSelectWidth={false}
                options={TRANG_THAI_OPTIONS}
              />
            </Form.Item>
          )}
        </Col>
      </Row>

      {/* Row 4: Trạng thái cho xuất điều chuyển */}
      {formType === 'xuat-dieu-chuyen' && (
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name={fieldNames.trangThai} label="Trạng thái">
              <Select
                placeholder="Chọn trạng thái"
                disabled={!isEditMode}
                dropdownClassName="phieu-form-dropdown"
                popupMatchSelectWidth={false}
                options={TRANG_THAI_OPTIONS}
              />
            </Form.Item>
          </Col>
        </Row>
      )}

      {/* Vật tư select component */}
      {isEditMode && VatTuSelectComponent && (
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item label="Vật tư">
              <VatTuSelectComponent
                isEditMode={isEditMode}
                {...vatTuProps}
              />
            </Form.Item>
          </Col>
        </Row>
      )}
    </>
  );
});

PhieuFormInputs.displayName = 'PhieuFormInputs';

export default PhieuFormInputs;