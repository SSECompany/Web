import {
  BankOutlined,
  BarcodeOutlined,
  CalendarOutlined,
  DownOutlined,
  FileTextOutlined,
  HomeOutlined,
  IdcardOutlined,
  MedicineBoxOutlined,
  PhoneOutlined,
  TeamOutlined,
  UpOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Button, Card, Col, Input, Row } from "antd";
import React, { useRef, useState } from "react";

const CustomerInfo = ({
  customer,
  setCustomer,
  customerOpen,
  setCustomerOpen,
}) => {
  const [barcodeEnabled, setBarcodeEnabled] = useState(false);
  const inputRef = useRef(null);

  const handleBarcodeToggle = () => {
    const newBarcodeEnabled = !barcodeEnabled;
    setBarcodeEnabled(newBarcodeEnabled);

    if (newBarcodeEnabled && inputRef.current) {
      // Focus vào input khi bật barcode mode
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      }, 100);
    }
  };

  const handleBarcodeInputChange = (e) => {
    const value = e.target.value;
    setCustomer({ ...customer, prescriptionCode: value });

    // Auto-submit khi có barcode (thường barcode có độ dài >= 8)
    if (barcodeEnabled && value && value.length >= 8) {
      setTimeout(() => {
        // Có thể thêm logic xử lý barcode ở đây nếu cần
        console.log("Barcode scanned:", value);
      }, 200);
    }
  };

  const handleBarcodeInputKeyPress = (e) => {
    if (e.key === "Enter" && barcodeEnabled) {
      e.preventDefault();
      const value = customer.prescriptionCode;
      if (value && value.trim()) {
        console.log("Barcode submitted:", value);
        // Có thể thêm logic xử lý barcode ở đây
      }
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {/* Thẻ Mã đơn thuốc */}
      <Card
        size="small"
        title={
          <div className="customer-title">
            <span style={{ fontSize: "13px", fontWeight: "500" }}>
              Mã đơn thuốc
            </span>
            <Button
              type="text"
              size="small"
              onClick={() => setCustomerOpen(!customerOpen)}
              className="toggle-btn"
              icon={
                customerOpen ? (
                  <UpOutlined style={{ fontSize: "11px" }} />
                ) : (
                  <DownOutlined style={{ fontSize: "11px" }} />
                )
              }
            />
          </div>
        }
        className="customer-info-card"
        headStyle={{ padding: "8px 12px", minHeight: "auto" }}
        bodyStyle={{ padding: "8px 12px" }}
      >
        {customerOpen && (
          <div style={{ position: "relative" }}>
            <style>
              {`
                .prescription-input .ant-input {
                  padding: 0 8px !important;
                  height: 30px !important;
                  line-height: 30px !important;
                  display: flex !important;
                  align-items: center !important;
                }
                .prescription-input .ant-input-prefix {
                  margin-right: 8px !important;
                  display: flex !important;
                  align-items: center !important;
                }
                .prescription-input .ant-input::placeholder {
                  line-height: 30px !important;
                  vertical-align: middle !important;
                }
              `}
            </style>
            <div
              style={{
                display: "flex",
                width: "100%",
                borderRadius: "8px",
                overflow: "hidden",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                border: "1px solid #d9d9d9",
                backgroundColor: "#fff",
                height: "32px",
              }}
            >
              <Input
                ref={inputRef}
                placeholder={
                  barcodeEnabled
                    ? "Quét barcode mã đơn thuốc..."
                    : "Mã đơn thuốc"
                }
                value={customer.prescriptionCode}
                onChange={handleBarcodeInputChange}
                onKeyPress={handleBarcodeInputKeyPress}
                size="small"
                prefix={
                  <FileTextOutlined
                    style={{ fontSize: "12px", color: "#1890ff" }}
                  />
                }
                style={{
                  fontSize: "12px",
                  border: "none",
                  borderRadius: "0",
                  flex: 1,
                  boxShadow: "none",
                  height: "30px",
                  lineHeight: "30px",
                  padding: "0 8px",
                  backgroundColor: barcodeEnabled ? "#f0f8ff" : "#fff",
                }}
                bordered={false}
                className="prescription-input"
              />
              <div
                style={{
                  width: "1px",
                  backgroundColor: "#d9d9d9",
                  height: "20px",
                  alignSelf: "center",
                }}
              />
              <Button
                type={barcodeEnabled ? "primary" : "text"}
                size="small"
                icon={<BarcodeOutlined style={{ fontSize: "12px" }} />}
                onClick={handleBarcodeToggle}
                title={
                  barcodeEnabled ? "Tắt chế độ barcode" : "Bật chế độ barcode"
                }
                style={{
                  border: "none",
                  borderRadius: "0",
                  width: "44px",
                  height: "30px",
                  backgroundColor: barcodeEnabled ? "#1890ff" : "transparent",
                  color: barcodeEnabled ? "#fff" : "#1890ff",
                  transition: "all 0.3s ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "0",
                  minWidth: "44px",
                }}
              />
            </div>
          </div>
        )}
      </Card>

      {/* Thẻ Thông tin khách hàng */}
      <Card
        size="small"
        title={
          <span style={{ fontSize: "13px", fontWeight: "500" }}>
            Thông tin khách hàng
          </span>
        }
        className="customer-info-card"
        headStyle={{ padding: "8px 12px", minHeight: "auto" }}
        bodyStyle={{ padding: "8px 12px" }}
      >
        {customerOpen && (
          <div style={{ fontSize: "12px" }}>
            {/* Nhóm 1: Thông tin liên hệ */}
            <div style={{ marginBottom: "8px" }}>
              <Row gutter={[6, 4]}>
                <Col span={12}>
                  <Input
                    placeholder="Số điện thoại"
                    value={customer.phone}
                    onChange={(e) =>
                      setCustomer({ ...customer, phone: e.target.value })
                    }
                    size="small"
                    prefix={<PhoneOutlined style={{ fontSize: "11px" }} />}
                    style={{ fontSize: "12px" }}
                  />
                </Col>
                <Col span={12}>
                  <Input
                    placeholder="Tên khách hàng"
                    value={customer.name}
                    onChange={(e) =>
                      setCustomer({ ...customer, name: e.target.value })
                    }
                    size="small"
                    prefix={<UserOutlined style={{ fontSize: "11px" }} />}
                    style={{ fontSize: "12px" }}
                  />
                </Col>
              </Row>
            </div>

            {/* Nhóm 2: Thông tin định danh */}
            <div style={{ marginBottom: "8px" }}>
              <Row gutter={[6, 4]}>
                <Col span={12}>
                  <Input
                    placeholder="CMND/CCCD"
                    value={customer.idNumber}
                    onChange={(e) =>
                      setCustomer({ ...customer, idNumber: e.target.value })
                    }
                    size="small"
                    prefix={<IdcardOutlined style={{ fontSize: "11px" }} />}
                    style={{ fontSize: "12px" }}
                  />
                </Col>
                <Col span={12}>
                  <Input
                    placeholder="Họ tên người bệnh"
                    value={customer.patientName}
                    onChange={(e) =>
                      setCustomer({ ...customer, patientName: e.target.value })
                    }
                    size="small"
                    prefix={<UserOutlined style={{ fontSize: "11px" }} />}
                    style={{ fontSize: "12px" }}
                  />
                </Col>
              </Row>
            </div>

            {/* Nhóm 3: Địa chỉ */}
            <div style={{ marginBottom: "8px" }}>
              <Input
                placeholder="Địa chỉ người bệnh"
                value={customer.patientAddress}
                onChange={(e) =>
                  setCustomer({ ...customer, patientAddress: e.target.value })
                }
                size="small"
                prefix={<HomeOutlined style={{ fontSize: "11px" }} />}
                style={{ fontSize: "12px" }}
              />
            </div>

            {/* Nhóm 4: Thông tin y tế */}
            <div style={{ marginBottom: "8px" }}>
              <Input
                placeholder="Chuẩn đoán"
                value={customer.diagnosis}
                onChange={(e) =>
                  setCustomer({ ...customer, diagnosis: e.target.value })
                }
                size="small"
                prefix={<MedicineBoxOutlined style={{ fontSize: "11px" }} />}
                style={{ fontSize: "12px" }}
              />
            </div>

            <div style={{ marginBottom: "8px" }}>
              <Input
                placeholder="Đợt điều trị"
                value={customer.treatmentPeriod}
                onChange={(e) =>
                  setCustomer({
                    ...customer,
                    treatmentPeriod: e.target.value,
                  })
                }
                size="small"
                prefix={<CalendarOutlined style={{ fontSize: "11px" }} />}
                style={{ fontSize: "12px" }}
              />
            </div>

            {/* Nhóm 5: Thông tin bác sĩ và cơ sở */}
            <div style={{ marginBottom: "8px" }}>
              <Input
                placeholder="Bác sĩ kê đơn"
                value={customer.prescribingDoctor}
                onChange={(e) =>
                  setCustomer({
                    ...customer,
                    prescribingDoctor: e.target.value,
                  })
                }
                size="small"
                prefix={<TeamOutlined style={{ fontSize: "11px" }} />}
                style={{ fontSize: "12px" }}
              />
            </div>

            <div>
              <Input
                placeholder="Cơ sở khám"
                value={customer.examinationFacility}
                onChange={(e) =>
                  setCustomer({
                    ...customer,
                    examinationFacility: e.target.value,
                  })
                }
                size="small"
                prefix={<BankOutlined style={{ fontSize: "11px" }} />}
                style={{ fontSize: "12px" }}
              />
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default CustomerInfo;
