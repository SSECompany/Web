// Simple Logger chỉ cho syncFastApi
class SimpleLogger {
  constructor() {
    this.storageKey = 'syncfast_api_logs';
    this.maxLogs = 200; // Giới hạn 200 logs
    this.maxAge = 7 * 24 * 60 * 60 * 1000; // 7 ngày
  }

  // Lấy logs từ localStorage
  getLogs() {
    try {
      const logs = JSON.parse(localStorage.getItem(this.storageKey) || '[]');
      return logs.reverse(); // Newest first
    } catch (e) {
      console.warn('Could not load logs:', e);
      return [];
    }
  }

  // Lưu logs vào localStorage
  saveLogs(logs) {
    try {
      // Cleanup logs cũ và giới hạn số lượng
      const now = Date.now();
      const filteredLogs = logs
        .filter(log => (now - new Date(log.timestamp).getTime()) < this.maxAge)
        .slice(-this.maxLogs);
      
      localStorage.setItem(this.storageKey, JSON.stringify(filteredLogs));
    } catch (e) {
      console.warn('Could not save logs:', e);
    }
  }

  // Log API call
  log(type, data) {
    const logs = this.getLogs().reverse(); // Oldest first for appending
    
    const logEntry = {
      id: Date.now() + Math.random(),
      type,
      timestamp: new Date().toISOString(),
      ...data,
      userAgent: navigator.userAgent,
      location: window.location.href
    };

    logs.push(logEntry);
    this.saveLogs(logs);

    return logEntry;
  }

  // Log API request
  logRequest(sttRec, userId) {
    return this.log('request', {
      action: 'syncFastApi_request',
      sttRec,
      userId: userId?.toString(),
      method: 'POST',
      url: 'SynchronousFAST/InvoiceReceipt'
    });
  }

  // Log API success
  logSuccess(sttRec, userId, response, duration) {
    return this.log('success', {
      action: 'syncFastApi_success',
      sttRec,
      userId: userId?.toString(),
      status: response?.status || 200,
      data: this.sanitizeData(response?.data),
      duration,
      method: 'POST',
      url: 'SynchronousFAST/InvoiceReceipt'
    });
  }

  // Log API error với enhanced classification
  logError(sttRec, userId, error, duration) {
    const isBusinessError = error?.response?.statusText === 'Business Logic Failed';
    const isNetworkError = ['NETWORK_OFFLINE', 'CONNECTION_FAILED', 'REQUEST_TIMEOUT', 
                           'DNS_FAILED', 'SSL_FAILED', 'CORS_BLOCKED', 'NO_RESPONSE'].includes(error?.type);
    
    // Determine error category
    let errorCategory = 'http_error';
    let errorIcon = '❌';
    
    if (isBusinessError) {
      errorCategory = 'business_error';
      errorIcon = '🏢';
    } else if (isNetworkError) {
      errorCategory = 'network_error';
      errorIcon = '🌐';
    }
    
    return this.log('error', {
      action: `syncFastApi_${errorCategory}`,
      sttRec,
      userId: userId?.toString(),
      
      // HTTP response info (if available)
      status: error?.response?.status,
      statusText: error?.response?.statusText,
      
      // Error details
      message: error?.message,
      errorType: error?.type,
      errorCategory,
      errorIcon,
      
      // Response data (if available)
      errorData: this.sanitizeData(error?.response?.data),
      
      // Timing
      duration,
      method: 'POST',
      url: 'SynchronousFAST/InvoiceReceipt',
      stack: error?.stack,
      
      // Business error details
      isBusinessError,
      businessMessage: isBusinessError ? error?.response?.data?.responseModel?.message : undefined,
      isSucceded: isBusinessError ? error?.response?.data?.responseModel?.isSucceded : undefined,
      
      // Network error details
      isNetworkError,
      networkInfo: error?.networkInfo || null,
      diagnostics: error?.diagnostics || null,
      
      // Connection info at time of error
      connectionInfo: {
        online: navigator.onLine,
        connectionType: navigator.connection?.effectiveType || 'unknown',
        downlink: navigator.connection?.downlink || null,
        rtt: navigator.connection?.rtt || null,
        timestamp: new Date().toISOString()
      }
    });
  }

  // Sanitize data để bảo mật
  sanitizeData(data) {
    if (!data) return null;
    
    try {
      const dataStr = JSON.stringify(data);
      if (dataStr.length > 3000) {
        return { _truncated: true, _size: dataStr.length };
      }
      return data;
    } catch (e) {
      return { _error: 'Could not parse data' };
    }
  }

  // Lấy thống kê
  getStats() {
    const logs = this.getLogs();
    const today = new Date().toDateString();
    const todayLogs = logs.filter(log => 
      new Date(log.timestamp).toDateString() === today
    );

    return {
      total: logs.length,
      today: todayLogs.length,
      errors: logs.filter(log => log.type === 'error').length,
      success: logs.filter(log => log.type === 'success').length,
      requests: logs.filter(log => log.type === 'request').length,
      todayErrors: todayLogs.filter(log => log.type === 'error').length,
      recentErrors: logs.filter(log => log.type === 'error').slice(0, 5)
    };
  }

  // Lấy logs với filter đơn giản
  getFilteredLogs(filter = {}) {
    let logs = this.getLogs();

    if (filter.type) {
      logs = logs.filter(log => log.type === filter.type);
    }

    if (filter.today) {
      const today = new Date().toDateString();
      logs = logs.filter(log => 
        new Date(log.timestamp).toDateString() === today
      );
    }

    if (filter.limit) {
      logs = logs.slice(0, filter.limit);
    }

    return logs;
  }

  // Clear all logs
  clearLogs() {
    localStorage.removeItem(this.storageKey);
  }

  // Export logs (download JSON)
  exportLogs() {
    const logs = this.getLogs();
    const exportData = {
      exportDate: new Date().toISOString(),
      totalLogs: logs.length,
      stats: this.getStats(),
      logs
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
      type: 'application/json' 
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `syncfast-logs-${new Date().toISOString().split('T')[0]}.json`;
    a.style.display = 'none';
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

// Export singleton instance
const simpleLogger = new SimpleLogger();
export default simpleLogger; 