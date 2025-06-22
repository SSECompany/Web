import { Modal, notification } from "antd";
import { useEffect, useRef, useState } from "react";

// Global flags để tránh duplicate notifications
let globalHasNotified = false;
let globalCurrentNotificationKey = null;

const useVersionCheck = (checkInterval = 10 * 60 * 1000) => {
  // 10 phút
  const [hasNewVersion, setHasNewVersion] = useState(false);
  const [newVersionInfo, setNewVersionInfo] = useState(null);
  const [currentVersion, setCurrentVersion] = useState(null);
  const [isChecking, setIsChecking] = useState(false);

  const intervalRef = useRef(null);
  const currentVersionRef = useRef(null);
  const hasNotifiedRef = useRef(false); // Flag để tránh thông báo nhiều lần
  const isCheckingRef = useRef(false); // Flag để tránh check đồng thời
  const lastCheckTimeRef = useRef(0); // Thời gian check cuối cùng
  const currentNotificationKeyRef = useRef(null); // Track current notification

  // Lấy version hiện tại khi component mount
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

  // Kiểm tra version mới
  const checkForNewVersion = async (forceShow = false) => {
    // Tránh check đồng thời
    if (isCheckingRef.current) return;

    // Chỉ throttle cho automatic check, không throttle cho manual check
    if (!forceShow) {
      // Tránh check quá thường xuyên (ít nhất 30 giây giữa các lần check)
      const now = Date.now();
      if (now - lastCheckTimeRef.current < 30000) return;
    }

    isCheckingRef.current = true;
    if (forceShow) {
      setIsChecking(true); // Chỉ hiển thị loading cho manual check
    }
    if (!forceShow) {
      lastCheckTimeRef.current = Date.now();
    }

    try {
      const newVersion = await getCurrentVersion();

      if (!newVersion) return;

      // Lần đầu tiên load, lưu version hiện tại
      if (!currentVersionRef.current) {
        currentVersionRef.current = newVersion;
        setCurrentVersion(newVersion);
        localStorage.setItem("app_version", JSON.stringify(newVersion));
        globalHasNotified = false; // Reset global flag
        hasNotifiedRef.current = false; // Reset notification flag
        return;
      }

      // So sánh version - chỉ check version và buildHash, bỏ buildTime
      const isDifferent =
        currentVersionRef.current.version !== newVersion.version ||
        currentVersionRef.current.buildHash !== newVersion.buildHash;

      // Cho phép hiển thị nếu:
      // 1. Manual check (forceShow = true) và có version khác biệt
      // 2. Automatic check và chưa từng thông báo và chưa có notification active
      const shouldShowNotification =
        isDifferent &&
        (forceShow || (!globalHasNotified && !globalCurrentNotificationKey));

      if (shouldShowNotification) {
        // Đối với manual check, kiểm tra xem đã có notification cùng version hay chưa
        const key = `version-update-${newVersion.version}-${newVersion.buildHash}`;
        if (forceShow && globalCurrentNotificationKey === key) {
          // Đã có notification cho version này rồi, không tạo mới
          return;
        }

        // Đánh dấu đã thông báo để tránh spam (chỉ với automatic check)
        if (!forceShow) {
          globalHasNotified = true;
          hasNotifiedRef.current = true;
        }

        setHasNewVersion(true);
        setNewVersionInfo(newVersion);

        // Destroy notification cũ nếu có (chỉ khi khác version)
        if (
          globalCurrentNotificationKey &&
          globalCurrentNotificationKey !== key
        ) {
          notification.destroy(globalCurrentNotificationKey);
        }

        // Hiển thị notification với key cố định
        globalCurrentNotificationKey = key;
        currentNotificationKeyRef.current = key;

        notification.info({
          message: forceShow
            ? "Kết quả kiểm tra cập nhật"
            : "Có phiên bản mới!",
          description: `Phiên bản ${newVersion.version} đã có sẵn. Bạn có muốn cập nhật ngay?`,
          duration: 0, // Không tự động đóng
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
                  // Chỉ reset flag với automatic check
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
        // Manual check nhưng không có version mới
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
      if (forceShow) {
        setIsChecking(false); // Tắt loading cho manual check
      }
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
          <p>Trang sẽ được tải lại để áp dụng cập nhật.</p>
        </div>
      ),
      okText: "Cập nhật ngay",
      cancelText: "Hủy",
      onOk: async () => {
        // Reset notification flag khi user đồng ý update
        globalHasNotified = false;
        globalCurrentNotificationKey = null;
        hasNotifiedRef.current = false;

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
            const registrations =
              await navigator.serviceWorker.getRegistrations();
            await Promise.all(
              registrations.map((registration) => registration.unregister())
            );
          }

          // 3. Clear tất cả storage
          localStorage.clear();
          sessionStorage.clear();

          // 4. Set version mới vào localStorage
          localStorage.setItem("app_version", JSON.stringify(newVersion));

          // 5. Clear IndexedDB (nếu có)
          if ("indexedDB" in window) {
            try {
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
            } catch (error) {
              console.warn("Không thể xóa IndexedDB:", error);
            }
          }

          // 6. Xóa cookie (nếu cần)
          document.cookie.split(";").forEach((c) => {
            const eqPos = c.indexOf("=");
            const name = eqPos > -1 ? c.substr(0, eqPos) : c;
            document.cookie =
              name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
          });
        } catch (error) {
          console.warn("Một số cache không thể xóa:", error);
        }

        // 7. Force hard reload với timestamp để tránh cache
        const timestamp = Date.now();
        window.location.href = window.location.href + "?v=" + timestamp;
      },
    });
  };

  // Kiểm tra version ngay lập tức khi có update (manual check)
  const checkVersionNow = () => {
    checkForNewVersion(true); // forceShow = true để luôn hiển thị kết quả
  };

  useEffect(() => {
    // Load version hiện tại từ localStorage nếu có
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

    // Kiểm tra version sau 3 giây (để app load xong)
    const initialCheck = setTimeout(() => {
      checkForNewVersion();
    }, 3000);

    // Thiết lập interval để kiểm tra định kỳ
    intervalRef.current = setInterval(checkForNewVersion, checkInterval);

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      clearTimeout(initialCheck);
    };
  }, [checkInterval]);

  // Kiểm tra khi window focus (người dùng quay lại tab) - với throttle
  useEffect(() => {
    const handleFocus = () => {
      // Chỉ check khi focus nếu đã qua ít nhất 1 phút
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
