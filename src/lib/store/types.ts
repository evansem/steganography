/**
 * Persistence ports. Route handlers depend on these interfaces only, so the
 * same code runs against MySQL on Hostinger and in memory for local
 * development and tests.
 */
export interface CachedFavicon {
  source: string;
  mime: string;
  body: Buffer;
  fetchedAt: number;
}

export const USAGE_EVENTS = ["hide", "reveal", "favicon"] as const;
export type UsageEvent = (typeof USAGE_EVENTS)[number];

export interface RateLimitStore {
  /** Records a hit and returns the hit count for the current window. */
  hit(bucket: string, windowMs: number, now?: number): Promise<number>;
}

export interface FaviconCache {
  get(site: string, maxAgeMs: number, now?: number): Promise<CachedFavicon | null>;
  set(site: string, favicon: CachedFavicon): Promise<void>;
}

export interface UsageStats {
  increment(event: UsageEvent): Promise<void>;
  totals(): Promise<Record<UsageEvent, number>>;
}

export interface Stores {
  kind: "mysql" | "memory";
  rateLimits: RateLimitStore;
  favicons: FaviconCache;
  usage: UsageStats;
}

export const windowStart = (now: number, windowMs: number) => Math.floor(now / windowMs) * windowMs;
