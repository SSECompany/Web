import { ClockCircleOutlined, EyeInvisibleOutlined } from "@ant-design/icons";
import { Button, Tag, Typography } from "antd";
import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import {
  selectIsAuthenticated,
  selectTokenExpiry,
} from "../../../store/slices/authSlice";
import { getTimeLeft } from "../../../utils/tokenUtils";
import "./TokenTimer.css";

const { Text } = Typography;

const TokenTimer = () => {
  const tokenExpiry = useSelector(selectTokenExpiry);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    if (isMinimized || !isAuthenticated) return;

    const timer = setTimeout(() => {
      setIsMinimized(true);
    }, 1 * 60 * 1000);

    return () => clearTimeout(timer);
  }, [isMinimized, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || !tokenExpiry) {
      setTimeLeft(0);
      return;
    }

    const updateTimer = () => {
      setTimeLeft(getTimeLeft(tokenExpiry));
    };

    updateTimer();
    // Update mỗi 5s để tiết kiệm performance
    const interval = setInterval(updateTimer, 5000);

    return () => clearInterval(interval);
  }, [tokenExpiry, isAuthenticated]);

  // Memoize expensive calculations
  const { displayTime, statusInfo } = useMemo(() => {
    const formatTime = (milliseconds) => {
      if (milliseconds <= 0) return "Đã hết hạn";

      const totalSeconds = Math.floor(milliseconds / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);

      if (hours > 0) {
        return `${hours} giờ ${minutes} phút`;
      } else if (minutes > 0) {
        return `${minutes} phút`;
      } else {
        return `${Math.floor(totalSeconds / 60)} phút`;
      }
    };

    const totalSeconds = Math.floor(timeLeft / 1000);
    const isExpiring = totalSeconds <= 300; 
    const isExpired = totalSeconds <= 0;

    let status = {
      color: "green",
      statusText: "Hoạt động",
      statusIcon: "🟢",
      className: "active",
    };

    if (isExpired) {
      status = {
        color: "red",
        statusText: "Hết hạn",
        statusIcon: "🔴",
        className: "expired",
      };
    } else if (isExpiring) {
      status = {
        color: "orange",
        statusText: "Sắp hết hạn",
        statusIcon: "🟡",
        className: "expiring",
      };
    }

    return {
      displayTime: formatTime(timeLeft),
      statusInfo: status,
    };
  }, [timeLeft]);

  const toggleMinimized = () => {
    setIsMinimized(!isMinimized);
  };

  if (!isAuthenticated || !tokenExpiry) return null;

  const { color, statusText, statusIcon, className } = statusInfo;

  if (isMinimized) {
    return (
      <div
        className="token-timer token-timer--minimized"
        onClick={toggleMinimized}
      >
        <div className="token-timer-minimized-content">
          <span className="token-timer-status-icon">{statusIcon}</span>
          <ClockCircleOutlined style={{ marginLeft: "4px" }} />
        </div>
        <div className="token-timer-tooltip">
          Phiên đăng nhập - {displayTime}
          <br />
          <small>Click để mở rộng</small>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`token-timer token-timer--${className} token-timer--expanded`}
      style={{
        position: "fixed",
        zIndex: 10000,
      }}
    >
      <div className="token-timer-header">
        <div className="token-timer-info">
          <span className="token-timer-status-icon">{statusIcon}</span>
          <Text className="token-timer-title">Phiên đăng nhập</Text>
        </div>
        <div className="token-timer-controls">
          <Tag color={color} className="token-timer-tag">
            {statusText}
          </Tag>
          <Button
            type="text"
            size="small"
            icon={<EyeInvisibleOutlined />}
            onClick={toggleMinimized}
            className="token-timer-minimize-button"
            title="Thu nhỏ"
          />
        </div>
      </div>

      <div className="token-timer-content">
        <Text className="token-timer-label">Còn lại:</Text>
        <div className={`token-timer-value token-timer-value--${className}`}>
          <Text className={`token-timer-time token-timer-time--${className}`}>
            {displayTime}
          </Text>
        </div>
      </div>
    </div>
  );
};

export default TokenTimer;
