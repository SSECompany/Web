import { Tag, Typography } from "antd";
import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import {
  selectIsAuthenticated,
  selectTokenExpiry,
} from "../../../store/slices/authSlice";
import { getTimeLeft } from "../../../utils/tokenUtils";

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
      bgColor: "rgba(255, 255, 255, 0.95)",
      statusText: "Hoạt động",
      statusIcon: "🟢",
      borderColor: "#52c41a",
    };

    if (isExpired) {
      status = {
        color: "red",
        bgColor: "rgba(255, 230, 230, 0.95)",
        statusText: "Hết hạn",
        statusIcon: "🔴",
        borderColor: "#ff4d4f",
      };
    } else if (isExpiring) {
      status = {
        color: "orange",
        bgColor: "rgba(255, 247, 230, 0.95)",
        statusText: "Sắp hết hạn",
        statusIcon: "🟡",
        borderColor: "#fa8c16",
      };
    }

    return {
      displayTime: formatTime(timeLeft),
      statusInfo: status,
    };
  }, [timeLeft]);

  // Ẩn component khi không cần thiết
  if (!isAuthenticated || !tokenExpiry) return null;

  const { color, bgColor, statusText, statusIcon, borderColor } = statusInfo;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 20,
        left: 20,
        zIndex: 1000,
        background: bgColor,
        padding: "12px 16px",
        borderRadius: "8px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        border: `2px solid ${borderColor}`,
        fontFamily: "system-ui, -apple-system, sans-serif",
        backdropFilter: "blur(8px)",
        minWidth: "220px",
        maxWidth: "280px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginBottom: "4px",
        }}
      >
        <span style={{ fontSize: "14px" }}>{statusIcon}</span>
        <Text
          style={{
            fontWeight: "600",
            fontSize: "13px",
            margin: 0,
            color: "#333",
          }}
        >
          Phiên đăng nhập
        </Text>
        <Tag
          color={color}
          style={{
            fontSize: "11px",
            fontWeight: "500",
            margin: 0,
            padding: "2px 8px",
            borderRadius: "4px",
          }}
        >
          {statusText}
        </Tag>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <Text
          style={{
            fontSize: "12px",
            color: "#666",
            margin: 0,
            minWidth: "65px",
          }}
        >
          Còn lại:
        </Text>
        <div
          style={{
            background:
              color === "green"
                ? "#f6ffed"
                : color === "orange"
                ? "#fff7e6"
                : "#fff2f0",
            padding: "4px 8px",
            borderRadius: "4px",
            border: `1px solid ${
              color === "green"
                ? "#b7eb8f"
                : color === "orange"
                ? "#ffd591"
                : "#ffb3b3"
            }`,
            flex: 1,
          }}
        >
          <Text
            style={{
              fontFamily: "monospace",
              fontSize: "13px",
              fontWeight: "600",
              margin: 0,
              color:
                color === "green"
                  ? "#389e0d"
                  : color === "orange"
                  ? "#d48806"
                  : "#cf1322",
            }}
          >
            {displayTime}
          </Text>
        </div>
      </div>
    </div>
  );
};

export default TokenTimer;
