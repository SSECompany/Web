import { InfoCircleOutlined, ReloadOutlined } from "@ant-design/icons";
import { Badge, Tooltip } from "antd";
import useVersionCheck from "../../../hooks/useVersionCheck";
import "./VersionIndicator.css";

const VersionIndicator = ({ showDetails = false, size = "small" }) => {
  const {
    hasNewVersion,
    newVersionInfo,
    checkVersionNow,
    currentVersion,
    isChecking,
  } = useVersionCheck();

  if (!showDetails && !hasNewVersion) {
    return null;
  }

  const handleCheckVersion = () => {
    if (!isChecking) {
      checkVersionNow();
    }
  };

  if (showDetails) {
    return (
      <div className={`version-indicator ${size}`}>
        <div className="version-info">
          <Badge
            status={hasNewVersion ? "processing" : "success"}
            text={
              <span className="version-text">
                v{currentVersion?.version || "—"}
                {hasNewVersion && (
                  <span className="new-version-label">(Có cập nhật mới!)</span>
                )}
              </span>
            }
          />
        </div>
        <Tooltip title={isChecking ? "Đang kiểm tra..." : "Kiểm tra cập nhật"}>
          <ReloadOutlined
            className="refresh-icon"
            onClick={handleCheckVersion}
            spin={isChecking}
            style={{
              opacity: isChecking ? 0.6 : 1,
              cursor: isChecking ? "not-allowed" : "pointer",
            }}
          />
        </Tooltip>
      </div>
    );
  }

  return (
    <Tooltip title={`Có phiên bản mới: ${newVersionInfo?.version || ""}`}>
      <Badge dot status="processing" className="version-update-badge">
        <InfoCircleOutlined className="version-icon" />
      </Badge>
    </Tooltip>
  );
};

export default VersionIndicator;
