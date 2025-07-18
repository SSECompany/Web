import React, { useEffect, useState } from "react";
import simpleLogger from "../../../utils/simpleLogger";

const SyncFastLogViewer = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState("logs");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, filter]);

  const loadData = () => {
    setLoading(true);
    try {
      // Load logs
      const filterOptions = {};
      if (filter !== "all") {
        filterOptions.type = filter;
      }
      if (filter === "today") {
        filterOptions.today = true;
        filterOptions.type = undefined;
      }

      const filteredLogs = simpleLogger.getFilteredLogs(filterOptions);
      setLogs(filteredLogs);

      const logStats = simpleLogger.getStats();
      setStats(logStats);

      // Đã loại bỏ load pending orders
    } catch (error) {
      console.error("Error loading data:", error);
    }
    setLoading(false);
  };

  const handleExport = () => {
    simpleLogger.exportLogs();
  };

  const handleClear = () => {
    if (confirm("Bạn có chắc muốn xóa tất cả logs?")) {
      simpleLogger.clearLogs();
      setLogs([]);
      setStats(null);
      loadData();
    }
  };

  // Đã loại bỏ các hàm xử lý retry

  // Đã loại bỏ handleExportPending

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString("vi-VN");
  };

  // ✅ Component hiển thị countdown timer
  const CountdownTimer = ({ seconds, isActive = true }) => {
    const [timeLeft, setTimeLeft] = useState(seconds);

    useEffect(() => {
      setTimeLeft(seconds);
    }, [seconds]);

    useEffect(() => {
      if (!isActive || timeLeft <= 0) return;

      const timer = setInterval(() => {
        setTimeLeft((prev) => Math.max(prev - 1, 0));
      }, 1000);

      return () => clearInterval(timer);
    }, [timeLeft, isActive]);

    if (!isActive || timeLeft <= 0) {
      return (
        <span style={{ color: "#28a745", fontSize: "0.7rem" }}>
          ⏰ Sẵn sàng
        </span>
      );
    }

    const minutes = Math.floor(timeLeft / 60);
    const remainingSeconds = timeLeft % 60;
    const display =
      minutes > 0
        ? `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
        : `${remainingSeconds}s`;

    return (
      <span
        style={{
          color: timeLeft <= 30 ? "#dc3545" : "#007bff",
          fontSize: "0.7rem",
          fontWeight: "bold",
        }}
      >
        ⏱️ {display}
      </span>
    );
  };

  // ✅ Format thời gian còn lại thành text dễ đọc
  const formatTimeRemaining = (seconds) => {
    if (seconds <= 0) return "Sẵn sàng retry";

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (minutes > 0) {
      return `${minutes} phút ${remainingSeconds} giây`;
    }
    return `${remainingSeconds} giây`;
  };

  const getTypeIcon = (log) => {
    // Sử dụng errorIcon nếu có (từ enhanced error classification)
    if (log.errorIcon) {
      return log.errorIcon;
    }

    // Fallback to type-based icons
    switch (log.type) {
      case "request":
        return "📤";
      case "success":
        return "✅";
      case "error":
        return "❌";
      default:
        return "📋";
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case "request":
        return "#007bff";
      case "success":
        return "#28a745";
      case "error":
        return "#dc3545";
      default:
        return "#6c757d";
    }
  };

  if (!isOpen) return null;

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        {/* Header */}
        <div style={headerStyle}>
          <h2>📊 SyncFast Monitor</h2>
          <button style={closeButtonStyle} onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div style={{ marginBottom: "1rem", textAlign: "left" }}>
          <button
            onClick={() => setActiveTab("logs")}
            style={{
              padding: "0.5rem 1rem",
              marginRight: "0.5rem",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              backgroundColor: "#007bff",
              color: "white",
            }}
          >
            📋 Logs
          </button>
        </div>

        {/* Stats */}
        {activeTab === "logs" && stats && (
          <div style={statsStyle}>
            <div style={statItemStyle}>
              <span style={statLabelStyle}>Tổng logs:</span>
              <span style={statValueStyle}>{stats.total}</span>
            </div>
            <div style={statItemStyle}>
              <span style={statLabelStyle}>Hôm nay:</span>
              <span style={statValueStyle}>{stats.today}</span>
            </div>
            <div style={statItemStyle}>
              <span style={statLabelStyle}>Lỗi:</span>
              <span style={{ ...statValueStyle, color: "#dc3545" }}>
                {stats.errors}
              </span>
            </div>
            <div style={statItemStyle}>
              <span style={statLabelStyle}>Thành công:</span>
              <span style={{ ...statValueStyle, color: "#28a745" }}>
                {stats.success}
              </span>
            </div>
          </div>
        )}

        {/* Filter & Actions */}
        <div style={controlsStyle}>
          {activeTab === "logs" && (
            <>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                style={selectStyle}
              >
                <option value="all">Tất cả</option>
                <option value="today">Hôm nay</option>
                <option value="request">Request</option>
                <option value="success">Success</option>
                <option value="error">Error</option>
              </select>

              <button onClick={handleExport} style={exportButtonStyle}>
                📥 Export Logs
              </button>

              <button onClick={handleClear} style={clearButtonStyle}>
                🗑️ Clear Logs
              </button>
            </>
          )}
        </div>

        {/* Content */}
        <div style={logsContainerStyle}>
          {loading ? (
            <div style={loadingStyle}>Đang tải dữ liệu...</div>
          ) : activeTab === "logs" ? (
            logs.length === 0 ? (
              <div style={emptyStyle}>Chưa có logs nào</div>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  style={{
                    ...logItemStyle,
                    borderLeftColor: getTypeColor(log.type),
                  }}
                >
                  <div style={logHeaderStyle}>
                    <span style={logTypeStyle}>
                      {getTypeIcon(log)} {log.type.toUpperCase()}
                      {log.errorCategory &&
                        log.errorCategory !== "http_error" && (
                          <span
                            style={{
                              marginLeft: "0.5rem",
                              padding: "0.2rem 0.5rem",
                              backgroundColor:
                                log.errorCategory === "network_error"
                                  ? "#0277bd"
                                  : "#f57c00",
                              color: "white",
                              borderRadius: "10px",
                              fontSize: "0.7rem",
                            }}
                          >
                            {log.errorCategory.replace("_", " ").toUpperCase()}
                          </span>
                        )}
                    </span>
                    {log.status && (
                      <span
                        style={{
                          ...logStatusStyle,
                          backgroundColor:
                            log.status >= 400 ? "#f8d7da" : "#d4edda",
                          color: log.status >= 400 ? "#721c24" : "#155724",
                        }}
                      >
                        {log.status}
                      </span>
                    )}
                    {log.duration && (
                      <span style={logDurationStyle}>{log.duration}ms</span>
                    )}
                    <span style={logTimeStyle}>
                      {formatTimestamp(log.timestamp)}
                    </span>
                  </div>

                  <div style={logDetailStyle}>
                    <div style={{ textAlign: "left" }}>
                      <strong>STT REC:</strong> {JSON.stringify(log.sttRec)}
                    </div>
                    <div style={{ textAlign: "left" }}>
                      <strong>User ID:</strong> {log.userId}
                    </div>

                    {/* Network Error Display - Hiển thị network issues chi tiết */}
                    {log.isNetworkError && (
                      <div
                        style={{
                          backgroundColor: "#e1f5fe",
                          color: "#0277bd",
                          padding: "0.75rem",
                          borderRadius: "6px",
                          marginTop: "0.5rem",
                          border: "1px solid #81d4fa",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            marginBottom: "0.5rem",
                          }}
                        >
                          <strong>🌐 Network Connection Error</strong>
                          {log.errorType && (
                            <span
                              style={{
                                marginLeft: "0.5rem",
                                padding: "0.2rem 0.5rem",
                                backgroundColor: "#0277bd",
                                color: "white",
                                borderRadius: "10px",
                                fontSize: "0.7rem",
                              }}
                            >
                              {log.errorType}
                            </span>
                          )}
                        </div>

                        <div style={{ textAlign: "left" }}>
                          <strong>Issue:</strong> {log.message}
                        </div>

                        {/* Connection Info tại thời điểm lỗi */}
                        {log.connectionInfo && (
                          <div
                            style={{
                              marginTop: "0.5rem",
                              fontSize: "0.8rem",
                              textAlign: "left",
                            }}
                          >
                            <strong>Connection Status:</strong>
                            <br />• Online:{" "}
                            {log.connectionInfo.online ? "✅ Yes" : "❌ No"}
                            <br />• Type:{" "}
                            {log.connectionInfo.connectionType || "Unknown"}
                            <br />
                            {log.connectionInfo.downlink && (
                              <span>
                                • Speed: {log.connectionInfo.downlink}Mbps
                                <br />
                              </span>
                            )}
                            {log.connectionInfo.rtt && (
                              <span>
                                • Latency: {log.connectionInfo.rtt}ms
                                <br />
                              </span>
                            )}
                          </div>
                        )}

                        {/* Network Request Info */}
                        {log.networkInfo && (
                          <div
                            style={{
                              marginTop: "0.5rem",
                              fontSize: "0.8rem",
                              textAlign: "left",
                            }}
                          >
                            <strong>Request Details:</strong>
                            <br />• Has Token:{" "}
                            {log.networkInfo.hasToken ? "✅" : "❌"}
                            <br />• Endpoint: {log.networkInfo.baseURL}
                            <br />• Time:{" "}
                            {new Date(
                              log.networkInfo.timestamp
                            ).toLocaleTimeString("vi-VN")}
                            <br />
                          </div>
                        )}

                        {/* Diagnostic Info */}
                        {log.diagnostics && (
                          <div
                            style={{
                              marginTop: "0.5rem",
                              fontSize: "0.8rem",
                              textAlign: "left",
                            }}
                          >
                            <strong>Diagnostics:</strong>
                            <br />• Duration: {log.diagnostics.duration}ms
                            <br />• Browser Online:{" "}
                            {log.diagnostics.networkOnline ? "✅" : "❌"}
                            <br />• User Agent:{" "}
                            {log.diagnostics.userAgent?.split(" ")[0] ||
                              "Unknown"}
                            <br />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Business Error Display */}
                    {log.isBusinessError && (
                      <div
                        style={{
                          ...logMessageStyle,
                          backgroundColor: "#fff3cd",
                          color: "#856404",
                          padding: "0.5rem",
                          borderRadius: "4px",
                          marginTop: "0.5rem",
                        }}
                      >
                        <strong>🏢 Business Logic Error:</strong>
                        <br />
                        <strong>Status:</strong> HTTP {log.status} OK, but
                        isSucceded: {log.isSucceded}
                        <br />
                        <strong>Message:</strong>{" "}
                        {log.businessMessage || log.message}
                      </div>
                    )}

                    {/* Regular HTTP Error Display */}
                    {log.message &&
                      !log.isBusinessError &&
                      !log.isNetworkError && (
                        <div style={logMessageStyle}>
                          <strong>HTTP Error:</strong> {log.message}
                        </div>
                      )}

                    {log.errorData && (
                      <div style={logDataStyle}>
                        <strong>Response:</strong>{" "}
                        {JSON.stringify(log.errorData, null, 2)}
                      </div>
                    )}
                    {log.data && log.type === "success" && (
                      <div style={logDataStyle}>
                        <strong>Data:</strong>{" "}
                        {JSON.stringify(log.data, null, 2)}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )
          ) : null}
        </div>
      </div>
    </div>
  );
};

// Inline styles
const overlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(0, 0, 0, 0.6)",
  zIndex: 1000,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  backdropFilter: "blur(2px)",
};

const modalStyle = {
  backgroundColor: "white",
  borderRadius: "12px",
  boxShadow: "0 20px 40px rgba(0, 0, 0, 0.15)",
  width: "90vw",
  height: "90vh",
  maxWidth: "1200px",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
  border: "1px solid #e1e5e9",
};

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "1.5rem",
  borderBottom: "1px solid #e1e5e9",
  backgroundColor: "#f8f9fa",
  borderRadius: "12px 12px 0 0",
};

const closeButtonStyle = {
  background: "#ff4757",
  color: "white",
  border: "none",
  borderRadius: "50%",
  width: "32px",
  height: "32px",
  cursor: "pointer",
  fontSize: "16px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "all 0.2s ease",
};

const statsStyle = {
  display: "flex",
  gap: "2rem",
  padding: "1.5rem",
  backgroundColor: "#f8f9fa",
  borderBottom: "1px solid #e1e5e9",
  flexWrap: "wrap",
};

const statItemStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "0.5rem",
  minWidth: "120px",
};

const statLabelStyle = {
  fontSize: "0.875rem",
  color: "#6c757d",
  fontWeight: "500",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
};

const statValueStyle = {
  fontSize: "1.75rem",
  fontWeight: "bold",
  color: "#2c3e50",
};

const controlsStyle = {
  display: "flex",
  gap: "1rem",
  padding: "1.5rem",
  borderBottom: "1px solid #e1e5e9",
  alignItems: "center",
  flexWrap: "wrap",
};

const selectStyle = {
  padding: "0.75rem",
  border: "1px solid #dee2e6",
  borderRadius: "8px",
  fontSize: "0.875rem",
  minWidth: "120px",
  backgroundColor: "white",
  transition: "all 0.2s ease",
};

const exportButtonStyle = {
  padding: "0.75rem 1.5rem",
  backgroundColor: "#007bff",
  color: "white",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontSize: "0.875rem",
  fontWeight: "500",
  transition: "all 0.2s ease",
  display: "flex",
  alignItems: "center",
  gap: "0.5rem",
};

const clearButtonStyle = {
  padding: "0.75rem 1.5rem",
  backgroundColor: "#6c757d",
  color: "white",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontSize: "0.875rem",
  fontWeight: "500",
  transition: "all 0.2s ease",
  marginLeft: "auto",
};

const logsContainerStyle = {
  flex: 1,
  overflow: "auto",
  padding: "1.5rem",
  backgroundColor: "#f8f9fa",
};

const loadingStyle = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  height: "100%",
  fontSize: "1.125rem",
  color: "#6c757d",
};

const emptyStyle = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  height: "100%",
  fontSize: "1.125rem",
  color: "#adb5bd",
  fontStyle: "italic",
};

const logItemStyle = {
  border: "1px solid #e1e5e9",
  borderLeft: "4px solid #007bff",
  borderRadius: "8px",
  padding: "1.5rem",
  marginBottom: "1rem",
  backgroundColor: "white",
  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
  transition: "all 0.2s ease",
};

const logHeaderStyle = {
  display: "flex",
  alignItems: "center",
  gap: "1rem",
  marginBottom: "1rem",
  flexWrap: "wrap",
};

const logTypeStyle = {
  fontWeight: "600",
  fontSize: "0.875rem",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
};

const logStatusStyle = {
  padding: "0.375rem 0.75rem",
  borderRadius: "20px",
  fontSize: "0.75rem",
  fontWeight: "600",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
};

const logDurationStyle = {
  padding: "0.375rem 0.75rem",
  backgroundColor: "#e3f2fd",
  borderRadius: "20px",
  fontSize: "0.75rem",
  color: "#1976d2",
  fontWeight: "600",
};

const logTimeStyle = {
  color: "#6c757d",
  fontSize: "0.875rem",
  marginLeft: "auto",
  fontWeight: "500",
};

const logDetailStyle = {
  fontSize: "0.875rem",
  lineHeight: "1.6",
  textAlign: "left",
};

const logMessageStyle = {
  color: "#dc3545",
  marginTop: "1rem",
  textAlign: "left",
  padding: "1rem",
  backgroundColor: "#fff5f5",
  borderRadius: "8px",
  border: "1px solid #fed7d7",
};

const logDataStyle = {
  marginTop: "1rem",
  padding: "1rem",
  backgroundColor: "#f8f9fa",
  borderRadius: "8px",
  fontFamily: "monospace",
  fontSize: "0.8rem",
  whiteSpace: "pre-wrap",
  maxHeight: "200px",
  overflow: "auto",
  textAlign: "left",
  border: "1px solid #e1e5e9",
};

export default SyncFastLogViewer;
