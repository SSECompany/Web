import { EditOutlined, LeftOutlined, SaveOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Form, Space, Typography, message, Select } from "antd";
import dayjs from "dayjs";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import showConfirm from "../../../../components/common/Modal/ModalConfirm";
import VatTuSelectFull from "../../../../components/common/ProductSelectFull/VatTuSelectFull";
import https from "../../../../utils/https";
import "../common-phieu.css";
import FormTemplate from "../../../../components/common/PageTemplates/FormTemplate";
import PhieuFormInputs from "./components/PhieuFormInputs";
import VatTuTable from "./components/VatTuTable";
import { usePhieuXuatDieuChuyenData } from "./hooks/usePhieuXuatDieuChuyenData";
import { useVatTuManager } from "./hooks/useVatTuManager";

import { phieuXuatDieuChuyenConfig } from "../common/VatTuTable";
import { validateQuantityForPhieu } from "../common/QuantityValidationUtils";
import { fetchVatTuListDynamicApi } from "../phieu-nhat-hang/utils/phieuNhatHangUtils";
import {
  buildPayload,
  validateDataSource,
} from "./utils/phieuXuatDieuChuyenUtils";

import {
  fetchPhieuXuatDieuChuyenDetail,
  updatePhieuXuatDieuChuyen,
  deletePhieuXuatDieuChuyen,
} from "./utils/phieuXuatDieuChuyenApi";


const { Title } = Typography;

