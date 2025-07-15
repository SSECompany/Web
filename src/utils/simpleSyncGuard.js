// Simple Sync Guard - Đảm bảo syncFastApi được call sau khi tạo đơn thành công
class SimpleSyncGuard {
  constructor() {
    this.storageKey = "pending_sync_simple";
    this.checkInterval = 180000; // ✅ Global background check every 3 minutes
    this.individualRetryInterval = 60000; // ✅ Individual order retry every 1 minute
    this.maxRetries = 10; // ✅ Tăng từ 5 lên 10 lần retry cho chắc chắn hơn
    this.isRunning = false;

    // ✅ Thêm locking mechanism để tránh race condition
    this.activeSyncs = new Map(); // Map<sttRec, Promise>

    // ✅ PERFORMANCE OPTIMIZATION: Cache pending orders
    this._pendingOrdersCache = null;
    this._lastCacheUpdate = 0;
    this._cacheExpiry = 5000; // 5 seconds cache

    // ✅ PERFORMANCE OPTIMIZATION: Debounce save operations
    this._saveDebounceTimer = null;
    this._pendingSaveData = null;

    // ✅ PERFORMANCE OPTIMIZATION: Batch processing
    this._batchSize = 3;
    this._batchDelay = 2000;

    // ✅ PERFORMANCE OPTIMIZATION: Network status tracking
    this._lastNetworkCheck = 0;
    this._networkCheckInterval = 30000; // 30 seconds
    this._isOnline = navigator.onLine;

    // Start background checker
    this.startChecker();

    // Handle page unload
    window.addEventListener("beforeunload", () => this.stopChecker());

    // ✅ PERFORMANCE OPTIMIZATION: Network status listener
    window.addEventListener("online", () => {
      this._isOnline = true;
      this._lastNetworkCheck = Date.now();
    });
    window.addEventListener("offline", () => {
      this._isOnline = false;
      this._lastNetworkCheck = Date.now();
    });
  }

  // ✅ PERFORMANCE OPTIMIZATION: Cached getPendingOrders
  getPendingOrders() {
    const now = Date.now();

    // Return cached data if still valid
    if (
      this._pendingOrdersCache &&
      now - this._lastCacheUpdate < this._cacheExpiry
    ) {
      return this._pendingOrdersCache;
    }

    // Fetch fresh data
    try {
      const data = localStorage.getItem(this.storageKey);
      const orders = data ? JSON.parse(data) : [];

      // Update cache
      this._pendingOrdersCache = orders;
      this._lastCacheUpdate = now;

      return orders;
    } catch (error) {
      console.error("Error loading pending orders:", error);
      return [];
    }
  }

  // ✅ PERFORMANCE OPTIMIZATION: Debounced savePendingOrders
  savePendingOrders(orders) {
    // Clear existing debounce timer
    if (this._saveDebounceTimer) {
      clearTimeout(this._saveDebounceTimer);
    }

    // Store data for debounced save
    this._pendingSaveData = orders;

    // Set new debounce timer
    this._saveDebounceTimer = setTimeout(() => {
      try {
        localStorage.setItem(
          this.storageKey,
          JSON.stringify(this._pendingSaveData)
        );

        // ✅ Update cache immediately
        this._pendingOrdersCache = this._pendingSaveData;
        this._lastCacheUpdate = Date.now();

        this._pendingSaveData = null;
      } catch (error) {
        console.error("Error saving pending orders:", error);
      }
    }, 100); // 100ms debounce
  }

  // ✅ PERFORMANCE OPTIMIZATION: Optimized network check
  isNetworkAvailable() {
    const now = Date.now();

    // Use cached network status if recent
    if (now - this._lastNetworkCheck < this._networkCheckInterval) {
      return this._isOnline;
    }

    // Update network status
    this._isOnline = navigator.onLine;
    this._lastNetworkCheck = now;

    return this._isOnline;
  }

