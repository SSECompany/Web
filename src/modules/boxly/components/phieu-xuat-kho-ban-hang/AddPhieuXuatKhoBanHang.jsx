import {
  DeleteOutlined,
  LeftOutlined,
  QrcodeOutlined,
} from "@ant-design/icons";
import {
  Button,
  Col,
  DatePicker,
  Empty,
  Form,
  Input,
  message,
  Row,
  Select,
  Space,
  Table,
  Typography,
} from "antd";
import dayjs from "dayjs";
import { debounce } from "lodash";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import https from "../../../../utils/https";
import "./phieu-xuat-kho-ban-hang.css";

const { Title } = Typography;

const AddPhieuXuatKhoBanHang = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [vatTuInput, setVatTuInput] = useState(undefined);
  const [barcodeEnabled, setBarcodeEnabled] = useState(false);
  const [barcodeJustEnabled, setBarcodeJustEnabled] = useState(false);
  const [dataSource, setDataSource] = useState([]);
  const [maGiaoDichList, setMaGiaoDichList] = useState([]);
  const [maKhachList, setMaKhachList] = useState([]);
  const [loadingMaKhach, setLoadingMaKhach] = useState(false);
  const [vatTuList, setVatTuList] = useState([]);
  const [loadingVatTu, setLoadingVatTu] = useState(false);
  const vatTuSelectRef = useRef();
  const searchTimeoutRef = useRef();

  const token = localStorage.getItem("access_token");

  const fetchMaKhachListDebounced = useRef(
    debounce((keyword) => {
      fetchMaKhachList(keyword);
    }, 500)
  ).current;

  const fetchVatTuListDebounced = useRef(
    debounce((keyword) => {
      fetchVatTuList(keyword);
    }, 500)
  ).current;

  useEffect(() => {
    // Tải danh sách mã giao dịch và mã khách
    fetchMaGiaoDichList();
    fetchMaKhachList();
    fetchVatTuList();
    fetchVoucherInfo();

    // Thiết lập giá trị mặc định cho ngày
    form.setFieldsValue({
      ngay: dayjs(),
      trangThai: "0",
    });
  }, []);

  useEffect(() => {
    if (barcodeJustEnabled && vatTuSelectRef.current) {
      vatTuSelectRef.current.focus();
      setBarcodeJustEnabled(false);
    }
  }, [barcodeJustEnabled]);

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const fetchVoucherInfo = async () => {
    try {
      const response = await https.get(
        "v1/web/thong-tin-phieu-nhap",
        { voucherCode: "HDA" },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (
        response.data &&
        response.data.data &&
        response.data.data.length > 0
      ) {
        const voucherData = response.data.data[0];
        console.log("Voucher data:", voucherData);

        form.setFieldsValue({
          soPhieu: voucherData.so_phieu_nhap,
          ngay: voucherData.ngay_lap ? dayjs(voucherData.ngay_lap) : dayjs(),
          maGiaoDich: voucherData.ma_giao_dich || "1",
          maKhach: voucherData.ma_khach || "",
          dienGiai: voucherData.dien_giai || "",
          trangThai: voucherData.status || "0",
        });
      }
    } catch (error) {
      console.error("Error fetching voucher info:", error);
      message.error("Không thể tải thông tin phiếu xuất kho bán hàng");
    }
  };

  const fetchMaGiaoDichList = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await https.get(
        "v1/web/danh-sach-ma-gd",
        { ma_ct: "HDA" },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.data && response.data.data) {
        setMaGiaoDichList(response.data.data);
      }
    } catch (error) {
      message.error("Không thể tải danh sách mã giao dịch");
    }
  };

  const fetchMaKhachList = async (keyword = "") => {
    setLoadingMaKhach(true);
    try {
      const response = await https.get(
        "v1/web/danh-sach-khach-hang",
        {
          searchMaKH: "", // auto truyền rỗng
          searchTenKH: keyword, // chỉ truyền keyword vào đây
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.data && response.data.data) {
        const options = response.data.data.map((item) => ({
          value: item.ma_kh.trim(),
          label: `${item.ma_kh.trim()} - ${item.ten_kh.trim()}`,
        }));
        setMaKhachList(options);
      }
    } catch (error) {
      message.error("Không thể tải danh sách khách hàng");
    } finally {
      setLoadingMaKhach(false);
    }
  };

  const fetchVatTuList = async (keyword = "") => {
    try {
      setLoadingVatTu(true);
      const response = await https.post(
        "v1/web/danh-sach-vat-tu",
        {
          key_word: keyword,
        },
        {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        }
      );

      if (response.data && response.data.data) {
        const options = response.data.data.map((item) => ({
          label: `${item.ma_vt} - ${item.ten_vt}`,
          value: item.ma_vt,
          ...item,
        }));
        setVatTuList(options);
      }
    } catch (error) {
      console.error("Error fetching vat tu list:", error);
      message.error("Không thể tải danh sách vật tư");
    } finally {
      setLoadingVatTu(false);
    }
  };

  const fetchVatTuDetail = async (maVatTu) => {
    try {
      const response = await https.post(
        "v1/web/tim-kiem-vat-tu",
        {
          key_word: maVatTu,
        },
        {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        }
      );

      if (response.data && response.data.data) {
        return response.data.data;
      }
      return null;
    } catch (error) {
      console.error("Error fetching vat tu detail:", error);
      message.error("Không thể tải thông tin vật tư");
      return null;
    }
  };

  // Thêm hàm mới để fetch danh sách đơn vị tính
  const fetchDonViTinh = async (maVatTu) => {
    try {
      const response = await https.get(
        "v1/web/danh-sach-dv",
        {
          ma_vt: maVatTu,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data && response.data.data) {
        return response.data.data;
      }
      return [];
    } catch (error) {
      console.error("Error fetching don vi tinh:", error);
      return [];
    }
  };

  const handleVatTuSelect = async (value, option) => {
    try {
      const vatTuDetail = await fetchVatTuDetail(value.trim());

      if (!vatTuDetail) {
        message.error("Không tìm thấy thông tin vật tư");
        return;
      }

      const vatTuInfo = Array.isArray(vatTuDetail)
        ? vatTuDetail[0]
        : vatTuDetail;

      // Gọi API lấy danh sách đơn vị tính
      const donViTinhList = await fetchDonViTinh(value.trim());

      // Lấy đơn vị tính từ API response (đã được trim spaces)
      const defaultDvt = vatTuInfo.dvt ? vatTuInfo.dvt.trim() : "cái";

      // Nếu đã có vật tư thì tăng số lượng, chưa có thì thêm mới
      setDataSource((prev) => {
        const existing = prev.find((item) => item.maHang === value);
        if (existing) {
          return prev.map((item) =>
            item.maHang === value ? { ...item, sl_td3: item.sl_td3 + 1 } : item
          );
        } else {
          const newItem = {
            key: prev.length + 1,
            maHang: value,
            so_luong: 0,
            sl_td3: 1,
            sl_td3_goc: 1, // Lưu số lượng gốc
            he_so: 1, // Hệ số mặc định là 1
            ten_mat_hang: vatTuInfo.ten_vt || value,
            dvt: defaultDvt, // Sử dụng dvt từ API response
            dvt_goc: defaultDvt, // Lưu đơn vị tính gốc
            tk_vt: vatTuInfo.tk_vt ? vatTuInfo.tk_vt.trim() : "",
            ma_kho: vatTuInfo.ma_kho ? vatTuInfo.ma_kho.trim() : "",
            donViTinhList: donViTinhList, // Lưu danh sách đơn vị tính
          };
          return [...prev, newItem];
        }
      });

      message.success(`Đã thêm vật tư: ${value}`);

      // Clear input ngay lập tức
      setVatTuInput("");

      // Clear danh sách vật tư để reset Select
      setVatTuList([]);

      // Load lại danh sách vật tư mới
      setTimeout(() => {
        fetchVatTuList("");
      }, 100);
    } catch (error) {
      console.error("Error adding vat tu:", error);
      message.error("Có lỗi xảy ra khi thêm vật tư");
    }
  };

  // Thêm hàm xử lý thay đổi số lượng
  const handleQuantityChange = (value, record, field) => {
    const newValue = value || 0;
    setDataSource((prev) =>
      prev.map((item) =>
        item.key === record.key
          ? {
              ...item,
              [field]: newValue,
            }
          : item
      )
    );
  };

  // Hàm xử lý xóa dòng vật tư
  const handleDeleteItem = (index) => {
    const newDataSource = dataSource.filter((_, i) => i !== index);
    // Cập nhật lại key cho các item
    const reIndexedDataSource = newDataSource.map((item, i) => ({
      ...item,
      key: i + 1,
    }));
    setDataSource(reIndexedDataSource);
    message.success("Đã xóa vật tư");
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();

      if (dataSource.length === 0) {
        message.error("Vui lòng thêm ít nhất một vật tư");
        return;
      }

      // Kiểm tra số lượng xuất phải lớn hơn 0
      const invalidItems = [];
      dataSource.forEach((item, index) => {
        const sl_td3 = parseFloat(item.sl_td3 || 0);
        if (sl_td3 <= 0) {
          invalidItems.push(`Dòng ${index + 1}: Số lượng xuất phải lớn hơn 0`);
        }
      });

      if (invalidItems.length > 0) {
        message.error({
          content: (
            <div>
              <div>Vui lòng kiểm tra lại số lượng xuất:</div>
              {invalidItems.map((msg, idx) => (
                <div key={idx}>• {msg}</div>
              ))}
            </div>
          ),
          duration: 6,
        });
        return;
      }

      const getUserInfo = () => {
        try {
          const userStr = localStorage.getItem("user");
          const unitsResponseStr = localStorage.getItem("unitsResponse");

          const user = userStr ? JSON.parse(userStr) : {};
          const unitsResponse = unitsResponseStr
            ? JSON.parse(unitsResponseStr)
            : {};

          return {
            userId: user.userId || 4061,
            userName: user.userName || "",
            unitId: user.unitId || unitsResponse.unitId || "VIKOSAN",
            unitName: user.unitName || unitsResponse.unitName || "VIKOSAN",
          };
        } catch (error) {
          console.error("Error parsing localStorage:", error);
          return {
            userId: 4061,
            userName: "",
            unitId: "VIKOSAN",
            unitName: "VIKOSAN",
          };
        }
      };

      const userInfo = getUserInfo();
      const token = localStorage.getItem("access_token");

      const totalQuantity = dataSource.reduce(
        (sum, item) => sum + parseFloat(item.sl_td3 || 0),
        0
      );

      const formatDate = (date) => {
        const d = date ? new Date(date) : new Date();
        return d.toISOString().split(".")[0]; // Bỏ milliseconds và Z
      };

      const orderDate = formatDate(values.ngay);

      const payload = {
        orderDate: orderDate,
        master: {
          stt_rec: "",
          ma_dvcs: userInfo.unitId,
          ma_ct: "HDA",
          loai_ct: "2",
          so_lo: "",
          ngay_lo: null,
          ma_nk: "",
          ma_gd: values.maGiaoDich,
          ngay_lct: orderDate,
          ngay_ct: orderDate,
          so_ct: values.soPhieu,
          ma_nt: "VND",
          ty_gia: 1.0,
          ong_ba: values.maKhach || "",
          ma_kh: values.maKhach || "",
          dien_giai: values.dienGiai || "",
          ma_nvbh: values.maNVBH || "",
          xe_vc: values.xe || "",
          tai_xe: values.taiXe || "",
          t_so_luong: totalQuantity,
          t_tien_nt: 0.0,
          t_tien: 0.0,
          nam: new Date(orderDate).getFullYear(),
          ky: new Date(orderDate).getMonth() + 1,
          status: values.trangThai || "0",
          datetime0: orderDate,
          datetime2: orderDate,
          user_id0: userInfo.userId,
          user_id2: userInfo.userId,
        },
        detail: dataSource.map((item, index) => ({
          stt_rec: "",
          stt_rec0: String(index + 1).padStart(3, "0"),
          ma_ct: "HDA",
          ngay_ct: orderDate,
          so_ct: values.soPhieu || "",
          ma_vt: item.maHang?.trim() || "",
          ma_sp: item.maHang?.trim() || "",
          ma_bp: "",
          so_lsx: "",
          dvt: item.dvt,
          he_so: 1.0,
          ma_kho: item.ma_kho || "",
          ma_vi_tri: "",
          ma_lo: "",
          ma_vv: "",
          ma_nx: "",
          tk_du: item.tk_co || "",
          tk_vt: item.tk_vt || "",
          so_luong: parseFloat(item.so_luong || 0),
          sl_td3: parseFloat(item.sl_td3 || 0),
          gia_nt: 0.0,
          gia: 0.0,
          tien_nt: 0.0,
          tien: 0.0,
          pn_gia_tb: false,
          stt_rec_px: "",
          stt_rec0px: "",
          line_nbr: parseInt(index + 1),
          tk_co: item.tk_co || "",
        })),
      };

      console.log("Payload tạo phiếu xuất kho:", payload);

      // Gọi API tạo phiếu xuất kho
      const response = await https.post(
        "v1/web/tao-phieu-xuat-kho-ban-hang",
        { Data: payload },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data && response.data.statusCode === 200) {
        message.success("Tạo phiếu xuất kho bán hàng thành công");
        navigate("/boxly/phieu-xuat-kho-ban-hang");
      } else {
        message.error(response.data?.message || "Có lỗi xảy ra khi tạo phiếu");
      }
    } catch (error) {
      console.error("Lỗi khi tạo phiếu xuất kho:", error);
      if (error.response?.data?.message) {
        message.error(error.response.data.message);
      } else {
        message.error("Vui lòng kiểm tra lại thông tin");
      }
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
          onClick={() => navigate("/boxly/phieu-xuat-kho-ban-hang")}
          className="phieu-back-button"
        >
          Trở về
        </Button>
        <Title level={3} className="phieu-title">
          THÊM PHIẾU XUẤT KHO BÁN HÀNG
        </Title>
      </div>

      <div className="phieu-form-container">
        <Form form={form} layout="vertical" className="phieu-form">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="maKhach"
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
                  options={maKhachList}
                  dropdownClassName="custom-dropdown"
                  optionLabelProp="value"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="soPhieu" label="Số phiếu">
                <Input placeholder="Nhập số phiếu" />
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
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="trangThai" label="Trạng thái">
                <Select placeholder="Chọn trạng thái">
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
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="taiXe" label="Tài xế">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="maNVBH" label="Nhân viên bán hàng">
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item label="Vật tư">
                <Input.Group compact>
                  {!barcodeEnabled ? (
                    <Select
                      ref={vatTuSelectRef}
                      value={vatTuInput}
                      onChange={setVatTuInput}
                      allowClear
                      showSearch
                      loading={loadingVatTu}
                      placeholder="Tìm kiếm hoặc chọn vật tư"
                      style={{ width: "calc(100% - 40px)" }}
                      options={vatTuList}
                      onSearch={(value) => {
                        if (searchTimeoutRef.current) {
                          clearTimeout(searchTimeoutRef.current);
                        }
                        searchTimeoutRef.current = setTimeout(() => {
                          fetchVatTuList(value);
                        }, 500);
                      }}
                      filterOption={false}
                      onSelect={handleVatTuSelect}
                    />
                  ) : (
                    <Input
                      ref={vatTuSelectRef}
                      value={vatTuInput}
                      onChange={(e) => setVatTuInput(e.target.value)}
                      placeholder="Quét barcode vật tư..."
                      style={{ width: "calc(100% - 40px)" }}
                      onPressEnter={() => {
                        if (vatTuInput && vatTuInput.trim()) {
                          handleVatTuSelect(vatTuInput);
                        }
                      }}
                    />
                  )}
                  <Button
                    icon={<QrcodeOutlined />}
                    type={barcodeEnabled ? "primary" : "default"}
                    onClick={() => {
                      setBarcodeEnabled((prev) => {
                        const next = !prev;
                        if (next) {
                          setBarcodeJustEnabled(true);
                          setVatTuInput("");
                        }
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
            locale={{
              emptyText: (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="Trống"
                />
              ),
            }}
            columns={[
              {
                title: "STT",
                dataIndex: "key",
                key: "key",
                width: 60,
                align: "center",
              },
              {
                title: "Mã hàng",
                dataIndex: "maHang",
                key: "maHang",
                align: "center",
              },
              {
                title: "Tên mặt hàng",
                dataIndex: "ten_mat_hang",
                key: "ten_mat_hang",
                align: "center",
              },
              {
                title: "Đvt",
                dataIndex: "dvt",
                key: "dvt",
                width: 80,
                align: "center",
                render: (value, record) => {
                  // Lấy danh sách đơn vị tính từ record
                  const dvtOptions = record.donViTinhList || [];

                  return (
                    <Select
                      value={value}
                      onChange={(newValue) => {
                        // Tìm thông tin đơn vị tính được chọn
                        const selectedDvt = dvtOptions.find(
                          (dvt) => dvt.dvt.trim() === newValue.trim()
                        );
                        const heSo = selectedDvt
                          ? parseFloat(selectedDvt.he_so) || 1
                          : 1;

                        // Lấy số lượng gốc (luôn giữ nguyên)
                        const soLuongGoc = record.sl_td3_goc || 1;

                        // Tính số lượng mới = số lượng gốc × hệ số
                        const soLuongMoi = soLuongGoc * heSo;

                        // Làm tròn đến 3 chữ số thập phân
                        const soLuongLamTron =
                          Math.round(soLuongMoi * 1000) / 1000;

                        setDataSource((prev) =>
                          prev.map((item) =>
                            item.key === record.key
                              ? {
                                  ...item,
                                  dvt: newValue,
                                  he_so: heSo,
                                  sl_td3: soLuongLamTron,
                                }
                              : item
                          )
                        );
                      }}
                      style={{ width: "100%" }}
                      size="small"
                    >
                      {dvtOptions.length > 0 ? (
                        dvtOptions.map((dvt) => (
                          <Select.Option key={dvt.dvt} value={dvt.dvt}>
                            {dvt.dvt}
                          </Select.Option>
                        ))
                      ) : (
                        <Select.Option value={value}>{value}</Select.Option>
                      )}
                    </Select>
                  );
                },
              },
              {
                title: "Số lượng đề nghị",
                dataIndex: "so_luong",
                key: "so_luong",
                width: 150,
                align: "center",
                render: (value, record) => (
                  <span
                    style={{
                      fontWeight: "bold",
                      display: "block",
                      textAlign: "center",
                    }}
                  >
                    {value ? Number(value).toFixed(0) : "0"}
                  </span>
                ),
              },
              {
                title: "Số lượng xuất",
                dataIndex: "sl_td3",
                key: "sl_td3",
                width: 150,
                align: "center",
                render: (value, record) => (
                  <Input
                    type="text"
                    value={value}
                    onChange={(e) => {
                      // Cho phép nhập số và dấu chấm thập phân
                      const val = e.target.value.replace(/[^0-9.]/g, "");
                      // Đảm bảo chỉ có 1 dấu chấm
                      const parts = val.split(".");
                      const formattedVal =
                        parts.length > 2
                          ? parts[0] + "." + parts.slice(1).join("")
                          : val;
                      handleQuantityChange(formattedVal, record, "sl_td3");
                    }}
                    style={{
                      width: "100%",
                      textAlign: "center",
                      fontWeight: "bold",
                    }}
                  />
                ),
              },
              {
                title: "Thao tác",
                key: "action",
                width: 80,
                align: "center",
                render: (_, record, index) => (
                  <Button
                    type="text"
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={() => handleDeleteItem(index)}
                    title="Xóa dòng"
                  />
                ),
              },
            ]}
            pagination={false}
          />
          <div
            style={{
              display: "flex",
              justifyContent: "flex-start",
              marginTop: 16,
            }}
          >
            <Space>
              <Button type="primary" onClick={handleSubmit}>
                Lưu
              </Button>
              <Button
                onClick={() => navigate("/boxly/phieu-xuat-kho-ban-hang")}
              >
                Hủy
              </Button>
            </Space>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default AddPhieuXuatKhoBanHang;
