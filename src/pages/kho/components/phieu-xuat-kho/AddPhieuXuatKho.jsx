import { LeftOutlined } from "@ant-design/icons";
import { Button, Form, Space, Typography, message } from "antd";
import dayjs from "dayjs";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import https from "../../../../utils/https";
import "../common-phieu.css";
import { validateQuantityForPhieu } from "../common/QuantityValidationUtils";
import PhieuFormInputs from "./components/PhieuFormInputs";
import VatTuTable from "./components/VatTuTable";
import { usePhieuXuatKhoData } from "./hooks/usePhieuXuatKhoData";
import { useVatTuManager } from "./hooks/useVatTuManager";
import { buildPayload, validateDataSource } from "./utils/phieuXuatKhoUtils";

const { Title } = Typography;

const AddPhieuXuatKho = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();

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

  // Lấy các state/hàm khác từ hook (KHÔNG lấy vật tư)
  const {
    loading,
    setLoading,
    maGiaoDichList,
    maKhachList,
    loadingMaKhach,
    maKhoList,
    loadingMaKho,
    fetchMaKhachListDebounced,
    fetchMaKhoListDebounced,
    fetchMaGiaoDichList,
    fetchMaKhachList,
    fetchMaKhoList,
    fetchVatTuDetail,
    fetchDonViTinh,
  } = usePhieuXuatKhoData();

  const {
    dataSource,
    handleVatTuSelect: vatTuSelectHandler,
    handleQuantityChange,
    handleSelectChange,
    handleDeleteItem,
    handleDvtChange,
  } = useVatTuManager();

  const token = localStorage.getItem("access_token");

  useEffect(() => {
    fetchMaGiaoDichList();
    fetchMaKhachList();
    fetchMaKhoList();
    fetchVatTuList();
    fetchVoucherInfo();

    form.setFieldsValue({
      ngay: dayjs(),
      trangThai: "0",
    });
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

  const fetchVoucherInfo = async () => {
    try {
      const response = await https.get(
        "v1/web/thong-tin-phieu-nhap",
        { voucherCode: "PXA" },
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

        form.setFieldsValue({
          so_ct: voucherData.so_phieu_nhap,
          ngay_ct: voucherData.ngay_lap ? dayjs(voucherData.ngay_lap) : dayjs(),
          ma_gd: "2",
          ma_kh: voucherData.ma_khach || "",
          dien_giai: voucherData.dien_giai || "",
          status: "3",
        });
      }
    } catch (error) {
      console.error("Error fetching voucher info:", error);
    }
  };

  // LOCAL fetch vật tư giống PXĐC
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

  const handleVatTuSelect = async (value) => {
    await vatTuSelectHandler(
      value,
      true,
      fetchVatTuDetail,
      fetchDonViTinh,
      setVatTuInput,
      setVatTuList,
      fetchVatTuList,
      vatTuSelectRef
    );
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();

      if (!validateDataSource(dataSource)) return;

      // Kiểm tra số lượng lệch nhau trước khi submit
      const currentStatus = values.status || "0";

      validateQuantityForPhieu(
        dataSource,
        "phieu_xuat_kho",
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

            // Gọi dynamicApi thêm mới phiếu xuất kho
            const response = await https.post("User/AddData", payload, {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
            });

            const hasResponseModel =
              response?.data &&
              typeof response.data.responseModel !== "undefined";
            const isSuccess = hasResponseModel
              ? response.data.responseModel.isSucceded === true
              : response?.data?.statusCode === 200;

            if (isSuccess) {
              message.success("Tạo phiếu xuất kho thành công");
              // Dùng window.location để tránh route matching issues
              window.location.href = "/kho/xuat-kho";
            } else {
              const serverMsg =
                response.data?.responseModel?.message || response.data?.message;
              message.error(serverMsg || "Tạo phiếu xuất kho thất bại");
            }
          } catch (error) {
            console.error("Submit failed:", error);
            const serverMsg =
              error?.response?.data?.responseModel?.message ||
              error?.response?.data?.message ||
              error?.message;
            if (serverMsg) message.error(serverMsg);
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
      console.error("Lỗi khi tạo phiếu xuất kho:", error);
      setLoading(false);
    }
  };

  return (
    <div className="phieu-container">
      <div className="phieu-header">
        <Button
          type="text"
          icon={<LeftOutlined />}
          onClick={() => navigate("/kho/xuat-kho")}
          className="phieu-back-button"
        >
          Trở về
        </Button>
        <Title level={5} className="phieu-title">
          THÊM PHIẾU XUẤT KHO
        </Title>
        <div style={{ width: 120 }}></div>
      </div>

      <div className="phieu-form-container">
        <Form form={form} layout="vertical" className="phieu-form">
          <PhieuFormInputs
            isEditMode={true}
            maKhachList={maKhachList}
            loadingMaKhach={loadingMaKhach}
            fetchMaKhachListDebounced={fetchMaKhachListDebounced}
            maGiaoDichList={maGiaoDichList}
            fetchMaGiaoDichList={fetchMaGiaoDichList}
            fetchMaKhachList={fetchMaKhachList}
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
            handleVatTuSelect={handleVatTuSelect}
            totalPage={totalPage}
            pageIndex={pageIndex}
            setPageIndex={setPageIndex}
            setVatTuList={setVatTuList}
            currentKeyword={currentKeyword}
            VatTuSelectComponent={
              require("../../../../components/common/ProductSelectFull/VatTuSelectFull")
                .default
            }
          />

          <VatTuTable
            dataSource={dataSource}
            isEditMode={true}
            handleQuantityChange={handleQuantityChange}
            handleSelectChange={handleSelectChange}
            handleDeleteItem={handleDeleteItem}
            handleDvtChange={handleDvtChange}
            maKhoList={maKhoList}
            loadingMaKho={loadingMaKho}
            fetchMaKhoListDebounced={fetchMaKhoListDebounced}
            fetchMaKhoList={fetchMaKhoList}
          />

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
              <Button onClick={() => navigate("/kho/xuat-kho")}>Hủy</Button>
            </Space>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default AddPhieuXuatKho;
