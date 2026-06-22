// import { LeftOutlined, LinkOutlined, SaveOutlined, CloseCircleOutlined } from "@ant-design/icons";
// import { Button, Form, message, Space, Typography, Select, Tabs, AutoComplete, DatePicker } from "antd";
// import dayjs from "dayjs";
// import { useEffect, useRef, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import VatTuSelectFull from "../../../../components/common/ProductSelectFull/VatTuSelectFull";
// import https from "../../../../utils/https";
// import "../common-phieu.css";
// import "./DetailPhieuNhapHang.css";
// import { validateQuantityForPhieu } from "../common/QuantityValidationUtils";
// import ModalKeThua from "./components/ModalKeThua";
// import showConfirm from "../../../../components/common/Modal/ModalConfirm";
// import PhieuNhapHangFormInputs from "./components/PhieuNhapHangFormInputs";
// import VatTuNhapHangTable from "./components/VatTuNhapHangTable";
// import FormTemplate from "../../../../components/common/PageTemplates/FormTemplate";
// import { usePhieuNhapHangData } from "./hooks/usePhieuNhapHangData";
// import { useVatTuManagerNhapHang } from "./hooks/useVatTuManagerNhapHang";
// import {
//   buildPhieuNhapHangPayload,
//   fetchVoucherInfo,
//   submitPhieuNhapHangDynamic,
//   validateDataSource,
// } from "./utils/phieuNhapHangUtils";
// import { fetchMaKhoApi } from "./utils/phieuNhapHangApi";

// const { Title } = Typography;

// const AddPhieuNhapHang = () => {
//   const navigate = useNavigate();
//   const [form] = Form.useForm();
//   const [isEditMode] = useState(true);
//   const [vatTuInput, setVatTuInput] = useState(undefined);
//   const [barcodeEnabled, setBarcodeEnabled] = useState(false);
//   const [barcodeJustEnabled, setBarcodeJustEnabled] = useState(false);
//   const [pageIndex, setPageIndex] = useState(1);
//   const [totalPage, setTotalPage] = useState(1);
//   const [currentKeyword, setCurrentKeyword] = useState("");
//   const [isInitialized, setIsInitialized] = useState(false);
//   const [keThuaModalOpen, setKeThuaModalOpen] = useState(false);
//   const [batchKhoValue, setBatchKhoValue] = useState("");
//   const [batchKhoOptions, setBatchKhoOptions] = useState([]);
//   const [batchLoValue, setBatchLoValue] = useState("");
//   const [batchLoOptions, setBatchLoOptions] = useState([]);
//   const [statusValue, setStatusValue] = useState("0");
//   const vatTuSelectRef = useRef();
//   const searchTimeoutRef = useRef();

//   const {
//     loading,
//     setLoading,
//     maGiaoDichList,
//     maKhoList,
//     loadingMaKho,
//     maKhachList,
//     loadingMaKhach,
//     vatTuList,
//     loadingVatTu,
//     fetchMaKhoListDebounced,
//     fetchMaKhachListDebounced,
//     fetchMaGiaoDichList,
//     fetchMaKhoList,
//     fetchMaKhachList,
//     fetchVatTuList,
//     fetchVatTuDetail,
//     fetchDonViTinh,
//     fetchViTriList,
//     setVatTuList,
//   } = usePhieuNhapHangData();

//   const maKhach = Form.useWatch("maKhach", form);

//   const {
//     dataSource,
//     setDataSource,
//     handleVatTuSelect: vatTuSelectHandler,
//     handleQuantityChange,
//     handleSelectChange,
//     handleDeleteItem,
//     handleDvtChange,
//     syncLoOptions,
//   } = useVatTuManagerNhapHang({ maKhoList, showConfirm });
//   const dataSourceRef = useRef(undefined);

//   // Luôn giữ ref đồng bộ với state
//   useEffect(() => {
//     dataSourceRef.current = dataSource;
//   }, [dataSource]);

//   const TRANG_THAI_OPTIONS = [
//     { value: "0", label: "1.Lập chứng từ" },
//     { value: "3", label: "3.Nhập kho" },
//   ];
//   const fetchVatTuListPaging = async (
//     keyword = "",
//     page = 1,
//     append = false
//   ) => {
//     setCurrentKeyword(keyword);
//     await fetchVatTuList(keyword, page, append, (pagination) => {
//       setPageIndex(page);
//       setTotalPage(pagination?.totalPage || 1);
//     });
//   };

