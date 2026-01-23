import {
  LeftOutlined,
  PlusOutlined,
  SaveOutlined,
  CameraOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  ExportOutlined,
  TruckOutlined,
} from "@ant-design/icons";
import { Button, Card, Form, Space, Typography, message, Tabs, Upload, Image, Timeline, Modal, Input, Spin } from "antd";
import dayjs from "dayjs";
import { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import VatTuSelectFullPOS from "../../../../components/common/ProductSelectFull/VatTuSelectFullPOS";
import "./DetailPhieuGiaoHang.css";
import PhieuGiaoHangFormInputs from "./components/PhieuGiaoHangFormInputs";
import VatTuGiaoHangTable from "./components/VatTuGiaoHangTable";
import { usePhieuGiaoHangData } from "./hooks/usePhieuGiaoHangData";
import { useVatTuManagerGiaoHang } from "./hooks/useVatTuManagerGiaoHang";
import {
  fetchPhieuGiaoHangDataByQR,
  fetchPhieuGiaoHangDataByView,
  updateDeliveryStatus,
} from "./utils/phieuGiaoHangApi";
import {
  buildPhieuGiaoHangPayload,
  validateDataSource,
} from "./utils/phieuGiaoHangUtils";

const { Title } = Typography;
const { TextArea } = Input;

const DetailPhieuGiaoHang = ({ isEditMode: initialEditMode = false }) => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [phieuData, setPhieuData] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false); // Luôn false - chỉ xem, không cho chỉnh sửa
  const [dataSource, setDataSource] = useState([]);
  const [vatTuInput, setVatTuInput] = useState(undefined);
  const [activeTab, setActiveTab] = useState("master");
  const [imageList, setImageList] = useState([]);
  const [logStatus, setLogStatus] = useState([]);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [statusAction, setStatusAction] = useState("");
  const [statusNote, setStatusNote] = useState("");

  const sctRec = location.state?.sctRec || id;
  const returnUrl = location.state?.returnUrl || "/kho/giao-hang";
  const fromQR = location.state?.fromQR || false; // Flag để biết có phải từ QR scan không
  const voucherDateStr = location.state?.voucherDateStr || null; // Format YYYYMMDD cho API view
  const token = localStorage.getItem("access_token");

  const userInfo = useSelector((state) => state?.claimsReducer?.userInfo || {});

  const {
    maGiaoDichList,
    maKhoList,
    loadingMaKho,
    maKhachList,
    loadingMaKhach,
    fetchMaKhoListDebounced,
    fetchMaKhachListDebounced,
    fetchMaGiaoDichList,
    fetchMaKhoList,
    fetchMaKhachList,
  } = usePhieuGiaoHangData();

  const {
    handleVatTuSelect: vatTuSelectHandler,
    handleQuantityChange,
    handleSelectChange,
    handleDeleteItem,
    handleAddItem,
  } = useVatTuManagerGiaoHang();

  useEffect(() => {
    // Chỉ gọi một lần khi component mount, không phụ thuộc vào các function để tránh vòng lặp
    fetchMaGiaoDichList();
    fetchMaKhoList();
    fetchMaKhachList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - chỉ chạy một lần khi mount

  useEffect(() => {
    if (sctRec && sctRec !== "0") {
      loadPhieuData();
    } else {
      // New mode: set default date and status
      form.setFieldsValue({
        ngay_ct: dayjs(),
        status: "1", // Default: 1 (Lập chứng từ)
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sctRec]);

  const loadPhieuData = async () => {
    setLoading(true);
    try {
      let result;
      
      // Phân biệt API call dựa trên fromQR flag
      if (fromQR) {
        // Quét QR: dùng /Delivery/:voucherId
        result = await fetchPhieuGiaoHangDataByQR(sctRec);
      } else if (voucherDateStr) {
        // Xem trực tiếp: dùng /Delivery/:voucherDateStr/:voucherId
        result = await fetchPhieuGiaoHangDataByView(voucherDateStr, sctRec);
      } else {
        // Fallback: thử QR API trước (có thể không có voucherDateStr trong state)
        result = await fetchPhieuGiaoHangDataByQR(sctRec);
      }
      
      if (result.success && result.master) {
        setPhieuData(result);

        // Set form values
        form.setFieldsValue({
          stt_rec: result.master.stt_rec,
          so_ct: result.master.so_ct,
          ngay_ct: result.master.ngay_ct ? dayjs(result.master.ngay_ct) : null,
          ma_gd: result.master.ma_gd,
          ma_kho: result.master.ma_kho,
          ma_kh: result.master.ma_kh,
          ten_kh: result.master.ten_kh,
          dia_chi: result.master.dia_chi,
          so_dien_thoai: result.master.so_dien_thoai,
          so_don_hang: result.master.so_don_hang,
          ngay_don_hang: result.master.ngay_don_hang ? dayjs(result.master.ngay_don_hang) : null,
          ten_nha_xe: result.master.ten_nha_xe,
          sdt_nha_xe: result.master.sdt_nha_xe,
          gio_chay: result.master.gio_chay,
          tong_so_kien: result.master.tong_so_kien,
          dien_giai: result.master.dien_giai,
          ghi_chu: result.master.ghi_chu,
          status: result.master.status,
        });

        // Load images if available
        if (result.master.images) {
          setImageList(JSON.parse(result.master.images || "[]"));
        }

        // Load log status if available
        if (result.log) {
          setLogStatus(result.log);
        }

        // Set detail data
        if (result.detail && result.detail.length > 0) {
          const detailData = result.detail.map((item, index) => ({
            key: item.stt_rec || index,
            stt_rec0: item.stt_rec0,
            stt_rec: item.stt_rec,
            ma_vt: item.ma_vt,
            ten_vt: item.ten_vt,
            dvt: item.dvt,
            so_luong: item.so_luong,
            ma_kho: item.ma_kho,
            ma_lo: item.ma_lo,
            han_dung: item.han_dung,
            ghi_chu: item.ghi_chu,
          }));
          setDataSource(detailData);
        }
      } else {
        message.error("Không thể tải dữ liệu phiếu giao hàng");
      }
    } catch (error) {
      console.error("Error loading phieu giao hang:", error);
      message.error("Có lỗi xảy ra khi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  const handleVatTuSelect = useCallback(
    (selectedVatTu) => {
      vatTuSelectHandler(selectedVatTu, dataSource, setDataSource);
      setVatTuInput(undefined);
    },
    [dataSource, vatTuSelectHandler]
  );

  const handleMaKhachSelect = (value) => {
    const selectedKhach = maKhachList.find((item) => item.value === value);
    if (selectedKhach) {
      form.setFieldsValue({
        ten_kh: selectedKhach.ten_kh,
        dia_chi: selectedKhach.dia_chi,
      });
    }
  };

  const handleSave = async () => {
    // API create/update đã bị xóa - chỉ giữ lại 4 API mới
    message.warning("Chức năng tạo/cập nhật phiếu giao hàng đã bị vô hiệu hóa. Chỉ hỗ trợ xem và cập nhật trạng thái.");
    return;

    // Code cũ đã bị comment
    /*
    try {
      const formValues = await form.validateFields();

      // Validate data source
      const validation = validateDataSource(dataSource);
      if (!validation.isValid) {
        return;
      }

      // Convert date
      if (formValues.ngay_ct) {
        formValues.ngay_ct = formValues.ngay_ct.format("YYYY-MM-DD");
      }

      // Build payload
      const payload = buildPhieuGiaoHangPayload(
        formValues,
        dataSource,
        sctRec && sctRec !== "0" ? "update" : "create"
      );

      setLoading(true);

      let result;
      if (sctRec && sctRec !== "0") {
        // Update mode
        result = await updatePhieuGiaoHang(payload, userInfo);
      } else {
        // Create mode
        result = await createPhieuGiaoHang(payload, userInfo);
      }

      if (result.success) {
        setTimeout(() => {
          navigate(returnUrl);
        }, 500);
      }
    } catch (error) {
      console.error("Error saving phieu giao hang:", error);
      message.error("Vui lòng kiểm tra lại thông tin");
    } finally {
      setLoading(false);
    }
    */
  };

  const handleBack = () => {
    navigate(returnUrl);
  };

  const handleImageUpload = ({ fileList }) => {
    setImageList(fileList);
  };


  const handleStatusAction = (action) => {
    setStatusAction(action);
    setStatusModalVisible(true);
  };

  const handleStatusConfirm = async () => {
    // Validation: chỉ "Đã tiếp nhận", "Xuất hàng", và "Lưu kho" không bắt buộc ghi chú
    if (!statusNote && statusAction !== "tiep_nhan" && statusAction !== "xuat_hang" && statusAction !== "luu_kho") {
      message.error("Vui lòng nhập ghi chú");
      return;
    }

    try {
      // Map action sang status code theo đúng workflow tuần tự (mapping mới: 1-7)
      // 1: Lập chứng từ, 2: Lưu kho, 3: Xuất hàng, 4: Đã tiếp nhận, 5: Bàn giao ĐVVC, 6: Hoàn thành, 7: Thất bại
      const statusMap = {
        luu_kho: "2",      // Lưu kho
        xuat_hang: "3",    // Xuất hàng
        tiep_nhan: "4",    // Đã tiếp nhận
        ban_giao: "5",     // Bàn giao ĐVVC
        hoan_thanh: "6",   // Hoàn thành
        that_bai: "7",     // Thất bại
      };

      const newStatus = statusMap[statusAction];
      if (!newStatus) {
        message.error("Trạng thái không hợp lệ");
        return;
      }

      // Lấy unitCode từ userInfo hoặc phieuData
      const unitsResponse = JSON.parse(localStorage.getItem("unitsResponse") || "{}");
      let unitCode = phieuData?.ma_dvs?.trim() || unitsResponse.unitCode?.trim() || userInfo?.ma_dvcs?.trim() || "TAPMED";
      unitCode = unitCode.trim();

      // Gọi API update status
      const result = await updateDeliveryStatus({
        unitCode: unitCode,
        voucherId: phieuData?.stt_rec || form.getFieldValue("stt_rec"),
        VoucherDate: phieuData?.ngay_ct 
          ? dayjs(phieuData.ngay_ct).format("YYYY-MM-DD") 
          : form.getFieldValue("ngay_ct") 
            ? dayjs(form.getFieldValue("ngay_ct")).format("YYYY-MM-DD")
            : dayjs().format("YYYY-MM-DD"),
        newStatus: newStatus,
        note: statusNote || "",
      });

      if (result.success) {
        // Update status in form
        form.setFieldsValue({ status: newStatus });
        
        // Update phieuData
        if (phieuData) {
          setPhieuData({ ...phieuData, status: newStatus });
        }

        // Add to log
        const newLog = {
          action: getStatusActionText(statusAction),
          note: statusNote,
          time: dayjs().format("YYYY-MM-DD HH:mm:ss"),
          user: userInfo?.userName || userInfo?.Name || "User",
        };
        setLogStatus([...logStatus, newLog]);

        setStatusModalVisible(false);
        setStatusNote("");
        
        // Reload data để lấy log mới nhất
        if (sctRec && sctRec !== "0") {
          await loadPhieuData();
        }
      }
    } catch (error) {
      console.error("Error updating status:", error);
      message.error("Có lỗi xảy ra khi cập nhật trạng thái!");
    }
  };

  const getStatusActionText = (action) => {
    const map = {
      luu_kho: "Lưu kho",
      xuat_hang: "Xuất hàng",
      tiep_nhan: "Đã tiếp nhận",
      ban_giao: "Bàn giao ĐVVC",
      hoan_thanh: "Hoàn thành",
      that_bai: "Thất bại",
      an_xuat_hang: "ẩn xuất hàng",
      an_thiet_bi: "ẩn thiết bị",
      an_ban_giao_dvvc: "ẩn bàn giao ĐVVC",
      hoan_thanh_thiet_bi: "hoàn thành thiết bị",
      that_bai_thiet_bi: "thất bại thiết bị",
    };
    return map[action] || action;
  };

  const renderStatusButtons = () => {
    const currentStatus = String(form.getFieldValue("status") || phieuData?.status || "1");
    
    const buttons = [];
    
    // Workflow tuần tự - chỉ cho phép chuyển sang trạng thái tiếp theo:
    // 1 (Lập chứng từ) -> 2 (Lưu kho)
    // 2 (Lưu kho) -> 3 (Xuất hàng)
    // 3 (Xuất hàng) -> 4 (Đã tiếp nhận)
    // 4 (Đã tiếp nhận) -> 5 (Bàn giao ĐVVC)
    // 5 (Bàn giao ĐVVC) -> 6 (Hoàn thành) HOẶC 7 (Thất bại)
    
    if (currentStatus === "1") {
      // 1 (Lập chứng từ) -> 2 (Lưu kho)
      buttons.push(
        <button
          key="luu_kho"
          className="detail-giao-hang-status-btn store"
          onClick={() => handleStatusAction("luu_kho")}
        >
          <CheckCircleOutlined /> Lưu kho
        </button>
      );
    }
    
    if (currentStatus === "2") {
      // 2 (Lưu kho) -> 3 (Xuất hàng)
      buttons.push(
        <button
          key="xuat_hang"
          className="detail-giao-hang-status-btn export"
          onClick={() => handleStatusAction("xuat_hang")}
        >
          <ExportOutlined /> Xuất hàng
        </button>
      );
    }
    
    if (currentStatus === "3") {
      // 3 (Xuất hàng) -> 4 (Đã tiếp nhận)
      buttons.push(
        <button
          key="tiep_nhan"
          className="detail-giao-hang-status-btn receive"
          onClick={() => handleStatusAction("tiep_nhan")}
        >
          <CheckCircleOutlined /> Đã tiếp nhận
        </button>
      );
    }
    
    if (currentStatus === "4") {
      // 4 (Đã tiếp nhận) -> 5 (Bàn giao ĐVVC)
      buttons.push(
        <button
          key="ban_giao"
          className="detail-giao-hang-status-btn handover"
          onClick={() => handleStatusAction("ban_giao")}
        >
          <TruckOutlined /> Bàn giao ĐVVC
        </button>
      );
    }
    
    if (currentStatus === "5") {
      // 5 (Bàn giao ĐVVC) -> 6 (Hoàn thành) HOẶC 7 (Thất bại)
      buttons.push(
        <button
          key="hoan_thanh"
          className="detail-giao-hang-status-btn complete"
          onClick={() => handleStatusAction("hoan_thanh")}
        >
          <CheckCircleOutlined /> Hoàn thành
        </button>,
        <button
          key="that_bai"
          className="detail-giao-hang-status-btn fail"
          onClick={() => handleStatusAction("that_bai")}
        >
          <CloseCircleOutlined /> Thất bại
        </button>
      );
    }
    
    return buttons.length > 0 ? buttons : null;
  };

  const renderLogTimeline = () => {
    return (
      <Timeline>
        {logStatus.map((log, index) => (
          <Timeline.Item key={index} color={log.action === "that_bai" ? "red" : "green"}>
            <p><strong>{getStatusActionText(log.action)}</strong></p>
            <p>{log.note}</p>
            <p style={{ fontSize: "12px", color: "#999" }}>
              {dayjs(log.time).format("DD/MM/YYYY HH:mm:ss")} - {log.user}
            </p>
          </Timeline.Item>
        ))}
      </Timeline>
    );
  };

  const tabItems = [
    {
      key: "master",
      label: "Thông tin chính",
      children: (
        <div className="detail-giao-hang-tab-content">
          <div className="detail-giao-hang-form-section">
            <div className="detail-giao-hang-form-grid">
              <PhieuGiaoHangFormInputs
                form={form}
                isEditMode={isEditMode}
                maGiaoDichList={maGiaoDichList}
                maKhoList={maKhoList}
                maKhachList={maKhachList}
                loadingMaKho={loadingMaKho}
                loadingMaKhach={loadingMaKhach}
                onMaKhoSearch={fetchMaKhoListDebounced}
                onMaKhachSearch={fetchMaKhachListDebounced}
                onMaKhachSelect={handleMaKhachSelect}
                phieuData={phieuData}
              />
            </div>
            
            <div className="detail-giao-hang-upload-section">
              <div className="detail-giao-hang-upload-title">Upload ảnh</div>
              <Upload
                className="detail-giao-hang-upload"
                listType="picture-card"
                fileList={imageList}
                onChange={handleImageUpload}
                beforeUpload={() => false}
              >
                {imageList.length >= 8 ? null : (
                  <div>
                    <CameraOutlined />
                    <div style={{ marginTop: 8 }}>Upload</div>
                  </div>
                )}
              </Upload>
            </div>

            {renderStatusButtons() && (
              <div className="detail-giao-hang-status-buttons">
                <div className="detail-giao-hang-status-title">Trạng thái xử lý</div>
                {renderStatusButtons()}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "log",
      label: "Log trạng thái",
      children: (
        <div className="detail-giao-hang-tab-content">
          <div className="detail-giao-hang-log-section">
            <div className="detail-giao-hang-log-title">Lịch sử xử lý</div>
            {logStatus.length === 0 ? (
              <div className="detail-giao-hang-log-empty">Chưa có lịch sử xử lý</div>
            ) : (
              <Timeline className="detail-giao-hang-timeline">
                {logStatus.map((log, index) => (
                  <Timeline.Item 
                    key={index}
                    color={index === logStatus.length - 1 ? "blue" : "gray"}
                  >
                    <div className="detail-giao-hang-timeline-item">
                      <div className="detail-giao-hang-timeline-header">
                        <span className="detail-giao-hang-timeline-action">{log.action || log.statusName || ""}</span>
                        <span className="detail-giao-hang-timeline-time">
                          {log.time ? dayjs(log.time).format("DD/MM/YYYY HH:mm") : ""}
                        </span>
                      </div>
                      {log.user && (
                        <div className="detail-giao-hang-timeline-user">Bởi: {log.user}</div>
                      )}
                      {log.note && (
                        <div className="detail-giao-hang-timeline-note">Ghi chú: {log.note}</div>
                      )}
                    </div>
                  </Timeline.Item>
                ))}
              </Timeline>
            )}
          </div>
        </div>
      ),
    },
  ];

  if (loading && !phieuData) {
    return (
      <div className="detail-giao-hang-container">
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
          <Spin size="large" />
        </div>
      </div>
    );
  }

  return (
    <div className="detail-giao-hang-container">
      {/* Header */}
      <div className="detail-giao-hang-header">
        <div className="detail-giao-hang-header-content">
          <button className="detail-giao-hang-back-btn" onClick={handleBack}>
            <LeftOutlined />
          </button>
          <h1 className="detail-giao-hang-title">
            {sctRec && sctRec !== "0" ? "CHI TIẾT GIAO HÀNG" : "TẠO MỚI"}
          </h1>
          <div className="detail-giao-hang-actions">
            {/* Không có action buttons - chỉ xem */}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="detail-giao-hang-content">
        <div className="detail-giao-hang-tabs">
          <Form form={form} layout="vertical">
            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              items={tabItems}
            />
          </Form>
        </div>
      </div>

      {/* Status Action Confirmation Modal */}
      <Modal
        title={`Xác nhận ${getStatusActionText(statusAction)}`}
        open={statusModalVisible}
        onOk={handleStatusConfirm}
        onCancel={() => {
          setStatusModalVisible(false);
          setStatusNote("");
        }}
        okText="Xác nhận"
        cancelText="Hủy"
      >
        <Form layout="vertical">
          <Form.Item label="Ghi chú" required={statusAction !== "tiep_nhan"}>
            <TextArea
              rows={4}
              value={statusNote}
              onChange={(e) => setStatusNote(e.target.value)}
              placeholder="Nhập ghi chú..."
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DetailPhieuGiaoHang;
