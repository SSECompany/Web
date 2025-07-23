import { Col, DatePicker, Form, Input, Row, Select } from "antd";

const PhieuFormInputs = ({
  isEditMode,
  maKhachList,
  loadingMaKhach,
  fetchMaKhachListDebounced,
  maGiaoDichList,
  fetchMaKhachList,
  fetchMaGiaoDichList,
}) => {
  return (
    <>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="maKhach"
            label="Mã khách"
            rules={[
              {
                required: true,
                message: "Vui lòng chọn khách hàng",
              },
            ]}
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
              dropdownClassName="custom-dropdown"
              optionLabelProp="value"
              disabled={!isEditMode}
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="soPhieu" label="Số phiếu">
            <Input placeholder="Nhập số phiếu" disabled={!isEditMode} />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="dienGiai" label="Diễn giải">
            <Input disabled={!isEditMode} />
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
              disabled={!isEditMode}
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="trangThai" label="Trạng thái">
            <Select placeholder="Chọn trạng thái" disabled={!isEditMode}>
              <Select.Option value="0">Lập chứng từ</Select.Option>
              <Select.Option value="4">Đề nghị xuất kho</Select.Option>
              <Select.Option value="5">Xuất kho</Select.Option>
              <Select.Option value="6">Hoàn thành</Select.Option>
            </Select>
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="xe" label="Xe vận chuyển">
            <Input disabled={!isEditMode} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="taiXe" label="Tài xế">
            <Input disabled={!isEditMode} />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="maNVBH" label="Nhân viên bán hàng">
            <Input disabled={!isEditMode} />
          </Form.Item>
        </Col>
      </Row>
    </>
  );
};

export default PhieuFormInputs;
