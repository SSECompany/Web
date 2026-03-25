import { 
  EditOutlined, 
  LeftOutlined, 
  SaveOutlined, 
} from "@ant-design/icons";
import { Button, Form, message, Select, Tabs, Typography } from "antd";
import dayjs from "dayjs";
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import showConfirm from "../../../../components/common/Modal/ModalConfirm";
import VatTuSelectFullPOS from "../../../../components/common/ProductSelectFull/VatTuSelectFullPOS";
import https from "../../../../utils/https";
import "../common-phieu.css";
import "./DetailPhieuNhapHang.css";
import { validateQuantityForPhieu } from "../common/QuantityValidationUtils";
import PhieuNhapHangFormInputs from "./components/PhieuNhapHangFormInputs";
import VatTuNhapHangTable from "./components/VatTuNhapHangTable";
import { usePhieuNhapHangData } from "./hooks/usePhieuNhapHangData";
import { useVatTuManagerNhapHang } from "./hooks/useVatTuManagerNhapHang";
import { fetchPhieuNhapHangDetail } from "./utils/phieuNhapHangApi";
import {
  buildPhieuNhapHangPayload,
  deletePhieuNhapHangDynamic,
  submitPhieuNhapHangDynamic,
  validateDataSource,
} from "./utils/phieuNhapHangUtils";

const { Title } = Typography;

