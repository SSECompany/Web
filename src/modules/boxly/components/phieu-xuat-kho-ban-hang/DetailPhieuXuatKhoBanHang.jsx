import { EditOutlined, LeftOutlined, QrcodeOutlined } from "@ant-design/icons";
import {
  Button,
  Col,
  DatePicker,
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
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import "./phieu-xuat-kho-ban-hang.css";

const { Title } = Typography;

const DetailPhieuXuatKhoBanHang = ({ isEditMode: initialEditMode = false }) => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [phieuData, setPhieuData] = useState(null);
  const [isEditMode, setIsEditMode] = useState(initialEditMode);
  const [vatTuInput, setVatTuInput] = useState(undefined);
  const [barcodeEnabled, setBarcodeEnabled] = useState(false);
  const [barcodeJustEnabled, setBarcodeJustEnabled] = useState(false);
  const [dataSource, setDataSource] = useState([]);
  const vatTuSelectRef = useRef();

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
          ten_mat_hang:
            vatTuOptions.find((v) => v.value === value)?.label || value,
        };
        return [...prev, newItem];
      }
    });

    message.success(`Đã thêm vật tư: ${value}`);
    setTimeout(() => setVatTuInput(undefined), 0); // reset lại Select
  };

  useEffect(() => {
    if (barcodeJustEnabled && vatTuSelectRef.current) {
      vatTuSelectRef.current.focus();
      setBarcodeJustEnabled(false);
    }
  }, [barcodeJustEnabled]);

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
            soPhieu: "PXK-001",
            maKhach: "KH001",
            dienGiai: "Diễn giải mẫu",
            tenKhach: "Công ty A",
            khoXuat: "kho1",
            ghiChu: "Giao hàng trước ngày 15",
            xe: "Xe 01",
            maSanPham: "",
            danhSachVatTu: [
              {
                key: 1,
                maHang: "QSP0915",
                soLuong: 1,
                ten_mat_hang:
                  "QSP0915 - Dem M3 SÉNY 180*200*9,Bo,80,A30...$2690000!",
                dvt: "Cái",
                maKho: "KHO1",
              },
              {
                key: 2,
                maHang: "DS209",
                soLuong: 1,
                ten_mat_hang:
                  "DS209 - Dem M3 SÉNY 200*220*9,Bo,80,C00...$3190000!",
                dvt: "Cái",
                maKho: "KHO2",
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
      navigate("../");
    } catch (error) {
      message.error("Vui lòng kiểm tra lại thông tin");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    navigate(`../edit/${id}`);
    setIsEditMode(true);
  };

  return (
    <div className="phieu-container">
      <div className="phieu-header">
        <Button
          type="text"
          icon={<LeftOutlined />}
          onClick={() => navigate("../")}
          className="phieu-back-button"
        >
          Trở về
        </Button>
        <Title level={3} className="phieu-title">
          {isEditMode
            ? "CHỈNH SỬA PHIẾU XUẤT KHO BÁN HÀNG"
            : "CHI TIẾT PHIẾU XUẤT KHO BÁN HÀNG"}
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
            <Col span={12}>
              <Form.Item name="maKhach" label="Mã khách">
                <Input readOnly />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="soPhieu" label="Số phiếu">
                <Input readOnly />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="dienGiai" label="Diễn giải">
                <Input />
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
            <Col span={24}>
              <Form.Item label="Vật tư">
                <Input.Group compact>
                  <Select
                    ref={vatTuSelectRef}
                    value={vatTuInput}
                    onChange={setVatTuInput}
                    allowClear
                    showSearch
                    placeholder="Tìm kiếm hoặc chọn vật tư"
                    style={{ width: "calc(100% - 40px)" }}
                    options={vatTuOptions}
                    onSelect={handleVatTuSelect}
                    // open={!barcodeEnabled} // Đã tắt, không tự động mở Select nữa
                  />
                  <Button
                    icon={<QrcodeOutlined />}
                    type={barcodeEnabled ? "primary" : "default"}
                    onClick={() => {
                      setBarcodeEnabled((prev) => {
                        const next = !prev;
                        if (next) setBarcodeJustEnabled(true);
                        return next;
                      });
                    }}
                  />
                </Input.Group>
              </Form.Item>
            </Col>
          </Row>

          <Table
            bordered
            dataSource={dataSource}
            columns={[
              { title: "STT", dataIndex: "key", key: "key", width: 60 },
              { title: "Mã hàng", dataIndex: "maHang", key: "maHang" },
              {
                title: "Tên mặt hàng",
                dataIndex: "ten_mat_hang",
                key: "ten_mat_hang",
              },
              { title: "Đvt", dataIndex: "dvt", key: "dvt", width: 80 },
              {
                title: "Số lượng",
                dataIndex: "soLuong",
                key: "soLuong",
                width: 100,
              },
              { title: "Mã kho", dataIndex: "maKho", key: "maKho", width: 100 },
            ]}
            pagination={false}
          />
          <Space style={{ marginTop: 16 }}>
            <Button type="primary" onClick={handleSubmit}>
              Lưu
            </Button>
            <Button danger>Xóa</Button>
            <Button>Mới</Button>
          </Space>
        </Form>
      </div>
    </div>
  );
};

export default DetailPhieuXuatKhoBanHang;
