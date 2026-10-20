/** Upper bound on tracked clients before expired entries are pruned. */
const MAX_TRACKED_KEYS = 10_000;

interface RateWindow {
  count: number;
  resetAt: number;
}

/**
 * Fixed-window rate limiter kept in process memory. It is a best-effort
 * guard for a single Node.js instance; a multi-instance deployment would
 * need a shared store.
 */
export function createRateLimiter(limit: number, windowMs: number) {
  const windows = new Map<string, RateWindow>();

  const pruneExpired = (now: number) => {
    for (const [key, window] of windows) if (window.resetAt <= now) windows.delete(key);
  };

  return function allow(key: string, now = Date.now()): boolean {
    if (windows.size > MAX_TRACKED_KEYS) pruneExpired(now);

    const current = windows.get(key);
    if (!current || current.resetAt <= now) {
      windows.set(key, { count: 1, resetAt: now + windowMs });
      return true;
    }
    current.count++;
    return current.count <= limit;
  };
}
