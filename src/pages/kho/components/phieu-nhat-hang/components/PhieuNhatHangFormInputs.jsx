import { Col, DatePicker, Form, Input, Row, Select } from "antd";
import React, { useMemo } from "react";

const PhieuNhatHangFormInputs = ({
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
  // Group các props theo category để dễ quản lý
  const selectData = useMemo(
    () => ({
      maKhachList,
      maGiaoDichList,
    }),
    [maKhachList, maGiaoDichList]
  );

  const selectHandlers = useMemo(
    () => ({
      fetchMaKhachList,
      fetchMaKhachListDebounced,
      fetchMaGiaoDichList,
    }),
    [fetchMaKhachList, fetchMaKhachListDebounced, fetchMaGiaoDichList]
  );

  const loadingStates = useMemo(
    () => ({
      loadingMaKhach,
    }),
    [loadingMaKhach]
  );

  const vatTuProps = useMemo(
    () => ({
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
    }),
    [
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
    ]
  );

  return (
    <>
      {/* Header fields customized per ERP screenshots */}
      <Row gutter={16}>
        <Col span={12}>
          {/* Mã khách */}
          <Form.Item
            name="maKhach"
            label="Mã khách"
            rules={[{ required: true, message: "Vui lòng chọn mã khách" }]}
          >
            <Select
              showSearch
              allowClear
              placeholder="Chọn khách hàng"
              loading={loadingStates.loadingMaKhach}
              filterOption={false}
              onSearch={selectHandlers.fetchMaKhachListDebounced}
              onDropdownVisibleChange={(open) => {
                if (open && selectHandlers.fetchMaKhachList) {
                  selectHandlers.fetchMaKhachList("");
                }
              }}
              options={selectData.maKhachList}
              dropdownClassName="phieu-form-dropdown"
              optionLabelProp="value"
              disabled={!isEditMode}
              popupMatchSelectWidth={false}
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          {/* Số chứng từ */}
          <Form.Item
            name="soPhieu"
            label="Số chứng từ"
            rules={[{ required: true, message: "Vui lòng nhập số chứng từ" }]}
          >
            <Input placeholder="Nhập số chứng từ" disabled={!isEditMode} />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          {/* Tên khách hàng - Read only display */}
          <Form.Item name="tenKhach" label="Tên khách hàng">
            <Input placeholder="Tên khách hàng" disabled={true} />
          </Form.Item>
        </Col>
        <Col span={12}>
          {/* Ngày lập */}
          <Form.Item
            name="ngay"
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

      <Row gutter={16}>
        <Col span={12}>
          {/* Loại vận chuyển */}
          <Form.Item name="loaiVanChuyen" label="Loại vận chuyển">
            <Input placeholder="Nhập loại vận chuyển" disabled={!isEditMode} />
          </Form.Item>
        </Col>
        <Col span={12}>
          {/* Vùng */}
          <Form.Item name="vung" label="Vùng">
            <Input placeholder="Nhập vùng" disabled={!isEditMode} />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          {/* Số đơn hàng */}
          <Form.Item name="soDonHang" label="Số đơn hàng">
            <Input placeholder="Nhập số đơn hàng" disabled={!isEditMode} />
          </Form.Item>
        </Col>
        <Col span={12}>
          {/* Nhân viên */}
          <Form.Item name="nhanVien" label="Nhân viên">
            <Input placeholder="Nhập nhân viên" disabled={!isEditMode} />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          {/* Số phiếu xuất bán */}
          <Form.Item name="soPhieuXuatBan" label="Số phiếu xuất bán">
            <Input
              placeholder="Nhập số phiếu xuất bán"
              disabled={!isEditMode}
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          {/* Bàn đóng gói */}
          <Form.Item name="banDongGoi" label="Bàn đóng gói">
            <Input placeholder="Nhập bàn đóng gói" disabled={!isEditMode} />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          {/* Trạng thái */}
          <Form.Item name="trangThai" label="Trạng thái">
            <Select
              placeholder="Chọn trạng thái"
              disabled={!isEditMode}
              dropdownClassName="phieu-form-dropdown"
              popupMatchSelectWidth={false}
              options={[
                { value: "0", label: "Mới chia đơn" },
                { value: "2", label: "Nhặt hàng" },
                { value: "3", label: "Chuyển số cái" },
                { value: "5", label: "Đề nghị nhặt hàng" },
              ]}
            />
          </Form.Item>
        </Col>
        <Col span={12}>{/* Empty column for layout balance */}</Col>
      </Row>

      <Row gutter={16}>
        <Col span={24}>
          {/* Ghi chú */}
          <Form.Item name="dienGiai" label="Ghi chú">
            <Input placeholder="Nhập ghi chú" disabled={!isEditMode} />
          </Form.Item>
        </Col>
      </Row>
    </>
  );
};

export default PhieuNhatHangFormInputs;
