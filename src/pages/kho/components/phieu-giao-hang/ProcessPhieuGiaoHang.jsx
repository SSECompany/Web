import {
  LeftOutlined,
  UserOutlined,
  EnvironmentOutlined,
  CarOutlined,
  FileTextOutlined,
  GiftOutlined,
  PhoneOutlined,
  CalendarOutlined,
  CameraOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  CloseOutlined,
  ExportOutlined,
  SendOutlined,
  TruckOutlined,
  HistoryOutlined,
  PictureOutlined,
  EditOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Checkbox,
  Modal,
  Input,
  Upload,
  message,
  Tag,
  Timeline,
  Spin,
  Select,
  InputNumber,
  Image,
} from "antd";
import dayjs from "dayjs";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import "./ProcessPhieuGiaoHang.css";
import { runWithConcurrencyLimit } from "../../../../utils/runWithConcurrencyLimit";
import { 
  fetchPhieuGiaoHangData, 
  fetchPhieuGiaoHangDataByQR,
  fetchPhieuGiaoHangDataByView,
  fetchVehicleList,
  updateDeliveryStatus,
  uploadDeliveryImage,
  deleteDeliveryImage 
} from "./utils/phieuGiaoHangApi";

const { TextArea } = Input;

const ProcessPhieuGiaoHang = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();

  const userInfo = useSelector((state) => state?.claimsReducer?.userInfo || {});
  const returnUrl = location.state?.returnUrl || "/kho/giao-hang";
  const fromQR = location.state?.fromQR || false;
  const voucherDateStr = location.state?.voucherDateStr || null;

  const [loading, setLoading] = useState(false);
  const [phieuData, setPhieuData] = useState(null);
  const [detailData, setDetailData] = useState([]);
  const [statusLog, setStatusLog] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState(null);
  
  // Upload images cho 2 mốc
  const [images, setImages] = useState({
    banGiao: [],
    hoanThanh: [],
  });
  
  // Danh sách ảnh đã xóa (chưa gọi API) - lưu fileId hoặc URL
  const [deletedImages, setDeletedImages] = useState([]);
  
  // Preview ảnh
  const [previewImage, setPreviewImage] = useState({
    visible: false,
    url: "",
    title: "",
  });

  // Modal states
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmNote, setConfirmNote] = useState("");
  const [confirmCost, setConfirmCost] = useState(0);
  const [confirmVehicle, setConfirmVehicle] = useState("");
  const [vehicleList, setVehicleList] = useState([]);
  const [loadingVehicle, setLoadingVehicle] = useState(false);
  const [confirmModalImages, setConfirmModalImages] = useState([]);
  const [confirmLoading, setConfirmLoading] = useState(false); // Chặn spam bấm nút xác nhận
  const [confirmAdvanceMoney, setConfirmAdvanceMoney] = useState(false);
  
  const [transportInfo, setTransportInfo] = useState({
    ten_nha_xe: "",
    sdt_nha_xe: "",
    gio_chay: "",
  });
  // Fetch data - opts.preserveStatus: giá trị status cần giữ khi refresh (vd. sau cập nhật TT vận chuyển)
  const fetchData = useCallback(async (opts = {}) => {
    if (!id) return;

    const savedStatus = opts.preserveStatus ?? null;

    setLoading(true);
    try {
      let result;
      
      // Phân biệt API call dựa trên fromQR flag
      if (fromQR) {
        // Quét QR: dùng /Delivery/:voucherId
        result = await fetchPhieuGiaoHangDataByQR(id);
      } else if (voucherDateStr) {
        // Xem trực tiếp: dùng /Delivery/:voucherDateStr/:voucherId
        result = await fetchPhieuGiaoHangDataByView(voucherDateStr, id);
      } else {
        // Fallback: thử QR API trước
        result = await fetchPhieuGiaoHangDataByQR(id);
      }
      
      if (result.success) {
        // Kiểm tra status = 0 → không cho phép truy cập xử lý giao hàng
        const status = result.master?.status;
        if (status != null && String(status) === "0") {
          message.error("Phiếu giao hàng chưa lưu kho");
          setTimeout(() => navigate("/kho/giao-hang"), 1500);
          return;
        }
        const master = result.master;
        const statusToUse = savedStatus != null && savedStatus !== "" ? savedStatus : master?.status;
        setPhieuData(statusToUse != null ? { ...master, status: statusToUse } : master);
        setDetailData(result.detail || []);
        if (statusToUse != null) {
          setSelectedStatus(String(statusToUse));
        } else if (master?.status) {
          setSelectedStatus(String(master.status));
        }
        // Set transport info
        if (result.master) {
          setTransportInfo({
            ten_nha_xe: result.master.ten_nha_xe || "",
            sdt_nha_xe: result.master.sdt_nha_xe || "",
            gio_chay: result.master.gio_chay || "",
          });
        }
        // Set status log từ API (hỗ trợ cả log và statusLog)
        if (result.log && result.log.length > 0) {
          setStatusLog(result.log);
        } else if (result.statusLog && result.statusLog.length > 0) {
          setStatusLog(result.statusLog);
        }
        // Load ảnh từ imageUrls và fetch với Bearer token (ưu tiên result.imageUrls, fallback result.master.imageUrls)
        const imageUrlsToLoad = (result.imageUrls && result.imageUrls.length > 0) ? result.imageUrls : (result.master?.imageUrls || []);
        if (imageUrlsToLoad.length > 0) {
          const token = localStorage.getItem("access_token");
          
          // Helper function để fetch ảnh với Bearer token
          const fetchImageWithToken = async (imageUrl) => {
            if (!token) return imageUrl;
            
            try {
              const response = await fetch(imageUrl, {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              });
              
              if (!response.ok) {
                console.warn("Failed to fetch image with token, using original URL");
                return imageUrl;
              }
              
              const blob = await response.blob();
              return URL.createObjectURL(blob);
            } catch (error) {
              console.error("Error fetching image with token:", error);
              return imageUrl;
            }
          };
          
          // Fetch tất cả ảnh với token
          const imagePromises = imageUrlsToLoad.map(async (img, index) => {
            const blobUrl = await fetchImageWithToken(img.url);
            return {
              uid: `existing-${index}-${Date.now()}`,
              name: img.originalName || `image-${index + 1}`,
              status: "done",
              url: blobUrl,
              response: { url: img.url },
              originalUrl: img.url, // Lưu URL gốc để dùng sau
            };
          });
          
          const imageFileList = await Promise.all(imagePromises);
          setImages(prev => ({
            ...prev,
            banGiao: imageFileList, // Load vào banGiao (ảnh đính kèm)
          }));
        }
      } else {
        // Kiểm tra nếu là lỗi 404 - không tìm thấy phiếu giao hàng
        const errorMessage = result.error || "";
        const isNotFound = 
          errorMessage.includes("Không tìm thấy phiếu giao hàng với mã này") ||
          errorMessage.includes("không tìm thấy phiếu giao hàng") ||
          errorMessage.toLowerCase().includes("not found") ||
          (result.statusCode === 404);
        
        if (isNotFound) {
          message.error("Không tìm thấy phiếu giao hàng với mã này");
          // Navigate về trang danh sách giao hàng
          setTimeout(() => {
            navigate("/kho/giao-hang");
          }, 1500);
          return;
        }
        // Chỉ hiển thị message nếu không phải lỗi 404
        message.error(result.error || "Không thể tải dữ liệu phiếu");
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      // Kiểm tra nếu là lỗi 404
      const errorMessage = error?.response?.data?.message || error?.message || "";
      const isNotFound = 
        error?.response?.status === 404 ||
        errorMessage.includes("Không tìm thấy phiếu giao hàng với mã này") ||
        errorMessage.includes("không tìm thấy phiếu giao hàng");
      
      if (isNotFound) {
        message.error("Không tìm thấy phiếu giao hàng với mã này");
        // Navigate về trang danh sách giao hàng
        setTimeout(() => {
          navigate("/kho/giao-hang");
        }, 1500);
        return;
      }
      // Chỉ hiển thị message nếu không phải lỗi 404
      message.error("Không thể tải dữ liệu phiếu");
    } finally {
      setLoading(false);
    }
  }, [id, fromQR, voucherDateStr, navigate]);

  useEffect(() => {
    fetchData();
    // Cleanup: revoke blob URLs khi component unmount (images in closure is intentional)
    return () => {
      Object.values(images).flat().forEach((file) => {
        if (file.url && file.url.startsWith("blob:")) {
          URL.revokeObjectURL(file.url);
        }
      });
    };
    // images omitted: we only want fetchData on mount; cleanup uses latest images via ref/closure at unmount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchData]);

  // Status helpers - 7 trạng thái theo yêu cầu mới
  // 1: Lập chứng từ, 2: Lưu kho, 3: Xuất hàng, 4: Đã tiếp nhận, 5: Bàn giao ĐVVC, 6: Hoàn thành, 7: Thất bại
  const getStatusText = (status) => {
    switch (String(status)) {
      case "1": return "Lập chứng từ";
      case "2": return "Lưu kho";
      case "3": return "Xuất hàng";
      case "4": return "Đã tiếp nhận";
      case "5": return "Bàn giao ĐVVC";
      case "6": return "Hoàn thành";
      case "7": return "Thất bại";
      default: return "Lập chứng từ";
    }
  };

  const getStatusColor = (status) => {
    switch (String(status)) {
      case "1": return "#8c8c8c";   // gray - Lập chứng từ
      case "2": return "#faad14";   // yellow - Lưu kho
      case "3": return "#1890ff";   // blue - Xuất hàng
      case "4": return "#722ed1";   // purple - Đã tiếp nhận
      case "5": return "#13c2c2";   // cyan - Bàn giao ĐVVC
      case "6": return "#52c41a";   // green - Hoàn thành
      case "7": return "#ff4d4f";   // red - Thất bại
      default: return "#8c8c8c";
    }
  };

  // Logic tuần tự: 1 -> 2 -> 3 -> 4 -> 5 -> 6 hoặc 7
  const currentStatus = String(phieuData?.status || "1");
  const canStore = currentStatus === "1";       // 1 -> 2
  const canExport = currentStatus === "2";     // 2 -> 3
  const canReceive = currentStatus === "3";    // 3 -> 4
  const canUpdateDeliveryInfo = currentStatus === "4"; // 4 -> 5 (chỉ chuyển status, không đổi xe/chi phí)
  const canHandover = currentStatus === "5";   // 5: Bàn giao ĐVVC (cho phép sửa xe/chi phí/ảnh)
  const canComplete = currentStatus === "5";   // 5 -> 6
  const canFail = currentStatus === "5";       // 5 -> 7
  const canReturnToStore = currentStatus === "7"; // 7 -> 2 (Thất bại -> Chuyển về kho)

  const isManualSelection = selectedStatus != null && selectedStatus !== currentStatus;

  // Map status to action for manual selection
  const getActionFromStatus = (status) => {
    switch (String(status)) {
      case "2": return "store";
      case "3": return "export";
      case "4": return "receive";
      case "5": return "handover";
      case "6": return "complete";
      case "7": return "fail";
      default: return null;
    }
  };

  const getButtonConfigFromStatus = (status) => {
    switch (String(status)) {
      case "2": return { icon: <CheckCircleOutlined />, label: "Lưu kho", className: "store" };
      case "3": return { icon: <ExportOutlined />, label: "Xuất hàng", className: "export" };
      case "4": return { icon: <CheckCircleOutlined />, label: "Đã tiếp nhận", className: "receive" };
      case "5": return { icon: <TruckOutlined />, label: "Bàn giao ĐVVC", className: "handover" };
      case "6": return { icon: <CheckCircleOutlined />, label: "Hoàn thành", className: "complete" };
      case "7": return { icon: <CloseCircleOutlined />, label: "Thất bại", className: "fail", danger: true };
      default: return null;
    }
  };

  const handleAction = (action) => {
    setConfirmAction(action);
    // Pre-fill từ phieuData khi mở modal (chi phí, ứng tiền, xe). Ghi chú trong modal là ghi chú log, không map từ phieuData.
    const cost = Number(phieuData?.shippingCosts ?? phieuData?.chi_phi ?? 0);
    const advance = phieuData?.advanceMoney === 1;
    setConfirmNote("");
    setConfirmCost(cost);
    setConfirmAdvanceMoney(advance);
    setConfirmModalImages([]);
    setConfirmLoading(false); // Reset loading khi mở modal mới
    const vehicle = action === "handover" && phieuData?.vehicleCode ? phieuData.vehicleCode.trim() : "";
    setConfirmVehicle(vehicle);
    setShowConfirmModal(true);
  };

  const vehicleSearchTimerRef = useRef(null);
  const timelineWrapperRef = useRef(null);
  const VEHICLE_SEARCH_DEBOUNCE_MS = 400;

  const doVehicleSearch = useCallback((keyword) => {
    setLoadingVehicle(true);
    fetchVehicleList(keyword || "")
      .then((res) => {
        if (res.success) {
          setVehicleList(res.data || []);
        } else {
          setVehicleList([]);
        }
      })
      .catch(() => setVehicleList([]))
      .finally(() => setLoadingVehicle(false));
  }, []);

  // Search xe qua API - debounce khi gõ
  const handleVehicleSearch = useCallback((keyword) => {
    if (vehicleSearchTimerRef.current) {
      clearTimeout(vehicleSearchTimerRef.current);
      vehicleSearchTimerRef.current = null;
    }
    vehicleSearchTimerRef.current = setTimeout(() => {
      doVehicleSearch(keyword ?? "");
      vehicleSearchTimerRef.current = null;
    }, VEHICLE_SEARCH_DEBOUNCE_MS);
  }, [doVehicleSearch]);

  // Cleanup debounce timer khi unmount
  useEffect(() => {
    return () => {
      if (vehicleSearchTimerRef.current) clearTimeout(vehicleSearchTimerRef.current);
    };
  }, []);

  // Scroll log trạng thái xuống cuối khi có dữ liệu (để không bị button che)
  useEffect(() => {
    if (statusLog.length > 0 && timelineWrapperRef.current) {
      const el = timelineWrapperRef.current;
      requestAnimationFrame(() => {
        el.scrollTop = el.scrollHeight;
      });
    }
  }, [statusLog.length]);

  // Khi mở dropdown: load dữ liệu ban đầu (không debounce)
  const handleVehicleDropdownOpen = useCallback((open) => {
    if (open) doVehicleSearch("");
  }, [doVehicleSearch]);

  // Options cho Select xe: thêm xe từ phieuData nếu đơn đã có nhà xe mà chưa có trong list
  const vehicleOptions = useMemo(() => {
    const fromList = vehicleList.map((v) => ({
      value: v.vehicleCode,
      label: v.vehicleName ? `${v.vehicleCode} - ${v.vehicleName}` : v.vehicleCode,
    }));
    const code = confirmVehicle?.trim();
    if (code && !fromList.some((o) => o.value === code) && phieuData?.vehicleCode?.trim() === code) {
      const label = phieuData.ten_nha_xe ? `${code} - ${phieuData.ten_nha_xe}` : code;
      return [{ value: code, label }, ...fromList];
    }
    return fromList;
  }, [vehicleList, confirmVehicle, phieuData?.vehicleCode, phieuData?.ten_nha_xe]);

  const handleSaveStatus = () => {
    if (!selectedStatus || !phieuData) {
      message.warning("Vui lòng chọn trạng thái");
      return;
    }
    const action = getActionFromStatus(selectedStatus);
    if (action) {
      handleAction(action);
    } else {
      message.error("Trạng thái không hợp lệ");
    }
  };

  // Confirm action
  const handleConfirmAction = async () => {
    if (!phieuData) return;
    if (confirmLoading) return; // Chặn spam bấm nhiều lần

    // Cập nhật thông tin giao hàng: chỉ chuyển status 4 -> 5, không bắt buộc ảnh/xe/chi phí
    const isUpdateDeliveryInfo = confirmAction === "updateDeliveryInfo";
    const isHandover = confirmAction === "handover" || (confirmAction === "save" && selectedStatus === "5");
    // Bàn giao ĐVVC: bắt buộc có ít nhất 1 ảnh trong modal, không có ảnh thì không được gửi
    if (isHandover && !isUpdateDeliveryInfo && confirmModalImages.length < 1) {
      message.warning("Vui lòng chụp ảnh đính kèm trước khi xác nhận Bàn giao ĐVVC");
      return;
    }

    setConfirmLoading(true); // Bắt đầu loading, chặn spam

    try {
      let newStatus;
      
      if (confirmAction === "save") {
        // Lưu trạng thái đã chọn
        newStatus = selectedStatus;
      } else if (confirmAction === "updateDeliveryInfo") {
        // Chỉ chuyển status 4 -> 5, không gửi xe/chi phí
        newStatus = "5";
      } else if (confirmAction === "handover" && currentStatus === "5") {
        // Đã ở Bàn giao ĐVVC: chỉ cập nhật xe/chi phí/ảnh, không đổi trạng thái
        newStatus = "";
      } else {
        // Map action sang status code (giữ lại cho tương thích nếu cần)
        const statusMap = {
          store: "2",           // Lưu kho
          returnToStore: "2",   // Chuyển về kho (từ Thất bại)
          export: "3",          // Xuất hàng
          receive: "4",         // Đã tiếp nhận
          handover: "5",        // Bàn giao ĐVVC (chỉ khi chưa ở 5)
          complete: "6",        // Hoàn thành
          fail: "7",            // Thất bại
        };
        newStatus = statusMap[confirmAction];
      }

      // Cho phép newStatus "" khi Bàn giao ĐVVC (chỉ cập nhật xe/chi phí)
      const allowEmptyStatus = confirmAction === "handover" && currentStatus === "5";
      if (!newStatus && !allowEmptyStatus) {
        message.error("Trạng thái không hợp lệ");
        return;
      }

      // Lấy unitCode từ userInfo hoặc phieuData
      const unitsResponse = JSON.parse(localStorage.getItem("unitsResponse") || "{}");
      // Ưu tiên: phieuData.ma_dvs -> unitsResponse.unitCode -> userInfo.ma_dvcs -> "TAPMED"
      let unitCode = phieuData.ma_dvs?.trim() || unitsResponse.unitCode?.trim() || userInfo?.ma_dvcs?.trim() || "TAPMED";
      // Đảm bảo unitCode không có khoảng trắng thừa
      unitCode = unitCode.trim();

      // Cập nhật thông tin giao hàng: chỉ gửi newStatus 5, không gửi xe/chi phí (backend chỉ cho phép đổi xe/chi phí khi đã ở status 5)
      const sendVehicleCost = (confirmAction === "handover" || (confirmAction === "save" && newStatus === "5")) && confirmAction !== "updateDeliveryInfo";
      // Chỉ truyền vào payload các trường có giá trị thay đổi so với hiện tại
      const currentVehicle = (phieuData?.vehicleCode || "").trim();
      const newVehicle = (confirmVehicle || "").trim();
      const currentCost = Number(phieuData?.shippingCosts ?? phieuData?.chi_phi ?? 0);
      const currentAdvance = phieuData?.advanceMoney === 1 ? 1 : 0;
      const newAdvance = confirmAdvanceMoney ? 1 : 0;
      const payloadExtra = {};
      if (sendVehicleCost) {
        if (newVehicle !== currentVehicle) payloadExtra.vehicleCode = newVehicle || undefined;
        if (Number(confirmCost) !== currentCost) payloadExtra.cost = confirmCost;
        if (newAdvance !== currentAdvance) payloadExtra.advanceMoney = newAdvance;
      }
      // Ghi chú trong modal là ghi chú log: gửi khi user nhập, không so sánh với phieuData.ghi_chu
      const logNote = (confirmNote || "").trim();
      if (logNote !== "") payloadExtra.note = logNote;
      // Gọi API update status TRƯỚC để đảm bảo có stt_rec
      const result = await updateDeliveryStatus({
        unitCode: unitCode,
        voucherId: phieuData.stt_rec,
        VoucherDate: phieuData.ngay_ct ? dayjs(phieuData.ngay_ct).format("YYYY-MM-DD") : dayjs().format("YYYY-MM-DD"),
        newStatus: newStatus,
        ...payloadExtra,
      });

      if (result.success) {
        // Update local status (giữ nguyên "5" khi handover với newStatus "")
        const statusToSet = newStatus || (confirmAction === "handover" ? "5" : currentStatus);
        setPhieuData(prev => ({ ...prev, status: statusToSet }));
        setSelectedStatus(statusToSet);
        
        // Gộp ảnh từ modal confirm vào banGiao (không gộp khi chỉ là updateDeliveryInfo)
        const isHandoverOrSave5 = confirmAction === "handover" || (confirmAction === "save" && (newStatus === "5" || currentStatus === "5"));
        const extraFromModal = isHandoverOrSave5 ? confirmModalImages : [];
        if (extraFromModal.length > 0) {
          setImages(prev => ({ ...prev, banGiao: [...extraFromModal, ...prev.banGiao] }));
        }
        
        // Upload ảnh SAU KHI đã cập nhật trạng thái thành công (đảm bảo có stt_rec)
        const uploadResult = await uploadPendingImages(extraFromModal);
        if (!uploadResult.success && uploadResult.failedCount > 0) {
          message.warning(`Có ${uploadResult.failedCount} ảnh upload thất bại`);
        }
        
        // Xóa ảnh SAU KHI đã upload thành công
        const deleteResult = await deletePendingImages();
        if (!deleteResult.success && deleteResult.failedCount > 0) {
          message.warning(`Có ${deleteResult.failedCount} ảnh xóa thất bại`);
        }
        
        // Add to status log
        const actionText = confirmAction === "save" 
          ? getStatusText(newStatus) 
          : getActionText(confirmAction);
        setStatusLog(prev => [...prev, {
          time: dayjs().format("YYYY-MM-DD HH:mm:ss"),
          action: actionText,
          user: userInfo?.userName || userInfo?.Name || "User",
          note: confirmNote,
          cost: (confirmAction === "handover" || (confirmAction === "save" && newStatus === "5")) && confirmCost > 0 ? confirmCost : undefined,
        }]);

        // Refresh data để lấy log mới nhất
        await fetchData();
        
        setShowConfirmModal(false);
        setConfirmModalImages([]);
        message.success("Cập nhật trạng thái thành công!");
      } else {
        // Hiển thị lỗi từ API
        message.error(result.message || "Có lỗi xảy ra khi cập nhật trạng thái");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      message.error("Có lỗi xảy ra khi cập nhật trạng thái!");
    } finally {
      setConfirmLoading(false); // Kết thúc loading
    }
  };

  const getActionText = (action) => {
    switch (action) {
      case "store": return "Lưu kho";
      case "returnToStore": return "Chuyển về kho";
      case "export": return "Xuất hàng";
      case "receive": return "Đã tiếp nhận";
      case "updateDeliveryInfo": return "Cập nhật thông tin giao hàng";
      case "handover": return "Bàn giao ĐVVC";
      case "complete": return "Hoàn thành";
      case "fail": return "Thất bại";
      default: return "";
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case "store": return "#faad14";
      case "returnToStore": return "#faad14";
      case "export": return "#1890ff";
      case "receive": return "#722ed1";
      case "updateDeliveryInfo": return "#13c2c2";
      case "handover": return "#13c2c2";
      case "complete": return "#52c41a";
      case "fail": return "#ff4d4f";
      default: return "#1890ff";
    }
  };

  // Helper: lấy fileId từ file (ảnh từ API có response.url). URL dạng .../fileupload/{id}/view → lấy id, không lấy "view"
  const getFileIdFromFile = (file) => {
    const url = file.response?.url || file.originalUrl || file.url || "";
    if (!url || url.startsWith("blob:")) return null;
    const parts = url.split("/").filter(Boolean);
    if (parts.length === 0) return null;
    const last = parts[parts.length - 1];
    // Nếu segment cuối là "view" / "delete" (path action) thì id là segment trước đó
    if (last === "view" || last === "delete") {
      return parts.length >= 2 ? parts[parts.length - 2] : null;
    }
    return last;
  };

  // Handle image upload - chỉ lưu vào state, không upload ngay
  // Ảnh load từ API: khi xóa → popup confirm → xác nhận thì gọi API xóa ngay (không chờ đổi status)
  const handleImageUpload = (milestone, { fileList }) => {
    setImages(prev => {
      const currentFiles = prev[milestone] || [];
      const fileListUids = new Set(fileList.map(f => f.uid));
      const currentUids = new Set(currentFiles.map(f => f.uid));
      const deletedFiles = currentFiles.filter(f => !fileListUids.has(f.uid));
      const newFilesInList = fileList.filter(f => !currentUids.has(f.uid));

      // Chỉ hiện popup xóa khi user thực sự xóa ảnh (có ảnh cũ bị bỏ), KHÔNG phải khi đang thêm ảnh (fileList chỉ có file mới)
      const isActuallyRemoving = deletedFiles.length > 0 && newFilesInList.length === 0;
      const deletedFromApi = isActuallyRemoving
        ? deletedFiles.filter(
            (f) => f.response?.url || f.originalUrl || (f.url && !String(f.url).startsWith("blob:"))
          )
        : [];

      if (deletedFromApi.length > 0) {
        const fileIdsToDelete = deletedFromApi
          .map(getFileIdFromFile)
          .filter((id) => id !== null);
        if (fileIdsToDelete.length > 0) {
          Modal.confirm({
            title: "Xác nhận xóa ảnh",
            content: `Bạn có chắc muốn xóa ${deletedFromApi.length} ảnh? Ảnh sẽ bị xóa trên máy chủ ngay.`,
            okText: "Xóa",
            cancelText: "Hủy",
            okButtonProps: { danger: true },
            onOk: async () => {
              const deleteResults = await Promise.all(
                fileIdsToDelete.map((fileId) => deleteDeliveryImage(fileId))
              );
              const failedCount = deleteResults.filter((r) => !r.success).length;
              if (failedCount > 0) {
                message.warning(`Có ${failedCount} ảnh xóa thất bại`);
              } else {
                message.success("Xóa ảnh thành công");
              }
              setImages((prev2) => ({ ...prev2, [milestone]: fileList }));
            },
          });
          return prev; // Giữ nguyên list khi chờ user confirm
        }
      }

      // Nếu fileList rỗng (xóa hết), dùng fileList
      if (fileList.length === 0) {
        return { ...prev, [milestone]: fileList };
      }

      const allCurrentFilesIncluded = currentFiles.every((f) => fileListUids.has(f.uid));
      if (allCurrentFilesIncluded) {
        // Có thêm file mới hoặc reorder — dùng luôn fileList từ Upload để không mất dữ liệu
        return { ...prev, [milestone]: fileList };
      }

      const existingUids = new Set(currentFiles.map(f => f.uid));
      const newFiles = fileList.filter((f) => !existingUids.has(f.uid));
      if (newFiles.length > 0 && fileList.length <= newFiles.length) {
        // Chỉ toàn file mới (từ nút upload) — merge với danh sách cũ
        const mergedFileList = [...newFiles, ...currentFiles];
        return { ...prev, [milestone]: mergedFileList };
      }
      return { ...prev, [milestone]: fileList };
    });
  };

  // Handle preview ảnh
  const handlePreview = async (file) => {
    // Nếu file có blob URL (đã fetch với token), dùng luôn
    if (file.url && file.url.startsWith("blob:")) {
      setPreviewImage({
        visible: true,
        url: file.url,
        title: file.name || "Preview",
      });
      return;
    }
    
    // Nếu có originalUrl, fetch lại với token
    if (file.originalUrl) {
      const token = localStorage.getItem("access_token");
      if (token) {
        try {
          const response = await fetch(file.originalUrl, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          
          if (response.ok) {
            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);
            setPreviewImage({
              visible: true,
              url: blobUrl,
              title: file.name || "Preview",
            });
            return;
          }
        } catch (error) {
          console.error("Error fetching image for preview:", error);
        }
      }
    }
    
    // Fallback: dùng URL gốc
    setPreviewImage({
      visible: true,
      url: file.url || file.thumbUrl || "",
      title: file.name || "Preview",
    });
  };

  // Upload tất cả ảnh chưa được upload - extraBanGiao: ảnh từ modal confirm
  const uploadPendingImages = async (extraBanGiao = []) => {
    if (!phieuData?.stt_rec) {
      return { success: true }; // Không có stt_rec thì bỏ qua
    }

    const allImages = [...extraBanGiao, ...images.banGiao, ...images.hoanThanh];
    const pendingImages = allImages.filter(
      (file) => !file.url && !file.response && file.originFileObj
    );

    if (pendingImages.length === 0) {
      return { success: true };
    }

    const UPLOAD_CONCURRENCY = 3;
    const tasks = pendingImages.map((file) => async () => {
      try {
        const result = await uploadDeliveryImage({
          file: file.originFileObj || file,
          stt_rec: phieuData.stt_rec,
          isPublicAccess: false,
          slug: "",
        });
        if (result.success) {
          return {
            uid: file.uid,
            url: result.data?.url,
            response: result.data,
            success: true,
          };
        }
        return {
          uid: file.uid,
          success: false,
          error: result.message,
        };
      } catch (error) {
        console.error("Error uploading image:", error);
        return {
          uid: file.uid,
          success: false,
          error: error.message,
        };
      }
    });

    const results = await runWithConcurrencyLimit(tasks, UPLOAD_CONCURRENCY);
    const failedUploads = results.filter((r) => !r.success);

    // Update file list with uploaded URLs
    const updateFileList = (fileList) => {
      return fileList.map((file) => {
        const result = results.find((r) => r.uid === file.uid);
        if (result && result.success) {
          return {
            ...file,
            status: "done",
            url: result.url,
            response: result.response,
          };
        }
        return file;
      });
    };

    setImages((prev) => ({
      banGiao: updateFileList(prev.banGiao),
      hoanThanh: updateFileList(prev.hoanThanh),
    }));

    if (failedUploads.length > 0) {
      message.warning(`Có ${failedUploads.length} ảnh upload thất bại`);
      return { success: false, failedCount: failedUploads.length };
    }

    return { success: true };
  };

  // Xóa tất cả ảnh đã được đánh dấu xóa
  const deletePendingImages = async () => {
    if (deletedImages.length === 0) {
      return { success: true };
    }

    const deletePromises = deletedImages.map(async (fileId) => {
      try {
        const result = await deleteDeliveryImage(fileId);
        return {
          fileId,
          success: result.success,
          error: result.success ? null : result.message,
        };
      } catch (error) {
        console.error("Error deleting image:", error);
        return {
          fileId,
          success: false,
          error: error.message,
        };
      }
    });

    const results = await Promise.all(deletePromises);
    const failedDeletes = results.filter((r) => !r.success);

    // Xóa các fileId đã xóa thành công khỏi deletedImages
    const successfulFileIds = results
      .filter((r) => r.success)
      .map((r) => r.fileId);
    
    setDeletedImages((prev) => prev.filter((id) => !successfulFileIds.includes(id)));

    if (failedDeletes.length > 0) {
      message.warning(`Có ${failedDeletes.length} ảnh xóa thất bại`);
      return { success: false, failedCount: failedDeletes.length };
    }

    return { success: true };
  };

  if (loading) {
    return (
      <div className="process-loading">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="process-container">
      {/* Header */}
      <div className="process-header">
        <button className="process-back-btn" onClick={() => navigate(returnUrl)}>
          <LeftOutlined />
        </button>
        <h1 className="process-title">XỬ LÝ GIAO HÀNG</h1>
        <div style={{ width: 40 }} />
      </div>

      {/* Phiếu giao hàng info */}
      <Card className="process-card" size="small">
        <div className="process-card-header">
          <FileTextOutlined className="process-card-icon" />
          <span className="process-card-title">Phiếu giao hàng</span>
          <Select
            value={selectedStatus}
            onChange={setSelectedStatus}
            style={{ width: 150 }}
            size="small"
            placeholder="Chọn trạng thái"
            getPopupContainer={(trigger) => trigger.parentElement}
            disabled={currentStatus === "6" || currentStatus === "7"}
          >
            <Select.Option value="2">Lưu kho</Select.Option>
            <Select.Option value="3">Xuất hàng</Select.Option>
            <Select.Option value="4">Đã tiếp nhận</Select.Option>
            <Select.Option value="5">Bàn giao ĐVVC</Select.Option>
            <Select.Option value="6">Hoàn thành</Select.Option>
            <Select.Option value="7">Thất bại</Select.Option>
          </Select>
        </div>

      </Card>

      {/* Đơn hàng info */}
      <Card className="process-card" size="small">
        <div className="process-card-header">
          <FileTextOutlined className="process-card-icon order" />
          <div className="process-card-header-inline">
            <span className="process-card-title process-card-title-inline">Đơn hàng</span>
            <span className="process-card-header-meta">
              {phieuData?.so_don_hang || "---"}
            </span>
          </div>
          <span className="process-card-header-date">
            {phieuData?.ngay_don_hang ? dayjs(phieuData.ngay_don_hang).format("DD/MM/YYYY") : "---"}
          </span>
        </div>
        <div className="process-package-count">
          {phieuData?.tong_so_kien || detailData.length || 0} <span>kiện</span>
        </div>
      </Card>

      {/* Khách hàng info */}
      <Card className="process-card" size="small">
        <div className="process-card-header">
          <UserOutlined className="process-card-icon customer" />
          <span className="process-card-title">Khách hàng</span>
        </div>
        <div className="process-info-list">
          <div className="process-info-row">
            <span className="process-info-label">Tên KH</span>
            <span className="process-info-value">{phieuData?.ten_kh || "---"}</span>
          </div>
          <div className="process-info-row">
            <span className="process-info-label">SĐT</span>
            <span className="process-info-value phone">
              <PhoneOutlined /> {phieuData?.sdt_kh || "---"}
            </span>
          </div>
          <div className="process-info-row">
            <span className="process-info-label">Địa chỉ</span>
            <span className="process-info-value">{phieuData?.dia_chi || "---"}</span>
          </div>
        </div>
      </Card>

      {/* Thông tin vận chuyển */}
      <Card className="process-card" size="small">
        <div className="process-card-header">
          <CarOutlined className="process-card-icon transport" />
          <span className="process-card-title">TT Vận chuyển</span>
        </div>
        <div className="process-info-list">
          <div className="process-info-row">
            <span className="process-info-label">Tên nhà xe</span>
            <span className="process-info-value">{transportInfo.ten_nha_xe || "---"}</span>
          </div>
          <div className="process-info-row">
            <span className="process-info-label">Số điện thoại</span>
            <span className="process-info-value">{transportInfo.sdt_nha_xe || "---"}</span>
          </div>
          <div className="process-info-row">
            <span className="process-info-label">Giờ chạy</span>
            <span className="process-info-value">{transportInfo.gio_chay || "---"}</span>
          </div>
          {(phieuData?.shippingCosts != null && phieuData?.shippingCosts > 0) || (phieuData?.chi_phi != null && phieuData?.chi_phi > 0) ? (
            <div className="process-info-row">
              <span className="process-info-label">Chi phí</span>
              <span className="process-info-value">{Number(phieuData?.shippingCosts ?? phieuData?.chi_phi ?? 0).toLocaleString()}đ</span>
            </div>
          ) : null}
          {phieuData?.advanceMoney != null ? (
            <div className="process-info-row">
              <span className="process-info-label">Ứng tiền</span>
              <span className="process-info-value">{phieuData.advanceMoney === 1 ? "Có" : "Không"}</span>
            </div>
          ) : null}
          {(phieuData?.ghi_chu || "").trim() ? (
            <div className="process-info-row">
              <span className="process-info-label">Ghi chú</span>
              <span className="process-info-value">{phieuData.ghi_chu}</span>
            </div>
          ) : null}
        </div>
      </Card>

      {/* Upload ảnh */}
      <Card className="process-card" size="small">
        <div className="process-card-header">
          <PictureOutlined className="process-card-icon" />
          <span className="process-card-title">Upload ảnh</span>
        </div>
        
        <div className="process-upload-section">
          {/* Ảnh đính kèm */}
          <div className="process-upload-milestone">
            <div className="process-upload-label">
              Ảnh đính kèm
            </div>
            
            {/* List ảnh riêng */}
            {images.banGiao.length > 0 && (
              <div className="process-upload-list-wrapper">
                <Upload
                  listType="picture-card"
                  fileList={images.banGiao}
                  onChange={(info) => handleImageUpload("banGiao", info)}
                  onPreview={handlePreview}
                  beforeUpload={() => false}
                  disabled={currentStatus === "6" || currentStatus === "7"}
                  showUploadList={{
                    showPreviewIcon: false,
                    showRemoveIcon: !(currentStatus === "6" || currentStatus === "7"),
                  }}
                  itemRender={(originNode, file, fileList, actions) => {
                    return (
                      <div
                        onClick={(e) => {
                          // Chỉ trigger preview nếu không click vào nút remove
                          if (!e.target.closest('.ant-upload-list-item-actions')) {
                            handlePreview(file);
                          }
                        }}
                        style={{ cursor: "pointer", width: "100%", height: "100%" }}
                      >
                        {originNode}
                      </div>
                    );
                  }}
                >
                  {/* Không có button upload ở đây */}
                </Upload>
              </div>
            )}
            
            {/* Button chụp ảnh riêng - đặt ở dưới list ảnh */}
            {images.banGiao.length <= 4 && !(currentStatus === "6" || currentStatus === "7") && (
              <div className="process-upload-button-wrapper">
                <Upload
                  listType="picture-card"
                  fileList={[]}
                  onChange={(info) => handleImageUpload("banGiao", info)}
                  beforeUpload={() => false}
                  showUploadList={false}
                  accept="image/*"
                  capture="environment"
                >
                  <div>
                    <CameraOutlined />
                    <div style={{ marginTop: 8 }}>Chụp ảnh</div>
                  </div>
                </Upload>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Log trạng thái */}
      <Card className="process-card process-card-log" size="small">
        <div className="process-card-header">
          <HistoryOutlined className="process-card-icon" />
          <span className="process-card-title">Log trạng thái</span>
        </div>
        <div className="process-timeline-wrapper" ref={timelineWrapperRef}>
          <Timeline
            className="process-timeline"
            items={statusLog.map((log, index) => ({
              key: index,
              color: index === statusLog.length - 1 ? "blue" : "gray",
              children: (
                <div className="process-timeline-item">
                  <div className="process-timeline-header">
                    <span className="process-timeline-action">{log.action}</span>
                    <span className="process-timeline-time">
                      {log.time ? dayjs(log.time).format("DD/MM/YYYY HH:mm") : log.time}
                    </span>
                  </div>
                  <div className="process-timeline-user">
                    <strong>Bởi:</strong> {log.user}{log.employeeName ? ` - ${log.employeeName}` : ""}
                  </div>
                  {log.note != null && String(log.note).trim() !== "" && (
                    <div className="process-timeline-note"><strong>Ghi chú:</strong> {log.note}</div>
                  )}
                  {log.cost != null && log.cost > 0 && (
                    <div className="process-timeline-cost"><strong>Chi phí:</strong> {log.cost.toLocaleString()}đ</div>
                  )}
                  {(log.vehicleCodeOld != null || log.vehicleCodeNew != null) && (
                    <div className="process-timeline-detail" style={{ wordBreak: "break-word" }}>
                      <strong>Xe:</strong> {(log.vehicleCodeOld || "").trim()} {" -> "} {(log.vehicleCodeNew || "").trim()}
                    </div>
                  )}
                  {(log.shippingCostsOld != null || log.shippingCostsNew != null) && (
                    <div className="process-timeline-detail">
                      <strong>Chi phí:</strong> {Number(log.shippingCostsOld ?? 0).toLocaleString()}đ {" -> "} {Number(log.shippingCostsNew ?? 0).toLocaleString()}đ
                    </div>
                  )}
                  {(log.advanceMoneyOld != null || log.advanceMoneyNew != null) && (
                    <div className="process-timeline-detail">
                      <strong>Ứng tiền:</strong> {log.advanceMoneyOld === 1 ? "Có" : "Không"} {" -> "} {log.advanceMoneyNew === 1 ? "Có" : "Không"}
                    </div>
                  )}
                </div>
              ),
            }))}
          />
        </div>
      </Card>

      {/* Action buttons: tuần tự hoặc button theo trạng thái đã chọn */}
      <div className="process-actions">
        {isManualSelection ? (() => {
          const buttonConfig = getButtonConfigFromStatus(selectedStatus);
          if (!buttonConfig) return null;
          return (
            <Button
              type={buttonConfig.danger ? "default" : "primary"}
              danger={buttonConfig.danger}
              size="large"
              icon={buttonConfig.icon}
              className={`process-action-btn ${buttonConfig.className}`}
              onClick={handleSaveStatus}
              style={{ width: "100%" }}
            >
              {buttonConfig.label}
            </Button>
          );
        })() : (
          <>
            {canStore && (
              <Button
                type="primary"
                size="large"
                icon={<CheckCircleOutlined />}
                className="process-action-btn store"
                onClick={() => handleAction("store")}
              >
                Lưu kho
              </Button>
            )}
            {canExport && (
              <Button
                type="primary"
                size="large"
                icon={<ExportOutlined />}
                className="process-action-btn export"
                onClick={() => handleAction("export")}
              >
                Xuất hàng
              </Button>
            )}
            {canReceive && (
              <Button
                type="primary"
                size="large"
                icon={<CheckCircleOutlined />}
                className="process-action-btn receive"
                onClick={() => handleAction("receive")}
              >
                Đã tiếp nhận
              </Button>
            )}
            {canUpdateDeliveryInfo && (
              <Button
                type="primary"
                size="large"
                icon={<EditOutlined />}
                className="process-action-btn handover"
                onClick={() => handleAction("updateDeliveryInfo")}
              >
                Cập nhật thông tin giao hàng
              </Button>
            )}
            {canHandover && (
              <Button
                type="primary"
                size="large"
                icon={<TruckOutlined />}
                className="process-action-btn handover handover-primary"
                onClick={() => handleAction("handover")}
              >
                Bàn giao ĐVVC
              </Button>
            )}
            {canComplete && canFail && (
              <div className="process-actions-row">
                <Button
                  type="primary"
                  size="large"
                  icon={<CheckCircleOutlined />}
                  className="process-action-btn complete"
                  onClick={() => handleAction("complete")}
                >
                  Hoàn thành
                </Button>
                <Button
                  danger
                  size="large"
                  icon={<CloseCircleOutlined />}
                  className="process-action-btn fail"
                  onClick={() => handleAction("fail")}
                >
                  Thất bại
                </Button>
              </div>
            )}
            {canComplete && !canFail && (
              <Button
                type="primary"
                size="large"
                icon={<CheckCircleOutlined />}
                className="process-action-btn complete"
                onClick={() => handleAction("complete")}
              >
                Hoàn thành
              </Button>
            )}
            {canFail && !canComplete && (
              <Button
                danger
                size="large"
                icon={<CloseCircleOutlined />}
                className="process-action-btn fail"
                onClick={() => handleAction("fail")}
              >
                Thất bại
              </Button>
            )}
            {canReturnToStore && (
              <Button
                type="primary"
                size="large"
                icon={<CheckCircleOutlined />}
                className="process-action-btn store"
                onClick={() => handleAction("returnToStore")}
              >
                Chuyển về kho
              </Button>
            )}
          </>
        )}
      </div>

      {/* Confirm Modal */}
      <Modal
        title={confirmAction === "save" ? "Xác nhận cập nhật trạng thái" : `Xác nhận ${getActionText(confirmAction)}`}
        open={showConfirmModal}
        onCancel={() => !confirmLoading && setShowConfirmModal(false)}
        closable={!confirmLoading}
        maskClosable={!confirmLoading}
        footer={[
          <Button key="cancel" onClick={() => setShowConfirmModal(false)} disabled={confirmLoading}>
            {confirmAction === "save" ? "Hủy" : "Không"}
          </Button>,
          <Button 
            key="confirm" 
            type="primary" 
            style={{ background: confirmAction === "save" ? getStatusColor(selectedStatus) : getActionColor(confirmAction) }}
            onClick={handleConfirmAction}
            loading={confirmLoading}
            disabled={confirmLoading}
          >
            {confirmAction === "save" ? "Lưu" : "Có"}
          </Button>,
        ]}
      >
        <div className="process-confirm-content">
          {confirmAction === "save" ? (
            <p style={{ fontSize: "16px", fontWeight: 600, marginBottom: "16px" }}>
              Cập nhật trạng thái thành: <strong style={{ color: getStatusColor(selectedStatus) }}>"{getStatusText(selectedStatus)}"</strong>?
            </p>
          ) : (
            <p style={{ fontSize: "16px", fontWeight: 600, marginBottom: "16px" }}>
              Có chắc chắn <strong style={{ color: getActionColor(confirmAction) }}>"{getActionText(confirmAction)}"</strong>?
            </p>
          )}
          
          {(confirmAction === "handover" || (confirmAction === "save" && selectedStatus === "5")) && confirmAction !== "updateDeliveryInfo" && (
            <>
              <div className="process-confirm-field">
                <label style={{ fontWeight: 700, marginBottom: "8px", display: "block" }}>Chọn xe:</label>
                <Select
                  style={{ width: "100%" }}
                  placeholder="Nhập mã hoặc tên xe để tìm kiếm"
                  value={confirmVehicle || undefined}
                  onChange={setConfirmVehicle}
                  allowClear
                  loading={loadingVehicle}
                  showSearch
                  filterOption={false}
                  onSearch={handleVehicleSearch}
                  onDropdownVisibleChange={handleVehicleDropdownOpen}
                  notFoundContent={loadingVehicle ? "Đang tải..." : "Nhập từ khóa để tìm xe"}
                  options={vehicleOptions}
                />
              </div>
              <div className="process-confirm-field">
                <label style={{ fontWeight: 700, marginBottom: "8px", display: "block" }}>Chi phí:</label>
              <InputNumber
                style={{ width: "100%" }}
                value={confirmCost}
                onChange={(val) => setConfirmCost(val || 0)}
                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                parser={(value) => value.replace(/[^\d]/g, "")}
                placeholder="Nhập chi phí vận chuyển"
                addonAfter="đ"
                min={0}
                max={999999999999}
                controls={false}
                inputMode="numeric"
                onKeyDown={(e) => {
                  // Chỉ cho phép số, Backspace, Delete, Tab, Arrow keys
                  if (
                    !/[0-9]/.test(e.key) &&
                    !["Backspace", "Delete", "Tab", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(e.key)
                  ) {
                    e.preventDefault();
                  }
                }}
              />
            </div>
              <div className="process-confirm-field process-confirm-advance-money">
                <Checkbox
                  checked={confirmAdvanceMoney}
                  onChange={(e) => setConfirmAdvanceMoney(e.target.checked)}
                >
                  Ứng tiền :
                </Checkbox>
              </div>
            </>
          )}

          <div className="process-confirm-field">
            <label style={{ fontWeight: 700, marginBottom: "8px", display: "block" }}>Ghi chú:</label>
            <TextArea
              rows={3}
              value={confirmNote}
              onChange={(e) => setConfirmNote(e.target.value)}
              placeholder="Nhập ghi chú (nếu có)"
            />
          </div>

          {(confirmAction === "handover" || (confirmAction === "save" && selectedStatus === "5")) && confirmAction !== "updateDeliveryInfo" && (
            <div className="process-confirm-field">
              <div className="process-upload-section">
                <div className="process-upload-milestone">
                  <div className="process-upload-label">Ảnh đính kèm</div>
                  {confirmModalImages.length > 0 && (
                    <div className="process-upload-list-wrapper">
                      <Upload
                        listType="picture-card"
                        fileList={confirmModalImages}
                        onChange={({ fileList }) => setConfirmModalImages(fileList)}
                        onPreview={(file) => handlePreview(file)}
                        beforeUpload={() => false}
                        showUploadList={{
                          showPreviewIcon: false,
                          showRemoveIcon: true,
                        }}
                      />
                    </div>
                  )}
                  {confirmModalImages.length <= 4 && (
                    <div className="process-upload-button-wrapper">
                      <Upload
                        listType="picture-card"
                        fileList={[]}
                        onChange={({ fileList }) => setConfirmModalImages(prev => [...prev, ...fileList])}
                        beforeUpload={() => false}
                        showUploadList={false}
                        accept="image/*"
                        capture="environment"
                      >
                        <div>
                          <CameraOutlined />
                          <div style={{ marginTop: 8 }}>Chụp ảnh</div>
                        </div>
                      </Upload>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Image Preview Modal */}
      <Modal
        open={previewImage.visible}
        title={previewImage.title}
        footer={null}
        onCancel={() => {
          setPreviewImage({ visible: false, url: "", title: "" });
          // Revoke blob URL nếu là blob
          if (previewImage.url && previewImage.url.startsWith("blob:")) {
            URL.revokeObjectURL(previewImage.url);
          }
        }}
        width="80%"
        style={{ maxWidth: "900px" }}
        centered
        styles={{
          body: {
            padding: "20px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            maxHeight: "80vh",
            overflow: "auto"
          }
        }}
      >
        <Image
          src={previewImage.url}
          alt={previewImage.title}
          style={{ 
            maxWidth: "100%",
            maxHeight: "70vh",
            objectFit: "contain",
            display: "block",
            margin: "0 auto"
          }}
          preview={false}
        />
      </Modal>
    </div>
  );
};

export default ProcessPhieuGiaoHang;