  // Đánh dấu đơn hàng cần sync sau khi tạo thành công (CHỈ MARK, KHÔNG SYNC)
  markForSync(sttRec, userId) {
    const pendingOrders = this.getPendingOrders();

    // ✅ PERFORMANCE OPTIMIZATION: Use Set for faster lookup
    const existingSttRecs = new Set(pendingOrders.map((order) => order.sttRec));
    if (existingSttRecs.has(sttRec)) {
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

    // ✅ PERFORMANCE OPTIMIZATION: Invalidate cache
    this._pendingOrdersCache = null;

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

    // ✅ PERFORMANCE OPTIMIZATION: Invalidate cache
    this._pendingOrdersCache = null;
  }

  // Thử sync một đơn hàng với locking mechanism
  async attemptSync(sttRec) {
    // ✅ PERFORMANCE OPTIMIZATION: Early network check
    if (!this.isNetworkAvailable()) {
      console.log(`🌐 Network offline, skipping sync for ${sttRec}`);
      return false;
    }

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

    // ✅ PERFORMANCE OPTIMIZATION: Clear debounce timer
    if (this._saveDebounceTimer) {
      clearTimeout(this._saveDebounceTimer);
    }
  }

  // ✅ PERFORMANCE OPTIMIZATION: Optimized individual retry checker
  async checkIndividualRetries() {
    if (!this.isNetworkAvailable()) {
      return;
    }

    const pendingOrders = this.getPendingOrders();
    const now = new Date();

    // ✅ PERFORMANCE OPTIMIZATION: Use Set for faster filtering
    const activeSyncSet = new Set(this.activeSyncs.keys());

    // Filter orders ready for individual retry (1 phút từ lastAttempt)
    const ordersReadyForRetry = pendingOrders.filter((order) => {
      // Basic checks
      const age = now.getTime() - new Date(order.createdAt).getTime();
      if (age > 24 * 60 * 60 * 1000) return false; // Too old
      if (order.attempts >= this.maxRetries) return false; // Max attempts
      if (activeSyncSet.has(order.sttRec)) return false; // Already syncing

      // Check if ready for individual retry
      if (!order.lastAttempt) return true; // Chưa có attempt nào

      const timeSinceLastAttempt =
        now.getTime() - new Date(order.lastAttempt).getTime();
      return timeSinceLastAttempt >= this.individualRetryInterval; // >= 1 phút
    });

    // Clean up old orders
    const validOrders = pendingOrders.filter((order) => {
      const age = now.getTime() - new Date(order.createdAt).getTime();
      return age <= 24 * 60 * 60 * 1000 && order.attempts < this.maxRetries;
    });

    if (validOrders.length !== pendingOrders.length) {
      this.savePendingOrders(validOrders);
    }

    // ✅ PERFORMANCE OPTIMIZATION: Batch process với controlled concurrency
    if (ordersReadyForRetry.length > 0) {
      console.log(
        `🔄 Individual retry starting for ${ordersReadyForRetry.length} orders (ready for 1-minute retry)`
      );

      // Process in batches để tránh quá nhiều concurrent requests
      for (let i = 0; i < ordersReadyForRetry.length; i += this._batchSize) {
        const batch = ordersReadyForRetry.slice(i, i + this._batchSize);

        // Process batch concurrently
        const promises = batch.map((order) => this.attemptSync(order.sttRec));
        await Promise.allSettled(promises);

        // Small delay between batches
        if (i + this._batchSize < ordersReadyForRetry.length) {
          await new Promise((resolve) => setTimeout(resolve, this._batchDelay));
        }
      }
    }
  }

  // ✅ PERFORMANCE OPTIMIZATION: Optimized checkAndRetry
  async checkAndRetry() {
    if (!this.isNetworkAvailable()) {
      return;
    }

    const pendingOrders = this.getPendingOrders();
    const now = new Date();

    // ✅ PERFORMANCE OPTIMIZATION: Use Set for faster filtering
    const activeSyncSet = new Set(this.activeSyncs.keys());

    // Filter orders cần retry (individual 1 phút hoặc background 3 phút)
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
      if (activeSyncSet.has(order.sttRec)) {
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

    // ✅ PERFORMANCE OPTIMIZATION: Batch process với controlled concurrency
    if (ordersToRetry.length > 0) {
      console.log(
        `🔄 Background retry starting for ${ordersToRetry.length} orders`
      );

      // Process in batches
      for (let i = 0; i < ordersToRetry.length; i += this._batchSize) {
        const batch = ordersToRetry.slice(i, i + this._batchSize);

        // Process batch concurrently
        const promises = batch.map((order) => this.attemptSync(order.sttRec));
        await Promise.allSettled(promises);

        // Small delay between batches
        if (i + this._batchSize < ordersToRetry.length) {
          await new Promise((resolve) => setTimeout(resolve, this._batchDelay));
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

    // ✅ PERFORMANCE OPTIMIZATION: Batch process
    for (let i = 0; i < pendingOrders.length; i += this._batchSize) {
      const batch = pendingOrders.slice(i, i + this._batchSize);

      const promises = batch.map((order) => this.attemptSync(order.sttRec));
      await Promise.allSettled(promises);

      // Small delay between batches
      if (i + this._batchSize < pendingOrders.length) {
        await new Promise((resolve) => setTimeout(resolve, this._batchDelay));
      }
    }

    return pendingOrders.length;
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
      networkStatus: this.isNetworkAvailable(),
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
    this._pendingOrdersCache = null;
    this._lastCacheUpdate = 0;
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

  // ✅ PERFORMANCE OPTIMIZATION: Clear cache method
  clearCache() {
    this._pendingOrdersCache = null;
    this._lastCacheUpdate = 0;
  }

  // ✅ PERFORMANCE OPTIMIZATION: Get performance metrics
  getPerformanceMetrics() {
    return {
      cacheHitRate: this._pendingOrdersCache ? "cached" : "fresh",
      activeSyncs: this.activeSyncs.size,
      networkStatus: this.isNetworkAvailable(),
      lastCacheUpdate: this._lastCacheUpdate,
      lastNetworkCheck: this._lastNetworkCheck,
    };
  }
}

// Print Order Guard - Đảm bảo printOrderApi được call và retry khi fail
class PrintOrderGuard {
  constructor() {
    this.storageKey = "pending_print_orders";
    this.checkInterval = 180000; // ✅ Global background check every 3 minutes (y hệt SimpleSyncGuard)
    this.individualRetryInterval = 60000; // ✅ Individual order retry every 1 minute (y hệt SimpleSyncGuard)
    this.maxRetries = 10; // ✅ 10 lần retry (y hệt SimpleSyncGuard)
    this.isRunning = false;

    // ✅ Thêm locking mechanism để tránh race condition
    this.activePrints = new Map(); // Map<sttRec, Promise>

    // ✅ PERFORMANCE OPTIMIZATION: Cache pending orders
    this._pendingOrdersCache = null;
    this._lastCacheUpdate = 0;
    this._cacheExpiry = 5000; // 5 seconds cache

    // ✅ PERFORMANCE OPTIMIZATION: Debounce save operations
    this._saveDebounceTimer = null;
    this._pendingSaveData = null;

    // ✅ PERFORMANCE OPTIMIZATION: Batch processing
    this._batchSize = 3; // Y hệt SimpleSyncGuard
    this._batchDelay = 2000; // Y hệt SimpleSyncGuard

    // ✅ PERFORMANCE OPTIMIZATION: Network status tracking
    this._lastNetworkCheck = 0;
    this._networkCheckInterval = 30000; // 30 seconds
    this._isOnline = navigator.onLine;

    // Start background checker
    this.startChecker();

    // Handle page unload
    window.addEventListener("beforeunload", () => this.stopChecker());

    // ✅ PERFORMANCE OPTIMIZATION: Network status listener
    window.addEventListener("online", () => {
      this._isOnline = true;
      this._lastNetworkCheck = Date.now();
    });
    window.addEventListener("offline", () => {
      this._isOnline = false;
      this._lastNetworkCheck = Date.now();
    });
  }

  // ✅ PERFORMANCE OPTIMIZATION: Cached getPendingOrders
  getPendingOrders() {
    const now = Date.now();

    // Return cached data if still valid
    if (
      this._pendingOrdersCache &&
      now - this._lastCacheUpdate < this._cacheExpiry
    ) {
      return this._pendingOrdersCache;
    }

    // Fetch fresh data
    try {
      const data = localStorage.getItem(this.storageKey);
      const orders = data ? JSON.parse(data) : [];

      // Update cache
      this._pendingOrdersCache = orders;
      this._lastCacheUpdate = now;

      return orders;
    } catch (error) {
      console.error("Error loading pending print orders:", error);
      return [];
    }
  }

  // ✅ PERFORMANCE OPTIMIZATION: Debounced savePendingOrders
  savePendingOrders(orders) {
    // Clear existing debounce timer
    if (this._saveDebounceTimer) {
      clearTimeout(this._saveDebounceTimer);
    }

    // Store data for debounced save
    this._pendingSaveData = orders;

    // Set new debounce timer
    this._saveDebounceTimer = setTimeout(() => {
      try {
        localStorage.setItem(
          this.storageKey,
          JSON.stringify(this._pendingSaveData)
        );

        // ✅ Update cache immediately
        this._pendingOrdersCache = this._pendingSaveData;
        this._lastCacheUpdate = Date.now();

        this._pendingSaveData = null;
      } catch (error) {
        console.error("Error saving pending print orders:", error);
      }
    }, 100); // 100ms debounce
  }

  // ✅ PERFORMANCE OPTIMIZATION: Optimized network check
  isNetworkAvailable() {
    const now = Date.now();

    // Use cached network status if recent
    if (now - this._lastNetworkCheck < this._networkCheckInterval) {
      return this._isOnline;
    }

    // Update network status
    this._isOnline = navigator.onLine;
    this._lastNetworkCheck = now;

    return this._isOnline;
  }

  // Đánh dấu đơn hàng cần print sau khi tạo thành công (CHỈ MARK, KHÔNG PRINT)
  markForPrint(sttRec, userId) {
    const pendingOrders = this.getPendingOrders();

    // ✅ PERFORMANCE OPTIMIZATION: Use Set for faster lookup
    const existingSttRecs = new Set(pendingOrders.map((order) => order.sttRec));
    if (existingSttRecs.has(sttRec)) {
      return;
    }

    const orderData = {
      sttRec,
      userId: userId?.toString(),
      createdAt: new Date().toISOString(),
      attempts: 0,
      lastAttempt: null,
      needsPrint: true, // Đánh dấu cần print
    };

    pendingOrders.push(orderData);
    this.savePendingOrders(pendingOrders);

    // ✅ PERFORMANCE OPTIMIZATION: Invalidate cache
    this._pendingOrdersCache = null;

    // KHÔNG attemptPrint ngay nữa - để cho background hoặc manual trigger
  }

  // Trigger print cho order đã được marked
  async triggerPrint(sttRec) {
    return await this.attemptPrint(sttRec);
  }

  // Đánh dấu đơn hàng đã print thành công
  markPrinted(sttRec) {
    const pendingOrders = this.getPendingOrders();
    const filteredOrders = pendingOrders.filter(
      (order) => order.sttRec !== sttRec
    );

    this.savePendingOrders(filteredOrders);

    // ✅ PERFORMANCE OPTIMIZATION: Invalidate cache
    this._pendingOrdersCache = null;
  }

  // Thử print một đơn hàng với locking mechanism
  async attemptPrint(sttRec) {
    // ✅ PERFORMANCE OPTIMIZATION: Early network check
    if (!this.isNetworkAvailable()) {
      console.log(`🌐 Network offline, skipping print for ${sttRec}`);
      return false;
    }

    // ✅ KIỂM TRA LOCK: Nếu đang print sttRec này rồi thì đợi
    if (this.activePrints.has(sttRec)) {
      console.log(`🔒 Order ${sttRec} is already being printed, waiting...`);
      try {
        // Đợi print hiện tại hoàn thành
        return await this.activePrints.get(sttRec);
      } catch (error) {
        // Print hiện tại failed, sẽ retry bên dưới
        console.log(`⚠️ Waiting print for ${sttRec} failed, will retry...`);
      }
    }

    const pendingOrders = this.getPendingOrders();
    const order = pendingOrders.find((o) => o.sttRec === sttRec);

    if (!order) {
      console.warn(`⚠️ Order ${sttRec} not found in pending print list`);
      return false;
    }

    // Kiểm tra số lần thử
    if (order.attempts >= this.maxRetries) {
      console.error(
        `🚫 Order ${sttRec} exceeded max print attempts (${this.maxRetries})`
      );
      
      // ✅ Báo log khi đạt max retries
      const { simpleLogger } = await import("../utils/simpleLogger");
      simpleLogger.log("error", {
        action: "print_max_retries_reached",
        sttRec,
        userId: order.userId,
        message: `Print order ${sttRec} đã retry ${this.maxRetries} lần và bị dừng`,
        attempts: order.attempts,
        maxRetries: this.maxRetries,
        lastError: order.lastError,
        createdAt: order.createdAt,
        lastAttempt: order.lastAttempt,
      });
      
      return false;
    }

    // ✅ TẠO LOCK: Tạo promise để lock sttRec này
    const printPromise = this._doPrint(sttRec, order);
    this.activePrints.set(sttRec, printPromise);

    try {
      const result = await printPromise;
      return result;
    } finally {
      // ✅ GIẢI PHÓNG LOCK: Luôn xóa lock sau khi hoàn thành
      this.activePrints.delete(sttRec);
    }
  }

  // Private method thực hiện print thực tế
  async _doPrint(sttRec, order) {
    try {
      console.log(
        `🖨️ Starting print for order ${sttRec} (attempt ${order.attempts + 1}/${this.maxRetries})`
      );

      // Update attempts
      order.attempts += 1;
      order.lastAttempt = new Date().toISOString();
      this.updateOrder(order);

      // Import và call printOrderApi
      const { printOrderApi } = await import("../api");
      await printOrderApi(sttRec, order.userId);

      // Thành công → remove khỏi pending
      this.markPrinted(sttRec);
      console.log(`✅ Print successful for order ${sttRec}`);

      return true;
    } catch (error) {
      console.error(
        `❌ PrintOrderGuard: Print failed for ${sttRec}:`,
        error.message
      );

      // Update error info
      order.lastError = error.message;
      order.lastErrorTime = new Date().toISOString();
      this.updateOrder(order);

      // ✅ Báo log khi print fail
      const { simpleLogger } = await import("../utils/simpleLogger");
      simpleLogger.log("error", {
        action: "print_failed",
        sttRec,
        userId: order.userId,
        message: `Print order ${sttRec} failed: ${error.message}`,
        attempts: order.attempts,
        maxRetries: this.maxRetries,
        error: error.message,
        errorType: error.type,
        createdAt: order.createdAt,
        lastAttempt: order.lastAttempt,
      });

      return false;
    }
  }

  // Update order trong pending list
  updateOrder(updatedOrder) {
    const pendingOrders = this.getPendingOrders();
    const updatedOrders = pendingOrders.map((order) =>
      order.sttRec === updatedOrder.sttRec ? updatedOrder : order
    );
    this.savePendingOrders(updatedOrders);
  }

  // Start background checker
  startChecker() {
    if (this.isRunning) return;
    this.isRunning = true;

    const checkAndRetry = async () => {
      if (this.isRunning) {
        await this.checkAndRetry();
        setTimeout(checkAndRetry, this.checkInterval);
      }
    };

    checkAndRetry();
  }

  // Stop background checker
  stopChecker() {
    this.isRunning = false;
  }

  // Check individual retries (30s interval)
  async checkIndividualRetries() {
    if (!this.isNetworkAvailable()) {
      return;
    }

    const pendingOrders = this.getPendingOrders();
    const now = new Date();

    // Filter orders ready for individual retry (30s từ lastAttempt)
    const ordersReadyForRetry = pendingOrders.filter((order) => {
      if (order.attempts >= this.maxRetries) {
        return false;
      }

      if (!order.lastAttempt) {
        return true; // Chưa thử lần nào
      }

      const timeSinceLastAttempt =
        now.getTime() - new Date(order.lastAttempt).getTime();
      return timeSinceLastAttempt >= this.individualRetryInterval;
    });

    // ✅ PERFORMANCE OPTIMIZATION: Batch process với controlled concurrency
    if (ordersReadyForRetry.length > 0) {
      console.log(
        `🖨️ Individual retry starting for ${ordersReadyForRetry.length} print orders (ready for 1-minute retry)`
      );

      // Process in batches để tránh quá nhiều concurrent requests
      for (let i = 0; i < ordersReadyForRetry.length; i += this._batchSize) {
        const batch = ordersReadyForRetry.slice(i, i + this._batchSize);

        // Process batch concurrently
        const promises = batch.map((order) => this.attemptPrint(order.sttRec));
        await Promise.allSettled(promises);

        // Small delay between batches
        if (i + this._batchSize < ordersReadyForRetry.length) {
          await new Promise((resolve) => setTimeout(resolve, this._batchDelay));
        }
      }
    }
  }

  // ✅ PERFORMANCE OPTIMIZATION: Optimized checkAndRetry
  async checkAndRetry() {
    if (!this.isNetworkAvailable()) {
      return;
    }

    const pendingOrders = this.getPendingOrders();
    const now = new Date();

    // ✅ PERFORMANCE OPTIMIZATION: Use Set for faster filtering
    const activePrintSet = new Set(this.activePrints.keys());

    // Filter orders cần retry (individual 1 phút hoặc background 3 phút)
    const ordersToRetry = pendingOrders.filter((order) => {
      // Xóa orders quá cũ (> 24h) - y hệt SimpleSyncGuard
      const age = now.getTime() - new Date(order.createdAt).getTime();
      if (age > 24 * 60 * 60 * 1000) {
        return false;
      }

      // Skip nếu đã max attempts
      if (order.attempts >= this.maxRetries) {
        return false;
      }

      // ✅ Skip nếu đang được print
      if (activePrintSet.has(order.sttRec)) {
        console.log(`⏭️ Skipping ${order.sttRec} - already printing`);
        return false;
      }

      // ✅ Check individual retry time (1 phút từ lastAttempt) - y hệt SimpleSyncGuard
      if (this.shouldRetryOrderNow(order)) {
        return true;
      }

      return false;
    });

    // Clean up old orders - y hệt SimpleSyncGuard
    const validOrders = pendingOrders.filter((order) => {
      const age = now.getTime() - new Date(order.createdAt).getTime();
      return age <= 24 * 60 * 60 * 1000 && order.attempts < this.maxRetries;
    });

    if (validOrders.length !== pendingOrders.length) {
      this.savePendingOrders(validOrders);
    }

    // ✅ PERFORMANCE OPTIMIZATION: Batch process với controlled concurrency
    if (ordersToRetry.length > 0) {
      console.log(
        `🖨️ Background retry starting for ${ordersToRetry.length} print orders`
      );

      // Process in batches
      for (let i = 0; i < ordersToRetry.length; i += this._batchSize) {
        const batch = ordersToRetry.slice(i, i + this._batchSize);

        // Process batch concurrently
        const promises = batch.map((order) => this.attemptPrint(order.sttRec));
        await Promise.allSettled(promises);

        // Small delay between batches
        if (i + this._batchSize < ordersToRetry.length) {
          await new Promise((resolve) => setTimeout(resolve, this._batchDelay));
        }
      }
    }
  }

  // Force retry một order cụ thể
  async forceRetry(sttRec) {
    return await this.attemptPrint(sttRec);
  }

  // Force retry all pending orders
  async forceRetryAll() {
    const pendingOrders = this.getPendingOrders();

    // ✅ PERFORMANCE OPTIMIZATION: Batch process
    for (let i = 0; i < pendingOrders.length; i += this._batchSize) {
      const batch = pendingOrders.slice(i, i + this._batchSize);

      const promises = batch.map((order) => this.attemptPrint(order.sttRec));
      await Promise.allSettled(promises);

      // Small delay between batches
      if (i + this._batchSize < pendingOrders.length) {
        await new Promise((resolve) => setTimeout(resolve, this._batchDelay));
      }
    }

    return pendingOrders.length;
  }

  // Get active prints
  getActivePrints() {
    return Array.from(this.activePrints.keys());
  }

  // Check if order is being printed
  isPrinting(sttRec) {
    return this.activePrints.has(sttRec);
  }

  // Get time to next individual retry
  getTimeToNextIndividualRetry(order) {
    if (!order.lastAttempt) return 0;

    const now = new Date();
    const lastAttempt = new Date(order.lastAttempt);
    const timeSinceLastAttempt = now.getTime() - lastAttempt.getTime();
    const timeToNextRetry = this.individualRetryInterval - timeSinceLastAttempt;

    return Math.max(0, timeToNextRetry);
  }

  // Get time to next retry for specific order
  getTimeToNextRetry(sttRec) {
    const pendingOrders = this.getPendingOrders();
    const order = pendingOrders.find((o) => o.sttRec === sttRec);
    if (!order) return 0;

    return this.getTimeToNextIndividualRetry(order);
  }

  // Get pending orders with retry time
  getPendingOrdersWithRetryTime() {
    const pendingOrders = this.getPendingOrders();
    return pendingOrders.map((order) => ({
      ...order,
      timeToNextRetry: this.getTimeToNextIndividualRetry(order),
    }));
  }

  // Check if order should be retried now
  shouldRetryOrderNow(order) {
    if (!order.lastAttempt) return true;

    const now = new Date();
    const lastAttempt = new Date(order.lastAttempt);
    const timeSinceLastAttempt = now.getTime() - lastAttempt.getTime();

    return timeSinceLastAttempt >= this.individualRetryInterval;
  }

  // Get stats
  getStats() {
    const pendingOrders = this.getPendingOrders();
    const activePrints = this.getActivePrints();

    return {
      total: pendingOrders.length,
      active: activePrints.length,
      maxRetries: this.maxRetries,
      checkInterval: this.checkInterval,
      individualRetryInterval: this.individualRetryInterval,
    };
  }

  // Check if order is pending
  isPending(sttRec) {
    const pendingOrders = this.getPendingOrders();
    return pendingOrders.some((order) => order.sttRec === sttRec);
  }

  // Clear all pending orders
  clearAll() {
    this.savePendingOrders([]);
    this._pendingOrdersCache = null;
  }

  // Check if guard is healthy
  isHealthy() {
    return this.isRunning && this.isNetworkAvailable();
  }

  // Get next background check time
  getNextBackgroundCheck() {
    const now = Date.now();
    return now + this.checkInterval;
  }

  // Clear cache
  clearCache() {
    this._pendingOrdersCache = null;
    this._lastCacheUpdate = 0;
  }

  // Get performance metrics
  getPerformanceMetrics() {
    return {
      cacheHitRate: this._pendingOrdersCache ? 1 : 0,
      networkCheckInterval: this._networkCheckInterval,
      batchSize: this._batchSize,
      batchDelay: this._batchDelay,
    };
  }
}

// Export singleton instance
const simpleSyncGuard = new SimpleSyncGuard();
const printOrderGuard = new PrintOrderGuard();

export default simpleSyncGuard;
export { printOrderGuard };
