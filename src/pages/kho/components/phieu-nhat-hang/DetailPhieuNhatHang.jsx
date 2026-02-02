import {
  DownOutlined,
  EditOutlined,
  LeftOutlined,
  UpOutlined,
} from "@ant-design/icons";
import { Button, Form, Space, Typography, message } from "antd";
import dayjs from "dayjs";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { getLoItem, getViTriByKho } from "../../../../api";
import showConfirm from "../../../../components/common/Modal/ModalConfirm";
import VatTuSelectFullPOS from "../../../../components/common/ProductSelectFull/VatTuSelectFullPOS";
import QRScanner from "../../../../components/common/QRScanner/QRScanner";
import notificationManager from "../../../../utils/notificationManager";
import "../common-phieu.css";
import PhieuNhatHangFormInputs from "./components/PhieuNhatHangFormInputs";
import VatTuNhatHangTable from "./components/VatTuNhatHangTable";
import { usePhieuNhatHangData } from "./hooks/usePhieuNhatHangData";
import { useVatTuManagerNhatHang } from "./hooks/useVatTuManagerNhatHang";
import {
  fetchPhieuNhatHangData,
  startPhieuNhatHang,
  updatePhieuNhatHang,
} from "./utils/phieuNhatHangApi";
import {
  buildPhieuNhatHangPayload,
  deletePhieuNhatHangDynamic,
  validateDataSource,
  validateDuplicateMaLo,
  validateTongNhat,
  validateCompletionRules,
  computeGroupState,
} from "./utils/phieuNhatHangUtils";

const { Title } = Typography;

