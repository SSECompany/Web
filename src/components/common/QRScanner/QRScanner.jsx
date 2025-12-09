import {
  BarcodeOutlined,
  CameraOutlined,
  CloseOutlined,
  KeyOutlined,
  QrcodeOutlined,
} from "@ant-design/icons";
import { Alert, Button, Card, Modal, Space, notification } from "antd";
import { Html5QrcodeScanner } from "html5-qrcode";
import React, { useEffect, useRef, useState } from "react";
import "./QRScanner.css";

const QRScanner = ({ isOpen, onClose, onScanSuccess, onSwitchToBarcode, openWithCamera = false }) => {
  const [scanner, setScanner] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const [manualInput, setManualInput] = useState("");
  const [showManualInput, setShowManualInput] = useState(false);
  const [scanMode, setScanMode] = useState(null); // 'camera' hoặc 'barcode'
  const scannerRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      // Reset state khi mở modal
      // Nếu openWithCamera = true, trực tiếp set scanMode = "camera"
      setScanMode(openWithCamera ? "camera" : null);
      setCameraError(false);
      setManualInput("");
      setShowManualInput(false);
      if (scanner) {
        scanner.clear();
        setScanner(null);
      }
    }

    return () => {
      if (scanner) {
        scanner.clear();
        setScanner(null);
      }
    };
  }, [isOpen, openWithCamera]);

  const initializeScanner = () => {
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
              fps: 10,
              qrbox: { width: 250, height: 250 },
              aspectRatio: 1.0,
              rememberLastUsedCamera: true,
            },
            false
          );

          html5QrcodeScanner.render((decodedText, decodedResult) => {
            handleScanSuccess(decodedText, decodedResult);
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
  };

  const onScanError = (error) => {
    // Chỉ log error, không hiển thị notification để tránh spam
  };

  const handleClose = () => {
    if (scanner) {
      scanner.clear();
      setScanner(null);
    }
    setIsScanning(false);
    setScanMode(null);
    setCameraError(false);
    setManualInput("");
    setShowManualInput(false);
    onClose();
  };

  const handleManualInput = () => {
    if (manualInput.trim()) {
      handleScanSuccess(manualInput.trim());
    } else {
      notification.warning({
        message: "Vui lòng nhập mã",
        description: "Mã không được để trống.",
      });
    }
  };

  const handleRetryCamera = () => {
    setCameraError(false);
    setShowManualInput(false);
    setManualInput("");
    if (scanner) {
      scanner.clear();
      setScanner(null);
    }
    setTimeout(() => {
      initializeScanner();
    }, 100);
  };

  // Khởi tạo camera khi chọn mode camera
  useEffect(() => {
    if (scanMode === "camera" && !scanner && !cameraError) {
      setTimeout(() => {
        initializeScanner();
      }, 100);
    }
  }, [scanMode]);

  const handleScanSuccess = (decodedText, decodedResult) => {

    // Dừng scanner
    if (scanner) {
      scanner.clear();
      setScanner(null);
    }
    setIsScanning(false);

    // Gọi callback với kết quả quét được
    onScanSuccess(decodedText, decodedResult);

    // Đóng modal
    onClose();

    notification.success({
      message: "Quét QR thành công",
      description: `Đã quét được mã: ${decodedText}`,
    });
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
      destroyOnClose
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