//   const ngay = Form.useWatch("ngay", form);

//   useEffect(() => {
//     if (ngay) {
//       form.setFieldsValue({ ngayHachToan: ngay });
//     }
//   }, [ngay, form]);

//   useEffect(() => {
//     if (isInitialized) return;

//     const initializeData = async () => {
//       setIsInitialized(true);

//       await Promise.all([
//         fetchMaGiaoDichList(),
//         fetchMaKhoList(),
//         fetchMaKhachList(),
//         fetchVatTuList(),
//       ]);

//       const voucherData = await fetchVoucherInfo();
//       const now = dayjs();
      
//       const formData = {
//         ngay: now,
//         ngayHachToan: now,
//         maGiaoDich: "1",
//         donViTienTe: "VND",
//         tyGia: 1,
//         trangThai: "0",
//         dienGiai: "Nhập hàng theo đơn",
//         soPhieu: "",
//         maKhach: "",
//         soDonHang: "",
//       };

//       if (voucherData) {
//         formData.soPhieu = voucherData.so_phieu_nhap || "";
//         formData.maCt = voucherData.ma_ct || "PNA";
//         if (voucherData.ngay_lap) {
//           const d = dayjs(voucherData.ngay_lap);
//           if (d.isValid()) {
//             formData.ngay = d;
//             formData.ngayHachToan = d;
//           }
//         }
//         if (voucherData.ma_giao_dich) formData.maGiaoDich = voucherData.ma_giao_dich;
//         if (voucherData.ma_khach) formData.maKhach = voucherData.ma_khach;
//         if (voucherData.dien_giai) formData.dienGiai = voucherData.dien_giai;
//         if (voucherData.base_currency) formData.donViTienTe = voucherData.base_currency;

//         message.success("Đã tải thông tin phiếu nhập hàng thành công");
//       }
      
//       form.setFieldsValue(formData);
//     };

//     initializeData();
//   }, [
//     fetchMaGiaoDichList,
//     fetchMaKhoList,
//     fetchMaKhachList,
//     fetchVatTuList,
//     form,
//     isInitialized,
//   ]);

//   useEffect(() => {
//     if (barcodeJustEnabled && vatTuSelectRef.current) {
//       vatTuSelectRef.current.focus();
//       setBarcodeJustEnabled(false);
//     }
//   }, [barcodeJustEnabled]);

//   useEffect(() => {
//     const timeoutRef = searchTimeoutRef.current;
//     return () => {
//       if (timeoutRef) {
//         clearTimeout(timeoutRef);
//       }
//     };
//   }, []);

//   // Tự động tính tổng từ dataSource lên master form
//   useEffect(() => {
//     if (!dataSource || dataSource.length === 0) {
//       form.setFieldsValue({
//         t_so_luong: 0,
//         t_tien_nt0: 0,
//         t_tien0: 0,
//         t_thue_nt: 0,
//         t_thue: 0,
//         t_tt_nt: 0,
//         t_tt: 0,
//         t_cktt_nt: 0,
//       });
//       return;
//     }

//     const totals = dataSource.reduce(
//       (acc, item) => {
//         acc.t_so_luong += parseFloat(item.soLuong || item.so_luong || 0);
//         acc.t_tien_nt0 += parseFloat(item.tien_nt0 || 0);
//         acc.t_tien0 += parseFloat(item.tien0 || 0);
//         acc.t_thue_nt += parseFloat(item.thue_nt || 0);
//         acc.t_thue += parseFloat(item.thue || 0);
//         acc.t_cktt_nt += parseFloat(item.cktt || 0);
//         return acc;
//       },
//       { t_so_luong: 0, t_tien_nt0: 0, t_tien0: 0, t_thue_nt: 0, t_thue: 0, t_cktt_nt: 0 }
//     );

//     const t_tt_nt = totals.t_tien_nt0 + totals.t_thue_nt;
//     const t_tt = totals.t_tien0 + totals.t_thue;

//     form.setFieldsValue({
//       ...totals,
//       t_tt_nt,
//       t_tt,
//     });
//   }, [dataSource, form]);

//   const handleVatTuSelect = async (value) => {
//     const maKh = form ? form.getFieldValue("maKhach") : "";
//     const ngay = form ? form.getFieldValue("ngay") : null;
//     const ngayCt = ngay ? ngay.format("YYYY-MM-DD") : dayjs().format("YYYY-MM-DD");

