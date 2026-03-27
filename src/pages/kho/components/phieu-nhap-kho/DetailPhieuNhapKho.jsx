import { EditOutlined, LeftOutlined, SaveOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Form, message, Space, Typography, Select } from "antd";
import dayjs from "dayjs";
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import showConfirm from "../../../../components/common/Modal/ModalConfirm";
import VatTuSelectFull from "../../../../components/common/ProductSelectFull/VatTuSelectFull";
import https from "../../../../utils/https";
import "../common-phieu.css";
import FormTemplate from "../../../../components/common/PageTemplates/FormTemplate";
import { validateQuantityForPhieu } from "../common/QuantityValidationUtils";
import PhieuNhapKhoFormInputs from "./components/PhieuNhapKhoFormInputs";
import VatTuNhapKhoTable from "./components/VatTuNhapKhoTable";
import { usePhieuNhapKhoData } from "./hooks/usePhieuNhapKhoData";
import { useVatTuManagerNhapKho } from "./hooks/useVatTuManagerNhapKho";
import {
  buildPhieuNhapKhoPayload,
  deletePhieuNhapKhoDynamic,
  submitPhieuNhapKhoDynamic,
  validateDataSource,
} from "./utils/phieuNhapKhoUtils";

const { Title } = Typography;

const DetailPhieuNhapKho = ({ isEditMode: initialEditMode = false }) => {
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
  const [apiCalled, setApiCalled] = useState(false);
  const [pageIndex, setPageIndex] = useState(1);
  const [totalPage, setTotalPage] = useState(1);
  const [currentKeyword, setCurrentKeyword] = useState("");
  const [phieuDetailLoaded, setPhieuDetailLoaded] = useState(false);

  const vatTuSelectRef = useRef();
  const searchTimeoutRef = useRef();
  const sctRec = location.state?.sctRec || stt_rec;
  const token = localStorage.getItem("access_token");

  const {
    maGiaoDichList,
    maKhoList,
    loadingMaKho,
    maKhachList,
    loadingMaKhach,
    vatTuList,
    loadingVatTu,
    fetchMaKhoListDebounced,
    fetchMaKhachListDebounced,
    fetchMaGiaoDichList,
    fetchMaKhoList,
    fetchMaKhachList,
    fetchVatTuList,
    fetchVatTuDetail,
    fetchDonViTinh,
    setVatTuList,
  } = usePhieuNhapKhoData();

  const {
    dataSource,
    setDataSource,
    handleVatTuSelect: vatTuSelectHandler,
    handleQuantityChange,
    handleSelectChange,
    handleDeleteItem,
    handleDvtChange,
  } = useVatTuManagerNhapKho();

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
    const isEditPath = location.pathname.includes("/edit/");
    setIsEditMode(isEditPath);
  }, [location.pathname]);

  useEffect(() => {
    const fetchPhieuDetail = async () => {
      if (apiCalled || !sctRec || phieuDetailLoaded) return;

      setLoading(true);
      setApiCalled(true);
      setPhieuDetailLoaded(true);

      try {
        const body = {
          store: "api_get_data_detail_phieu_nhap_kho_voucher",
          param: {
            stt_rec: sctRec,
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

        if (response && response.data) {
          const apiData = response.data.listObject?.dataLists || {};
          const phieuInfo =
            apiData.master && apiData.master.length > 0
              ? apiData.master[0]
              : null;
          const vatTuData = apiData.detail || [];

          if (phieuInfo) {
            let statusValue = phieuInfo.status;
            if (statusValue === "*" || statusValue === null) {
              statusValue = "0";
            }

            const formattedData = {
              stt_rec: stt_rec,
              sttRec: phieuInfo.stt_rec,
              ngay: phieuInfo.ngay_ct ? dayjs(phieuInfo.ngay_ct) : dayjs(),
              soPhieu: phieuInfo.so_ct || "",
              maKhach: phieuInfo.ma_kh || "",
              dienGiai: phieuInfo.dien_giai || "",
              tenKhach: phieuInfo.ong_ba || "",
              maGiaoDich: phieuInfo.ma_gd || "",
              trangThai: statusValue,
              donViTienTe: "VND",
              tyGia: 1,
            };

            const processedVatTu = vatTuData.map((item, index) => {
              const soLuongHienThi = item.sl_td3 ?? 0;
              const soLuongDeNghiHienThi = item.so_luong ?? 0;
              const dvtHienTai = item.dvt ? item.dvt.trim() : "cái";

              return {
                ...item,
                key: index + 1,
                maHang: item.ma_vt || "",
                soLuong: Math.round(soLuongHienThi * 1000) / 1000,
                soLuongDeNghi: parseFloat(soLuongDeNghiHienThi) || 0,
                ten_mat_hang: item.ten_vt || item.ma_vt || "",
                dvt: dvtHienTai,
                ma_kho: item.ma_kho || "",
                tk_vt: item.tk_vt || "",
                line_nbr: item.line_nbr || index + 1,
              };
            });

            setPhieuData(phieuInfo);
            form.setFieldsValue(formattedData);
            setDataSource(processedVatTu);
          }
        }
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu phiếu:", error);
        message.error("Lỗi khi tải dữ liệu phiếu");
        setApiCalled(false);
      } finally {
        setLoading(false);
      }
    };

    fetchPhieuDetail();
  }, [sctRec, apiCalled, token, stt_rec, phieuDetailLoaded, form, setDataSource]);

  useEffect(() => {
    if (barcodeJustEnabled && vatTuSelectRef.current) {
      vatTuSelectRef.current.focus();
      setBarcodeJustEnabled(false);
    }
  }, [barcodeJustEnabled]);

  useEffect(() => {
    if (barcodeEnabled) {
      const handleFocusIn = (e) => {
        if (
          !e.target.classList.contains("barcode-input") &&
          (e.target.tagName === "INPUT" || e.target.tagName === "SELECT")
        ) {
          setTimeout(() => {
            if (vatTuSelectRef.current && barcodeEnabled) {
              vatTuSelectRef.current.focus();
            }
          }, 10);
        }
      };

      document.addEventListener("focusin", handleFocusIn);

      return () => {
        document.removeEventListener("focusin", handleFocusIn);
      };
    }
  }, [barcodeEnabled]);

  useEffect(() => {
    const timeoutRef = searchTimeoutRef.current;
    return () => {
      if (timeoutRef) {
        clearTimeout(timeoutRef);
      }
    };
  }, []);

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

  const handleEdit = () => {
    navigate(`/kho/nhap-kho/edit/${stt_rec}`);
    setIsEditMode(true);
  };

  const handleNew = () => {
    navigate("/kho/nhap-kho/them-moi");
  };

  const handleDelete = async () => {
    showConfirm({
      title: "Xác nhận xóa phiếu nhập kho",
      content: "Bạn có chắc chắn muốn xóa phiếu nhập kho này không?",
      type: "warning",
      onOk: async () => {
        setLoading(true);
        const result = await deletePhieuNhapKhoDynamic(sctRec);
        setLoading(false);

        if (result.success) {
          navigate("/kho/nhap-kho");
        }
      },
    });
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();

      const validation = validateDataSource(dataSource);
      if (!validation.isValid) {
        setLoading(false);
        return;
      }

      const currentStatus = values.trangThai || "0";

      validateQuantityForPhieu(
        dataSource,
        "phieu_nhap_kho",
        currentStatus,
        async () => {
          try {
            const payload = buildPhieuNhapKhoPayload(
              values,
              dataSource,
              phieuData,
              true
            );

            if (!payload) {
              message.error("Không thể tạo payload");
              setLoading(false);
              return;
            }

            const result = await submitPhieuNhapKhoDynamic(
              payload,
              "Cập nhật phiếu nhập kho thành công",
              true
            );

            if (result.success) {
              message.success(
                "Đã cập nhật thành công, đang chuyển về trang chính..."
              );

              setTimeout(() => {
                navigate("/kho/nhap-kho");
              }, 1000);
            }
          } catch (error) {
            console.error("Submit failed:", error);
          } finally {
            setLoading(false);
          }
        },
        () => {
          setLoading(false);
        }
      );
    } catch (error) {
      console.error("Validation failed:", error);
      setLoading(false);
    }
  };

  const getBadge = () => {
    if (!stt_rec) return { text: "THÊM PHIẾU NHẬP MỚI", color: "green" };
    if (isEditMode) return { text: "SỬA PHIẾU NHẬP", color: "orange" };
    return { text: "CHI TIẾT PHIẾU NHẬP", color: "blue" };
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
      onBack={() => navigate("/kho/nhap-kho")}
      badgeText={badge.text}
      badgeColor={badge.color}
      metaOrder={form.getFieldValue('soPhieu')}
      metaDate={form.getFieldValue('ngay') ? dayjs(form.getFieldValue('ngay')).format('DD/MM/YYYY') : '.........'}
      statusValue={form.getFieldValue('trangThai') || "0"}
      statusOptions={[
        { value: "0", label: "0. Lập chứng từ" },
        { value: "1", label: "1. Chờ duyệt" },
        { value: "2", label: "2. Duyệt" },
      ]}
      showStatusSelect={true}
      headerRightSpan={
        !isEditMode && stt_rec ? (
          <Button type="text" icon={<EditOutlined />} onClick={handleEdit} className="phieu-edit-button-kd" title="Chỉnh sửa" />
        ) : null
      }
      fixedFooterActions={footerActions}
    >
      <div className="phieu-form-container">
        <Form form={form} layout="vertical" className="phieu-form-section phieu-form--floating" disabled={!isEditMode}>
          <PhieuNhapKhoFormInputs
            isEditMode={isEditMode}
            maKhachList={maKhachList}
            loadingMaKhach={loadingMaKhach}
            fetchMaKhachListDebounced={fetchMaKhachListDebounced}
            maGiaoDichList={maGiaoDichList}
            fetchMaKhachList={fetchMaKhachList}
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

          <VatTuNhapKhoTable
            dataSource={dataSource}
            isEditMode={isEditMode}
            handleQuantityChange={handleQuantityChange}
            handleSelectChange={handleSelectChange}
            handleDeleteItem={handleDeleteItem}
            handleDvtChange={handleDvtChange}
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

export default DetailPhieuNhapKho;

