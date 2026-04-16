import { SaveOutlined, CloseCircleOutlined } from "@ant-design/icons";
import { Button, Form, Space, Typography, message } from "antd";
import dayjs from "dayjs";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatDate } from "../../../../utils/dateUtils";
import VatTuSelectFull from "../../../../components/common/ProductSelectFull/VatTuSelectFull";
import https from "../../../../utils/https";
import "../common-phieu.css";
import FormTemplate from "../../../../components/common/PageTemplates/FormTemplate";
import { validateQuantityForPhieu } from "../common/QuantityValidationUtils";
import { fetchVatTuListDynamicApi } from "../phieu-nhat-hang/utils/phieuNhatHangUtils";
import PhieuFormInputs from "./components/PhieuFormInputs";
import VatTuTable from "./components/VatTuTable";
import { usePhieuXuatDieuChuyenData } from "./hooks/usePhieuXuatDieuChuyenData";
import { useVatTuManager } from "./hooks/useVatTuManager";
import {
  buildPayload,
  validateDataSource,
} from "./utils/phieuXuatDieuChuyenUtils";
import { createPhieuXuatDieuChuyen } from "./utils/phieuXuatDieuChuyenApi";

const { Title } = Typography;

const AddPhieuXuatDieuChuyen = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const [vatTuInput, setVatTuInput] = useState(undefined);
  const [barcodeEnabled, setBarcodeEnabled] = useState(false);
  const [barcodeJustEnabled, setBarcodeJustEnabled] = useState(false);
  const [pageIndex, setPageIndex] = useState(1);
  const [totalPage, setTotalPage] = useState(1);
  const [currentKeyword, setCurrentKeyword] = useState("");

  const vatTuSelectRef = useRef();
  const searchTimeoutRef = useRef();

  const [vatTuList, setVatTuList] = useState([]);
  const [loadingVatTu, setLoadingVatTu] = useState(false);

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
    setVatTuList: setVatTuListFromHook,
  } = usePhieuXuatDieuChuyenData();

  const {
    dataSource,
    setDataSource,
    handleVatTuSelect: vatTuSelectHandler,
    handleQuantityChange,
    handleDeleteItem,
    handleDvtChange,
  } = useVatTuManager();

  const token = localStorage.getItem("access_token");



  const handleVatTuSelect = async (value, option) => {
    // Lấy ngữ cảnh hiện tại từ form
    const maKhoXuat = form.getFieldValue("maKhoXuat") || "";
    const ngayLap = form.getFieldValue("ngayLap");
    const formattedNgayLap = ngayLap && dayjs.isDayjs(ngayLap) ? ngayLap.format("YYYY-MM-DD") : dayjs().format("YYYY-MM-DD");

    const contextualFetchVatTuDetail = async (maVatTu) => {
      return await fetchVatTuDetail(maVatTu, maKhoXuat, "", formattedNgayLap);
    };

    await vatTuSelectHandler(
      value,
      true, // isEditMode
      contextualFetchVatTuDetail, // Sử dụng hàm đã wrap ngữ cảnh
      fetchDonViTinh,
      setVatTuInput,
      setVatTuList,
      fetchVatTuList,
      vatTuSelectRef,
      option
    );
  };

  const fetchVatTuList = useCallback(async (
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
  }, []);

  useEffect(() => {
    fetchMaGiaoDichList();
    fetchMaKhoList();
    fetchVatTuList();

    form.setFieldsValue({
      ngay: dayjs(),
      trangThai: "3",
      maGiaoDich: "3",
      soPhieu: "",
    });
  }, [fetchMaGiaoDichList, fetchMaKhoList, fetchVatTuList, form]);

  useEffect(() => {
    if (barcodeJustEnabled && vatTuSelectRef.current) {
      vatTuSelectRef.current.focus();
      setBarcodeJustEnabled(false);
    }
  }, [barcodeJustEnabled]);

  useEffect(() => {
    const searchTimeout = searchTimeoutRef.current;
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, []);

  // Phân trang vật tư
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

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const values = { ...form.getFieldsValue(true), ...(await form.validateFields()) };

      if (!validateDataSource(dataSource)) return;

      // Kiểm tra số lượng lệch nhau trước khi submit
      const currentStatus = values.trangThai || "0";

      validateQuantityForPhieu(
        dataSource,
        "phieu_xuat_dieu_chuyen",
        currentStatus,
        async () => {
          // Callback khi user xác nhận tiếp tục
          try {
            const payload = buildPayload(values, dataSource, null, false);

            if (!payload) {
              message.error(
                "Không thể tạo payload. Vui lòng kiểm tra lại dữ liệu."
              );
              setLoading(false);
              return;
            }

            // Gọi API thêm mới phiếu xuất điều chuyển qua function đã map param
            const result = await createPhieuXuatDieuChuyen(payload);

            if (result.success) {
              message.success("Tạo phiếu xuất điều chuyển thành công");
              navigate("/kho/xuat-dieu-chuyen");
            } else {
              message.error(result.message || "Tạo phiếu xuất điều chuyển thất bại");
            }
          } catch (error) {
            console.error("Submit failed:", error);
            message.error(error.message || "Có lỗi xảy ra khi tạo phiếu");
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
      console.error("Lỗi khi tạo phiếu xuất điều chuyển:", error);
      message.error("Có lỗi xảy ra khi tạo phiếu xuất điều chuyển");
      setLoading(false);
    }
  };

  return (
    <FormTemplate
      form={form}
      onFinish={handleSubmit}
      onBack={() => navigate("/kho/xuat-dieu-chuyen")}
      badgeText="THÊM PHIẾU XUẤT ĐIỀU CHUYỂN"
      badgeColor="green"
      metaOrder={form.getFieldValue('soPhieu')}
      metaDate={form.getFieldValue('ngay') ? dayjs(form.getFieldValue('ngay')).format('DD/MM/YYYY') : dayjs().format('DD/MM/YYYY')}
      statusValue={form.getFieldValue('trangThai') || "0"}
      statusOptions={[
        { value: "0", label: "Lập chứng từ" },
        { value: "1", label: "Điều chuyển" },
        { value: "2", label: "Chuyển KTTH" },
        { value: "3", label: "Chuyển sổ cái" },
        { value: "9", label: "Tài chính" },
      ]}
      showStatusSelect={true}
      fixedFooterActions={[
        {
          key: "save",
          label: "Lưu phiếu",
          icon: <SaveOutlined />,
          type: "primary",
          onClick: handleSubmit,
          loading: loading,
        },
        {
          key: "cancel",
          label: "Hủy",
          icon: <CloseCircleOutlined />,
          onClick: () => navigate("/kho/xuat-dieu-chuyen"),
        },
      ]}
    >
      <div className="phieu-form-container">
        <Form form={form} layout="vertical" className="phieu-form-section phieu-form--floating">
          <PhieuFormInputs
            isEditMode={true}
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
            isEditMode={true}
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

export default AddPhieuXuatDieuChuyen;
