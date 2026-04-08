import { notification } from "antd";
import { useCallback, useEffect, useRef, useState } from "react";

// Mặc định 60 giây - kiểm tra định kỳ khi user giữ nguyên trang
const COUNTDOWN_SECONDS = 30;
const NOTIF_KEY = "version-update-countdown";

// Dùng chung giữa các instance (login → sau đăng nhập) để tránh 2 thông báo đếm ngược
let globalCountdownActive = false;

const useVersionCheck = (checkInterval = 60 * 1000) => {
  const [hasNewVersion, setHasNewVersion] = useState(false);
  const [newVersionInfo, setNewVersionInfo] = useState(null);
  const [currentVersion, setCurrentVersion] = useState(null);
  const [isChecking, setIsChecking] = useState(false);

  const intervalRef = useRef(null);
  const currentVersionRef = useRef(null);
  const isCheckingRef = useRef(false);
  const lastCheckTimeRef = useRef(0);

  const getVersionUrl = () => {
    const base = process.env.PUBLIC_URL || "";
    const baseUrl = base.endsWith("/") ? base.slice(0, -1) : base;
    return `${baseUrl}/version.json?t=${Date.now()}`;
  };

  const clearAllBrowserData = async () => {
    try {
      if ("caches" in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      }
      if ("serviceWorker" in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(
          registrations.map((registration) => registration.unregister())
        );
      }
      localStorage.clear();
      sessionStorage.clear();
      if ("indexedDB" in window && indexedDB.databases) {
        const databases = await indexedDB.databases();
        await Promise.all(
          databases.map((db) => {
            const deleteReq = indexedDB.deleteDatabase(db.name);
            return new Promise((resolve) => {
              deleteReq.onsuccess = () => resolve();
              deleteReq.onerror = () => resolve();
            });
          })
        );
      }
      const paths = ["/", "/login", "/bao-cao", "/pharmacy"];
      const domains = [
        window.location.hostname,
        "." + window.location.hostname,
      ];
      document.cookie.split(";").forEach((cookie) => {
        const eqPos = cookie.indexOf("=");
        const name =
          eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
        paths.forEach((path) => {
          domains.forEach((domain) => {
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=${path};domain=${domain}`;
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=${path}`;
          });
          if (window.location.protocol === "https:") {
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=${path};secure`;
          }
        });
      });
    } catch (error) {
      console.warn("Một số cache không thể xóa:", error);
    }
  };

  const getCurrentVersion = useCallback(async () => {
    try {
      const url = getVersionUrl();
      const response = await fetch(url, { cache: "no-cache" });
      const versionData = await response.json();
      return versionData;
    } catch (error) {
      console.warn("Không thể lấy thông tin version:", error);
      return null;
    }
  }, []);

  const checkForNewVersion = useCallback(async (forceShow = false) => {
    if (isCheckingRef.current) return;
    if (!forceShow) {
      const now = Date.now();
      if (now - lastCheckTimeRef.current < 30000) return;
    }
    isCheckingRef.current = true;
    if (forceShow) setIsChecking(true);
    if (!forceShow) lastCheckTimeRef.current = Date.now();
    try {
      const newVersion = await getCurrentVersion();
      if (!newVersion) return;

      // Máy khách không có version nhưng server có => coi là lệch version, thông báo như bình thường
      if (!currentVersionRef.current) {
        currentVersionRef.current = { version: null, buildHash: null };
      }

      const isDifferent =
        currentVersionRef.current.version !== newVersion.version ||
        (currentVersionRef.current.buildHash &&
          newVersion.buildHash &&
          currentVersionRef.current.buildHash !== newVersion.buildHash);

      if (isDifferent) {
        // First check: if current version is missing, adopt server version silently
        if (
          !currentVersionRef.current.version &&
          !currentVersionRef.current.buildHash
        ) {
          currentVersionRef.current = newVersion;
          setCurrentVersion(newVersion);
          localStorage.setItem("app_version", JSON.stringify(newVersion));
          return;
        }

        // Đã có countdown đang chạy (từ instance khác, vd: login → sau đăng nhập) → không tạo thêm
        if (globalCountdownActive) return;

        globalCountdownActive = true;
        setHasNewVersion(true);
        setNewVersionInfo(newVersion);

        let secondsLeft = COUNTDOWN_SECONDS;
        let countdownInterval = null;

        const doUpdate = async () => {
          globalCountdownActive = false;
          if (countdownInterval) clearInterval(countdownInterval);
          notification.destroy(NOTIF_KEY);
          // Preserve app_version across clearing browser data
          const vToKeep = localStorage.getItem("app_version");
          await clearAllBrowserData();
          if (vToKeep) {
            localStorage.setItem("app_version", vToKeep);
          } else {
            localStorage.setItem("app_version", JSON.stringify(newVersion));
          }
          const base =
            window.location.origin + (process.env.PUBLIC_URL || "");
          const loginPath = base.endsWith("/")
            ? `${base}login`
            : `${base}/login`;
          const url = `${loginPath}?v=${Date.now()}`;
          window.location.replace(url);
        };

        const updateNotif = () => {
          notification.info({
            key: NOTIF_KEY,
            message: "Có phiên bản mới!",
            description: `Phiên bản ${newVersion.version} đã có sẵn. Trang sẽ tự động cập nhật sau ${secondsLeft} giây...`,
            duration: 0,
            btn: (
              <button
                onClick={() => doUpdate()}
                style={{
                  background: "#1890ff",
                  color: "white",
                  border: "none",
                  padding: "4px 12px",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: 500,
                }}
              >
                Cập nhật ngay
              </button>
            ),
          });
        };

        updateNotif();

        countdownInterval = setInterval(() => {
          secondsLeft -= 1;
          updateNotif();
          if (secondsLeft <= 0) {
            doUpdate();
          }
        }, 1000);

        return;
      }

      if (forceShow) {
        notification.success({
          message: "Đã cập nhật mới nhất",
          description: `Bạn đang sử dụng phiên bản mới nhất: v${newVersion.version}`,
          duration: 3,
        });
      }
    } catch (error) {
      console.warn("Lỗi khi kiểm tra version:", error);
      if (forceShow) {
        notification.error({
          message: "Lỗi kiểm tra cập nhật",
          description: "Không thể kết nối để kiểm tra phiên bản mới.",
          duration: 3,
        });
      }
    } finally {
      isCheckingRef.current = false;
      if (forceShow) setIsChecking(false);
    }
  }, [getCurrentVersion]);

  const checkVersionNow = () => {
    checkForNewVersion(true);
  };

  useEffect(() => {
    const savedVersion = localStorage.getItem("app_version");
    if (savedVersion) {
      try {
        const parsedVersion = JSON.parse(savedVersion);
        currentVersionRef.current = parsedVersion;
        setCurrentVersion(parsedVersion);
      } catch (error) {
        console.warn("Không thể parse version từ localStorage:", error);
      }
    }
    const initialCheck = setTimeout(() => {
      checkForNewVersion();
    }, 3000);
    intervalRef.current = setInterval(checkForNewVersion, checkInterval);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      clearTimeout(initialCheck);
    };
  }, [checkInterval, checkForNewVersion]);

  useEffect(() => {
    const handleFocus = () => {
      if (Date.now() - lastCheckTimeRef.current > 60000) {
        checkForNewVersion();
      }
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [checkForNewVersion]);

  return {
    hasNewVersion,
    newVersionInfo,
    checkVersionNow,
    currentVersion,
    isChecking,
  };
};

export default useVersionCheck;
