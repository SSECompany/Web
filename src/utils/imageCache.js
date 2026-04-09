/**
 * Image Caching Utility using CacheStorage API
 */

const CACHE_NAME = 'tapmed-image-cache-v1';

/**
 * Get an image from cache or fetch and store it
 * @param {string} url - Image URL
 * @returns {Promise<string>} - Object URL or original URL
 */
export const getCachedImage = async (url) => {
  if (!url || typeof url !== 'string' || !url.startsWith('http')) {
    return url;
  }

  try {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(url);

    if (cachedResponse) {
      const blob = await cachedResponse.blob();
      return URL.createObjectURL(blob);
    }

    // Not in cache, fetch it
    const response = await fetch(url);
    if (!response.ok) throw new Error('Network response was not ok');

    // Clone response to store in cache
    const responseToCache = response.clone();
    await cache.put(url, responseToCache);

    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error('Failed to cache image:', error);
    return url; // Fallback to original URL
  }
};

/**
 * Clear the image cache
 */
export const clearImageCache = async () => {
  try {
    await caches.delete(CACHE_NAME);
  } catch (error) {
    console.error('Failed to clear cache:', error);
  }
};
