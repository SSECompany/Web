import {
  DeleteOutlined,
  EditOutlined,
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
  Modal,
  Row,
  Select,
  Space,
  Table,
  Typography,
} from "antd";
import { debounce } from "lodash";
import moment from "moment/moment";
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import https from "../../../../utils/https";
import "./phieu-xuat-kho-ban-hang.css";

const { Title } = Typography;

const DetailPhieuXuatKhoBanHang = ({ isEditMode: initialEditMode = false }) => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { stt_rec } = useParams();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [phieuData, setPhieuData] = useState(null);
  const [isEditMode, setIsEditMode] = useState(initialEditMode);
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

  const handleVatTuSelect = async (value, option) => {
    if (!isEditMode) {
      message.warning("Bạn cần bật chế độ chỉnh sửa");
      return;
    }

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
            sl_td3_goc: 1,
            he_so: 1,
            ten_mat_hang: vatTuInfo.ten_vt || value,
            dvt: defaultDvt,
            dvt_goc: defaultDvt,
            tk_vt: vatTuInfo.tk_vt ? vatTuInfo.tk_vt.trim() : "",
            ma_kho: vatTuInfo.ma_kho ? vatTuInfo.ma_kho.trim() : "",
            donViTinhList: donViTinhList,
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

  useEffect(() => {
    if (barcodeJustEnabled && vatTuSelectRef.current) {
      vatTuSelectRef.current.focus();
      setBarcodeJustEnabled(false);
    }
  }, [barcodeJustEnabled]);

  useEffect(() => {
    const isEditPath = location.pathname.includes("/edit/");
    setIsEditMode(isEditPath);

    // Tải danh sách mã giao dịch và mã khách
    fetchMaGiaoDichList();
    fetchMaKhachList();
    fetchVatTuList();

    if (!phieuData || phieuData.stt_rec !== stt_rec) {
      const fetchPhieuDetail = async () => {
        setLoading(true);
        try {
          const token = localStorage.getItem("access_token");
          const res = await https.get(
            `v1/web/chi-tiet-chung-tu-xuat-kho-ban-hang?stt_rec=${stt_rec}`,
            {},
            {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            }
          );

          // Xử lý response từ API
          const data = res.data;

          if (
            data &&
            data.data &&
            data.data.length > 0 &&
            data.data2 &&
            data.data2.length > 0
          ) {
            const phieuHeader = data.data[0];
            const phieuDetails = data.data2;

            // Lưu toàn bộ dữ liệu phiếu
            setPhieuData({
              ...phieuHeader,
              details: phieuDetails,
            });

            // Chuyển đổi ngày từ định dạng ISO sang DD/MM/YYYY
            const ngayCt = phieuHeader.ngay_ct
              ? moment(phieuHeader.ngay_ct)
              : null;

            // Map dữ liệu từ API vào form
            form.setFieldsValue({
              maKhach: phieuHeader.ma_kh,
              soPhieu: phieuHeader.so_ct,
              dienGiai: phieuHeader.dien_giai,
              ngay: ngayCt,
              maNVBH: phieuHeader.ma_nvbh || "",
              xe: phieuHeader.xe_vc || "",
              taiXe: phieuHeader.tai_xe || "",
              maGiaoDich: phieuHeader.ma_gd || "",
              trangThai: phieuHeader.status || "3",
            });

            // Map danh sách vật tư từ data2
            if (phieuDetails.length > 0) {
              const mappedItems = await Promise.all(
                phieuDetails.map(async (item, index) => {
                  // Gọi API lấy danh sách đơn vị tính cho mỗi vật tư
                  const donViTinhList = await fetchDonViTinh(item.ma_vt);

                  return {
                    key: index + 1,
                    maHang: item.ma_vt,
                    so_luong: item.so_luong || 0,
                    sl_td3: item.sl_td3 || item.so_luong || 0,
                    sl_td3_goc: item.sl_td3 || item.so_luong || 0,
                    he_so: item.he_so || 1,
                    ten_mat_hang: item.ten_vt || item.ma_vt,
                    dvt: item.dvt,
                    dvt_goc: item.dvt,
                    tk_vt: item.tk_vt || "",
                    ma_kho: item.ma_kho || "",
                    tk_co: item.tk_co || "",
                    donViTinhList: donViTinhList, // Lưu danh sách đơn vị tính
                  };
                })
              );
              setDataSource(mappedItems);
            }
          }
        } catch (error) {
          console.error("Lỗi khi tải dữ liệu phiếu:", error);
          message.error("Lỗi khi tải dữ liệu phiếu");
        } finally {
          setLoading(false);
        }
      };

      fetchPhieuDetail();
    }
  }, [stt_rec, form, location.pathname, phieuData]);

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

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

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();

      if (dataSource.length === 0) {
        message.error("Vui lòng thêm ít nhất một vật tư");
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

      const formatDate = (date) => {
        const d = date ? new Date(date) : new Date();
        return d.toISOString().split(".")[0]; // Bỏ milliseconds và Z
      };

      const orderDate = formatDate(values.ngay);

      const payload = {
        Data: {
          orderDate: orderDate,
          master: {
            stt_rec: phieuData?.stt_rec || "",
            ma_dvcs: userInfo.unitId,
            ma_ct: "HDA",
            loai_ct: "2",
            so_lo: "",
            ngay_lo: null,
            ma_nk: "",
            ma_gd: values.maGiaoDich || "1",
            ngay_ct: orderDate,
            so_ct: values.soPhieu || "",
            ma_kh: values.maKhach || "",
            dien_giai: values.dienGiai || "",
            ma_nvbh: values.maNVBH || "",
            xe_vc: values.xe || "",
            tai_xe: values.taiXe || "",
            status: values.trangThai || "3",
          },
          detail: dataSource.map((item, index) => ({
            stt_rec: phieuData?.stt_rec || "",
            stt_rec0: String(index + 1).padStart(3, "0"),
            ma_ct: "HDA",
            ngay_ct: orderDate,
            so_ct: values.soPhieu || "",
            ma_vt: item.maHang?.trim() || "",
            dvt: item.dvt || "cái",
            ma_kho: item.ma_kho || "",
            so_luong: parseFloat(item.so_luong) || 0,
            sl_td3: parseFloat(item.sl_td3) || 0,
            tk_vt: item.tk_vt || "",
            tk_co: item.tk_co || "",
          })),
        },
      };

      console.log("Payload cập nhật phiếu xuất kho:", payload);

      // Gọi API cập nhật phiếu xuất kho
      const response = await https.post(
        "v1/web/cap-nhat-phieu-xuat-kho-ban-hang",
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data && response.data.statusCode === 200) {
        message.success(isEditMode ? "Cập nhật thành công" : "Lưu thành công");
        navigate("/boxly/phieu-xuat-kho-ban-hang");
      } else {
        message.error(response.data?.message || "Có lỗi xảy ra khi lưu phiếu");
      }
    } catch (error) {
      console.error("Lỗi khi cập nhật phiếu xuất kho:", error);
      if (error.response?.data?.message) {
        message.error(error.response.data.message);
      } else {
        message.error("Vui lòng kiểm tra lại thông tin");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    navigate(`/boxly/phieu-xuat-kho-ban-hang/edit/${stt_rec}`);
    setIsEditMode(true);
  };

  const handleNew = () => {
    navigate("/boxly/phieu-xuat-kho-ban-hang/add");
  };

  const handleDelete = async () => {
    Modal.confirm({
      title: "Xác nhận xóa phiếu",
      content: "Bạn có chắc chắn muốn xóa phiếu này không?",
      okText: "Xóa",
      okType: "danger",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          setLoading(true);
          const response = await https.post(
            "v1/web/xoa-ct-kho-hang-ban",
            {},
            {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              params: {
                sctRec: stt_rec,
              },
            }
          );

          if (response.data && response.data.statusCode === 200) {
            message.success("Xóa phiếu thành công");
            navigate("/boxly/phieu-xuat-kho-ban-hang");
          } else {
            message.error(
              response.data?.message || "Có lỗi xảy ra khi xóa phiếu"
            );
          }
        } catch (error) {
          console.error("Lỗi khi xóa phiếu:", error);
          message.error("Không thể xóa phiếu. Vui lòng thử lại sau.");
        } finally {
          setLoading(false);
        }
      },
    });
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
    if (!isEditMode) {
      message.warning("Bạn cần bật chế độ chỉnh sửa");
      return;
    }

    const newDataSource = dataSource.filter((_, i) => i !== index);
    // Cập nhật lại key cho các item
    const reIndexedDataSource = newDataSource.map((item, i) => ({
      ...item,
      key: i + 1,
    }));
    setDataSource(reIndexedDataSource);
    message.success("Đã xóa vật tư");
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
                      disabled={!isEditMode}
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
                      disabled={!isEditMode}
                    />
                  )}
                  <Button
                    icon={<QrcodeOutlined />}
                    type={barcodeEnabled ? "primary" : "default"}
                    onClick={() => {
                      if (!isEditMode) {
                        message.warning("Bạn cần bật chế độ chỉnh sửa");
                        return;
                      }
                      setBarcodeEnabled((prev) => {
                        const next = !prev;
                        if (next) {
                          setBarcodeJustEnabled(true);
                          setVatTuInput("");
                        }
                        return next;
                      });
                    }}
                    disabled={!isEditMode}
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
                  // Nếu không phải edit mode, chỉ hiển thị text
                  if (!isEditMode) {
                    return value;
                  }

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
                render: (value, record) =>
                  isEditMode ? (
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
                  ) : value ? (
                    <span
                      style={{
                        fontWeight: "bold",
                        display: "block",
                        textAlign: "center",
                      }}
                    >
                      {Number(value).toFixed(3)}
                    </span>
                  ) : (
                    <span
                      style={{
                        fontWeight: "bold",
                        display: "block",
                        textAlign: "center",
                      }}
                    >
                      0.000
                    </span>
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
                    disabled={!isEditMode}
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
              <Button danger onClick={handleDelete}>
                Xóa
              </Button>
              <Button onClick={handleNew}>Mới</Button>
            </Space>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default DetailPhieuXuatKhoBanHang;