const DetailPhieuNhatHang = ({ isEditMode: initialEditMode = false }) => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [phieuData, setPhieuData] = useState(null);
  const [isEditMode, setIsEditMode] = useState(initialEditMode);
  const [vatTuInput, setVatTuInput] = useState(undefined);
  const [barcodeEnabled, setBarcodeEnabled] = useState(false);
  const [barcodeJustEnabled, setBarcodeJustEnabled] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [apiCalled, setApiCalled] = useState(false);
  const [pageIndex, setPageIndex] = useState(1);
  const [totalPage, setTotalPage] = useState(1);
  const [currentKeyword, setCurrentKeyword] = useState("");
  const [phieuDetailLoaded, setPhieuDetailLoaded] = useState(false);
  const [showFormFields, setShowFormFields] = useState(true);

  const vatTuSelectRef = useRef();
  const searchTimeoutRef = useRef();
  const qrProcessingRef = useRef(false);
  const sctRec = location.state?.sctRec || id;
  const returnUrl = location.state?.returnUrl || "/kho/nhat-hang";
  const token = localStorage.getItem("access_token");

  // Get user info from Redux instead of localStorage
  const userInfo = useSelector((state) => state?.claimsReducer?.userInfo || {});

  // Custom hooks
  const {
    maGiaoDichList,
    maKhoList,
    loadingMaKho,
    maKhachList,
    loadingMaKhach,
    vatTuList,
    loadingVatTu,
    fcode3List,
    loadingFcode3,
    fetchMaKhoListDebounced,
    fetchMaKhachListDebounced,
    fetchFcode3ListDebounced,
    fetchMaGiaoDichList,
    fetchMaKhoList,
    fetchMaKhachList,
    fetchFcode3List,
    fetchVatTuList,
    fetchVatTuDetail,
    fetchDonViTinh,
    setVatTuList,
    setFcode3List,
  } = usePhieuNhatHangData();

  const {
    dataSource,
    setDataSource,
    handleVatTuSelect: vatTuSelectHandler,
    handleQuantityChange,
    handleSelectChange,
    handleDeleteItem,
    handleAddItem,
    handleDvtChange,
  } = useVatTuManagerNhatHang();

  // Có trùng (mã vật tư + mã lô) => disable nút Lưu và Hoàn thành
  const hasDuplicateMaLo = useMemo(
    () => !validateDuplicateMaLo(dataSource).isValid,
    [dataSource]
  );

  // Phân trang vật tư - sử dụng API giống POS
  const fetchVatTuListPaging = useCallback(
    async (keyword = "", page = 1, append = false) => {
      setCurrentKeyword(keyword);

      // Gọi hàm trong hook để quản lý loading + transform thống nhất
      await fetchVatTuList(keyword, page, append, (pagination) => {
        setPageIndex(page);
        setTotalPage(pagination?.totalPage || 1);
      });
    },
    [fetchVatTuList]
  );

  // Set edit mode based on URL (or prop)
  useEffect(() => {
    const isEditPath = location.pathname.includes("/edit/");
    setIsEditMode(initialEditMode || isEditPath);
  }, [location.pathname, initialEditMode]);

  // Load phieu details
  useEffect(() => {
    const fetchPhieuDetail = async () => {
      if (apiCalled || !sctRec || phieuDetailLoaded) return;

      setLoading(true);
      setApiCalled(true);
      setPhieuDetailLoaded(true);

      try {
        const result = await fetchPhieuNhatHangData(sctRec);

        if (result.success) {
          const phieuInfo = result.master;
          const vatTuList = result.detail;

          if (phieuInfo) {
            let statusValue = phieuInfo.status;
            if (statusValue === "*" || statusValue === null) {
              statusValue = "0";
            }

            const isEmptyDate = (v) => {
              if (v === null || v === undefined) return true;
              const s = String(v).trim();
              if (!s || s.toLowerCase() === "null" || s === "*") return true;
              // common sentinel dates
              if (s.startsWith("1900") || s.startsWith("0001")) return true;
              return !dayjs(s).isValid();
            };

            const formattedData = {
              stt_rec: id,
              sttRec: phieuInfo.stt_rec,
              ngay: phieuInfo.ngay_lct || phieuInfo.ngay_ct ? dayjs(phieuInfo.ngay_lct || phieuInfo.ngay_ct) : dayjs(),
              soPhieu: phieuInfo.so_ct || "",
              maKhach: phieuInfo.ma_kh || "",
              tenKhach: phieuInfo.ten_kh || "",
              dienGiai: phieuInfo.ghi_chu || "",
              maGiaoDich: phieuInfo.ma_gd || "",
              soDonHang: (phieuInfo.so_don_hang || "").trim(),
              vung: phieuInfo.ma_nhomvitri || "",
              nhanVien: phieuInfo.ma_nvbh || "",
              banDongGoi: phieuInfo.ban_dong_goi || "",
              trangThai: statusValue,
              statusname: phieuInfo.statusname || "",
              donViTienTe: "VND",
              tyGia: 1,
              // Map fcode3 and ten_vc for display
              loaiVanChuyen: phieuInfo.fcode3 || "",
              tenVc: phieuInfo.ten_vc || "",
              soPhieuXuatBan:
                phieuInfo.so_phieu_xuat1 || phieuInfo.so_phieu_xuat2 || "",
              // Map bat_dau_nhat_hang and nhat_hang_xong
              batDauNhatHang: isEmptyDate(phieuInfo.bat_dau_nhat_hang)
                ? ""
                : dayjs(phieuInfo.bat_dau_nhat_hang).format("DD/MM/YYYY HH:mm"),
              ketThucNhatHang: isEmptyDate(phieuInfo.nhat_hang_xong)
                ? ""
                : dayjs(phieuInfo.nhat_hang_xong).format("DD/MM/YYYY HH:mm"),
            };

            // Process vật tư list - DYNAMIC: Giữ nguyên TẤT CẢ trường từ API
            const processedVatTu = vatTuList.map((item, index) => {
              const soLuongNhat = item.nhat ?? 0; // số lượng nhặt thực tế
              const soLuongDon = parseFloat(item.so_luong) || 0; // số lượng theo đơn
              const dvtHienTai = item.dvt ? item.dvt.trim() : "cái";
              
              // Ban đầu tong_nhat = 0 (không tự động điền bằng số lượng đơn nữa)
              const tongNhatHienTai = parseFloat(item.tong_nhat) || 0;
              const tongNhat = tongNhatHienTai; // Giữ nguyên giá trị từ API, không tự động điền

              return {
                // Giữ nguyên TẤT CẢ trường từ API response
                ...item,

                // Override với UI-friendly fields
                key: index + 1,
                maHang: item.ma_vt || "",
                soLuong:
                  Math.round((parseFloat(soLuongNhat) || 0) * 1000) / 1000, // nhặt
                soLuongDeNghi: soLuongDon, // số lượng đơn
                ten_mat_hang: item.ten_vt || item.ma_vt || "",
                dvt: dvtHienTai,
                ma_kho: item.ma_kho || "",
                tk_vt: item.tk_vt || "",
                line_nbr: item.line_nbr || index + 1,
                // Add missing fields for table display
                ma_lo: item.ma_lo || "",
                ma_vi_tri: item.ma_vi_tri || "",
                nhat: item.nhat || false,
                so_luong_ton: item.so_luong_ton || 0,
                tong_nhat: Math.round(tongNhat * 1000) / 1000, // Giữ nguyên giá trị từ API
                ghi_chu: item.ghi_chu || "",
              };
            });

            // Lưu chỉ data gốc từ API để sử dụng khi build payload (không merge với UI data)
            setPhieuData(phieuInfo);
            
            
            form.setFieldsValue(formattedData);
            setDataSource(processedVatTu);
          }
        } else {
          message.error("Không thể tải dữ liệu phiếu");
          setApiCalled(false);
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
  }, [sctRec, apiCalled, token, id, phieuDetailLoaded]);

  // Wrapper function to match VatTuSelectFullPOS expected signature (same as POS)
  const fetchVatTuListWrapper = useCallback(
    async (keyword = "", page = 1, append = false) => {
      return fetchVatTuListPaging(keyword, page, append);
    },
    [fetchVatTuListPaging]
  );

  // Load initial search data when component mounts
  useEffect(() => {
    if (isEditMode) {
      fetchVatTuListPaging("", 1, false);
    }
  }, [isEditMode]);

  // === API: fetch lists for Mã lô / Vị trí (edit page) ===
  const fetchLoList = async (keyword = "", record = {}, page = 1) => {
    try {
      const response = await getLoItem({
        ma_vt: (record?.maHang || record?.ma_vt || "").toString(),
        ma_lo: "",
        ten_lo: keyword,
        ngay_hhsd_tu: null,
        ngay_hhsd_den: null,
        pageIndex: page,
        pageSize: 10,
      });

      const data = response?.listObject?.[0] || [];
      const options = data.map((x) => {
        const value = (x?.ma_lo || x?.value || x?.ten_lo || "").toString();
        // Format label: ma_lo-ngay_hhsd nếu có ngay_hhsd
        let label = value;
        if (x?.ngay_hhsd) {
          const ngayHHSD = dayjs(x.ngay_hhsd).format("DD/MM/YYYY");
          label = `${value}-${ngayHHSD}`;
        } else {
          label = x?.ma_lo || x?.ten_lo || x?.label || value;
        }
        return { value, label };
      });
      return options;
    } catch (e) {
      console.error("fetchLoList (detail) error", e);
      return [];
    }
  };

  const fetchViTriList = async (keyword = "", record = {}, page = 1) => {
    try {
      const response = await getViTriByKho({
        ma_kho: (record?.ma_kho || "ST").toString(),
        ten_vi_tri: keyword,
        pageIndex: page,
        pageSize: 10,
      });

      const data = response?.listObject?.[0] || [];
      const options = data.map((x) => {
        const value = (
          x?.ma_vi_tri ||
          x?.value ||
          x?.ten_vi_tri ||
          ""
        ).toString();
        const label = x?.ma_vi_tri || x?.ten_vi_tri || x?.label || value;
        return { value, label };
      });
      return options;
    } catch (e) {
      console.error("fetchViTriList (detail) error", e);
      return [];
    }
  };

  // Handle barcode focus
  useEffect(() => {
    if (barcodeJustEnabled && vatTuSelectRef.current) {
      vatTuSelectRef.current.focus();
      setBarcodeJustEnabled(false);
    }
  }, [barcodeJustEnabled]);

  // Prevent focus from moving to other inputs when in barcode mode
  useEffect(() => {
    if (barcodeEnabled) {
      const handleFocusIn = (e) => {
        // If focus moves to any input other than barcode input, move it back
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

  // Cleanup
  useEffect(() => {
    const timeoutRef = searchTimeoutRef.current;
    return () => {
      if (timeoutRef) {
        clearTimeout(timeoutRef);
      }
    };
  }, []);

  const handleVatTuSelect = async (value, maLo = "") => {
    await vatTuSelectHandler(
      value,
      isEditMode,
      fetchVatTuDetail,
      fetchDonViTinh,
      setVatTuInput,
      setVatTuList,
      fetchVatTuList,
      vatTuSelectRef,
      maLo
    );
    
    // Sau khi thêm vật tư, tự động lấy danh sách mã lô để hiển thị lựa chọn
    if (isEditMode && value) {
      // Sử dụng setTimeout để đảm bảo dataSource đã được cập nhật từ vatTuSelectHandler
      setTimeout(async () => {
        // Lấy dataSource mới nhất
        setDataSource((prevDataSource) => {
          // Tìm record vừa được thêm vào
          const newRecord = prevDataSource.find(
            (item) => item.maHang && item.maHang.trim() === value.trim()
          );
          if (newRecord) {
            // Tự động query mã lô để lấy options, không tự động điền giá trị
            fetchLoList("", newRecord, 1)
              .then((loOptions) => {
                if (!loOptions || loOptions.length === 0) {
                  return;
                }

                // Luôn chỉ lưu options để hiển thị trong dropdown
                setDataSource((currentDataSource) =>
                  currentDataSource.map((item) =>
                    item.key === newRecord.key
                      ? { ...item, loOptions: loOptions }
                      : item
                  )
                );
              })
              .catch((error) => {
                console.error("Error loading lot options:", error);
              });
          }

          return prevDataSource;
        });
      }, 200); // Tăng delay để đảm bảo state đã cập nhật
    }
  };

  const handleQRScanSuccess = async (scannedCode) => {
    // Chống spam: Kiểm tra nếu đang xử lý
    if (qrProcessingRef.current) {
      return;
    }

    const trimmedCode = scannedCode.trim();
    
    // QR code có thể chứa mã vt + mã lô
    // Thử các định dạng: "mã_vt|mã_lô", "mã_vt,mã_lô", "mã_vt+mã_lô", "mã_vt#mã_lô", hoặc chỉ có mã_vt
    let maVt = trimmedCode;
    let maLo = "";
    
    // Thử tách bằng |
    if (trimmedCode.includes("|")) {
      const parts = trimmedCode.split("|");
      maVt = parts[0]?.trim() || "";
      maLo = parts[1]?.trim() || "";
    }
    // Thử tách bằng ,
    else if (trimmedCode.includes(",")) {
      const parts = trimmedCode.split(",");
      maVt = parts[0]?.trim() || "";
      maLo = parts[1]?.trim() || "";
    }
    // Thử tách bằng +
    else if (trimmedCode.includes("+")) {
      const parts = trimmedCode.split("+");
      maVt = parts[0]?.trim() || "";
      maLo = parts[1]?.trim() || "";
    }
    // Thử tách bằng # (dấu hash) - định dạng chính
    else if (trimmedCode.includes("#")) {
      const parts = trimmedCode.split("#");
      maVt = parts[0]?.trim() || "";
      maLo = parts[1]?.trim() || "";
    }
    
    if (!maVt) {
      message.error("Không thể đọc mã vật tư từ QR code");
      return;
    }

    // Kiểm tra xem vật tư có trong bảng chưa
    const existingItem = dataSource.find(
      (item) => item.maHang && item.maHang.trim() === maVt.trim()
    );

    if (!existingItem) {
      message.warning(`Vật tư ${maVt} chưa có trong bảng.`);
      return;
    }

    // Đánh dấu đang xử lý
    qrProcessingRef.current = true;

    try {
      // Luôn sử dụng handleVatTuSelect để thêm/tăng số lượng vật tư
      // Nó sẽ tự động kiểm tra và xử lý (thêm mới hoặc tăng số lượng)
      // notificationManager trong handleVatTuSelect sẽ đảm bảo message chỉ hiển thị 1 lần
      if (isEditMode) {
        // Chỉ gọi handleVatTuSelect 1 lần duy nhất, truyền thêm mã lô nếu có
        await handleVatTuSelect(maVt, maLo);
      } else {
        message.warning("Bạn cần bật chế độ chỉnh sửa để thêm vật tư");
      }
    } catch (error) {
      console.error("Lỗi khi xử lý mã quét:", error);
      message.error("Có lỗi xảy ra khi xử lý mã quét");
    } finally {
      // Reset processing flag sau 3 giây để cho phép quét mã mới
      setTimeout(() => {
        qrProcessingRef.current = false;
      }, 3000);
    }
  };

  const handleSwitchToBarcodeMode = () => {
    setShowQRScanner(false);
    setBarcodeEnabled(true);
    setBarcodeJustEnabled(true);
  };

  const handleEdit = async () => {
    // Không cho chỉnh sửa nếu phiếu đã hoàn thành (status = "2")
    const currentStatus = form.getFieldValue("trangThai") || phieuData?.status;
    if (currentStatus === "2" || currentStatus === 2) {
      message.warning("Phiếu nhặt hàng đã hoàn thành");
      return;
    }
    try {
      // Kiểm tra lại status trước khi gọi API để tránh gọi API khi đã hoàn thành
      const statusCheck = form.getFieldValue("trangThai") || phieuData?.status;
      if (statusCheck === "2" || statusCheck === 2) {
        message.warning("Phiếu nhặt hàng đã hoàn thành");
        return;
      }

      // Kiểm tra nếu ma_nvbh = Name từ token thì không gọi API nữa
      const maNvbh = phieuData?.ma_nvbh || "";
      const userNameFromToken = userInfo?.userName || "";
      
      if (maNvbh && userNameFromToken && maNvbh.trim() === userNameFromToken.trim()) {
        // Nhân viên đã được gán và là chính người dùng hiện tại, không cần gọi API
        // Chuyển thẳng sang edit mode
        navigate(`/kho/nhat-hang/chi-tiet/${id}`);
        setIsEditMode(true);
        return;
      }

      setLoading(true);

      // Gọi API bắt đầu nhặt hàng khi ấn chỉnh sửa
      const startResult = await startPhieuNhatHang(sctRec, userInfo.id);

      if (!startResult.success) {
        // API đã tự hiển thị message từ response, không cần hiển thị thêm
        setLoading(false);
        return;
      }

      // Reload phieu details to get updated employee info
      const result = await fetchPhieuNhatHangData(sctRec);

      if (result.success && result.master) {
        setPhieuData(result.master);

        // Update form with new data
        const updatedFormattedData = {
          stt_rec: id,
          sttRec: result.master.stt_rec,
          ngay: result.master.ngay_ct
            ? dayjs(result.master.ngay_ct)
            : dayjs(),
          soPhieu: result.master.so_ct || "",
          maKhach: result.master.ma_kh || "",
          dienGiai: result.master.ghi_chu || "",
          maGiaoDich: result.master.ma_gd || "",
          soDonHang: (result.master.so_don_hang || "").trim(),
          vung: result.master.ma_nhomvitri || "",
          nhanVien: result.master.ma_nvbh || "",
          banDongGoi: result.master.ban_dong_goi || "",
          trangThai: result.master.status || "0",
          statusname: result.master.statusname || "",
          donViTienTe: "VND",
          tyGia: 1,
          loaiVanChuyen: result.master.fcode3 || "",
          tenVc: result.master.ten_vc || "",
          tenKhach: result.master.ten_kh || "",
          soPhieuXuatBan:
            result.master.so_phieu_xuat1 ||
            result.master.so_phieu_xuat2 ||
            "",
          // Map bat_dau_nhat_hang and nhat_hang_xong
          batDauNhatHang: result.master.bat_dau_nhat_hang
            ? dayjs(result.master.bat_dau_nhat_hang).format("DD/MM/YYYY HH:mm")
            : "",
          ketThucNhatHang: result.master.nhat_hang_xong
            ? dayjs(result.master.nhat_hang_xong).format("DD/MM/YYYY HH:mm")
            : "",
        };

        form.setFieldsValue(updatedFormattedData);
        message.success("Đã bắt đầu nhặt hàng thành công");
      }

      setLoading(false);

      // Switch to edit mode
      navigate(`/kho/nhat-hang/chi-tiet/${id}`);
      setIsEditMode(true);
    } catch (error) {
      console.error("Error in handleEdit:", error);
      message.error("Có lỗi xảy ra khi bắt đầu chỉnh sửa");
      setLoading(false);
    }
  };

  const handleNew = () => {
    navigate("/kho/nhat-hang/them-moi");
  };

  const handleDelete = async () => {
    showConfirm({
      title: "Xác nhận xóa phiếu nhặt hàng",
      content: "Bạn có chắc chắn muốn xóa phiếu nhặt hàng này không?",
      type: "warning",
      onOk: async () => {
        setLoading(true);
        const result = await deletePhieuNhatHangDynamic(sctRec, userInfo);
        setLoading(false);

        if (result.success) {
          navigate(returnUrl);
        }
      },
    });
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();

      // Validate data source — chặn Lưu nếu không hợp lệ
      const validation = validateDataSource(dataSource);
      if (!validation.isValid) {
        setLoading(false);
        return;
      }

      // Validate tổng nhặt không được vượt quá số lượng đơn — chặn Lưu
      const tongNhatValidation = validateTongNhat(dataSource);
      if (!tongNhatValidation.isValid) {
        message.error("Tổng nhặt không được vượt quá số lượng đơn. Vui lòng kiểm tra lại.");
        setLoading(false);
        return;
      }

      // Validate không trùng (mã vật tư + mã lô) — chặn Lưu; đánh dấu đỏ và clear mã lô các dòng trùng
      const duplicateMaLoCheck = validateDuplicateMaLo(dataSource);
      if (!duplicateMaLoCheck.isValid) {
        const duplicatePairs = new Set(
          (duplicateMaLoCheck.details || []).map((d) => `${d.ma_vt}\u0001${d.ma_lo}`)
        );
        setDataSource((prev) =>
          prev.map((row) => {
            const maVt = String(row.ma_vt ?? row.maHang ?? "").trim();
            const maLo = String(row.ma_lo ?? "").trim();
            const key = `${maVt}\u0001${maLo}`;
            if (duplicatePairs.has(key)) {
              return {
                ...row,
                _invalid_duplicate_ma_lo: true,
                ma_lo: "",
                _ma_lo_clear_version: (row._ma_lo_clear_version || 0) + 1,
              };
            }
            return { ...row, _invalid_duplicate_ma_lo: false };
          })
        );
        message.error(
          "Trùng mã vật tư và mã lô. Đã xóa mã lô trùng. Vui lòng chọn lại mã lô."
        );
        setLoading(false);
        return;
      }

      // Set status = 1 cho nút Lưu
      const updatedValues = {
        ...values,
        trangThai: "1",
        // Trim khoảng trắng đầu cuối cho số đơn hàng
        soDonHang: values.soDonHang ? values.soDonHang.trim() : "",
      };

      // Build payload với status = 1
      const payload = buildPhieuNhatHangPayload(
        updatedValues,
        dataSource,
        phieuData,
        true,
        userInfo
      );

      if (!payload) {
        message.error("Không thể tạo payload");
        setLoading(false);
        return;
      }

      // Rào chặn cuối: không gửi API nếu vẫn trùng (ma_vt + ma_lo)
      const finalDuplicateCheck = validateDuplicateMaLo(dataSource);
      if (!finalDuplicateCheck.isValid) {
        message.error(
          "Trùng mã vật tư và mã lô. Không được phép lưu."
        );
        setLoading(false);
        return;
      }

      // Gọi API cập nhật với stored procedure
      const wrappedPayload = {
        Data: payload,
      };

      const result = await updatePhieuNhatHang(wrappedPayload, userInfo);

      if (result.success) {
        // Giữ nguyên màn hình chỉnh sửa, không navigate về trang chủ
        setLoading(false);
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error("Submit failed:", error);
      message.error("Có lỗi xảy ra khi cập nhật phiếu");
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    // Hiển thị pop-up xác nhận trước khi thực hiện hoàn thành
    showConfirm({
      title: "Xác nhận hoàn thành",
      content: "Bạn có chắc chắn muốn hoàn thành phiếu nhặt hàng này không?",
      type: "info",
      onOk: async () => {
        try {
          setLoading(true);
          const values = await form.validateFields();

          // Validate data source — chặn Hoàn thành nếu không hợp lệ
          const validation = validateDataSource(dataSource);
          if (!validation.isValid) {
            setLoading(false);
            return;
          }

          // Validate tổng nhặt không được vượt quá số lượng đơn — chặn Hoàn thành
          const tongNhatValidation = validateTongNhat(dataSource);
          if (!tongNhatValidation.isValid) {
            message.error("Tổng nhặt không được vượt quá số lượng đơn. Vui lòng kiểm tra lại.");
            setLoading(false);
            return;
          }

          // Validate không trùng (mã vật tư + mã lô) — chặn Hoàn thành; đánh dấu đỏ và clear mã lô các dòng trùng
          const duplicateMaLoCheck = validateDuplicateMaLo(dataSource);
          if (!duplicateMaLoCheck.isValid) {
            const duplicatePairs = new Set(
              (duplicateMaLoCheck.details || []).map((d) => `${d.ma_vt}\u0001${d.ma_lo}`)
            );
            setDataSource((prev) =>
              prev.map((row) => {
                const maVt = String(row.ma_vt ?? row.maHang ?? "").trim();
                const maLo = String(row.ma_lo ?? "").trim();
                const key = `${maVt}\u0001${maLo}`;
                if (duplicatePairs.has(key)) {
                  return {
                    ...row,
                    _invalid_duplicate_ma_lo: true,
                    ma_lo: "",
                    _ma_lo_clear_version: (row._ma_lo_clear_version || 0) + 1,
                  };
                }
                return { ...row, _invalid_duplicate_ma_lo: false };
              })
            );
            message.error(
              "Trùng mã vật tư và mã lô. Đã xóa mã lô trùng. Vui lòng chọn lại mã lô."
            );
            setLoading(false);
            return;
          }

          // Validate điều kiện hoàn thành: có mã lô cho dòng đã nhập tổng nhặt và tổng nhặt = tổng đơn
          // Reset previous invalid flags
          setDataSource((prev) => prev.map((r) => ({ ...r, _invalid_missing_lot: false, _invalid_sum_mismatch: false })));

          const completionCheck = validateCompletionRules(dataSource);
          if (!completionCheck.isValid) {
            // Highlight invalid rows in table instead of long message
            setDataSource((prev) => {
              let updated = prev.map((r) => ({ ...r, _invalid_missing_lot: false, _invalid_sum_mismatch: false }));

              if (completionCheck.type === "missingLot") {
                updated = updated.map((row) => {
                  const picked = parseFloat(row.tong_nhat || 0) || 0;
                  const lot = (row.ma_lo || "").toString().trim();
                  return picked > 0 && !lot ? { ...row, _invalid_missing_lot: true } : row;
                });
              }

              if (completionCheck.type === "sumNotEqual") {
                const groups = computeGroupState(prev);
                const mismatchKeys = new Set();
                for (const [, g] of groups) {
                  const isMismatch = (parseFloat(g.pickedSum) || 0) !== (parseFloat(g.orderQty) || 0);
                  if (isMismatch) {
                    g.members.forEach((m) => mismatchKeys.add(m.key));
                  }
                }
                updated = updated.map((row) =>
                  mismatchKeys.has(row.key) ? { ...row, _invalid_sum_mismatch: true } : row
                );
              }

              return updated;
            });

            message.error("Có dòng chưa hợp lệ. Vui lòng kiểm tra các dòng màu đỏ.");
            setLoading(false);
            return;
          }

          // Set status = 2 cho nút Hoàn thành
          const updatedValues = {
            ...values,
            trangThai: "2",
            // Trim khoảng trắng đầu cuối cho số đơn hàng
            soDonHang: values.soDonHang ? values.soDonHang.trim() : "",
          };

          // Build payload với status = 2
          const payload = buildPhieuNhatHangPayload(
            updatedValues,
            dataSource,
            phieuData,
            true,
            userInfo
          );

          if (!payload) {
            message.error("Không thể tạo payload");
            setLoading(false);
            return;
          }

          // Rào chặn cuối: không gửi API nếu vẫn trùng (ma_vt + ma_lo)
          const finalDuplicateCheck = validateDuplicateMaLo(dataSource);
          if (!finalDuplicateCheck.isValid) {
            message.error(
              "Trùng mã vật tư và mã lô. Không được phép hoàn thành."
            );
            setLoading(false);
            return;
          }

          // Gọi API cập nhật với stored procedure
          const wrappedPayload = {
            Data: payload,
          };

          const result = await updatePhieuNhatHang(wrappedPayload, userInfo, { showSuccess: false });

          if (result.success) {
            message.success(
              "Đã hoàn thành phiếu nhặt hàng, đang chuyển về trang chính..."
            );

            // Delay một chút để user thấy message trước khi navigate
            setTimeout(() => {
              navigate(returnUrl);
            }, 1000);
          } else {
            setLoading(false);
          }
        } catch (error) {
          console.error("Complete failed:", error);
          message.error("Có lỗi xảy ra khi hoàn thành phiếu");
          setLoading(false);
        }
      },
    });
  };

  return (
    <div className="phieu-container">
      <div className="phieu-header">
        <Button
          type="text"
          icon={<LeftOutlined />}
          onClick={() => navigate(returnUrl)}
          className="phieu-back-button"
        >
          Trở về
        </Button>
        <Title level={5} className="phieu-title">
          {isEditMode
            ? "CHỈNH SỬA PHIẾU NHẶT HÀNG"
            : "CHI TIẾT PHIẾU NHẶT HÀNG"}
        </Title>
        {!isEditMode ? (
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={handleEdit}
            className="phieu-edit-button"
            disabled={(form.getFieldValue("trangThai") || phieuData?.status) === "2"}
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
          {/* Thanh tìm kiếm/ chọn vật tư đặt ngay trên bảng */}
          <div style={{ marginTop: 8, marginBottom: 8 }}>
            <div
              style={{
                marginBottom: 8,
                fontWeight: "bold",
                fontSize: "14px",
                color: "#333",
              }}
            >
              Vật tư
            </div>
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
              fetchVatTuList={fetchVatTuListWrapper}
              handleVatTuSelect={handleVatTuSelect}
              totalPage={totalPage}
              pageIndex={pageIndex}
              setPageIndex={setPageIndex}
              setVatTuList={setVatTuList}
              currentKeyword={currentKeyword}
              onOpenQRScanner={() => setShowQRScanner(true)}
              disableSearch={true}
            />
          </div>

          <VatTuNhatHangTable
            dataSource={dataSource}
            isEditMode={isEditMode}
            handleQuantityChange={handleQuantityChange}
            handleSelectChange={handleSelectChange}
            handleDeleteItem={handleDeleteItem}
            handleAddItem={handleAddItem}
            handleDvtChange={handleDvtChange}
            maKhoList={maKhoList}
            loadingMaKho={loadingMaKho}
            fetchMaKhoListDebounced={fetchMaKhoListDebounced}
            fetchMaKhoList={fetchMaKhoList}
            fetchDonViTinh={fetchDonViTinh}
            onDataSourceUpdate={setDataSource}
            fetchLoList={fetchLoList}
            fetchViTriList={fetchViTriList}
          />

          {isEditMode && (
            <div
              style={{
                display: "flex",
                justifyContent: "flex-start",
                marginTop: 16,
              }}
            >
              <Space>
                <Button
                  type="primary"
                  onClick={handleSubmit}
                  loading={loading}
                  disabled={hasDuplicateMaLo}
                  title={hasDuplicateMaLo ? "Trùng mã vật tư và mã lô. Vui lòng kiểm tra lại." : undefined}
                >
                  Lưu
                </Button>
                <Button
                  type="primary"
                  onClick={handleComplete}
                  loading={loading}
                  disabled={hasDuplicateMaLo}
                  title={hasDuplicateMaLo ? "Trùng mã vật tư và mã lô. Vui lòng kiểm tra lại." : undefined}
                  style={{ backgroundColor: "#52c41a", borderColor: "#52c41a" }}
                >
                  Hoàn thành
                </Button>
              </Space>
            </div>
          )}
        </Form>

        {/* Divider to separate table and form area */}
        <div
          style={{
            borderTop: "1px solid rgba(255,255,255,0.12)",
            margin: "8px 0 12px 0",
          }}
        />

        {/* Toggle hiển/ẩn thông tin phiếu - 移到Form外面，不受disabled影响 */}
        <div style={{ marginBottom: 8 }}>
          <Button
            size="small"
            type="text"
            icon={showFormFields ? <UpOutlined /> : <DownOutlined />}
            onClick={() => setShowFormFields(!showFormFields)}
            style={{
              color: "#1890ff",
              fontWeight: "bold",
              fontSize: "12px",
              padding: "4px 8px",
              height: "auto",
            }}
          >
            {showFormFields ? "Ẩn thông tin đơn" : "Hiện thông tin đơn"}
          </Button>
        </div>

        {showFormFields && (
          <Form
            form={form}
            layout="vertical"
            className="phieu-form"
            disabled={!isEditMode}
          >
            <PhieuNhatHangFormInputs
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
          </Form>
        )}
      </div>

      {/* QR Scanner Modal */}
      <QRScanner
        isOpen={showQRScanner}
        onClose={() => setShowQRScanner(false)}
        onScanSuccess={handleQRScanSuccess}
        onSwitchToBarcode={handleSwitchToBarcodeMode}
        openWithCamera={true}
      />
    </div>
  );
};

export default DetailPhieuNhatHang;
