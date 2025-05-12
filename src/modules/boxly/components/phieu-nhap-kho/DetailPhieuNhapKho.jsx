import { EditOutlined, LeftOutlined, QrcodeOutlined } from "@ant-design/icons";
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
import moment from "moment/moment";
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import "./phieu-nhap-kho.css";

const { Title } = Typography;

const DetailPhieuNhapKho = ({ isEditMode: initialEditMode = false }) => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [phieuData, setPhieuData] = useState(null);
  const [isEditMode, setIsEditMode] = useState(initialEditMode);
  const [vatTuInput, setVatTuInput] = useState(undefined);
  const [barcodeEnabled, setBarcodeEnabled] = useState(false);
  const [dataSource, setDataSource] = useState([]);

  const vatTuOptions = [
    { label: "QSP0915 - Dem M3 SÉNY", value: "QSP0915" },
    { label: "DS209 - Dem M3 SÉNY", value: "DS209" },
    { label: "DVD - Dem dạt Eco", value: "DVD" },
  ];

  const handleVatTuSelect = (value) => {
    if (!isEditMode) {
      message.warning("Bạn cần bật chế độ chỉnh sửa");
      return;
    }

    // Nếu đã có vật tư thì tăng số lượng, chưa có thì thêm mới
    setDataSource((prev) => {
      const existing = prev.find((item) => item.maHang === value);
      if (existing) {
        return prev.map((item) =>
          item.maHang === value ? { ...item, soLuong: item.soLuong + 1 } : item
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
    setTimeout(() => setVatTuInput(undefined), 0); // reset lại Select
  };

  useEffect(() => {
    const isEditPath = location.pathname.includes("/edit/");
    setIsEditMode(isEditPath);

    if (!phieuData || phieuData.id !== Number(id)) {
      const fetchPhieuDetail = async () => {
        setLoading(true);
        try {
          await new Promise((resolve) => setTimeout(resolve, 500));

          const mockData = {
            id: 1,
            ngay: "2023-01-01",
            soPhieu: "PNK-001",
            maKhach: "KH001",
            tenKhach: "Công ty A",
            khoNhap: "kho1",
            ghiChu: "Giao hàng trước ngày 15",
            xe: "Xe 01",
            maSanPham: "",
            danhSachVatTu: [
              {
                key: 1,
                maHang: "QSP0915",
                soLuong: 1,
                noiDung:
                  "QSP0915 - Dem M3 SÉNY 180*200*9,Bo,80,A30...$2690000!",
              },
              {
                key: 2,
                maHang: "DS209",
                soLuong: 1,
                noiDung: "DS209 - Dem M3 SÉNY 200*220*9,Bo,80,C00...$3190000!",
              },
            ],
          };

          setPhieuData(mockData);
          form.setFieldsValue({
            ...mockData,
            ngay: moment(mockData.ngay),
          });
          setDataSource(mockData.danhSachVatTu);
        } catch (error) {
          message.error("Lỗi khi tải dữ liệu phiếu");
        } finally {
          setLoading(false);
        }
      };

      fetchPhieuDetail();
    }
  }, [id, form, location.pathname, phieuData]);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();

      // Giả lập API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      message.success(isEditMode ? "Cập nhật thành công" : "Lưu thành công");
      navigate("../phieu-nhap-kho");
    } catch (error) {
      message.error("Vui lòng kiểm tra lại thông tin");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    navigate(`/boxly/phieu-nhap-kho/edit/${id}`);
    setIsEditMode(true);
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
        <Title level={3} className="phieu-title">
          {isEditMode ? "CHỈNH SỬA PHIẾU NHẬP KHO" : "CHI TIẾT PHIẾU NHẬP KHO"}
        </Title>
        {!isEditMode && (
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={handleEdit}
            className="phieu-edit-button"
          >
            Chỉnh sửa
          </Button>
        )}
      </div>

      <div className="phieu-form-container">
        <Form
          form={form}
          layout="vertical"
          className="phieu-form"
          disabled={!isEditMode}
        >
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="soPhieu" label="Số phiếu">
                <Input readOnly />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="ngay" label="Ngày">
                <Input readOnly />
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
                <Input readOnly />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="maKhach" label="Đối tượng tạo phiếu xuất">
                <Input readOnly />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item name="xe" label="Xe vận chuyển">
                <Input readOnly />
              </Form.Item>
            </Col>
          </Row>

          <Space style={{ marginBottom: 16 }}> 
            <Button type="primary">Lưu</Button>
            <Button danger>Xoá phiếu</Button>
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

export default DetailPhieuNhapKho;
