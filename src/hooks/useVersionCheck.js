import { Modal, notification } from "antd";
import { useEffect, useRef, useState } from "react";

// Global flags để tránh duplicate notifications
let globalHasNotified = false;
let globalCurrentNotificationKey = null;

const useVersionCheck = (checkInterval = 10 * 60 * 1000) => {
  const [hasNewVersion, setHasNewVersion] = useState(false);
  const [newVersionInfo, setNewVersionInfo] = useState(null);
  const [currentVersion, setCurrentVersion] = useState(null);
  const [isChecking, setIsChecking] = useState(false);

  const intervalRef = useRef(null);
  const currentVersionRef = useRef(null);
  const hasNotifiedRef = useRef(false);
  const isCheckingRef = useRef(false);
  const lastCheckTimeRef = useRef(0);
  const currentNotificationKeyRef = useRef(null);

  // Lấy version hiện tại
  const getCurrentVersion = async () => {
    try {
      const response = await fetch("/version.json?t=" + Date.now(), {
        cache: "no-cache",
      });
      const versionData = await response.json();
      return versionData;
    } catch (error) {
      console.warn("Không thể lấy thông tin version:", error);
      return null;
    }
  };

  // Hàm clear toàn bộ dữ liệu trình duyệt
  const clearAllBrowserData = async () => {
    try {
      // 1. Xóa tất cả browser caches
      if ("caches" in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      }
      // 2. Xóa service worker cache (nếu có)
      if ("serviceWorker" in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(
          registrations.map((registration) => registration.unregister())
        );
      }
      // 3. Clear tất cả storage
      localStorage.clear();
      sessionStorage.clear();
      // 4. Clear IndexedDB
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
      // 5. Xóa toàn bộ cookie
      const clearAllCookies = () => {
        const cookies = document.cookie.split(";");
        const paths = ["/", "/order", "/meal", "/transferHub"];
        const domains = [
          window.location.hostname,
          "." + window.location.hostname,
        ];
        cookies.forEach((cookie) => {
          const eqPos = cookie.indexOf("=");
          const name =
            eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
          paths.forEach((path) => {
            domains.forEach((domain) => {
              document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=${path};domain=${domain}`;
              document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=${path}`;
            });
          });
          if (window.location.protocol === "https:") {
            paths.forEach((path) => {
              document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=${path};secure`;
            });
          }
        });
      };
      clearAllCookies();
    } catch (error) {
      console.warn("Một số cache không thể xóa:", error);
    }
  };

  // Kiểm tra version mới
  const checkForNewVersion = async (forceShow = false) => {
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
      if (!currentVersionRef.current) {
        currentVersionRef.current = newVersion;
        setCurrentVersion(newVersion);
        localStorage.setItem("app_version", JSON.stringify(newVersion));
        globalHasNotified = false;
        hasNotifiedRef.current = false;
        return;
      }
      const isDifferent =
        currentVersionRef.current.version !== newVersion.version ||
        currentVersionRef.current.buildHash !== newVersion.buildHash;
      const shouldShowNotification =
        isDifferent &&
        (forceShow || (!globalHasNotified && !globalCurrentNotificationKey));
      if (shouldShowNotification) {
        const key = `version-update-${newVersion.version}-${newVersion.buildHash}`;
        if (forceShow && globalCurrentNotificationKey === key) return;
        if (!forceShow) {
          globalHasNotified = true;
          hasNotifiedRef.current = true;
        }
        setHasNewVersion(true);
        setNewVersionInfo(newVersion);
        if (
          globalCurrentNotificationKey &&
          globalCurrentNotificationKey !== key
        ) {
          notification.destroy(globalCurrentNotificationKey);
        }
        globalCurrentNotificationKey = key;
        currentNotificationKeyRef.current = key;
        notification.info({
          message: forceShow
            ? "Kết quả kiểm tra cập nhật"
            : "Có phiên bản mới!",
          description: `Phiên bản ${newVersion.version} đã có sẵn. Bạn có muốn cập nhật ngay?`,
          duration: 0,
          key: key,
          onClose: () => {
            globalCurrentNotificationKey = null;
            currentNotificationKeyRef.current = null;
          },
          btn: (
            <div>
              <button
                onClick={() => {
                  notification.destroy(key);
                  globalCurrentNotificationKey = null;
                  currentNotificationKeyRef.current = null;
                  handleUpdateApp(newVersion);
                }}
                style={{
                  marginRight: 8,
                  background: "#1890ff",
                  color: "white",
                  border: "none",
                  padding: "4px 12px",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Cập nhật ngay
              </button>
              <button
                onClick={() => {
                  notification.destroy(key);
                  globalCurrentNotificationKey = null;
                  currentNotificationKeyRef.current = null;
                  setHasNewVersion(false);
                  if (!forceShow) {
                    globalHasNotified = false;
                    hasNotifiedRef.current = false;
                  }
                }}
                style={{
                  background: "#f5f5f5",
                  border: "1px solid #d9d9d9",
                  padding: "4px 12px",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Để sau
              </button>
            </div>
          ),
        });
      } else if (forceShow && !isDifferent) {
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
  };

  // Xử lý cập nhật ứng dụng
  const handleUpdateApp = (newVersion) => {
    Modal.confirm({
      title: "Cập nhật ứng dụng",
      content: (
        <div>
          <p>
            Phiên bản mới: <strong>{newVersion.version}</strong>
          </p>
          <p>
            Thời gian build:{" "}
            <strong>
              {new Date(newVersion.buildTime).toLocaleString("vi-VN")}
            </strong>
          </p>
          <p>
            <strong style={{ color: "#ff4d4f" }}>
              ⚠️ Quá trình cập nhật sẽ xóa toàn bộ dữ liệu trình duyệt (cookies,
              cache, localStorage, sessionStorage) để đảm bảo phiên bản mới hoạt
              động chính xác.
            </strong>
          </p>
          <p>Trang sẽ được tải lại để áp dụng cập nhật.</p>
        </div>
      ),
      okText: "Cập nhật ngay",
      cancelText: "Hủy",
      onOk: async () => {
        globalHasNotified = false;
        globalCurrentNotificationKey = null;
        hasNotifiedRef.current = false;
        try {
          await clearAllBrowserData();
          localStorage.setItem("app_version", JSON.stringify(newVersion));
          notification.success({
            message: "Cập nhật thành công!",
            description:
              "Đã xóa toàn bộ dữ liệu trình duyệt và chuẩn bị tải lại trang.",
            duration: 2,
          });
          setTimeout(() => {
            const timestamp = Date.now();
            window.location.href = window.location.href + "?v=" + timestamp;
          }, 2000);
        } catch (error) {
          notification.error({
            message: "Lỗi cập nhật",
            description:
              "Có lỗi xảy ra trong quá trình cập nhật. Vui lòng thử lại.",
            duration: 5,
          });
        }
      },
    });
  };

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
  }, [checkInterval]);

  useEffect(() => {
    const handleFocus = () => {
      if (Date.now() - lastCheckTimeRef.current > 60000) {
        checkForNewVersion();
      }
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  return {
    hasNewVersion,
    newVersionInfo,
    checkVersionNow,
    currentVersion,
    isChecking,
  };
};

export default useVersionCheck;