//     await vatTuSelectHandler(
//       value,
//       isEditMode,
//       fetchVatTuDetail,
//       fetchDonViTinh,
//       setVatTuInput,
//       setVatTuList,
//       fetchVatTuList,
//       vatTuSelectRef
//     );
//   };

//   const handleKeThuaSelect = (data) => {
//     const { master, detail } = data;
//     if (master) {
//       const poNo = master.so_ct?.trim();
//       const poDate = master.ngay_ct ? dayjs(master.ngay_ct) : null;
//       const poNhanVien = master.ma_nv && master.ten_nv
//         ? `${master.ma_nv.trim()} – ${master.ten_nv.trim()}`
//         : (master.ma_nv?.trim() || "");
//       const tyGia = form.getFieldValue("tyGia") || 1;

//       form.setFieldsValue({
//         soDonHang: poNo,
//         maKhach: master.ma_kh?.trim() || form.getFieldValue("maKhach"),
//         ngayDonHang: poDate,
//         ma_nv_mua: poNhanVien,
//         dienGiai: `Nhập hàng theo đơn ${poNo}`,
//       });

//       const processedDetails = detail.map((item, index) => {
//         const soLuong = parseFloat(item.so_luong0 || 0);
//         const gia_nt0 = parseFloat(item.gia_nt || 0);
//         const thue_suat = parseFloat(item.thue_suat || 0);

//         const gia0 = gia_nt0 * tyGia;
//         const tien_nt0 = soLuong * gia_nt0;
//         const tien0 = tien_nt0 * tyGia;
//         const thue_nt = (tien_nt0 * thue_suat) / 100;
//         const thue = (tien0 * thue_suat) / 100;
//         const tt_nt = tien_nt0 + thue_nt;
//         const tt = tien0 + thue;

//         return {
//           key: dataSource.length + index + 1,
//           maHang: (item.ma_vt || "").trim(),
//           ten_mat_hang: item.ten_vt,
//           so_luong: soLuong,
//           soLuong: soLuong,
//           soLuongDeNghi: parseFloat(item.so_luong || 0),
//           dvt: (item.dvt || "").trim(),
//           ma_kho: (item.ma_kho || "").trim(),
//           tk_vt: item.tk_vt || "156",
//           ma_vv: item.ma_vv || "",
//           ma_bp: item.ma_bp || "",
//           so_lsx: item.so_lsx || "",
//           ma_sp: item.ma_sp || "",
//           ma_hd: item.ma_hd || "",
//           ma_phi: item.ma_phi || "",
//           ma_ku: item.ma_ku || "",
//           ma_lo: (item.ma_lo || "").trim(),
//           ma_vi_tri: (item.ma_vi_tri || "").trim(),
//           gia_nt0: gia_nt0,
//           gia_nt: gia_nt0,
//           gia0: gia0,
//           gia: gia0,
//           tien_nt0: tien_nt0,
//           tien_nt: tien_nt0,
//           tien0: tien0,
//           tien: tien0,
//           ma_thue: item.ma_thue || "",
//           thue_suat: thue_suat,
//           thue_nt: thue_nt,
//           thue: thue,
//           tk_thue: item.tk_thue || "1331",
//           tt_nt: tt_nt,
//           tt: tt,
//           stt_rec_dh: item.stt_rec || "",
//           stt_rec0dh: item.stt_rec0 || "",
//           dh_so: item.so_ct || "",
//           dh_ln: item.line_nbr || 0,
//           fcode2: poNo,
//           he_so: item.he_so || 1,
//           lo_yn: item.lo_yn || false,
//           tao_lo: item.tao_lo || false,
//           ngay_dh: item.fdate1 || item.ngay_ct,
//           isNewlyAdded: true,
//           _lastUpdated: Date.now(),
//         };
//       });

//       setDataSource([...dataSource, ...processedDetails]);
//       message.success(`Lấy dữ liệu đơn hàng ${poNo} thành công`);
//     }
//   };

//   const fetchBatchKhoOptions = async (keyword) => {
//     try {
//       const options = await fetchMaKhoApi(keyword, 1, 50);
//       setBatchKhoOptions(options);
//     } catch (e) {
//       console.error("fetchBatchKhoOptions error", e);
//     }
//   };

//   const applyBatchKho = (khoValue) => {
//     if (!khoValue) return;
    
//     setDataSource((prev) =>
//       prev.map((item) => ({ ...item, ma_kho: khoValue }))
//     );
//     setBatchKhoValue("");
//     setBatchKhoOptions([]);
//   };

  

  

