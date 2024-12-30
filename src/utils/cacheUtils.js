export const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function isCacheValid(lastFetch) {
  if (!lastFetch) return false;
  return Date.now() - lastFetch < CACHE_DURATION;
}

export async function fetchWithRetry(fn, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
    }
  }
}
