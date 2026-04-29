import {
  CloseCircleOutlined,
  DeleteOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { Modal } from "antd";
import "./Modal.css";

const TYPE_COLORS = {
  warning: "#ff6b35",
  exclamation: "#faad14",
  error: "#ff4d4f",
  success: "#52c41a",
  info: "#1677ff",
};

const showConfirm = ({
  title,
  content,
  onOk,
  onCancel,
  type = "warning",
  showIcon = true,
  className = "centered-buttons fixed-height compact-modal",
}) => {
  const buttonColor = TYPE_COLORS[type] || TYPE_COLORS.warning;

  const getIcon = () => {
    if (!showIcon) return null;

    switch (type) {
      case "warning":
        return (
          <DeleteOutlined
            style={{ color: buttonColor, fontSize: "20px", marginBottom: "6px" }}
          />
        );
      case "exclamation":
        return (
          <ExclamationCircleOutlined
            style={{ color: buttonColor, fontSize: "20px", marginBottom: "6px" }}
          />
        );
      case "error":
        return (
          <CloseCircleOutlined
            style={{ color: buttonColor, fontSize: "20px", marginBottom: "6px" }}
          />
        );
      case "success":
        return (
          <CheckCircleOutlined
            style={{ color: buttonColor, fontSize: "20px", marginBottom: "6px" }}
          />
        );
      case "info":
        return (
          <InfoCircleOutlined
            style={{ color: buttonColor, fontSize: "20px", marginBottom: "6px" }}
          />
        );
      default:
        return (
          <DeleteOutlined
            style={{ color: buttonColor, fontSize: "20px", marginBottom: "6px" }}
          />
        );
    }
  };

  Modal.confirm({
    icon: null,
    title: (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: showIcon ? "6px" : "0",
          flexDirection: "column",
          textAlign: "center",
        }}
      >
        {getIcon()}
        <span
          style={{
            fontSize: 16,
            fontWeight: 600,
            textAlign: "center",
            lineHeight: "1.3",
          }}
        >
          {title}
        </span>
      </div>
    ),
    content: content && (
      <div
        style={{
          textAlign: "center",
          fontSize: "13px",
          marginTop: "6px",
          lineHeight: "1.3",
        }}
      >
        {content}
      </div>
    ),
    okText: "Xác nhận",
    cancelText: "Huỷ",
    okButtonProps: {
      style: {
        background: buttonColor,
        borderColor: buttonColor,
        width: 90,
        height: 38,
        borderRadius: 10,
        fontWeight: 600,
        fontSize: 13,
        color: "white",
      },
    },
    cancelButtonProps: {
      style: {
        background: "linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)",
        borderColor: "#e2e8f0",
        width: 90,
        height: 38,
        borderRadius: 10,
        fontWeight: 600,
        fontSize: 13,
        color: "#64748b",
      },
    },
    centered: true,
    className: className,
    maskClosable: false,
    keyboard: true,
    onOk,
    onCancel,
  });
};

export default showConfirm;
