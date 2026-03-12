import {
  BarcodeOutlined,
  CameraOutlined,
  CloseOutlined,
  KeyOutlined,
  QrcodeOutlined,
} from "@ant-design/icons";
import { Alert, Button, Card, Modal, Space, notification } from "antd";
import { Html5QrcodeScanner } from "html5-qrcode";
import React, { useCallback, useEffect, useRef, useState } from "react";
import notificationManager from "../../../utils/notificationManager";
import "./QRScanner.css";

const QRScanner = ({ isOpen, onClose, onScanSuccess, onSwitchToBarcode, openWithCamera = false }) => {
  const [scanner, setScanner] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const [manualInput, setManualInput] = useState("");
  const [showManualInput, setShowManualInput] = useState(false);
  const [scanMode, setScanMode] = useState(null); // 'camera' hoặc 'barcode'
  const scannerRef = useRef(null);
  const lastScannedCodeRef = useRef({ code: "", timestamp: 0 });
  const isProcessingRef = useRef(false);
  const hasProcessedRef = useRef(false);

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
    if (scanner) {
      try {
        scanner.clear();
      } catch (error) {
        console.error("Error clearing scanner:", error);
      }
      setScanner(null);
    }
    setIsScanning(false);
    // Cleanup camera streams
    cleanupCameraStreams();
  }, [scanner]);

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

  const handleScanSuccess = useCallback(
    (decodedText, decodedResult) => {
      // Chỉ gọi callback onScanSuccess - tất cả logic đã được xử lý trong render callback
      // Notification đã được hiển thị trong render callback
      onScanSuccess(decodedText, decodedResult);
    },
    [onScanSuccess]
  );

  const onScanError = (error) => {
    // Chỉ log error, không hiển thị notification để tránh spam
  };

  const initializeScanner = useCallback(() => {
    try {
      // Kiểm tra quyền truy cập camera trước
      navigator.mediaDevices
        .getUserMedia({
          video: {
            facingMode: "environment", // Ưu tiên camera sau trên mobile
          },
        })
        .then((stream) => {
          // Có quyền truy cập camera, tiếp tục khởi tạo scanner
          stream.getTracks().forEach((track) => track.stop()); // Dừng stream test

          const html5QrcodeScanner = new Html5QrcodeScanner(
            "qr-reader",
            {
              fps: 5, // Giảm fps để giảm số lần quét và tránh spam
              qrbox: { width: 250, height: 250 },
              aspectRatio: 1.0,
              rememberLastUsedCamera: true,
            },
            false
          );

          // Wrapper để đảm bảo chỉ gọi handleScanSuccess một lần
          hasProcessedRef.current = false;
          html5QrcodeScanner.render((decodedText, decodedResult) => {
            // Kiểm tra nếu đang xử lý - chặn ngay lập tức
            if (isProcessingRef.current || hasProcessedRef.current) {
              return;
            }

            const now = Date.now();
            const trimmedCode = decodedText.trim();
            
            // Kiểm tra nếu mã này vừa được quét trong vòng 3 giây
            if (
              lastScannedCodeRef.current.code === trimmedCode &&
              now - lastScannedCodeRef.current.timestamp < 3000
            ) {
              return; // Bỏ qua nếu là mã trùng lặp
            }

            // Đánh dấu NGAY LẬP TỨC để chặn các callback tiếp theo
            isProcessingRef.current = true;
            hasProcessedRef.current = true;
            
            // Hiển thị notification chỉ 1 lần
            notificationManager.showNotificationOnce(
              trimmedCode,
              "Quét QR thành công",
              `Đã quét được mã: ${trimmedCode}`
            );

            // Dừng scanner NGAY LẬP TỨC để tránh callback tiếp theo
            try {
              html5QrcodeScanner.clear();
            } catch (error) {
              console.error("Error clearing scanner in render:", error);
            }
            setScanner(null);
            setIsScanning(false);
            // Cleanup camera streams
            cleanupCameraStreams();

            // Đánh dấu đã xử lý mã này
            lastScannedCodeRef.current = {
              code: trimmedCode,
              timestamp: now,
            };

            // Đóng modal
            onClose();

            // Gọi callback với kết quả quét được
            handleScanSuccess(trimmedCode, decodedResult);

            // Reset processing flag sau 3 giây để cho phép quét mã mới
            setTimeout(() => {
              isProcessingRef.current = false;
              hasProcessedRef.current = false;
            }, 3000);
          }, onScanError);
          setScanner(html5QrcodeScanner);
          setIsScanning(true);
          setCameraError(false);
        })
        .catch((error) => {
          console.error("Camera permission denied:", error);
          setCameraError(true);
          setIsScanning(false);
          notification.warning({
            message: "Không thể truy cập camera",
            description:
              "Vui lòng cho phép truy cập camera hoặc sử dụng nhập mã thủ công.",
          });
        });
    } catch (error) {
      console.error("Error initializing QR scanner:", error);
      setCameraError(true);
      setIsScanning(false);
      notification.error({
        message: "Lỗi khởi tạo camera",
        description:
          "Không thể truy cập camera. Vui lòng kiểm tra quyền truy cập camera.",
      });
    }
  }, [onClose, handleScanSuccess]);


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
      handleScanSuccess(manualInput.trim());
    } else {
      notification.warning({
        message: "Vui lòng nhập mã",
        description: "Mã không được để trống.",
      });
    }
  };

  const handleRetryCamera = async () => {
    setCameraError(false);
    setShowManualInput(false);
    setManualInput("");
    await cleanupScanner();
    // Đợi lâu hơn để đảm bảo camera stream được giải phóng hoàn toàn
    setTimeout(() => {
      initializeScanner();
    }, 300);
  };

  // Khởi tạo camera khi chọn mode camera
  useEffect(() => {
    if (scanMode === "camera" && !scanner && !cameraError && isOpen) {
      // Đợi một chút để đảm bảo DOM đã sẵn sàng và camera stream cũ đã được giải phóng
      const timer = setTimeout(() => {
        initializeScanner();
      }, 300);
      
      return () => {
        clearTimeout(timer);
      };
    }
  }, [scanMode, isOpen, scanner, cameraError, initializeScanner]);


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
        ) : (
          scanMode === "camera" && (
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
                    description="Vui lòng kiểm tra quyền truy cập camera hoặc sử dụng nhập mã thủ công."
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
                      onClick={() => setScanMode("barcode")}
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
                </div>
              )}
            </div>
          )
        )}

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
