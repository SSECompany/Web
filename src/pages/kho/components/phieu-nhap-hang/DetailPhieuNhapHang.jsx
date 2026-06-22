import { 
  EditOutlined, 
  LinkOutlined,
  SaveOutlined, 
  CloseCircleOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { Button, Form, message, Select, Tabs, Typography, Space, AutoComplete, DatePicker } from "antd";
import dayjs from "dayjs";
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import showConfirm from "../../../../components/common/Modal/ModalConfirm";
import VatTuSelectFullPOS from "../../../../components/common/ProductSelectFull/VatTuSelectFullPOS";
import https from "../../../../utils/https";
import "../common-phieu.css";
import "./DetailPhieuNhapHang.css";
import FormTemplate from "../../../../components/common/PageTemplates/FormTemplate";
import { validateQuantityForPhieu } from "../common/QuantityValidationUtils";
import ModalKeThua from "./components/ModalKeThua";
import PhieuNhapHangFormInputs from "./components/PhieuNhapHangFormInputs";
import VatTuNhapHangTable from "./components/VatTuNhapHangTable";
import { usePhieuNhapHangData } from "./hooks/usePhieuNhapHangData";
import { useVatTuManagerNhapHang } from "./hooks/useVatTuManagerNhapHang";
import { fetchPhieuNhapHangDetail, fetchMaKhoApi } from "./utils/phieuNhapHangApi";
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
  const [statusValue, setStatusValue] = useState("0");
  const [vatTuInput, setVatTuInput] = useState(undefined);
  const [barcodeEnabled, setBarcodeEnabled] = useState(false);
  const [barcodeJustEnabled, setBarcodeJustEnabled] = useState(false);
  const [apiCalled, setApiCalled] = useState(false);
  const [pageIndex, setPageIndex] = useState(1);
  const [totalPage, setTotalPage] = useState(1);
  const [currentKeyword, setCurrentKeyword] = useState("");
  const [phieuDetailLoaded, setPhieuDetailLoaded] = useState(false);
  const [keThuaModalOpen, setKeThuaModalOpen] = useState(false);
  const [batchKhoValue, setBatchKhoValue] = useState("");
  const [batchKhoOptions, setBatchKhoOptions] = useState([]);

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
    fetchViTriList,
    setVatTuList,
    setMaKhachList,
  } = usePhieuNhapHangData();

  const {
    dataSource,
    setDataSource,
    handleVatTuSelect: vatTuSelectHandler,
    handleQuantityChange,
    handleSelectChange,
    handleDeleteItem,
    handleDvtChange,
    syncLoOptions,
  } = useVatTuManagerNhapHang({ maKhoList, showConfirm });

  // Sync dataSource giữa modal và submit
  const dataSourceRef = useRef([]);
  useEffect(() => {
    dataSourceRef.current = dataSource;
  }, [dataSource]);

  const maKhach = Form.useWatch("maKhach", form);

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

  // Set default dates = today when creating new phieu
  useEffect(() => {
    if (!sctRec && !phieuDetailLoaded) {
      form.setFieldsValue({
        ngay: dayjs(),
        ngayHachToan: dayjs(),
        trangThai: "0",
      });
    }
  }, [sctRec, phieuDetailLoaded]);

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
            let status = phieuInfo.status;
            if (status === "*" || status === null) {
              status = "0";
            }
            setStatusValue(status);

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
              maGiaoDich: phieuInfo.ma_gd ? phieuInfo.ma_gd.trim() : "1",
              trangThai: status,
              maNT: phieuInfo.ma_nt || "VND",
              tyGia: phieuInfo.ty_gia || 1,
              soDonHang: phieuInfo.fcode2 ? phieuInfo.fcode2.trim() : "",
              ngayDonHang: phieuInfo.fdate1 ? dayjs(phieuInfo.fdate1) : null,
              maKho: phieuInfo.ma_kho || "",
              ma_nv_mua: phieuInfo.fcode1 || "",
              tenGiaoDich: phieuInfo.ten_gd || "", 
            };

            if (phieuInfo.ma_kh) {
              setMaKhachList((prev) => {
                const alreadyExists = prev.some((o) => o.value === phieuInfo.ma_kh.trim());
                if (alreadyExists) return prev;
                return [
                  ...prev,
                  {
                    value: phieuInfo.ma_kh.trim(),
                    label: `${phieuInfo.ma_kh.trim()} - ${phieuInfo.ten_kh?.trim() || "Nhà cung cấp"}`,
                  },
                ];
              });
            }

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
                image: item.image || item.hinh_anh || null,
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
  }, [sctRec, apiCalled, token, stt_rec, phieuDetailLoaded, form, setDataSource, setMaKhachList]);

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

  // Cleanup search timeout
  useEffect(() => {
    const timeoutRef = searchTimeoutRef.current;
    return () => {
      if (timeoutRef) {
        clearTimeout(timeoutRef);
      }
    };
  }, []);

  // Sync dataSourceRef mỗi khi dataSource thay đổi — dùng cho validate/submit
  useEffect(() => {
    dataSourceRef.current = dataSource;
  }, [dataSource]);

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

  const TRANG_THAI_OPTIONS = [
    { value: "0", label: "1.Lập chứng từ" },
    { value: "3", label: "3.Nhập kho" },
  ];
  const handleVatTuSelectPNA = (value, option) => {
    const currentValues = form.getFieldsValue();
    vatTuSelectHandler(
      value,
      isEditMode,
      fetchVatTuDetail,
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

  const handleKeThuaSelect = (data) => {
    const { master, detail, originalRecord } = data;
    if (!master && !originalRecord) return;

    const poNo = (master?.so_ct || originalRecord?.so_ct || "").trim();
    const tyGia = form.getFieldValue("tyGia") || 1;

    // Dùng master từ API detail, nhưng fallback về originalRecord (dòng list) cho fcode1/fdate1
    const masterData = master || {};
    const original = originalRecord || {};
    const masterNgayDh = masterData.fdate1 || original.fdate1 || null;
    const masterFcode1 = masterData.fcode1 || original.fcode1 || "";

    form.setFieldsValue({
      soDonHang: poNo,
      ngayDonHang: masterNgayDh ? dayjs(masterNgayDh) : null,
      ma_nv_mua: masterFcode1,
      maKhach: (masterData.ma_kh || original.ma_kh || "").trim() || form.getFieldValue("maKhach"),
      dienGiai: `Nhập hàng theo đơn ${poNo}`,
    });

    const maKhVal = masterData.ma_kh || original.ma_kh;
    if (maKhVal) {
      const mkh = maKhVal.trim();
      setMaKhachList((prev) => {
        const alreadyExists = prev.some((o) => o.value === mkh);
        if (alreadyExists) return prev;
        return [
          ...prev,
          {
            value: mkh,
            label: `${mkh} - ${(masterData.ten_kh || original.ten_kh || "").trim() || "Nhà cung cấp"}`,
          },
        ];
      });
    }

    if (!detail || !Array.isArray(detail) || detail.length === 0) {
      message.warning("Đơn hàng không có vật tư");
      return;
    }

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
      const itemNgayDh = item.fdate1 || item.ngay_ct || masterNgayDh;

      return {
        key: dataSource.length + index + 1,
        maHang: (item.ma_vt || "").trim(),
        ten_mat_hang: item.ten_vt,
        so_luong: soLuong,
        soLuong: soLuong,
        soLuongDeNghi: parseFloat(item.so_luong || 0),
        dvt: (item.dvt || "").trim(),
        ma_lo: (item.ma_lo || "").trim(),
        ma_vi_tri: item.ma_vi_tri || "",
        ngay_hh: item.ngay_hh || item.ngay_td1 || null,
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
        dh_so: (item.dh_so || item.so_ct || poNo).trim(),
        dh_ln: item.dh_ln || item.line_nbr || 0,
        fdate1: item.fdate1 || masterNgayDh || null,
        fcode2: poNo,
        he_so: item.he_so || 1,
        lo_yn: item.lo_yn || false,
        tao_lo: item.tao_lo || false,
        ngay_dh: itemNgayDh,
        isNewlyAdded: true,
        _lastUpdated: Date.now(),
      };
    });

    setDataSource((prev) => [...prev, ...processedDetails]);
    message.success(`Lấy dữ liệu đơn hàng ${poNo} thành công`);
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
    const validValues = (maKhoList || []).map((o) => o.value);
    if (validValues.length > 0 && !validValues.includes(khoValue)) {
      message.error(`Mã kho "${khoValue}" không có trong danh sách`);
      return;
    }
    setDataSource((prev) =>
      prev.map((item) =>
        !(item.ma_kho || "").trim()
          ? { ...item, ma_kho: khoValue }
          : item
      )
    );
    setBatchKhoValue("");
    setBatchKhoOptions([]);
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
      // Disabled/readOnly fields KHÔNG bị validate bởi validateFields().
      // readOnly fields (ma_nv_mua, soDonHang, ngayDonHang) vẫn gửi được giá trị vì readOnly KHÔNG phải disabled.
      // disabled fields (ngay, ngayHachToan) → getFieldsValue(true) giữ nguyên giá trị dayjs.
      const allFields = form.getFieldsValue(true);
      let values = { ...allFields };
      try {
        const validated = await form.validateFields();
        values = { ...allFields, ...validated };
      } catch (validationErrors) {
        // Antd Form tự hiển thị lỗi trên form rồi — chỉ cần dừng submit
        setLoading(false);
        return;
      }

      const isUpdate = !!stt_rec;
      const currentStatus = values.trangThai || "0";

      // Validate: dùng dataSourceRef để lấy state MỚI NHẤT (tránh stale closure)
      const validation = validateDataSource(dataSourceRef.current);
      if (!validation.isValid) {
        setLoading(false);
        return;
      }

      validateQuantityForPhieu(
        dataSourceRef.current,
        "phieu_nhap_hang",
        currentStatus,
        async () => {
          try {
            const payload = buildPhieuNhapHangPayload(
              values,
              dataSourceRef.current,
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
          const poDate = poInfo.ngay_ct ? dayjs(poInfo.ngay_ct) : null;
          const poNhanVien = poInfo.ma_nv
            ? `${poInfo.ma_nv.trim()} – ${(poInfo.ten_nv || "").trim()}`
            : (poInfo.ma_nv?.trim() || "");

          form.setFieldsValue({
            soDonHang: poNo,
            maKhach: poInfo.ma_kh || "",
            dienGiai: `Nhập hàng theo đơn ${poNo}`,
            ngayDonHang: poDate,
            ma_nv_mua: poNhanVien,
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

  const getBadge = () => {
    if (!stt_rec) return { text: "THÊM PHIẾU NHẬP HÀNG MỚI", color: "green" };
    if (isEditMode) return { text: "SỬA PHIẾU NHẬP HÀNG", color: "orange" };
    return { text: "CHI TIẾT PHIẾU NHẬP HÀNG", color: "blue" };
  };
  const badge = getBadge();

  const footerActions = [];
  if (isEditMode || !stt_rec) {
    footerActions.push(
      { key: "save", label: "Lưu phiếu", icon: <SaveOutlined />, type: "primary", onClick: handleSubmit, loading: loading, className: "btn-save-fixed" },
    );
    if (!stt_rec) {
      footerActions.push({ key: "kethua", label: "Kế thừa", icon: <LinkOutlined />, onClick: () => setKeThuaModalOpen(true), disabled: !maKhach, className: "btn-print-fixed" });
    }
    if (stt_rec) {
      footerActions.push({ key: "delete", label: "Xoá phiếu", icon: <DeleteOutlined />, danger: true, onClick: handleDelete, className: "btn-delete-fixed" });
    }
  }

  return (
    <div className="detail-phieu-nhap-hang">
      <FormTemplate
        form={form}
        onFinish={handleSubmit}
        onBack={() => navigate("/kho/nhap-hang")}
        badgeText={badge.text}
        badgeColor={badge.color}
        metaDate={form.getFieldValue('ngay') ? dayjs(form.getFieldValue('ngay')).format('DD/MM/YYYY') : '.........'}
        statusValue={statusValue}
        statusOptions={TRANG_THAI_OPTIONS}
        showStatusSelect={true}
        
        headerRightSpan={
          !isEditMode && stt_rec ? (
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={handleEdit}
              className="phieu-edit-button-kd"
              title="Chỉnh sửa"
              disabled={statusValue !== "0"}
            />
          ) : null
        }
        fixedFooterActions={footerActions}
      >

        <Form
          form={form}
          layout="vertical"
          disabled={!isEditMode && !!stt_rec}
          size="middle"
          colon={false}
        >
          <div className="detail-phieu-nhap-hang__body">
            <div className="phieu-form-section phieu-form--floating" style={{ paddingBottom: 0, marginBottom: 24, padding: "24px 28px" }}>
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
              VatTuSelectComponent={VatTuSelectFullPOS}
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

                      {/* Tiện ích điền kho hàng loạt */}
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

export default DetailPhieuNhapHang;