const DetailPhieuNhapHang = ({ isEditMode: initialEditMode = false }) => {
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
  } = usePhieuNhapHangData();

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
        const response = await fetchPhieuNhapHangDetail(sctRec);

        if (response && response.success) {
          const phieuInfo = response.master;
          const vatTuData = response.detail || [];

          if (phieuInfo) {
            let statusValue = phieuInfo.status;
            if (statusValue === "*" || statusValue === null) {
              statusValue = "0";
            }

            const formattedData = {
              stt_rec: stt_rec,
              sttRec: phieuInfo.stt_rec,
              ngay: phieuInfo.ngay_ct ? dayjs(phieuInfo.ngay_ct) : dayjs(),
              ngayHachToan: phieuInfo.ngay_lct ? dayjs(phieuInfo.ngay_lct) : dayjs(),
              soPhieu: phieuInfo.so_ct || "",
              maKhach: phieuInfo.ma_kh || "",
              dienGiai: phieuInfo.dien_giai || "Nhập hàng theo đơn",
              tenKhach: phieuInfo.ten_kh || phieuInfo.ong_ba || "",
              nguoiGiaoHang: phieuInfo.ong_ba || "",
              maGiaoDich: phieuInfo.ma_gd || "",
              trangThai: statusValue,
              maNT: phieuInfo.ma_nt || "VND",
              tyGia: phieuInfo.ty_gia || 1,
              soDonHang: phieuInfo.fcode2 ? phieuInfo.fcode2.trim() : "",
              ngayDonHang: phieuInfo.fdate1 ? dayjs(phieuInfo.fdate1) : null,
              maKho: phieuInfo.ma_kho || "",
              ma_nv_mua: phieuInfo.ten_nvmh || "",
              tenGiaoDich: phieuInfo.ten_gd || "",
            };

            const processedVatTu = vatTuData.map((item, index) => {
              // Đối với phiếu đã hoàn thành (status > 0), nếu không có sl_td3 thì lấy chính so_luong làm số thực nhập
              const isCompleted = statusValue && statusValue !== "0";
              const soLuongHienThi = item.sl_td3 !== undefined && item.sl_td3 !== null ? item.sl_td3 : (isCompleted ? item.so_luong : 0);
              const soLuongDeNghiHienThi = item.so_luong ?? 0;
              const dvtHienTai = item.dvt ? item.dvt.trim() : "cái";

              return {
                ...item,
                key: index + 1,
                maHang: (item.ma_vt || "").trim(),
                soLuong: Math.round(soLuongHienThi * 1000) / 1000,
                soLuongDeNghi: parseFloat(soLuongDeNghiHienThi) || 0,
                ten_mat_hang: item.ten_vt || item.ma_vt || "",
                dvt: dvtHienTai,
                he_so: item.he_so || 1,
                ma_kho: (item.ma_kho || "").trim(),
                ma_lo: (item.ma_lo || "").trim(),
                ma_vi_tri: (item.ma_vi_tri || "").trim(),
                tk_vt: item.tk_vt || "",
                line_nbr: item.line_nbr || index + 1,
                // Financial fields
                gia_nt0: parseFloat(item.gia_nt0 || 0),
                gia0: parseFloat(item.gia0 || 0),
                gia_nt: parseFloat(item.gia_nt || item.gia_nt0 || 0),
                gia: parseFloat(item.gia || item.gia0 || 0),
                tien_nt0: parseFloat(item.tien_nt0 || 0),
                tien0: parseFloat(item.tien0 || 0),
                tien_nt: parseFloat(item.tien_nt || item.tien_nt0 || 0),
                tien: parseFloat(item.tien || item.tien0 || 0),
                // Tax fields
                ma_thue: item.ma_thue || "",
                thue_suat: parseFloat(item.thue_suat || 0),
                thue_nt: parseFloat(item.thue_nt || 0),
                thue: parseFloat(item.thue || item.thue_nt || 0),
                tk_thue: item.tk_thue || "",
                tt_nt: parseFloat(item.tt_nt || 0),
                tt: parseFloat(item.tt || 0),
                // Discount fields
                tl_ck: parseFloat(item.tl_ck || 0),
                cktt: parseFloat(item.cktt || 0),
                ts_cktt: parseFloat(item.ts_cktt || 0),
                ma_ck: item.ma_ck || "",
                // Hạn sử dụng: API trả ngay_td1 → map sang ngay_hh cho bảng
                ngay_hh: item.ngay_td1 || null,
                ngay_td1: item.ngay_td1 || null,
                // Đơn hàng: API trả dh_so → map sang fcode2 cho bảng
                fcode2: (item.dh_so || item.fcode2 || "").trim(),
                dh_so: (item.dh_so || "").trim(),
                dh_ln: item.dh_ln || 0,
                fdate1: item.fdate1 || phieuInfo.fdate1 || null,
                // PO reference fields
                stt_rec_dh: item.stt_rec_dh || "",
                stt_rec0dh: item.stt_rec0dh || "",
                stt_rec_pn: item.stt_rec_pn || "",
                stt_rec0pn: item.stt_rec0pn || "",
                pn_so: item.pn_so || "",
                pn_ln: item.pn_ln || 0,
                // Cost fields
                cp_nt: parseFloat(item.cp_nt || 0),
                cp: parseFloat(item.cp || 0),
                tien_hang: parseFloat(item.tien_hang || item.tien_nt0 || 0),
                tien_hang_nt: parseFloat(item.tien_hang_nt || item.tien_nt0 || 0),
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

  const TRANG_THAI_OPTIONS = [
  { value: "2", label: "2. Chuyển vào SC" },
  { value: "3", label: "3. Nhập kho" },
];
  const handleVatTuSelectPNA = (value, option) => {
    const currentValues = form.getFieldsValue();
    vatTuSelectHandler(
      value,
      isEditMode,
      (val) => fetchVatTuDetail(
        val, 
        currentValues.maKho || "", 
        currentValues.maKhach || "",
        currentValues.ngay ? currentValues.ngay.format("YYYY-MM-DD") : dayjs().format("YYYY-MM-DD")
      ),
      fetchDonViTinh,
      setVatTuInput,
      setVatTuList,
      fetchVatTuList,
      vatTuSelectRef,
      option?.item // New argument: pass selected search item
    );
  };

  const handleEdit = () => {
    navigate(`/kho/nhap-hang/chi-tiet/edit/${sctRec}`);
    setIsEditMode(true);
  };

  const handleNew = () => {
    navigate("/kho/nhap-hang/them-moi");
  };

  const handleDelete = async () => {
    showConfirm({
      title: "Xác nhận xóa phiếu nhập hàng",
      content: "Bạn có chắc chắn muốn xóa phiếu nhập hàng này không?",
      type: "warning",
      onOk: async () => {
        setLoading(true);
        const result = await deletePhieuNhapHangDynamic(sctRec);
        setLoading(false);
 
        if (result.success) {
          navigate("/kho/nhap-hang");
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

      const isUpdate = !!stt_rec;
      const currentStatus = values.trangThai || "2";

      validateQuantityForPhieu(
        dataSource,
        "phieu_nhap_hang",
        currentStatus,
        async () => {
          try {
            const payload = buildPhieuNhapHangPayload(
              values,
              dataSource,
              phieuData,
              isUpdate
            );

            if (!payload) {
              message.error("Không thể tạo payload");
              setLoading(false);
              return;
            }

            const successMsg = isUpdate
              ? "Cập nhật phiếu nhập hàng thành công"
              : "Tạo phiếu nhập hàng thành công";

            const result = await submitPhieuNhapHangDynamic(
              payload,
              successMsg,
              isUpdate
            );

            if (result.success) {
              message.success(
                isUpdate
                  ? "Đã cập nhật thành công, đang chuyển về trang chính..."
                  : "Đã tạo phiếu thành công, đang chuyển về trang chính..."
              );

              setTimeout(() => {
                navigate("/kho/nhap-hang");
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

  const handlePoSearch = async (poNo) => {
    if (!poNo) return;
    try {
      setLoading(true);
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
            soLuong: parseFloat(item.so_luong || 0),
            soLuongDeNghi: parseFloat(item.so_luong || 0),
            dvt: (item.dvt || "").trim(),
            he_so: item.he_so || 1,
            ma_kho: (item.ma_kho || "").trim(),
            ma_vi_tri: item.ma_vi_tri || "",
            ma_lo: item.ma_lo || "",
            tk_vt: item.tk_vt || "156",
            gia_nt: parseFloat(item.gia_nt || item.gia || 0),
            gia: parseFloat(item.gia || item.gia_nt || 0),
            gia_nt0: parseFloat(item.gia_nt0 || item.gia_nt || 0),
            gia0: parseFloat(item.gia0 || item.gia || 0),
            tien_nt: parseFloat(item.tien_nt || 0),
            tien: parseFloat(item.tien || item.tien_nt || 0),
            ma_thue: item.ma_thue || "",
            tk_thue: item.tk_thue || "1331",
            thue_suat: parseFloat(item.thue_suat || 0),
            thue_nt: parseFloat(item.thue_nt || 0),
            thue: parseFloat(item.thue || item.thue_nt || 0),
            tt_nt: parseFloat(item.tt_nt || 0),
            tt: parseFloat(item.tt || item.tt_nt || 0),
            tien0: parseFloat(item.tien0 || item.tien_nt || 0),
            tien_nt0: parseFloat(item.tien_nt0 || item.tien_nt || 0),
            tien_hang: parseFloat(item.tien_hang || item.tien_nt || 0),
            tien_hang_nt: parseFloat(item.tien_hang_nt || item.tien_nt || 0),
            stt_rec_dh: item.stt_rec_dh || item.stt_rec || "",
            stt_rec0dh: item.stt_rec0dh || item.stt_rec0 || "",
            dh_so: item.dh_so || item.so_ct || "",
            dh_ln: item.dh_ln || index + 1,
            line_nbr: item.line_nbr || index + 1,
            ngay_hh: item.ngay_hh || item.ngay_td1 || null,
            fcode2: poNo,
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

  return (
    <div className="detail-phieu-nhap-hang">
      <Form
        form={form}
        layout="vertical"
        className="phieu-form phieu-form--floating"
        onFinish={handleSubmit}
      >
        <div className="detail-phieu-nhap-hang__card">
          <div className="detail-phieu-nhap-hang__header">
            <Button
              type="text"
              icon={<LeftOutlined />}
              onClick={() => navigate("/kho/nhap-hang")}
              className="phieu-back-button"
              htmlType="button"
            />

            <div className="phieu-header-info">
              <div className="phieu-header-tags">
                <span className={`phieu-header-badge ${!stt_rec ? 'phieu-header-badge--green' : isEditMode ? 'phieu-header-badge--orange' : 'phieu-header-badge--blue'}`}>
                  {stt_rec ? (isEditMode ? "SỬA PHIẾU NHẬP HÀNG" : "CHI TIẾT PHIẾU NHẬP HÀNG") : "THÊM PHIẾU NHẬP HÀNG MỚI"}
                </span>
              </div>

              <div className="phieu-header-meta-stack">
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
                      disabled={!isEditMode}
                    >
                      <Select.Option value="2">2. Chuyển vào SC</Select.Option>
                      <Select.Option value="3">3. Nhập kho</Select.Option>
                    </Select>
                  </Form.Item>
                </div>
              </div>
            </div>

            <div className="phieu-header-right">
              {stt_rec && !isEditMode ? (
                <Button
                  type="text"
                  icon={<EditOutlined />}
                  onClick={handleEdit}
                  className="phieu-edit-button-kd"
                  title="Chỉnh sửa"
                />
              ) : (
                <div style={{ width: 40 }}></div>
              )}
            </div>
          </div>

        <div className="detail-phieu-nhap-hang__body">
          <div className="detail-phieu-nhap-hang__section">
            <PhieuNhapHangFormInputs
              isEditMode={isEditMode}
              maKhachList={maKhachList}
              loadingMaKhach={loadingMaKhach}
              fetchMaKhachListDebounced={fetchMaKhachListDebounced}
              fetchMaKhachList={fetchMaKhachList}
              maGiaoDichList={maGiaoDichList}
              fetchMaGiaoDichList={fetchMaGiaoDichList}
              maKhoList={maKhoList}
              loadingMaKho={loadingMaKho}
              fetchMaKhoList={fetchMaKhoList}
              fetchMaKhoListDebounced={fetchMaKhoListDebounced}
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
                    {isEditMode && (
                        <div className="detail-phieu-nhap-hang__add-product-section">
                          <div className="section-title">Tìm quét vật tư nhập hàng</div>
                          <VatTuSelectFullPOS
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
                              handleVatTuSelect={handleVatTuSelectPNA}
                              totalPage={totalPage}
                              pageIndex={pageIndex}
                              setPageIndex={setPageIndex}
                              setVatTuList={setVatTuList}
                              currentKeyword={currentKeyword}
                          />
                        </div>
                    )}

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
                )
              }
            ]}
          />
          <div className="detail-phieu-nhap-hang__fixed-footer">
              <div className="fixed-footer__actions">
                  {(isEditMode || !stt_rec) && (
                          <Button 
                              type="primary" 
                              icon={<SaveOutlined />} 
                              onClick={handleSubmit} 
                              loading={loading}
                              className="btn-save-fixed"
                              style={{ minWidth: 200 }}
                          >
                              Lưu
                          </Button>
                  )}
              </div>
          </div>
        </div>
      </div>
    </Form>
  </div>
  );
};

export default DetailPhieuNhapHang;