//   const handlePoSearch = async (poNo) => {
//     if (!poNo) return;
//     try {
//       setLoading(true);
//       const token = localStorage.getItem("access_token");
//       const body = {
//         store: "api_get_data_po_for_receipt", // Template store name
//         param: {
//           so_po: poNo,
//         },
//         data: {},
//         resultSetNames: ["master", "detail"],
//       };

//       const response = await https.post("User/AddData", body, {
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//       });

//       if (response && response.data) {
//         const apiData = response.data.listObject?.dataLists || {};
//         const poInfo = apiData.master?.[0];
//         const poDetails = apiData.detail || [];

//         if (poInfo) {
//           const poDate = poInfo.ngay_ct ? dayjs(poInfo.ngay_ct) : null;
//           const poNhanVien = poInfo.ma_nv
//             ? `${poInfo.ma_nv.trim()} – ${(poInfo.ten_nv || "").trim()}`
//             : (poInfo.ma_nv?.trim() || "");

//           form.setFieldsValue({
//             soDonHang: poNo,
//             maKhach: poInfo.ma_kh || "",
//             dienGiai: `Nhập hàng theo đơn ${poNo}`,
//             ngayDonHang: poDate,
//             ma_nv_mua: poNhanVien,
//           });

//           const processedDetails = poDetails.map((item, index) => ({
//             key: dataSource.length + index + 1,
//             maHang: item.ma_vt,
//             ten_mat_hang: item.ten_vt,
//             soLuong: parseFloat(item.so_luong || 0),
//             soLuongDeNghi: item.so_luong,
//             dvt: item.dvt,
//             ma_kho: item.ma_kho || "",
//             tk_vt: item.tk_vt || "",
//             isNewlyAdded: true,
//             _lastUpdated: Date.now(),
//           }));

//           setDataSource(processedDetails);
//           message.success(`Lấy dữ liệu đơn hàng ${poNo} thành công`);
//         } else {
//           message.warning("Không tìm thấy đơn hàng");
//         }
//       }
//     } catch (error) {
//       console.error("Lỗi khi tìm PO:", error);
//       message.error("Lỗi khi lấy dữ liệu đơn hàng");
//     } finally {
//       setLoading(false);
//     }
//   };
//   const handleSubmit = async () => {
//     try {
//       setLoading(true);
//       const values = { ...form.getFieldsValue(true), ...(await form.validateFields()) };

//       const validation = validateDataSource(dataSource);
//       if (!validation.isValid) {
//         setLoading(false);
//         return;
//       }

//       const currentStatus = values.trangThai || "0";

//       validateQuantityForPhieu(
//         dataSource,
//         "phieu_nhap_hang",
//         currentStatus,
//         async () => {
//           try {
//             const payload = buildPhieuNhapHangPayload(values, dataSource);

//             if (!payload) {
//               message.error("Không thể tạo payload");
//               setLoading(false);
//               return;
//             }

//             const result = await submitPhieuNhapHangDynamic(
//               payload,
//               "Thêm phiếu nhập hàng thành công",
//               false
//             );

