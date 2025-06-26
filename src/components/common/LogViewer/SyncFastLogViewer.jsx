import React, { useState, useEffect } from 'react';
import simpleLogger from '../../../utils/simpleLogger';
import simpleSyncGuard from '../../../utils/simpleSyncGuard';

const SyncFastLogViewer = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [pendingStats, setPendingStats] = useState(null);
  const [activeTab, setActiveTab] = useState('logs'); // 'logs' or 'pending'
  const [filter, setFilter] = useState('all');
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
      if (filter !== 'all') {
        filterOptions.type = filter;
      }
      if (filter === 'today') {
        filterOptions.today = true;
        filterOptions.type = undefined;
      }
      
      const filteredLogs = simpleLogger.getFilteredLogs(filterOptions);
      setLogs(filteredLogs);
      
      const logStats = simpleLogger.getStats();
      setStats(logStats);

      // Load pending sync orders
      const orders = simpleSyncGuard.getPendingOrders();
      setPendingOrders(orders);

      const syncStats = simpleSyncGuard.getStats();
      setPendingStats(syncStats);
      
    } catch (error) {
      console.error('Error loading data:', error);
    }
    setLoading(false);
  };

  const handleExport = () => {
    simpleLogger.exportLogs();
  };

  const handleClear = () => {
    if (confirm('Bạn có chắc muốn xóa tất cả logs?')) {
      simpleLogger.clearLogs();
      setLogs([]);
      setStats(null);
      loadData();
    }
  };

  const handleForceRetry = async (sttRec) => {
    const success = await simpleSyncGuard.forceRetry(sttRec);
    if (success) {
      alert(`🔄 Đang retry đơn ${sttRec}. Vui lòng đợi...`);
      setTimeout(() => loadData(), 2000);
    }
  };

  const handleForceRetryAll = async () => {
    const retryCount = await simpleSyncGuard.forceRetryAll();
    if (retryCount > 0) {
      alert(`🔄 Đang retry ${retryCount} đơn pending. Vui lòng đợi...`);
      setTimeout(() => loadData(), 2000);
    } else {
      alert('Không có đơn nào cần retry.');
    }
  };

  const handleClearPending = () => {
    if (confirm('Bạn có chắc muốn xóa tất cả pending sync orders?')) {
      simpleSyncGuard.clearAll();
      setPendingOrders([]);
      setPendingStats(null);
    }
  };

  const handleExportPending = () => {
    const exportData = {
      exportDate: new Date().toISOString(),
      stats: pendingStats,
      orders: pendingOrders
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pending-sync-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString('vi-VN');
  };

  const getTypeIcon = (log) => {
    // Sử dụng errorIcon nếu có (từ enhanced error classification)
    if (log.errorIcon) {
      return log.errorIcon;
    }
    
    // Fallback to type-based icons
    switch (log.type) {
      case 'request': return '📤';
      case 'success': return '✅';
      case 'error': return '❌';
      default: return '📋';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'request': return '#007bff';
      case 'success': return '#28a745';
      case 'error': return '#dc3545';
      default: return '#6c757d';
    }
  };

  if (!isOpen) return null;

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        {/* Header */}
        <div style={headerStyle}>
          <h2>📊 SyncFast Monitor</h2>
          <button style={closeButtonStyle} onClick={onClose}>✕</button>
        </div>

        {/* Tabs */}
        <div style={tabsStyle}>
          <button 
            style={{...tabButtonStyle, ...(activeTab === 'logs' ? activeTabStyle : {})}}
            onClick={() => setActiveTab('logs')}
          >
            📋 API Logs ({stats?.total || 0})
          </button>
          <button 
            style={{...tabButtonStyle, ...(activeTab === 'pending' ? activeTabStyle : {})}}
            onClick={() => setActiveTab('pending')}
          >
            🔄 Pending Sync ({pendingStats?.total || 0})
          </button>
        </div>

        {/* Stats */}
        {activeTab === 'logs' && stats && (
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
              <span style={{...statValueStyle, color: '#dc3545'}}>{stats.errors}</span>
            </div>
            <div style={statItemStyle}>
              <span style={statLabelStyle}>Thành công:</span>
              <span style={{...statValueStyle, color: '#28a745'}}>{stats.success}</span>
            </div>
          </div>
        )}

        {/* Pending Sync Stats */}
        {activeTab === 'pending' && pendingStats && (
          <div style={statsStyle}>
            <div style={statItemStyle}>
              <span style={statLabelStyle}>Total Orders:</span>
              <span style={{...statValueStyle, color: '#007bff'}}>{pendingStats.total}</span>
            </div>
            <div style={statItemStyle}>
              <span style={statLabelStyle}>Need Retry:</span>
              <span style={{...statValueStyle, color: '#ffc107'}}>{pendingStats.needsRetry}</span>
            </div>
            <div style={statItemStyle}>
              <span style={statLabelStyle}>Max Attempts:</span>
              <span style={{...statValueStyle, color: '#dc3545'}}>{pendingStats.maxAttemptsReached}</span>
            </div>
            <div style={statItemStyle}>
              <span style={statLabelStyle}>System Health:</span>
              <span style={{...statValueStyle, color: simpleSyncGuard.isHealthy() ? '#28a745' : '#dc3545'}}>
                {simpleSyncGuard.isHealthy() ? 'Healthy' : 'Issues'}
              </span>
            </div>
          </div>
        )}

        {/* Filter & Actions */}
        <div style={controlsStyle}>
          {activeTab === 'logs' && (
            <>
              <select value={filter} onChange={(e) => setFilter(e.target.value)} style={selectStyle}>
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
          
          {activeTab === 'pending' && (
            <>
              <button onClick={handleForceRetryAll} style={{...exportButtonStyle, backgroundColor: '#28a745'}}>
                🔄 Retry All Pending
              </button>
              
              <button onClick={handleExportPending} style={exportButtonStyle}>
                📥 Export Orders
              </button>
              
              <button onClick={handleClearPending} style={clearButtonStyle}>
                🗑️ Clear All
              </button>
            </>
          )}
        </div>

        {/* Content */}
        <div style={logsContainerStyle}>
          {loading ? (
            <div style={loadingStyle}>Đang tải dữ liệu...</div>
          ) : activeTab === 'logs' ? (
            logs.length === 0 ? (
              <div style={emptyStyle}>Chưa có logs nào</div>
            ) : (
              logs.map((log) => (
                <div key={log.id} style={{...logItemStyle, borderLeftColor: getTypeColor(log.type)}}>
                  <div style={logHeaderStyle}>
                    <span style={logTypeStyle}>
                      {getTypeIcon(log)} {log.type.toUpperCase()}
                      {log.errorCategory && log.errorCategory !== 'http_error' && (
                        <span style={{
                          marginLeft: '0.5rem',
                          padding: '0.2rem 0.5rem',
                          backgroundColor: log.errorCategory === 'network_error' ? '#0277bd' : '#f57c00',
                          color: 'white',
                          borderRadius: '10px',
                          fontSize: '0.7rem'
                        }}>
                          {log.errorCategory.replace('_', ' ').toUpperCase()}
                        </span>
                      )}
                    </span>
                    {log.status && (
                      <span style={{
                        ...logStatusStyle,
                        backgroundColor: log.status >= 400 ? '#f8d7da' : '#d4edda',
                        color: log.status >= 400 ? '#721c24' : '#155724'
                      }}>
                        {log.status}
                      </span>
                    )}
                    {log.duration && (
                      <span style={logDurationStyle}>{log.duration}ms</span>
                    )}
                    <span style={logTimeStyle}>{formatTimestamp(log.timestamp)}</span>
                  </div>
                  
                  <div style={logDetailStyle}>
                    <div><strong>STT REC:</strong> {JSON.stringify(log.sttRec)}</div>
                    <div><strong>User ID:</strong> {log.userId}</div>
                    
                    {/* Network Error Display - Hiển thị network issues chi tiết */}
                    {log.isNetworkError && (
                      <div style={{
                        backgroundColor: '#e1f5fe', 
                        color: '#0277bd', 
                        padding: '0.75rem', 
                        borderRadius: '6px', 
                        marginTop: '0.5rem',
                        border: '1px solid #81d4fa'
                      }}>
                        <div style={{display: 'flex', alignItems: 'center', marginBottom: '0.5rem'}}>
                          <strong>🌐 Network Connection Error</strong>
                          {log.errorType && (
                            <span style={{
                              marginLeft: '0.5rem',
                              padding: '0.2rem 0.5rem',
                              backgroundColor: '#0277bd',
                              color: 'white',
                              borderRadius: '10px',
                              fontSize: '0.7rem'
                            }}>
                              {log.errorType}
                            </span>
                          )}
                        </div>
                        
                        <div><strong>Issue:</strong> {log.message}</div>
                        
                        {/* Connection Info tại thời điểm lỗi */}
                        {log.connectionInfo && (
                          <div style={{marginTop: '0.5rem', fontSize: '0.8rem'}}>
                            <strong>Connection Status:</strong><br/>
                            • Online: {log.connectionInfo.online ? '✅ Yes' : '❌ No'}<br/>
                            • Type: {log.connectionInfo.connectionType || 'Unknown'}<br/>
                            {log.connectionInfo.downlink && <span>• Speed: {log.connectionInfo.downlink}Mbps<br/></span>}
                            {log.connectionInfo.rtt && <span>• Latency: {log.connectionInfo.rtt}ms<br/></span>}
                          </div>
                        )}
                        
                        {/* Network Request Info */}
                        {log.networkInfo && (
                          <div style={{marginTop: '0.5rem', fontSize: '0.8rem'}}>
                            <strong>Request Details:</strong><br/>
                            • Has Token: {log.networkInfo.hasToken ? '✅' : '❌'}<br/>
                            • Endpoint: {log.networkInfo.baseURL}<br/>
                            • Time: {new Date(log.networkInfo.timestamp).toLocaleTimeString('vi-VN')}<br/>
                          </div>
                        )}
                        
                        {/* Diagnostic Info */}
                        {log.diagnostics && (
                          <div style={{marginTop: '0.5rem', fontSize: '0.8rem'}}>
                            <strong>Diagnostics:</strong><br/>
                            • Duration: {log.diagnostics.duration}ms<br/>
                            • Browser Online: {log.diagnostics.networkOnline ? '✅' : '❌'}<br/>
                            • User Agent: {log.diagnostics.userAgent?.split(' ')[0] || 'Unknown'}<br/>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Business Error Display */}
                    {log.isBusinessError && (
                      <div style={{...logMessageStyle, backgroundColor: '#fff3cd', color: '#856404', padding: '0.5rem', borderRadius: '4px', marginTop: '0.5rem'}}>
                        <strong>🏢 Business Logic Error:</strong><br/>
                        <strong>Status:</strong> HTTP {log.status} OK, but isSucceded: {log.isSucceded}<br/>
                        <strong>Message:</strong> {log.businessMessage || log.message}
                      </div>
                    )}
                    
                    {/* Regular HTTP Error Display */}
                    {log.message && !log.isBusinessError && !log.isNetworkError && (
                      <div style={logMessageStyle}>
                        <strong>HTTP Error:</strong> {log.message}
                      </div>
                    )}
                    
                    {log.errorData && (
                      <div style={logDataStyle}>
                        <strong>Response:</strong> {JSON.stringify(log.errorData, null, 2)}
                      </div>
                    )}
                    {log.data && log.type === 'success' && (
                      <div style={logDataStyle}>
                        <strong>Data:</strong> {JSON.stringify(log.data, null, 2)}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )
          ) : (
            // Pending Sync Orders
            pendingOrders.length === 0 ? (
              <div style={emptyStyle}>🔄 Không có đơn hàng pending sync - Tất cả đã được đồng bộ!</div>
            ) : (
              pendingOrders.map((order) => (
                <div key={order.sttRec} style={{
                  ...logItemStyle, 
                  borderLeftColor: order.needsRetry ? '#ffc107' : '#28a745'
                }}>
                  <div style={logHeaderStyle}>
                    <span style={logTypeStyle}>
                      {order.needsRetry ? '⏳ PENDING' : '✅ WAITING'}
                    </span>
                    
                    <span style={{...logStatusStyle, backgroundColor: '#e3f2fd', color: '#1976d2'}}>
                      {order.attempts}/5 attempts
                    </span>
                    
                    <span style={logTimeStyle}>{formatTimestamp(order.createdAt)}</span>
                    
                    {order.needsRetry && (
                      <button 
                        onClick={() => handleForceRetry(order.sttRec)}
                        style={{
                          ...exportButtonStyle,
                          fontSize: '0.7rem',
                          padding: '0.25rem 0.5rem',
                          backgroundColor: '#28a745'
                        }}
                      >
                        🔄 Retry Now
                      </button>
                    )}
                  </div>
                  
                  <div style={logDetailStyle}>
                    <div><strong>STT REC:</strong> {order.sttRec}</div>
                    <div><strong>Age:</strong> {Math.round((Date.now() - new Date(order.createdAt)) / 1000 / 60)} phút</div>
                    <div><strong>Last Attempt:</strong> {order.lastAttempt ? formatTimestamp(order.lastAttempt) : 'None'}</div>
                    
                    {order.lastError && (
                      <div style={logDataStyle}>
                        <strong>Last Error:</strong> {order.lastError}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )
          )}
        </div>
      </div>
    </div>
  );
};

// Inline styles
const overlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  zIndex: 1000,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

const modalStyle = {
  backgroundColor: 'white',
  borderRadius: '8px',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  width: '90vw',
  height: '90vh',
  maxWidth: '1000px',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden'
};

const headerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '1rem',
  borderBottom: '1px solid #e5e5e5',
  backgroundColor: '#f8f9fa'
};

const closeButtonStyle = {
  background: '#ff4757',
  color: 'white',
  border: 'none',
  borderRadius: '50%',
  width: '30px',
  height: '30px',
  cursor: 'pointer',
  fontSize: '16px'
};

const statsStyle = {
  display: 'flex',
  gap: '2rem',
  padding: '1rem',
  backgroundColor: '#f8f9fa',
  borderBottom: '1px solid #e5e5e5'
};

const statItemStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '0.25rem'
};

const statLabelStyle = {
  fontSize: '0.875rem',
  color: '#666',
  fontWeight: '500'
};

const statValueStyle = {
  fontSize: '1.5rem',
  fontWeight: 'bold',
  color: '#333'
};

const controlsStyle = {
  display: 'flex',
  gap: '1rem',
  padding: '1rem',
  borderBottom: '1px solid #e5e5e5',
  alignItems: 'center'
};

const selectStyle = {
  padding: '0.5rem',
  border: '1px solid #ddd',
  borderRadius: '4px',
  fontSize: '0.875rem'
};

const exportButtonStyle = {
  padding: '0.5rem 1rem',
  backgroundColor: '#007bff',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '0.875rem'
};

const clearButtonStyle = {
  padding: '0.5rem 1rem',
  backgroundColor: '#6c757d',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '0.875rem',
  marginLeft: 'auto'
};

const tabsStyle = {
  display: 'flex',
  borderBottom: '1px solid #e5e5e5',
  backgroundColor: '#f8f9fa'
};

const tabButtonStyle = {
  padding: '1rem 1.5rem',
  border: 'none',
  backgroundColor: 'transparent',
  cursor: 'pointer',
  fontSize: '0.875rem',
  fontWeight: '500',
  color: '#666',
  borderBottom: '2px solid transparent',
  transition: 'all 0.2s'
};

const activeTabStyle = {
  color: '#007bff',
  borderBottomColor: '#007bff',
  backgroundColor: 'white'
};

const logsContainerStyle = {
  flex: 1,
  overflow: 'auto',
  padding: '1rem'
};

const loadingStyle = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  height: '100%',
  fontSize: '1.125rem',
  color: '#666'
};

const emptyStyle = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  height: '100%',
  fontSize: '1.125rem',
  color: '#999'
};

const logItemStyle = {
  border: '1px solid #e5e5e5',
  borderLeft: '4px solid #007bff',
  borderRadius: '4px',
  padding: '1rem',
  marginBottom: '0.5rem',
  backgroundColor: 'white'
};

const logHeaderStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '1rem',
  marginBottom: '0.5rem',
  flexWrap: 'wrap'
};

const logTypeStyle = {
  fontWeight: 'bold',
  fontSize: '0.875rem'
};

const logStatusStyle = {
  padding: '0.25rem 0.5rem',
  borderRadius: '12px',
  fontSize: '0.75rem',
  fontWeight: 'bold'
};

const logDurationStyle = {
  padding: '0.25rem 0.5rem',
  backgroundColor: '#e3f2fd',
  borderRadius: '12px',
  fontSize: '0.75rem',
  color: '#1976d2'
};

const logTimeStyle = {
  color: '#666',
  fontSize: '0.875rem',
  marginLeft: 'auto'
};

const logDetailStyle = {
  fontSize: '0.875rem',
  lineHeight: '1.4'
};

const logMessageStyle = {
  color: '#dc3545',
  marginTop: '0.5rem'
};

const logDataStyle = {
  marginTop: '0.5rem',
  padding: '0.5rem',
  backgroundColor: '#f8f9fa',
  borderRadius: '4px',
  fontFamily: 'monospace',
  fontSize: '0.8rem',
  whiteSpace: 'pre-wrap',
  maxHeight: '200px',
  overflow: 'auto'
};

export default SyncFastLogViewer; 