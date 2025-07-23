import { EditOutlined, LeftOutlined } from "@ant-design/icons";
import { Button, Form, message, Typography } from "antd";
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
  updatePhieuXuatKho,
  validateDataSource,
} from "./utils/phieuXuatKhoUtils";

const { Title } = Typography;

const DetailPhieuXuatKho = ({ isEditMode: initialEditMode = false }) => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { stt_rec } = useParams();
  const location = useLocation();

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
    maKhachList,
    loadingMaKhach,
    vatTuList,
    loadingVatTu,
    fetchMaKhachListDebounced,
    fetchMaGiaoDichList,
    fetchMaKhachList,
    fetchVatTuList,
    fetchVatTuDetail,
    fetchDonViTinh,
    fetchPhieuXuatKhoDetail,
    setVatTuList,
    maKhoList,
    loadingMaKho,
    fetchMaKhoListDebounced,
    fetchMaKhoList,
  } = usePhieuXuatKhoData();

  const {
    dataSource,
    setDataSource,
    handleVatTuSelect: vatTuSelectHandler,
    handleQuantityChange,
    handleDeleteItem,
    handleDvtChange,
    handleSelectChange,
  } = useVatTuManager();

  const token = localStorage.getItem("access_token");

  // Fetch chi tiết phiếu xuất kho khi component mount
  useEffect(() => {
    const fetchPhieuDetail = async () => {
      if (stt_rec) {
        const result = await fetchPhieuXuatKhoDetail(stt_rec);
        if (result) {
          setPhieuData(result.master);
          // Cập nhật form với dữ liệu master
          form.setFieldsValue({
            ngay_ct: result.master.ngay_ct
              ? dayjs(result.master.ngay_ct)
              : null,
            so_ct: result.master.so_ct?.trim() || "",
            ma_kh: result.master.ma_kh?.trim() || "",
            ten_kh: result.master.ten_kh?.trim() || "",
            ma_gd: result.master.ma_gd?.trim() || "",
            status: result.master.status || "",
            // Thêm các trường khác nếu cần
          });

          // Cập nhật dataSource với dữ liệu detail
          if (result.detail && result.detail.length > 0) {
            const formattedDetail = result.detail.map((item, index) => ({
              key: index,
              maHang: item.ma_vt?.trim() || "",
              ten_mat_hang: item.ten_vt?.trim() || item.ma_vt?.trim() || "",
              dvt: item.dvt?.trim() || "",
              so_luong: item.so_luong || 0,
              ma_kho: item.ma_kho?.trim() || "",
              // Thêm các trường khác nếu cần
            }));
            setDataSource(formattedDetail);
          } else {
            setDataSource([]);
          }
        }
      }
    };

    fetchPhieuDetail();
  }, [stt_rec, fetchPhieuXuatKhoDetail, form, setDataSource]);

  // Xóa useEffect gọi API master data khi component mount
  // useEffect(() => {
  //   fetchMaGiaoDichList();
  //   fetchMaKhachList();
  //   fetchMaKhoList();
  // }, [fetchMaGiaoDichList, fetchMaKhachList, fetchMaKhoList]);

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

  const handleSubmit = useCallback(async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();

      if (!validateDataSource(dataSource)) return;

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

      // Tích hợp dynamicApi update
      const master =
        payload.master ||
        (payload.data && payload.data.master && payload.data.master[0]);
      if (!master || (Array.isArray(master) && typeof master[0] !== "object")) {
        message.error("Dữ liệu phiếu không hợp lệ!");
        setLoading(false);
        return;
      }
      const detail = payload.detail || (payload.data && payload.data.detail);
      const result = await updatePhieuXuatKho(
        Array.isArray(master) ? master[0] : master,
        detail,
        token
      );
      if (result.data?.responseModel?.isSucceded) {
        message.success("Cập nhật phiếu xuất kho thành công");
        setTimeout(() => {
          navigate("/boxly/phieu-xuat-kho");
        }, 1000);
      } else {
        message.error("Cập nhật phiếu xuất kho thất bại");
      }
    } catch (error) {
      console.error("Lỗi khi cập nhật phiếu xuất kho:", error);
    } finally {
      setLoading(false);
    }
  }, [form, dataSource, phieuData, isEditMode, navigate, setLoading, token]);

  const handleEdit = useCallback(() => {
    navigate(`/boxly/phieu-xuat-kho/edit/${stt_rec}`);
    setIsEditMode(true);
  }, [navigate, stt_rec]);

  const handleDelete = useCallback(() => {
    showConfirm({
      title: "Xác nhận xóa phiếu xuất kho",
      content: "Bạn có chắc chắn muốn xóa phiếu xuất kho này không?",
      type: "warning",
      onOk: async () => {
        try {
          if (!stt_rec) {
            message.error("Không tìm thấy mã phiếu để xóa");
            return;
          }

          const body = {
            store: "api_delete_phieu_xuat_kho_voucher",
            param: { stt_rec: stt_rec },
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
            message.success("Xóa phiếu thành công");
            navigate("/boxly/phieu-xuat-kho");
          } else {
            message.error(
              response.data?.message || "Xóa phiếu xuất kho thất bại"
            );
          }
        } catch (error) {
          console.error("Lỗi khi xóa phiếu xuất kho:", error);
          if (error.response?.data?.message) {
            message.error(error.response.data.message);
          } else {
            message.error("Có lỗi xảy ra khi xóa phiếu xuất kho");
          }
        }
      },
    });
  }, [stt_rec, navigate, token]);

  const handleNew = useCallback(() => {
    navigate("/boxly/phieu-xuat-kho/add");
  }, [navigate]);

  return (
    <div className="phieu-container">
      <div className="phieu-header">
        <Button
          type="text"
          icon={<LeftOutlined />}
          onClick={() => navigate("/boxly/phieu-xuat-kho")}
          className="phieu-back-button"
        >
          Trở về
        </Button>
        <Title level={5} className="phieu-title">
          {isEditMode ? "CHỈNH SỬA PHIẾU XUẤT KHO" : "CHI TIẾT PHIẾU XUẤT KHO"}
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
            maKhachList={maKhachList}
            loadingMaKhach={loadingMaKhach}
            fetchMaKhachListDebounced={fetchMaKhachListDebounced}
            maGiaoDichList={maGiaoDichList}
            fetchMaGiaoDichList={fetchMaGiaoDichList}
            fetchMaKhachList={fetchMaKhachList}
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
            handleSelectChange={handleSelectChange}
            maKhoList={maKhoList}
            loadingMaKho={loadingMaKho}
            fetchMaKhoListDebounced={fetchMaKhoListDebounced}
            fetchMaKhoList={fetchMaKhoList}
          />

          {isEditMode && (
            <div className="phieu-form-actions">
              <Button type="primary" onClick={handleSubmit} loading={loading}>
                Lưu
              </Button>
              <Button danger onClick={handleDelete}>
                Xóa
              </Button>
              <Button onClick={handleNew}>Mới</Button>
            </div>
          )}
        </Form>
      </div>
    </div>
  );
};

export default DetailPhieuXuatKho;
