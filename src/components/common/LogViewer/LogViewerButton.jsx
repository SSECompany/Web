import React, { useEffect, useState } from "react";
import simpleLogger from "../../../utils/simpleLogger";
import SyncFastLogViewer from "./SyncFastLogViewer";

const LogViewerButton = ({ isInNavbar = false }) => {
  const [isLogViewerOpen, setIsLogViewerOpen] = useState(false);
  const [errorCount, setErrorCount] = useState(0);
  const [hasNewErrors, setHasNewErrors] = useState(false);
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    const checkToken = () => {
      const token = localStorage.getItem("access_token");
      setHasToken(!!token);
    };

    checkToken();

    window.addEventListener("storage", checkToken);

    window.addEventListener("tokenChange", checkToken);

    return () => {
      window.removeEventListener("storage", checkToken);
      window.removeEventListener("tokenChange", checkToken);
    };
  }, []);

  useEffect(() => {
    if (!hasToken) {
      setErrorCount(0);
      setHasNewErrors(false);
      return;
    }

    const updateCounts = async () => {
      try {
        const logStats = simpleLogger.getStats();

        const newErrorCount = logStats.errors;

        if (newErrorCount > errorCount) {
          setHasNewErrors(true);
          setTimeout(() => setHasNewErrors(false), 5000);
        }

        setErrorCount(newErrorCount);
      } catch (error) {
        console.warn("Error updating counts:", error);
      }
    };

    const interval = setInterval(updateCounts, 5000);

    updateCounts();

    return () => {
      clearInterval(interval);
    };
  }, [errorCount, hasToken]);

  const handleOpenLogViewer = () => {
    setIsLogViewerOpen(true);
    setHasNewErrors(false);
  };

  if (!hasToken) {
    return null;
  }

  return (
    <>
      <button
        className={`log-viewer-fab ${hasNewErrors ? "has-errors" : ""} ${
          isInNavbar ? "in-navbar" : ""
        }`}
        onClick={handleOpenLogViewer}
        title=""
        style={
          isInNavbar
            ? {
                position: "static",
                top: "auto",
                right: "auto",
                transform: "none",
                margin: 0,
                width: "auto",
                minWidth: "60px",
                height: "28px",
                fontSize: "12px",
                zIndex: "auto",
                padding: "0 8px",
              }
            : {}
        }
      >
        {/* Main icons - horizontal layout */}
        <div className="main-icons">
          <span>📊</span>
          {hasNewErrors && <span>🚨</span>}
        </div>

        {/* Status indicators - horizontal layout */}
        <div
          className="status-indicators"
          style={isInNavbar ? { display: "none" } : {}}
        >
          {hasNewErrors && <div className="status-indicator error"></div>}
        </div>
      </button>

      <SyncFastLogViewer
        isOpen={isLogViewerOpen}
        onClose={() => setIsLogViewerOpen(false)}
      />

      <style jsx>{`
        .log-viewer-fab {
          position: fixed;
          top: 15px;
          right: 300px;
          width: 80px;
          height: 32px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
          z-index: 999;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          user-select: none;
          border: 1px solid rgba(255, 255, 255, 0.2);
          font-size: 14px;
          color: white;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
          gap: 4px;
        }

        .log-viewer-fab.in-navbar {
          position: static !important;
          top: auto !important;
          right: auto !important;
          transform: none !important;
          margin: 0 !important;
          width: 60px;
          height: 28px;
          font-size: 12px;
          z-index: auto !important;
        }

        .log-viewer-fab:hover {
          transform: translateY(-1px) scale(1.1);
          box-shadow: 0 6px 16px rgba(102, 126, 234, 0.5);
          background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
        }

        .log-viewer-fab:active {
          transform: translateY(0) scale(0.95);
          box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
        }

        .log-viewer-fab.has-errors {
          background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
          box-shadow: 0 4px 12px rgba(255, 107, 107, 0.3);
          animation: pulse-error 2s infinite;
        }

        .log-viewer-fab.has-errors:hover {
          box-shadow: 0 6px 16px rgba(255, 107, 107, 0.5);
          background: linear-gradient(135deg, #ee5a24 0%, #ff6b6b 100%);
        }

        @keyframes pulse-error {
          0%,
          100% {
            box-shadow: 0 4px 12px rgba(255, 107, 107, 0.3);
          }
          50% {
            box-shadow: 0 4px 12px rgba(255, 107, 107, 0.6),
              0 0 0 2px rgba(255, 107, 107, 0.2);
          }
        }

        /* Main icons - horizontal layout */
        .log-viewer-fab .main-icons {
          display: flex;
          flex-direction: row;
          gap: 4px;
          align-items: center;
          justify-content: center;
        }

        /* Status indicators - horizontal layout */
        .log-viewer-fab .status-indicators {
          position: absolute;
          top: -3px;
          right: -3px;
          display: flex;
          flex-direction: row;
          gap: 1px;
          align-items: center;
        }

        .log-viewer-fab .status-indicator {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          animation: blink 1.5s infinite;
        }

        .log-viewer-fab .status-indicator.error {
          background: #ff4757;
        }

        @keyframes blink {
          0%,
          50% {
            opacity: 1;
          }
          51%,
          100% {
            opacity: 0.3;
          }
        }
      `}</style>
    </>
  );
};

export default LogViewerButton;
