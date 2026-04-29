import {
  BarcodeOutlined,
  CameraOutlined,
  CloseOutlined,
  KeyOutlined,
  QrcodeOutlined,
} from "@ant-design/icons";
import { Alert, Button, Card, Input, Modal, Space, notification } from "antd";
import { Html5Qrcode } from "html5-qrcode";
import React, { useCallback, useEffect, useRef, useState } from "react";
import notificationManager from "../../../utils/notificationManager";
import "./QRScanner.css";

const QRScanner = ({ isOpen, onClose, onScanSuccess, onSwitchToBarcode, openWithCamera = false }) => {
  const [scanner, setScanner] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const [cameraErrorMsg, setCameraErrorMsg] = useState("");
  const [manualInput, setManualInput] = useState("");
  const [showManualInput, setShowManualInput] = useState(false);
  const [scanMode, setScanMode] = useState(null); // 'camera' hoặc 'barcode'
  const scannerRef = useRef(null);
  const scannerInstanceRef = useRef(null);
  const lastScannedCodeRef = useRef({ code: "", timestamp: 0 });
  const isProcessingRef = useRef(false);
  const hasProcessedRef = useRef(false);

  // Đồng bộ scanner instance vào ref để cleanup luôn dùng giá trị mới nhất
  useEffect(() => {
    scannerInstanceRef.current = scanner;
  }, [scanner]);

  // Hàm cleanup camera streams
  const cleanupCameraStreams = () => {
    try {
      // Cleanup tất cả media tracks từ các video elements
      const videoElements = document.querySelectorAll('video');
      videoElements.forEach((video) => {
        if (video.srcObject) {
          const stream = video.srcObject;
          stream.getTracks().forEach((track) => {
            track.stop();
          });
          video.srcObject = null;
        }
      });
      
      // Cleanup các tracks từ qr-reader element
      const qrReaderElement = document.getElementById('qr-reader');
      if (qrReaderElement) {
        const videoInQrReader = qrReaderElement.querySelector('video');
        if (videoInQrReader && videoInQrReader.srcObject) {
          const stream = videoInQrReader.srcObject;
          stream.getTracks().forEach((track) => {
            track.stop();
          });
          videoInQrReader.srcObject = null;
        }
      }
    } catch (error) {
      console.error("Error cleaning up camera streams:", error);
    }
  };

  // Hàm cleanup scanner và camera (sync version cho useEffect cleanup)
  const cleanupScannerSync = useCallback(() => {
    const currentScanner = scannerInstanceRef.current;
    if (currentScanner) {
      try {
        if (currentScanner.getState && currentScanner.getState() === 2) {
          currentScanner.stop().catch((error) => {
            console.error("Error stopping scanner:", error);
          });
        }
        currentScanner.clear();
      } catch (error) {
        console.error("Error clearing scanner:", error);
      }
      scannerInstanceRef.current = null;
      setScanner(null);
    }
    setIsScanning(false);
    cleanupCameraStreams();
  }, []);

  // Hàm cleanup scanner và camera (async version cho các trường hợp khác)
  const cleanupScanner = async () => {
    cleanupScannerSync();
    // Đợi một chút để đảm bảo camera stream được giải phóng
    await new Promise(resolve => setTimeout(resolve, 200));
  };

  useEffect(() => {
    if (isOpen) {
      // Reset state khi mở modal
      // Nếu openWithCamera = true, trực tiếp set scanMode = "camera"
      setScanMode(openWithCamera ? "camera" : null);
      setCameraError(false);
      setCameraErrorMsg("");
      setManualInput("");
      setShowManualInput(false);
      // Reset refs khi mở modal
      lastScannedCodeRef.current = { code: "", timestamp: 0 };
      isProcessingRef.current = false;
      hasProcessedRef.current = false;
      // Cleanup scanner và camera trước khi mở lại (sync để không block)
      cleanupScannerSync();
    }

    return () => {
      // Cleanup khi đóng modal (sync vì return function không thể async)
      cleanupScannerSync();
      // Reset refs khi đóng modal
      lastScannedCodeRef.current = { code: "", timestamp: 0 };
      isProcessingRef.current = false;
      hasProcessedRef.current = false;
    };
  }, [isOpen, openWithCamera, cleanupScannerSync]);

  // Giải phóng camera khi tab bị ẩn – tránh xung đột khi mở nhiều tab
  useEffect(() => {
    if (!isOpen || scanMode !== "camera" || !scanner) return;
    const handleVisibilityChange = () => {
      if (document.hidden) {
        cleanupScannerSync();
        setCameraError(true);
        setCameraErrorMsg(
          "Camera đã tạm dừng (tab không active). Bấm Thử lại để tiếp tục quét."
        );
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [isOpen, scanMode, scanner, cleanupScannerSync]);

  const initializeScanner = useCallback(async () => {
    try {
      // Ưu tiên camera sau (environment) – sau khi cấp quyền sẽ mở thẳng cam sau trên mobile
      const videoConstraints = { facingMode: "environment" };
      const scanConfig = {
        fps: 5,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      };

      const html5Qrcode = new Html5Qrcode("qr-reader", { verbose: false });
      hasProcessedRef.current = false;

      await html5Qrcode.start(
        videoConstraints,
        scanConfig,
        (decodedText, decodedResult) => {
          if (isProcessingRef.current || hasProcessedRef.current) return;

          const now = Date.now();
          const trimmedCode = decodedText.trim();
          if (
            lastScannedCodeRef.current.code === trimmedCode &&
            now - lastScannedCodeRef.current.timestamp < 3000
          ) {
            return;
          }

          isProcessingRef.current = true;
          hasProcessedRef.current = true;

          const stopAndNotify = async () => {
            try {
              await html5Qrcode.stop();
            } catch (e) {
              console.error("Error stopping scanner:", e);
            }
            html5Qrcode.clear();
            setScanner(null);
            setIsScanning(false);
            cleanupCameraStreams();
            lastScannedCodeRef.current = { code: trimmedCode, timestamp: now };
            onClose();
            onScanSuccess(trimmedCode, decodedResult);
            setTimeout(() => {
              isProcessingRef.current = false;
              hasProcessedRef.current = false;
            }, 3000);
          };

          stopAndNotify();
        },
        onScanError
      );

      scannerInstanceRef.current = html5Qrcode;
      setScanner(html5Qrcode);
      setIsScanning(true);
      setCameraError(false);
    } catch (error) {
      console.error("Error initializing QR scanner:", error);
      setCameraError(true);
      setIsScanning(false);
      const errName = error?.name || "";
      const isInUse = errName === "NotReadableError" || errName === "OverconstrainedError"
        || (error?.message && /in use|in use by|being used/i.test(error.message));
      const msg = isInUse
        ? "Camera đang được sử dụng bởi tab/ứng dụng khác. Hãy đóng tab khác đang quét QR rồi bấm Thử lại."
        : "Vui lòng cho phép truy cập camera hoặc sử dụng nhập mã thủ công.";
      setCameraErrorMsg(msg);
      notification.warning({
        message: "Không thể truy cập camera",
        description: msg,
      });
    }
  }, [onClose, onScanSuccess]);

  const onScanError = (error) => {
    // Chỉ log error, không hiển thị notification để tránh spam
  };

  const handleClose = async () => {
    await cleanupScanner();
    setScanMode(null);
    setCameraError(false);
    setManualInput("");
    setShowManualInput(false);
    onClose();
  };

  const handleManualInput = () => {
    if (manualInput.trim()) {
      // Chống spam cho manual input
      if (isProcessingRef.current) {
        return;
      }
      
      const trimmedCode = manualInput.trim();
      
      // Đánh dấu đang xử lý
      isProcessingRef.current = true;
      
      // Đóng modal
      onClose();
      
      // Gọi callback với kết quả
      handleScanSuccess(trimmedCode);
      
      // Reset processing flag sau 3 giây
      setTimeout(() => {
        isProcessingRef.current = false;
      }, 3000);
    } else {
      notification.warning({
        message: "Vui lòng nhập mã",
        description: "Mã không được để trống.",
      });
    }
  };

  const handleRetryCamera = async () => {
    setCameraError(false);
    setCameraErrorMsg("");
    setShowManualInput(false);
    setManualInput("");
    await cleanupScanner();
    // Đợi camera được giải phóng từ tab khác (nếu có)
    setTimeout(() => {
      initializeScanner();
    }, 500);
  };

  // Khởi tạo camera khi chọn mode camera
  useEffect(() => {
    if (scanMode === "camera" && !scanner && !cameraError && isOpen) {
      const timer = setTimeout(() => {
        initializeScanner();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [scanMode, isOpen, scanner, cameraError, initializeScanner]);

  const handleScanSuccess = (decodedText, decodedResult) => {
    // Chỉ gọi callback onScanSuccess - tất cả logic đã được xử lý trong render callback
    // Notification đã được hiển thị trong render callback
    onScanSuccess(decodedText, decodedResult);
  };

  return (
    <Modal
      title={
        <div className="qr-scanner-header">
          <QrcodeOutlined className="qr-icon" />
          <span>Quét mã sản phẩm</span>
        </div>
      }
      open={isOpen}
      onCancel={handleClose}
      footer={null}
      width={600}
      centered
      destroyOnHidden
      className="qr-scanner-modal"
    >
      <div className="qr-scanner-content">
        {!scanMode ? (
          // Màn hình chọn phương thức quét
          <div className="scan-mode-selection">
            <div className="scan-mode-instructions">
              <p>Chọn phương thức quét mã sản phẩm:</p>
            </div>

            <Space direction="vertical" size="large" style={{ width: "100%" }}>
              <Card
                hoverable
                className="scan-mode-card"
                onClick={() => setScanMode("camera")}
              >
                <div className="scan-mode-content">
                  <CameraOutlined className="scan-mode-icon" />
                  <div className="scan-mode-text">
                    <h3>Quét bằng camera</h3>
                    <p>Sử dụng camera để quét mã QR/Bar code</p>
                  </div>
                </div>
              </Card>

              <Card
                hoverable
                className="scan-mode-card"
                onClick={() => {
                  // Đóng modal và chuyển về màn hình bên ngoài
                  onClose();
                  // Gọi callback để chuyển đổi mode barcode
                  if (onSwitchToBarcode) {
                    onSwitchToBarcode();
                  }
                }}
              >
                <div className="scan-mode-content">
                  <BarcodeOutlined className="scan-mode-icon" />
                  <div className="scan-mode-text">
                    <h3>Quét barcode</h3>
                    <p>
                      Chuyển về màn hình nhập mã để sử dụng máy quét barcode
                    </p>
                  </div>
                </div>
              </Card>
            </Space>
          </div>
        ) : scanMode === "camera" ? (
          // Màn hình quét camera
          <div>
            <div className="qr-scanner-instructions">
              <p>Đặt mã QR/Bar code vào khung hình để quét</p>
              <p className="qr-hint">Đảm bảo mã rõ ràng và đủ ánh sáng</p>
            </div>

            {cameraError ? (
              <div className="qr-scanner-error">
                <Alert
                  message="Không thể truy cập camera"
                  description={cameraErrorMsg || "Vui lòng kiểm tra quyền truy cập camera hoặc sử dụng nhập mã thủ công."}
                  type="warning"
                  showIcon
                  style={{ marginBottom: 16 }}
                />

                <div className="camera-permission-help">
                  <h4>Hướng dẫn cấp quyền camera:</h4>
                  <ul>
                    <li>
                      <strong>Chrome:</strong> Click vào biểu tượng camera bị
                      chặn trên thanh địa chỉ → Chọn "Cho phép"
                    </li>
                    <li>
                      <strong>Safari:</strong> Safari → Preferences → Websites
                      → Camera → Chọn "Allow"
                    </li>
                    <li>
                      <strong>Firefox:</strong> Click vào biểu tượng camera →
                      Chọn "Cho phép"
                    </li>
                    <li>
                      <strong>Mobile:</strong> Vào Settings → Privacy → Camera
                      → Bật cho ứng dụng web
                    </li>
                  </ul>
                </div>

                <Space direction="vertical" style={{ width: "100%" }}>
                  <Button
                    type="primary"
                    icon={<CameraOutlined />}
                    onClick={handleRetryCamera}
                    style={{ width: "100%" }}
                  >
                    Thử lại camera
                  </Button>

                    <Button
                      type="default"
                      icon={<KeyOutlined />}
                      onClick={async () => {
                        await cleanupScanner();
                        setScanMode("barcode");
                      }}
                      style={{ width: "100%" }}
                    >
                      Chuyển sang nhập mã thủ công
                    </Button>
                </Space>
              </div>
            ) : (
              <div className="qr-scanner-container">
                <div id="qr-reader" ref={scannerRef}></div>

                {!isScanning && (
                  <div className="qr-scanner-placeholder">
                    <QrcodeOutlined className="qr-placeholder-icon" />
                    <p>Đang khởi tạo camera...</p>
                  </div>
                )}

                {isScanning && (
                  <div className="qr-retry-fallback">
                    <p className="qr-hint">Nếu không thấy hình camera, hãy bấm Thử lại</p>
                    <Button
                      type="default"
                      size="small"
                      icon={<CameraOutlined />}
                      onClick={handleRetryCamera}
                    >
                      Thử lại camera
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : scanMode === "barcode" ? (
          // Màn hình nhập mã thủ công
          <div className="manual-input-section">
            <div className="qr-scanner-instructions">
              <p>Nhập mã sản phẩm thủ công</p>
              <p className="qr-hint">Nhập mã QR/Bar code vào ô bên dưới</p>
            </div>

            <Space direction="vertical" style={{ width: "100%" }} size="large">
              <Input
                placeholder="Nhập mã sản phẩm..."
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                onPressEnter={handleManualInput}
                size="large"
                autoFocus
                allowClear
              />

              <Button
                type="primary"
                icon={<KeyOutlined />}
                onClick={handleManualInput}
                style={{ width: "100%" }}
                size="large"
              >
                Xác nhận
              </Button>
            </Space>
          </div>
        ) : null}

        <div className="qr-scanner-actions">
          {scanMode && (
            <Button
              type="default"
              onClick={openWithCamera ? handleClose : () => setScanMode(null)}
            >
              Quay lại
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default QRScanner;
