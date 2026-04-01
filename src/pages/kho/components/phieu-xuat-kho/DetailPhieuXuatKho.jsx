import { EditOutlined, LeftOutlined, SaveOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Form, message, Space, Typography, Select } from "antd";
import dayjs from "dayjs";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import showConfirm from "../../../../components/common/Modal/ModalConfirm";
import VatTuSelectFull from "../../../../components/common/ProductSelectFull/VatTuSelectFull";
import https from "../../../../utils/https";
import "../common-phieu.css";
import FormTemplate from "../../../../components/common/PageTemplates/FormTemplate";
import { validateQuantityForPhieu } from "../common/QuantityValidationUtils";
import PhieuFormInputs from "./components/PhieuFormInputs";
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

  const [phieuData, setPhieuData] = useState(null);
  const [isEditMode, setIsEditMode] = useState(initialEditMode);
  const [vatTuInput, setVatTuInput] = useState(undefined);
  const [barcodeEnabled, setBarcodeEnabled] = useState(false);
  const [barcodeJustEnabled, setBarcodeJustEnabled] = useState(false);
  const [pageIndex, setPageIndex] = useState(1);
  const [totalPage, setTotalPage] = useState(1);
  const [currentKeyword, setCurrentKeyword] = useState("");
  const [vatTuList, setVatTuList] = useState([]);
  const [loadingVatTu, setLoadingVatTu] = useState(false);

  const vatTuSelectRef = useRef();
  const searchTimeoutRef = useRef();

  const {
    loading,
    setLoading,
    maGiaoDichList,
    maKhoList,
    loadingMaKho,
    fetchMaKhoListDebounced,
    fetchMaKhoList,
    fetchMaGiaoDichList,
    fetchVatTuDetail,
    fetchDonViTinh,
    fetchPhieuXuatKhoDetail,
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
      const {
        fetchVatTuListDynamicApi,
      } = require("../phieu-nhat-hang/utils/phieuNhatHangUtils");
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

  useEffect(() => {
    const fetchPhieuDetail = async () => {
      if (stt_rec) {
        const result = await fetchPhieuXuatKhoDetail(stt_rec);
        if (result) {
          // Lưu chỉ data gốc từ API để sử dụng khi build payload (không merge với UI data)
          const formattedData = {
            ngay_ct: result.master.ngay_ct
              ? dayjs(result.master.ngay_ct)
              : null,
            so_ct: result.master.so_ct?.trim() || "",
            ma_kh: result.master.ma_kh?.trim() || "",
            ten_kh: result.master.ten_kh?.trim() || "",
            ma_gd: result.master.ma_gd ? result.master.ma_gd.trim() : "1",
            status: result.master.status || "",
          };

          setPhieuData(result.master);
          form.setFieldsValue(formattedData);

          if (result.detail && result.detail.length > 0) {
            // Process vật tư list - DYNAMIC: Giữ nguyên TẤT CẢ trường từ API
            const formattedDetail = result.detail.map((item, index) => {
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
      }
    };

    fetchPhieuDetail();
  }, [stt_rec, fetchPhieuXuatKhoDetail, form, setDataSource]);

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
      const values = { ...form.getFieldsValue(true), ...(await form.validateFields()) };

      if (!validateDataSource(dataSource)) {
        setLoading(false);
        return;
      }

      const currentStatus = values.status || "0";

      validateQuantityForPhieu(
        dataSource,
        "phieu_xuat_kho",
        currentStatus,
        async () => {
          try {
            const payload = buildPayload(values, dataSource, phieuData, true);

            if (!payload) {
              message.error(
                "Không thể tạo payload. Vui lòng kiểm tra lại dữ liệu."
              );
              setLoading(false);
              return;
            }

            if (phieuData && phieuData.stt_rec) {
              if (
                payload.data &&
                payload.data.master &&
                payload.data.master[0]
              ) {
                payload.data.master[0].stt_rec = phieuData.stt_rec;
              }
            }

            const master =
              payload.master ||
              (payload.data && payload.data.master && payload.data.master[0]);
            if (
              !master ||
              (Array.isArray(master) && typeof master[0] !== "object")
            ) {
              message.error("Dữ liệu phiếu không hợp lệ!");
              setLoading(false);
              return;
            }
            const detail =
              payload.detail || (payload.data && payload.data.detail);
            const result = await updatePhieuXuatKho(
              Array.isArray(master) ? master[0] : master,
              detail,
              token
            );
            if (result.data?.responseModel?.isSucceded) {
              message.success("Cập nhật phiếu xuất kho thành công");
              setTimeout(() => {
                navigate("/kho/xuat-kho");
              }, 1000);
            } else {
              message.error("Cập nhật phiếu xuất kho thất bại");
            }
          } catch (error) {
            console.error("Submit failed:", error);
          } finally {
            setLoading(false);
          }
        },
        () => {
          // Callback khi user hủy
          setLoading(false);
        }
      );
    } catch (error) {
      console.error("Lỗi khi cập nhật phiếu xuất kho:", error);
      setLoading(false);
    }
  }, [form, dataSource, phieuData, navigate, setLoading, token]);

  const handleEdit = useCallback(() => {
    navigate(`/kho/xuat-kho/edit/${stt_rec}`);
    setIsEditMode(true);
  }, [navigate, stt_rec]);

  const handleDelete = useCallback(() => {
    showConfirm({
      title: "Xác nhận xóa phiếu xuất kho",
      content: "Bạn có chắc chắn muốn xóa phiếu xuất kho này không?",
      type: "warning",
      onOk: async () => {
        setLoading(true);
        try {
          if (!stt_rec) {
            message.error("Không tìm thấy mã phiếu để xóa");
            setLoading(false);
            return;
          }

          const body = {
            store: "api_delete_phieu_xuat_kho_voucher",
            param: { stt_rec: stt_rec },
            data: {},
          };
          const response = await https.post("User/AddData", body, {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          });

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
            navigate("/kho/xuat-kho");
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
        } finally {
          setLoading(false);
        }
      },
    });
  }, [stt_rec, navigate, token, setLoading]);

  const handleNew = useCallback(() => {
    navigate("/kho/xuat-kho/them-moi");
  }, [navigate]);

  const getBadge = () => {
    if (!stt_rec) return { text: "THÊM PHIẾU XUẤT MỚI", color: "green" };
    if (isEditMode) return { text: "SỬA PHIẾU XUẤT", color: "orange" };
    return { text: "CHI TIẾT PHIẾU XUẤT", color: "blue" };
  };
  const badge = getBadge();

  const footerActions = [];
  if (isEditMode) {
    footerActions.push(
      { key: "save", label: "Lưu", icon: <SaveOutlined />, type: "primary", onClick: handleSubmit, loading: loading },
      { key: "delete", label: "Xóa", icon: <DeleteOutlined />, danger: true, onClick: handleDelete },
      { key: "new", label: "Mới", icon: <PlusOutlined />, onClick: handleNew }
    );
  }

  return (
    <FormTemplate
      form={form}
      onFinish={handleSubmit}
      onBack={() => navigate("/kho/xuat-kho")}
      badgeText={badge.text}
      badgeColor={badge.color}
      metaOrder={form.getFieldValue('so_ct')}
      metaDate={form.getFieldValue('ngay_ct') ? dayjs(form.getFieldValue('ngay_ct')).format('DD/MM/YYYY') : '.........'}
      statusValue={form.getFieldValue('status') || "0"}
      statusOptions={[
        { value: "0", label: "Lập chứng từ" },
        { value: "1", label: "Chờ duyệt" },
        { value: "2", label: "Duyệt" },
      ]}
      statusFieldName="status"
      showStatusSelect={true}
      statusDisabled={!isEditMode && !!stt_rec}
      headerRightSpan={
        !isEditMode && stt_rec ? (
          <Button type="text" icon={<EditOutlined />} onClick={handleEdit} className="phieu-edit-button-kd" title="Chỉnh sửa" />
        ) : null
      }
      fixedFooterActions={footerActions}
    >
      <div className="phieu-form-container">
        <Form form={form} layout="vertical" className="phieu-form-section phieu-form--floating" disabled={!isEditMode}>
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
            handleSelectChange={handleSelectChange}
            maKhoList={maKhoList}
            loadingMaKho={loadingMaKho}
            fetchMaKhoListDebounced={fetchMaKhoListDebounced}
            fetchMaKhoList={fetchMaKhoList}
            fetchDonViTinh={fetchDonViTinh}
            onDataSourceUpdate={setDataSource}
          />
        </Form>
      </div>
    </FormTemplate>
  );
};

export default DetailPhieuXuatKho;