const DetailPhieuXuatDieuChuyen = ({ isEditMode: initialEditMode = false }) => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { stt_rec, id } = useParams();
  const actualSttRec = stt_rec || id;

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
      const payload = {
        store: "api_getListItem",
        data: {},
        param: {
          Currency: "VND",
          searchValue: keyword || "",
          unitId: unitCode || "TAPMED ",
          userId: user.id || 0,
          pageindex: page,
          pagesize: 100,
        },
        resultSetNames: ["data"]
      };
      const token = localStorage.getItem("access_token");
      const res = await https.post("User/AddData", payload, {
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
      });

      const listObject = res.data?.listObject || [];
      const data = listObject[0] || [];

      if (Array.isArray(data)) {
        const options = data.map((item) => ({
          label: `${item.ma_vt} - ${item.ten_vt}`,
          value: item.ma_vt,
          ...item,
        }));
        setVatTuList((prev) => (append ? [...prev, ...options] : options));
        if (callback) callback({ totalPage: data[0]?.totalPage || 1 });
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
  } = usePhieuXuatDieuChuyenData();

  const {
    dataSource,
    setDataSource,
    handleVatTuSelect: vatTuSelectHandler,
    handleQuantityChange,
    handleDeleteItem,
    handleDvtChange,
  } = useVatTuManager();

  const handleVatTuSelect = async (value, option) => {
    // Lấy ngữ cảnh hiện tại từ form
    const maKhoXuat = form.getFieldValue("maKhoXuat") || "";
    const ngayLap = form.getFieldValue("ngayLap");
    const formattedNgayLap = ngayLap && dayjs.isDayjs(ngayLap) ? ngayLap.format("YYYY-MM-DD") : dayjs().format("YYYY-MM-DD");

    const contextualFetchVatTuDetail = async (maVatTu) => {
      return await fetchVatTuDetail(maVatTu, maKhoXuat, "", formattedNgayLap);
    };

    const result = await vatTuSelectHandler(
      value,
      isEditMode,
      contextualFetchVatTuDetail, // Sử dụng hàm đã wrap ngữ cảnh
      fetchDonViTinh,
      setVatTuInput,
      setVatTuList,
      fetchVatTuList,
      vatTuSelectRef,
      option
    );
  };

  useEffect(() => {
    // Tự động load danh sách kho và mã giao dịch để hiển thị tên thay vì mã khi load chi tiết phiếu
    if (fetchMaKhoList && fetchMaGiaoDichList) {
      fetchMaKhoList("");
      fetchMaGiaoDichList();
    }
  }, [fetchMaKhoList, fetchMaGiaoDichList]);

  useEffect(() => {
    const fetchPhieuDetail = async () => {
      if (actualSttRec) {
        try {
          const result = await fetchPhieuXuatDieuChuyenDetail(actualSttRec);
          
          if (result.success && result.master && Object.keys(result.master).length > 0) {
            const masterData = result.master;
            const detailData = result.detail;

            // Lưu chỉ data gốc từ API để sử dụng khi build payload (không merge với UI data)
            const formattedData = {
              ngay: masterData.ngay_ct ? dayjs(masterData.ngay_ct) : null,
              ngay_lct: masterData.ngay_lct ? dayjs(masterData.ngay_lct) : null,
              soPhieu: masterData.so_ct?.trim() || "",
              maKhoXuat: masterData.ma_khox?.trim() || "",
              tenKhoXuat: masterData.ten_kho_x?.trim() || "",
              maKhoNhap: masterData.ma_kho?.trim() || "",
              tenKhoNhap: masterData.ten_kho?.trim() || "",
              ong_ba: masterData.ong_ba?.trim() || "",
              dien_giai: masterData.dien_giai?.trim() || "",
              maGiaoDich: masterData.ma_gd ? masterData.ma_gd.trim() : "3",
              tenGiaoDich: masterData.ten_gd?.trim() || "",
              trangThai: masterData.status || "",
              ty_gia: masterData.ty_gia || 1,
              ma_nt: masterData.ma_nt || "VND",
            };


            setPhieuData(masterData);
            form.setFieldsValue(formattedData);

            if (detailData && detailData.length > 0) {
              const formattedDetail = detailData.map((item, index) => {
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
              setDataSource(formattedDetail);
            } else {
              setDataSource([]);
            }
          }
        } catch (error) {
          console.error("Lỗi khi fetch chi tiết phiếu xuất điều chuyển:", error);
        }
      }
    };
    fetchPhieuDetail();
  }, [actualSttRec, form, setDataSource]);



  const submitPhieuData = useCallback(async (values) => {
    try {
      const payload = buildPayload(values, dataSource, phieuData, true);

      if (!payload) {
        message.error("Không thể tạo payload. Vui lòng kiểm tra lại dữ liệu.");
        setLoading(false);
        return;
      }

      const result = await updatePhieuXuatDieuChuyen(payload, phieuData);

      if (result.success) {
        setIsEditMode(false);
        navigate("/kho/xuat-dieu-chuyen");
      }
    } catch (error) {
      console.error("Lỗi khi cập nhật phiếu xuất điều chuyển:", error);
    } finally {
      setLoading(false);
    }
  }, [dataSource, phieuData, navigate, setLoading]);


  const handleSubmit = useCallback(async () => {
    try {
      setLoading(true);
      const values = { ...form.getFieldsValue(true), ...(await form.validateFields()) };

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
    navigate(`/kho/xuat-dieu-chuyen/edit/${actualSttRec}`);
    setIsEditMode(true);
  }, [navigate, actualSttRec]);


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
          const result = await deletePhieuXuatDieuChuyen(actualSttRec);
          if (result.success) {
            navigate("/kho/xuat-dieu-chuyen");
          }
        } catch (error) {
          console.error("Lỗi khi xóa phiếu xuất điều chuyển:", error);
        } finally {
          setLoading(false);
        }

      },
    });
  }, [actualSttRec, navigate, setLoading]);



  const getBadge = () => {
    if (!actualSttRec) return { text: "THÊM PHIẾU XUẤT ĐIỀU CHUYỂN MỚI", color: "green" };
    if (isEditMode) return { text: "SỬA PHIẾU XUẤT ĐIỀU CHUYỂN", color: "orange" };
    return { text: "CHI TIẾT PHIẾU XUẤT ĐIỀU CHUYỂN", color: "blue" };
  };

  const badge = getBadge();

  const footerActions = [];
  if (isEditMode) {
    footerActions.push(
      { key: "save", label: "Lưu", icon: <SaveOutlined />, type: "primary", onClick: handleSubmit, loading: loading },
      { key: "delete", label: "Xóa", icon: <DeleteOutlined />, danger: true, onClick: handleDelete },
      { key: "new", label: "Mới", icon: <PlusOutlined />, onClick: () => navigate("/kho/xuat-dieu-chuyen/them-moi") }
    );
  }

  return (
    <FormTemplate
      form={form}
      onFinish={handleSubmit}
      onBack={() => navigate("/kho/xuat-dieu-chuyen")}
      badgeText={badge.text}
      badgeColor={badge.color}
      metaOrder={form.getFieldValue('soPhieu')}
      metaDate={form.getFieldValue('ngay') ? dayjs(form.getFieldValue('ngay')).format('DD/MM/YYYY') : '.........'}
      statusValue={form.getFieldValue('trangThai') || "0"}
      statusOptions={[
        { value: "0", label: "Lập chứng từ" },
        { value: "1", label: "Điều chuyển" },
        { value: "2", label: "Chuyển KTTH" },
        { value: "3", label: "Chuyển sổ cái" },
        { value: "9", label: "Tài chính" },
      ]}

      showStatusSelect={true}
      statusDisabled={!isEditMode && !!actualSttRec}
      headerRightSpan={
        !isEditMode && actualSttRec ? (
          <Button type="text" icon={<EditOutlined />} onClick={handleEdit} className="phieu-edit-button-kd" title="Chỉnh sửa" />
        ) : null
      }

      fixedFooterActions={footerActions}
    >
      <div className="phieu-form-container">
        <Form form={form} layout="vertical" className="phieu-form-section phieu-form--floating" disabled={!isEditMode}>
          <PhieuFormInputs
            isEditMode={isEditMode}
            phieuData={phieuData}
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
            showVatTuSelect={isEditMode && !actualSttRec}
          />

          <VatTuTable
            dataSource={dataSource}
            isEditMode={isEditMode && !actualSttRec}
            handleQuantityChange={handleQuantityChange}
            handleDeleteItem={handleDeleteItem}
            handleDvtChange={handleDvtChange}
            maKhoList={maKhoList}
            loadingMaKho={loadingMaKho}
            fetchMaKhoListDebounced={fetchMaKhoListDebounced}
            fetchDonViTinh={fetchDonViTinh}
            onDataSourceUpdate={setDataSource}
          />
        </Form>
      </div>
    </FormTemplate>
  );
};

export default DetailPhieuXuatDieuChuyen;