//             if (result.success) {
//               navigate("/kho/nhap-hang");
//             }
//           } catch (error) {
//             console.error("Submit failed:", error);
//           } finally {
//             setLoading(false);
//           }
//         },
//         () => {
//           setLoading(false);
//         }
//       );
//     } catch (error) {
//       console.error("Validation failed:", error);
//       setLoading(false);
//     }
//   };
  
   
//   return (
//     <div className="detail-phieu-nhap-hang">
//       <FormTemplate
//         form={form}
//         onFinish={handleSubmit}
//         onBack={() => navigate("/kho/nhap-hang")}
//         badgeText="THÊM PHIẾU NHẬP MỚI"
//         badgeColor="green"
//         metaDate={dayjs().format("DD-MM-YYYY")}
//         statusValue={statusValue}
//         statusOptions={TRANG_THAI_OPTIONS}
//         showStatusSelect={true}
//         statusDisabled={false}
//         fixedFooterActions={[
//           {
//             key: "save",
//             label: "Lưu phiếu",
//             icon: <SaveOutlined />,
//             type: "primary",
//             onClick: handleSubmit,
//             loading: loading,
//             className: "btn-save-fixed",
//           },
//           {
//             key: "kethua",
//             label: "Kế thừa",
//             icon: <LinkOutlined />,
//             type: "default",
//             onClick: () => setKeThuaModalOpen(true),
//             disabled: !maKhach,
//             className: "btn-print-fixed",
//           }
//         ]}
//       >
//         <Form 
//           form={form} 
//           layout="vertical"
//           initialValues={{
//             ngay: dayjs(),
//             ngayHachToan: dayjs(),
//             maGiaoDich: "1",
//             trangThai: "0",
//             dienGiai: "Nhập hàng theo đơn"
//           }}
//         >
//           <div className="detail-phieu-nhap-hang__body">
//             <div className="phieu-form-section phieu-form--floating" style={{ paddingBottom: 0, marginBottom: 24, padding: "24px 28px" }}>
//               <PhieuNhapHangFormInputs
//                 isEditMode={isEditMode}
//                 maKhachList={maKhachList}
//                 loadingMaKhach={loadingMaKhach}
//                 fetchMaKhachListDebounced={fetchMaKhachListDebounced}
//                 maGiaoDichList={maGiaoDichList}
//                 fetchMaKhachList={fetchMaKhachList}
//                 fetchMaGiaoDichList={fetchMaGiaoDichList}
//                 barcodeEnabled={barcodeEnabled}
//                 setBarcodeEnabled={setBarcodeEnabled}
//                 setBarcodeJustEnabled={setBarcodeJustEnabled}
//                 vatTuInput={vatTuInput}
//                 setVatTuInput={setVatTuInput}
//                 vatTuSelectRef={vatTuSelectRef}
//                 loadingVatTu={loadingVatTu}
//                 vatTuList={vatTuList}
//                 searchTimeoutRef={searchTimeoutRef}
//                 fetchVatTuList={fetchVatTuListPaging}
//                 totalPage={totalPage}
//                 pageIndex={pageIndex}
//                 setPageIndex={setPageIndex}
//                 setVatTuList={setVatTuList}
//                 currentKeyword={currentKeyword}
//                 VatTuSelectComponent={VatTuSelectFull}
//                 handleVatTuSelect={handleVatTuSelect}
//                 onPoSearch={handlePoSearch}
//               />
//             </div>

//             <Tabs
//               defaultActiveKey="chi_tiet"
//               className="detail-phieu-nhap-hang__tabs"
//               items={[
//                 {
//                   key: "chi_tiet",
//                   label: "Chi tiết",
//                   children: (
//                     <div style={{ minHeight: 120 }}>
//                       <div className="detail-phieu-nhap-hang__add-product-section">
//                         <div className="section-title">Tìm quét vật tư nhập hàng</div>
//                         <VatTuSelectFull
//                           isEditMode={isEditMode}
//                           barcodeEnabled={barcodeEnabled}
//                           setBarcodeEnabled={setBarcodeEnabled}
//                           setBarcodeJustEnabled={setBarcodeJustEnabled}
//                           vatTuInput={vatTuInput}
//                           setVatTuInput={setVatTuInput}
//                           vatTuSelectRef={vatTuSelectRef}
//                           loadingVatTu={loadingVatTu}
//                           vatTuList={vatTuList}
//                           searchTimeoutRef={searchTimeoutRef}
//                           fetchVatTuList={fetchVatTuListPaging}
//                           totalPage={totalPage}
//                           pageIndex={pageIndex}
//                           setPageIndex={setPageIndex}
//                           setVatTuList={setVatTuList}
//                           currentKeyword={currentKeyword}
//                           handleVatTuSelect={handleVatTuSelect}
//                         />
//                       </div>

//                       {/* Tiện ích: điền kho hàng loạt */}
//                       {(() => {
//                         const itemsWithoutKho = dataSource.filter(item => !(item.ma_kho || "").trim());
                      
//                         return (
//                           <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0", marginTop: 8 }}>
//                             <span style={{ fontSize: 13, color: "#475569", whiteSpace: "nowrap", fontWeight: 500 }}>
//                               Điền kho hàng loạt ({itemsWithoutKho.length} dòng chưa có kho):
//                             </span>
//                             <AutoComplete
//                               value={batchKhoValue}
//                               options={batchKhoOptions}
//                               onSearch={(text) => { setBatchKhoValue(text); fetchBatchKhoOptions(text); }}
//                               onFocus={() => { if (batchKhoOptions.length === 0) fetchBatchKhoOptions(""); }}
//                               onSelect={(val) => { applyBatchKho(val); }}
//                               onChange={(val) => setBatchKhoValue(val)}
//                               placeholder="Chọn hoặc gõ mã kho…"
//                               style={{ width: 240 }}
//                               notFoundContent={null}
//                               filterOption={(input, option) => option.label.toLowerCase().includes(input.toLowerCase())}
//                             />
//                             <Button
//                               size="small"
//                               //disabled={!batchKhoValue.trim() || itemsWithoutKho.length === 0}
//                               onClick={() => applyBatchKho(batchKhoValue.trim())}
//                             >
//                               Áp dụng
//                             </Button>
//                             {batchKhoValue.trim() && (
//                               <Button size="small" onClick={() => { setBatchKhoValue(""); setBatchKhoOptions([]); }}>
//                                 Hủy
//                               </Button>
//                             )}
//                           </div>
//                         );
//                       })()}

