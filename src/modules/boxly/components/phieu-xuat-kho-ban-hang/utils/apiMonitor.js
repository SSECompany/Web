// API Performance Monitor for debugging
class APIMonitor {
  constructor() {
    this.apiCalls = new Map();
    this.sessionStart = Date.now();
    this.enabled = process.env.NODE_ENV === "development";
  }

  track(apiName, metadata = {}) {
    if (!this.enabled) return;

    const timestamp = Date.now();
    const key = `${apiName}_${timestamp}`;

    if (!this.apiCalls.has(apiName)) {
      this.apiCalls.set(apiName, []);
    }

    this.apiCalls.get(apiName).push({
      timestamp,
      sessionTime: timestamp - this.sessionStart,
      metadata,
    });

    // Log API call
    console.log(`🌐 API Call: ${apiName}`, {
      count: this.apiCalls.get(apiName).length,
      sessionTime: `${((timestamp - this.sessionStart) / 1000).toFixed(1)}s`,
      metadata,
    });

    // Warn about excessive calls
    const calls = this.apiCalls.get(apiName);
    if (calls.length > 5) {
      console.warn(
        `⚠️ Excessive API calls detected for ${apiName}: ${calls.length} calls`
      );
    }
  }

  getStats() {
    if (!this.enabled) return {};

    const stats = {};
    for (const [apiName, calls] of this.apiCalls) {
      stats[apiName] = {
        totalCalls: calls.length,
        firstCall: calls[0]?.sessionTime || 0,
        lastCall: calls[calls.length - 1]?.sessionTime || 0,
        frequency: calls.length / ((Date.now() - this.sessionStart) / 1000),
      };
    }
    return stats;
  }

  generateReport() {
    if (!this.enabled) return;

    const stats = this.getStats();
    const sessionDuration = (Date.now() - this.sessionStart) / 1000;

    console.group("📊 API Performance Report");
    console.log(`Session Duration: ${sessionDuration.toFixed(1)}s`);
    console.table(stats);

    // Calculate efficiency score
    const totalCalls = Object.values(stats).reduce(
      (sum, s) => sum + s.totalCalls,
      0
    );
    const efficiency = Math.max(0, 100 - totalCalls * 2); // Penalty for each API call

    console.log(`🎯 Efficiency Score: ${efficiency.toFixed(1)}/100`);

    if (totalCalls > 20) {
      console.warn(
        "🚨 High API usage detected. Consider implementing more caching."
      );
    } else if (totalCalls < 10) {
      console.log("✅ Good API usage. Well optimized!");
    }

    console.groupEnd();
  }

  reset() {
    this.apiCalls.clear();
    this.sessionStart = Date.now();
  }

  // Decorators for automatic tracking
  trackAPI(apiName) {
    return (target, propertyKey, descriptor) => {
      const originalMethod = descriptor.value;

      descriptor.value = async function (...args) {
        apiMonitor.track(apiName, { args: args.length });
        return await originalMethod.apply(this, args);
      };

      return descriptor;
    };
  }
}

// Global instance
export const apiMonitor = new APIMonitor();

// Usage examples:
export const trackApiCall = (apiName, metadata) => {
  apiMonitor.track(apiName, metadata);
};

// Helper for measuring time
export const measureTime = (operationName) => {
  const startTime = performance.now();
  return {
    end: () => {
      const duration = performance.now() - startTime;
      console.log(`⏱️ ${operationName}: ${duration.toFixed(2)}ms`);
      return duration;
    },
  };
};

// Add to window for debugging
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  window.apiMonitor = apiMonitor;
  window.showAPIReport = () => apiMonitor.generateReport();
  window.resetAPIMonitor = () => apiMonitor.reset();
}
