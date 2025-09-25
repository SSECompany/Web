import { CameraOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import { Alert, Button, Modal, Space } from "antd";
import React, { useEffect, useState } from "react";

const CameraPermissionHelper = ({
  onPermissionGranted,
  onPermissionDenied,
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState("checking");

  useEffect(() => {
    checkCameraPermission();
  }, []);

  const checkCameraPermission = async () => {
    try {
      // Kiểm tra xem trình duyệt có hỗ trợ getUserMedia không
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setPermissionStatus("not-supported");
        return;
      }

      // Kiểm tra quyền camera hiện tại
      const permission = await navigator.permissions.query({ name: "camera" });

      if (permission.state === "granted") {
        setPermissionStatus("granted");
        onPermissionGranted();
      } else if (permission.state === "denied") {
        setPermissionStatus("denied");
        onPermissionDenied();
      } else {
        setPermissionStatus("prompt");
        setIsModalVisible(true);
      }
    } catch (error) {
      console.error("Error checking camera permission:", error);
      setPermissionStatus("error");
      onPermissionDenied();
    }
  };

  const requestCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment", // Ưu tiên camera sau trên mobile
        },
      });

      // Dừng stream test
      stream.getTracks().forEach((track) => track.stop());

      setPermissionStatus("granted");
      setIsModalVisible(false);
      onPermissionGranted();
    } catch (error) {
      console.error("Camera permission denied:", error);
      setPermissionStatus("denied");
      setIsModalVisible(false);
      onPermissionDenied();
    }
  };

  const getBrowserInstructions = () => {
    const userAgent = navigator.userAgent;

    if (userAgent.includes("Chrome")) {
      return {
        title: "Chrome",
        steps: [
          "Click vào biểu tượng camera bị chặn trên thanh địa chỉ",
          'Chọn "Cho phép" từ dropdown menu',
          "Refresh trang web",
        ],
      };
    } else if (userAgent.includes("Safari")) {
      return {
        title: "Safari",
        steps: [
          "Vào Safari → Preferences (hoặc Settings)",
          'Chọn tab "Websites"',
          'Chọn "Camera" từ sidebar',
          'Chọn "Allow" cho website này',
        ],
      };
    } else if (userAgent.includes("Firefox")) {
      return {
        title: "Firefox",
        steps: [
          "Click vào biểu tượng camera trên thanh địa chỉ",
          'Chọn "Cho phép" từ popup',
          "Refresh trang web",
        ],
      };
    } else {
      return {
        title: "Trình duyệt khác",
        steps: [
          "Tìm biểu tượng camera trên thanh địa chỉ",
          'Click và chọn "Cho phép"',
          "Refresh trang web",
        ],
      };
    }
  };

  const instructions = getBrowserInstructions();

  return (
    <>
      {permissionStatus === "prompt" && (
        <Modal
          title={
            <Space>
              <CameraOutlined style={{ color: "#1890ff" }} />
              <span>Cấp quyền truy cập camera</span>
            </Space>
          }
          open={isModalVisible}
          onCancel={() => {
            setIsModalVisible(false);
            onPermissionDenied();
          }}
          footer={[
            <Button
              key="cancel"
              onClick={() => {
                setIsModalVisible(false);
                onPermissionDenied();
              }}
            >
              Hủy
            </Button>,
            <Button
              key="allow"
              type="primary"
              onClick={requestCameraPermission}
            >
              Cho phép camera
            </Button>,
          ]}
          width={500}
        >
          <div style={{ marginBottom: 16 }}>
            <Alert
              message="Cần quyền truy cập camera"
              description="Để sử dụng chức năng quét QR, ứng dụng cần quyền truy cập camera của bạn."
              type="info"
              showIcon
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <h4>Hướng dẫn cho {instructions.title}:</h4>
            <ol style={{ paddingLeft: 20 }}>
              {instructions.steps.map((step, index) => (
                <li key={index} style={{ marginBottom: 8 }}>
                  {step}
                </li>
              ))}
            </ol>
          </div>

          <div
            style={{
              background: "#f6ffed",
              border: "1px solid #b7eb8f",
              borderRadius: 6,
              padding: 12,
            }}
          >
            <ExclamationCircleOutlined
              style={{ color: "#52c41a", marginRight: 8 }}
            />
            <strong>Lưu ý:</strong> Nếu bạn đã từ chối quyền trước đó, hãy làm
            theo hướng dẫn trên để cấp lại quyền.
          </div>
        </Modal>
      )}
    </>
  );
};

export default CameraPermissionHelper;
