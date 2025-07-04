// Simple Sync Guard - Đảm bảo syncFastApi được call sau khi tạo đơn thành công
class SimpleSyncGuard {
  constructor() {
    this.storageKey = "pending_sync_simple";
    this.checkInterval = 180000; // ✅ Global background check every 3 minutes
    this.individualRetryInterval = 60000; // ✅ Individual order retry every 1 minute
    this.maxRetries = 5;
    this.isRunning = false;

    // ✅ Thêm locking mechanism để tránh race condition
    this.activeSyncs = new Map(); // Map<sttRec, Promise>

    // Start background checker
    this.startChecker();

    // Handle page unload
    window.addEventListener("beforeunload", () => this.stopChecker());
  }

  // Đánh dấu đơn hàng cần sync sau khi tạo thành công (CHỈ MARK, KHÔNG SYNC)
  markForSync(sttRec, userId) {
    const pendingOrders = this.getPendingOrders();

    // Kiểm tra xem đã có chưa
    const exists = pendingOrders.find((order) => order.sttRec === sttRec);
    if (exists) {
      return;
    }

    const orderData = {
      sttRec,
      userId: userId?.toString(),
      createdAt: new Date().toISOString(),
      attempts: 0,
      lastAttempt: null,
      needsSync: true, // Đánh dấu cần sync
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
    const filteredOrders = pendingOrders.filter(
      (order) => order.sttRec !== sttRec
    );

    this.savePendingOrders(filteredOrders);
  }

  // Thử sync một đơn hàng với locking mechanism
  async attemptSync(sttRec) {
    // ✅ KIỂM TRA LOCK: Nếu đang sync sttRec này rồi thì đợi
    if (this.activeSyncs.has(sttRec)) {
      console.log(`🔒 Order ${sttRec} is already being synced, waiting...`);
      try {
        // Đợi sync hiện tại hoàn thành
        return await this.activeSyncs.get(sttRec);
      } catch (error) {
        // Sync hiện tại failed, sẽ retry bên dưới
        console.log(`⚠️ Waiting sync for ${sttRec} failed, will retry...`);
      }
    }

    const pendingOrders = this.getPendingOrders();
    const order = pendingOrders.find((o) => o.sttRec === sttRec);

    if (!order) {
      console.warn(`⚠️ Order ${sttRec} not found in pending list`);
      return false;
    }

    // Kiểm tra số lần thử
    if (order.attempts >= this.maxRetries) {
      console.error(
        `🚫 Order ${sttRec} exceeded max attempts (${this.maxRetries})`
      );
      return false;
    }

    // ✅ TẠO LOCK: Tạo promise để lock sttRec này
    const syncPromise = this._doSync(sttRec, order);
    this.activeSyncs.set(sttRec, syncPromise);

    try {
      const result = await syncPromise;
      return result;
    } finally {
      // ✅ GIẢI PHÓNG LOCK: Luôn xóa lock sau khi hoàn thành
      this.activeSyncs.delete(sttRec);
    }
  }

  // Private method thực hiện sync thực tế
  async _doSync(sttRec, order) {
    try {
      console.log(
        `🔄 Starting sync for order ${sttRec} (attempt ${order.attempts + 1}/${
          this.maxRetries
        })`
      );

      // Update attempts
      order.attempts += 1;
      order.lastAttempt = new Date().toISOString();
      this.updateOrder(order);

      // Import và call syncFastApi
      const { syncFastApi } = await import("../api");
      await syncFastApi(sttRec, order.userId);

      // Thành công → remove khỏi pending
      this.markSynced(sttRec);
      console.log(`✅ Sync successful for order ${sttRec}`);

      return true;
    } catch (error) {
      console.error(
        `❌ SimpleSyncGuard: Sync failed for ${sttRec}:`,
        error.message
      );

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
    const index = pendingOrders.findIndex(
      (order) => order.sttRec === updatedOrder.sttRec
    );

    if (index >= 0) {
      pendingOrders[index] = updatedOrder;
      this.savePendingOrders(pendingOrders);
    }
  }

  // Background checker đơn giản
  startChecker() {
    if (this.isRunning) return;

    this.isRunning = true;
    this.lastCheckTime = Date.now(); // ✅ Track last check time

    // ✅ Global background checker (3 phút)
    this.checkIntervalId = setInterval(() => {
      this.lastCheckTime = Date.now(); // ✅ Update last check time
      this.checkAndRetry();
    }, this.checkInterval);

    // ✅ Individual retry checker (10 giây) - check individual orders ready for 1-minute retry
    this.individualCheckId = setInterval(() => {
      this.checkIndividualRetries();
    }, 10000); // Check every 10 seconds for individual retries
  }

  stopChecker() {
    if (this.checkIntervalId) {
      clearInterval(this.checkIntervalId);
      this.isRunning = false;
    }
    if (this.individualCheckId) {
      clearInterval(this.individualCheckId);
    }
  }

  // ✅ Individual retry checker - chỉ retry các đơn đã đủ 1 phút từ lastAttempt
  async checkIndividualRetries() {
    if (!navigator.onLine) {
      return;
    }

    const pendingOrders = this.getPendingOrders();
    const now = new Date();

    // Filter orders ready for individual retry (1 phút từ lastAttempt)
    const ordersReadyForRetry = pendingOrders.filter((order) => {
      // Basic checks
      const age = now.getTime() - new Date(order.createdAt).getTime();
      if (age > 24 * 60 * 60 * 1000) return false; // Too old
      if (order.attempts >= this.maxRetries) return false; // Max attempts
      if (this.activeSyncs.has(order.sttRec)) return false; // Already syncing

      // Check if ready for individual retry
      return this.shouldRetryOrderNow(order);
    });

    // Retry ready orders
    if (ordersReadyForRetry.length > 0) {
      console.log(
        `🔄 Individual retry: ${ordersReadyForRetry.length} orders ready`
      );

      // Process 1 by 1 với delay để không overwhelm
      for (const order of ordersReadyForRetry) {
        await this.attemptSync(order.sttRec);

        // Small delay between individual retries
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }

  // Check và retry pending orders với improved concurrency handling
  async checkAndRetry() {
    if (!navigator.onLine) {
      return;
    }

    const pendingOrders = this.getPendingOrders();
    const now = new Date();

    // ✅ Filter orders cần retry (individual 1 phút hoặc background 3 phút)
    const ordersToRetry = pendingOrders.filter((order) => {
      // Xóa orders quá cũ (> 24h)
      const age = now.getTime() - new Date(order.createdAt).getTime();
      if (age > 24 * 60 * 60 * 1000) {
        return false;
      }

      // Skip nếu đã max attempts
      if (order.attempts >= this.maxRetries) {
        return false;
      }

      // ✅ Skip nếu đang được sync
      if (this.activeSyncs.has(order.sttRec)) {
        console.log(`⏭️ Skipping ${order.sttRec} - already syncing`);
        return false;
      }

      // ✅ Check individual retry time (1 phút từ lastAttempt)
      if (this.shouldRetryOrderNow(order)) {
        return true;
      }

      return false;
    });

    // Clean up old orders
    const validOrders = pendingOrders.filter((order) => {
      const age = now.getTime() - new Date(order.createdAt).getTime();
      return age <= 24 * 60 * 60 * 1000 && order.attempts < this.maxRetries;
    });

    if (validOrders.length !== pendingOrders.length) {
      this.savePendingOrders(validOrders);
    }

    // ✅ Retry orders với controlled concurrency (tối đa 3 concurrent syncs)
    if (ordersToRetry.length > 0) {
      console.log(
        `🔄 Individual retry starting for ${ordersToRetry.length} orders (ready for 1-minute retry)`
      );

      // Batch process để tránh quá nhiều concurrent requests
      const batchSize = 3;
      for (let i = 0; i < ordersToRetry.length; i += batchSize) {
        const batch = ordersToRetry.slice(i, i + batchSize);

        // Process batch concurrently
        const promises = batch.map((order) => this.attemptSync(order.sttRec));
        await Promise.allSettled(promises);

        // Small delay between batches
        if (i + batchSize < ordersToRetry.length) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
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
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    return pendingOrders.length;
  }

  // Get pending orders
  getPendingOrders() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error("Error loading pending orders:", error);
      return [];
    }
  }

  // Save pending orders
  savePendingOrders(orders) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(orders));
    } catch (error) {
      console.error("Error saving pending orders:", error);
    }
  }

  // ✅ Thêm method để check active syncs
  getActiveSyncs() {
    return Array.from(this.activeSyncs.keys());
  }

  // ✅ Thêm method để check if đang sync
  isSyncing(sttRec) {
    return this.activeSyncs.has(sttRec);
  }

  // ✅ Tính toán thời gian còn lại đến lần retry tiếp theo cho individual order
  getTimeToNextIndividualRetry(order) {
    if (!order.lastAttempt) {
      // Chưa có attempt nào → sẽ retry trong background checker tiếp theo
      return this.getNextBackgroundCheck();
    }

    // Có attempt rồi → retry sau 1 phút từ lastAttempt
    const lastAttemptTime = new Date(order.lastAttempt).getTime();
    const nextRetryTime = lastAttemptTime + this.individualRetryInterval;
    return Math.max(nextRetryTime, Date.now());
  }

  // ✅ Tính toán thời gian còn lại (seconds) cho individual order
  getTimeToNextRetry(sttRec) {
    const pendingOrders = this.getPendingOrders();
    const order = pendingOrders.find((o) => o.sttRec === sttRec);

    if (!order) return 0;

    // Nếu đang sync thì không có thời gian còn lại
    if (this.isSyncing(sttRec)) return 0;

    // Nếu đã max attempts thì không retry nữa
    if (order.attempts >= this.maxRetries) return 0;

    const nextRetryTime = this.getTimeToNextIndividualRetry(order);
    const remainingMs = nextRetryTime - Date.now();

    return Math.max(Math.ceil(remainingMs / 1000), 0);
  }

  // ✅ Get stats của tất cả pending orders với time remaining
  getPendingOrdersWithRetryTime() {
    const pendingOrders = this.getPendingOrders();

    return pendingOrders.map((order) => ({
      ...order,
      timeToRetry: this.getTimeToNextRetry(order.sttRec),
      isSyncing: this.isSyncing(order.sttRec),
      canRetry: order.attempts < this.maxRetries,
      shouldRetryNow: this.shouldRetryOrderNow(order),
    }));
  }

  // ✅ Kiểm tra order có nên retry ngay không (đã qua 1 phút từ lastAttempt)
  shouldRetryOrderNow(order) {
    if (!order.lastAttempt) return true; // Chưa có attempt nào
    if (order.attempts >= this.maxRetries) return false; // Đã max attempts
    if (this.isSyncing(order.sttRec)) return false; // Đang sync

    const timeSinceLastAttempt =
      Date.now() - new Date(order.lastAttempt).getTime();
    return timeSinceLastAttempt >= this.individualRetryInterval; // >= 1 phút
  }

  // Get simple stats với thông tin về active syncs
  getStats() {
    const pendingOrders = this.getPendingOrders();

    return {
      total: pendingOrders.length,
      needsRetry: pendingOrders.filter((o) => o.attempts < this.maxRetries)
        .length,
      maxAttemptsReached: pendingOrders.filter(
        (o) => o.attempts >= this.maxRetries
      ).length,
      activeSyncs: this.activeSyncs.size, // ✅ Thêm thông tin về active syncs
      activeOrders: this.getActiveSyncs(),
    };
  }

  // Check if order is pending
  isPending(sttRec) {
    const pendingOrders = this.getPendingOrders();
    return pendingOrders.some((order) => order.sttRec === sttRec);
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

  // ✅ Tính toán thời gian của background check tiếp theo
  getNextBackgroundCheck() {
    if (!this.isRunning || !this.lastCheckTime) {
      return Date.now() + this.checkInterval;
    }

    return this.lastCheckTime + this.checkInterval;
  }
}

// Export singleton instance
const simpleSyncGuard = new SimpleSyncGuard();
export default simpleSyncGuard;
