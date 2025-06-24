import { Tag, Typography } from "antd";
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
    const isExpiring = totalSeconds <= 300; // 5 phút cuối
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

  // Ẩn component khi không cần thiết
  if (!isAuthenticated || !tokenExpiry) return null;

  const { color, statusText, statusIcon, className } = statusInfo;

  return (
    <div className={`token-timer token-timer--${className}`}>
      <div className="token-timer-header">
        <span className="token-timer-status-icon">{statusIcon}</span>
        <Text className="token-timer-title">Phiên đăng nhập</Text>
        <Tag color={color} className="token-timer-tag">
          {statusText}
        </Tag>
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
