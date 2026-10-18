import type { Pool } from "mysql2/promise";
import { USAGE_EVENTS, windowStart, type CachedFavicon, type Stores, type UsageEvent } from "./types";

/** Share of rate-limit writes that also sweep expired rows. */
const SWEEP_CHANCE = 0.01;

/**
 * MySQL-backed stores. `ready` resolves once migrations have run; every
 * call waits for it so the first request after a deploy creates the schema.
 */
export function createMysqlStores(pool: Pool, ready: Promise<void>): Stores {
  const query = async <T>(sql: string, params: unknown[] = []): Promise<T> => {
    await ready;
    const [rows] = await pool.query(sql, params);
    return rows as T;
  };

  return {
    kind: "mysql",
    rateLimits: {
      async hit(bucket, windowMs, now = Date.now()) {
        const start = windowStart(now, windowMs);
        // hits is assigned before window_start, so it still sees the old window.
        await query(
          `INSERT INTO rate_limits (bucket, window_start, hits) VALUES (?, ?, 1)
           ON DUPLICATE KEY UPDATE
             hits = IF(window_start = VALUES(window_start), hits + 1, 1),
             window_start = VALUES(window_start)`,
          [bucket, start],
        );
        if (Math.random() < SWEEP_CHANCE) {
          await query("DELETE FROM rate_limits WHERE window_start < ?", [start - windowMs]);
        }
        const rows = await query<{ hits: number }[]>("SELECT hits FROM rate_limits WHERE bucket = ?", [bucket]);
        return rows[0]?.hits ?? 1;
      },
    },
    favicons: {
      async get(site, maxAgeMs, now = Date.now()) {
        const rows = await query<{ source_url: string; mime: string; body: Buffer; fetched_at: number }[]>(
          "SELECT source_url, mime, body, fetched_at FROM favicon_cache WHERE site = ? AND fetched_at >= ?",
          [site, now - maxAgeMs],
        );
        const row = rows[0];
        return row
          ? { source: row.source_url, mime: row.mime, body: row.body, fetchedAt: Number(row.fetched_at) }
          : null;
      },
      async set(site, favicon: CachedFavicon) {
        await query(
          `INSERT INTO favicon_cache (site, source_url, mime, body, fetched_at) VALUES (?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE source_url = VALUES(source_url), mime = VALUES(mime),
             body = VALUES(body), fetched_at = VALUES(fetched_at)`,
          [site, favicon.source, favicon.mime, favicon.body, favicon.fetchedAt],
        );
      },
    },
    usage: {
      async increment(event: UsageEvent) {
        await query(
          "INSERT INTO usage_counters (event, total) VALUES (?, 1) ON DUPLICATE KEY UPDATE total = total + 1",
          [event],
        );
      },
      async totals() {
        const rows = await query<{ event: UsageEvent; total: number }[]>("SELECT event, total FROM usage_counters");
        const totals = Object.fromEntries(USAGE_EVENTS.map((e) => [e, 0])) as Record<UsageEvent, number>;
        for (const row of rows) if (row.event in totals) totals[row.event] = Number(row.total);
        return totals;
      },
    },
  };
}
