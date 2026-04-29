/**
 * Chạy danh sách task (async functions) với giới hạn số lượng chạy đồng thời.
 * Giúp tránh mở quá nhiều connection (browser thường giới hạn ~6 per domain).
 * @param {Array<() => Promise<any>>} tasks - Mảng các hàm trả về Promise
 * @param {number} limit - Số task chạy đồng thời tối đa (mặc định 3)
 * @returns {Promise<any[]>} - Mảng kết quả theo thứ tự tasks
 */
export const runWithConcurrencyLimit = async (tasks, limit = 3) => {
  const results = new Array(tasks.length);
  let nextIndex = 0;

  const runNext = async () => {
    const index = nextIndex++;
    if (index >= tasks.length) return;
    results[index] = await tasks[index]();
    await runNext();
  };

  const workers = Math.min(limit, tasks.length);
  await Promise.all(Array.from({ length: workers }, () => runNext()));
  return results;
};