//                       {/* Tiện ích: điền lô hàng loạt */}
//                       {/* {(() => {
//                         const itemsWithoutLo = dataSource.filter(item => !(item.ma_lo || "").trim());
//                         if (itemsWithoutLo.length === 0) return null;
//                         return (
//                           <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", background: "#fff8f0", borderRadius: 8, border: "1px solid #fed7aa", marginTop: 8 }}>
//                             <span style={{ fontSize: 13, color: "#92400e", whiteSpace: "nowrap", fontWeight: 500 }}>
//                               Điền lô hàng loạt ({itemsWithoutLo.length} dòng chưa có lô):
//                             </span>
//                             <AutoComplete
//                               value={batchLoValue}
//                               options={batchLoOptions}
//                               onSearch={(text) => {
//                                 setBatchLoValue(text);
//                                 if (!text.trim()) { setBatchLoOptions([]); return; }
//                                 fetchBatchLoOptions(text);
//                               }}
//                               onFocus={() => { if (batchLoOptions.length === 0) fetchBatchLoOptions(""); }}
//                               onChange={(val) => setBatchLoValue(val)}
//                               placeholder="Chọn hoặc gõ mã lô…"
//                               style={{ width: 240 }}
//                               notFoundContent={null}
//                               filterOption={(input, option) => option.label.toLowerCase().includes(input.toLowerCase())}
//                             />
//                             <DatePicker
//                               placeholder="Ngày HSD"
//                               format={["DD/MM/YYYY", "DDMMYYYY"]}
//                               style={{ width: 130 }}
//                               allowClear
//                             />
//                             <Button
//                               size="small"
//                               disabled={!batchLoValue.trim() || itemsWithoutLo.length === 0}
//                               onClick={() => applyBatchLo({ loValue: batchLoValue.trim(), ngayHh: null })}
//                             >
//                               Áp dụng
//                             </Button>
//                             {batchLoValue.trim() && (
//                               <Button size="small" onClick={() => { setBatchLoValue(""); setBatchLoOptions([]); }}>
//                                 Hủy
//                               </Button>
//                             )}
//                           </div>
//                         );
//                       })()} */}

//                        <VatTuNhapHangTable
//                         dataSource={dataSource}
//                         isEditMode={isEditMode}
//                         handleQuantityChange={handleQuantityChange}
//                         handleSelectChange={handleSelectChange}
//                         handleDeleteItem={handleDeleteItem}
//                         handleDvtChange={handleDvtChange}
//                         maKhoList={maKhoList}
//                         loadingMaKho={loadingMaKho}
//                         fetchMaKhoListDebounced={fetchMaKhoListDebounced}
//                         fetchMaKhoList={fetchMaKhoList}
//                         fetchDonViTinh={fetchDonViTinh}
//                         fetchViTriList={(keyword, record, page) => {
//                           const maKho = record.ma_kho || record.maKho || form.getFieldValue("maKho") || "";
//                           return fetchViTriList(keyword, { ...record, ma_kho: maKho }, page);
//                         }}
//                         onDataSourceUpdate={setDataSource}
//                         onLoOptionsUpdate={syncLoOptions}
//                       />
//                     </div>
//                   )
//                 }
//               ]}
//             />

//             <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginTop: 12, padding: '12px 24px', borderTop: '1px solid #f0f0f0' }}>
//                 <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
//                     <div style={{ textAlign: 'right' }}>
//                         <span style={{ color: '#64748b', fontSize: '13px' }}>Tổng SL: </span>
//                         <span style={{ fontWeight: 600, color: '#1e293b' }}>
//                             {dataSource.reduce((acc, item) => acc + (parseFloat(item.soLuong || item.so_luong) || 0), 0).toLocaleString("vi-VN")}
//                         </span>
//                     </div>
//                 </div>
//             </div>
//           </div>
//         </Form>
//       </FormTemplate>

