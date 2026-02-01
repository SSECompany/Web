import { notification } from "antd";
import { useEffect, useRef, useState } from "react";

const COUNTDOWN_SECONDS = 30;

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
          registrations.map((reg) => reg.unregister())
        );
      }
      localStorage.clear();
      sessionStorage.clear();
      if ("indexedDB" in window && indexedDB.databases) {
        const dbs = await indexedDB.databases();
        await Promise.all(
          dbs.map((db) => {
            return new Promise((resolve) => {
              const req = indexedDB.deleteDatabase(db.name);
              req.onsuccess = req.onerror = () => resolve();
            });
          })
        );
      }
      const paths = ["/", "/login", "/ban-hang", "/tra-hang", "/kho", "/bao-cao", "/pharmacy"];
      const domains = [window.location.hostname, "." + window.location.hostname];
      document.cookie.split(";").forEach((cookie) => {
        const eq = cookie.indexOf("=");
        const name = eq > -1 ? cookie.substr(0, eq).trim() : cookie.trim();
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
    } catch (e) {
      console.warn("Một số cache không thể xóa:", e);
    }
  };

  const getCurrentVersion = async () => {
    try {
      const res = await fetch(getVersionUrl(), {
        cache: "no-store",
        headers: { Pragma: "no-cache", "Cache-Control": "no-cache" },
      });
      if (!res.ok) return null;
      return await res.json();
    } catch (e) {
      console.warn("Không thể lấy version:", e);
      return null;
    }
  };

  const checkForNewVersion = async (forceShow = false) => {
    if (isCheckingRef.current) return;
    if (!forceShow && Date.now() - lastCheckTimeRef.current < 30000) return;

    isCheckingRef.current = true;
    if (forceShow) setIsChecking(true);
    if (!forceShow) lastCheckTimeRef.current = Date.now();

    try {
      const newVersion = await getCurrentVersion();
      if (!newVersion) return;

      if (!currentVersionRef.current) {
        currentVersionRef.current = newVersion;
        setCurrentVersion(newVersion);
        localStorage.setItem("app_version", JSON.stringify(newVersion));
        return;
      }

      const isDifferent =
        currentVersionRef.current.version !== newVersion.version ||
        (currentVersionRef.current.buildHash &&
          newVersion.buildHash &&
          currentVersionRef.current.buildHash !== newVersion.buildHash);

      if (isDifferent) {
        setHasNewVersion(true);
        setNewVersionInfo(newVersion);

        const notifKey = "version-update-countdown";
        let secondsLeft = COUNTDOWN_SECONDS;
        let countdownInterval = null;

        const doUpdate = async () => {
          if (countdownInterval) clearInterval(countdownInterval);
          notification.destroy(notifKey);
          await clearAllBrowserData();
          localStorage.setItem("app_version", JSON.stringify(newVersion));
          const base = window.location.origin + (process.env.PUBLIC_URL || "");
          const loginPath = base.endsWith("/") ? `${base}login` : `${base}/login`;
          window.location.replace(`${loginPath}?v=${Date.now()}`);
        };

        const updateNotif = () => {
          notification.info({
            key: notifKey,
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
          if (secondsLeft <= 0) doUpdate();
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
    } catch (e) {
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
  };

  useEffect(() => {
    const saved = localStorage.getItem("app_version");
    if (saved) {
      try {
        const v = JSON.parse(saved);
        currentVersionRef.current = v;
        setCurrentVersion(v);
      } catch (_) {}
    }
    const t = setTimeout(checkForNewVersion, 3000);
    intervalRef.current = setInterval(checkForNewVersion, checkInterval);
    return () => {
      clearInterval(intervalRef.current);
      clearTimeout(t);
    };
  }, [checkInterval]);

  useEffect(() => {
    const onFocus = () => {
      if (Date.now() - lastCheckTimeRef.current > 60000) checkForNewVersion();
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible" && Date.now() - lastCheckTimeRef.current > 60000) {
        checkForNewVersion();
      }
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  return {
    hasNewVersion,
    newVersionInfo,
    checkVersionNow: () => checkForNewVersion(true),
    currentVersion,
    isChecking,
  };
};

export default useVersionCheck;
