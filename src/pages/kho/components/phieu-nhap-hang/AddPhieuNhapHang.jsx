import { LeftOutlined, LinkOutlined, SaveOutlined, CloseCircleOutlined } from "@ant-design/icons";
import { Button, Form, message, Space, Typography, Select, Tabs } from "antd";
import dayjs from "dayjs";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import VatTuSelectFull from "../../../../components/common/ProductSelectFull/VatTuSelectFull";
import https from "../../../../utils/https";
import "../common-phieu.css";
import "./DetailPhieuNhapHang.css";
import { validateQuantityForPhieu } from "../common/QuantityValidationUtils";
import ModalKeThua from "./components/ModalKeThua";
import PhieuNhapHangFormInputs from "./components/PhieuNhapHangFormInputs";
import VatTuNhapHangTable from "./components/VatTuNhapHangTable";
import FormTemplate from "../../../../components/common/PageTemplates/FormTemplate";
import { usePhieuNhapHangData } from "./hooks/usePhieuNhapHangData";
import { useVatTuManagerNhapHang } from "./hooks/useVatTuManagerNhapHang";
import {
  buildPhieuNhapHangPayload,
  fetchVoucherInfo,
  submitPhieuNhapHangDynamic,
  validateDataSource,
} from "./utils/phieuNhapHangUtils";

const { Title } = Typography;

