import { notification } from "antd";
import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { refreshToken } from "../api";
import {
  setClaims,
  setRefreshToken as setRefreshTokenRedux,
  setTokenExpiry as setTokenExpiryRedux,
} from "../store/reducers/claimsSlice";
import jwt from "../utils/jwt";
import { clearAllTokenData, getTimeLeft } from "../utils/tokenUtils";

const FIVE_MINUTES_MS = 5 * 60 * 1000;

const useTokenExpiryChecker = () => {
  const dispatch = useDispatch();
  
  // Lấy authentication state từ claimsReducer
  const isAuthenticated = useSelector((state) => {
    const token = localStorage.getItem("access_token");
    const tokenExpiry = localStorage.getItem("token_expiry");
    return !!token && tokenExpiry && Date.now() < parseInt(tokenExpiry);
  });
  
  const tokenExpiry = useSelector((state) => {
    const expiry = localStorage.getItem("token_expiry");
    return expiry ? parseInt(expiry) : null;
  });
  
  const intervalRef = useRef(null);
  const hasNotifiedRef = useRef(false);
  const hasNotified5MinRef = useRef(false);
  const refreshingExpiredRef = useRef(false);
  const currentIntervalRef = useRef(null);

  const performLogout = () => {
    clearAllTokenData();
    
    // Clear claimsReducer state
    dispatch(setClaims([]));

    notification.error({
      message: "Phiên đăng nhập hết hạn",
      description: "Vui lòng đăng nhập lại để tiếp tục",
      placement: "topRight",
      duration: 3,
    });

    // Force reload và redirect về trang login
    setTimeout(() => {
      window.location.href = "/login";
    }, 500); // Delay nhỏ để notification hiển thị
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

    // JWT token: khi hết hạn → tự động gọi refresh và lưu token mới; khi còn 5 phút → thông báo
    const timeLeft = getTimeLeft(tokenExpiry);

    if (timeLeft <= 0) {
      // Tự động làm tươi và lưu token mới; chỉ logout khi refresh thất bại
      if (!refreshingExpiredRef.current) {
        refreshingExpiredRef.current = true;
        refreshToken()
          .then(([newAccessToken, newRefreshToken]) => {
            jwt.applyRefreshResponse(newAccessToken, newRefreshToken);
            dispatch(setClaims(jwt.getClaims()));
            dispatch(setRefreshTokenRedux(newRefreshToken));
            dispatch(setTokenExpiryRedux(jwt.getTokenExpiry()));
            // Không gọi refresh lại hay reload; chỉ lưu token mới và tiếp tục
          })
          .catch(() => {
            performLogout();
          })
          .finally(() => {
            refreshingExpiredRef.current = false;
          });
      }
      return false;
    }

    // Cảnh báo khi còn 5 phút (chỉ 1 lần); reset flag khi còn > 5 phút
    if (timeLeft > FIVE_MINUTES_MS) hasNotified5MinRef.current = false;
    if (timeLeft <= FIVE_MINUTES_MS && timeLeft > 0 && !hasNotified5MinRef.current) {
      hasNotified5MinRef.current = true;
      const minutesLeft = Math.max(1, Math.ceil(timeLeft / 60000));
      notification.warning({
        message: "Phiên đăng nhập sắp hết hạn",
        description: `Phiên của bạn sẽ hết hạn sau ${minutesLeft} phút. Hệ thống sẽ tự động gia hạn khi hết hạn.`,
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

    // JWT token - check thường xuyên hơn (để kịp cảnh báo 5 phút và auto refresh)
    if (timeLeft <= FIVE_MINUTES_MS) return 15000; // 5 phút cuối: 15s
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
    hasNotified5MinRef.current = false;
    setupDynamicInterval();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      currentIntervalRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- setupDynamicInterval ổn định theo isAuthenticated/tokenExpiry
  }, [isAuthenticated, tokenExpiry]);

  return { checkTokenExpiry };
};

export default useTokenExpiryChecker;
