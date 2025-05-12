import { LeftOutlined, SaveOutlined, QrcodeOutlined } from "@ant-design/icons";
import {
  Button,
  Col,
  Form,
  Input,
  message,
  Row,
  Select,
  Space,
  Table,
  Typography,
} from "antd";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./phieu-nhap-kho.css";

const { Title } = Typography;

const AddPhieuNhapKho = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [vatTuInput, setVatTuInput] = useState(undefined);
  const [barcodeEnabled, setBarcodeEnabled] = useState(false);
  const [dataSource, setDataSource] = useState([]);

  const vatTuOptions = [
    { label: "QSP0915 - Dem M3 SÉNY", value: "QSP0915" },
    { label: "DS209 - Dem M3 SÉNY", value: "DS209" },
    { label: "DVD - Dem dạt Eco", value: "DVD" },
  ];

  const handleVatTuSelect = (value) => {
    if (!barcodeEnabled) {
      message.warning("Bạn cần bật chế độ quét barcode");
      return;
    }

    setDataSource((prev) => {
      const existing = prev.find((item) => item.maHang === value);
      if (existing) {
        return prev.map((item) =>
          item.maHang === value
            ? { ...item, soLuong: item.soLuong + 1 }
            : item
        );
      } else {
        const newItem = {
          key: prev.length + 1,
          maHang: value,
          soLuong: 1,
          noiDung: vatTuOptions.find((v) => v.value === value)?.label || value,
        };
        return [...prev, newItem];
      }
    });

    message.success(`Đã thêm vật tư: ${value}`);
    setTimeout(() => setVatTuInput(undefined), 0);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();

      // Giả lập API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Xử lý sau khi thêm thành công
      message.success("Thêm phiếu nhập kho thành công");
      navigate("../phieu-nhap-kho");
    } catch (error) {
      message.error("Vui lòng kiểm tra lại thông tin");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="phieu-container">
      <div className="phieu-header">
        <Button
          type="text"
          icon={<LeftOutlined />}
          onClick={() => navigate("../phieu-nhap-kho")}
          className="phieu-back-button"
        >
          Trở về
        </Button>
        <Title level={3} className="phieu-title">THÊM PHIẾU NHẬP KHO MỚI</Title>
      </div>

      <div className="phieu-form-container">
        <Form
          form={form}
          layout="vertical"
          className="phieu-form"
        >
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="soPhieu" label="Số phiếu" rules={[{ required: true }]}>
                <Input placeholder="Nhập số phiếu" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="ngay" label="Ngày" rules={[{ required: true }]}>
                <Input placeholder="Nhập ngày" />
              </Form.Item>
            </Col>

            <Col span={24}>
              <Form.Item label="Vật tư">
                <Input.Group compact>
                  <Select
                    value={vatTuInput}
                    onChange={setVatTuInput}
                    allowClear
                    showSearch
                    placeholder="Tìm kiếm hoặc chọn vật tư"
                    style={{ width: "calc(100% - 40px)" }}
                    options={vatTuOptions}
                    onSelect={handleVatTuSelect}
                  />
                  <Button
                    icon={<QrcodeOutlined />}
                    type={barcodeEnabled ? "primary" : "default"}
                    onClick={() => setBarcodeEnabled((prev) => !prev)}
                  />
                </Input.Group>
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item name="tenKhach" label="Tạo bởi">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="maKhach" label="Đối tượng tạo phiếu xuất">
                <Input />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item name="xe" label="Xe vận chuyển">
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Space style={{ marginBottom: 16 }}>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={handleSubmit}
              loading={loading}
              className="phieu-save-button"
            >
              Lưu phiếu
            </Button>
          </Space>

          <Table
            bordered
            dataSource={dataSource}
            columns={[
              { title: "STT", dataIndex: "key", key: "key", width: 60 },
              { title: "Nội dung", dataIndex: "noiDung", key: "noiDung" },
              { title: "SL", dataIndex: "soLuong", key: "soLuong", width: 80 },
              {
                title: "Mã hàng",
                dataIndex: "maHang",
                key: "maHang",
                width: 100,
              },
            ]}
            pagination={false}
          />
        </Form>
      </div>
    </div>
  );
};

export default AddPhieuNhapKho;
