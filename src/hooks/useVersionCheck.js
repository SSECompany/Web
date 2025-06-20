import { Modal, notification } from "antd";
import { useEffect, useRef, useState } from "react";

const useVersionCheck = (checkInterval = 10 * 60 * 1000) => {
  // 10 phút
  const [hasNewVersion, setHasNewVersion] = useState(false);
  const [newVersionInfo, setNewVersionInfo] = useState(null);
  const [currentVersion, setCurrentVersion] = useState(null);
  const intervalRef = useRef(null);
  const currentVersionRef = useRef(null);
  const hasNotifiedRef = useRef(false); // Flag để tránh thông báo nhiều lần
  const isCheckingRef = useRef(false); // Flag để tránh check đồng thời
  const lastCheckTimeRef = useRef(0); // Thời gian check cuối cùng

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
  const checkForNewVersion = async () => {
    // Tránh check đồng thời
    if (isCheckingRef.current) return;

    // Tránh check quá thường xuyên (ít nhất 30 giây giữa các lần check)
    const now = Date.now();
    if (now - lastCheckTimeRef.current < 30000) return;

    isCheckingRef.current = true;
    lastCheckTimeRef.current = now;

    try {
      const newVersion = await getCurrentVersion();

      if (!newVersion) return;

      // Lần đầu tiên load, lưu version hiện tại
      if (!currentVersionRef.current) {
        currentVersionRef.current = newVersion;
        setCurrentVersion(newVersion);
        localStorage.setItem("app_version", JSON.stringify(newVersion));
        hasNotifiedRef.current = false; // Reset notification flag
        return;
      }

      // So sánh version - chỉ check version và buildHash, bỏ buildTime
      const isDifferent =
        currentVersionRef.current.version !== newVersion.version ||
        currentVersionRef.current.buildHash !== newVersion.buildHash;

      if (isDifferent && !hasNotifiedRef.current) {
        // Đánh dấu đã thông báo để tránh spam
        hasNotifiedRef.current = true;

        setHasNewVersion(true);
        setNewVersionInfo(newVersion);

        // Hiển thị notification - CHỈ 1 LẦN
        const key = `version-update-${newVersion.version}-${newVersion.buildHash}`;
        notification.info({
          message: "Có phiên bản mới!",
          description: `Phiên bản ${newVersion.version} đã có sẵn. Bạn có muốn cập nhật ngay?`,
          duration: 0, // Không tự động đóng
          key: key,
          btn: (
            <div>
              <button
                onClick={() => {
                  notification.destroy(key);
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
                  setHasNewVersion(false);
                  hasNotifiedRef.current = false; // Reset để có thể thông báo version tiếp theo
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
      }
    } catch (error) {
      console.warn("Lỗi khi kiểm tra version:", error);
    } finally {
      isCheckingRef.current = false;
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
        // Reset notification flag
        hasNotifiedRef.current = false;

        try {
          // 1. Xóa tất cả browser caches
          if ("caches" in window) {
            const cacheNames = await caches.keys();
            await Promise.all(
              cacheNames.map((cacheName) => caches.delete(cacheName))
            );
            console.log("✅ Đã xóa browser caches");
          }

          // 2. Xóa service worker cache (nếu có)
          if ("serviceWorker" in navigator) {
            const registrations =
              await navigator.serviceWorker.getRegistrations();
            await Promise.all(
              registrations.map((registration) => registration.unregister())
            );
            console.log("✅ Đã xóa service worker");
          }

          // 3. Clear tất cả storage
          localStorage.clear();
          sessionStorage.clear();
          console.log("✅ Đã xóa localStorage & sessionStorage");

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
              console.log("✅ Đã xóa IndexedDB");
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
          console.log("✅ Đã xóa cookies");
        } catch (error) {
          console.warn("Một số cache không thể xóa:", error);
        }

        // 7. Force hard reload với timestamp để tránh cache
        const timestamp = Date.now();
        window.location.href = window.location.href + "?v=" + timestamp;
      },
    });
  };

  // Kiểm tra version ngay lập tức khi có update
  const checkVersionNow = () => {
    checkForNewVersion();
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
  };
};

export default useVersionCheck;
