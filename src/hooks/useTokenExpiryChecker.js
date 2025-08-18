import { notification } from "antd";
import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  logout,
  selectIsAuthenticated,
  selectTokenExpiry,
} from "../store/slices/authSlice";
import jwt from "../utils/jwt";
import { clearAllTokenData, getTimeLeft } from "../utils/tokenUtils";

const useTokenExpiryChecker = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const tokenExpiry = useSelector(selectTokenExpiry);
  const intervalRef = useRef(null);
  const hasNotifiedRef = useRef(false);
  const currentIntervalRef = useRef(null);

  const performLogout = () => {
    clearAllTokenData();
    dispatch(logout());

    notification.error({
      message: "Phiên đăng nhập hết hạn",
      description: "Vui lòng đăng nhập lại để tiếp tục",
      placement: "topRight",
      duration: 3,
    });

    navigate("/login", { replace: true });
  };

  const checkTokenExpiry = () => {
    if (!isAuthenticated || !tokenExpiry) return false;

    // Kiểm tra nếu là session token (không phải JWT thực sự)
    const token = jwt.getAccessToken();
    if (token && token.startsWith("session.")) {
      // Session token - chỉ logout khi thực sự hết hạn
      const timeLeft = getTimeLeft(tokenExpiry);

      // Token hết hạn -> logout
      if (timeLeft <= 0) {
        performLogout();
        return true;
      }

      // Cảnh báo 1 giờ cuối (thay vì 5 phút)
      if (timeLeft <= 3600000 && timeLeft > 300000 && !hasNotifiedRef.current) {
        hasNotifiedRef.current = true;
        notification.warning({
          message: "Phiên đăng nhập sắp hết hạn",
          description: `Phiên của bạn sẽ hết hạn sau ${Math.floor(
            timeLeft / 60000
          )} phút`,
          placement: "topRight",
          duration: 5,
        });
      }

      return false;
    }

    // JWT token - xử lý như cũ
    const timeLeft = getTimeLeft(tokenExpiry);

    // Token hết hạn -> logout
    if (timeLeft <= 0) {
      performLogout();
      return true;
    }

    // Cảnh báo 5 phút cuối (chỉ 1 lần)
    if (timeLeft <= 300000 && timeLeft > 60000 && !hasNotifiedRef.current) {
      hasNotifiedRef.current = true;
      notification.warning({
        message: "Phiên đăng nhập sắp hết hạn",
        description: `Phiên của bạn sẽ hết hạn sau ${Math.floor(
          timeLeft / 60000
        )} phút`,
        placement: "topRight",
        duration: 5,
      });
    }

    return false;
  };

  const getCheckInterval = (timeLeft) => {
    // Session token - check ít thường xuyên hơn
    const token = jwt.getAccessToken();
    if (token && token.startsWith("session.")) {
      if (timeLeft <= 3600000) return 300000; // 1 giờ cuối: 5 phút
      if (timeLeft <= 86400000) return 1800000; // 1 ngày cuối: 30 phút
      return 3600000; // Còn lại: 1 giờ
    }

    // JWT token - check thường xuyên hơn
    if (timeLeft <= 600000) return 30000; // 10 phút cuối: 30s
    if (timeLeft <= 3600000) return 300000; // 1 giờ cuối: 5 phút
    if (timeLeft <= 7200000) return 600000; // 2 giờ cuối: 10 phút
    return 900000; // Còn lại: 15 phút
  };

  const setupDynamicInterval = () => {
    if (!isAuthenticated || !tokenExpiry) return;

    // Clear existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Check ngay lập tức
    if (checkTokenExpiry()) return;

    // Setup interval thông minh với dynamic update
    const updateInterval = () => {
      const timeLeft = getTimeLeft(tokenExpiry);
      const newInterval = getCheckInterval(timeLeft);

      // Chỉ update khi interval thay đổi
      if (currentIntervalRef.current !== newInterval) {
        currentIntervalRef.current = newInterval;

        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }

        intervalRef.current = setInterval(() => {
          if (checkTokenExpiry()) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          } else {
            // Check xem có cần update interval không
            updateInterval();
          }
        }, newInterval);
      }
    };

    updateInterval();
  };

  useEffect(() => {
    if (!isAuthenticated || !tokenExpiry) {
      // Cleanup khi không cần thiết
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      currentIntervalRef.current = null;
      hasNotifiedRef.current = false;
      return;
    }

    // Reset notification flag khi token mới
    hasNotifiedRef.current = false;
    setupDynamicInterval();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      currentIntervalRef.current = null;
    };
  }, [isAuthenticated, tokenExpiry]);

  return { checkTokenExpiry };
};

export default useTokenExpiryChecker;
