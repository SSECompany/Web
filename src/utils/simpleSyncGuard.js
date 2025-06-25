// Simple Sync Guard - Đảm bảo syncFastApi được call sau khi tạo đơn thành công
class SimpleSyncGuard {
  constructor() {
    this.storageKey = 'pending_sync_simple';
    this.checkInterval = 60000; // Check every 1 minute
    this.maxRetries = 5;
    this.isRunning = false;
    
    // Start background checker
    this.startChecker();
    
    // Handle page unload
    window.addEventListener('beforeunload', () => this.stopChecker());
  }

  // Đánh dấu đơn hàng cần sync sau khi tạo thành công (CHỈ MARK, KHÔNG SYNC)
  markForSync(sttRec, userId) {
    const pendingOrders = this.getPendingOrders();
    
    // Kiểm tra xem đã có chưa
    const exists = pendingOrders.find(order => order.sttRec === sttRec);
    if (exists) {
      return;
    }

    const orderData = {
      sttRec,
      userId: userId?.toString(),
      createdAt: new Date().toISOString(),
      attempts: 0,
      lastAttempt: null,
      needsSync: true  // Đánh dấu cần sync
    };

    pendingOrders.push(orderData);
    this.savePendingOrders(pendingOrders);
    
    // KHÔNG attemptSync ngay nữa - để cho background hoặc manual trigger
  }

  // Trigger sync cho order đã được marked
  async triggerSync(sttRec) {
    return await this.attemptSync(sttRec);
  }

  // Đánh dấu đơn hàng đã sync thành công
  markSynced(sttRec) {
    const pendingOrders = this.getPendingOrders();
    const filteredOrders = pendingOrders.filter(order => order.sttRec !== sttRec);
    
    this.savePendingOrders(filteredOrders);
  }

  // Thử sync một đơn hàng
  async attemptSync(sttRec) {
    const pendingOrders = this.getPendingOrders();
    const order = pendingOrders.find(o => o.sttRec === sttRec);
    
    if (!order) {
      console.warn(`⚠️ Order ${sttRec} not found in pending list`);
      return false;
    }

    // Kiểm tra số lần thử
    if (order.attempts >= this.maxRetries) {
      console.error(`🚫 Order ${sttRec} exceeded max attempts (${this.maxRetries})`);
      return false;
    }

    try {
      // Update attempts
      order.attempts += 1;
      order.lastAttempt = new Date().toISOString();
      this.updateOrder(order);
      
      // Import và call syncFastApi
      const { syncFastApi } = await import('../api');
      await syncFastApi(sttRec, order.userId);
      
      // Thành công → remove khỏi pending
      this.markSynced(sttRec);
      
      return true;
      
    } catch (error) {
      console.error(`❌ SimpleSyncGuard: Sync failed for ${sttRec}:`, error.message);
      
      // Update error info
      order.lastError = error.message;
      order.lastErrorTime = new Date().toISOString();
      this.updateOrder(order);
      
      return false;
    }
  }

  // Update thông tin order
  updateOrder(updatedOrder) {
    const pendingOrders = this.getPendingOrders();
    const index = pendingOrders.findIndex(order => order.sttRec === updatedOrder.sttRec);
    
    if (index >= 0) {
      pendingOrders[index] = updatedOrder;
      this.savePendingOrders(pendingOrders);
    }
  }

  // Background checker đơn giản
  startChecker() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.checkIntervalId = setInterval(() => {
      this.checkAndRetry();
    }, this.checkInterval);
  }

  stopChecker() {
    if (this.checkIntervalId) {
      clearInterval(this.checkIntervalId);
      this.isRunning = false;
    }
  }

  // Check và retry pending orders
  async checkAndRetry() {
    if (!navigator.onLine) {
      return;
    }

    const pendingOrders = this.getPendingOrders();
    const now = new Date();
    
    // Filter orders cần retry (chưa vượt quá max attempts và cần sync)
    const ordersToRetry = pendingOrders.filter(order => {
      // Xóa orders quá cũ (> 24h)
      const age = now.getTime() - new Date(order.createdAt).getTime();
      if (age > 24 * 60 * 60 * 1000) {
        return false;
      }
      
      // Skip nếu đã max attempts
      if (order.attempts >= this.maxRetries) {
        return false;
      }
      
      // Chỉ retry orders cần sync
      return order.needsSync !== false;
    });

    // Clean up old orders
    const validOrders = pendingOrders.filter(order => {
      const age = now.getTime() - new Date(order.createdAt).getTime();
      return age <= 24 * 60 * 60 * 1000 && order.attempts < this.maxRetries;
    });
    
    if (validOrders.length !== pendingOrders.length) {
      this.savePendingOrders(validOrders);
    }

    // Retry orders
    if (ordersToRetry.length > 0) {
      for (const order of ordersToRetry) {
        await this.attemptSync(order.sttRec);
        
        // Small delay between retries
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  // Force retry specific order
  async forceRetry(sttRec) {
    return await this.attemptSync(sttRec);
  }

  // Force retry all pending orders
  async forceRetryAll() {
    const pendingOrders = this.getPendingOrders();
    
    for (const order of pendingOrders) {
      await this.attemptSync(order.sttRec);
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    return pendingOrders.length;
  }

  // Get pending orders
  getPendingOrders() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading pending orders:', error);
      return [];
    }
  }

  // Save pending orders
  savePendingOrders(orders) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(orders));
    } catch (error) {
      console.error('Error saving pending orders:', error);
    }
  }

  // Get simple stats
  getStats() {
    const pendingOrders = this.getPendingOrders();
    
    return {
      total: pendingOrders.length,
      needsRetry: pendingOrders.filter(o => o.attempts < this.maxRetries).length,
      maxAttemptsReached: pendingOrders.filter(o => o.attempts >= this.maxRetries).length
    };
  }

  // Check if order is pending
  isPending(sttRec) {
    const pendingOrders = this.getPendingOrders();
    return pendingOrders.some(order => order.sttRec === sttRec);
  }

  // Clear all
  clearAll() {
    localStorage.removeItem(this.storageKey);
  }

  // Get health status
  isHealthy() {
    const stats = this.getStats();
    return stats.total < 10; // Healthy if < 10 pending orders
  }
}

// Export singleton instance
const simpleSyncGuard = new SimpleSyncGuard();
export default simpleSyncGuard; 