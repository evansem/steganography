import { USAGE_EVENTS, windowStart, type CachedFavicon, type Stores, type UsageEvent } from "./types";

const MAX_ENTRIES = 10_000;

/** In-process stores for local development and tests. Lost on restart. */
export function createMemoryStores(): Stores {
  const hits = new Map<string, { start: number; count: number }>();
  const favicons = new Map<string, CachedFavicon>();
  const counters = new Map<UsageEvent, number>();

  return {
    kind: "memory",
    rateLimits: {
      async hit(bucket, windowMs, now = Date.now()) {
        const start = windowStart(now, windowMs);
        if (hits.size > MAX_ENTRIES) {
          for (const [k, v] of hits) if (v.start < start) hits.delete(k);
        }
        const entry = hits.get(bucket);
        const count = entry && entry.start === start ? entry.count + 1 : 1;
        hits.set(bucket, { start, count });
        return count;
      },
    },
    favicons: {
      async get(site, maxAgeMs, now = Date.now()) {
        const entry = favicons.get(site);
        return entry && now - entry.fetchedAt <= maxAgeMs ? entry : null;
      },
      async set(site, favicon) {
        if (favicons.size > MAX_ENTRIES) favicons.clear();
        favicons.set(site, favicon);
      },
    },
    usage: {
      async increment(event) {
        counters.set(event, (counters.get(event) ?? 0) + 1);
      },
      async totals() {
        return Object.fromEntries(USAGE_EVENTS.map((e) => [e, counters.get(e) ?? 0])) as Record<UsageEvent, number>;
      },
    },
  };
}
