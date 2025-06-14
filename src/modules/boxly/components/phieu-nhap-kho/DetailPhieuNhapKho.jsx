import { EditOutlined, LeftOutlined, QrcodeOutlined } from "@ant-design/icons";
import {
  Button,
  Col,
  DatePicker,
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
  const [barcodeJustEnabled, setBarcodeJustEnabled] = useState(false);
  const [dataSource, setDataSource] = useState([]);
  const vatTuSelectRef = useRef();
  const [apiCalled, setApiCalled] = useState(false);
  const searchTimeoutRef = useRef();

  // State cho các danh sách
  const [vatTuList, setVatTuList] = useState([]);
  const [loadingVatTu, setLoadingVatTu] = useState(false);
  const [maGiaoDichList, setMaGiaoDichList] = useState([]);
  const [tkCoList, setTkCoList] = useState([]);
  const [loadingTkCo, setLoadingTkCo] = useState(false);
  const [maKhoList, setMaKhoList] = useState([]);
  const [loadingMaKho, setLoadingMaKho] = useState(false);
  const [maKhachList, setMaKhachList] = useState([]);
  const [loadingMaKhach, setLoadingMaKhach] = useState(false);

  // Lấy stt_rec từ state của location nếu có
  const sttRec = location.state?.sttRec || id;
  const token = localStorage.getItem("access_token");

  // Tạo các hàm debounce cho tìm kiếm
  const fetchTkCoListDebounced = useRef(
    debounce((keyword) => {
      fetchTkCoList(keyword);
    }, 500)
  ).current;

  const fetchMaKhoListDebounced = useRef(
    debounce((keyword) => {
      fetchMaKhoList(keyword);
    }, 500)
  ).current;

  const fetchMaKhachListDebounced = useRef(
    debounce((keyword) => {
      fetchMaKhachList(keyword);
    }, 500)
  ).current;

  // Hàm fetch danh sách vật tư
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

  // Hàm fetch chi tiết vật tư
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

  // Hàm fetch danh sách mã giao dịch
  const fetchMaGiaoDichList = async () => {
    try {
      const response = await https.get(
        "v1/web/danh-sach-ma-gd",
        {},
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

  // Hàm fetch danh sách tài khoản có
  const fetchTkCoList = async (keyword = "") => {
    setLoadingTkCo(true);
    try {
      const response = await https.get(
        "v1/web/danh-sach-tk",
        { keyWord: keyword },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.data && response.data.data) {
        const options = response.data.data.map((item) => ({
          value: item.tk.trim(),
          label: `${item.tk.trim()} - ${item.ten_tk.trim()}`,
        }));
        setTkCoList(options);
      }
    } catch (error) {
      message.error("Không thể tải danh sách tài khoản");
    } finally {
      setLoadingTkCo(false);
    }
  };

  // Hàm fetch danh sách mã kho
  const fetchMaKhoList = async (keyword = "") => {
    setLoadingMaKho(true);
    console.log("Đang gọi API danh sách kho với keyword:", keyword);
    try {
      const response = await https.get(
        "v1/web/danh-sach-kho",
        { keyWord: keyword },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log("Kết quả API danh sách kho:", response.data);
      if (response.data && response.data.data) {
        const options = response.data.data.map((item) => ({
          value: item.ma_kho.trim(),
          label: `${item.ma_kho.trim()} - ${item.ten_kho.trim()}`,
        }));
        setMaKhoList(options);
        console.log("Đã cập nhật danh sách kho:", options);
      }
    } catch (error) {
      console.error("Lỗi khi gọi API danh sách kho:", error);
      message.error("Không thể tải danh sách kho");
    } finally {
      setLoadingMaKho(false);
    }
  };

  // Hàm fetch danh sách mã khách
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

  // Hàm xử lý thêm vật tư
  const handleAddVatTu = async (vatTuValue, option) => {
    if (!vatTuValue || !isEditMode) {
      if (!isEditMode) message.warning("Bạn cần bật chế độ chỉnh sửa");
      return;
    }

    try {
      const vatTuDetail = await fetchVatTuDetail(vatTuValue.trim());

      if (!vatTuDetail) {
        message.error("Không tìm thấy thông tin vật tư");
        return;
      }

      const vatTuInfo = Array.isArray(vatTuDetail)
        ? vatTuDetail[0]
        : vatTuDetail;

      // Thêm vật tư vào dataSource
      setDataSource((prev) => {
        const existing = prev.find((item) => item.maHang === vatTuInfo.ma_vt);
        if (existing) {
          return prev.map((item) =>
            item.maHang === vatTuInfo.ma_vt
              ? { ...item, soLuong: item.soLuong + 1 }
              : item
          );
        } else {
          const newItem = {
            key: prev.length + 1,
            maHang: vatTuInfo.ma_vt,
            soLuong: 1,
            ten_mat_hang: vatTuInfo.ten_vt || vatTuInfo.ma_vt,
            dvt: vatTuInfo.dvt || "cái",
            tk_vt: vatTuInfo.tk_vt || "",
            noiDung: vatTuInfo.ten_vt || vatTuInfo.ma_vt || "",
          };
          return [...prev, newItem];
        }
      });

      message.success(`Đã thêm vật tư: ${vatTuValue}`);
      setTimeout(() => setVatTuInput(undefined), 0);
    } catch (error) {
      console.error("Error adding vat tu:", error);
      message.error("Có lỗi xảy ra khi thêm vật tư");
    }
  };

  // Tải dữ liệu khi component mount
  useEffect(() => {
    // Tải các danh sách cần thiết
    fetchVatTuList();
    fetchMaGiaoDichList();
    fetchTkCoList();
    fetchMaKhoList();
    fetchMaKhachList();

    // Cleanup timeout
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Thêm useEffect để debug danh sách kho
  useEffect(() => {
    console.log("Danh sách kho hiện tại:", maKhoList);
  }, [maKhoList]);

  useEffect(() => {
    if (barcodeJustEnabled && vatTuSelectRef.current) {
      vatTuSelectRef.current.focus();
      setBarcodeJustEnabled(false);
    }
  }, [barcodeJustEnabled]);

  // Tách riêng useEffect cho việc cập nhật isEditMode
  useEffect(() => {
    const isEditPath = location.pathname.includes("/edit/");
    setIsEditMode(isEditPath);
  }, [location.pathname]);

  // useEffect riêng cho việc gọi API
  useEffect(() => {
    const fetchPhieuDetail = async () => {
      if (apiCalled) return; // Nếu đã gọi API rồi thì không gọi lại

      setLoading(true);
      setApiCalled(true); // Đánh dấu đã gọi API

      try {
        // Gọi API thực để lấy thông tin phiếu nhập kho
        const response = await https.get(`v1/web/thong-tin-phieu-nhap-kho`, {
          stt_rec: sttRec,
        });

        console.log("Kết quả API thông tin phiếu:", response.data);

        if (response && response.data) {
          const apiData = response.data;

          // Lấy thông tin phiếu từ data[0]
          const phieuInfo =
            apiData.data && apiData.data.length > 0 ? apiData.data[0] : null;

          // Lấy danh sách vật tư từ data2
          const vatTuList = apiData.data2 || [];

          if (phieuInfo) {
            // Chuyển đổi dữ liệu từ API sang định dạng phù hợp với component
            const formattedData = {
              id: id,
              sttRec: phieuInfo.stt_rec,
              ngay: phieuInfo.ngay_ct
                ? moment(phieuInfo.ngay_ct).format("YYYY-MM-DD")
                : null,
              soPhieu: phieuInfo.so_ct || "",
              maKhach: phieuInfo.ma_kh || "",
              dienGiai: phieuInfo.dien_giai || "",
              tenKhach: phieuInfo.ong_ba || "",
              khoNhap: vatTuList.length > 0 ? vatTuList[0].ma_kho || "" : "",
              status: phieuInfo.status || "0",
              maGiaoDich: phieuInfo.ma_gd || "",
              ghiChu: "",
              xe: "",
              maSanPham: "",
              danhSachVatTu: vatTuList.map((item, index) => ({
                key: index + 1,
                maHang: item.ma_vt || "",
                soLuong: item.so_luong || 0,
                ten_mat_hang: item.ten_vt || item.ma_vt || "",
                dvt: item.dvt || "cái",
                maKho: item.ma_kho || "",
                ma_kho: item.ma_kho || "", // Thêm trường ma_kho để đảm bảo tương thích
                tk_vt: item.tk_vt || "",
                tk_co: item.tk_du || "",
                tk_du: item.tk_du || "", // Thêm trường tk_du để đảm bảo tương thích
                noiDung: item.ten_vt || item.ma_vt || "",
              })),
            };

            console.log("Dữ liệu đã xử lý:", formattedData);
            setPhieuData(formattedData);
            form.setFieldsValue({
              ...formattedData,
              ngay: formattedData.ngay ? moment(formattedData.ngay) : null,
            });
            setDataSource(formattedData.danhSachVatTu);
            console.log(
              "Danh sách vật tư đã xử lý:",
              formattedData.danhSachVatTu
            );
          } else {
            message.error("Không tìm thấy thông tin phiếu nhập kho");
          }
        }
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu phiếu:", error);
        message.error("Lỗi khi tải dữ liệu phiếu");
        setApiCalled(false); // Reset flag nếu có lỗi để có thể thử lại
      } finally {
        setLoading(false);
      }
    };

    // Chỉ gọi API khi có sttRec và chưa gọi API
    if (sttRec && !apiCalled) {
      fetchPhieuDetail();
    }
  }, [sttRec, form, apiCalled]);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();

      if (dataSource.length === 0) {
        message.error("Vui lòng thêm ít nhất một vật tư");
        return;
      }

      // Kiểm tra các trường bắt buộc trong bảng vật tư
      const missingData = [];
      dataSource.forEach((item, index) => {
        if (!item.maKho && !item.ma_kho) {
          missingData.push(`Dòng ${index + 1}: Chưa chọn mã kho`);
        }
        if (!item.tk_co && !item.tk_du) {
          missingData.push(`Dòng ${index + 1}: Chưa chọn tài khoản có`);
        }
      });

      if (missingData.length > 0) {
        message.error({
          content: (
            <div>
              <div>Vui lòng bổ sung thông tin bắt buộc:</div>
              {missingData.map((msg, idx) => (
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
        (sum, item) => sum + item.soLuong,
        0
      );

      const formatDate = (date) => {
        const d = date ? new Date(date) : new Date();
        return d.toISOString().split(".")[0]; // Bỏ milliseconds và Z
      };

      const orderDate = formatDate(values.ngay);

      const payload = {
        Data: {
          orderDate: orderDate,
          master: {
            stt_rec: phieuData?.sttRec || "",
            ma_dvcs: userInfo.unitId,
            ma_ct: "PND",
            loai_ct: "2",
            so_lo: "",
            ngay_lo: null,
            ma_nk: "",
            ma_gd: values.maGiaoDich || "",
            ngay_lct: orderDate,
            ngay_ct: orderDate,
            so_ct: values.soPhieu || "",
            ma_nt: "VND",
            ty_gia: 1.0,
            ong_ba: values.tenKhach || "",
            ma_kh: values.maKhach || "",
            dien_giai: values.dienGiai || "",
            t_so_luong: totalQuantity,
            t_tien_nt: 0.0,
            t_tien: 0.0,
            nam: new Date(orderDate).getFullYear(),
            ky: new Date(orderDate).getMonth() + 1,
            status: values.status || "3",
            datetime0: orderDate,
            datetime2: orderDate,
            user_id0: userInfo.userId,
            user_id2: userInfo.userId,
          },
          detail: dataSource.map((item, index) => ({
            stt_rec: phieuData?.sttRec || "",
            stt_rec0: String(index + 1).padStart(3, "0"),
            ma_ct: "PND",
            ngay_ct: orderDate,
            so_ct: values.soPhieu || "",
            ma_vt: item.maHang?.trim() || "",
            ma_sp: item.maHang?.trim() || "",
            ma_bp: "",
            so_lsx: "",
            dvt: item.dvt || "cái",
            he_so: 1.0,
            ma_kho: item.maKho || item.ma_kho || "",
            ma_vi_tri: "",
            ma_lo: "",
            ma_vv: "",
            ma_nx: "",
            tk_du: item.tk_co || item.tk_du || "",
            tk_vt: item.tk_vt || "",
            so_luong: parseFloat(item.soLuong) || 0,
            gia_nt: 0.0,
            gia: 0.0,
            tien_nt: 0.0,
            tien: 0.0,
            pn_gia_tb: false,
            stt_rec_px: "",
            stt_rec0px: "",
            line_nbr: parseInt(index + 1),
          })),
        },
      };

      console.log("Payload:", payload);

      // Gọi API cập nhật phiếu nhập kho
      const response = await https.post(
        "v1/web/update-stock-voucher",
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data) {
        message.success("Cập nhật phiếu nhập kho thành công");
        navigate("../phieu-nhap-kho");
      }
    } catch (error) {
      console.error("Lỗi khi cập nhật phiếu nhập kho:", error);
      if (error.response?.data?.message) {
        message.error(error.response.data.message);
      } else {
        message.error("Có lỗi xảy ra khi cập nhật phiếu nhập kho");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    navigate(`/boxly/phieu-nhap-kho/edit/${id}`);
    setIsEditMode(true);
  };

  const handleDelete = async () => {
    Modal.confirm({
      title: "Xác nhận xóa phiếu nhập kho",
      content: "Bạn có chắc chắn muốn xóa phiếu nhập kho này không?",
      okText: "Xóa",
      okType: "danger",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          setLoading(true);

          if (!phieuData?.sttRec) {
            message.error("Không tìm thấy mã phiếu để xóa");
            return;
          }

          const response = await https.delete(
            `v1/web/xoa-ct-nhap-kho?stt_rec=${phieuData.sttRec}`,
            {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (response.data && response.data.success) {
            message.success("Xóa phiếu nhập kho thành công");
            navigate("../phieu-nhap-kho");
          } else {
            message.error(
              response.data?.message || "Xóa phiếu nhập kho thất bại"
            );
          }
        } catch (error) {
          console.error("Lỗi khi xóa phiếu nhập kho:", error);
          if (error.response?.data?.message) {
            message.error(error.response.data.message);
          } else {
            message.error("Có lỗi xảy ra khi xóa phiếu nhập kho");
          }
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const handleVatTuSelect = (value, option) => {
    if (!isEditMode) {
      message.warning("Bạn cần bật chế độ chỉnh sửa");
      return;
    }

    handleAddVatTu(value, option);
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
            <Col span={12}>
              <Form.Item name="maGiaoDich" label="Mã giao dịch">
                <Select
                  placeholder="Chọn mã giao dịch"
                  options={maGiaoDichList.map((item) => ({
                    value: item.ma_gd?.trim(),
                    label: `${item.ma_gd?.trim()} - ${item.ten_gd}`,
                  }))}
                  showSearch
                  optionFilterProp="label"
                  allowClear
                  disabled={!isEditMode}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label="Trạng thái">
                <Select
                  disabled={!isEditMode}
                  options={[
                    { value: "0", label: "Lập chứng từ" },
                    { value: "2", label: "Nhập kho" },
                    { value: "3", label: "Chuyển số cái" },
                    { value: "5", label: "Đề nghị nhập kho" },
                  ]}
                />
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
                          handleAddVatTu(vatTuInput);
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
            columns={[
              { title: "STT", dataIndex: "key", key: "key", width: 60 },
              { title: "Mã hàng", dataIndex: "maHang", key: "maHang" },
              {
                title: "Tên mặt hàng",
                dataIndex: "noiDung",
                key: "ten_mat_hang",
              },
              {
                title: "Đvt",
                dataIndex: "dvt",
                key: "dvt",
                width: 80,
                render: (text, record) => record.dvt || "cái",
              },
              {
                title: "Số lượng",
                dataIndex: "soLuong",
                key: "soLuong",
                width: 100,
              },
              {
                title: "Tk nợ",
                dataIndex: "tk_vt",
                key: "tk_vt",
                width: 100,
                render: (text, record) => record.tk_vt || "",
              },
              {
                title: (
                  <span>
                    Mã kho{" "}
                    {isEditMode && <span style={{ color: "red" }}>*</span>}
                  </span>
                ),
                dataIndex: "maKho",
                key: "ma_kho",
                width: 220,
                render: (text, record, rowIndex) =>
                  isEditMode ? (
                    <Select
                      showSearch
                      allowClear
                      value={record.maKho || record.ma_kho || undefined}
                      placeholder="Chọn kho"
                      loading={loadingMaKho}
                      filterOption={false}
                      onSearch={fetchMaKhoListDebounced}
                      options={maKhoList}
                      style={{ width: 220 }}
                      dropdownClassName="custom-dropdown"
                      optionLabelProp="value"
                      onChange={(value) => {
                        const newDataSource = [...dataSource];
                        newDataSource[rowIndex].maKho = value;
                        newDataSource[rowIndex].ma_kho = value;
                        setDataSource(newDataSource);
                        console.log(
                          "Đã cập nhật mã kho cho dòng",
                          rowIndex,
                          "thành",
                          value
                        );
                      }}
                    />
                  ) : (
                    record.maKho || record.ma_kho
                  ),
              },
              {
                title: (
                  <span>
                    Tk có{" "}
                    {isEditMode && <span style={{ color: "red" }}>*</span>}
                  </span>
                ),
                dataIndex: "tk_co",
                key: "tk_co",
                width: 220,
                render: (text, record, rowIndex) =>
                  isEditMode ? (
                    <Select
                      showSearch
                      allowClear
                      value={record.tk_co || record.tk_du || undefined}
                      placeholder="Chọn TK có"
                      loading={loadingTkCo}
                      filterOption={false}
                      onSearch={fetchTkCoListDebounced}
                      options={tkCoList}
                      style={{ width: 220 }}
                      dropdownClassName="custom-tkco-dropdown"
                      optionLabelProp="value"
                      onChange={(value) => {
                        const newDataSource = [...dataSource];
                        newDataSource[rowIndex].tk_co = value;
                        newDataSource[rowIndex].tk_du = value;
                        setDataSource(newDataSource);
                        console.log(
                          "Đã cập nhật tk có cho dòng",
                          rowIndex,
                          "thành",
                          value
                        );
                      }}
                    />
                  ) : (
                    record.tk_co || record.tk_du
                  ),
              },
            ]}
            pagination={false}
          />
          <Space style={{ marginTop: 16 }}>
            <Button type="primary" onClick={handleSubmit}>
              Lưu
            </Button>
            <Button danger onClick={handleDelete}>
              Xóa
            </Button>
            <Button>Mới</Button>
          </Space>
        </Form>
      </div>
    </div>
  );
};

export default DetailPhieuNhapKho;
