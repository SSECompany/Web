/**
 * Validate và format input số lượng
 * @param {string|number} value - Giá trị input
 * @returns {string|number} - Giá trị đã được validate
 */
export const validateQuantityInput = (value) => {
  // Nếu value là số (number), trả về trực tiếp (từ checkbox)
  if (typeof value === 'number') {
    return value;
  }
  
  let val = String(value); // Convert to string safely

  // Chỉ cho phép số, dấu chấm và dấu phẩy
  val = val.replace(/[^0-9.,]/g, "");

  // Thay thế dấu phẩy bằng dấu chấm
  val = val.replace(/,/g, ".");

  // Đảm bảo chỉ có một dấu chấm thập phân
  const parts = val.split(".");
  if (parts.length > 2) {
    val = parts[0] + "." + parts.slice(1).join("");
  }

  // Giới hạn số chữ số thập phân tối đa là 3
  const finalParts = val.split(".");
  if (finalParts.length === 2 && finalParts[1].length > 3) {
    val = finalParts[0] + "." + finalParts[1].substring(0, 3);
  }

  return val;
};

/**
 * Kiểm tra số lượng có hợp lệ không
 * @param {string|number} value - Giá trị cần kiểm tra
 * @returns {boolean}
 */
export const isValidQuantity = (value) => {
  if (!value || value === "") return true; // Empty is valid
  
  const numValue = parseFloat(value);
  return !isNaN(numValue) && numValue >= 0;
};

/**
 * Parse số lượng từ string
 * @param {string} value - Giá trị string
 * @returns {number|string} - Số hoặc string nếu đang nhập (có dấu chấm cuối)
 */
export const parseQuantity = (value) => {
  if (!value || value === "") return 0;
  
  // Giữ nguyên nếu kết thúc bằng dấu chấm (đang nhập)
  if (value.endsWith(".")) {
    return value;
  }
  
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
};