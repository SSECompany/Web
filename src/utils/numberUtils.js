/**
 * Format số để loại bỏ các số 0 thừa ở cuối phần thập phân
 * @param {number|string} value - Giá trị số cần format
 * @param {number} maxDecimals - Số chữ số thập phân tối đa (mặc định 3)
 * @returns {string} - Số đã được format
 */
export const formatNumberWithoutTrailingZeros = (value, maxDecimals = 3) => {
  if (!value || value === 0) return "0";

  const num = Number(value);
  if (isNaN(num)) return "0";

  // Nếu là số nguyên thì hiển thị không có phần thập phân
  if (num === Math.floor(num)) {
    return num.toString();
  }

  // Làm tròn đến số chữ số thập phân tối đa và loại bỏ trailing zeros
  const formatted = num.toFixed(maxDecimals);
  return parseFloat(formatted).toString();
};

/**
 * Format số lượng cho hiển thị trong bảng
 * @param {number|string} value - Giá trị số lượng
 * @returns {string} - Số lượng đã được format
 */
export const formatQuantityDisplay = (value) => {
  return formatNumberWithoutTrailingZeros(value, 3);
};
