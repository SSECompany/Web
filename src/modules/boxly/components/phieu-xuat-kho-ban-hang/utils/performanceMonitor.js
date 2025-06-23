// Performance monitoring utility for API optimization
class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.enabled = process.env.NODE_ENV === "development";
  }

  startTimer(operationName) {
    if (!this.enabled) return null;

    const startTime = performance.now();
    return {
      operationName,
      startTime,
      end: () => this.endTimer(operationName, startTime),
    };
  }

  endTimer(operationName, startTime) {
    if (!this.enabled) return;

    const endTime = performance.now();
    const duration = endTime - startTime;

    if (!this.metrics.has(operationName)) {
      this.metrics.set(operationName, {
        count: 0,
        totalTime: 0,
        avgTime: 0,
        minTime: Infinity,
        maxTime: 0,
        lastRun: null,
      });
    }

    const metric = this.metrics.get(operationName);
    metric.count++;
    metric.totalTime += duration;
    metric.avgTime = metric.totalTime / metric.count;
    metric.minTime = Math.min(metric.minTime, duration);
    metric.maxTime = Math.max(metric.maxTime, duration);
    metric.lastRun = new Date().toISOString();

    // Log slow operations
    if (duration > 1000) {
      console.warn(
        `🐌 Slow operation detected: ${operationName} took ${duration.toFixed(
          2
        )}ms`
      );
    }

    console.log(`⚡ ${operationName}: ${duration.toFixed(2)}ms`);
  }

  // API call wrapper with monitoring
  async monitorApiCall(operationName, apiCall) {
    if (!this.enabled) return await apiCall();

    const timer = this.startTimer(operationName);

    try {
      const result = await apiCall();
      timer.end();
      return result;
    } catch (error) {
      timer.end();
      console.error(`❌ API Error in ${operationName}:`, error);
      throw error;
    }
  }

  // Get performance report
  getReport() {
    if (!this.enabled) return {};

    const report = {};
    for (const [operation, metrics] of this.metrics) {
      report[operation] = {
        calls: metrics.count,
        avgTime: `${metrics.avgTime.toFixed(2)}ms`,
        minTime: `${metrics.minTime.toFixed(2)}ms`,
        maxTime: `${metrics.maxTime.toFixed(2)}ms`,
        totalTime: `${metrics.totalTime.toFixed(2)}ms`,
        lastRun: metrics.lastRun,
      };
    }
    return report;
  }

  // Log performance report to console
  logReport() {
    if (!this.enabled) return;

    console.group("📊 API Performance Report");
    console.table(this.getReport());
    console.groupEnd();
  }

  // Reset metrics
  reset() {
    this.metrics.clear();
  }

  // Cache hit rate monitoring
  trackCacheHit(operation, isHit) {
    if (!this.enabled) return;

    const cacheKey = `${operation}_cache`;
    if (!this.metrics.has(cacheKey)) {
      this.metrics.set(cacheKey, { hits: 0, misses: 0, hitRate: 0 });
    }

    const cacheMetric = this.metrics.get(cacheKey);
    if (isHit) {
      cacheMetric.hits++;
    } else {
      cacheMetric.misses++;
    }

    const total = cacheMetric.hits + cacheMetric.misses;
    cacheMetric.hitRate = ((cacheMetric.hits / total) * 100).toFixed(2);

    console.log(
      `💾 Cache ${isHit ? "HIT" : "MISS"} for ${operation} (Hit rate: ${
        cacheMetric.hitRate
      }%)`
    );
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Helper hook for React components
export const usePerformanceMonitor = () => {
  return {
    monitor: performanceMonitor,
    trackApiCall: (name, apiCall) =>
      performanceMonitor.monitorApiCall(name, apiCall),
    trackCacheHit: (operation, isHit) =>
      performanceMonitor.trackCacheHit(operation, isHit),
    getReport: () => performanceMonitor.getReport(),
    logReport: () => performanceMonitor.logReport(),
  };
};
