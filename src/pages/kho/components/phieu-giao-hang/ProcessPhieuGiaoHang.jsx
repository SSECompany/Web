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
import { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import "./ProcessPhieuGiaoHang.css";
import { 
  fetchPhieuGiaoHangData, 
  fetchPhieuGiaoHangDataByQR,
  fetchPhieuGiaoHangDataByView,
  updateDeliveryStatus 
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
  
  // Upload images cho 4 mốc
  const [images, setImages] = useState({
    xuatHang: [],
    tiepNhan: [],
    banGiao: [],
    hoanThanh: [],
  });

  // Modal states
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmNote, setConfirmNote] = useState("");
  const [confirmCost, setConfirmCost] = useState(0);
  
  // Edit transport modal
  const [showEditTransport, setShowEditTransport] = useState(false);
  const [transportInfo, setTransportInfo] = useState({
    ten_nha_xe: "",
    sdt_nha_xe: "",
    gio_chay: "",
  });

  // Fetch data
  const fetchData = useCallback(async () => {
    if (!id) return;

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
        setPhieuData(result.master);
        setDetailData(result.detail || []);
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
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      message.error("Không thể tải dữ liệu phiếu");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
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

  // Check which buttons should be visible based on status - Workflow tuần tự
  // 1 (Lập chứng từ) -> 2 (Lưu kho)
  // 2 (Lưu kho) -> 3 (Xuất hàng)
  // 3 (Xuất hàng) -> 4 (Đã tiếp nhận)
  // 4 (Đã tiếp nhận) -> 5 (Bàn giao ĐVVC)
  // 5 (Bàn giao ĐVVC) -> 6 (Hoàn thành) hoặc 7 (Thất bại)
  const currentStatus = String(phieuData?.status || "1");
  const canStore = currentStatus === "1";      // 1 -> 2
  const canExport = currentStatus === "2";     // 2 -> 3
  const canReceive = currentStatus === "3";    // 3 -> 4
  const canHandover = currentStatus === "4";   // 4 -> 5
  const canComplete = currentStatus === "5";   // 5 -> 6
  const canFail = currentStatus === "5";       // 5 -> 7

  // Handle action button click
  const handleAction = (action) => {
    setConfirmAction(action);
    setConfirmNote("");
    setConfirmCost(0);
    setShowConfirmModal(true);
  };

  // Confirm action
  const handleConfirmAction = async () => {
    if (!confirmAction || !phieuData) return;

    try {
      // Map action sang status code theo mapping mới
      // 1: Lập chứng từ, 2: Lưu kho, 3: Xuất hàng, 4: Đã tiếp nhận, 5: Bàn giao ĐVVC, 6: Hoàn thành, 7: Thất bại
      const statusMap = {
        store: "2",      // Lưu kho
        export: "3",    // Xuất hàng
        receive: "4",   // Đã tiếp nhận
        handover: "5",  // Bàn giao ĐVVC
        complete: "6",  // Hoàn thành
        fail: "7",      // Thất bại
      };

      const newStatus = statusMap[confirmAction];
      if (!newStatus) {
        message.error("Trạng thái không hợp lệ");
        return;
      }

      // Lấy unitCode từ userInfo hoặc phieuData
      const unitsResponse = JSON.parse(localStorage.getItem("unitsResponse") || "{}");
      // Ưu tiên: phieuData.ma_dvs -> unitsResponse.unitCode -> userInfo.ma_dvcs -> "TAPMED"
      let unitCode = phieuData.ma_dvs?.trim() || unitsResponse.unitCode?.trim() || userInfo?.ma_dvcs?.trim() || "TAPMED";
      // Đảm bảo unitCode không có khoảng trắng thừa
      unitCode = unitCode.trim();

      // Gọi API update status
      const result = await updateDeliveryStatus({
        unitCode: unitCode,
        voucherId: phieuData.stt_rec,
        VoucherDate: phieuData.ngay_ct ? dayjs(phieuData.ngay_ct).format("YYYY-MM-DD") : dayjs().format("YYYY-MM-DD"),
        newStatus: newStatus,
        note: confirmNote || "",
      });

      if (result.success) {
        // Update local status
        setPhieuData(prev => ({ ...prev, status: newStatus }));
        
        // Add to status log
        setStatusLog(prev => [...prev, {
          time: dayjs().format("YYYY-MM-DD HH:mm:ss"),
          action: getActionText(confirmAction),
          user: userInfo?.userName || userInfo?.Name || "User",
          note: confirmNote,
          cost: confirmAction === "handover" ? confirmCost : undefined,
        }]);

        // Refresh data để lấy log mới nhất
        await fetchData();
        
        setShowConfirmModal(false);
      }
    } catch (error) {
      console.error("Error updating status:", error);
      message.error("Có lỗi xảy ra khi cập nhật trạng thái!");
    }
  };

  const getActionText = (action) => {
    switch (action) {
      case "store": return "Lưu kho";
      case "export": return "Xuất hàng";
      case "receive": return "Đã tiếp nhận";
      case "handover": return "Bàn giao ĐVVC";
      case "complete": return "Hoàn thành";
      case "fail": return "Thất bại";
      default: return "";
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case "store": return "#faad14";
      case "export": return "#1890ff";
      case "receive": return "#722ed1";
      case "handover": return "#13c2c2";
      case "complete": return "#52c41a";
      case "fail": return "#ff4d4f";
      default: return "#1890ff";
    }
  };

  // Handle image upload
  const handleImageUpload = (milestone, { fileList }) => {
    setImages(prev => ({ ...prev, [milestone]: fileList }));
  };

  // Handle transport edit
  const handleSaveTransport = () => {
    // TODO: Call API to update transport info
    message.success("Cập nhật thông tin vận chuyển thành công!");
    setShowEditTransport(false);
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
          <Tag color={getStatusColor(phieuData?.status)}>
            {getStatusText(phieuData?.status)}
          </Tag>
        </div>
        <div className="process-info-grid">
          <div className="process-info-item">
            <span className="process-info-label">Số CT</span>
            <span className="process-info-value highlight">{phieuData?.so_ct || "---"}</span>
          </div>
          <div className="process-info-item">
            <span className="process-info-label">Ngày CT</span>
            <span className="process-info-value">
              {phieuData?.ngay_ct ? dayjs(phieuData.ngay_ct).format("DD/MM/YYYY") : "---"}
            </span>
          </div>
        </div>
      </Card>

      {/* Đơn hàng info */}
      <Card className="process-card" size="small">
        <div className="process-card-header">
          <FileTextOutlined className="process-card-icon order" />
          <span className="process-card-title">Đơn hàng</span>
        </div>
        <div className="process-info-grid">
          <div className="process-info-item">
            <span className="process-info-label">Số đơn hàng</span>
            <span className="process-info-value">{phieuData?.so_don_hang || "---"}</span>
          </div>
          <div className="process-info-item">
            <span className="process-info-label">Ngày đơn hàng</span>
            <span className="process-info-value">
              {phieuData?.ngay_don_hang ? dayjs(phieuData.ngay_don_hang).format("DD/MM/YYYY") : "---"}
            </span>
          </div>
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
          <Button 
            type="text" 
            icon={<EditOutlined />} 
            size="small"
            onClick={() => setShowEditTransport(true)}
          >
            Sửa
          </Button>
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
        </div>
      </Card>

      {/* Tổng số kiện */}
      <Card className="process-card process-card-highlight" size="small">
        <div className="process-card-header">
          <GiftOutlined className="process-card-icon package" />
          <span className="process-card-title">Tổng số kiện hàng theo đơn</span>
        </div>
        <div className="process-package-count">
          {phieuData?.tong_so_kien || detailData.length || 0} <span>kiện</span>
        </div>
      </Card>

      {/* Upload ảnh - 4 mốc xử lý */}
      <Card className="process-card" size="small">
        <div className="process-card-header">
          <PictureOutlined className="process-card-icon" />
          <span className="process-card-title">Upload ảnh (4 mốc xử lý)</span>
        </div>
        
        <div className="process-upload-section">
          {/* Xuất hàng */}
          <div className="process-upload-milestone">
            <div className="process-upload-label">
              <ExportOutlined /> Xuất hàng
            </div>
            <Upload
              listType="picture-card"
              fileList={images.xuatHang}
              onChange={(info) => handleImageUpload("xuatHang", info)}
              beforeUpload={() => false}
              maxCount={4}
            >
              {images.xuatHang.length < 4 && (
                <div>
                  <CameraOutlined />
                  <div style={{ marginTop: 8 }}>Chụp ảnh</div>
                </div>
              )}
            </Upload>
          </div>

          {/* Tiếp nhận */}
          <div className="process-upload-milestone">
            <div className="process-upload-label">
              <CheckCircleOutlined /> Tiếp nhận
            </div>
            <Upload
              listType="picture-card"
              fileList={images.tiepNhan}
              onChange={(info) => handleImageUpload("tiepNhan", info)}
              beforeUpload={() => false}
              maxCount={4}
            >
              {images.tiepNhan.length < 4 && (
                <div>
                  <CameraOutlined />
                  <div style={{ marginTop: 8 }}>Chụp ảnh</div>
                </div>
              )}
            </Upload>
          </div>

          {/* Bàn giao DVVC */}
          <div className="process-upload-milestone">
            <div className="process-upload-label">
              <TruckOutlined /> Bàn giao DVVC
            </div>
            <Upload
              listType="picture-card"
              fileList={images.banGiao}
              onChange={(info) => handleImageUpload("banGiao", info)}
              beforeUpload={() => false}
              maxCount={4}
            >
              {images.banGiao.length < 4 && (
                <div>
                  <CameraOutlined />
                  <div style={{ marginTop: 8 }}>Chụp ảnh</div>
                </div>
              )}
            </Upload>
          </div>

          {/* Hoàn thành */}
          <div className="process-upload-milestone">
            <div className="process-upload-label">
              <CheckCircleOutlined style={{ color: "#52c41a" }} /> Hoàn thành
            </div>
            <Upload
              listType="picture-card"
              fileList={images.hoanThanh}
              onChange={(info) => handleImageUpload("hoanThanh", info)}
              beforeUpload={() => false}
              maxCount={4}
            >
              {images.hoanThanh.length < 4 && (
                <div>
                  <CameraOutlined />
                  <div style={{ marginTop: 8 }}>Chụp ảnh</div>
                </div>
              )}
            </Upload>
          </div>
        </div>
      </Card>

      {/* Log trạng thái */}
      <Card className="process-card" size="small">
        <div className="process-card-header">
          <HistoryOutlined className="process-card-icon" />
          <span className="process-card-title">Log trạng thái</span>
        </div>
        <Timeline className="process-timeline">
          {statusLog.map((log, index) => (
            <Timeline.Item 
              key={index}
              color={index === statusLog.length - 1 ? "blue" : "gray"}
            >
              <div className="process-timeline-item">
                <div className="process-timeline-header">
                  <span className="process-timeline-action">{log.action}</span>
                  <span className="process-timeline-time">{log.time}</span>
                </div>
                <div className="process-timeline-user">Bởi: {log.user}</div>
                {log.note && (
                  <div className="process-timeline-note">Ghi chú: {log.note}</div>
                )}
                {log.cost > 0 && (
                  <div className="process-timeline-cost">Chi phí: {log.cost.toLocaleString()}đ</div>
                )}
              </div>
            </Timeline.Item>
          ))}
        </Timeline>
      </Card>

      {/* Action buttons */}
      <div className="process-actions">
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

        {canHandover && (
          <Button
            type="primary"
            size="large"
            icon={<TruckOutlined />}
            className="process-action-btn handover"
            onClick={() => handleAction("handover")}
          >
            Bàn giao ĐVVC
          </Button>
        )}

        {canComplete && (
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

        {canFail && (
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
      </div>

      {/* Confirm Modal */}
      <Modal
        title={`Xác nhận ${getActionText(confirmAction)}`}
        open={showConfirmModal}
        onCancel={() => setShowConfirmModal(false)}
        footer={[
          <Button key="cancel" onClick={() => setShowConfirmModal(false)}>
            Không
          </Button>,
          <Button 
            key="confirm" 
            type="primary" 
            style={{ background: getActionColor(confirmAction) }}
            onClick={handleConfirmAction}
          >
            Có
          </Button>,
        ]}
      >
        <div className="process-confirm-content">
          <p style={{ fontSize: "16px", fontWeight: 600, marginBottom: "16px" }}>
            Có chắc chắn <strong style={{ color: getActionColor(confirmAction) }}>"{getActionText(confirmAction)}"</strong>?
          </p>
          
          {confirmAction === "handover" && (
            <div className="process-confirm-field">
              <label style={{ fontWeight: 600, marginBottom: "8px", display: "block" }}>Nhập Chi phí:</label>
              <InputNumber
                style={{ width: "100%" }}
                value={confirmCost}
                onChange={setConfirmCost}
                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
                placeholder="Nhập chi phí vận chuyển"
                addonAfter="đ"
                min={0}
                controls={false}
              />
            </div>
          )}

          <div className="process-confirm-field">
            <label style={{ fontWeight: 600, marginBottom: "8px", display: "block" }}>Nhập ghi chú:</label>
            <TextArea
              rows={3}
              value={confirmNote}
              onChange={(e) => setConfirmNote(e.target.value)}
              placeholder="Nhập ghi chú (nếu có)"
            />
          </div>
        </div>
      </Modal>

      {/* Edit Transport Modal */}
      <Modal
        title="Sửa thông tin vận chuyển"
        open={showEditTransport}
        onCancel={() => setShowEditTransport(false)}
        onOk={handleSaveTransport}
        okText="Lưu"
        cancelText="Hủy"
      >
        <div className="process-edit-transport">
          <div className="process-edit-field">
            <label>Tên nhà xe:</label>
            <Input
              value={transportInfo.ten_nha_xe}
              onChange={(e) => setTransportInfo(prev => ({ ...prev, ten_nha_xe: e.target.value }))}
              placeholder="Nhập tên nhà xe"
            />
          </div>
          <div className="process-edit-field">
            <label>Số điện thoại:</label>
            <Input
              value={transportInfo.sdt_nha_xe}
              onChange={(e) => setTransportInfo(prev => ({ ...prev, sdt_nha_xe: e.target.value }))}
              placeholder="Nhập số điện thoại"
            />
          </div>
          <div className="process-edit-field">
            <label>Giờ chạy:</label>
            <Input
              value={transportInfo.gio_chay}
              onChange={(e) => setTransportInfo(prev => ({ ...prev, gio_chay: e.target.value }))}
              placeholder="Nhập giờ chạy"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ProcessPhieuGiaoHang;
