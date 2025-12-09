import { message, notification } from "antd";

/**
 * NotificationManager - Quản lý tập trung tất cả notification và message
 * Đảm bảo mỗi notification/message chỉ hiển thị 1 lần trong khoảng thời gian nhất định
 */
class NotificationManager {
  constructor() {
    // Map lưu trữ các notification/message đã hiển thị
    // Key: {type}-{code}-{roundedTimestamp}
    // Value: { timestamp, timeoutId }
    this.displayedMap = new Map();
    this.debounceTime = 3000; // 3 giây
  }

  /**
   * Tạo key duy nhất cho notification/message
   * @param {string} type - Loại: 'notification' hoặc 'message'
   * @param {string} code - Mã vật tư hoặc mã quét
   * @param {number} timestamp - Timestamp hiện tại
   * @returns {string} Key duy nhất
   */
  _generateKey(type, code, timestamp) {
    // Làm tròn timestamp về giây để tránh key quá chi tiết
    const roundedTimestamp = Math.floor(timestamp / 1000);
    return `${type}-${code}-${roundedTimestamp}`;
  }

  /**
   * Kiểm tra xem notification/message đã được hiển thị chưa
   * @param {string} type - Loại: 'notification' hoặc 'message'
   * @param {string} code - Mã vật tư hoặc mã quét
   * @returns {boolean} true nếu đã hiển thị trong debounceTime
   */
  _isAlreadyDisplayed(type, code) {
    const now = Date.now();
    const roundedNow = Math.floor(now / 1000);
    
    // Kiểm tra tất cả các key có cùng type và code
    for (const [key, value] of this.displayedMap.entries()) {
      if (key.startsWith(`${type}-${code}-`)) {
        const timeSinceDisplay = now - value.timestamp;
        if (timeSinceDisplay < this.debounceTime) {
          return true; // Đã hiển thị trong debounceTime
        }
      }
    }
    
    return false;
  }

  /**
   * Hiển thị notification/message chỉ 1 lần trong debounceTime
   * @param {string} type - Loại: 'notification' hoặc 'message'
   * @param {string} code - Mã vật tư hoặc mã quét
   * @param {Function} displayFn - Hàm hiển thị notification/message
   * @returns {boolean} true nếu đã hiển thị, false nếu bỏ qua
   */
  showOnce(type, code, displayFn) {
    if (!code || !code.trim()) {
      return false;
    }

    const trimmedCode = code.trim();
    const now = Date.now();

    // Kiểm tra xem đã hiển thị chưa
    if (this._isAlreadyDisplayed(type, trimmedCode)) {
      return false; // Bỏ qua, đã hiển thị
    }

    // Hiển thị notification/message
    displayFn();

    // Lưu vào map với key duy nhất
    const key = this._generateKey(type, trimmedCode, now);
    const timeoutId = setTimeout(() => {
      // Tự động cleanup sau debounceTime
      this.displayedMap.delete(key);
    }, this.debounceTime);

    this.displayedMap.set(key, {
      timestamp: now,
      timeoutId,
    });

    return true; // Đã hiển thị
  }

  /**
   * Hiển thị notification chỉ 1 lần
   * @param {string} code - Mã quét
   * @param {string} message - Nội dung notification
   * @param {string} description - Mô tả chi tiết
   * @returns {boolean} true nếu đã hiển thị, false nếu bỏ qua
   */
  showNotificationOnce(code, message, description) {
    return this.showOnce("notification", code, () => {
      notification.success({
        message,
        description,
        duration: 2,
        key: `qr-scan-${code}-${Date.now()}`,
      });
    });
  }

  /**
   * Hiển thị message chỉ 1 lần
   * @param {string} code - Mã vật tư
   * @param {string} content - Nội dung message
   * @returns {boolean} true nếu đã hiển thị, false nếu bỏ qua
   */
  showMessageOnce(code, content) {
    return this.showOnce("message", code, () => {
      message.success({
        content,
        key: `vat-tu-added-${code}-${Date.now()}`,
        duration: 2,
      });
    });
  }

  /**
   * Xóa tất cả các notification/message đã lưu (dùng khi reset)
   */
  clear() {
    // Clear tất cả timeout
    for (const [, value] of this.displayedMap.entries()) {
      if (value.timeoutId) {
        clearTimeout(value.timeoutId);
      }
    }
    this.displayedMap.clear();
  }
}

// Export singleton instance
const notificationManager = new NotificationManager();
export default notificationManager;

