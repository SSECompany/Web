import { notification } from "antd";
import { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { refreshToken } from "../api";
import router from "../router/routes";
import {
  setClaims,
  setRefreshToken as setRefreshTokenRedux,
  setTokenExpiry as setTokenExpiryRedux,
} from "../store/reducers/claimsSlice";
import jwt from "../utils/jwt";
import { clearAllTokenData } from "../utils/tokenUtils";

/**
 * Gọi refresh token chủ động khi vào app với access token hết hạn nhưng còn refresh_token.
 * Cập nhật access_token, refresh_token, token_expiry trong localStorage và Redux.
 */
export default function useProactiveRefresh(shouldRun) {
  const dispatch = useDispatch();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshDone, setRefreshDone] = useState(false);
  const attemptedRef = useRef(false);

  useEffect(() => {
    if (!shouldRun || attemptedRef.current) return;
    attemptedRef.current = true;
    let cancelled = false;
    setIsRefreshing(true);

    refreshToken()
      .then(([newToken, newRefreshToken]) => {
        if (cancelled) return;
        jwt.applyRefreshResponse(newToken, newRefreshToken);
        dispatch(setClaims(jwt.getClaims()));
        dispatch(setRefreshTokenRedux(newRefreshToken));
        dispatch(setTokenExpiryRedux(jwt.getTokenExpiry()));
        setRefreshDone(true);
      })
      .catch(() => {
        if (cancelled) return;
        clearAllTokenData();
        notification.error({
          message: "Phiên đăng nhập hết hạn",
          description: "Vui lòng đăng nhập lại để tiếp tục",
          placement: "topRight",
          duration: 3,
        });
        router.navigate("/login");
      })
      .finally(() => {
        if (!cancelled) setIsRefreshing(false);
      });

    return () => {
      cancelled = true;
    };
  }, [shouldRun, dispatch]);

  return { isRefreshing, refreshDone };
}
