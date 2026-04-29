import { Col, Form, Input, Row } from "antd";
import dayjs from "dayjs";

const PhieuNhatHangFormInputs = ({
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
  totalPage,
  pageIndex,
  setPageIndex,
  setVatTuList,
  currentKeyword,
  VatTuSelectComponent,
}) => {
  return (
    <>
      {/* Header fields customized per ERP screenshots */}
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            label="Phiếu nhặt hàng"
            shouldUpdate={(prevValues, curValues) =>
              prevValues.soPhieu !== curValues.soPhieu ||
              prevValues.ngay !== curValues.ngay
            }
          >
            {({ getFieldValue }) => {
              const soPhieu = getFieldValue("soPhieu") || "";
              const ngay = getFieldValue("ngay");
              const ngayStr = ngay ? dayjs(ngay).format("DD/MM/YYYY") : "";
              const displayValue =
                soPhieu && ngayStr
                  ? `${soPhieu} - ${ngayStr}`
                  : soPhieu || ngayStr || "";
              return (
                <Input
                  value={displayValue}
                  placeholder="Số chứng từ - Ngày lập"
                  disabled={true}
                />
              );
            }}
          </Form.Item>
          <Form.Item name="soPhieu" hidden>
            <Input />
          </Form.Item>
          <Form.Item name="ngay" hidden>
            <Input />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="vung" label="Vùng">
            <Input placeholder="Vùng" disabled={true} />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="soDonHang" label="Số đơn hàng">
            <Input placeholder="Số đơn hàng" disabled={true} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="nhanVien" label="Nhân viên nhặt hàng">
            <Input placeholder="Nhân viên nhặt hàng" disabled={true} />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="batDauNhatHang" label="Bắt đầu nhặt hàng">
            <Input placeholder="Bắt đầu nhặt hàng" disabled={true} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="ketThucNhatHang" label="Kết thúc nhặt hàng">
            <Input placeholder="Kết thúc nhặt hàng" disabled={true} />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          {/* Bàn đóng gói - Input chỉ hiển thị */}
          <Form.Item name="banDongGoi" label="Bàn đóng gói">
            <Input placeholder="Bàn đóng gói" disabled={true} />
          </Form.Item>
        </Col>
        <Col span={12}>
          {/* Trạng thái - Input chỉ hiển thị - sử dụng statusname từ API */}
          <Form.Item
            label="Trạng thái"
            shouldUpdate={(prevValues, curValues) =>
              prevValues.statusname !== curValues.statusname
            }
          >
            {({ getFieldValue }) => {
              const statusname = getFieldValue("statusname") || "";
              return (
                <Input
                  value={statusname}
                  placeholder="Trạng thái"
                  disabled={true}
                />
              );
            }}
          </Form.Item>
          {/* Hidden fields to store actual values */}
          <Form.Item name="trangThai" hidden>
            <Input />
          </Form.Item>
          <Form.Item name="statusname" hidden>
            <Input />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={24}>
          {/* Ghi chú - Input chỉ hiển thị */}
          <Form.Item name="dienGiai" label="Ghi chú">
            <Input placeholder="Ghi chú" disabled={true} />
          </Form.Item>
        </Col>
      </Row>
    </>
  );
};

export default PhieuNhatHangFormInputs;
