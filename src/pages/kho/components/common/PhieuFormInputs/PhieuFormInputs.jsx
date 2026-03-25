import React, { memo, useMemo } from "react";
import { Col, DatePicker, Form, Input, Row, Select } from "antd";

// Constants
const TRANG_THAI_OPTIONS = [
  { value: "2", label: "2. Chuyển vào SC" },
  { value: "3", label: "3. Nhập kho" },
];

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
                onOpenChange={(open) => {
                  if (open && fetchMaKhoList) {
                    fetchMaKhoList("");
                  }
                }}
                options={maKhoList}
                classNames={{ popup: { root: "phieu-form-dropdown" } }}
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
                onOpenChange={(open) => {
                  if (open && fetchMaKhoList) {
                    fetchMaKhoList("");
                  }
                }}
                options={maKhoList}
                classNames={{ popup: { root: "phieu-form-dropdown" } }}
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
          label="Mã ncc"
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
              if (open && fetchMaKhachList) {
                fetchMaKhachList("");
              }
            }}
            options={maKhachList}
            classNames={{ popup: { root: "phieu-form-dropdown" } }}
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

  // Layout đặc thù cho Phiếu nhập hàng theo đơn - MATCH HOÀN TOÀN ẢNH SSE
  if (formType === 'nhap-hang') {
    return (
      <div className="phieu-form-rows">
        {/* Hidden fields for auto-generated values */}
        <Form.Item name={fieldNames.soPhieu} noStyle><Input type="hidden" /></Form.Item>
        <Form.Item name={fieldNames.soDonHang} noStyle><Input type="hidden" /></Form.Item>
        <Form.Item name={fieldNames.ngayDonHang} noStyle><Input type="hidden" /></Form.Item>

        {/* Hàng 1: Mã ncc */}
        <Row gutter={24}>
          <Col span={24}>
            <Row gutter={8}>
                <Col span={4}>
                    <Form.Item
                        name={fieldNames.maKhach}
                        label="Mã ncc"
                        rules={[{ required: true, message: "Vui lòng chọn nhà cung cấp" }]}
                    >
                    <Select
                        showSearch
                        allowClear
                        placeholder="Mã"
                        loading={loadingMaKhach}
                        filterOption={false}
                        onSearch={fetchMaKhachListDebounced}
                        onOpenChange={(open) => {
                        if (open && fetchMaKhachList) {
                            fetchMaKhachList("");
                        }
                        }}
                        options={maKhachList}
                        classNames={{ popup: { root: "phieu-form-dropdown" } }}
                        optionLabelProp="value"
                        disabled={!isEditMode}
                        popupMatchSelectWidth={false}
                    />
                    </Form.Item>
                </Col>
                <Col span={20}>
                    <Form.Item label="&nbsp;" shouldUpdate={(prevValues, currentValues) => prevValues.maKhach !== currentValues.maKhach || prevValues.tenKhach !== currentValues.tenKhach}>
                        {({ getFieldValue }) => {
                            const currentVal = getFieldValue(fieldNames.maKhach);
                            const option = maKhachList.find(o => o.value === currentVal);
                            const name = option ? (option.label.split(' - ')[1] || "") : (getFieldValue('tenKhach') || "");
                            return <Input value={name} disabled placeholder="Tên nhà cung cấp" />;
                        }}
                    </Form.Item>
                </Col>
            </Row>
          </Col>
        </Row>

        {/* Hàng 2: Người giao hàng | Ngày lập */}
        <Row gutter={24}>
          <Col span={16}>
            <Form.Item name={fieldNames.nguoiGiaoHang} label="Người giao hàng">
              <Input placeholder="Nhập người giao hàng" disabled={!isEditMode} />
            </Form.Item>
          </Col>
          <Col span={8}>
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
          </Col>
        </Row>

        {/* Hàng 3: Diễn giải | Ngày hạch toán */}
        <Row gutter={24}>
          <Col span={16}>
            <Form.Item name={fieldNames.dienGiai} label="Diễn giải">
              <Input placeholder="Nhập diễn giải" disabled={!isEditMode} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name={fieldNames.ngayHachToan}
              label="Ngày hạch toán"
              rules={[{ required: true, message: "Chọn ngày hạch toán" }]}
            >
              <DatePicker
                style={{ width: "100%" }}
                format="DD/MM/YYYY"
                disabled={!isEditMode}
              />
            </Form.Item>
          </Col>
        </Row>



        {/* Hàng 5: Nhân viên mua */}
        <Row gutter={24}>
          <Col span={16}>
            <Form.Item name={fieldNames.ma_nv_mua} label="Nhân viên mua">
              <Input placeholder="Nhân viên mua" disabled={!isEditMode} />
            </Form.Item>
          </Col>
        </Row>

        {/* Vật tư select component (giữ nguyên ở dưới) */}
        {isEditMode && VatTuSelectComponent && (
          <Row gutter={16} style={{ marginTop: 24 }}>
            <Col span={24}>
              <Form.Item label="Tìm quét vật tư nhập hàng">
                <VatTuSelectComponent
                  isEditMode={isEditMode}
                  {...vatTuProps}
                />
              </Form.Item>
            </Col>
          </Row>
        )}
      </div>
    );
  }

  // Layout mặc định cho các loại phiếu khác
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

      {/* Row extra: Số đơn hàng (PO) for nhap-hang (đã xử lý ở trên nhưng giữ lại cho tương thích nếu config sai) */}
      {formType === 'nhap-hang' && (
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name={fieldNames.soDonHang}
              label={
                <span>
                  Số đơn hàng (PO) <span style={{ color: '#8c8c8c', fontSize: '12px', fontWeight: 'normal' }}>(Nhấn Enter để lấy dữ liệu)</span>
                </span>
              }
            >
              <Input 
                placeholder="Nhập số đơn hàng mua (PO)" 
                disabled={!isEditMode}
                onPressEnter={(e) => {
                  if (selectHandlers.onPoSearch) {
                    selectHandlers.onPoSearch(e.target.value);
                  }
                }}
              />
            </Form.Item>
          </Col>
        </Row>
      )}

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
                onOpenChange={(open) => {
                  if (open && fetchMaGiaoDichList) {
                    fetchMaGiaoDichList();
                  }
                }}
                classNames={{ popup: { root: "phieu-form-dropdown" } }}
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
                onOpenChange={(open) => {
                  if (open && fetchMaGiaoDichList) {
                    fetchMaGiaoDichList();
                  }
                }}
                classNames={{ popup: { root: "phieu-form-dropdown" } }}
                disabled={!isEditMode}
                popupMatchSelectWidth={false}
              />
            </Form.Item>
          ) : (
            <Form.Item name={fieldNames.trangThai} label="Trạng thái">
              <Select
                placeholder="Chọn trạng thái"
                disabled={!isEditMode}
                classNames={{ popup: { root: "phieu-form-dropdown" } }}
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
                classNames={{ popup: { root: "phieu-form-dropdown" } }}
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