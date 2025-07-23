import { EditOutlined, LeftOutlined } from "@ant-design/icons";
import { Button, Form, Space, Typography, message } from "antd";
import dayjs from "dayjs";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import showConfirm from "../../../../components/common/Modal/ModalConfirm";
import https from "../../../../utils/https";
import "../common-phieu.css";
import PhieuFormInputs from "./components/PhieuFormInputs";
import VatTuInputSection from "./components/VatTuInputSection";
import VatTuTable from "./components/VatTuTable";
import { usePhieuXuatKhoData } from "./hooks/usePhieuXuatKhoData";
import { useVatTuManager } from "./hooks/useVatTuManager";

import {
  buildPayload,
  validateDataSource,
} from "./utils/phieuXuatDieuChuyenUtils";

const { Title } = Typography;

const DetailPhieuXuatDieuChuyen = ({ isEditMode: initialEditMode = false }) => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { stt_rec } = useParams();
  const location = useLocation();
  const token = localStorage.getItem("access_token");

  const [phieuData, setPhieuData] = useState(null);
  const [isEditMode, setIsEditMode] = useState(initialEditMode);
  const [vatTuInput, setVatTuInput] = useState(undefined);
  const [barcodeEnabled, setBarcodeEnabled] = useState(false);
  const [barcodeJustEnabled, setBarcodeJustEnabled] = useState(false);

  const vatTuSelectRef = useRef();
  const searchTimeoutRef = useRef();

  const {
    loading,
    setLoading,
    maGiaoDichList,
    maKhoList,
    loadingMaKho,
    vatTuList,
    loadingVatTu,
    fetchMaKhoListDebounced,
    fetchMaGiaoDichList,
    fetchMaKhoList,
    fetchVatTuList,
    fetchVatTuDetail,
    fetchDonViTinh,
    setVatTuList,
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
    await vatTuSelectHandler(
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

  // Fetch chi tiết phiếu xuất điều chuyển khi component mount
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

          const response = await https.post(
            "v1/dynamicApi/call-dynamic-api",
            body,
            {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
            }
          );

          const masterData =
            response.data?.listObject?.dataLists?.master?.[0] || {};
          const detailData = response.data?.listObject?.dataLists?.detail || [];

          if (masterData && Object.keys(masterData).length > 0) {
            setPhieuData(masterData);
            // Cập nhật form với dữ liệu master
            form.setFieldsValue({
              ngay: masterData.ngay_ct ? dayjs(masterData.ngay_ct) : null,
              soPhieu: masterData.so_ct?.trim() || "",
              maKhoXuat: masterData.ma_kho?.trim() || "",
              maKhoNhap: masterData.ma_khon?.trim() || "",
              maGiaoDich: masterData.ma_gd?.trim() || "",
              trangThai: masterData.status || "",
              // Thêm các trường khác nếu cần
            });

            // Cập nhật dataSource với dữ liệu detail
            if (detailData && detailData.length > 0) {
              const formattedDetail = detailData.map((item, index) => ({
                key: index,
                maHang: item.ma_vt?.trim() || "",
                ten_mat_hang: item.ten_vt?.trim() || item.ma_vt?.trim() || "",
                dvt: item.dvt?.trim() || "",
                sl_td3: item.so_luong || 0,
                ma_kho: item.ma_kho?.trim() || "",
                // Thêm các trường khác nếu cần
              }));
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
  }, [stt_rec, token]);

  // Gọi API để lấy danh sách mã giao dịch, kho, vật tư khi component mount
  // useEffect(() => {
  //   if (stt_rec) {
  //     fetchMaGiaoDichList();
  //     fetchMaKhoList();
  //     fetchVatTuList();
  //   }
  // }, [stt_rec, fetchMaGiaoDichList, fetchMaKhoList, fetchVatTuList]);

  const submitPhieuData = async (values) => {
    try {
      const payload = buildPayload(values, dataSource, phieuData, true);
      if (!payload) {
        setLoading(false);
        return;
      }

      // Đảm bảo truyền đúng stt_rec khi cập nhật phiếu
      if (phieuData && phieuData.stt_rec) {
        if (payload.data && payload.data.master && payload.data.master[0]) {
          payload.data.master[0].stt_rec = phieuData.stt_rec;
        }
      }

      const response = await https.post(
        "v1/dynamicApi/call-dynamic-api",
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (
        response.data &&
        (response.data.statusCode === 200 ||
          response.data.responseModel?.isSucceded)
      ) {
        message.success("Cập nhật phiếu xuất điều chuyển thành công");
        setIsEditMode(false);
        navigate("/boxly/phieu-xuat-dieu-chuyen");
      } else {
        message.error("Cập nhật phiếu xuất điều chuyển thất bại");
      }
    } catch (error) {
      console.error("Lỗi khi cập nhật phiếu xuất điều chuyển:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = useCallback(async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();

      if (!validateDataSource(dataSource)) return;

      await submitPhieuData(values);
    } catch (error) {
      console.error("Lỗi khi cập nhật phiếu xuất điều chuyển:", error);
    } finally {
      setLoading(false);
    }
  }, [form, dataSource, phieuData, isEditMode, navigate, setLoading]);

  const handleEdit = useCallback(() => {
    navigate(`/boxly/phieu-xuat-dieu-chuyen/edit/${stt_rec}`);
    setIsEditMode(true);
  }, [navigate, stt_rec]);

  const handleNew = useCallback(() => {
    navigate("/boxly/phieu-xuat-dieu-chuyen/add");
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

          const response = await https.post(
            "v1/dynamicApi/call-dynamic-api",
            body,
            {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
            }
          );

          const isSuccess =
            (response.data &&
              (response.data.statusCode === 200 ||
                response.data.responseModel?.isSucceded ||
                (response.data?.responseModel?.message &&
                  response.data.responseModel.message.includes(
                    "thành công"
                  )))) ||
            (response.data?.responseModel?.message &&
              response.data.responseModel.message.includes("thành công"));

          if (isSuccess) {
            message.success("Xóa phiếu xuất điều chuyển thành công");
            navigate("/boxly/phieu-xuat-dieu-chuyen");
          } else {
            message.error(
              response.data?.message || "Xóa phiếu xuất điều chuyển thất bại"
            );
          }
        } catch (error) {
          console.error("Lỗi khi xóa phiếu xuất điều chuyển:", error);
          message.error("Có lỗi xảy ra khi xóa phiếu xuất điều chuyển");
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
          onClick={() => navigate("/boxly/phieu-xuat-dieu-chuyen")}
          className="phieu-back-button"
        >
          Trở về
        </Button>
        <Title level={5} className="phieu-title">
          {isEditMode
            ? "CHỈNH SỬA PHIẾU XUẤT ĐIỀU CHUYỂN"
            : "CHI TIẾT PHIẾU XUẤT ĐIỀU CHUYỂN"}
        </Title>
        {!isEditMode ? (
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

      <div className="phieu-form-container">
        <Form
          form={form}
          layout="vertical"
          className="phieu-form"
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
          />

          <VatTuInputSection
            isEditMode={isEditMode}
            barcodeEnabled={barcodeEnabled}
            setBarcodeEnabled={setBarcodeEnabled}
            setBarcodeJustEnabled={setBarcodeJustEnabled}
            vatTuInput={vatTuInput}
            setVatTuInput={setVatTuInput}
            vatTuSelectRef={vatTuSelectRef}
            loadingVatTu={loadingVatTu}
            vatTuList={vatTuList}
            searchTimeoutRef={searchTimeoutRef}
            fetchVatTuList={fetchVatTuList}
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