//       <ModalKeThua
//         open={keThuaModalOpen}
//         onCancel={() => setKeThuaModalOpen(false)}
//         onSelect={handleKeThuaSelect}
//         maKhach={form.getFieldValue("maKhach") || ""}
//       />
//     </div>
//   );
// };

// export default AddPhieuNhapHang;

import { LeftOutlined, LinkOutlined, SaveOutlined, CloseCircleOutlined } from "@ant-design/icons";
import { Button, Form, message, Space, Typography, Select, Tabs, AutoComplete, DatePicker } from "antd";
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
import { fetchMaKhoApi } from "./utils/phieuNhapHangApi";

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
  const [batchKhoValue, setBatchKhoValue] = useState("");
  const [batchKhoOptions, setBatchKhoOptions] = useState([]);
  const [batchLoValue, setBatchLoValue] = useState("");
  const [batchLoOptions, setBatchLoOptions] = useState([]);
  const [statusValue, setStatusValue] = useState("0");
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
    fetchViTriList,
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
    syncLoOptions,
  } = useVatTuManagerNhapHang({ maKhoList });

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
  const TRANG_THAI_OPTIONS = [
  { value: "0", label: "1.Lập chứng từ" },
  { value: "3", label: "3.Nhập kho" },
  ];
  const ngay = Form.useWatch("ngay", form);

  useEffect(() => {
    if (ngay) {
      form.setFieldsValue({ ngayHachToan: ngay });
    }
  }, [ngay, form]);

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
      const now = dayjs();
      
      const formData = {
        ngay: now,
        ngayHachToan: now,
        maGiaoDich: "1",
        donViTienTe: "VND",
        tyGia: 1,
        trangThai: "0",
        dienGiai: "Nhập hàng theo đơn",
        soPhieu: "",
        maKhach: "",
        soDonHang: "",
      };

      if (voucherData) {
        formData.soPhieu = voucherData.so_phieu_nhap || "";
        formData.maCt = voucherData.ma_ct || "PNA";
        if (voucherData.ngay_lap) {
          const d = dayjs(voucherData.ngay_lap);
          if (d.isValid()) {
            formData.ngay = d;
            formData.ngayHachToan = d;
          }
        }
        if (voucherData.ma_giao_dich) formData.maGiaoDich = voucherData.ma_giao_dich;
        if (voucherData.ma_khach) formData.maKhach = voucherData.ma_khach;
        if (voucherData.dien_giai) formData.dienGiai = voucherData.dien_giai;
        if (voucherData.base_currency) formData.donViTienTe = voucherData.base_currency;

        message.success("Đã tải thông tin phiếu nhập hàng thành công");
      }
      
      form.setFieldsValue(formData);
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
      const poDate = master.ngay_ct ? dayjs(master.ngay_ct) : null;
      const poNhanVien = master.ma_nv && master.ten_nv
        ? `${master.ma_nv.trim()} – ${master.ten_nv.trim()}`
        : (master.ma_nv?.trim() || "");
      const tyGia = form.getFieldValue("tyGia") || 1;

      form.setFieldsValue({
        soDonHang: poNo,
        maKhach: master.ma_kh?.trim() || form.getFieldValue("maKhach"),
        ngayDonHang: poDate,
        ma_nv_mua: poNhanVien,
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
          ma_lo: (item.ma_lo || "").trim(),
          ma_vi_tri: (item.ma_vi_tri || "").trim(),
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

  const fetchBatchKhoOptions = async (keyword) => {
    try {
      const options = await fetchMaKhoApi(keyword, 1, 50);
      setBatchKhoOptions(options);
    } catch (e) {
      console.error("fetchBatchKhoOptions error", e);
    }
  };

  const applyBatchKho = (khoValue) => {
    if (!khoValue) return;
    
    setDataSource((prev) =>
      prev.map((item) => ({ ...item, ma_kho: khoValue }))
    );
    setBatchKhoValue("");
    setBatchKhoOptions([]);
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
      const values = { ...form.getFieldsValue(true), ...(await form.validateFields()) };
     
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
        statusValue={statusValue}
        statusOptions={TRANG_THAI_OPTIONS}
        showStatusSelect={true}
        statusDisabled={false}
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
        <Form 
          form={form} 
          layout="vertical"
          initialValues={{
            ngay: dayjs(),
            ngayHachToan: dayjs(),
            maGiaoDich: "1",
            trangThai: "3",
            dienGiai: "Nhập hàng theo đơn"
          }}
        >
          <div className="detail-phieu-nhap-hang__body">
            <div className="phieu-form-section phieu-form--floating" style={{ paddingBottom: 0, marginBottom: 24, padding: "24px 28px" }}>
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

                      {/* Tiện ích: điền kho hàng loạt */}
                      {(() => {
                        const itemsWithoutKho = dataSource.filter(item => !(item.ma_kho || "").trim());
                      
                        return (
                          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0", marginTop: 8 }}>
                            <span style={{ fontSize: 13, color: "#475569", whiteSpace: "nowrap", fontWeight: 500 }}>
                              Điền kho hàng loạt ({itemsWithoutKho.length} dòng chưa có kho):
                            </span>
                            <AutoComplete
                              value={batchKhoValue}
                              options={batchKhoOptions}
                              onSearch={(text) => { setBatchKhoValue(text); fetchBatchKhoOptions(text); }}
                              onFocus={() => { if (batchKhoOptions.length === 0) fetchBatchKhoOptions(""); }}
                              onSelect={(val) => { applyBatchKho(val); }}
                              onChange={(val) => setBatchKhoValue(val)}
                              placeholder="Chọn hoặc gõ mã kho…"
                              style={{ width: 240 }}
                              notFoundContent={null}
                              filterOption={(input, option) => option.label.toLowerCase().includes(input.toLowerCase())}
                            />
                            <Button
                              size="small"
                              //disabled={!batchKhoValue.trim() || itemsWithoutKho.length === 0}
                              onClick={() => applyBatchKho(batchKhoValue.trim())}
                            >
                              Áp dụng
                            </Button>
                            {batchKhoValue.trim() && (
                              <Button size="small" onClick={() => { setBatchKhoValue(""); setBatchKhoOptions([]); }}>
                                Hủy
                              </Button>
                            )}
                          </div>
                        );
                      })()}

                      {/* Tiện ích: điền lô hàng loạt */}
                      {/* {(() => {
                        const itemsWithoutLo = dataSource.filter(item => !(item.ma_lo || "").trim());
                        if (itemsWithoutLo.length === 0) return null;
                        return (
                          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", background: "#fff8f0", borderRadius: 8, border: "1px solid #fed7aa", marginTop: 8 }}>
                            <span style={{ fontSize: 13, color: "#92400e", whiteSpace: "nowrap", fontWeight: 500 }}>
                              Điền lô hàng loạt ({itemsWithoutLo.length} dòng chưa có lô):
                            </span>
                            <AutoComplete
                              value={batchLoValue}
                              options={batchLoOptions}
                              onSearch={(text) => {
                                setBatchLoValue(text);
                                if (!text.trim()) { setBatchLoOptions([]); return; }
                                fetchBatchLoOptions(text);
                              }}
                              onFocus={() => { if (batchLoOptions.length === 0) fetchBatchLoOptions(""); }}
                              onChange={(val) => setBatchLoValue(val)}
                              placeholder="Chọn hoặc gõ mã lô…"
                              style={{ width: 240 }}
                              notFoundContent={null}
                              filterOption={(input, option) => option.label.toLowerCase().includes(input.toLowerCase())}
                            />
                            <DatePicker
                              placeholder="Ngày HSD"
                              format={["DD/MM/YYYY", "DDMMYYYY"]}
                              style={{ width: 130 }}
                              allowClear
                            />
                            <Button
                              size="small"
                              disabled={!batchLoValue.trim() || itemsWithoutLo.length === 0}
                              onClick={() => applyBatchLo({ loValue: batchLoValue.trim(), ngayHh: null })}
                            >
                              Áp dụng
                            </Button>
                            {batchLoValue.trim() && (
                              <Button size="small" onClick={() => { setBatchLoValue(""); setBatchLoOptions([]); }}>
                                Hủy
                              </Button>
                            )}
                          </div>
                        );
                      })()} */}

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
                        fetchViTriList={(keyword, record, page) => {
                          const maKho = record.ma_kho || record.maKho || form.getFieldValue("maKho") || "";
                          return fetchViTriList(keyword, { ...record, ma_kho: maKho }, page);
                        }}
                        onDataSourceUpdate={setDataSource}
                        onLoOptionsUpdate={syncLoOptions}
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
        </Form>
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