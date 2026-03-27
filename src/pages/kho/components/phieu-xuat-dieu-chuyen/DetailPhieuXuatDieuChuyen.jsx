import { EditOutlined, LeftOutlined } from "@ant-design/icons";
import { Button, Form, Space, Typography, message, Select } from "antd";
import dayjs from "dayjs";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import showConfirm from "../../../../components/common/Modal/ModalConfirm";
import VatTuSelectFull from "../../../../components/common/ProductSelectFull/VatTuSelectFull";
import https from "../../../../utils/https";
import "../common-phieu.css";
import PhieuFormInputs from "./components/PhieuFormInputs";
import VatTuTable from "./components/VatTuTable";
import { usePhieuXuatKhoData } from "./hooks/usePhieuXuatKhoData";
import { useVatTuManager } from "./hooks/useVatTuManager";

import { validateQuantityForPhieu } from "../common/QuantityValidationUtils";
import { fetchVatTuListDynamicApi } from "../phieu-nhat-hang/utils/phieuNhatHangUtils";
import {
  buildPayload,
  validateDataSource,
} from "./utils/phieuXuatDieuChuyenUtils";

const { Title } = Typography;

const DetailPhieuXuatDieuChuyen = ({ isEditMode: initialEditMode = false }) => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { stt_rec } = useParams();
  const token = localStorage.getItem("access_token");

  const [phieuData, setPhieuData] = useState(null);
  const [isEditMode, setIsEditMode] = useState(initialEditMode);

  const [vatTuInput, setVatTuInput] = useState(undefined);
  const [barcodeEnabled, setBarcodeEnabled] = useState(false);
  const [barcodeJustEnabled, setBarcodeJustEnabled] = useState(false);

  const vatTuSelectRef = useRef();
  const searchTimeoutRef = useRef();

  const [pageIndex, setPageIndex] = useState(1);
  const [totalPage, setTotalPage] = useState(1);
  const [currentKeyword, setCurrentKeyword] = useState("");

  const [vatTuList, setVatTuList] = useState([]);
  const [loadingVatTu, setLoadingVatTu] = useState(false);

  const fetchVatTuList = async (
    keyword = "",
    page = 1,
    append = false,
    callback
  ) => {
    setLoadingVatTu(true);
    try {
      const userStr = localStorage.getItem("user");
      const unitsResponseStr = localStorage.getItem("unitsResponse");
      const user = userStr ? JSON.parse(userStr) : {};
      const unitsResponse = unitsResponseStr
        ? JSON.parse(unitsResponseStr)
        : {};
      const unitCode = user.unitCode || unitsResponse.unitCode;
      const res = await fetchVatTuListDynamicApi({
        keyword,
        unitCode,
        pageIndex: page,
        pageSize: 100,
      });
      if (res.success && res.data) {
        const options = res.data.map((item) => ({
          label: `${item.ma_vt} - ${item.ten_vt}`,
          value: item.ma_vt,
          ...item,
        }));
        setVatTuList((prev) => (append ? [...prev, ...options] : options));
        if (callback) callback(res.pagination);
      } else {
        if (!append) setVatTuList([]);
        if (callback) callback({ totalPage: 1 });
      }
    } catch (error) {
      setVatTuList([]);
      if (callback) callback({ totalPage: 1 });
    } finally {
      setLoadingVatTu(false);
    }
  };

  const fetchVatTuListPaging = async (
    keyword = "",
    page = 1,
    append = false
  ) => {
    setCurrentKeyword(keyword);
    await fetchVatTuList(keyword, page, append, (pagination) => {
      setPageIndex(page);
      setTotalPage(pagination?.totalPage || 1);
    });
  };

  const {
    loading,
    setLoading,
    maGiaoDichList,
    maKhoList,
    loadingMaKho,
    fetchMaKhoListDebounced,
    fetchMaGiaoDichList,
    fetchMaKhoList,
    fetchVatTuDetail,
    fetchDonViTinh,
  } = usePhieuXuatKhoData();

  const {
    dataSource,
    setDataSource,
    handleVatTuSelect: vatTuSelectHandler,
    handleQuantityChange,
    handleDeleteItem,
    handleDvtChange,
  } = useVatTuManager();

  const handleVatTuSelect = async (value) => {
    const result = await vatTuSelectHandler(
      value,
      isEditMode,
      fetchVatTuDetail,
      fetchDonViTinh,
      setVatTuInput,
      setVatTuList,
      fetchVatTuList,
      vatTuSelectRef
    );
  };

  useEffect(() => {
    const fetchPhieuDetail = async () => {
      if (stt_rec) {
        try {
          const body = {
            store: "api_get_data_detail_phieu_xuat_dieu_chuyen_voucher",
            param: {
              stt_rec: stt_rec,
            },
            data: {},
            resultSetNames: ["master", "detail"],
          };

          const response = await https.post("User/AddData", body, {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          });

          const masterData =
            response.data?.listObject?.dataLists?.master?.[0] || {};
          const detailData = response.data?.listObject?.dataLists?.detail || [];

          if (masterData && Object.keys(masterData).length > 0) {
            // Lưu chỉ data gốc từ API để sử dụng khi build payload (không merge với UI data)
            const formattedData = {
              ngay: masterData.ngay_ct ? dayjs(masterData.ngay_ct) : null,
              soPhieu: masterData.so_ct?.trim() || "",
              maKhoXuat: masterData.ma_kho?.trim() || "",
              maKhoNhap: masterData.ma_khon?.trim() || "",
              maGiaoDich: masterData.ma_gd?.trim() || "",
              trangThai: masterData.status || "",
            };

            setPhieuData(masterData);
            form.setFieldsValue(formattedData);

            if (detailData && detailData.length > 0) {
              // Process vật tư list - DYNAMIC: Giữ nguyên TẤT CẢ trường từ API
              const formattedDetail = detailData.map((item, index) => {
                const soLuongHienThi = item.sl_td3 ?? 0; // sl_td3 - số lượng thực tế
                const soLuongDeNghiHienThi = item.so_luong ?? 0; // so_luong - số lượng đề nghị
                const dvtHienTai = item.dvt ? item.dvt.trim() : "cái";

                return {
                  // Giữ nguyên TẤT CẢ trường từ API response
                  ...item,

                  // Override với UI-friendly fields
                  key: index + 1,
                  maHang: item.ma_vt || "",
                  soLuong: Math.round(soLuongHienThi * 1000) / 1000, // sl_td3 - số lượng thực tế
                  soLuongDeNghi: parseFloat(soLuongDeNghiHienThi) || 0, // so_luong - số lượng đề nghị
                  ten_mat_hang: item.ten_vt || item.ma_vt || "",
                  dvt: dvtHienTai,
                  ma_kho: item.ma_kho || "",
                  tk_vt: item.tk_vt || "",
                  line_nbr: item.line_nbr || index + 1,
                };
              });
              setDataSource(formattedDetail);
            } else {
              setDataSource([]);
            }
          }
        } catch (error) {
          console.error(
            "Lỗi khi fetch chi tiết phiếu xuất điều chuyển:",
            error
          );
        }
      }
    };
    fetchPhieuDetail();
  }, [stt_rec, token, form, setDataSource]);

  const submitPhieuData = useCallback(async (values) => {
    try {
      const payload = buildPayload(values, dataSource, phieuData, true);

      if (!payload) {
        message.error("Không thể tạo payload. Vui lòng kiểm tra lại dữ liệu.");
        setLoading(false);
        return;
      }

      if (phieuData && phieuData.stt_rec) {
        if (payload.data && payload.data.master && payload.data.master[0]) {
          payload.data.master[0].stt_rec = phieuData.stt_rec;
        }
      }

      const response = await https.post("User/AddData", payload, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const isSuccess = response?.data?.responseModel?.isSucceded === true;

      if (isSuccess) {
        message.success("Cập nhật phiếu xuất điều chuyển thành công");
        setIsEditMode(false);
        navigate("/kho/xuat-dieu-chuyen");
      } else {
        const serverMsg =
          response.data?.responseModel?.message || response.data?.message;
        message.error(serverMsg || "Cập nhật phiếu xuất điều chuyển thất bại");
      }
    } catch (error) {
      console.error("Lỗi khi cập nhật phiếu xuất điều chuyển:", error);
      const serverMsg =
        error?.response?.data?.responseModel?.message ||
        error?.response?.data?.message ||
        error?.message;
      if (serverMsg) message.error(serverMsg);
    } finally {
      setLoading(false);
    }
  }, [dataSource, phieuData, token, navigate, setLoading]);

  const handleSubmit = useCallback(async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();

      if (!validateDataSource(dataSource)) {
        setLoading(false);
        return;
      }

      const currentStatus = values.trangThai || "0";

      validateQuantityForPhieu(
        dataSource,
        "phieu_xuat_dieu_chuyen",
        currentStatus,
        async () => {
          try {
            await submitPhieuData(values);
          } catch (error) {
            console.error("Submit failed:", error);
            setLoading(false);
          }
        },
        () => {
          setLoading(false);
        }
      );
    } catch (error) {
      console.error("Lỗi khi cập nhật phiếu xuất điều chuyển:", error);
      setLoading(false);
    }
  }, [form, dataSource, submitPhieuData, setLoading]);

  const handleEdit = useCallback(() => {
    navigate(`/kho/xuat-dieu-chuyen/edit/${stt_rec}`);
    setIsEditMode(true);
  }, [navigate, stt_rec]);

  const handleNew = useCallback(() => {
    navigate("/kho/xuat-dieu-chuyen/them-moi");
  }, [navigate]);

  const handleDelete = useCallback(() => {
    showConfirm({
      title: "Xác nhận xóa phiếu xuất điều chuyển",
      content: "Bạn có chắc chắn muốn xóa phiếu xuất điều chuyển này không?",
      type: "warning",
      onOk: async () => {
        setLoading(true);
        try {
          const body = {
            store: "api_delete_xuat_dieu_chuyen_voucher",
            param: {
              stt_rec: stt_rec,
            },
            data: {},
          };

          const response = await https.post("User/AddData", body, {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          });

          const isSuccess = response?.data?.responseModel?.isSucceded === true;

          if (isSuccess) {
            message.success("Xóa phiếu xuất điều chuyển thành công");
            navigate("/kho/xuat-dieu-chuyen");
          } else {
            const serverMsg =
              response.data?.responseModel?.message || response.data?.message;
            message.error(serverMsg || "Xóa phiếu xuất điều chuyển thất bại");
          }
        } catch (error) {
          console.error("Lỗi khi xóa phiếu xuất điều chuyển:", error);
          const serverMsg =
            error?.response?.data?.responseModel?.message ||
            error?.response?.data?.message ||
            error?.message;
          message.error(
            serverMsg || "Có lỗi xảy ra khi xóa phiếu xuất điều chuyển"
          );
        } finally {
          setLoading(false);
        }
      },
    });
  }, [stt_rec, navigate, setLoading, token]);

  return (
    <div className="phieu-container">
      <div className="phieu-header">
        <Button
          type="text"
          icon={<LeftOutlined />}
          onClick={() => navigate("/kho/xuat-dieu-chuyen")}
          className="phieu-back-button"
        />

        <div className="phieu-header-info">
          <div className="phieu-header-tags">
            <span className={`phieu-header-badge ${!stt_rec ? 'phieu-header-badge--green' : isEditMode ? 'phieu-header-badge--orange' : 'phieu-header-badge--blue'}`}>
              {stt_rec ? (isEditMode ? "SỬA PHIẾU XUẤT" : "CHI TIẾT PHIẾU XUẤT") : "THÊM PHIẾU XUẤT MỚI"}
            </span>
          </div>

          <div className="phieu-header-meta-stack">
            <div className="phieu-header-meta-item">
              ĐƠN HÀNG: <span className="phieu-header-meta-value">
                {form.getFieldValue('soPhieu') || '.........'} 
                {form.getFieldValue('bcontract_id') && (
                  <span className="phieu-header-meta-sequence">
                    ({form.getFieldValue('bcontract_id')})
                  </span>
                )}
              </span>
            </div>
            <div className="phieu-header-meta-item">
              NGÀY: <span className="phieu-header-meta-value">{form.getFieldValue('ngay') ? dayjs(form.getFieldValue('ngay')).format('DD/MM/YYYY') : '.........'}</span>
            </div>
            <div className="phieu-header-status-row">
              <span className="phieu-header-status-label">TRẠNG THÁI:</span>
              <Form.Item name="trangThai" noStyle>
                <Select 
                  size="small"
                  className="phieu-header-status-select"
                  dropdownMatchSelectWidth={false}
                >
                  <Select.Option value="0">Lập chứng từ</Select.Option>
                  <Select.Option value="1">Chờ duyệt</Select.Option>
                  <Select.Option value="2">Duyệt</Select.Option>
                </Select>
              </Form.Item>
            </div>
          </div>
        </div>

        <div className="phieu-header-right">
          {!isEditMode && stt_rec ? (
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={handleEdit}
              className="phieu-edit-button"
            >
              Chỉnh sửa
            </Button>
          ) : (
            <div style={{ width: 120 }}></div>
          )}
        </div>
      </div>

      <div className="phieu-form-container">
        <Form
          form={form}
          layout="vertical"
          className="phieu-form phieu-form--floating"
          disabled={!isEditMode}
        >
          <PhieuFormInputs
            isEditMode={isEditMode}
            maGiaoDichList={maGiaoDichList}
            maKhoList={maKhoList}
            loadingMaKho={loadingMaKho}
            fetchMaKhoListDebounced={fetchMaKhoListDebounced}
            fetchMaKhoList={fetchMaKhoList}
            fetchMaGiaoDichList={fetchMaGiaoDichList}
            barcodeEnabled={barcodeEnabled}
            setBarcodeEnabled={setBarcodeEnabled}
            setBarcodeJustEnabled={setBarcodeJustEnabled}
            vatTuInput={vatTuInput}
            setVatTuInput={setVatTuInput}
            vatTuSelectRef={vatTuSelectRef}
            loadingVatTu={loadingVatTu}
            vatTuList={vatTuList}
            searchTimeoutRef={searchTimeoutRef}
            fetchVatTuList={fetchVatTuListPaging}
            totalPage={totalPage}
            pageIndex={pageIndex}
            setPageIndex={setPageIndex}
            setVatTuList={setVatTuList}
            currentKeyword={currentKeyword}
            VatTuSelectComponent={VatTuSelectFull}
            handleVatTuSelect={handleVatTuSelect}
          />

          <VatTuTable
            dataSource={dataSource}
            isEditMode={isEditMode}
            handleQuantityChange={handleQuantityChange}
            handleDeleteItem={handleDeleteItem}
            handleDvtChange={handleDvtChange}
            maKhoList={maKhoList}
            loadingMaKho={loadingMaKho}
            fetchMaKhoListDebounced={fetchMaKhoListDebounced}
            fetchDonViTinh={fetchDonViTinh}
            onDataSourceUpdate={setDataSource}
          />

          {isEditMode && (
            <div
              style={{
                display: "flex",
                justifyContent: "flex-start",
                marginTop: 16,
              }}
            >
              <Space>
                <Button type="primary" onClick={handleSubmit} loading={loading}>
                  Lưu
                </Button>
                <Button danger onClick={handleDelete}>
                  Xóa
                </Button>
                <Button onClick={handleNew}>Mới</Button>
              </Space>
            </div>
          )}
        </Form>
      </div>
    </div>
  );
};

export default DetailPhieuXuatDieuChuyen;
