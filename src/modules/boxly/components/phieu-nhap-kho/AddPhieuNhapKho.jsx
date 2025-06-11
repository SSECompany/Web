import { LeftOutlined, QrcodeOutlined, SaveOutlined } from "@ant-design/icons";
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
import dayjs from "dayjs";
import { debounce } from "lodash";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import https from "../../../../utils/https";
import {
  addVatTuToDataSource,
  clearStore,
  setBoxlyData,
  setFormData,
  setInitialized,
  setLoadingMaKhach,
  setLoadingMaKho,
  setLoadingTkCo,
  setLoadingVatTu,
  setMaGiaoDichList,
  setMaKhachList,
  setMaKhoList,
  setTkCoList,
  setVatTuList,
  updateDataSourceItem,
  updateFormField,
} from "../../store/boxly";
import "./phieu-nhap-kho.css";

const { Title } = Typography;

const AddPhieuNhapKho = () => {
  // Redux
  const dispatch = useDispatch();
  const {
    vatTuList,
    loadingVatTu,
    maGiaoDichList,
    tkCoList,
    loadingTkCo,
    maKhoList,
    loadingMaKho,
    maKhachList,
    loadingMaKhach,
    formData,
    dataSource,
    initialized,
  } = useSelector((state) => state.boxly);

  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [vatTuInput, setVatTuInput] = useState(undefined);
  const [barcodeEnabled, setBarcodeEnabled] = useState(false);
  const [barcodeJustEnabled, setBarcodeJustEnabled] = useState(false);

  const vatTuSelectRef = useRef();
  const searchTimeoutRef = useRef();
  const token = localStorage.getItem("access_token");

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

  const getUserInfo = () => {
    try {
      const userStr = localStorage.getItem("user");
      const unitsResponseStr = localStorage.getItem("unitsResponse");

      const user = userStr ? JSON.parse(userStr) : {};
      const unitsResponse = unitsResponseStr
        ? JSON.parse(unitsResponseStr)
        : {};

      return {
        userId: user.userId,
        userName: user.userName || "",
        unitId: user.unitId || unitsResponse.unitId,
        unitName: user.unitName || unitsResponse.unitName,
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

  // Load tất cả dữ liệu cần thiết khi component mount
  useEffect(() => {
    // Làm mới Redux store để loại bỏ masterData cũ
    dispatch(clearStore());

    // Nếu các danh sách đã có trong Redux, không cần load lại
    if (vatTuList.length === 0) fetchVatTuList();
    if (maGiaoDichList.length === 0) fetchMaGiaoDichList();
    if (tkCoList.length === 0) fetchTkCoList();
    if (maKhoList.length === 0) fetchMaKhoList();
    if (maKhachList.length === 0) fetchMaKhachList();

    fetchVoucherInfo();

    // Đánh dấu đã khởi tạo
    if (!initialized) {
      dispatch(setInitialized(true));
    }

    // Load dataSource từ Redux nếu có
    if (formData && Object.keys(formData).length > 0) {
      form.setFieldsValue(formData);
    }
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

  const fetchVatTuList = async (keyword = "") => {
    try {
      dispatch(setLoadingVatTu(true));
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
        dispatch(setVatTuList(options));
      }
    } catch (error) {
      console.error("Error fetching vat tu list:", error);
      message.error("Không thể tải danh sách vật tư");
    } finally {
      dispatch(setLoadingVatTu(false));
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

  const fetchVoucherInfo = async () => {
    try {
      const response = await https.get(
        "v1/web/thong-tin-phieu-nhap",
        { voucherCode: "PND" },
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

        const newFormData = {
          soPhieu: voucherData.so_phieu_nhap,
          ngay: voucherData.ngay_lap ? dayjs(voucherData.ngay_lap) : dayjs(),
          maGiaoDich: voucherData.ma_giao_dich,
          maCt: voucherData.ma_ct,
          donViTienTe: voucherData.base_currency,
          tyGia: 1,
          trangThai: "3",
          maKhach: voucherData.ma_khach || "",
          dienGiai: voucherData.dien_giai || "",
        };

        // Lưu vào Redux
        dispatch(setFormData(newFormData));

        // Fill form với dữ liệu từ API
        form.setFieldsValue(newFormData);

        message.success("Đã tải thông tin phiếu nhập thành công");
      }
    } catch (error) {
      console.error("Error fetching voucher info:", error);
      message.error("Không thể tải thông tin phiếu nhập");
    }
  };

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
        dispatch(setMaGiaoDichList(response.data.data));
      }
    } catch (error) {
      message.error("Không thể tải danh sách mã giao dịch");
    }
  };

  const fetchTkCoList = async (keyword = "") => {
    dispatch(setLoadingTkCo(true));
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
        dispatch(setTkCoList(options));
      }
    } catch (error) {
      message.error("Không thể tải danh sách tài khoản");
    } finally {
      dispatch(setLoadingTkCo(false));
    }
  };

  const fetchMaKhoList = async (keyword = "") => {
    dispatch(setLoadingMaKho(true));
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
      if (response.data && response.data.data) {
        const options = response.data.data.map((item) => ({
          value: item.ma_kho.trim(),
          label: `${item.ma_kho.trim()} - ${item.ten_kho.trim()}`,
        }));
        dispatch(setMaKhoList(options));
      }
    } catch (error) {
      message.error("Không thể tải danh sách kho");
    } finally {
      dispatch(setLoadingMaKho(false));
    }
  };

  const fetchMaKhachList = async (keyword = "") => {
    dispatch(setLoadingMaKhach(true));
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
        dispatch(setMaKhachList(options));
      }
    } catch (error) {
      message.error("Không thể tải danh sách khách hàng");
    } finally {
      dispatch(setLoadingMaKhach(false));
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

      // Kiểm tra các trường bắt buộc trong bảng vật tư
      const missingData = [];
      dataSource.forEach((item, index) => {
        if (!item.ma_kho) {
          missingData.push(`Dòng ${index + 1}: Chưa chọn mã kho`);
        }
        if (!item.tk_co) {
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

      const userInfo = getUserInfo();

      const totalQuantity = dataSource.reduce(
        (sum, item) => sum + item.soLuong,
        0
      );

      const formatDate = (date) => {
        const d = date ? new Date(date) : new Date();
        return d.toISOString().split(".")[0]; // Bỏ milliseconds và Z
      };

      const orderDate = formatDate(values.ngay);

      // Cập nhật formData vào Redux
      dispatch(updateFormField({ field: "ngay", value: values.ngay }));

      const payload = {
        orderDate: orderDate,
        master: {
          stt_rec: "",
          ma_dvcs: userInfo.unitId || "VIKOSAN",
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
          ong_ba: values.maKhach || "",
          ma_kh: values.maKhach || "",
          dien_giai: values.dienGiai || "",
          t_so_luong: totalQuantity,
          t_tien_nt: 0.0,
          t_tien: 0.0,
          nam: new Date(orderDate).getFullYear(),
          ky: new Date(orderDate).getMonth() + 1,
          status: values.trangThai || "3",
          datetime0: orderDate,
          datetime2: orderDate,
          user_id0: userInfo.userId || 4061,
          user_id2: userInfo.userId || 4061,
        },
        detail: dataSource.map((item, index) => ({
          stt_rec: "",
          stt_rec0: String(index + 1).padStart(3, "0"),
          ma_ct: "PND",
          ngay_ct: orderDate,
          so_ct: String(index + 1).padStart(3, "0"),
          ma_vt: item.maHang.trim(),
          ma_sp: item.maHang.trim(),
          ma_bp: "",
          so_lsx: "",
          dvt: item.dvt,
          he_so: 1.0,
          ma_kho: item.ma_kho || "KHO01",
          ma_vi_tri: "",
          ma_lo: "",
          ma_vv: "",
          ma_nx: "",
          tk_du: item.tk_co || "",
          tk_vt: item.tk_vt || "",
          so_luong: parseFloat(item.soLuong),
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

      // Lưu payload vào Redux trước khi gửi API
      dispatch(setBoxlyData(payload));

      const response = await https.post(
        "v1/web/create-stock-voucher",
        { Data: payload },
        {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        }
      );

      if (response.data) {
        message.success("Tạo phiếu nhập kho thành công");
        navigate("../phieu-nhap-kho");
      }
    } catch (error) {
      console.error("Error creating stock voucher:", error);
      if (error.response?.data?.message) {
        message.error(error.response.data.message);
      } else {
        message.error("Có lỗi xảy ra khi tạo phiếu nhập kho");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddVatTu = async (vatTuValue, option) => {
    if (!vatTuValue) return;

    try {
      const vatTuDetail = await fetchVatTuDetail(vatTuValue.trim());

      if (!vatTuDetail) {
        message.error("Không tìm thấy thông tin vật tư");
        return;
      }

      const vatTuInfo = Array.isArray(vatTuDetail)
        ? vatTuDetail[0]
        : vatTuDetail;

      // Thêm vật tư vào dataSource trong Redux
      dispatch(addVatTuToDataSource({ vatTu: vatTuInfo, soLuong: 1 }));
      message.success(`Đã thêm vật tư: ${vatTuValue}`);
      setTimeout(() => setVatTuInput(undefined), 0);
    } catch (error) {
      console.error("Error adding vat tu:", error);
      message.error("Có lỗi xảy ra khi thêm vật tư");
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
        <Title level={3} className="phieu-title">
          THÊM PHIẾU NHẬP KHO MỚI
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
                  onChange={(value) => {
                    dispatch(updateFormField({ field: "maKhach", value }));
                  }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="soPhieu"
                label="Số phiếu"
                rules={[{ required: true, message: "Vui lòng nhập số phiếu" }]}
              >
                <Input
                  placeholder="Nhập số phiếu"
                  onChange={(e) => {
                    dispatch(
                      updateFormField({
                        field: "soPhieu",
                        value: e.target.value,
                      })
                    );
                  }}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="dienGiai" label="Diễn giải">
                <Input
                  placeholder="Nhập diễn giải"
                  onChange={(e) => {
                    dispatch(
                      updateFormField({
                        field: "dienGiai",
                        value: e.target.value,
                      })
                    );
                  }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="ngay"
                label="Ngày lập"
                rules={[{ required: true, message: "Vui lòng chọn ngày lập" }]}
                initialValue={dayjs()}
              >
                <DatePicker
                  style={{ width: "100%" }}
                  format="DD/MM/YYYY"
                  placeholder="Chọn ngày"
                  defaultValue={dayjs()}
                  onChange={(date) => {
                    dispatch(updateFormField({ field: "ngay", value: date }));
                  }}
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
                  onChange={(value) => {
                    dispatch(updateFormField({ field: "maGiaoDich", value }));
                  }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="trangThai" label="Trạng thái">
                <Select
                  placeholder="Chọn trạng thái"
                  defaultValue="3"
                  onChange={(value) => {
                    dispatch(updateFormField({ field: "trangThai", value }));
                  }}
                >
                  <Select.Option value="0">Lập chứng từ</Select.Option>
                  <Select.Option value="5">Đề nghị nhập kho</Select.Option>
                  <Select.Option value="2">Nhập kho</Select.Option>
                  <Select.Option value="3">Chuyển số cái</Select.Option>
                </Select>
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
                      onSelect={async (value, option) => {
                        if (option) {
                          handleAddVatTu(value, option);
                        }
                      }}
                    />
                  ) : (
                    <Input
                      ref={vatTuSelectRef}
                      value={vatTuInput}
                      onChange={(e) => setVatTuInput(e.target.value)}
                      placeholder="Quét barcode vật tư..."
                      style={{ width: "calc(100% - 40px)" }}
                      onPressEnter={async () => {
                        if (vatTuInput && vatTuInput.trim()) {
                          handleAddVatTu(vatTuInput);
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
                    Mã kho <span style={{ color: "red" }}>*</span>
                  </span>
                ),
                dataIndex: "ma_kho",
                key: "ma_kho",
                width: 220,
                render: (text, record, rowIndex) => (
                  <Select
                    showSearch
                    allowClear
                    value={record.ma_kho || undefined}
                    placeholder="Chọn kho"
                    loading={loadingMaKho}
                    filterOption={false}
                    onSearch={fetchMaKhoListDebounced}
                    options={maKhoList}
                    style={{ width: 220 }}
                    dropdownClassName="custom-dropdown"
                    optionLabelProp="value"
                    onChange={(value) => {
                      dispatch(
                        updateDataSourceItem({
                          index: rowIndex,
                          field: "ma_kho",
                          value,
                        })
                      );
                    }}
                  />
                ),
              },
              {
                title: (
                  <span>
                    Tk có <span style={{ color: "red" }}>*</span>
                  </span>
                ),
                dataIndex: "tk_co",
                key: "tk_co",
                width: 220,
                render: (text, record, rowIndex) => (
                  <Select
                    showSearch
                    allowClear
                    value={record.tk_co || undefined}
                    placeholder="Chọn TK có"
                    loading={loadingTkCo}
                    filterOption={false}
                    onSearch={fetchTkCoListDebounced}
                    options={tkCoList}
                    style={{ width: 220 }}
                    dropdownClassName="custom-tkco-dropdown"
                    optionLabelProp="value"
                    onChange={(value) => {
                      dispatch(
                        updateDataSourceItem({
                          index: rowIndex,
                          field: "tk_co",
                          value,
                        })
                      );
                    }}
                  />
                ),
              },
            ]}
            pagination={false}
          />
          <Space style={{ marginTop: 16 }}>
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
        </Form>
      </div>
    </div>
  );
};

export default AddPhieuNhapKho;