const AddPhieuNhapHang = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [isEditMode] = useState(true);
  const [vatTuInput, setVatTuInput] = useState(undefined);
  const [barcodeEnabled, setBarcodeEnabled] = useState(false);
  const [barcodeJustEnabled, setBarcodeJustEnabled] = useState(false);
  const [pageIndex, setPageIndex] = useState(1);
  const [totalPage, setTotalPage] = useState(1);
  const [currentKeyword, setCurrentKeyword] = useState("");
  const [isInitialized, setIsInitialized] = useState(false);
  const [keThuaModalOpen, setKeThuaModalOpen] = useState(false);

  const vatTuSelectRef = useRef();
  const searchTimeoutRef = useRef();

  const {
    loading,
    setLoading,
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
  } = usePhieuNhapHangData();

  const maKhach = Form.useWatch("maKhach", form);

  const {
    dataSource,
    setDataSource,
    handleVatTuSelect: vatTuSelectHandler,
    handleQuantityChange,
    handleSelectChange,
    handleDeleteItem,
    handleDvtChange,
  } = useVatTuManagerNhapHang();

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
    if (isInitialized) return;

    const initializeData = async () => {
      setIsInitialized(true);

      await Promise.all([
        fetchMaGiaoDichList(),
        fetchMaKhoList(),
        fetchMaKhachList(),
        fetchVatTuList(),
      ]);

      const voucherData = await fetchVoucherInfo();
      if (voucherData) {
        const formData = {
          soPhieu: voucherData.so_phieu_nhap,
          ngay: voucherData.ngay_lap ? dayjs(voucherData.ngay_lap) : dayjs(),
          maGiaoDich: voucherData.ma_giao_dich || "1",
          maCt: voucherData.ma_ct,
          donViTienTe: voucherData.base_currency || "VND",
          tyGia: 1,
          trangThai: "3",
          maKhach: voucherData.ma_khach || "",
          dienGiai: voucherData.dien_giai || "Nhập hàng theo đơn",
          soDonHang: "", // Field for PO No.
        };
        form.setFieldsValue(formData);
        message.success("Đã tải thông tin phiếu nhập hàng thành công");
      }
    };

    initializeData();
  }, [
    fetchMaGiaoDichList,
    fetchMaKhoList,
    fetchMaKhachList,
    fetchVatTuList,
    form,
    isInitialized,
  ]);

  useEffect(() => {
    if (barcodeJustEnabled && vatTuSelectRef.current) {
      vatTuSelectRef.current.focus();
      setBarcodeJustEnabled(false);
    }
  }, [barcodeJustEnabled]);

  useEffect(() => {
    const timeoutRef = searchTimeoutRef.current;
    return () => {
      if (timeoutRef) {
        clearTimeout(timeoutRef);
      }
    };
  }, []);

  // Tự động tính tổng từ dataSource lên master form
  useEffect(() => {
    if (!dataSource || dataSource.length === 0) {
      form.setFieldsValue({
        t_so_luong: 0,
        t_tien_nt0: 0,
        t_tien0: 0,
        t_thue_nt: 0,
        t_thue: 0,
        t_tt_nt: 0,
        t_tt: 0,
        t_cktt_nt: 0,
      });
      return;
    }

    const totals = dataSource.reduce(
      (acc, item) => {
        acc.t_so_luong += parseFloat(item.soLuong || item.so_luong || 0);
        acc.t_tien_nt0 += parseFloat(item.tien_nt0 || 0);
        acc.t_tien0 += parseFloat(item.tien0 || 0);
        acc.t_thue_nt += parseFloat(item.thue_nt || 0);
        acc.t_thue += parseFloat(item.thue || 0);
        acc.t_cktt_nt += parseFloat(item.cktt || 0);
        return acc;
      },
      { t_so_luong: 0, t_tien_nt0: 0, t_tien0: 0, t_thue_nt: 0, t_thue: 0, t_cktt_nt: 0 }
    );

    const t_tt_nt = totals.t_tien_nt0 + totals.t_thue_nt;
    const t_tt = totals.t_tien0 + totals.t_thue;

    form.setFieldsValue({
      ...totals,
      t_tt_nt,
      t_tt,
    });
  }, [dataSource, form]);

  const handleVatTuSelect = async (value) => {
    const maKh = form ? form.getFieldValue("maKhach") : "";
    const ngay = form ? form.getFieldValue("ngay") : null;
    const ngayCt = ngay ? ngay.format("YYYY-MM-DD") : dayjs().format("YYYY-MM-DD");

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

  const handleKeThuaSelect = (data) => {
    const { master, detail } = data;
    if (master) {
      const poNo = master.so_ct?.trim();
      const tyGia = form.getFieldValue("tyGia") || 1;

      form.setFieldsValue({
        soDonHang: poNo,
        maKhach: master.ma_kh?.trim() || form.getFieldValue("maKhach"),
        dienGiai: `Nhập hàng theo đơn ${poNo}`,
      });

      const processedDetails = detail.map((item, index) => {
        const soLuong = parseFloat(item.so_luong0 || 0);
        const gia_nt0 = parseFloat(item.gia_nt || 0);
        const thue_suat = parseFloat(item.thue_suat || 0);

        const gia0 = gia_nt0 * tyGia;
        const tien_nt0 = soLuong * gia_nt0;
        const tien0 = tien_nt0 * tyGia;
        const thue_nt = (tien_nt0 * thue_suat) / 100;
        const thue = (tien0 * thue_suat) / 100;
        const tt_nt = tien_nt0 + thue_nt;
        const tt = tien0 + thue;

        return {
          key: dataSource.length + index + 1,
          maHang: (item.ma_vt || "").trim(),
          ten_mat_hang: item.ten_vt,
          so_luong: soLuong,
          soLuong: soLuong,
          soLuongDeNghi: parseFloat(item.so_luong || 0),
          dvt: (item.dvt || "").trim(),
          ma_kho: (item.ma_kho || "").trim(),
          tk_vt: item.tk_vt || "156",
          ma_vv: item.ma_vv || "",
          ma_bp: item.ma_bp || "",
          so_lsx: item.so_lsx || "",
          ma_sp: item.ma_sp || "",
          ma_hd: item.ma_hd || "",
          ma_phi: item.ma_phi || "",
          ma_ku: item.ma_ku || "",
          gia_nt0: gia_nt0,
          gia_nt: gia_nt0,
          gia0: gia0,
          gia: gia0,
          tien_nt0: tien_nt0,
          tien_nt: tien_nt0,
          tien0: tien0,
          tien: tien0,
          ma_thue: item.ma_thue || "",
          thue_suat: thue_suat,
          thue_nt: thue_nt,
          thue: thue,
          tk_thue: item.tk_thue || "1331",
          tt_nt: tt_nt,
          tt: tt,
          stt_rec_dh: item.stt_rec || "",
          stt_rec0dh: item.stt_rec0 || "",
          dh_so: item.so_ct || "",
          dh_ln: item.line_nbr || 0,
          fcode2: poNo,
          he_so: item.he_so || 1,
          lo_yn: item.lo_yn || false,
          tao_lo: item.tao_lo || false,
          isNewlyAdded: true,
          _lastUpdated: Date.now(),
        };
      });

      setDataSource([...dataSource, ...processedDetails]);
      message.success(`Lấy dữ liệu đơn hàng ${poNo} thành công`);
    }
  };

  const handlePoSearch = async (poNo) => {
    if (!poNo) return;
    try {
      setLoading(true);
      const token = localStorage.getItem("access_token");
      const body = {
        store: "api_get_data_po_for_receipt", // Template store name
        param: {
          so_po: poNo,
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
        const poInfo = apiData.master?.[0];
        const poDetails = apiData.detail || [];

        if (poInfo) {
          form.setFieldsValue({
            maKhach: poInfo.ma_kh,
            dienGiai: `Nhập hàng theo đơn ${poNo}`,
          });

          const processedDetails = poDetails.map((item, index) => ({
            key: dataSource.length + index + 1,
            maHang: item.ma_vt,
            ten_mat_hang: item.ten_vt,
            soLuong: 0,
            soLuongDeNghi: item.so_luong,
            dvt: item.dvt,
            ma_kho: item.ma_kho || "",
            tk_vt: item.tk_vt || "",
            isNewlyAdded: true,
            _lastUpdated: Date.now(),
          }));

          setDataSource(processedDetails);
          message.success(`Lấy dữ liệu đơn hàng ${poNo} thành công`);
        } else {
          message.warning("Không tìm thấy đơn hàng");
        }
      }
    } catch (error) {
      console.error("Lỗi khi tìm PO:", error);
      message.error("Lỗi khi lấy dữ liệu đơn hàng");
    } finally {
      setLoading(false);
    }
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
        "phieu_nhap_hang",
        currentStatus,
        async () => {
          try {
            const payload = buildPhieuNhapHangPayload(values, dataSource);

            if (!payload) {
              message.error("Không thể tạo payload");
              setLoading(false);
              return;
            }

            const result = await submitPhieuNhapHangDynamic(
              payload,
              "Thêm phiếu nhập hàng thành công",
              false
            );

            if (result.success) {
              navigate("/kho/nhap-hang");
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

  return (
    <div className="detail-phieu-nhap-hang">
      <FormTemplate
        form={form}
        onFinish={handleSubmit}
        onBack={() => navigate("/kho/nhap-hang")}
        badgeText="THÊM PHIẾU NHẬP MỚI"
        badgeColor="green"
        metaDate={dayjs().format("DD-MM-YYYY")}
        statusValue="0"
        statusOptions={[
          { value: "0", label: "Lập chứng từ" },
          { value: "1", label: "Chờ duyệt" },
          { value: "2", label: "Duyệt" },
        ]}
        fixedFooterActions={[
          {
            key: "save",
            label: "Lưu phiếu",
            icon: <SaveOutlined />,
            type: "primary",
            onClick: handleSubmit,
            loading: loading,
            className: "btn-save-fixed",
          },
          {
            key: "kethua",
            label: "Kế thừa",
            icon: <LinkOutlined />,
            type: "default",
            onClick: () => setKeThuaModalOpen(true),
            disabled: !maKhach,
            className: "btn-print-fixed",
          }
        ]}
      >

          <div className="detail-phieu-nhap-hang__body">
            <div className="phieu-form-section phieu-form--floating">
              <PhieuNhapHangFormInputs
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
                onPoSearch={handlePoSearch}
              />
            </div>

            <Tabs
              defaultActiveKey="chi_tiet"
              className="detail-phieu-nhap-hang__tabs"
              items={[
                {
                  key: "chi_tiet",
                  label: "Chi tiết",
                  children: (
                    <div style={{ minHeight: 120 }}>
                      <div className="detail-phieu-nhap-hang__add-product-section">
                        <div className="section-title">Tìm quét vật tư nhập hàng</div>
                        <VatTuSelectFull
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
                          fetchVatTuList={fetchVatTuListPaging}
                          totalPage={totalPage}
                          pageIndex={pageIndex}
                          setPageIndex={setPageIndex}
                          setVatTuList={setVatTuList}
                          currentKeyword={currentKeyword}
                          handleVatTuSelect={handleVatTuSelect}
                        />
                      </div>

                      <VatTuNhapHangTable
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
                    </div>
                  )
                }
              ]}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginTop: 12, padding: '12px 24px', borderTop: '1px solid #f0f0f0' }}>
                <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
                    <div style={{ textAlign: 'right' }}>
                        <span style={{ color: '#64748b', fontSize: '13px' }}>Tổng SL: </span>
                        <span style={{ fontWeight: 600, color: '#1e293b' }}>
                            {dataSource.reduce((acc, item) => acc + (parseFloat(item.soLuong || item.so_luong) || 0), 0).toLocaleString("vi-VN")}
                        </span>
                    </div>
                </div>
            </div>
          </div>

      </FormTemplate>

      <ModalKeThua
        open={keThuaModalOpen}
        onCancel={() => setKeThuaModalOpen(false)}
        onSelect={handleKeThuaSelect}
        maKhach={form.getFieldValue("maKhach") || ""}
      />
    </div>
  );
};

export default AddPhieuNhapHang;

