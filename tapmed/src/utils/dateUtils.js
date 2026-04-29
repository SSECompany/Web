import dayjs from "dayjs";
import "dayjs/locale/vi";

// Thiết lập locale tiếng Việt cho dayjs
dayjs.locale("vi");

/**
 * Định dạng ngày tháng chuẩn
 * @param {Date|string|dayjs.Dayjs} date 
 * @param {string} format 
 * @returns {string}
 */
export const formatDate = (date, format = "DD/MM/YYYY") => {
  if (!date) return "";
  const d = dayjs(date);
  if (!d.isValid()) return "";
  return d.format(format);
};

/**
 * Định dạng ngày giờ chuẩn
 * @param {Date|string|dayjs.Dayjs} date 
 * @param {string} format 
 * @returns {string}
 */
export const formatDateTime = (date, format = "DD/MM/YYYY HH:mm") => {
  return formatDate(date, format);
};

/**
 * Định dạng ngày cho API (thường là MM/DD/YYYY hoặc YYYY-MM-DD)
 * @param {Date|string|dayjs.Dayjs} date 
 * @returns {string}
 */
export const formatDateForApi = (date) => {
  return formatDate(date, "MM/DD/YYYY");
};

/**
 * Định dạng ngày để lưu trữ (SessionStorage/LocalStorage)
 * @param {Date|string|dayjs.Dayjs} date 
 * @returns {string}
 */
export const formatDateForStorage = (date) => {
  return formatDate(date, "YYYY-MM-DD");
};

/**
 * Trả về đối tượng dayjs từ chuỗi ngày tháng
 * @param {string} dateStr 
 * @returns {dayjs.Dayjs}
 */
export const parseDate = (dateStr) => {
  return dayjs(dateStr);
};
