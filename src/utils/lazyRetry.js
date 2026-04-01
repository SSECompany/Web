
import { lazy } from 'react';

/**
 * Một wrapper cho React.lazy giúp tự động retry khi load chunk bị lỗi (thường do deploy mới)
 * Nếu fail sau số lần retry, sẽ reload trang để lấy manifest mới nhất.
 */
export const lazyRetry = (importFn, retries = 2) => {
  return lazy(async () => {
    try {
      return await importFn();
    } catch (error) {
      // Kiểm tra xem có phải lỗi load chunk không
      const isChunkLoadFailed = error.message && 
        (error.message.includes('Loading chunk') || 
         error.message.includes('Failed to fetch dynamically imported module'));
         
      if (isChunkLoadFailed && retries > 0) {
        console.warn(`Chunk load failed, retrying... (${retries} left)`);
        // Chờ một chút trước khi retry
        await new Promise(resolve => setTimeout(resolve, 1000));
        return lazyRetry(importFn, retries - 1)._result;
      }

      // Nếu vẫn fail, reload toàn bộ trang để lấy version mới nhất từ server
      if (isChunkLoadFailed) {
        console.error('Chunk load failed after retries. Reloading page...');
        window.location.reload();
      }

      throw error;
    }
  });
};
