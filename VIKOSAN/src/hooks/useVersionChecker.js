import { notification } from "antd";
import { useEffect, useRef, useState } from "react";

const CHECK_INTERVAL = 5 * 60 * 1000; // Check mỗi 5 phút
const BUILD_HASH_KEY = "app_build_hash";

/**
 * Hook kiểm tra version - PHENIKAA LOGIC
 * 
 * Cơ chế hoạt động:
 * 1. Khi load app lần đầu (hoặc sau khi clear cache):
 *    - Fetch version.json từ server
 *    - Lưu buildHash vào localStorage
 *    - hasNewVersion = false
 * 
 * 2. Khi reload trang (F5):
 *    - Lấy buildHash từ localStorage (buildHash cũ mà user đang dùng)
 *    - Fetch version.json từ server (buildHash mới nếu có deploy)
 *    - So sánh 2 buildHash
 *    - Nếu khác nhau → hasNewVersion = true
 * 
 * 3. Khi user click "Cập nhật ngay":
 *    - Clear tất cả cache + localStorage
 *    - Reload
 *    - Sau khi reload, localStorage trống → lại vào case 1
 *    - Lưu buildHash mới → hasNewVersion = false
 */
const useVersionChecker = () => {
  // State
  const [currentVersion, setCurrentVersion] = useState("");
  const [latestVersion, setLatestVersion] = useState(null);
  const [hasNewVersion, setHasNewVersion] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  
  const intervalRef = useRef(null);
  const notificationShownRef = useRef(false);
  const initialCheckDone = useRef(false);

  const checkVersion = async () => {
    try {
      // Fetch version.json từ server
      const timestamp = new Date().getTime();
      const response = await fetch(`/version.json?t=${timestamp}`, {
        cache: "no-cache",
        headers: {
          "Cache-Control": "no-cache",
          "Pragma": "no-cache",
        },
      });

      if (!response.ok) {
        setIsChecking(false);
        return;
      }

      const serverData = await response.json();
      const serverVersion = serverData.version;
      const serverBuildHash = serverData.buildHash;

      if (!serverBuildHash) {
        console.error("❌ version.json thiếu buildHash!");
        setIsChecking(false);
        return;
      }

      setLatestVersion(serverVersion);

      // Lấy buildHash đã lưu từ localStorage
      const savedBuildHash = localStorage.getItem(BUILD_HASH_KEY);

      console.log("🔍 Version check:");
      console.log("  - Saved buildHash:", savedBuildHash || "null (first time)");
      console.log("  - Server buildHash:", serverBuildHash);
      console.log("  - Server version:", serverVersion);

      // CASE 1: Lần đầu load (hoặc sau khi clear cache)
      if (!savedBuildHash) {
        console.log("✅ First time load - saving buildHash");
        localStorage.setItem(BUILD_HASH_KEY, serverBuildHash);
        setCurrentVersion(serverVersion);
        setHasNewVersion(false);
        setIsChecking(false);
        initialCheckDone.current = true;
        return;
      }

      // CASE 2: Đã có buildHash - so sánh
      if (serverBuildHash !== savedBuildHash) {
        console.log("🎉 New version detected!");
        console.log(`  - Current: ${savedBuildHash}`);
        console.log(`  - New: ${serverBuildHash}`);
        
        setHasNewVersion(true);
        
        // Hiển thị notification (chỉ 1 lần)
        if (!notificationShownRef.current && initialCheckDone.current) {
          notificationShownRef.current = true;
          showUpdateNotification(serverVersion, serverData.releaseNotes);
        }
      } else {
        console.log("✅ Same version - no update needed");
        setHasNewVersion(false);
      }

      // Set current version từ saved hoặc server
      if (!currentVersion) {
        setCurrentVersion(serverVersion);
      }

      setIsChecking(false);
      initialCheckDone.current = true;

    } catch (error) {
      setIsChecking(false);
    }
  };

  const showUpdateNotification = (newVersion, releaseNotes) => {
    notification.info({
      message: "🎉 Có phiên bản mới!",
      description: (
        <div>
          <p style={{ marginBottom: 8 }}>
            <strong>Phiên bản mới:</strong> {newVersion}
          </p>
          {releaseNotes && (
            <p style={{ marginBottom: 8 }}>
              <strong>Ghi chú:</strong> {releaseNotes}
            </p>
          )}
          <p style={{ marginTop: 12, color: "#ff4d4f", fontWeight: 500, fontSize: 13 }}>
            ⚠️ Bạn sẽ cần đăng nhập lại sau khi cập nhật
          </p>
        </div>
      ),
      placement: "topRight",
      duration: 0, // Không tự động đóng
      btn: (
        <button
          onClick={() => {
            notification.destroy();
            forceReload();
          }}
          style={{
            padding: "6px 16px",
            background: "#1890ff",
            color: "white",
            border: "none",
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

  const forceReload = async () => {
    try {
      // 1. Clear all localStorage
      localStorage.clear();
      
      // 2. Clear sessionStorage
      sessionStorage.clear();
      
      // 3. Unregister service workers
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
        }
      }
      
      // 4. Clear all caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }
      
      // 5. Force reload
      const timestamp = new Date().getTime();
      window.location.href = `${window.location.pathname}?v=${timestamp}`;
    } catch (error) {
      window.location.href = '/login';
    }
  };

  // Initial check khi mount
  useEffect(() => {
    checkVersion();
    
    // Setup interval check
    intervalRef.current = setInterval(checkVersion, CHECK_INTERVAL);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Check khi tab focus
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && initialCheckDone.current) {
        checkVersion();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return {
    currentVersion,
    latestVersion,
    hasNewVersion,
    isChecking,
    checkVersion,
    forceReload,
  };
};

export default useVersionChecker;
