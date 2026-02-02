import { DatePicker, Form, Input, Select, Card } from "antd";
import dayjs from "dayjs";
import React from "react";
import { FileTextOutlined, ShoppingOutlined, UserOutlined, TruckOutlined, InfoCircleOutlined, EnvironmentOutlined, PhoneOutlined, RightOutlined, CheckCircleOutlined } from "@ant-design/icons";

const { TextArea } = Input;

const PhieuGiaoHangFormInputs = ({
  form,
  isEditMode,
  maGiaoDichList,
  maKhoList,
  maKhachList,
  loadingMaKho,
  loadingMaKhach,
  onMaKhoSearch,
  onMaKhachSearch,
  onMaKhachSelect,
  phieuData,
}) => {
  // Lấy giá trị từ form hoặc phieuData
  const tenNhaXe = form.getFieldValue("ten_nha_xe") || phieuData?.master?.ten_nha_xe || "";
  const sdtNhaXe = form.getFieldValue("sdt_nha_xe") || phieuData?.master?.sdt_nha_xe || "";
  const gioChay = form.getFieldValue("gio_chay") || phieuData?.master?.gio_chay || "";
  const tenKh = form.getFieldValue("ten_kh") || phieuData?.master?.ten_kh || "";
  const soDienThoai = form.getFieldValue("so_dien_thoai") || phieuData?.master?.so_dien_thoai || phieuData?.master?.sdt_kh || "";
  const diaChi = form.getFieldValue("dia_chi") || phieuData?.master?.dia_chi || "";
  const status = form.getFieldValue("status") || phieuData?.master?.status || "1";
  
  // Map status to text
  const getStatusText = (status) => {
    switch (String(status)) {
      case "1": return "Lập chứng từ";
      case "2": return "Lưu kho";
      case "3": return "Xuất hàng";
      case "4": return "Đã tiếp nhận";
      case "5": return "Bàn giao ĐVVC";
      case "6": return "Hoàn thành";
      case "7": return "Thất bại";
      default: return "Lập chứng từ";
    }
  };
  return (
    <>
      {/* 1. THÔNG TIN GIAO HÀNG - Gộp phiếu + đơn hàng */}
      <Card className="detail-form-section-card" size="small">
        <div className="detail-form-section-header">
          <FileTextOutlined className="detail-form-section-icon" />
          <span className="detail-form-section-title">Thông tin giao hàng</span>
        </div>
        <div className="detail-giao-hang-form-grid">
          <Form.Item label="Số phiếu" name="so_ct">
            <Input placeholder="Số phiếu giao hàng" disabled={!isEditMode} />
          </Form.Item>

          <Form.Item
            label="Ngày phiếu"
            name="ngay_ct"
            rules={[{ required: true, message: "Vui lòng chọn ngày" }]}
          >
            <DatePicker
              style={{ width: "100%" }}
              format="DD/MM/YYYY"
              placeholder="Chọn ngày"
              disabled={!isEditMode}
              disabledDate={(current) => current && current > dayjs().endOf("day")}
            />
          </Form.Item>

          <Form.Item label="Số đơn hàng" name="so_don_hang">
            <Input placeholder="Số đơn hàng" disabled={!isEditMode} />
          </Form.Item>

          <Form.Item label="Ngày đơn hàng" name="ngay_don_hang">
            <DatePicker
              style={{ width: "100%" }}
              format="DD/MM/YYYY"
              placeholder="Chọn ngày đơn hàng"
              disabled={!isEditMode}
            />
          </Form.Item>

          <Form.Item label="Tổng số kiện" name="tong_so_kien">
            <Input placeholder="Tổng số kiện" type="number" disabled={!isEditMode} />
          </Form.Item>
        </div>
      </Card>

      {/* 2. KHÁCH HÀNG & ĐỊA CHỈ NHẬN - Gộp thông tin KH + địa chỉ */}
      <Card className="detail-form-section-card detail-address-card" size="small">
        <div className="detail-address-header">
          <EnvironmentOutlined className="detail-address-icon" />
          <span className="detail-address-title">Khách hàng & Địa chỉ nhận</span>
        </div>
        <div className="detail-address-content">
          <div className="detail-address-info">
            <div className="detail-address-name-phone">
              <span className="detail-address-name">{tenKh || "Chưa có thông tin"}</span>
              {soDienThoai && (
                <span className="detail-address-phone">
                  <PhoneOutlined /> {soDienThoai}
                </span>
              )}
            </div>
            {diaChi && (
              <div className="detail-address-text">{diaChi}</div>
            )}
            {!diaChi && (
              <div className="detail-address-text detail-address-empty">Chưa có địa chỉ</div>
            )}
          </div>
        </div>
      </Card>

      {/* 3. VẬN CHUYỂN & GHI CHÚ - Gộp vận chuyển + ghi chú */}
      <Card className="detail-form-section-card detail-shipping-card" size="small">
        <div className="detail-shipping-header">
          <TruckOutlined className="detail-shipping-icon" />
          <span className="detail-shipping-title">Thông tin vận chuyển</span>
        </div>
        <div className="detail-shipping-content">
          {tenNhaXe && (
            <div className="detail-shipping-carrier">
              <span className="detail-shipping-carrier-label">Nhà xe:</span>
              <span className="detail-shipping-carrier-name">{tenNhaXe}</span>
              {sdtNhaXe && (
                <span className="detail-shipping-carrier-phone">({sdtNhaXe})</span>
              )}
            </div>
          )}
          {gioChay && (
            <div className="detail-shipping-time">
              <span className="detail-shipping-time-label">Giờ chạy:</span>
              <span className="detail-shipping-time-value">{gioChay}</span>
            </div>
          )}
          <div className="detail-shipping-status">
            <CheckCircleOutlined className="detail-shipping-status-icon" />
            <span className="detail-shipping-status-text">{getStatusText(status)}</span>
          </div>
          {(!tenNhaXe && !gioChay) && (
            <div className="detail-shipping-empty">Chưa có thông tin vận chuyển</div>
          )}
        </div>
        
        {/* Ghi chú gộp vào đây */}
        <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #f0f0f0' }}>
          <Form.Item label="" name="ghi_chu" style={{ marginBottom: 0 }}>
            <TextArea rows={2} placeholder="Nhập ghi chú" disabled={!isEditMode} />
          </Form.Item>
        </div>
      </Card>
    </>
  );
};

export default PhieuGiaoHangFormInputs;
