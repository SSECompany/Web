import { InfoCircleOutlined, ReloadOutlined } from "@ant-design/icons";
import { Badge, Tooltip } from "antd";
import React from "react";
import useVersionCheck from "../../../hooks/useVersionCheck";
import "./VersionIndicator.css";

const VersionIndicator = ({ showDetails = false, size = "small" }) => {
  const { hasNewVersion, newVersionInfo, checkVersionNow, currentVersion } =
    useVersionCheck();

  if (!showDetails && !hasNewVersion) {
    return null;
  }

  const handleCheckVersion = () => {
    checkVersionNow();
  };

  if (showDetails) {
    return (
      <div className={`version-indicator ${size}`}>
        <div className="version-info">
          <Badge
            status={hasNewVersion ? "processing" : "success"}
            text={
              <span className="version-text">
                v{currentVersion?.version}
                {hasNewVersion && (
                  <span className="new-version-label">(Có cập nhật mới!)</span>
                )}
              </span>
            }
          />
        </div>
        <Tooltip title="Kiểm tra cập nhật">
          <ReloadOutlined
            className="refresh-icon"
            onClick={handleCheckVersion}
            spin={false}
          />
        </Tooltip>
      </div>
    );
  }

  return (
    <Tooltip title={`Có phiên bản mới: ${newVersionInfo?.version}`}>
      <Badge dot status="processing" className="version-update-badge">
        <InfoCircleOutlined className="version-icon" />
      </Badge>
    </Tooltip>
  );
};

export default VersionIndicator;
